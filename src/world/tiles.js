// Tile glyph → behavior. Rooms are 2D char grids; the loader looks each char
// up here. Anything not listed is treated as empty.

export const TILE_SIZE = 32;

export const TILES = {
  '#': { kind: 'solid',    texture: 'tile_solid' },
  'g': { kind: 'solid',    texture: 'tile_grass' },
  'd': { kind: 'solid',    texture: 'tile_dirt' },
  '~': { kind: 'bouncy',   texture: 'tile_mushroom', bounce: 900 },
  '*': { kind: 'spike',    texture: 'tile_spike' },        // solid + hurts on touch
  'T': { kind: 'solid',    texture: 'tile_thorn' },        // tall thorny pillar (solid wall)
  'X': { kind: 'solid',    texture: 'tile_crystal' },      // crystal pillar (Caverns)
  'x': { kind: 'solid',    texture: 'tile_crystal_floor' },// crystal-flecked floor
  'C': { kind: 'crumble',  texture: 'tile_crumble' },      // breaks with shellBash
  'B': { kind: 'smash',    texture: 'tile_smash' },        // breaks with groundSmash
};

export function tileAt(grid, x, y) {
  if (y < 0 || y >= grid.length) return null;
  const row = grid[y];
  if (!row || x < 0 || x >= row.length) return null;
  return TILES[row[x]] || null;
}

export const ENTITY_GLYPHS = new Set([
  'P', 'D', 'F', 'S',
  'a', 's', 'j', 'W', 'Q',
  'o', 'n', 'w', 'b', 'm',
]);

export function isEntityGlyph(ch) {
  return ENTITY_GLYPHS.has(ch);
}
