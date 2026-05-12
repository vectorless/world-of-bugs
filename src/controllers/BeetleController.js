import { hasAbility } from '../state.js';
import { getSounds } from '../audio/sound.js';

// Drives the beetle physics sprite. Decoupled from input source: GameScene
// builds an input bag each frame and hands it in.
//
// input = { left, right, jumpPressed, jumpHeld, dashPressed }
//   - *Pressed are edge-triggered (true only on the frame the key went down)
//   - *Held is level-triggered (true while the key is down)
//
// All durations are in ms, all velocities in px/sec. Time-based things scale
// with delta so input feel is framerate-independent.

const MOVE_SPEED = 220;
const SPRINT_MULT = 1.55;
const JUMP_VELOCITY = -520;
const DOUBLE_JUMP_VELOCITY = -460;
const JUMP_CUT_FACTOR = 0.45;     // velocity multiplier when jump is released early
const COYOTE_MS = 90;
const JUMP_BUFFER_MS = 110;
const DASH_VELOCITY = 520;
const DASH_DURATION_MS = 180;
const DASH_COOLDOWN_MS = 420;
const IFRAME_MS = 700;
const KNOCKBACK_X = 220;
const KNOCKBACK_Y = -280;
// Wall jump: kick off the wall horizontally + upward. Wall slide caps the
// downward velocity while pressed into a wall so it feels like clinging.
const WALL_JUMP_VX = 340;
const WALL_JUMP_VY = -480;
const WALL_SLIDE_MAX_FALL = 90;
const WALL_JUMP_LOCKOUT_MS = 140;   // brief lockout so the wall-jump pushes away

export class BeetleController {
  constructor(scene, sprite) {
    this.scene = scene;
    this.sprite = sprite;
    this.registry = scene.registry;

    this.facing = 1;            // 1 right, -1 left
    this.coyoteTimer = 0;       // ms since left ground
    this.jumpBufferTimer = 0;   // ms since jump pressed
    this.doubleJumpUsed = false;
    this.dashTimer = 0;         // ms left in current dash
    this.dashCooldown = 0;      // ms left until can dash again
    this.iframes = 0;           // ms left invulnerable
    this.wallJumpLockout = 0;   // ms during which horizontal input is overridden
    this.dead = false;
  }

  isDashing() { return this.dashTimer > 0; }
  isInvulnerable() { return this.iframes > 0; }

  update(delta, input) {
    if (this.dead) return;

    const body = this.sprite.body;
    const onGround = body.blocked.down || body.touching.down;

    // Timers tick down regardless of input
    if (this.dashTimer > 0) this.dashTimer = Math.max(0, this.dashTimer - delta);
    if (this.dashCooldown > 0) this.dashCooldown = Math.max(0, this.dashCooldown - delta);
    if (this.iframes > 0) this.iframes = Math.max(0, this.iframes - delta);
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
    if (this.wallJumpLockout > 0) this.wallJumpLockout = Math.max(0, this.wallJumpLockout - delta);

    if (onGround) {
      this.coyoteTimer = COYOTE_MS;
      this.doubleJumpUsed = false;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    // --- Horizontal movement ---
    if (this.isDashing()) {
      // Dash holds horizontal velocity; player can't steer mid-dash
      body.setVelocityX(this.facing * DASH_VELOCITY);
      // Ignore gravity during dash for a clean horizontal line
      body.setVelocityY(0);
      body.setAllowGravity(false);
    } else if (this.wallJumpLockout > 0) {
      // Briefly hold the wall-jump's horizontal kick so the player actually
      // separates from the wall before they can steer back into it.
      body.setAllowGravity(true);
    } else {
      body.setAllowGravity(true);
      const speed = input.sprint ? MOVE_SPEED * SPRINT_MULT : MOVE_SPEED;
      let vx = 0;
      if (input.left)  { vx -= speed; this.facing = -1; }
      if (input.right) { vx += speed; this.facing = 1; }
      body.setVelocityX(vx);
    }

    // --- Wall slide (cap fall speed while clinging to a wall) ---
    const againstWall = !onGround && (body.blocked.left || body.blocked.right);
    if (againstWall
        && hasAbility(this.registry, 'wallJump')
        && !this.isDashing()
        && body.velocity.y > WALL_SLIDE_MAX_FALL
        && ((body.blocked.left && input.left) || (body.blocked.right && input.right))) {
      body.setVelocityY(WALL_SLIDE_MAX_FALL);
    }

    // --- Jump (buffered + coyote) ---
    if (input.jumpPressed) this.jumpBufferTimer = JUMP_BUFFER_MS;

    if (!this.isDashing() && this.jumpBufferTimer > 0) {
      if (this.coyoteTimer > 0) {
        body.setVelocityY(JUMP_VELOCITY);
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
        getSounds().swoosh();
      } else if (againstWall && hasAbility(this.registry, 'wallJump')) {
        // Wall jump — kick away from the wall. Re-arm double jump so the
        // player can chain a wing-flap after a wall kick.
        const awayDir = body.blocked.left ? 1 : -1;
        body.setVelocity(awayDir * WALL_JUMP_VX, WALL_JUMP_VY);
        this.facing = awayDir;
        this.jumpBufferTimer = 0;
        this.doubleJumpUsed = false;
        this.wallJumpLockout = WALL_JUMP_LOCKOUT_MS;
        getSounds().swoosh();
      } else if (hasAbility(this.registry, 'doubleJump') && !this.doubleJumpUsed && !onGround) {
        body.setVelocityY(DOUBLE_JUMP_VELOCITY);
        this.doubleJumpUsed = true;
        this.jumpBufferTimer = 0;
        getSounds().swoosh();
      }
    }

    // Variable-height jump: cut velocity when player releases jump early
    if (!input.jumpHeld && body.velocity.y < 0 && !this.isDashing()) {
      body.setVelocityY(body.velocity.y * JUMP_CUT_FACTOR);
    }

    // --- Dash (shellBash) ---
    if (input.dashPressed
        && hasAbility(this.registry, 'shellBash')
        && this.dashTimer === 0
        && this.dashCooldown === 0) {
      this.dashTimer = DASH_DURATION_MS;
      this.dashCooldown = DASH_COOLDOWN_MS;
      this.iframes = Math.max(this.iframes, DASH_DURATION_MS);
      getSounds().dashSwoosh();
    }

    // --- Flicker while invulnerable ---
    this.sprite.setAlpha(this.iframes > 0 ? (Math.floor(this.iframes / 60) % 2 ? 0.4 : 1) : 1);
  }

  // Called by GameScene on enemy contact; returns true if damage applied.
  takeHit(fromX) {
    if (this.iframes > 0 || this.dead) return false;
    this.iframes = IFRAME_MS;
    const dir = this.sprite.x < fromX ? -1 : 1;
    this.sprite.body.setVelocity(dir * KNOCKBACK_X, KNOCKBACK_Y);
    return true;
  }

  killForRespawn() {
    this.dead = true;
    this.sprite.body.setVelocity(0, 0);
    this.sprite.setVisible(false);
  }

  revive(x, y) {
    this.dead = false;
    this.sprite.setVisible(true);
    this.sprite.setAlpha(1);
    this.sprite.body.setVelocity(0, 0);
    this.sprite.body.reset(x, y);
    this.iframes = 600;
    this.doubleJumpUsed = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
  }
}
