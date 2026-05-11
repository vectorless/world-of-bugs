import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0);
    this.add.text(width / 2, height / 2 - 20, 'PAUSED', {
      fontFamily: 'monospace', fontSize: '36px', color: '#ffffff'
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 30, 'Press ESC to resume', {
      fontFamily: 'monospace', fontSize: '16px', color: '#9aa090'
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    });
  }
}
