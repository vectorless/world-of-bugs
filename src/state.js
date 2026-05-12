// All progression state lives on scene.registry. Mutators here are the only
// callers of registry.set, so scenes never touch keys directly.

export const MAX_HEALTH = 3;

export function initState(registry) {
  registry.set('health', MAX_HEALTH);
  registry.set('maxHealth', MAX_HEALTH);
  registry.set('pollen', 0);
  registry.set('abilities', new Set(['wallJump']));  // wall-cling is innate; wings/bash unlocked later
  registry.set('collected', new Set());      // entityIds of consumed pickups
  registry.set('brokenWalls', new Set());    // `${x},${y}` for shell-bashed crumbles
  registry.set('explored', new Set());       // `${tx},${ty}` tile coords seen
  registry.set('checkpoint', null);          // { x, y } pixel coords; null = use world spawn
  registry.set('won', false);

  // Touch-control flags, mutated in place by HudScene buttons and read each
  // frame by GameScene. Kept as a plain object so we don't trigger registry
  // change events on every pointer event.
  registry.set('touchInput', {
    left: false, right: false,
    jump: false, dash: false, smash: false, sprint: false,
  });
}

// --- Health ---------------------------------------------------------------

export function takeDamage(registry, amount = 1) {
  const h = Math.max(0, (registry.get('health') ?? 0) - amount);
  registry.set('health', h);
  return h;
}

export function heal(registry, amount = 1) {
  const max = registry.get('maxHealth') ?? MAX_HEALTH;
  const h = Math.min(max, (registry.get('health') ?? 0) + amount);
  registry.set('health', h);
  return h;
}

export function refillHealth(registry) {
  registry.set('health', registry.get('maxHealth') ?? MAX_HEALTH);
}

// --- Pollen ---------------------------------------------------------------

export function collectPollen(registry, amount = 1) {
  const next = (registry.get('pollen') ?? 0) + amount;
  registry.set('pollen', next);
  return next;
}

export function spendPollen(registry, amount) {
  const cur = registry.get('pollen') ?? 0;
  if (cur < amount) return false;
  registry.set('pollen', cur - amount);
  return true;
}

export function increaseMaxHealth(registry, amount = 1) {
  const max = (registry.get('maxHealth') ?? MAX_HEALTH) + amount;
  registry.set('maxHealth', max);
  registry.set('health', max);   // top up to new max
  return max;
}

// --- Abilities ------------------------------------------------------------

export function hasAbility(registry, id) {
  return (registry.get('abilities') ?? new Set()).has(id);
}

export function unlockAbility(registry, id) {
  const set = new Set(registry.get('abilities') ?? new Set());
  set.add(id);
  registry.set('abilities', set);
}

// --- Pickup / wall tracking -----------------------------------------------

function markKey(registry, key, entry) {
  const set = new Set(registry.get(key) ?? new Set());
  set.add(entry);
  registry.set(key, set);
}

export function isCollected(registry, entityId) {
  return (registry.get('collected') ?? new Set()).has(entityId);
}

export function markCollected(registry, entityId) {
  markKey(registry, 'collected', entityId);
}

export function isWallBroken(registry, x, y) {
  return (registry.get('brokenWalls') ?? new Set()).has(`${x},${y}`);
}

export function markWallBroken(registry, x, y) {
  markKey(registry, 'brokenWalls', `${x},${y}`);
}

// --- Exploration (map fog) ------------------------------------------------
// We avoid `registry.set('explored', ...)` on every tile add (which would
// re-trigger change events). The Set is mutated in place; MapScene reads
// the same reference.

export function markExplored(registry, tx, ty) {
  const set = registry.get('explored');
  if (!set) {
    const s = new Set([`${tx},${ty}`]);
    registry.set('explored', s);
    return;
  }
  set.add(`${tx},${ty}`);
}

export function isExplored(registry, tx, ty) {
  return (registry.get('explored') ?? new Set()).has(`${tx},${ty}`);
}

// --- Checkpoint / respawn -------------------------------------------------

export function setCheckpoint(registry, x, y) {
  registry.set('checkpoint', { x, y });
}

export function getCheckpoint(registry) {
  return registry.get('checkpoint');
}

export function respawn(registry) {
  refillHealth(registry);
}
