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

    // iOS Safari can fire `resize` rapidly (URL bar auto-hide, orientation
    // transition keyframes). Debounce so layout only rebuilds once the
    // viewport settles, preventing button flicker / mid-tap drops.
    this.scale.on('resize', () => {
      if (this._resizeTimer) clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this.layout(), 120);
    });
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

    // Scale button sizes to the shorter screen dimension so phone-sized
    // viewports get smaller buttons that don't overlap. iPad (~768px short
    // side) gets full-size buttons; phone (~375px) gets compact ones.
    const base = Math.min(width, height);
    const r     = Math.max(46, Math.min(88, Math.floor(base / 8)));
    const big   = Math.floor(r * 1.25);
    const small = Math.floor(r * 0.85);
    const util  = Math.max(32, Math.floor(r * 0.7));
    // Generous bottom/edge padding keeps buttons clear of iPhone's home
    // indicator gesture zone and any residual notch area on landscape.
    const pad   = Math.max(22, Math.floor(r * 0.55));

    // Movement (bottom-left) — two side-by-side buttons
    const moveY  = height - r - pad;
    const leftX  = r + pad;
    const rightX = leftX + r * 2 + Math.max(10, Math.floor(r * 0.3));
    this.makeBtn(leftX,  moveY, r, '◀', 0x4a8acc, v => touch.left  = v);
    this.makeBtn(rightX, moveY, r, '▶', 0x4a8acc, v => touch.right = v);

    // Actions (bottom-right) — jump is the anchor; sprint above it, bash to its left
    const jumpX = width - big - pad;
    const jumpY = height - big - pad;
    this.makeBtn(jumpX, jumpY, big, '▲', 0x80c060, v => touch.jump = v);

    const sprintY = jumpY - big - small - 8;
    this.makeBtn(jumpX, sprintY, small, 'RUN', 0xcca050, v => touch.sprint = v);

    let nextActionX = jumpX - big - small - 8;
    if (abilities.has('shellBash')) {
      this.makeBtn(nextActionX, jumpY, small, 'BASH', 0xc06040, v => touch.dash = v);
      nextActionX -= small * 2 + 8;
    }
    if (abilities.has('groundSmash')) {
      this.makeBtn(nextActionX, jumpY, small, 'SMASH', 0xa060e0, v => touch.smash = v);
    }

    // Utility (top-right) — map + pause
    const utilY = util + pad;
    this.makeBtn(width - util - pad,                util + pad, util, 'M', 0x707080, null, () => this.openMap());
    this.makeBtn(width - util * 3 - pad * 2 - 8,    util + pad, util, '‖', 0x707080, null, () => this.openPause());
  }

  // setFlag = function called with true on down / false on up — used for
  //   hold-style buttons (left, right, jump, sprint, dash).
  // tap   = function called once on tap — used for one-shot buttons (map, pause).
  makeBtn(x, y, r, label, color, setFlag, tap) {
    const circle = this.add.circle(x, y, r, color, 0.32);
    circle.setStrokeStyle(2, 0xffffff, 0.55);
    circle.setInteractive({ useHandCursor: true });

    const fs = label.length > 1
      ? Math.max(14, Math.floor(r * 0.42))
      : Math.max(20, Math.floor(r * 0.62));
    const text = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: `${fs}px`,
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
