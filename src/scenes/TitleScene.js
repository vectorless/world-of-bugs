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

    this.add.text(cx, cy + 30, 'Tap or press SPACE for Adventure', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff'
    }).setOrigin(0.5);

    const precisionBtn = this.add.text(cx, cy + 70, '[ Precision Mode ]', {
      fontFamily: 'monospace', fontSize: '16px', color: '#a0e0ff',
      backgroundColor: '#1a2030', padding: { x: 10, y: 6 },
    }).setOrigin(0.5);
    precisionBtn.setInteractive({ useHandCursor: true });

    this.add.text(cx, cy + 110, '←/→ or A/D move   SHIFT sprint   SPACE/W jump   X bash   DOWN smash   M map   ESC pause', {
      fontFamily: 'monospace', fontSize: '11px', color: '#9aa090'
    }).setOrigin(0.5);

    this.scale.on('resize', () => this.scene.restart());

    const bootAudio = () => {
      const sounds = getSounds();
      sounds.init();
      sounds.startMusic();
    };

    const startAdventure = () => {
      bootAudio();
      this.scene.start('GameScene');
      this.scene.launch('HudScene');
    };

    const startPrecision = () => {
      bootAudio();
      this.scene.start('PrecisionScene');
    };

    this.input.keyboard.once('keydown-SPACE', startAdventure);
    precisionBtn.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation?.();
      startPrecision();
    });

    // Tap anywhere else (not on the precision button) starts adventure.
    this.input.on('pointerdown', (pointer, over) => {
      if (over && over.includes(precisionBtn)) return;
      startAdventure();
    });
  }
}
