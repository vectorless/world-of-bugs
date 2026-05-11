import Phaser from 'phaser';
import { ABILITIES, ABILITY_ORDER } from '../data/abilities.js';

export class HudScene extends Phaser.Scene {
  constructor() { super('HudScene'); }

  create() {
    this.hearts = [];
    this.abilityIcons = {};
    this.touchButtons = [];

    this.layout();

    const reg = this.registry;
    reg.events.on('changedata-health',    () => this.refresh());
    reg.events.on('changedata-maxHealth', () => this.layout());
    reg.events.on('changedata-pollen',    () => this.refresh());
    // Re-layout on ability changes so the BASH touch button appears once the
    // player picks up shell-bash.
    reg.events.on('changedata-abilities', () => this.layout());

    this.scale.on('resize', () => this.layout());
    this.refresh();
  }

  layout() {
    this.children.removeAll(true);
    this.hearts = [];
    this.abilityIcons = {};
    this.touchButtons = [];

    const { width, height } = this.scale;

    // ---- HUD top-left ----
    const max = this.registry.get('maxHealth') ?? 3;
    for (let i = 0; i < max; i++) {
      this.hearts.push(this.add.text(16 + i * 24, 12, '♥', {
        fontFamily: 'monospace', fontSize: '22px', color: '#ff5060',
      }));
    }

    this.pollenText = this.add.text(16, 44, 'Pollen: 0', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffe060',
    });

    // Ability icons moved up so they don't sit under the touch D-pad
    let ax = 16;
    for (const id of ABILITY_ORDER) {
      const def = ABILITIES[id];
      const icon = this.add.image(ax + 12, 76, def.icon).setAlpha(0.2);
      this.abilityIcons[id] = icon;
      ax += 36;
    }

    // ---- Touch control overlay ----
    this.makeTouchControls(width, height);

    this.refresh();
  }

  // Each button is a hollow circle that gets brighter while pressed. The
  // button's `setFlag(true|false)` updates the shared touchInput record on
  // the registry, which GameScene reads each frame.
  makeTouchControls(width, height) {
    const touch = this.registry.get('touchInput');
    const abilities = this.registry.get('abilities') ?? new Set();

    // Movement (bottom-left)
    this.makeBtn(70,  height - 70, 46, '◀', 0x4a8acc, v => touch.left  = v);
    this.makeBtn(180, height - 70, 46, '▶', 0x4a8acc, v => touch.right = v);

    // Actions (bottom-right)
    this.makeBtn(width - 80,  height - 90, 56, '▲',    0x80c060, v => touch.jump   = v);
    this.makeBtn(width - 90,  height - 210, 38, 'RUN', 0xcca050, v => touch.sprint = v);

    // BASH only appears once the player has unlocked shell-bash. Until then
    // there's nothing to dash with, so showing the button would be confusing.
    if (abilities.has('shellBash')) {
      this.makeBtn(width - 200, height - 70, 42, 'BASH', 0xc06040, v => touch.dash = v);
    }

    // Utility (top-right)
    this.makeBtn(width - 50,  44, 28, 'M', 0x707080, null, () => this.openMap());
    this.makeBtn(width - 110, 44, 28, '‖', 0x707080, null, () => this.openPause());
  }

  // setFlag = function called with true on down / false on up — used for
  //   hold-style buttons (left, right, jump, sprint, dash).
  // tap   = function called once on tap — used for one-shot buttons (map, pause).
  makeBtn(x, y, r, label, color, setFlag, tap) {
    const circle = this.add.circle(x, y, r, color, 0.32);
    circle.setStrokeStyle(2, 0xffffff, 0.55);
    circle.setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: label.length > 1 ? '16px' : '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const press = (pointer) => {
      circle.setFillStyle(color, 0.7);
      if (setFlag) setFlag(true);
      if (tap) tap();
    };
    const release = () => {
      circle.setFillStyle(color, 0.32);
      if (setFlag) setFlag(false);
    };

    circle.on('pointerdown', press);
    circle.on('pointerup', release);
    circle.on('pointerupoutside', release);
    circle.on('pointerout', release);

    this.touchButtons.push({ circle, text });
  }

  openMap() {
    const game = this.scene.get('GameScene');
    if (game && typeof game.openMap === 'function') game.openMap();
  }

  openPause() {
    const game = this.scene.get('GameScene');
    if (game && typeof game.openPause === 'function') game.openPause();
  }

  refresh() {
    const health = this.registry.get('health') ?? 0;
    this.hearts.forEach((h, i) => h.setAlpha(i < health ? 1 : 0.15));

    this.pollenText?.setText('Pollen: ' + (this.registry.get('pollen') ?? 0));

    const abilities = this.registry.get('abilities') ?? new Set();
    for (const id of ABILITY_ORDER) {
      const icon = this.abilityIcons[id];
      if (icon) icon.setAlpha(abilities.has(id) ? 1 : 0.2);
    }
  }
}
