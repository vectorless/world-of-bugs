# World of Bugs (prototype)

A beetle metroidvania. One big interconnected underground world, three biomes stacked vertically, two ability unlocks, one boss. Find pickups → unlock movement → descend through gates → fight the Wasp Queen.

## Loop

The whole game runs on a single 80×50-tile world (built procedurally in `src/world/buildWorld.js`). No room transitions — the camera smoothly follows the beetle anywhere on the map.

1. **The Lawn** (rows 1–14) — grass floor with stepping platforms, dewdrop pollen, patrol ants. **Dewdrop Wings** sits on a high ledge mid-Lawn. A 5-tile-tall wall on the east end requires double-jump to clear; past it is the descent shaft into the Hollow.
2. **The Mushroom Hollow** (rows 15–29) — tunnel-y chamber with dirt pillars, bouncy mushrooms (`~`), armored snails (`s`), and leaping springtails (`j`). **Shell Bash** sits on a ledge on the west side. A vertical crumble wall (`C`) blocks the east passage to the Thorn descent shaft.
3. **The Thorn Thicket** (rows 30–48) — spike-laden corridors flanked by thorn pillars. A checkpoint (`F`) marks the safe zone near the entrance. The **Wasp Queen** waits in the central arena. Boss has three phases: hover → telegraph dive (yellow tint) → dive (orange) → land/expose (green, vulnerable to shell-bash). Three bashes during the expose window wins.

## Controls

| Key | Action |
| --- | ------ |
| `←` `→` or `A` `D` | Walk |
| `SHIFT` | Sprint (hold while walking — ~1.55× speed) |
| `SPACE` or `W` | Jump (variable height — hold for higher) / Second jump after Dewdrop Wings |
| `X` | Shell-bash dash (after Shell Bash pickup) |
| `M` | Toggle the world map overlay (shows everywhere you've explored) |
| `ESC` | Pause / resume |

## HUD

- **Hearts** (top-left): current health.
- **Pollen** (under hearts): collectible counter — flavor for v0.1.
- **Ability icons** (bottom-left): dim until picked up.

## World map

Pressing `M` overlays a fog-of-war minimap. Tiles you've been within ~7 tiles of are revealed; everything else is dark. Your position is a pulsing cyan dot. Closing with `M` or `ESC` resumes play.

## Damage & death

- Ant/springtail: damage 1 + i-frames (the bug dies).
- Snail: bash-only — without dashing, you bounce off + take damage.
- Spikes (`*`): damage 1 + knockback (they're solid floor too).
- Falling off the bottom of the world is instant death.
- Death respawns you at the last checkpoint marker (`F`) you stepped on — or at the world spawn (`P`) if none — at full health. Ability unlocks and explored area are kept.

## Architecture invariants — keep these

- **One big world, not multiple rooms.** The whole map lives in `src/world/buildWorld.js`. It's still parsed by `src/world/Room.js`, which the rest of the engine treats as a single Room. There are no door transitions; the camera follows the beetle smoothly across the entire 80×50 grid.
- **Map is built programmatically.** Don't hand-edit huge string arrays — edit `buildWorld.js`'s helper calls (`carve`, `fill`, `line`, `set`). Three biome bands are stacked vertically: Lawn 1–14, Hollow 15–29, Thorn 30–48. Outer borders are re-affirmed at the end so nothing leaks.
- **Phaser scenes are modes.** `GameScene` runs the world; `HudScene` persists; `PauseScene` overlays on `ESC`; `MapScene` overlays on `M`; `WinScene` overlays on boss defeat. `BootScene` generates placeholder textures procedurally and hands off to `TitleScene`.
- **Game state lives on `scene.registry`** — `health`, `maxHealth`, `pollen`, `abilities` (Set of ids), `collected` (Set of `entityId`), `brokenWalls` (Set of `"x,y"`), `explored` (Set of `"tx,ty"`), `checkpoint` ({x, y} pixel coords or null), `won`. Mutators in `src/state.js`. The `explored` Set is mutated in place (no `registry.set` on each tile) to avoid event spam.
- **Content is data, not classes.** `src/data/{abilities,enemies,collectibles,zones}.js` are the only files to touch for tuning. Adding a new enemy type is an entry in `enemies.js` + an AI case in `GameScene.makeAi`.
- **Rooms are 2D char grids.** `Room` parses the grid into static physics groups (`solids`, `crumbles`, `spikes`, `bouncy`) plus entity spawn lists. `Room.solidGrid` is a `Set<"x,y">` for O(1) tile lookup (used by enemy ledge detection on the big map).
- **`BeetleController` is decoupled from input source.** Exposes `update(delta, input)` where `input = { left, right, jumpPressed, jumpHeld, dashPressed }`. `GameScene` builds the bag each frame. Coyote time + jump buffer + variable-height jump are inside the controller. Double-jump and shell-bash both read `hasAbility(registry, …)` so unlocks just-work.
- **Camera is smooth.** `CameraController` uses `startFollow(target, true, 0.10, 0.10)` with a small deadzone. Don't set `setBoundsCollision(...)` to hard-clamp without dampening — that defeats the tunnel-y feel.
- **One-shot pickups persist** via `collected` Set keyed by `entityId` (which encodes type + tile coords). Broken crumbles persist via `brokenWalls`. Enemies always respawn at full health when the scene is re-created.
- **All time-based updates use `delta` (ms).** Movement, jump cut, dash duration, i-frames, enemy AI cooldowns, boss phase timers. No frame-counting.

## Glyph reference

| Glyph | Meaning |
| --- | --- |
| `.` | empty |
| `g` | grass / solid |
| `#` | dirt / solid |
| `~` | bouncy mushroom |
| `*` | spike (solid + hurts on touch) |
| `T` | thorn (solid) |
| `C` | crumble wall (breaks with shell-bash) |
| `F` | checkpoint marker |
| `P` | player spawn |
| `a` `s` `j` `W` | ant, snail, springtail, wasp queen |
| `o` `n` | pollen, nectar |
| `w` `b` | wings pickup, bash pickup |

## Run

```
npm install
npm run dev
```

Vite binds 127.0.0.1:5173. Open the browser console for runtime errors.

## Deferred (not in v1)

Sprite art / animation (currently solid-colored rects), sound + music, save/load, more abilities (wall-grip, ground-pound), additional bosses, mobile/touch controls, NPC dialogue, lore.
