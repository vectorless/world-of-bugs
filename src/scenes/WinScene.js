import Phaser from 'phaser';

export class WinScene extends Phaser.Scene {
  constructor() { super('WinScene'); }

  create(data) {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);
    this.add.text(width / 2, height / 2 - 60, 'YOU WIN', {
      fontFamily: 'monospace', fontSize: '48px', color: '#ffe060'
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2, 'The Wasp Queen falls. The garden is yours.', {
      fontFamily: 'monospace', fontSize: '16px', color: '#e8d890'
    }).setOrigin(0.5);
    if (data && typeof data.pollen === 'number') {
      this.add.text(width / 2, height / 2 + 30, `Pollen collected: ${data.pollen}`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#9aa090'
      }).setOrigin(0.5);
    }
    this.add.text(width / 2, height / 2 + 80, 'Refresh to play again', {
      fontFamily: 'monospace', fontSize: '14px', color: '#9aa090'
    }).setOrigin(0.5);
  }
}
