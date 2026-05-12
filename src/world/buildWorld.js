// Procedurally constructs the single giant world map. The whole game runs in
// this one Room. Three biomes are stacked vertically — Lawn (open air),
// Hollow (tunnel system carved from solid dirt), Thorn (cavernous spike
// corridors) — connected by shafts with ability gates between them.
//
// Each biome is a network of tight corridors with branches: the player
// repeatedly hits junctions and chooses which way to go. Side passages and
// dead-end chambers hold bonus pickups.

export const WORLD_WIDTH = 130;
export const WORLD_HEIGHT = 100;

// Biome bands. Floor row of each biome is the last row in its band.
export const BIOME_BANDS = [
  { from: 0,  to: 18, zone: 'lawn'    },
  { from: 19, to: 38, zone: 'hollow'  },
  { from: 39, to: 58, zone: 'thorn'   },
  { from: 59, to: 78, zone: 'crystal' },
  { from: 79, to: 99, zone: 'burrows' },
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

  // ---- Wings-gate wall: 5-tile-tall × 4-wide block on east lawn ----
  // Approach from the floor requires double-jump to clear. Canopy walkers
  // sail over it. Bumped to 4 tiles wide so a horizontal shell-bash
  // (max dash ≈ 2.9 tiles) can't punch all the way through.
  fill(106, 14, 4, 5, '#');

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
  // HOLLOW (rows 19-38) — IRREGULAR CAVE SYSTEM
  // Instead of three neatly-stacked corridors, the hollow is now a tangle
  // of mismatched chambers and zig-zag passages carved at varied heights.
  // No two openings line up. The player wanders rather than walks.
  // =====================================================================

  // Lower walking strip (always carved so the player has a continuous
  // path along the floor)
  carve(4, 33, 121, 5);
  line(1, 38, W - 2, '#');

  // Scatter of mid-height chambers and pockets (rows 20-32). Each is its
  // own blob, intentionally at different heights and widths.
  carve(4, 24, 10, 4, '.');     // west chamber (high)
  carve(16, 20, 6, 6, '.');     // tall narrow alcove
  carve(23, 27, 9, 4, '.');     // mid-west pocket
  carve(33, 22, 12, 5, '.');    // bigger central chamber (high)
  carve(43, 29, 8, 3, '.');     // shelf chamber
  carve(54, 24, 7, 8, '.');     // tall central column-room
  carve(63, 21, 10, 4, '.');    // mid-east high
  carve(75, 26, 6, 6, '.');     // mid-east mid
  carve(83, 22, 11, 3, '.');    // long high tunnel
  carve(86, 30, 8, 3, '.');     // east shelf
  carve(98, 25, 9, 7, '.');     // big east chamber
  carve(110, 21, 11, 5, '.');   // east-most pocket

  // Twisty connecting tunnels at non-uniform heights
  carve(13, 26, 4, 2, '.');     // west chamber → west pocket
  carve(22, 24, 3, 4, '.');     // pocket → middle alcove
  carve(31, 25, 3, 3, '.');
  carve(45, 26, 3, 4, '.');
  carve(51, 28, 5, 2, '.');
  carve(61, 29, 4, 4, '.');
  carve(73, 24, 3, 3, '.');
  carve(81, 25, 3, 3, '.');
  carve(94, 28, 5, 2, '.');
  carve(107, 24, 4, 3, '.');

  // Vertical chimneys connecting some chambers down to the lower walking
  // strip (irregular spacings, varying widths)
  fill(8,  27, 2, 11, '.');
  fill(19, 25, 2, 13, '.');
  fill(36, 26, 3, 12, '.');
  fill(48, 32, 2, 6, '.');
  fill(56, 31, 2, 7, '.');
  fill(67, 24, 2, 14, '.');
  fill(89, 25, 3, 13, '.');
  fill(102, 31, 2, 7, '.');
  fill(115, 25, 2, 13, '.');

  // Lawn-to-hollow descent shaft (must clear everything in its path)
  fill(122, 19, 4, 19, '.');

  // ---- Bash pickup tucked into the WEST chamber (scattered placement)
  set(7, 26, 'b');
  set(10, 26, 'n');

  // ---- A few hidden ceiling pockets at random spots, for surprise loot
  carve(40, 19, 4, 2, '.');
  set(41, 20, 'o'); set(42, 20, 'n');
  carve(70, 19, 5, 2, '.');
  set(72, 20, 'o');
  carve(105, 19, 4, 2, '.');
  set(106, 20, 'o'); set(107, 20, 'n');

  // ---- Bouncy mushrooms on the walking strip at uneven intervals
  set(5,  37, '~');
  set(22, 37, '~');
  set(39, 37, '~');
  set(55, 37, '~');
  set(64, 37, '~');
  set(81, 37, '~');
  set(100, 37, '~');
  set(118, 37, '~');
  set(123, 37, '~');           // under the descent shaft

  // ---- Enemies along the walking strip (irregular spacing)
  set(12, 37, 's');
  set(44, 37, 's');
  set(58, 37, 's');
  set(91, 37, 's');

  // ---- Pollen scattered through the chambers (not on a grid)
  set(6,  25, 'o');
  set(17, 22, 'o');
  set(26, 29, 'o');
  set(36, 23, 'o');
  set(44, 30, 'o');
  set(55, 25, 'o');
  set(58, 28, 'o');
  set(66, 22, 'o');
  set(78, 28, 'o');
  set(86, 23, 'o');
  set(88, 31, 'o');
  set(99, 26, 'o');
  set(104, 30, 'o');
  set(112, 22, 'o');
  set(117, 24, 'n');           // hidden nectar in the eastmost pocket

  // A few pollen on the walking strip too
  set(16, 37, 'o');
  set(48, 37, 'o');
  set(76, 37, 'o');
  set(110, 37, 'n');

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

  // ---- Thorn pillars from the floor — uneven heights, irregular spacing
  fill(10, 41, 2, 15, 'T');
  fill(17, 49, 4, 7, 'T');
  fill(23, 44, 2, 12, 'T');
  fill(31, 47, 3, 9, 'T');
  fill(37, 41, 2, 15, 'T');
  fill(42, 50, 3, 6, 'T');
  fill(54, 47, 3, 8, 'T');     // smaller pillar (boss arena west wall)
  fill(75, 47, 3, 8, 'T');     // boss arena east wall
  fill(82, 43, 2, 13, 'T');
  fill(87, 49, 4, 7, 'T');
  fill(95, 41, 3, 15, 'T');
  fill(101, 50, 2, 6, 'T');
  fill(108, 44, 4, 12, 'T');
  fill(116, 47, 2, 9, 'T');
  fill(120, 41, 3, 15, 'T');

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

  // ---- No spike pits in the Thorn — the boss fight area is fully clean
  // of red killbrick hazards. Thorn pillars and the boss itself still
  // provide plenty of challenge.

  // Boss arena (cols ~57-74) is clear of spikes for the fight.

  // ---- Bench right where the player drops in (east entry) ----
  // (Sit on the bench to refill HP and set a checkpoint, Hollow Knight-style.)
  set(127, 57, 'F');

  // ---- West descent shaft: drops from Thorn floor down into Crystal Caverns.
  // Punch a hole in the Thorn floor at cols 4-5 and the player can fall
  // through into the new biome below. There's no ability gate — the Caverns
  // are open exploration content once you've reached the Thorn at all.
  fill(4, 58, 2, 1, '.');

  // ---- Side chamber off the east entry (small reward for exploring)
  // A pocket up and to the east, accessible by jumping from the floor.
  carve(118, 50, 4, 3, '.');
  line(118, 53, 4, '#');
  set(120, 52, 'n');           // nectar in the side chamber

  // (No springtails in the Thorn — the boss fight is the only encounter.)

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
  // CRYSTAL CAVERNS (rows 59-77 open, row 78 floor)
  // A new biome — a "tiny bit like Hollow Knight's Crystal Peaks". Bright
  // crystal-flecked stone, jagged crystal pillars, and a bench to rest at.
  // Optional exploration — has no ability gate or boss, just bonus loot.
  // =====================================================================
  carve(1, 59, W - 2, 19);
  line(1, 78, W - 2, 'x');     // crystal-flecked floor

  // ---- Re-affirm the west entry shaft so nothing back-fills it
  carve(4, 59, 2, 19);

  // ---- Stubby crystal pillars from the floor — short jump-overs ----
  // Kept low (3-5 tall) so the floor is traversable end-to-end without
  // needing pillar climbing tricks.
  fill(14, 74, 2, 4, 'X');
  fill(24, 75, 2, 3, 'X');
  fill(36, 73, 2, 5, 'X');
  fill(48, 75, 2, 3, 'X');
  fill(64, 74, 2, 4, 'X');
  fill(78, 75, 2, 3, 'X');
  fill(92, 73, 2, 5, 'X');
  fill(108, 74, 2, 4, 'X');
  fill(118, 75, 2, 3, 'X');

  // ---- Ceiling stalactites (overhangs of crystal hanging from above)
  fill(8, 59, 3, 4, 'X');
  fill(20, 59, 3, 3, 'X');
  fill(32, 59, 3, 5, 'X');
  fill(46, 59, 3, 4, 'X');
  fill(58, 59, 3, 3, 'X');
  fill(70, 59, 3, 5, 'X');
  fill(82, 59, 3, 4, 'X');
  fill(96, 59, 3, 3, 'X');
  fill(110, 59, 3, 5, 'X');
  fill(122, 59, 3, 4, 'X');

  // ---- Mid-air crystal ledges (small platforms for the high route) ----
  line(7, 74, 4, 'x');
  line(18, 71, 4, 'x');
  line(30, 73, 4, 'x');
  line(44, 70, 4, 'x');
  line(58, 73, 4, 'x');
  line(72, 70, 4, 'x');
  line(86, 73, 4, 'x');
  line(100, 70, 4, 'x');
  line(112, 73, 4, 'x');

  // ---- Bouncy crystal blooms (act like mushrooms; bright pink in v0.1)
  set(20, 77, '~');
  set(42, 77, '~');
  set(70, 77, '~');
  set(98, 77, '~');

  // ---- Bench (rest spot) on a small platform mid-cavern
  fill(60, 75, 4, 1, 'x');     // bench platform
  set(62, 74, 'F');             // bench/checkpoint

  // ---- Ground Smash pickup — perched on the easternmost ledge, the
  // "end" of the ice biome. Player must traverse the Caverns east to
  // claim it, then come back west to drop into the Burrows.
  set(114, 72, 'm');

  // ---- Enemies — sluggish armored crawlers + leapers
  set(16, 77, 's');             // crystal crawler
  set(46, 77, 's');
  set(82, 77, 's');
  set(110, 77, 's');
  // (No springtails in the Caverns — crystal crawlers only.)

  // ---- Pickups — pollen on each ledge plus nectar caches; bonus floor pollen
  set(8, 73, 'o');              // above ledge row 74
  set(19, 70, 'o');             // above ledge row 71
  set(32, 72, 'o');             // above ledge row 73
  set(45, 69, 'n');             // above ledge row 70 — nectar
  set(60, 72, 'o');             // above ledge row 73
  set(73, 69, 'o');             // above ledge row 70
  set(87, 72, 'o');             // above ledge row 73
  set(101, 69, 'n');            // second nectar
  set(113, 72, 'o');            // above ledge row 73
  set(8, 77, 'o');              // floor scatter
  set(28, 77, 'o');
  set(54, 77, 'o');
  set(82, 77, 'o');
  set(102, 77, 'o');
  set(120, 77, 'o');

  // ---- Open descent into the Burrows on the west of the Caverns floor.
  // (No gate — players reach this after exploring the Caverns, and finding
  // a smash-block barrier here just confused people.)
  fill(4, 78, 4, 1, '.');

  // =====================================================================
  // BURROWS (rows 79-97 open, row 98 floor) — deep dirt warrens beneath
  // the world. Smash-block floors gate the descent toward the Burrower
  // Queen waiting in the central arena.
  // =====================================================================
  carve(1, 79, W - 2, 19);
  line(1, 98, W - 2, '#');        // Burrows floor

  // ---- Landing ledge: where the player drops in (from cols 4-7).
  fill(2, 82, 8, 1, '#');         // wide landing ledge
  set(3, 81, 'F');                // bench on the landing — rest before descent

  // ---- Smash-block floors layered at varied heights. Player must use
  // ground smash to punch through each successive floor — they span the
  // full width so there's no walking around them.
  fill(2, 86, 126, 1, 'B');       // first smash floor
  fill(2, 92, 126, 1, 'B');       // second smash floor (drops you into the arena)

  // ---- Dirt walls dividing the middle layer
  fill(30, 87, 2, 4, '#');
  fill(80, 87, 2, 4, '#');

  // ---- Burrower Queen — the second boss, floats in the arena
  set(64, 95, 'Q');

  // ---- Pickups along the descent (rewards for smashing through)
  set(20, 85, 'o');
  set(40, 85, 'o');
  set(70, 85, 'o');
  set(100, 85, 'n');              // nectar between smash floors
  set(30, 91, 'o');
  set(80, 91, 'o');
  set(70, 97, 'n');               // last nectar in the arena

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
