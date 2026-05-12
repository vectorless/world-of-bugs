import Phaser from 'phaser';
import { TILE_SIZE, TILES, isEntityGlyph } from './tiles.js';
import { isWallBroken } from '../state.js';

// Parses a (possibly very large) char grid into Phaser physics groups and
// entity spawn lists. The whole game runs in one Room — there are no
// transitions, just a single big interconnected world.

export class Room {
  constructor(scene, def) {
    this.scene = scene;
    this.def = def;
    this.id = def.id;
    this.widthTiles = def.width;
    this.heightTiles = def.height;
    this.pixelWidth = def.width * TILE_SIZE;
    this.pixelHeight = def.height * TILE_SIZE;

    this.solids = scene.physics.add.staticGroup();
    this.crumbles = scene.physics.add.staticGroup();
    this.spikes = scene.physics.add.staticGroup();
    this.bouncy = scene.physics.add.staticGroup();
    this.tileImages = [];

    // Fast O(1) tile lookup, used by enemy ledge detection.
    this.solidGrid = new Set();

    this.playerSpawn = null;
    this.enemySpawns = [];   // { type, x, y, gx, gy }
    this.pickupSpawns = [];  // { type, x, y, gx, gy, entityId }
    this.benches = [];       // array of { x, y } — each F glyph adds one
    this.shopSpawn = null;   // { x, y } — placed once per world

    this.parseGrid();
  }

  parseGrid() {
    const { grid } = this.def;
    const registry = this.scene.registry;

    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;

        const px = x * TILE_SIZE + TILE_SIZE / 2;
        const py = y * TILE_SIZE + TILE_SIZE / 2;

        const tile = TILES[ch];
        if (tile) {
          if (tile.kind === 'crumble' && isWallBroken(registry, x, y)) continue;
          this.placeTile(tile, x, y, px, py);
          continue;
        }

        if (!isEntityGlyph(ch)) continue;

        if (ch === 'P') {
          this.playerSpawn = { x: px, y: py };
        } else if (ch === 'F') {
          this.benches.push({ x: px, y: py });
        } else if (ch === 'S') {
          this.shopSpawn = { x: px, y: py };
        } else if (ch === 'a' || ch === 's' || ch === 'j' || ch === 'W') {
          const type = { a: 'ant', s: 'snail', j: 'springtail', W: 'waspQueen' }[ch];
          this.enemySpawns.push({ type, x: px, y: py, gx: x, gy: y });
        } else if (ch === 'o' || ch === 'n' || ch === 'w' || ch === 'b') {
          const type = { o: 'pollen', n: 'nectar', w: 'wings', b: 'bash' }[ch];
          const entityId = `${type}_${x}_${y}`;
          this.pickupSpawns.push({ type, x: px, y: py, gx: x, gy: y, entityId });
        }
      }
    }
  }

  placeTile(tile, gx, gy, px, py) {
    if (tile.kind === 'crumble') {
      const image = this.scene.add.image(px, py, tile.texture);
      image.setDisplaySize(TILE_SIZE, TILE_SIZE);
      this.tileImages.push(image);
      const body = this.crumbles.create(px, py, tile.texture);
      body.setDisplaySize(TILE_SIZE, TILE_SIZE).setVisible(false).refreshBody();
      body.setData('grid', { x: gx, y: gy });
      body.visibleImage = image;
      return;
    }

    if (tile.kind === 'bouncy') {
      const image = this.scene.add.image(px, py, tile.texture);
      image.setDisplaySize(TILE_SIZE, TILE_SIZE);
      this.tileImages.push(image);
      const body = this.bouncy.create(px, py, tile.texture);
      body.setDisplaySize(TILE_SIZE, TILE_SIZE).setVisible(false).refreshBody();
      body.bounceVelocity = tile.bounce ?? 800;
      return;
    }

    if (tile.kind === 'spike') {
      // Solid floor that hurts on touch. Render thin spike on top half of tile.
      const image = this.scene.add.image(px, py + 8, tile.texture);
      image.setDisplaySize(TILE_SIZE, 16);
      this.tileImages.push(image);
      const body = this.spikes.create(px, py, tile.texture);
      body.setDisplaySize(TILE_SIZE, TILE_SIZE).setVisible(false).refreshBody();
      this.solidGrid.add(`${gx},${gy}`);
      return;
    }

    // Default: plain solid
    const image = this.scene.add.image(px, py, tile.texture);
    image.setDisplaySize(TILE_SIZE, TILE_SIZE);
    this.tileImages.push(image);
    const body = this.solids.create(px, py, tile.texture);
    body.setDisplaySize(TILE_SIZE, TILE_SIZE).setVisible(false).refreshBody();
    this.solidGrid.add(`${gx},${gy}`);
  }

  destroyCrumbleAt(gx, gy) {
    let removed = false;
    this.crumbles.getChildren().slice().forEach(child => {
      const g = child.getData('grid');
      if (g && g.x === gx && g.y === gy) {
        if (child.visibleImage) child.visibleImage.destroy();
        child.destroy();
        removed = true;
      }
    });
    return removed;
  }

  hasSolidAtTile(gx, gy) {
    return this.solidGrid.has(`${gx},${gy}`);
  }

  destroy() {
    this.tileImages.forEach(img => img.destroy());
    this.solids.destroy(true);
    this.crumbles.destroy(true);
    this.spikes.destroy(true);
    this.bouncy.destroy(true);
  }
}
