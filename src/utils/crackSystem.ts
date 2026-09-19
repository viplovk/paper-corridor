/**
 * crackSystem.ts: Procedural branching crack & architectural deterioration generator.
 *
 * Implements Prompt Points 2, 3, 4, 31, 36:
 * - Branching fractal crack lines using 3D line geometry
 * - Chipped plaster decals exposing underlying pencil construction grid
 * - Rough graphite cross-hatching around fracture points
 * - Deterministic pseudo-random seed per segment index
 * - Clean collision geometry (purely visual deterioration)
 */
import * as THREE from 'three';

// Pseudo-random deterministic generator based on seed
function seededRandom(seed: number): () => number {
  let s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return () => {
    s = Math.sin(s * 93.13 + 37.719) * 43758.5453;
    return s - Math.floor(s);
  };
}

export class CrackSystem {
  private static pencilLineMaterial = new THREE.LineBasicMaterial({
    color: 0x1f1a16,
    linewidth: 1.5,
  });

  private static plasterExposedMaterial: THREE.MeshBasicMaterial | null = null;

  /**
   * Initializes shared materials for exposed underlying sketch brick/grid
   */
  private static getPlasterExposedMaterial(): THREE.MeshBasicMaterial {
    if (this.plasterExposedMaterial) return this.plasterExposedMaterial;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Faded plaster void
    ctx.fillStyle = '#eae2d3';
    ctx.fillRect(0, 0, 256, 256);

    // Exposed brick/mortar pencil sketch hatching
    ctx.strokeStyle = 'rgba(30, 25, 20, 0.7)';
    ctx.lineWidth = 1.6;

    // Horizontal brick courses
    for (let y = 16; y < 256; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();

      // Staggered vertical joints
      const offset = (y / 28) % 2 === 0 ? 0 : 25;
      for (let x = offset; x < 256; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 28);
        ctx.stroke();
      }
    }

    // Rough graphite cross-hatching around ragged edges
    ctx.strokeStyle = 'rgba(25, 20, 16, 0.4)';
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 256; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 30, 60);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i, 256);
      ctx.lineTo(i - 30, 200);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.plasterExposedMaterial = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });
    return this.plasterExposedMaterial;
  }

  /**
   * Generates a deterministic group of cracks and plaster deterioration for a segment
   */
  public static generateSegmentDamage(
    segmentIndex: number,
    halfW: number,
    height: number,
    length: number,
    visualDensity: number
  ): THREE.Group {
    const group = new THREE.Group();
    const rng = seededRandom(segmentIndex * 19 + 7);

    // Probability of noticeable damage scales with segment density
    const numCracks = visualDensity < 0.25 ? 0 : visualDensity < 0.6 ? 1 : 2 + Math.floor(rng() * 2);
    if (numCracks === 0) return group;

    for (let c = 0; c < numCracks; c++) {
      const side = rng() > 0.5 ? 'left' : 'right';
      const wallX = side === 'left' ? -halfW + 0.008 : halfW - 0.008;
      const rotY = side === 'left' ? Math.PI / 2 : -Math.PI / 2;

      const originZ = -rng() * length;
      const originY = 1.2 + rng() * (height - 2.0);

      // 1. Procedural Branching Crack Lines
      const crackPoints: THREE.Vector3[] = [];
      const numSegments = 6 + Math.floor(rng() * 6);
      let currX = originZ;
      let currY = originY;

      crackPoints.push(new THREE.Vector3(currX, currY, 0));

      const angle = (rng() - 0.5) * 1.2; // Overall crack drift angle
      const branchPoints: THREE.Vector3[][] = [];

      for (let s = 0; s < numSegments; s++) {
        const segLen = 0.2 + rng() * 0.35;
        const segAngle = angle + (rng() - 0.5) * 0.9;

        currX += Math.cos(segAngle) * segLen;
        currY += Math.sin(segAngle) * segLen;
        crackPoints.push(new THREE.Vector3(currX, currY, 0));

        // Occasional branch fissure (Point 4: Cracks should branch naturally)
        if (s > 1 && rng() > 0.65) {
          const bAngle = segAngle + (rng() > 0.5 ? 0.75 : -0.75);
          const bBranch: THREE.Vector3[] = [new THREE.Vector3(currX, currY, 0)];
          let bx = currX;
          let by = currY;
          for (let b = 0; b < 3; b++) {
            bx += Math.cos(bAngle + (rng() - 0.5) * 0.4) * (0.15 + rng() * 0.2);
            by += Math.sin(bAngle + (rng() - 0.5) * 0.4) * (0.15 + rng() * 0.2);
            bBranch.push(new THREE.Vector3(bx, by, 0));
          }
          branchPoints.push(bBranch);
        }
      }

      // Convert 2D wall coordinates into 3D world points
      const to3D = (p: THREE.Vector3) => {
        return side === 'left'
          ? new THREE.Vector3(-halfW + 0.008, p.y, p.x)
          : new THREE.Vector3(halfW - 0.008, p.y, p.x);
      };

      const lineGeo = new THREE.BufferGeometry().setFromPoints(crackPoints.map(to3D));
      const line = new THREE.Line(lineGeo, this.pencilLineMaterial);
      group.add(line);

      branchPoints.forEach((bp) => {
        const bGeo = new THREE.BufferGeometry().setFromPoints(bp.map(to3D));
        const bLine = new THREE.Line(bGeo, this.pencilLineMaterial);
        group.add(bLine);
      });

      // 2. Chipped Plaster Patch (Point 3: Exposed pencil construction lines / chipped plaster)
      if (rng() > 0.45 && visualDensity > 0.5) {
        const patchGeo = new THREE.PlaneGeometry(0.75 + rng() * 0.6, 0.5 + rng() * 0.4);
        const patchMesh = new THREE.Mesh(patchGeo, this.getPlasterExposedMaterial());
        patchMesh.position.set(wallX, originY, originZ);
        patchMesh.rotation.y = rotY;
        patchMesh.rotation.z = (rng() - 0.5) * 0.2;
        group.add(patchMesh);
      }
    }

    return group;
  }
}
