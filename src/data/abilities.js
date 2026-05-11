// Ability defs. Pickup glyphs map to ids via the loader.

export const ABILITIES = {
  doubleJump: {
    id: 'doubleJump',
    name: 'Dewdrop Wings',
    icon: 'pickup_wings',
    blurb: 'Press jump again in the air.',
  },
  shellBash: {
    id: 'shellBash',
    name: 'Shell Bash',
    icon: 'pickup_bash',
    blurb: 'Press X to dash forward — breaks crumbly walls.',
  },
};

export const ABILITY_ORDER = ['doubleJump', 'shellBash'];
