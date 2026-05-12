// Procedurally constructs the single giant world map. The whole game runs in
// this one Room. Three biomes are stacked vertically and connected by shafts,
// with ability gates (wings + shell-bash) blocking the descent path.
//
// Each biome has at least one branching path — a "high route" with bonus
// pickups and a "low route" with enemies — so the player can choose how to
// approach each crossing.

export const WORLD_WIDTH = 130;
export const WORLD_HEIGHT = 60;

// Biome bands. Floor row of each biome is the last row in its band.
export const BIOME_BANDS = [
  { from: 0,  to: 18, zone: 'lawn'   },
  { from: 19, to: 38, zone: 'hollow' },
  { from: 39, to: 59, zone: 'thorn'  },
];

export function buildWorld() {
  const W = WORLD_WIDTH, H = WORLD_HEIGHT;
  const g = Array.from({ length: H }, () => Array(W).fill('#'));

  const set = (x, y, ch) => {
    if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = ch;
  };
  const carve = (x, y, w, h) => {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) set(x + dx, y + dy, '.');
  };
  const fill = (x, y, w, h, ch) => {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) set(x + dx, y + dy, ch);
  };
  const line = (x, y, n, ch) => { for (let i = 0; i < n; i++) set(x + i, y, ch); };

  // =====================================================================
  // LAWN (rows 1-17 open, row 18 floor)
  // =====================================================================
  carve(1, 1, W - 2, 17);
  line(1, 18, W - 2, 'g');

  // ---- Low route: floor stepping platforms heading east to wings ----
  // Each step rises 2 tiles — single-jump rise is ~3 tiles so this is
  // comfortably clearable. Wings sit on the highest ledge.
  line(10, 16, 4, 'g');
  line(18, 14, 3, 'g');
  line(26, 12, 3, 'g');
  line(34, 10, 4, 'g');        // wings ledge (cols 34-37)
  set(35, 9, 'w');             // wings pickup
  line(43, 12, 3, 'g');
  line(51, 14, 3, 'g');
  line(60, 16, 3, 'g');
  line(68, 14, 3, 'g');
  line(76, 12, 3, 'g');
  line(85, 14, 3, 'g');
  line(95, 16, 3, 'g');

  // ---- High canopy branch — reached after wings, runs above main path ----
  // A meandering "treetop" stripe of high platforms with bonus pickups.
  // Requires double-jump to reach the first ledge from the wings platform.
  line(40, 6, 3, 'g');
  line(50, 4, 4, 'g');
  line(60, 6, 3, 'g');
  line(70, 4, 4, 'g');
  line(80, 6, 3, 'g');
  line(92, 4, 4, 'g');
  line(102, 6, 3, 'g');

  // Pollen + nectar in the canopy (encourage exploring up there)
  set(41, 5, 'o');
  set(51, 3, 'o');
  set(61, 5, 'n');            // bonus nectar
  set(71, 3, 'o');
  set(81, 5, 'o');
  set(93, 3, 'o');
  set(103, 5, 'o');

  // ---- Wings-gate wall: 5-tile-tall block on east lawn ----
  // Single-jump rise is ~3 tiles, double-jump ~5.4 tiles — a 5-tall wall
  // sits in the sweet spot: uncrossable without wings, barely clearable
  // with them.
  fill(108, 14, 2, 5, '#');

  // ---- Past the wall: open run-up and the Lawn→Hollow descent shaft ----
  fill(122, 8, 4, 11, '.');   // shaft from row 8 down through floor row 18

  // Lawn entities
  set(3, 17, 'P');            // spawn
  set(14, 17, 'a');           // ant on floor
  set(45, 17, 'a');
  set(80, 17, 'a');
  set(116, 17, 'a');          // ant past the wall

  // Lawn pollen along the low route (sit just above each stepping platform)
  set(11, 15, 'o');
  set(19, 13, 'o');
  set(27, 11, 'o');
  set(36, 8, 'o');            // near wings
  set(53, 13, 'o');
  set(69, 13, 'o');
  set(77, 11, 'o');
  set(115, 17, 'o');

  // =====================================================================
  // HOLLOW (rows 19-37 open, row 38 floor)
  // =====================================================================
  carve(1, 19, W - 2, 19);
  line(1, 38, W - 2, '#');

  // Re-carve the Lawn→Hollow descent shaft so nothing blocks it
  carve(122, 19, 4, 19);      // cols 122-125, rows 19-37

  // ---- Pillars / overhangs giving the hollow a winding shape ----
  // Hanging from the ceiling, with clearance above the floor so the
  // low-route walker can pass beneath them.
  fill(6, 20, 3, 8, '#');
  fill(22, 24, 3, 6, '#');
  fill(34, 20, 3, 7, '#');
  fill(48, 22, 3, 8, '#');
  fill(60, 25, 3, 6, '#');
  fill(72, 22, 3, 9, '#');
  fill(86, 25, 3, 7, '#');
  fill(98, 22, 3, 9, '#');
  fill(112, 25, 3, 7, '#');

  // Small floor bumps the player can hop over on the low route
  fill(34, 36, 3, 2, '#');
  fill(60, 35, 3, 3, '#');

  // ---- Upper tunnel route: ceiling platforms (rows 22-25) ----
  // A higher path threading through the pillars — easier traversal but
  // harder to reach (must use mushrooms or stack of pillars to climb up).
  line(12, 24, 6, '#');
  line(28, 23, 4, '#');
  line(42, 22, 4, '#');
  line(56, 23, 3, '#');
  line(68, 22, 3, '#');
  line(80, 23, 5, '#');
  line(94, 22, 3, '#');
  line(106, 24, 4, '#');

  // Pollen along the upper route (reward for taking the harder path)
  set(14, 23, 'o');
  set(29, 22, 'o');
  set(43, 21, 'o');
  set(82, 22, 'o');

  // ---- Bash pickup chamber — small ledge mid-west ----
  line(13, 32, 4, '#');
  set(15, 31, 'b');
  set(14, 31, 'n');           // bonus nectar by the bash pickup

  // ---- Secret alcove: tucked behind the central pillar ----
  // A small chamber with bonus nectar, off the obvious path.
  carve(38, 27, 8, 3, '.');
  line(38, 30, 8, '#');
  set(40, 29, 'n');
  set(43, 29, 'o');

  // ---- Bouncy mushrooms along the hollow floor (let you reach upper route) ----
  set(4, 37, '~');
  set(20, 37, '~');
  set(38, 37, '~');
  set(54, 37, '~');
  set(68, 37, '~');
  set(82, 37, '~');
  set(96, 37, '~');
  set(110, 37, '~');
  set(123, 37, '~');           // under descent shaft, for return travel

  // ---- Lower-route enemies (more dangerous if you stay on the floor) ----
  set(12, 37, 's');           // snail
  set(28, 37, 's');           // snail
  set(46, 37, 'j');           // springtail
  set(64, 37, 'j');
  set(78, 37, 's');
  set(92, 37, 'j');
  set(106, 37, 'j');

  // Hollow pollen + nectar (mostly on the low route)
  set(10, 30, 'o');
  set(26, 30, 'o');
  set(56, 30, 'o');
  set(70, 30, 'o');
  set(88, 30, 'o');
  set(102, 30, 'o');
  set(115, 30, 'o');
  set(50, 37, 'n');           // nectar on the floor

  // =====================================================================
  // HOLLOW→THORN CRUMBLE GATE
  // =====================================================================
  // The descent shaft drops the player on the hollow floor at cols 122-125;
  // the crumble gate sits just east of the shaft. Walking east is blocked
  // until the player finds Shell Bash (west side) and returns. Wall is
  // taller than any double-jump can clear, so the only way past is bash.
  // After bashing through, the player falls through the hole in the
  // hollow floor below into the thorn biome.
  fill(126, 31, 3, 7, 'C');   // crumble wall (cols 126-128, rows 31-37)
  fill(126, 38, 3, 1, '.');   // hole in the hollow floor

  // =====================================================================
  // THORN (rows 39-57 open, row 58 floor)
  // =====================================================================
  carve(1, 39, W - 2, 19);
  line(1, 58, W - 2, '#');

  // ---- East entry corridor (where you drop in from the crumble shaft) ----
  // Checkpoint right where the player lands.
  set(127, 57, 'F');

  // ---- Thorn pillars — big and intimidating ----
  // Left side
  fill(8, 42, 3, 14, 'T');
  fill(18, 45, 3, 11, 'T');
  fill(28, 42, 3, 14, 'T');
  // Center (around the boss arena)
  fill(38, 43, 3, 10, 'T');
  fill(52, 45, 3, 9, 'T');
  fill(74, 45, 3, 9, 'T');
  fill(88, 43, 3, 13, 'T');
  // Right side (closer to entry)
  fill(98, 42, 3, 14, 'T');
  fill(108, 45, 3, 11, 'T');

  // ---- Upper-route ledges (small platforms hovering above each spike pit).
  // Players can either jump the spikes from the floor or hop ledge-to-ledge
  // above them — same destination, different rhythm.
  line(12, 54, 3, '#');
  line(22, 54, 4, '#');
  line(32, 54, 3, '#');
  line(42, 54, 4, '#');
  line(80, 54, 3, '#');
  line(94, 54, 4, '#');
  line(104, 54, 3, '#');

  // ---- Lower-route spike pits (shorter but riskier) ----
  // The boss arena (~cols 55-73) is left clear so the player has solid
  // footing for the dive-and-bash dance.
  fill(12, 57, 3, 1, '*');
  fill(22, 57, 4, 1, '*');
  fill(32, 57, 3, 1, '*');
  fill(42, 57, 4, 1, '*');
  fill(80, 57, 3, 1, '*');
  fill(94, 57, 4, 1, '*');
  fill(104, 57, 3, 1, '*');

  // ---- Springtails patrolling the lower-route floor ----
  set(20, 56, 'j');
  set(46, 56, 'j');
  set(72, 56, 'j');
  set(96, 56, 'j');

  // ---- Pickups: pollen rewards on the upper ledges, nectar near the boss
  set(13, 53, 'o');
  set(23, 53, 'o');
  set(43, 53, 'o');
  set(81, 53, 'o');
  set(95, 53, 'o');
  set(50, 57, 'o');
  set(78, 57, 'o');
  set(62, 57, 'n');           // last nectar before the boss

  // ---- Wasp Queen — center of thorn arena ----
  set(62, 50, 'W');

  // =====================================================================
  // Outer borders (re-affirm so nothing leaks)
  // =====================================================================
  for (let x = 0; x < W; x++) { set(x, 0, '#'); set(x, H - 1, '#'); }
  for (let y = 0; y < H; y++) { set(0, y, '#'); set(W - 1, y, '#'); }

  return {
    id: 'world',
    zone: 'mixed',
    width: W,
    height: H,
    grid: g.map(r => r.join('')),
  };
}
