// Procedurally constructs the single giant world map. The whole game runs in
// this one Room. Three biomes are stacked vertically and connected by shafts,
// with ability gates (wings + shell-bash) blocking the descent path.

export const WORLD_WIDTH = 80;
export const WORLD_HEIGHT = 50;

// Approx biome rows: lawn 1-14, hollow 15-29, thorn 30-48
export const BIOME_BANDS = [
  { from: 0,  to: 14, zone: 'lawn'   },
  { from: 15, to: 29, zone: 'hollow' },
  { from: 30, to: 49, zone: 'thorn'  },
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

  // ===== LAWN (rows 1-13 open, row 14 floor) =====
  carve(1, 1, W - 2, 13);
  line(1, 14, W - 2, 'g');

  // Stepping platforms (lefthand side, gentle climb)
  line(8, 12, 4, 'g');
  line(15, 10, 3, 'g');
  line(22, 8, 3, 'g');
  line(28, 6, 4, 'g');     // wings ledge (cols 28-31, top y = row 7)
  set(29, 5, 'w');         // wings pickup
  line(36, 8, 3, 'g');
  line(43, 10, 3, 'g');
  line(50, 11, 3, 'g');

  // Wings-gate wall: 5 tiles tall, only clearable with double-jump
  fill(57, 10, 2, 5, '#');

  // East lawn chamber (beyond wall) — has the descent shaft
  // Descent hole carved through the floor at cols 70-72
  fill(70, 9, 3, 6, '.');  // shaft from row 9 down through floor row 14

  // Lawn entities
  set(3, 13, 'P');         // spawn
  set(15, 13, 'a');        // ant
  set(40, 13, 'a');        // ant
  set(67, 13, 'a');        // ant past the wall

  set(10, 11, 'o');
  set(17, 9, 'o');
  set(24, 7, 'o');
  set(30, 4, 'o');         // near wings
  set(45, 9, 'o');
  set(53, 10, 'o');
  set(65, 13, 'o');

  // ===== HOLLOW (rows 15-29) =====
  carve(1, 15, W - 2, 14);

  // Hollow floor
  line(1, 29, W - 2, '#');

  // Tunnel pillars / overhangs — gives a winding feel
  fill(6, 16, 3, 6, '#');
  fill(13, 19, 3, 5, '#');
  fill(20, 16, 3, 4, '#');
  fill(20, 22, 3, 5, '#');
  fill(28, 17, 3, 7, '#');
  fill(36, 19, 4, 5, '#');
  fill(45, 16, 3, 6, '#');
  fill(53, 21, 3, 4, '#');
  fill(62, 16, 4, 8, '#');

  // Re-carve the Lawn→Hollow descent shaft AFTER pillars so nothing blocks it
  carve(70, 15, 3, 14);  // cols 70-72, rows 15-28

  // Bash pickup ledge (on the west side, mid-hollow)
  line(10, 25, 4, '#');
  set(11, 24, 'b');

  // Bouncy mushrooms scattered along hollow floor
  set(4, 28, '~');
  set(25, 28, '~');
  set(42, 28, '~');
  set(58, 28, '~');
  // Extra mushroom under the descent shaft for return travel
  set(71, 28, '~');

  // Enemies
  set(15, 28, 's');  // snail
  set(33, 28, 's');  // snail
  set(48, 28, 'j');  // springtail
  set(65, 28, 'j');  // springtail

  // Hollow pickups
  set(7, 22, 'o');
  set(18, 18, 'o');
  set(32, 23, 'o');
  set(50, 18, 'o');
  set(65, 22, 'o');
  set(40, 25, 'n');  // nectar

  // ===== HOLLOW→THORN CRUMBLE GATE =====
  // A 3-wide × 7-tall block of crumbles sits between the player and the
  // descent shaft to Thorn. The wall is intentionally taller than even a
  // double-jump can clear, so the only way past is to shell-bash through.
  // Bash slices a horizontal channel at the player's height; after that they
  // fall through the hole in the floor below.
  fill(74, 22, 3, 7, 'C');   // crumble wall (cols 74-76, rows 22-28)
  fill(74, 29, 3, 1, '.');   // hole in the hollow floor, opens into thorn

  // ===== THORN (rows 30-48) =====
  carve(1, 30, W - 2, 18);
  line(1, 48, W - 2, '#');

  // Big thorn pillars — they're solid and act as obstacles
  fill(8, 32, 3, 14, 'T');
  fill(15, 35, 3, 10, 'T');
  fill(25, 33, 3, 12, 'T');
  fill(33, 35, 3, 8, 'T');
  fill(45, 33, 3, 12, 'T');
  fill(52, 35, 3, 10, 'T');
  fill(62, 33, 3, 13, 'T');
  fill(70, 35, 3, 11, 'T');

  // Spike-laden floor sections (solid + hazard)
  fill(12, 47, 2, 1, '*');
  fill(20, 47, 3, 1, '*');
  fill(30, 47, 4, 1, '*');
  fill(40, 47, 4, 1, '*');
  fill(50, 47, 2, 1, '*');
  fill(58, 47, 3, 1, '*');
  fill(66, 47, 3, 1, '*');

  // Checkpoint near where the shaft drops in (east entrance to thorn)
  set(74, 47, 'F');

  // Springtails patrolling the corridors
  set(20, 46, 'j');
  set(45, 46, 'j');
  set(65, 46, 'j');

  // Final nectar before the boss
  set(38, 46, 'n');

  // Wasp Queen — center of thorn arena
  set(40, 40, 'W');

  // ===== Outer borders (re-affirm) =====
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
