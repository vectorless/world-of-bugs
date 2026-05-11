import Phaser from 'phaser';

// Overlay scene that shows the world map with everything the player has
// explored revealed (fog-of-war reveal). Launched on M from GameScene.

export class MapScene extends Phaser.Scene {
  constructor() { super('MapScene'); }

  init(data) {
    this.world = data.world;
    this.playerTile = data.playerTile;
  }

  create() {
    const { width: sw, height: sh } = this.scale;
    // Dim the gameplay underneath
    this.add.rectangle(0, 0, sw, sh, 0x000000, 0.82).setOrigin(0);

    // Compute mini-tile size so the map fits comfortably on screen
    const px = Math.max(3, Math.floor(Math.min(
      (sw - 120) / this.world.width,
      (sh - 160) / this.world.height,
    )));
    const mapW = this.world.width * px;
    const mapH = this.world.height * px;
    const offX = Math.floor((sw - mapW) / 2);
    const offY = Math.floor((sh - mapH) / 2) + 10;

    // Frame
    const frame = this.add.graphics();
    frame.fillStyle(0x000000, 0.9);
    frame.fillRect(offX - 6, offY - 6, mapW + 12, mapH + 12);
    frame.lineStyle(2, 0xe8d890, 1);
    frame.strokeRect(offX - 6, offY - 6, mapW + 12, mapH + 12);

    // Tiles
    const explored = this.registry.get('explored') ?? new Set();
    const collected = this.registry.get('collected') ?? new Set();
    const brokenWalls = this.registry.get('brokenWalls') ?? new Set();
    const tiles = this.add.graphics();

    for (let y = 0; y < this.world.height; y++) {
      const row = this.world.grid[y];
      for (let x = 0; x < this.world.width; x++) {
        if (!explored.has(`${x},${y}`)) continue;
        let ch = row?.[x] ?? '.';
        // Hide collected pickups + broken crumbles
        if ('owbn'.includes(ch)) {
          const type = { o: 'pollen', n: 'nectar', w: 'wings', b: 'bash' }[ch];
          if (collected.has(`${type}_${x}_${y}`)) ch = '.';
        }
        if (ch === 'C' && brokenWalls.has(`${x},${y}`)) ch = '.';

        const color = tileColor(ch);
        tiles.fillStyle(color, 1);
        tiles.fillRect(offX + x * px, offY + y * px, px, px);
      }
    }

    // Player marker (bright pulsing dot)
    const dot = this.add.circle(
      offX + this.playerTile.x * px + px / 2,
      offY + this.playerTile.y * px + px / 2,
      Math.max(3, px),
      0x80e0ff,
    );
    this.tweens.add({ targets: dot, scale: { from: 1, to: 1.6 }, yoyo: true, repeat: -1, duration: 500 });

    // Titles + footer
    this.add.text(sw / 2, 30, 'WORLD MAP', {
      fontFamily: 'monospace', fontSize: '22px', color: '#e8d890',
    }).setOrigin(0.5);

    this.add.text(sw / 2, sh - 26, 'Tap or press M/ESC to return', {
      fontFamily: 'monospace', fontSize: '13px', color: '#9aa090',
    }).setOrigin(0.5);

    // Stats line
    const pollen = this.registry.get('pollen') ?? 0;
    const abilities = this.registry.get('abilities') ?? new Set();
    const abilityLabel = abilities.size ? Array.from(abilities).join(' · ') : 'none';
    this.add.text(sw / 2, 56, `Pollen ${pollen}   Abilities: ${abilityLabel}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#9aa090',
    }).setOrigin(0.5);

    const close = () => {
      // Clear latched touch-button state so the dismissing tap doesn't
      // leave a HUD button stuck "on" after the map closes.
      const touch = this.registry.get('touchInput');
      if (touch) {
        touch.left = touch.right = false;
        touch.jump = touch.dash = touch.sprint = false;
      }
      this.scene.stop();
      this.scene.resume('GameScene');
    };
    this.input.keyboard.on('keydown-M', close);
    this.input.keyboard.on('keydown-ESC', close);
    this.input.once('pointerdown', close);
  }
}

function tileColor(ch) {
  switch (ch) {
    case '#': return 0x4a3a26;
    case 'g': return 0x3a6a2a;
    case 'd': return 0x5a3a20;
    case '~': return 0xc26a8a;
    case '*': return 0xcc4444;
    case 'T': return 0x2a3a1a;
    case 'C': return 0x8a5a3a;
    case 'w': return 0x80e0ff;   // wings — bright cyan
    case 'b': return 0xff8040;   // bash — orange
    case 'o': return 0xffe060;   // pollen — yellow
    case 'n': return 0xff70a0;   // nectar — pink
    case 'F': return 0xffe060;   // checkpoint — yellow
    case 'W': return 0xff4040;   // boss — red
    case '.': return 0x1a1a1a;   // explored empty
    default:  return 0x1a1a1a;
  }
}
