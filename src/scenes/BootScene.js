import Phaser from 'phaser';

// Generates all placeholder textures procedurally so we have zero asset files
// in the v0.1 prototype. Each texture is a tiny colored rect; sprites scale.
export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    makeRect(this, 'tile_solid',    32, 32, 0x4a3a26);
    makeRect(this, 'tile_grass',    32, 32, 0x3a6a2a);
    makeRect(this, 'tile_dirt',     32, 32, 0x5a3a20);
    makeRect(this, 'tile_mushroom', 32, 32, 0xc26a8a);
    makeRect(this, 'tile_spore',    32, 16, 0x9a6acc);
    makeRect(this, 'tile_thorn',    32, 32, 0x2a3a1a);
    makeRect(this, 'tile_spike',    32, 16, 0xcc4444);
    makeRect(this, 'tile_crumble',  32, 32, 0x8a5a3a);
    makeRect(this, 'tile_bg_lawn',  32, 32, 0x1f3a14);
    makeRect(this, 'tile_bg_hollow',32, 32, 0x1a1424);
    makeRect(this, 'tile_bg_thorn', 32, 32, 0x281a14);

    makeRect(this, 'beetle',   22, 18, 0x3a2a4a);
    makeRect(this, 'ant',      18, 12, 0x882020);
    makeRect(this, 'snail',    24, 16, 0xa07840);
    makeRect(this, 'springtail',14,14, 0xe0d040);
    makeRect(this, 'wasp',     32, 22, 0xf0c020);

    makeRect(this, 'pickup_pollen',  10, 10, 0xffe060);
    makeRect(this, 'pickup_nectar',  14, 14, 0xff70a0);
    makeRect(this, 'pickup_wings',   18, 18, 0x80e0ff);
    makeRect(this, 'pickup_bash',    18, 18, 0xff8040);

    this.scene.start('TitleScene');
  }
}

function makeRect(scene, key, w, h, color) {
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillRect(0, 0, w, h);
  g.generateTexture(key, w, h);
  g.destroy();
}
