// Procedurally constructs the single giant world map. The whole game runs in
// this one Room. Three biomes are stacked vertically — Lawn (open air),
// Hollow (tunnel system carved from solid dirt), Thorn (cavernous spike
// corridors) — connected by shafts with ability gates between them.
//
// Each biome is a network of tight corridors with branches: the player
// repeatedly hits junctions and chooses which way to go. Side passages and
// dead-end chambers hold bonus pickups.

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
  // World starts as fully solid; everything below is carved out.
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
  // LAWN (rows 1-17 open air, row 18 grass floor)
  // The lawn is open above (sky), but the ground is cluttered: tall grass
  // blades form vertical "gates" the player squeezes between, stepping
  // platforms zig-zag east toward wings, and a treetop canopy of small
  // platforms runs above (only reachable after wings).
  // =====================================================================
  carve(1, 1, W - 2, 17);
  line(1, 18, W - 2, 'g');

  // ---- Grass-blade gates — tall 1-wide solid columns chunking the floor
  // into mini-rooms the player passes through. Each blade is short enough
  // to jump over from the floor. Placed in the floor gaps between stepping
  // platforms so they don't block platform-to-platform jumps.
  fill(5, 16, 1, 2, 'g');
  fill(15, 16, 1, 2, 'g');
  fill(22, 16, 1, 2, 'g');
  fill(30, 15, 1, 3, 'g');
  fill(46, 16, 1, 2, 'g');
  fill(55, 15, 1, 3, 'g');
  fill(64, 16, 1, 2, 'g');
  fill(72, 15, 1, 3, 'g');
  fill(82, 16, 1, 2, 'g');
  fill(92, 15, 1, 3, 'g');
  fill(100, 16, 1, 2, 'g');
  fill(116, 16, 1, 2, 'g');
  fill(120, 15, 1, 3, 'g');

  // ---- Low route: stepping platforms east toward wings (2-tile steps)
  line(10, 16, 3, 'g');
  line(17, 14, 3, 'g');
  line(25, 12, 3, 'g');
  line(33, 10, 4, 'g');        // wings ledge (cols 33-36)
  set(34, 9, 'w');             // wings pickup
  line(41, 12, 3, 'g');
  line(49, 14, 3, 'g');

  // ---- High canopy branch — treetop ledges accessible after wings ----
  // A meandering chain of small platforms rising west-to-east, holding
  // bonus pollen and nectar. The drop from the canopy back to the floor
  // is also a stealth shortcut past the wings gate (you fall in past it).
  line(20, 7, 3, 'g');
  line(30, 5, 3, 'g');
  line(40, 6, 3, 'g');
  line(52, 4, 4, 'g');
  line(63, 6, 3, 'g');
  line(74, 4, 4, 'g');
  line(85, 6, 3, 'g');
  line(95, 4, 4, 'g');
  line(105, 6, 3, 'g');

  // Pollen + nectar on the canopy (reward for taking the high route)
  set(21, 6, 'o');
  set(31, 4, 'o');
  set(41, 5, 'n');             // canopy nectar
  set(53, 3, 'o');
  set(64, 5, 'o');
  set(75, 3, 'n');             // second canopy nectar
  set(86, 5, 'o');
  set(96, 3, 'o');
  set(106, 5, 'o');

  // ---- Wings-gate wall: 5-tile-tall block on east lawn ----
  // Approach from the floor requires double-jump to clear. Canopy walkers
  // sail over it.
  fill(108, 14, 2, 5, '#');

  // ---- East lawn run-up and descent shaft ----
  fill(122, 8, 4, 11, '.');    // shaft from row 8 down through floor row 18

  // Lawn entities
  set(3, 17, 'P');             // spawn
  set(8, 17, 'S');             // shop stall (between spawn and first blade)
  set(17, 17, 'a');            // ant on floor (between blades)
  set(45, 17, 'a');
  set(78, 17, 'a');
  set(115, 17, 'a');           // ant past the wall

  // Lawn pollen along the low route (above stepping platforms)
  set(11, 15, 'o');
  set(18, 13, 'o');
  set(26, 11, 'o');
  set(35, 8, 'o');             // near wings
  set(42, 11, 'o');
  set(50, 13, 'o');
  set(118, 17, 'o');

  // =====================================================================
  // HOLLOW (rows 19-38) — TUNNEL SYSTEM
  // Carved from solid dirt: a top tunnel, a middle tunnel, and a lower
  // chamber, all connected by vertical shafts. The player picks routes
  // through the maze: high path is fast, low path has enemies + loot.
  // =====================================================================

  // Top tunnel (rows 22-24, 3 tiles tall, runs almost the full width)
  carve(4, 22, 121, 3);

  // Middle tunnel (rows 27-29)
  carve(4, 27, 121, 3);

  // Lower chamber (rows 33-37, 5 tiles tall — more headroom for combat)
  carve(4, 33, 121, 5);

  // Hollow floor (row 38, solid dirt walkway)
  line(1, 38, W - 2, '#');

  // ---- Vertical shafts connecting the corridors (junctions) ----
  // Each shaft is 2 wide so the player has space to land/jump cleanly.
  // Different shafts connect different tunnels — picking the right one
  // matters.
  fill(10, 22, 2, 16, '.');    // FULL shaft (top→middle→lower→floor)
  fill(28, 22, 2, 7, '.');     // top→middle only
  fill(40, 27, 2, 11, '.');    // middle→lower→floor
  fill(58, 22, 2, 16, '.');    // FULL shaft
  fill(70, 27, 2, 6, '.');     // middle→lower only
  fill(82, 22, 2, 16, '.');    // FULL shaft
  fill(96, 22, 2, 7, '.');     // top→middle
  fill(108, 27, 2, 11, '.');   // middle→lower→floor

  // Lawn-to-hollow descent shaft (must clear everything in its path)
  fill(122, 19, 4, 19, '.');

  // ---- Bash pickup chamber — a small alcove off the middle tunnel ----
  // Accessible by walking west along the middle tunnel from any junction.
  carve(14, 30, 5, 3, '.');    // sunken alcove below middle tunnel
  line(14, 33, 5, '#');        // floor of the alcove
  set(16, 32, 'b');            // bash pickup
  set(15, 32, 'n');            // nectar by the bash

  // ---- Secret chamber off the TOP tunnel (bonus loot) ----
  // Reachable only via the upper route — a reward for taking the high path.
  carve(48, 19, 8, 3, '.');    // ceiling pocket above the top tunnel
  set(50, 20, 'n');
  set(53, 20, 'o');

  // ---- Hollow pillars / overhangs giving the tunnels character ----
  // These are inside the carved tunnels, narrowing them into bottlenecks
  // the player threads through.
  set(20, 23, '#'); set(20, 24, '#');   // mini pillar in top tunnel
  set(36, 28, '#'); set(36, 29, '#');   // mini pillar in middle tunnel
  set(46, 23, '#');                     // overhang in top tunnel
  set(64, 28, '#');
  set(76, 23, '#'); set(76, 24, '#');
  set(88, 28, '#');
  set(102, 23, '#');
  set(116, 28, '#');

  // ---- Bouncy mushrooms in the lower chamber (boost up to upper tunnels)
  set(6, 37, '~');
  set(24, 37, '~');
  set(44, 37, '~');
  set(62, 37, '~');
  set(78, 37, '~');
  set(94, 37, '~');
  set(112, 37, '~');
  set(123, 37, '~');           // under descent shaft for return travel

  // ---- Enemies along the lower chamber (low route is dangerous) ----
  set(15, 37, 's');            // snail
  set(32, 37, 'j');            // springtail
  set(48, 37, 's');
  set(66, 37, 'j');
  set(85, 37, 's');
  set(100, 37, 'j');
  set(115, 37, 'j');

  // Sprinkle of pollen along each tunnel
  set(8, 23, 'o');             // top tunnel
  set(34, 23, 'o');
  set(68, 23, 'o');
  set(98, 23, 'o');

  set(12, 28, 'o');            // middle tunnel
  set(32, 28, 'o');
  set(60, 28, 'o');
  set(92, 28, 'o');
  set(112, 28, 'o');

  set(20, 37, 'o');            // lower chamber floor
  set(50, 37, 'o');
  set(75, 37, 'o');
  set(105, 37, 'n');           // nectar mid-floor

  // =====================================================================
  // HOLLOW→THORN CRUMBLE GATE
  // Just east of the descent shaft — player must traverse west to find
  // bash, then return east and bash through this gate to fall into thorn.
  // =====================================================================
  fill(126, 31, 3, 7, 'C');
  fill(126, 38, 3, 1, '.');

  // =====================================================================
  // THORN (rows 39-57 open, row 58 floor) — PACKED CORRIDORS
  // Thorn pillars from below + dirt overhangs from above form tight zig-
  // zag corridors. Two parallel paths (high ledges and low spike floor)
  // both lead west to the boss arena in the center.
  // =====================================================================
  carve(1, 39, W - 2, 19);
  line(1, 58, W - 2, '#');

  // ---- Ceiling overhangs (hanging from the top of the thorn band) ----
  // Force the player to drop down occasionally, creating natural choke
  // points and forcing path commitment. Note: the descent shaft drop at
  // cols 126-128 must stay clear, so no overhang above col 122.
  fill(4, 39, 4, 4, '#');
  fill(15, 39, 4, 5, '#');
  fill(34, 39, 4, 6, '#');
  fill(48, 39, 4, 4, '#');
  fill(78, 39, 4, 4, '#');
  fill(92, 39, 4, 6, '#');
  fill(112, 39, 4, 5, '#');

  // ---- Thorn pillars from the floor — solid walls in tight packing ----
  fill(10, 42, 3, 14, 'T');
  fill(20, 46, 3, 10, 'T');
  fill(28, 42, 3, 14, 'T');
  fill(40, 45, 3, 11, 'T');
  fill(54, 47, 3, 8, 'T');     // smaller pillar (boss arena west wall)
  fill(75, 47, 3, 8, 'T');     // boss arena east wall
  fill(85, 45, 3, 11, 'T');
  fill(97, 42, 3, 14, 'T');
  fill(108, 46, 3, 10, 'T');
  fill(118, 42, 3, 13, 'T');

  // ---- Upper-route ledges (small platforms above each spike pit).
  // Two-tier hopping: floor ↔ ledge ↔ floor pattern weaves through the
  // pillars without touching spikes.
  line(7, 53, 3, '#');
  line(14, 51, 4, '#');
  line(24, 53, 3, '#');
  line(33, 51, 3, '#');
  line(45, 53, 3, '#');
  line(81, 53, 3, '#');
  line(92, 51, 4, '#');
  line(103, 53, 3, '#');
  line(113, 51, 4, '#');

  // ---- Lower-route spike pits (each between two pillars) ----
  fill(7, 57, 3, 1, '*');
  fill(14, 57, 4, 1, '*');
  fill(24, 57, 3, 1, '*');
  fill(33, 57, 5, 1, '*');
  fill(45, 57, 4, 1, '*');
  fill(81, 57, 4, 1, '*');
  fill(92, 57, 4, 1, '*');
  fill(103, 57, 4, 1, '*');
  fill(113, 57, 4, 1, '*');

  // Boss arena (cols ~57-74) is clear of spikes for the fight.

  // ---- Checkpoint right where the player drops in (east entry) ----
  set(127, 57, 'F');

  // ---- Side chamber off the east entry (small reward for exploring)
  // A pocket up and to the east, accessible by jumping from the floor.
  carve(118, 50, 4, 3, '.');
  line(118, 53, 4, '#');
  set(120, 52, 'n');           // nectar in the side chamber

  // ---- Enemies: springtails patrolling the lower floor ----
  set(20, 56, 'j');
  set(46, 56, 'j');
  set(72, 56, 'j');
  set(100, 56, 'j');

  // ---- Pickups: pollen on the upper ledges, nectar near the boss ----
  set(8, 52, 'o');
  set(15, 50, 'o');
  set(25, 52, 'o');
  set(34, 50, 'o');
  set(46, 52, 'o');
  set(82, 52, 'o');
  set(94, 50, 'o');
  set(104, 52, 'o');
  set(114, 50, 'o');
  set(50, 57, 'o');
  set(78, 57, 'o');
  set(65, 57, 'n');            // last nectar before the boss

  // ---- Wasp Queen — center of the thorn arena ----
  set(65, 50, 'W');

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
