import Phaser from 'phaser';
import { getSounds } from '../audio/sound.js';

export class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add.text(cx, cy - 80, 'WORLD OF BUGS', {
      fontFamily: 'monospace', fontSize: '48px', color: '#e8d890'
    }).setOrigin(0.5);

    this.add.text(cx, cy - 30, 'a beetle metroidvania', {
      fontFamily: 'monospace', fontSize: '16px', color: '#8aa070'
    }).setOrigin(0.5);

    this.add.text(cx, cy + 40, 'Tap or press SPACE to start', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(cx, cy + 90, '←/→ or A/D move   SHIFT sprint   SPACE/W jump   X bash   M map   ESC pause', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9aa090'
    }).setOrigin(0.5);

    this.scale.on('resize', () => this.scene.restart());

    const start = () => {
      // First user gesture — safe to bootstrap audio + kick off music.
      const sounds = getSounds();
      sounds.init();
      sounds.startMusic();
      this.scene.start('GameScene');
      this.scene.launch('HudScene');
    };
    this.input.keyboard.once('keydown-SPACE', start);
    this.input.once('pointerdown', start);
  }
}
