// Pickup defs. type matches the glyph map in Room.parseGrid.

export const PICKUPS = {
  pollen:  { texture: 'pickup_pollen',  effect: 'pollen',     amount: 1 },
  nectar:  { texture: 'pickup_nectar',  effect: 'heal',       amount: 1 },
  wings:   { texture: 'pickup_wings',   effect: 'ability',    ability: 'doubleJump' },
  bash:    { texture: 'pickup_bash',    effect: 'ability',    ability: 'shellBash' },
};
