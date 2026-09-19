/**
 * useWalkingController: Architecture-level first-person controller.
 * Adheres strictly to coordinate specification:
 * - FORWARD = -Z (W / ArrowUp moves into negative Z)
 * - BACKWARD = +Z (S / ArrowDown moves into positive Z)
 * - Horizontal yaw decoupled from vertical pitch for movement
 * - Mouse look toggle with Pointer Lock API support
 * - Smooth exponential acceleration/deceleration damping
 * - Velocity-synchronized procedural head bobbing and footstep triggers
 */
import * as THREE from 'three';
import { galleryAudio } from '../utils/audioSystem';

// Direction constants as specified
export const FORWARD = -1;
export const BACKWARD = 1;

export const WALK_SPEED = 2.2;
export const SPRINT_SPEED = 5.5;

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();

  // Speed and movement metrics
  public speedFactor: number = 0;
  public actualSpeed: number = 0;
  public isSprinting: boolean = false;
  public baseFov: number = 65;

  // Footstep callback for graphite dust disturbances
  public onFootstep?: (pos: THREE.Vector3, speedFactor: number) => void;

  // Rotation angles in radians
  public yaw: number = 0;
  public pitch: number = 0;
  private targetYaw: number = 0;
  private targetPitch: number = 0;

  // Mouse look settings
  public isMouseLookEnabled: boolean = true;
  public isPointerLocked: boolean = false;
  private mouseSensitivity: number = 0.002;

  // Head bobbing & breathing
  private bobTimer: number = 0;
  private eyeHeight: number = 1.75;
  private currentBobY: number = 0;
  private currentBobX: number = 0;
  private currentRoll: number = 0;
  private breathingTimer: number = 0;
  private prevBobSine: number = 0;
  private isLeftFoot: boolean = false;

  // Lateral corridor boundaries
  private minX: number = -1.85;
  private maxX: number = 1.85;

  // Keyboard state
  public keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  };

  // Drag look fallback (for mobile or when mouse look is off)
  public isDragging: boolean = false;
  private prevMouseX: number = 0;
  private prevMouseY: number = 0;

  // Mobile virtual joystick input (-1 to 1)
  public touchMoveVector = { x: 0, y: 0 };
  public isPaused: boolean = false;

  // Metrics
  public distanceWalked: number = 0;
  public stepCount: number = 0;
  private lastFootstepTime: number = 0;

  constructor(camera: THREE.PerspectiveCamera, startZ: number = 4.0) {
    this.camera = camera;
    this.position = new THREE.Vector3(0, this.eyeHeight, startZ);
    this.camera.position.copy(this.position);
    this.camera.rotation.order = 'YXZ';

    this.bindEvents();
  }

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('pointerlockerror', this.onPointerLockError);
  }

  public destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('pointerlockerror', this.onPointerLockError);
  }

  public toggleMouseLook(): boolean {
    this.isMouseLookEnabled = !this.isMouseLookEnabled;
    if (!this.isMouseLookEnabled && this.isPointerLocked) {
      document.exitPointerLock();
    }
    return this.isMouseLookEnabled;
  }

  private onPointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement !== null;
  };

  private onPointerLockError = () => {
    this.isPointerLocked = false;
  };

  // Stable single mousemove handler
  public handleMouseMove = (event: MouseEvent) => {
    if (!this.isMouseLookEnabled) return;

    if (this.isPointerLocked) {
      // Direct Pointer Lock movement delta
      this.targetYaw -= event.movementX * this.mouseSensitivity;
      this.targetPitch -= event.movementY * this.mouseSensitivity;
      this.clampPitch();
    } else if (this.isDragging) {
      // Dragging while not locked
      const dx = event.clientX - this.prevMouseX;
      const dy = event.clientY - this.prevMouseY;
      this.prevMouseX = event.clientX;
      this.prevMouseY = event.clientY;

      this.targetYaw -= dx * this.mouseSensitivity;
      this.targetPitch -= dy * this.mouseSensitivity;
      this.clampPitch();
    }
  };

  public handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isDragging = true;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
    }
  };

  public handleMouseUp = () => {
    this.isDragging = false;
  };

  public handleTouchLook = (dx: number, dy: number) => {
    const touchSens = 0.003;
    this.targetYaw -= dx * touchSens;
    this.targetPitch -= dy * touchSens;
    this.clampPitch();
  };

  private clampPitch() {
    // Pitch clamped strictly between -65° and +65°
    const maxPitch = (65 * Math.PI) / 180; // ~1.134 rad
    this.targetPitch = Math.max(-maxPitch, Math.min(maxPitch, this.targetPitch));
  }

  private onKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = true;
        break;
      case 'Space':
        e.preventDefault();
        this.isPaused = !this.isPaused;
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = false;
        break;
    }
  };

  public update(delta: number) {
    const dt = Math.min(delta, 0.1);

    // 1. Smooth Camera Rotation with frame-rate independent exponential damping
    const lookAlpha = 1 - Math.exp(-22.0 * dt);
    this.yaw += (this.targetYaw - this.yaw) * lookAlpha;
    this.pitch += (this.targetPitch - this.pitch) * lookAlpha;

    if (this.isPaused) {
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
      return;
    }

    // 2. Compute Input Vector with strict direction convention
    // forwardInput = 1 -> FORWARD (-1)
    // backwardInput = 1 -> BACKWARD (+1)
    const forwardInput = this.keys.forward ? 1 : 0;
    const backwardInput = this.keys.backward ? 1 : 0;
    const strafeLeftInput = this.keys.left ? 1 : 0;
    const strafeRightInput = this.keys.right ? 1 : 0;

    // Movement forward/backward in local space
    // W pressed -> moveFactor = -1 (FORWARD)
    // S pressed -> moveFactor = +1 (BACKWARD)
    let moveFactor = 0;
    if (forwardInput && !backwardInput) {
      moveFactor = FORWARD;
    } else if (backwardInput && !forwardInput) {
      moveFactor = BACKWARD;
    }

    // Mobile touch input mapping
    if (Math.abs(this.touchMoveVector.y) > 0.1) {
      // Up on joystick -> move into negative Z (FORWARD)
      moveFactor += this.touchMoveVector.y > 0 ? FORWARD : BACKWARD;
    }

    // Lateral strafe in local space (-1 = Left, +1 = Right)
    let strafeFactor = strafeRightInput - strafeLeftInput;
    if (Math.abs(this.touchMoveVector.x) > 0.1) {
      strafeFactor += this.touchMoveVector.x;
    }

    // 3. Movement Direction Relative to Horizontal Yaw ONLY (Ignore camera pitch)
    // forwardVector points towards -Z initially
    const forwardVector = new THREE.Vector3(0, 0, -1);
    forwardVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    // rightVector points towards +X initially
    const rightVector = new THREE.Vector3(1, 0, 0);
    rightVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    const desiredDirection = new THREE.Vector3();
    if (moveFactor !== 0) {
      // When moveFactor is FORWARD (-1), we move forward along forwardVector:
      // Note: forwardVector already points in -Z when yaw=0,
      // so W (FORWARD) should scale forwardVector by +1:
      const fwdScalar = moveFactor === FORWARD ? 1.0 : -1.0;
      desiredDirection.addScaledVector(forwardVector, fwdScalar);
    }
    if (strafeFactor !== 0) {
      desiredDirection.addScaledVector(rightVector, strafeFactor);
    }

    const hasInput = desiredDirection.lengthSq() > 0.001;
    if (hasInput) {
      desiredDirection.normalize();
    }

    // 4. Velocities and Acceleration
    const targetMaxSpeed = this.keys.sprint ? SPRINT_SPEED : WALK_SPEED;
    const acceleration = 9.5;
    const friction = 9.0;

    const targetVelocity = hasInput
      ? desiredDirection.multiplyScalar(targetMaxSpeed)
      : new THREE.Vector3(0, 0, 0);

    const rate = hasInput ? acceleration : friction;
    this.velocity.lerp(targetVelocity, 1 - Math.exp(-rate * dt));

    const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    this.actualSpeed = horizontalSpeed;
    this.speedFactor = Math.min(1, Math.max(0, horizontalSpeed / SPRINT_SPEED));
    this.isSprinting = this.keys.sprint && horizontalSpeed > WALK_SPEED + 0.3;

    // Smooth FOV transition: 65° base -> 72° sprint
    const targetFov = this.baseFov + this.speedFactor * 7.0;
    if (Math.abs(this.camera.fov - targetFov) > 0.01) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 5.0);
      this.camera.updateProjectionMatrix();
    }

    // 5. Integrate Position
    const prevZ = this.position.z;
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    // Strict corridor collision limits
    this.position.x = Math.max(this.minX, Math.min(this.maxX, this.position.x));
    // Entrance wall boundary at +4.8 (cannot back out through entrance door at start)
    this.position.z = Math.min(4.8, this.position.z);

    // Distance metrics tracking
    const deltaDist = Math.abs(this.position.z - prevZ);
    this.distanceWalked += deltaDist;

    // 6. Natural Procedural Head Bobbing synchronized with walking velocity
    const isMoving = horizontalSpeed > 0.15;
    if (isMoving) {
      // Step frequency scales naturally from walking to sprint
      const stepFreq = (5.5 + this.speedFactor * 3.8) * (horizontalSpeed / Math.max(1, targetMaxSpeed));
      this.bobTimer += dt * stepFreq;

      // Bob amplitude scales slightly with sprint
      const bobAmpY = 0.038 + this.speedFactor * 0.024;
      const bobAmpX = 0.018 + this.speedFactor * 0.012;
      const rollAmp = 0.0035 + this.speedFactor * 0.003;

      const currentSine = Math.sin(this.bobTimer);
      const targetBobY = Math.abs(Math.sin(this.bobTimer)) * bobAmpY;
      const targetBobX = Math.cos(this.bobTimer * 0.5) * bobAmpX;
      const targetRoll = Math.sin(this.bobTimer * 0.5) * rollAmp;

      // Subtle sprint camera jitter (pencil vibration feel)
      const sprintJitter = this.speedFactor > 0.6 ? (Math.random() - 0.5) * 0.003 * this.speedFactor : 0;

      // Smooth bob transition
      this.currentBobY += (targetBobY + sprintJitter - this.currentBobY) * Math.min(1, dt * 14);
      this.currentBobX += (targetBobX - this.currentBobX) * Math.min(1, dt * 14);
      this.currentRoll += (targetRoll - this.currentRoll) * Math.min(1, dt * 14);

      // Footstep sound trigger at the bottom of the stride cycle
      const now = performance.now();
      const minInterval = this.isSprinting ? 220 : 340;
      if (this.prevBobSine < 0 && currentSine >= 0 && now - this.lastFootstepTime > minInterval) {
        galleryAudio.playFootstep(this.speedFactor);
        this.stepCount++;
        this.lastFootstepTime = now;
        this.isLeftFoot = !this.isLeftFoot;

        // Emit footstep event for floor graphite disturbance
        if (this.onFootstep) {
          const footOffsetX = (this.isLeftFoot ? -0.22 : 0.22);
          const footPos = new THREE.Vector3(
            this.position.x + footOffsetX,
            0.02,
            this.position.z
          );
          this.onFootstep(footPos, this.speedFactor);
        }
      }
      this.prevBobSine = currentSine;
    } else {
      // Smooth decay to rest + subtle idle breathing (0.008–0.012m)
      this.breathingTimer += dt * 1.5;
      const breathY = Math.sin(this.breathingTimer) * 0.010;
      const breathRoll = Math.cos(this.breathingTimer * 0.5) * 0.0008;

      this.currentBobY += (breathY - this.currentBobY) * Math.min(1, dt * 4);
      this.currentBobX += (0 - this.currentBobX) * Math.min(1, dt * 4);
      this.currentRoll += (breathRoll - this.currentRoll) * Math.min(1, dt * 4);
    }

    // Apply computed position & camera rotation
    this.camera.position.set(
      this.position.x + this.currentBobX,
      this.eyeHeight + this.currentBobY,
      this.position.z
    );

    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = this.currentRoll;
  }
}
