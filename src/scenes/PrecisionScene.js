import Phaser from 'phaser';
import { PRECISION_LEVELS } from '../data/precisionLevels.js';
import { Room } from '../world/Room.js';
import { TILE_SIZE } from '../world/tiles.js';
import { BeetleController } from '../controllers/BeetleController.js';
import { getSounds } from '../audio/sound.js';

// Stand-alone precision-platformer mode: 10 short levels of static
// platforms + lots of spikes. One-hit deaths, instant respawn. Wall
// jump + double jump are available so vertical climbs and air-time
// shenanigans work; no dash, no smash.

export class PrecisionScene extends Phaser.Scene {
  constructor() { super('PrecisionScene'); }

  init() {
    this.levelIdx = 0;
    this.deaths = 0;
  }

  create() {
    // Bright "tiny platformer" sky-blue background instead of the
    // adventure-mode dark underground.
    this.cameras.main.setBackgroundColor(0x6abedf);

    this.keys = this.input.keyboard.addKeys({
      left:  'LEFT', right: 'RIGHT',
      a:     'A',    d:     'D',
      jump:  'SPACE',
      w:     'W',
      pause: 'ESC',
    });
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('TitleScene'));

    // Override the adventure abilities/health for this mode — give wall
    // jump + double jump so the levels can use vertical climbs, and one
    // hit kills (precision platformers shouldn't have a health bar).
    this.registry.set('abilities', new Set(['wallJump', 'doubleJump']));
    this.registry.set('maxHealth', 1);
    this.registry.set('health', 1);

    this.prevTouch = { jump: false };

    // HUD overlay (scrollFactor 0 so it sticks to the camera)
    this.levelLabel = this.add.text(20, 18, '', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(100);
    this.deathsLabel = this.add.text(20, 46, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffe060',
      stroke: '#000000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(100);
    this.hintLabel = this.add.text(20, 68, 'ESC to quit', {
      fontFamily: 'monospace', fontSize: '11px', color: '#cceeff',
      stroke: '#000000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(100);

    this.loadLevel();
  }

  loadLevel() {
    if (this.room) { this.room.destroy(); this.room = null; }
    if (this.player) { this.player.destroy(); this.player = null; }
    if (this.goal) { this.goal.destroy(); this.goal = null; }

    const def = PRECISION_LEVELS[this.levelIdx];
    this.room = new Room(this, def);

    const spawn = this.room.playerSpawn ?? { x: 64, y: 64 };
    this.player = this.physics.add.sprite(spawn.x, spawn.y, 'beetle');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(20, 16);
    this.beetle = new BeetleController(this, this.player);

    this.physics.world.setBounds(0, 0, this.room.pixelWidth, this.room.pixelHeight);
    this.physics.add.collider(this.player, this.room.solids);
    this.physics.add.overlap(this.player, this.room.spikes, () => this.die(), null, this);

    // Goal — search the grid for 'G' and place a green flag rectangle there
    const goalPos = this.findGoal(def);
    if (goalPos) {
      this.goal = this.add.rectangle(goalPos.x, goalPos.y, 22, 28, 0x60ff80)
        .setStrokeStyle(2, 0xffffff);
      this.physics.add.existing(this.goal, true);
      this.tweens.add({ targets: this.goal, scale: 1.1, yoyo: true, repeat: -1, duration: 500 });
      this.physics.add.overlap(this.player, this.goal, () => this.completeLevel(), null, this);
    }

    // Camera follow + zoom for that close-up precision feel
    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.18, 0.18);
    cam.setBounds(0, 0, this.room.pixelWidth, this.room.pixelHeight);
    cam.setZoom(2);

    this.refreshLabels();
  }

  findGoal(def) {
    for (let y = 0; y < def.grid.length; y++) {
      const row = def.grid[y];
      for (let x = 0; x < row.length; x++) {
        if (row[x] === 'G') {
          return {
            x: x * TILE_SIZE + TILE_SIZE / 2,
            y: y * TILE_SIZE + TILE_SIZE / 2,
          };
        }
      }
    }
    return null;
  }

  refreshLabels() {
    this.levelLabel.setText(`Level ${this.levelIdx + 1} / ${PRECISION_LEVELS.length}`);
    this.deathsLabel.setText(`Deaths: ${this.deaths}`);
  }

  die() {
    this.deaths++;
    this.refreshLabels();
    this.cameras.main.flash(120, 255, 80, 80);
    const spawn = this.room.playerSpawn ?? { x: 64, y: 64 };
    this.player.body.reset(spawn.x, spawn.y);
    this.player.body.setVelocity(0, 0);
    this.beetle.smashing = false;
    this.beetle.smashLandingFreeze = 0;
    this.beetle.iframes = 200;
  }

  completeLevel() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.flash(220, 120, 255, 120);

    this.time.delayedCall(280, () => {
      this.levelIdx++;
      this.transitioning = false;
      if (this.levelIdx >= PRECISION_LEVELS.length) {
        this.showVictory();
        return;
      }
      this.loadLevel();
    });
  }

  showVictory() {
    if (this.player) this.player.setVisible(false);
    const cam = this.cameras.main;
    const cx = cam.scrollX + this.scale.width / 2;
    const cy = cam.scrollY + this.scale.height / 2;
    this.add.text(cx, cy - 30, 'PRECISION COMPLETE!', {
      fontFamily: 'monospace', fontSize: '32px', color: '#ffe060',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0);
    this.add.text(cx, cy + 10, `Total deaths: ${this.deaths}`, {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0);
    this.add.text(cx, cy + 50, 'Press ESC to return to title', {
      fontFamily: 'monospace', fontSize: '14px', color: '#cceeff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0);
  }

  update(time, delta) {
    if (!this.player || !this.beetle || this.transitioning) return;

    const t = this.registry.get('touchInput') ?? {};
    const jumpKeyDown = Phaser.Input.Keyboard.JustDown(this.keys.jump)
      || Phaser.Input.Keyboard.JustDown(this.keys.w);
    const touchJumpJust = t.jump && !this.prevTouch.jump;
    this.prevTouch.jump = !!t.jump;

    const input = {
      left:  this.keys.left.isDown  || this.keys.a.isDown || !!t.left,
      right: this.keys.right.isDown || this.keys.d.isDown || !!t.right,
      down:  false,
      jumpPressed: jumpKeyDown || touchJumpJust,
      jumpHeld:    this.keys.jump.isDown || this.keys.w.isDown || !!t.jump,
      dashPressed: false,
      smashPressed: false,
      sprint:      false,
    };
    this.beetle.update(delta, input);

    if (this.player.y > this.room.pixelHeight + 80) this.die();
  }
}
