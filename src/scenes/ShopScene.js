import Phaser from 'phaser';
import { hasAbility, unlockAbility, spendPollen, increaseMaxHealth } from '../state.js';

// Overlay scene shown when the player walks into the shop stall in the Lawn.
// Spends pollen on wall-jump unlock + extra heart slots.

const ITEMS = [
  {
    id: 'wallJump',
    name: 'Wall Cling',
    desc: 'Kick off walls to climb tight passages.',
    cost: 15,
    isAvailable: (reg) => !hasAbility(reg, 'wallJump'),
    purchase: (reg) => unlockAbility(reg, 'wallJump'),
  },
  {
    id: 'heart',
    name: 'Extra Heart',
    desc: '+1 max health.',
    cost: 25,
    isAvailable: () => true,
    purchase: (reg) => increaseMaxHealth(reg, 1),
  },
];

export class ShopScene extends Phaser.Scene {
  constructor() { super('ShopScene'); }

  create() {
    const { width: sw, height: sh } = this.scale;

    // Dim the world below
    this.add.rectangle(0, 0, sw, sh, 0x000000, 0.78).setOrigin(0);

    // Panel
    const panelW = Math.min(440, sw - 40);
    const panelH = Math.min(360, sh - 60);
    const panelX = (sw - panelW) / 2;
    const panelY = (sh - panelH) / 2;
    const frame = this.add.graphics();
    frame.fillStyle(0x2a1f10, 0.95);
    frame.fillRect(panelX, panelY, panelW, panelH);
    frame.lineStyle(2, 0xe8d890, 1);
    frame.strokeRect(panelX, panelY, panelW, panelH);

    this.add.text(panelX + panelW / 2, panelY + 22, 'SLY THE FORAGER', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffe060',
    }).setOrigin(0.5);
    this.add.text(panelX + panelW / 2, panelY + 44, '"Welcome, hatchling — care for a relic?"', {
      fontFamily: 'monospace', fontSize: '11px', color: '#a09080', fontStyle: 'italic',
    }).setOrigin(0.5);

    this.pollenLabel = this.add.text(panelX + panelW / 2, panelY + 62, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#cccccc',
    }).setOrigin(0.5);

    this.refreshPollenLabel();

    // Items
    let y = panelY + 96;
    this.itemRows = [];
    for (const item of ITEMS) {
      const row = this.makeItemRow(panelX + 20, y, panelW - 40, item);
      this.itemRows.push(row);
      y += 90;
    }

    this.add.text(panelX + panelW / 2, panelY + panelH - 22, 'Tap an item to buy — ESC to leave', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9aa090',
    }).setOrigin(0.5);

    const close = () => this.closeShop();
    this.input.keyboard.on('keydown-ESC', close);
    this.input.keyboard.on('keydown-UP', close);
    this.input.keyboard.on('keydown-E', close);

    // Tap on the dim background (anywhere outside an item row) closes
    // the shop. Item rows are interactive, so taps on them are consumed
    // by the buy handler and won't fire here.
    this.input.on('pointerdown', (pointer, over) => {
      if (!over || over.length === 0) close();
    });
  }

  refreshPollenLabel() {
    this.pollenLabel.setText('Pollen: ' + (this.registry.get('pollen') ?? 0));
  }

  makeItemRow(x, y, w, item) {
    const available = item.isAvailable(this.registry);
    const can = available && (this.registry.get('pollen') ?? 0) >= item.cost;

    const bg = this.add.rectangle(x, y, w, 72, available ? 0x3a2a1c : 0x1a1410, 1).setOrigin(0);
    bg.setStrokeStyle(1, available ? (can ? 0xa0e060 : 0x6a5a40) : 0x4a3a2a);

    const title = this.add.text(x + 14, y + 10, item.name, {
      fontFamily: 'monospace', fontSize: '16px',
      color: available ? '#ffe060' : '#6a5a4a',
    });
    const desc = this.add.text(x + 14, y + 34, item.desc, {
      fontFamily: 'monospace', fontSize: '12px',
      color: available ? '#cccccc' : '#5a4a3a',
    });
    const cost = this.add.text(x + w - 14, y + 24, available ? `${item.cost} ◉` : 'OWNED', {
      fontFamily: 'monospace', fontSize: '16px',
      color: available ? (can ? '#a0e060' : '#cc6060') : '#6a5a4a',
    }).setOrigin(1, 0);

    if (available) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.tryBuy(item));
    }

    return { item, bg, title, desc, cost };
  }

  tryBuy(item) {
    if (!item.isAvailable(this.registry)) return;
    if (!spendPollen(this.registry, item.cost)) {
      // Not enough — brief shake on pollen label
      this.tweens.add({
        targets: this.pollenLabel,
        x: this.pollenLabel.x + 6,
        yoyo: true, repeat: 3, duration: 60,
      });
      return;
    }
    item.purchase(this.registry);
    this.cameras.main.flash(160, 200, 255, 120);
    this.rebuildRows();
  }

  rebuildRows() {
    this.refreshPollenLabel();
    for (const row of this.itemRows) {
      row.bg.destroy(); row.title.destroy(); row.desc.destroy(); row.cost.destroy();
    }
    const panelW = Math.min(440, this.scale.width - 40);
    const panelX = (this.scale.width - panelW) / 2;
    const panelY = (this.scale.height - Math.min(360, this.scale.height - 60)) / 2;
    let y = panelY + 96;
    this.itemRows = [];
    for (const item of ITEMS) {
      const row = this.makeItemRow(panelX + 20, y, panelW - 40, item);
      this.itemRows.push(row);
      y += 90;
    }
  }

  // Used by rebuildRows() — kept in sync with the y offset above.
  get itemRowStartY() {
    const panelH = Math.min(360, this.scale.height - 60);
    return (this.scale.height - panelH) / 2 + 96;
  }

  closeShop() {
    const game = this.scene.get('GameScene');
    this.scene.stop();
    this.scene.resume('GameScene');
    if (game) {
      game.shopCooldown = 600;
      // Clear any latched touch input so the closing tap doesn't carry over.
      const touch = this.registry.get('touchInput');
      if (touch) {
        touch.left = touch.right = false;
        touch.jump = touch.dash = touch.sprint = false;
      }
    }
  }
}
