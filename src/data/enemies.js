// Enemy defs. Each has a ai type that the spawner reads.
//   patrol  — walks back and forth, flips at platform edge or wall
//   armored — patrols slowly, can't be damaged except by shell bash
//   leaper  — sits, leaps at player when in range
//   boss    — wasp queen, custom 3-phase AI in scene
//
// hp = number of shellBash hits to defeat. armored snails have 1 hp but
// require shellBash; ants/springtails die from any contact (handled in scene).

export const ENEMIES = {
  ant: {
    type: 'ant',
    ai: 'patrol',
    texture: 'ant',
    hp: 1,
    speed: 70,
    contactDamage: 1,
    requiresBash: false,
  },
  snail: {
    type: 'snail',
    ai: 'armored',
    texture: 'snail',
    hp: 1,
    speed: 30,
    contactDamage: 1,
    requiresBash: true,
  },
  springtail: {
    type: 'springtail',
    ai: 'leaper',
    texture: 'springtail',
    hp: 1,
    speed: 0,
    contactDamage: 1,
    requiresBash: false,
    leapRange: 160,
    leapCooldownMs: 1200,
  },
  waspQueen: {
    type: 'waspQueen',
    ai: 'boss',
    texture: 'wasp',
    hp: 3,
    speed: 0,
    contactDamage: 1,
    requiresBash: true,
  },
};
