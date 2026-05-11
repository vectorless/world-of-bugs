// The game now runs in one giant connected world rather than a set of
// discrete rooms. The world is built programmatically in src/world/buildWorld.js.
// This file just re-exports the built world so existing imports keep working.

import { buildWorld } from '../world/buildWorld.js';

export const WORLD = buildWorld();
