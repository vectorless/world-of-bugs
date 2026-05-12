import Phaser from 'phaser';
import { WORLD } from '../data/rooms.js';
import { ABILITIES } from '../data/abilities.js';
import { ENEMIES } from '../data/enemies.js';
import { PICKUPS } from '../data/collectibles.js';
import { Room } from '../world/Room.js';
import { TILE_SIZE } from '../world/tiles.js';
import { BeetleController } from '../controllers/BeetleController.js';
import { CameraController } from '../controllers/CameraController.js';
import {
  takeDamage, heal, refillHealth, collectPollen, unlockAbility,
  markCollected, isCollected, markWallBroken,
  setCheckpoint, getCheckpoint, respawn, markExplored,
} from '../state.js';

// Radius (in tiles) of the fog-of-war reveal around the player each frame.
const EXPLORE_RADIUS = 7;

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    // Dark underground backdrop — the whole game has a tunnel vibe.
    this.cameras.main.setBackgroundColor(0x110d08);

    this.keys = this.input.keyboard.addKeys({
      left:   'LEFT',  right: 'RIGHT',
      a:      'A',     d:     'D',
      jump:   'SPACE',
      w:      'W',     // alt jump
      down:   'DOWN',  // ground smash (mid-air)
      s:      'S',     // alt ground smash
      dash:   'X',
      map:    'M',
      pause:  'ESC',
      sprint: 'SHIFT',
    });

    this.input.keyboard.on('keydown-ESC', () => this.openPause());
    this.input.keyboard.on('keydown-M', () => this.openMap());

    // Edge-detection state for touch buttons (so we can synthesize JustDown)
    this.prevTouch = { jump: false, dash: false, smash: false };

    this.loadWorld();
  }

  loadWorld() {
    this.room = new Room(this, WORLD);

    // Spawn at checkpoint if we have one, else world spawn.
    const cp = getCheckpoint(this.registry);
    const spawn = cp ?? this.room.playerSpawn ?? { x: TILE_SIZE * 2, y: TILE_SIZE * 2 };

    this.player = this.physics.add.sprite(spawn.x, spawn.y, 'beetle');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(20, 16);
    this.beetle = new BeetleController(this, this.player);

    // Spawn enemies (skip the defeated boss if already won)
    this.enemies = [];
    for (const spec of this.room.enemySpawns) {
      if (spec.type === 'waspQueen' && isCollected(this.registry, 'boss_defeated')) continue;
      this.enemies.push(this.spawnEnemy(spec));
    }

    // Spawn pickups (skip already collected)
    this.pickups = [];
    for (const spec of this.room.pickupSpawns) {
      if (isCollected(this.registry, spec.entityId)) continue;
      this.pickups.push(this.spawnPickup(spec));
    }

    // Bench markers (HK-style rest spots) — one FX per bench.
    this.benchTouchedKey = null;
    for (const cp of this.room.benches) {
      const seat = this.add.image(cp.x, cp.y + 6, 'tile_bench');
      seat.setDepth(-1);
      const glow = this.add.rectangle(cp.x, cp.y - 2, 22, 30, 0xffe060, 0.35);
      this.tweens.add({ targets: glow, alpha: 0.12, yoyo: true, repeat: -1, duration: 700 });
    }

    // Shop stall (one per world). Pure visual + distance trigger — we don't
    // need physics for this since the overlap is checked per frame.
    this.shopCooldown = 0;
    this.shop = null;
    if (this.room.shopSpawn) {
      const sx = this.room.shopSpawn.x;
      const sy = this.room.shopSpawn.y - 2;
      const stall = this.add.image(sx, sy, 'shop_stall');
      const sign = this.add.text(sx, sy - 28, 'SHOP', {
        fontFamily: 'monospace', fontSize: '10px', color: '#ffe060',
      }).setOrigin(0.5);
      this.tweens.add({ targets: sign, y: sy - 32, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });
      this.shop = { sprite: stall, sign, x: sx, y: sy };
    }

    // Colliders
    this.physics.world.setBounds(0, 0, this.room.pixelWidth, this.room.pixelHeight);
    this.physics.add.collider(this.player, this.room.solids);
    this.physics.add.collider(
      this.player, this.room.crumbles,
      null,
      (player, crumble) => this.onCrumbleProcess(player, crumble),
      this,
    );
    this.physics.add.collider(this.player, this.room.bouncy, this.onBouncyHit, null, this);
    this.physics.add.overlap(this.player, this.room.spikes, this.onSpikeOverlap, null, this);
    this.physics.add.collider(
      this.player, this.room.smashBlocks,
      null,
      (player, block) => this.onSmashBlockProcess(player, block),
      this,
    );

    for (const enemy of this.enemies) {
      this.physics.add.collider(enemy.sprite, this.room.solids);
      this.physics.add.collider(enemy.sprite, this.room.crumbles);
      this.physics.add.overlap(this.player, enemy.sprite, () => this.onEnemyOverlap(enemy), null, this);
    }
    for (const pickup of this.pickups) {
      this.physics.add.overlap(this.player, pickup.sprite, () => this.onPickupOverlap(pickup), null, this);
    }

    // Smooth camera follow — lerp slowly for a deliberate "tunnel" feel
    this.cam = new CameraController(this, this.player);
    this.cam.setBounds(this.room.pixelWidth, this.room.pixelHeight);
  }

  spawnEnemy(spec) {
    const def = ENEMIES[spec.type];
    const sprite = this.physics.add.sprite(spec.x, spec.y, def.texture);
    sprite.setCollideWorldBounds(false);
    sprite.body.setSize(sprite.width - 2, sprite.height - 2);
    return {
      type: spec.type,
      def,
      sprite,
      ai: this.makeAi(spec.type, sprite, def),
      hp: def.hp,
      alive: true,
      hitCooldown: 0,
    };
  }

  makeAi(type, sprite, def) {
    if (def.ai === 'patrol') {
      sprite.setVelocityX(def.speed);
      return {
        kind: 'patrol',
        update: (delta) => {
          const body = sprite.body;
          const goingRight = body.velocity.x > 0;
          if (body.blocked.right || body.touching.right) sprite.setVelocityX(-def.speed);
          else if (body.blocked.left || body.touching.left) sprite.setVelocityX(def.speed);
          else if (body.onFloor()) {
            // Ledge detection via solidGrid lookup
            const tx = Math.floor((sprite.x + (goingRight ? sprite.width / 2 + 4 : -sprite.width / 2 - 4)) / TILE_SIZE);
            const ty = Math.floor((sprite.y + sprite.height / 2 + 8) / TILE_SIZE);
            if (!this.room.hasSolidAtTile(tx, ty)) {
              sprite.setVelocityX(goingRight ? -def.speed : def.speed);
            }
          }
        },
      };
    }
    if (def.ai === 'armored') {
      sprite.setVelocityX(def.speed);
      return {
        kind: 'armored',
        update: (delta) => {
          const body = sprite.body;
          if (body.blocked.right || body.touching.right) sprite.setVelocityX(-def.speed);
          else if (body.blocked.left || body.touching.left) sprite.setVelocityX(def.speed);
        },
      };
    }
    if (def.ai === 'leaper') {
      let cooldown = 0;
      return {
        kind: 'leaper',
        update: (delta) => {
          cooldown = Math.max(0, cooldown - delta);
          const body = sprite.body;
          if (cooldown === 0 && body.onFloor() && this.player) {
            const dx = this.player.x - sprite.x;
            const dy = this.player.y - sprite.y;
            const dist = Math.hypot(dx, dy);
            if (dist < def.leapRange) {
              const dir = Math.sign(dx) || 1;
              sprite.setVelocity(dir * 180, -380);
              cooldown = def.leapCooldownMs;
            }
          }
        },
      };
    }
    if (def.ai === 'boss') {
      return this.makeWaspAi(sprite, def);
    }
    return { kind: 'none', update: () => {} };
  }

  makeWaspAi(sprite, def) {
    sprite.body.setAllowGravity(false);
    sprite.body.setSize(sprite.width - 4, sprite.height - 4);
    const homeX = sprite.x;
    const homeY = sprite.y;
    const state = { phase: 0, timer: 1500, diveTarget: null, hits: 0 };
    return {
      kind: 'boss',
      state,
      update: (delta) => {
        const body = sprite.body;
        state.timer -= delta;

        if (state.phase === 0) {
          const t = this.time.now * 0.003;
          body.setVelocity((homeX - sprite.x) * 2 + Math.sin(t) * 30, (homeY - sprite.y) * 2 + Math.cos(t * 1.3) * 20);
          if (state.timer <= 0) {
            state.phase = 1; state.timer = 950;       // longer telegraph (reaction time)
            sprite.setTint(0xffff80);
            state.diveTarget = { x: this.player.x, y: this.player.y };
          }
        } else if (state.phase === 1) {
          body.setVelocity((state.diveTarget.x - sprite.x) * 3, (homeY - sprite.y) * 2);
          if (state.timer <= 0) {
            state.phase = 2; state.timer = 900;
            sprite.clearTint(); sprite.setTint(0x60a0ff);   // blue dive — no red on the queen
            body.setAllowGravity(true);
            body.setVelocity(0, 620);                // slightly slower dive
          }
        } else if (state.phase === 2) {
          if (body.onFloor() || state.timer <= 0) {
            state.phase = 3; state.timer = 1500;     // longer expose — more time to bash
            body.setAllowGravity(false);
            body.setVelocity(0, 0);
            sprite.clearTint(); sprite.setTint(0x88ff88);
          }
        } else if (state.phase === 3) {
          body.setVelocity(0, 0);
          if (state.timer <= 0) {
            state.phase = 0;
            state.timer = Math.max(1100, 2200 - state.hits * 300);  // longer hover between dives
            sprite.clearTint();
            body.setAllowGravity(false);
          }
        }
      },
    };
  }

  spawnPickup(spec) {
    const def = PICKUPS[spec.type];
    const sprite = this.physics.add.sprite(spec.x, spec.y, def.texture);
    sprite.body.setAllowGravity(false);
    sprite.body.setImmovable(true);
    this.tweens.add({ targets: sprite, y: spec.y - 4, yoyo: true, repeat: -1, duration: 800, ease: 'Sine.easeInOut' });
    return { type: spec.type, def, sprite, entityId: spec.entityId };
  }

  // --- Physics callbacks ---

  onCrumbleProcess(player, crumble) {
    if (this.beetle.isDashing()) {
      const g = crumble.getData('grid');
      if (g) {
        markWallBroken(this.registry, g.x, g.y);
        this.room.destroyCrumbleAt(g.x, g.y);
      }
      return false;
    }
    return true;
  }

  onSmashBlockProcess(player, block) {
    // Player tearing down through a smash-floor — destroy it, no collision.
    if (this.beetle.isSmashing()) {
      const g = block.getData('grid');
      if (g) {
        markWallBroken(this.registry, g.x, g.y);
        this.room.destroySmashBlockAt(g.x, g.y);
      }
      return false;
    }
    return true;
  }

  onSmashLanding() {
    // Sweep through any smash-blocks adjacent to where the player landed,
    // so a corner landing still cracks the surrounding floor.
    const tx = Math.floor(this.player.x / TILE_SIZE);
    const ty = Math.floor((this.player.y + 16) / TILE_SIZE);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = 0; dy <= 2; dy++) {
        const x = tx + dx, y = ty + dy;
        this.room.smashBlocks.getChildren().slice().forEach(child => {
          const g = child.getData('grid');
          if (g && g.x === x && g.y === y) {
            markWallBroken(this.registry, g.x, g.y);
            this.room.destroySmashBlockAt(g.x, g.y);
          }
        });
      }
    }
  }

  onBouncyHit(player, mushroom) {
    if (player.body.touching.down || player.body.blocked.down) {
      player.body.setVelocityY(-(mushroom.bounceVelocity ?? 800));
      this.beetle.doubleJumpUsed = false;
    }
  }

  onSpikeOverlap(player, spike) {
    if (this.beetle.takeHit(spike.x)) {
      const h = takeDamage(this.registry, 1);
      if (h <= 0) this.killPlayer();
    }
  }

  onEnemyOverlap(enemy) {
    if (!enemy.alive) return;
    if (enemy.hitCooldown > 0) return;

    if (this.beetle.isDashing()) {
      enemy.hitCooldown = 280;
      if (enemy.def.requiresBash) {
        enemy.hp -= 1;
        if (enemy.def.ai === 'boss') {
          this.flashSpriteHit(enemy.sprite);
          enemy.ai.state.hits = (enemy.ai.state.hits ?? 0) + 1;
          enemy.ai.state.phase = 0;
          enemy.ai.state.timer = 600;
          enemy.sprite.clearTint();
          enemy.sprite.body.setAllowGravity(false);
        }
        if (enemy.hp <= 0) {
          this.defeatEnemy(enemy);
          if (enemy.def.ai === 'boss') {
            if (enemy.type === 'waspQueen') {
              markCollected(this.registry, 'queen_defeated');
              this.openBurrowsPath();
            } else if (enemy.type === 'burrowerQueen') {
              markCollected(this.registry, 'burrower_defeated');
              this.win();
            }
          }
        }
        return;
      }
      this.defeatEnemy(enemy);
      return;
    }

    if (enemy.def.requiresBash) {
      if (this.beetle.takeHit(enemy.sprite.x)) {
        const h = takeDamage(this.registry, enemy.def.contactDamage);
        if (h <= 0) this.killPlayer();
      }
      return;
    }

    if (this.beetle.takeHit(enemy.sprite.x)) {
      const h = takeDamage(this.registry, enemy.def.contactDamage);
      if (h <= 0) this.killPlayer();
      this.defeatEnemy(enemy);
    }
  }

  flashSpriteHit(sprite) {
    sprite.setTint(0xffffff);
    this.time.delayedCall(120, () => sprite.clearTint());
  }

  defeatEnemy(enemy) {
    enemy.alive = false;
    this.tweens.add({
      targets: enemy.sprite, alpha: 0, duration: 200,
      onComplete: () => enemy.sprite.destroy(),
    });
  }

  onPickupOverlap(pickup) {
    if (!pickup.sprite.active) return;
    const eff = pickup.def.effect;
    if (eff === 'pollen') {
      collectPollen(this.registry, pickup.def.amount);
    } else if (eff === 'heal') {
      heal(this.registry, pickup.def.amount);
    } else if (eff === 'ability') {
      unlockAbility(this.registry, pickup.def.ability);
      this.flashAbilityBanner(pickup.def.ability);
    }
    markCollected(this.registry, pickup.entityId);
    pickup.sprite.destroy();
  }

  flashAbilityBanner(abilityId) {
    const def = ABILITIES[abilityId];
    if (!def) return;
    const cam = this.cameras.main;
    const banner = this.add.container(cam.width / 2, cam.height / 2).setScrollFactor(0).setDepth(1000);
    const bg = this.add.rectangle(0, 0, 420, 90, 0x000000, 0.75).setStrokeStyle(2, 0xe8d890);
    const title = this.add.text(0, -18, def.name, { fontFamily: 'monospace', fontSize: '22px', color: '#ffe060' }).setOrigin(0.5);
    const blurb = this.add.text(0, 18, def.blurb, { fontFamily: 'monospace', fontSize: '13px', color: '#cccccc' }).setOrigin(0.5);
    banner.add([bg, title, blurb]);
    this.tweens.add({ targets: banner, alpha: { from: 0, to: 1 }, duration: 200, hold: 1800, yoyo: true, onComplete: () => banner.destroy() });
  }

  killPlayer() {
    this.beetle.killForRespawn();
    this.cameras.main.flash(300, 200, 30, 30);
    this.time.delayedCall(700, () => {
      respawn(this.registry);
      const cp = getCheckpoint(this.registry);
      const spawn = cp ?? this.room.playerSpawn;
      this.beetle.revive(spawn.x, spawn.y);
      this.cameras.main.centerOn(spawn.x, spawn.y);
    });
  }

  win() {
    this.registry.set('won', true);
    this.scene.launch('WinScene', { pollen: this.registry.get('pollen') });
    this.scene.pause();
  }

  // Wasp Queen defeat: collapse the smash-block barrier in the Crystal
  // Caverns floor (west side), opening the descent into the Burrows for
  // the second boss.
  openBurrowsPath() {
    for (let x = 4; x <= 7; x++) {
      if (this.room.destroySmashBlockAt(x, 78)) {
        markWallBroken(this.registry, x, 78);
      }
    }
    this.cameras.main.shake(420, 0.018);
  }

  // Public methods called by the on-screen pause/map buttons in HudScene.
  // Idempotent — if a paused overlay is already active they do nothing.
  openPause() {
    if (!this.scene.isActive('GameScene')) return;
    this.scene.pause();
    this.scene.launch('PauseScene');
  }

  openShop() {
    if (!this.scene.isActive('GameScene')) return;
    this.shopCooldown = 9999;   // freeze re-open until ShopScene resets it
    this.scene.pause();
    this.scene.launch('ShopScene');
  }

  openMap() {
    if (!this.scene.isActive('GameScene')) return;
    if (!this.player) return;
    this.scene.pause();
    this.scene.launch('MapScene', {
      world: WORLD,
      playerTile: {
        x: Math.floor(this.player.x / TILE_SIZE),
        y: Math.floor(this.player.y / TILE_SIZE),
      },
    });
  }

  // --- update loop ---

  update(time, delta) {
    if (!this.player || !this.beetle) return;

    const t = this.registry.get('touchInput') ?? {};
    const jumpKeyDown = Phaser.Input.Keyboard.JustDown(this.keys.jump) || Phaser.Input.Keyboard.JustDown(this.keys.w);
    const dashKeyDown = Phaser.Input.Keyboard.JustDown(this.keys.dash);
    const smashKeyDown = Phaser.Input.Keyboard.JustDown(this.keys.down) || Phaser.Input.Keyboard.JustDown(this.keys.s);
    const touchJumpJust = t.jump && !this.prevTouch.jump;
    const touchDashJust = t.dash && !this.prevTouch.dash;
    const touchSmashJust = t.smash && !this.prevTouch.smash;
    this.prevTouch.jump = !!t.jump;
    this.prevTouch.dash = !!t.dash;
    this.prevTouch.smash = !!t.smash;

    const input = {
      left:  this.keys.left.isDown  || this.keys.a.isDown || !!t.left,
      right: this.keys.right.isDown || this.keys.d.isDown || !!t.right,
      down:  this.keys.down.isDown  || this.keys.s.isDown || !!t.smash,
      jumpPressed: jumpKeyDown || touchJumpJust,
      jumpHeld:    this.keys.jump.isDown || this.keys.w.isDown || !!t.jump,
      dashPressed: dashKeyDown || touchDashJust,
      smashPressed: smashKeyDown || touchSmashJust,
      sprint:      this.keys.sprint.isDown || !!t.sprint,
    };
    this.beetle.update(delta, input);

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (enemy.hitCooldown > 0) enemy.hitCooldown = Math.max(0, enemy.hitCooldown - delta);
      enemy.ai.update(delta);
    }

    // Reveal fog of war in a radius around the player
    const px = Math.floor(this.player.x / TILE_SIZE);
    const py = Math.floor(this.player.y / TILE_SIZE);
    for (let dy = -EXPLORE_RADIUS; dy <= EXPLORE_RADIUS; dy++) {
      for (let dx = -EXPLORE_RADIUS; dx <= EXPLORE_RADIUS; dx++) {
        if (dx * dx + dy * dy > EXPLORE_RADIUS * EXPLORE_RADIUS) continue;
        const tx = px + dx, ty = py + dy;
        if (tx < 0 || ty < 0 || tx >= this.room.widthTiles || ty >= this.room.heightTiles) continue;
        markExplored(this.registry, tx, ty);
      }
    }

    // Bench check — find the nearest bench within range. On first contact
    // with a bench, refill HP and set it as the active checkpoint. Heals
    // only once per visit so the player can't sit on it for infinite HP.
    let nowOnBench = null;
    for (const cp of this.room.benches) {
      if (Math.abs(this.player.x - cp.x) < 24 && Math.abs(this.player.y - cp.y) < 24) {
        nowOnBench = `${cp.x},${cp.y}`;
        setCheckpoint(this.registry, cp.x, cp.y);
        break;
      }
    }
    if (nowOnBench && nowOnBench !== this.benchTouchedKey) {
      refillHealth(this.registry);
    }
    this.benchTouchedKey = nowOnBench;

    // Shop trigger — overlap opens the shop scene. Cooldown after close
    // prevents the player from immediately re-opening it.
    if (this.shopCooldown > 0) this.shopCooldown = Math.max(0, this.shopCooldown - delta);
    if (this.shop && this.shopCooldown === 0) {
      const dx = this.player.x - this.shop.x;
      const dy = this.player.y - this.shop.y;
      if (Math.abs(dx) < 26 && Math.abs(dy) < 32) {
        this.openShop();
      }
    }

    // Fall-off-map death
    if (this.player.y > this.room.pixelHeight + 200) {
      const h = takeDamage(this.registry, 99);
      if (h <= 0) this.killPlayer();
    }
  }
}
