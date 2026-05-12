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
  wallJump: {
    id: 'wallJump',
    name: 'Wall Cling',
    icon: 'pickup_walljump',
    blurb: 'Jump while against a wall to kick off it.',
  },
};

export const ABILITY_ORDER = ['doubleJump', 'shellBash', 'wallJump'];
