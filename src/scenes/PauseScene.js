import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0);
    this.add.text(width / 2, height / 2 - 20, 'PAUSED', {
      fontFamily: 'monospace', fontSize: '36px', color: '#ffffff'
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 30, 'Tap or press ESC to resume', {
      fontFamily: 'monospace', fontSize: '16px', color: '#9aa090'
    }).setOrigin(0.5);

    const resume = () => {
      // Clear any latched touch-button state so a tap that lands on a HUD
      // button doesn't leave a flag stuck "on" when the game resumes.
      const touch = this.registry.get('touchInput');
      if (touch) {
        touch.left = touch.right = false;
        touch.jump = touch.dash = touch.smash = touch.sprint = false;
      }
      this.scene.stop();
      this.scene.resume('GameScene');
    };

    this.input.keyboard.once('keydown-ESC', resume);
    this.input.once('pointerdown', resume);
  }
}
