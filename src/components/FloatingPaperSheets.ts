/**
 * FloatingPaperSheets.ts: 3D paper sheets tumbling gently through corridor air.
 *
 * Implements Prompt Point 29:
 * - Loose sheets of aged sketch paper drift through the corridor
 * - Realistic aerodynamic tumbling, wobbling rotation, and gentle flutter
 * - Dynamic reaction to walking / sprinting speed
 * - Object-pooled and wrapped seamlessly with camera Z coordinate
 */
import * as THREE from 'three';

interface PaperSheetInstance {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  angularVel: THREE.Vector3;
  baseRot: THREE.Euler;
  flutterPhase: number;
}

export class FloatingPaperSheets {
  public group: THREE.Group;
  private sheets: PaperSheetInstance[] = [];
  private count: number = 14;
  private corridorWidth: number = 5.0;
  private corridorHeight: number = 4.8;
  private depthSpan: number = 72;

  constructor() {
    this.group = new THREE.Group();

    // Paper textures: different sketches and faded notes
    const paperTextures = [
      this.createPaperTexture('study 01', true),
      this.createPaperTexture('1:50 elevation', false),
      this.createPaperTexture('perspective //', true),
      this.createPaperTexture('graphite grid', false),
    ];

    const sheetGeo = new THREE.PlaneGeometry(0.38, 0.48);

    for (let i = 0; i < this.count; i++) {
      const tex = paperTextures[i % paperTextures.length];
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(sheetGeo, mat);

      // Initial position
      const x = (Math.random() - 0.5) * this.corridorWidth;
      const y = 0.8 + Math.random() * (this.corridorHeight - 1.2);
      const z = -Math.random() * this.depthSpan;

      mesh.position.set(x, y, z);
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      this.group.add(mesh);

      this.sheets.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.08,
          -0.035 - Math.random() * 0.025, // Gentle slow fall
          (Math.random() - 0.5) * 0.06
        ),
        angularVel: new THREE.Vector3(
          0.3 + (Math.random() - 0.5) * 0.4,
          0.2 + (Math.random() - 0.5) * 0.3,
          0.15 + (Math.random() - 0.5) * 0.2
        ),
        baseRot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        flutterPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  private createPaperTexture(label: string, withSketch: boolean): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;

    // Warm aged paper tone
    ctx.fillStyle = '#f6efe2';
    ctx.fillRect(0, 0, 128, 160);

    // Rough edge
    ctx.strokeStyle = 'rgba(40, 32, 26, 0.4)';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(2, 2, 124, 156);

    if (withSketch) {
      ctx.strokeStyle = 'rgba(30, 24, 20, 0.6)';
      ctx.lineWidth = 1.2;
      for (let y = 30; y < 130; y += 18) {
        ctx.beginPath();
        ctx.moveTo(15, y);
        ctx.lineTo(113, y);
        ctx.stroke();
      }
    }

    ctx.font = '10px "Courier Prime", monospace';
    ctx.fillStyle = 'rgba(45, 36, 30, 0.7)';
    ctx.fillText(label, 12, 145);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  public update(delta: number, cameraPos: THREE.Vector3, speedFactor: number = 0) {
    const minZ = cameraPos.z - this.depthSpan;
    const maxZ = cameraPos.z + 8;

    // Wind acceleration from forward camera velocity
    const windSpeedZ = speedFactor * 1.8;

    this.sheets.forEach((s) => {
      s.flutterPhase += delta * 2.5;

      // Aerodynamic wobble
      const wobbleX = Math.sin(s.flutterPhase) * 0.08;
      const wobbleY = Math.cos(s.flutterPhase * 1.3) * 0.04;

      // Position update
      s.mesh.position.x += (s.velocity.x + wobbleX) * delta;
      s.mesh.position.y += (s.velocity.y + wobbleY) * delta;
      // Air rushes past moving player
      s.mesh.position.z += (s.velocity.z + windSpeedZ * 0.2) * delta;

      // Tumbling rotation
      s.mesh.rotation.x += s.angularVel.x * delta;
      s.mesh.rotation.y += s.angularVel.y * delta;
      s.mesh.rotation.z += (s.angularVel.z + Math.sin(s.flutterPhase) * 0.2) * delta;

      // Keep within corridor boundaries
      if (s.mesh.position.x < -this.corridorWidth / 2) s.mesh.position.x = this.corridorWidth / 2;
      if (s.mesh.position.x > this.corridorWidth / 2) s.mesh.position.x = -this.corridorWidth / 2;

      // Wrap vertically: reset to top if near floor
      if (s.mesh.position.y < 0.25) {
        s.mesh.position.y = this.corridorHeight - 0.4;
      }

      // Frustum wrapping
      if (s.mesh.position.z < minZ) {
        s.mesh.position.z = maxZ;
      } else if (s.mesh.position.z > maxZ) {
        s.mesh.position.z = minZ;
      }
    });
  }
}
