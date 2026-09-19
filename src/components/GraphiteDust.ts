/**
 * GraphiteDust: Subtle atmospheric floating pencil particles in 3D space.
 * Includes:
 * - Floating graphite flecks & paper fibers that react to walking and sprinting speed
 * - Footstep graphite disturbance puffs (object-pooled, natural fade)
 * - Subtle player graphite shadow on the floor (hand-drawn cross-hatched silhouette)
 */
import * as THREE from 'three';

export class GraphiteDust {
  public group: THREE.Group;
  public points: THREE.Points;
  private positions: Float32Array;
  private velocities: Float32Array;
  private baseVelocities: Float32Array;
  private count: number = 380;
  private corridorWidth: number = 5.4;
  private corridorHeight: number = 5.0;
  private depthSpan: number = 90;

  // Footstep puffs pool
  private footstepPuffs: FootstepPuff[] = [];
  private maxFootsteps: number = 24;

  // Player graphite shadow mesh
  public shadowMesh: THREE.Mesh;
  private shadowLagPos: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    this.group = new THREE.Group();

    // 1. Floating atmospheric graphite particles
    const geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.baseVelocities = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {
      this.positions[i * 3 + 0] = (Math.random() - 0.5) * this.corridorWidth;
      this.positions[i * 3 + 1] = 0.3 + Math.random() * (this.corridorHeight - 0.5);
      this.positions[i * 3 + 2] = -Math.random() * this.depthSpan;

      const vx = (Math.random() - 0.5) * 0.05;
      const vy = 0.015 + Math.random() * 0.025; // Gentle upward thermal drift
      const vz = (Math.random() - 0.5) * 0.04;

      this.velocities[i * 3 + 0] = vx;
      this.velocities[i * 3 + 1] = vy;
      this.velocities[i * 3 + 2] = vz;

      this.baseVelocities[i * 3 + 0] = vx;
      this.baseVelocities[i * 3 + 1] = vy;
      this.baseVelocities[i * 3 + 2] = vz;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    // Canvas particle texture: irregular graphite speck and fibrous paper grain
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d')!;
    pCtx.fillStyle = 'rgba(28, 24, 20, 0.75)';
    pCtx.beginPath();
    pCtx.ellipse(16, 16, 11, 7, Math.PI / 4, 0, Math.PI * 2);
    pCtx.fill();

    const pTexture = new THREE.CanvasTexture(pCanvas);

    const mat = new THREE.PointsMaterial({
      size: 0.075,
      map: pTexture,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      color: 0x221d19,
    });

    this.points = new THREE.Points(geo, mat);
    this.group.add(this.points);

    // 2. Initialize Footstep Disturbance Object Pool
    for (let i = 0; i < this.maxFootsteps; i++) {
      const puff = new FootstepPuff();
      this.footstepPuffs.push(puff);
      this.group.add(puff.mesh);
    }

    // 3. Subtle Player Graphite Shadow (Hand-drawn charcoal hatch decal on floor)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d')!;

    // Draw soft pencil cross-hatching circle
    const grad = sCtx.createRadialGradient(64, 64, 4, 64, 64, 58);
    grad.addColorStop(0, 'rgba(25, 20, 16, 0.35)');
    grad.addColorStop(0.6, 'rgba(35, 30, 24, 0.15)');
    grad.addColorStop(1, 'rgba(40, 35, 30, 0)');
    sCtx.fillStyle = grad;
    sCtx.beginPath();
    sCtx.arc(64, 64, 58, 0, Math.PI * 2);
    sCtx.fill();

    // Add faint pencil strokes through the shadow
    sCtx.strokeStyle = 'rgba(20, 16, 12, 0.2)';
    sCtx.lineWidth = 1.2;
    for (let i = 20; i < 108; i += 8) {
      sCtx.beginPath();
      sCtx.moveTo(i, 20);
      sCtx.lineTo(i + 20, 108);
      sCtx.stroke();
    }

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(0.85, 1.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });

    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.set(0, 0.015, 0);
    this.group.add(this.shadowMesh);
  }

  // Triggered on each footstep
  public spawnFootstepPuff(pos: THREE.Vector3, speedFactor: number) {
    // Find an inactive puff or reuse oldest
    let candidate = this.footstepPuffs.find((p) => !p.isActive);
    if (!candidate) {
      candidate = this.footstepPuffs[0];
    }
    candidate.activate(pos, speedFactor);
  }

  public update(delta: number, cameraPos: THREE.Vector3, speedFactor: number = 0) {
    const cameraZ = cameraPos.z;
    const posAttr = this.points.geometry.attributes.position as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;

    // Coordinate space: forward = negative Z
    const minZ = cameraZ - this.depthSpan;
    const maxZ = cameraZ + 10;

    // Accelerate particles when sprinting
    const speedBoostZ = speedFactor * 1.6;

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      pos[idx + 0] += this.velocities[idx + 0] * delta;
      pos[idx + 1] += this.velocities[idx + 1] * delta;
      // Negative Z is forward movement; air rushes past
      pos[idx + 2] += (this.velocities[idx + 2] + speedBoostZ * 0.15) * delta;

      // Wrap around within camera view frustum
      if (pos[idx + 2] < minZ) {
        pos[idx + 2] = maxZ;
      } else if (pos[idx + 2] > maxZ) {
        pos[idx + 2] = minZ;
      }

      if (pos[idx + 1] > this.corridorHeight - 0.2) {
        pos[idx + 1] = 0.3;
      }
    }

    posAttr.needsUpdate = true;

    // Update Footstep Puffs
    this.footstepPuffs.forEach((puff) => {
      puff.update(delta);
    });

    // Update Player Graphite Shadow with subtle organic lag
    // In rare sections or sprint, subtle lag creates artistic hand-drawn feeling
    const lagSpeed = Math.min(1, delta * 12.0);
    this.shadowLagPos.x += (cameraPos.x - this.shadowLagPos.x) * lagSpeed;
    this.shadowLagPos.z += (cameraPos.z - this.shadowLagPos.z) * lagSpeed;

    this.shadowMesh.position.set(
      this.shadowLagPos.x,
      0.015,
      this.shadowLagPos.z + 0.15 // slightly offset under player
    );

    // Subtle breathing scale of shadow
    const breath = 1.0 + Math.sin(performance.now() * 0.002) * 0.04;
    this.shadowMesh.scale.set(breath, breath * 1.1, 1);
  }
}

/**
 * Individual Footstep Graphite Disturbance Puff
 */
class FootstepPuff {
  public mesh: THREE.Mesh;
  public isActive: boolean = false;
  private life: number = 0;
  private maxLife: number = 1.4;
  private material: THREE.MeshBasicMaterial;

  constructor() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Hand-drawn radial graphite scuff mark
    ctx.strokeStyle = 'rgba(35, 30, 25, 0.4)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const r1 = 3 + Math.random() * 4;
      const r2 = 12 + Math.random() * 14;
      ctx.beginPath();
      ctx.moveTo(32 + Math.cos(angle) * r1, 32 + Math.sin(angle) * r1);
      ctx.lineTo(32 + Math.cos(angle) * r2, 32 + Math.sin(angle) * r2);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    const geo = new THREE.PlaneGeometry(0.35, 0.35);
    this.material = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.visible = false;
  }

  public activate(pos: THREE.Vector3, speedFactor: number) {
    this.isActive = true;
    this.life = 0;
    this.maxLife = 1.2 + speedFactor * 0.5;
    this.mesh.position.set(pos.x, 0.016, pos.z);
    this.mesh.rotation.z = Math.random() * Math.PI * 2;
    const initialScale = 0.6 + speedFactor * 0.5;
    this.mesh.scale.set(initialScale, initialScale, initialScale);
    this.material.opacity = 0.24 + speedFactor * 0.16;
    this.mesh.visible = true;
  }

  public update(delta: number) {
    if (!this.isActive) return;

    this.life += delta;
    const progress = this.life / this.maxLife;

    if (progress >= 1.0) {
      this.isActive = false;
      this.mesh.visible = false;
      return;
    }

    // Subtle gentle expansion and fade out
    const currentScale = 0.8 + progress * 0.5;
    this.mesh.scale.set(currentScale, currentScale, currentScale);
    this.material.opacity = Math.max(0, (1 - progress) * 0.3);
  }
}
