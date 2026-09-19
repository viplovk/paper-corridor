/**
 * environmentalDetails.ts: Architectural sketchbook environment details.
 *
 * Implements Prompt Points 5, 6, 7, 8, 16, 17, 18, 21, 22:
 * - 3D Paper Patches with translucent masking tape at corners
 * - Torn exhibition posters with jagged physical torn edge geometry
 * - Architectural dimension markings (<── 2.40m ──>), elevation notes, and ghost sketches
 * - Physical 3D objects: wooden drafting pencils, block erasers, rulers, paper stacks, stools, rolled blueprints
 * - Exposed ceiling cross-beams & hanging lamp wires
 * - Floor coffee stains & drafting measurement ticks
 */
import * as THREE from 'three';

function seededRandom(seed: number): () => number {
  let s = Math.sin(seed * 27.819 + 43.123) * 31415.9265;
  return () => {
    s = Math.sin(s * 71.93 + 19.827) * 31415.9265;
    return s - Math.floor(s);
  };
}

export class EnvironmentalDetails {
  // Shared textures & materials cache
  private static tapeMaterial: THREE.MeshBasicMaterial | null = null;
  private static pencilWoodMaterial: THREE.MeshBasicMaterial | null = null;
  private static graphiteMaterial: THREE.MeshBasicMaterial | null = null;
  private static eraserMaterial: THREE.MeshBasicMaterial | null = null;
  private static woodBeamMaterial: THREE.MeshBasicMaterial | null = null;
  private static patchTextures: THREE.CanvasTexture[] = [];
  private static posterTextures: THREE.CanvasTexture[] = [];
  private static coffeeStainMaterial: THREE.MeshBasicMaterial | null = null;

  // Masking tape material (translucent creamy vellum paper tape)
  public static getTapeMaterial(): THREE.MeshBasicMaterial {
    if (this.tapeMaterial) return this.tapeMaterial;

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#e5dcc7';
    ctx.fillRect(0, 0, 64, 32);

    // Subtle crepe paper tape texture
    ctx.strokeStyle = 'rgba(70, 60, 45, 0.2)';
    ctx.lineWidth = 0.8;
    for (let x = 0; x < 64; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 32);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.tapeMaterial = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    });
    return this.tapeMaterial;
  }

  // Wooden materials for pencils, rulers, beams
  public static getPencilWoodMaterial(): THREE.MeshBasicMaterial {
    if (this.pencilWoodMaterial) return this.pencilWoodMaterial;
    this.pencilWoodMaterial = new THREE.MeshBasicMaterial({ color: 0xc89b60 });
    return this.pencilWoodMaterial;
  }

  public static getGraphiteMaterial(): THREE.MeshBasicMaterial {
    if (this.graphiteMaterial) return this.graphiteMaterial;
    this.graphiteMaterial = new THREE.MeshBasicMaterial({ color: 0x221c17 });
    return this.graphiteMaterial;
  }

  public static getEraserMaterial(): THREE.MeshBasicMaterial {
    if (this.eraserMaterial) return this.eraserMaterial;

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#e8d5cc'; // Soft pink/beige eraser rubber
    ctx.fillRect(0, 0, 64, 64);

    // Graphite smudges on eraser edge
    ctx.fillStyle = 'rgba(30, 25, 20, 0.4)';
    ctx.beginPath();
    ctx.arc(12, 12, 18, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    this.eraserMaterial = new THREE.MeshBasicMaterial({ map: tex });
    return this.eraserMaterial;
  }

  public static getWoodBeamMaterial(): THREE.MeshBasicMaterial {
    if (this.woodBeamMaterial) return this.woodBeamMaterial;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#42382f';
    ctx.fillRect(0, 0, 256, 64);

    ctx.strokeStyle = 'rgba(20, 16, 12, 0.7)';
    ctx.lineWidth = 1.2;
    for (let y = 10; y < 64; y += 14) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    this.woodBeamMaterial = new THREE.MeshBasicMaterial({ map: tex });
    return this.woodBeamMaterial;
  }

  // Coffee ring stain material
  public static getCoffeeStainMaterial(): THREE.MeshBasicMaterial {
    if (this.coffeeStainMaterial) return this.coffeeStainMaterial;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Translucent ring
    ctx.strokeStyle = 'rgba(85, 60, 40, 0.45)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(64, 64, 45, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary inner seep
    ctx.strokeStyle = 'rgba(100, 75, 50, 0.25)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(63, 65, 42, 0, Math.PI * 2);
    ctx.stroke();

    // Splatter dots
    ctx.fillStyle = 'rgba(85, 60, 40, 0.35)';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(20 + Math.random() * 88, 20 + Math.random() * 88, 1.2 + Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.coffeeStainMaterial = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    return this.coffeeStainMaterial;
  }

  /**
   * Generates paper patch textures with various sketches, corrections, and notes
   */
  private static getPatchTexture(index: number): THREE.CanvasTexture {
    if (this.patchTextures[index]) return this.patchTextures[index];

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Slightly different warm aged tone than wall
    const tones = ['#fdfaf2', '#f6efe1', '#eee5d4', '#faf5eb'];
    ctx.fillStyle = tones[index % tones.length];
    ctx.fillRect(0, 0, 256, 256);

    // Rough paper edges
    ctx.strokeStyle = 'rgba(60, 50, 40, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(3, 3, 250, 250);

    const contents = [
      () => {
        // Architectural elevation snippet with red cross-out
        ctx.strokeStyle = 'rgba(30, 25, 20, 0.75)';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(40, 60, 176, 120);
        ctx.strokeRect(70, 90, 40, 60);
        ctx.strokeRect(146, 90, 40, 60);
        // Frustrated cross-out
        ctx.strokeStyle = 'rgba(140, 40, 30, 0.65)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(30, 50);
        ctx.lineTo(226, 190);
        ctx.moveTo(226, 50);
        ctx.lineTo(30, 190);
        ctx.stroke();

        ctx.font = 'bold 20px "Architects Daughter", cursive';
        ctx.fillStyle = 'rgba(30, 25, 20, 0.85)';
        ctx.fillText('DISCARD · SCALE INCORRECT', 24, 230);
      },
      () => {
        // Perspective vanishing point study
        ctx.strokeStyle = 'rgba(35, 30, 24, 0.6)';
        ctx.lineWidth = 1.0;
        for (let a = 0; a < Math.PI * 2; a += 0.35) {
          ctx.beginPath();
          ctx.moveTo(128, 128);
          ctx.lineTo(128 + Math.cos(a) * 110, 128 + Math.sin(a) * 110);
          ctx.stroke();
        }
        ctx.font = '16px "Courier Prime", monospace';
        ctx.fillStyle = 'rgba(35, 30, 25, 0.75)';
        ctx.fillText('VP-02 // REF 4.8m', 40, 230);
      },
      () => {
        // Detail note with dimension
        ctx.font = 'bold 18px "Architects Daughter", cursive';
        ctx.fillStyle = 'rgba(28, 24, 20, 0.85)';
        ctx.fillText('RE-CHECK ARCH HEIGHT', 32, 70);
        ctx.fillText('H = 5.20m', 32, 105);

        ctx.strokeStyle = 'rgba(35, 30, 24, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(32, 140);
        ctx.lineTo(224, 140);
        ctx.moveTo(32, 130);
        ctx.lineTo(32, 150);
        ctx.moveTo(224, 130);
        ctx.lineTo(224, 150);
        ctx.stroke();

        ctx.font = '14px "Courier Prime", monospace';
        ctx.fillText('←─── 2.40m SPAN ───→', 45, 135);
      },
      () => {
        // Quick anatomy hand gesture sketch
        ctx.strokeStyle = 'rgba(30, 25, 20, 0.7)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(128, 130, 45, 70, 0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = '16px "Architects Daughter", cursive';
        ctx.fillStyle = 'rgba(35, 30, 20, 0.8)';
        ctx.fillText('Study of wrist tension', 36, 225);
      },
    ];

    contents[index % contents.length]();

    const tex = new THREE.CanvasTexture(canvas);
    this.patchTextures[index] = tex;
    return tex;
  }

  /**
   * Generates torn exhibition poster texture
   */
  private static getPosterTexture(index: number): THREE.CanvasTexture {
    if (this.posterTextures[index]) return this.posterTextures[index];

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#eee3cf';
    ctx.fillRect(0, 0, 512, 768);

    // Weathered border
    ctx.strokeStyle = 'rgba(35, 30, 24, 0.8)';
    ctx.lineWidth = 3.0;
    ctx.strokeRect(18, 18, 476, 732);

    ctx.font = 'bold 32px "Courier Prime", monospace';
    ctx.fillStyle = 'rgba(25, 20, 16, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText('EXHIBITION 04', 256, 80);

    ctx.font = 'italic 20px "Architects Daughter", cursive';
    ctx.fillStyle = 'rgba(50, 42, 35, 0.85)';
    ctx.fillText('STUDIES IN INFINITE SPACE', 256, 120);

    // Center sketch in poster
    ctx.strokeStyle = 'rgba(40, 35, 30, 0.65)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 7; i++) {
      ctx.strokeRect(160 - i * 14, 200 + i * 20, 192 + i * 28, 220 - i * 15);
    }

    ctx.font = '15px "Courier Prime", monospace';
    ctx.fillStyle = 'rgba(60, 50, 40, 0.8)';
    ctx.fillText('ARCHITECTURAL GRAPHITE ARCHIVE', 256, 560);
    ctx.fillText('ROOMS I - XVI · ALL WELCOME', 256, 595);

    // Diagonal stamp "UNFINISHED"
    ctx.save();
    ctx.translate(256, 380);
    ctx.rotate(-0.25);
    ctx.strokeStyle = 'rgba(160, 45, 35, 0.75)';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(-160, -32, 320, 64);
    ctx.font = 'bold 36px "Courier Prime", monospace';
    ctx.fillStyle = 'rgba(160, 45, 35, 0.8)';
    ctx.fillText('UNFINISHED', 0, 12);
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    this.posterTextures[index] = tex;
    return tex;
  }

  /**
   * Builds custom torn polygon geometry for torn posters (Points 5 & 6)
   */
  public static createTornPosterGeometry(w: number, h: number, seed: number): THREE.BufferGeometry {
    const rng = seededRandom(seed);
    const steps = 12;
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // Top-left, top-right
    vertices.push(-w / 2, h / 2, 0);
    uvs.push(0, 1);
    vertices.push(w / 2, h / 2, 0);
    uvs.push(1, 1);

    // Jagged bottom edge points
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = -w / 2 + t * w;
      // Irregular jagged tear at bottom
      const tearOffset = (rng() - 0.5) * 0.14 * h;
      const y = -h / 2 + tearOffset;
      vertices.push(x, y, 0);
      uvs.push(t, 0.15 + (tearOffset / h));
    }

    // Triangulate from top two vertices to the jagged bottom edge
    for (let i = 0; i < steps; i++) {
      const b1 = 2 + i;
      const b2 = 2 + i + 1;
      // Top left triangle
      indices.push(0, b1, b2);
      // Top right triangle
      indices.push(0, b2, 1);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  /**
   * Spawns physical environmental details on walls, floor, and ceiling for a corridor segment
   */
  public static populateSegment(
    segmentIndex: number,
    halfW: number,
    H: number,
    L: number,
    visualDensity: number
  ): THREE.Group {
    const group = new THREE.Group();
    const rng = seededRandom(segmentIndex * 31 + 13);

    // 1. Paper Patches taped to walls (Points 5, 7, 33)
    const numPatches = visualDensity < 0.3 ? 0 : visualDensity < 0.7 ? 1 : 2 + Math.floor(rng() * 2);
    for (let p = 0; p < numPatches; p++) {
      const side = rng() > 0.5 ? 'left' : 'right';
      const wallX = side === 'left' ? -halfW + 0.015 : halfW - 0.015;
      const rotY = side === 'left' ? Math.PI / 2 : -Math.PI / 2;

      const patchW = 0.55 + rng() * 0.35;
      const patchH = 0.45 + rng() * 0.35;
      const patchY = 1.4 + rng() * (H - 2.4);
      const patchZ = -rng() * L;

      const patchGeo = new THREE.PlaneGeometry(patchW, patchH);
      const patchMat = new THREE.MeshBasicMaterial({
        map: this.getPatchTexture(segmentIndex + p),
        side: THREE.DoubleSide,
      });

      const patchMesh = new THREE.Mesh(patchGeo, patchMat);
      patchMesh.position.set(wallX, patchY, patchZ);
      patchMesh.rotation.y = rotY;
      patchMesh.rotation.z = (rng() - 0.5) * 0.08; // slightly crooked
      group.add(patchMesh);

      // Translucent masking tape strips at 2 or 4 corners
      const tapeCorners = [
        { x: -patchW / 2 + 0.03, y: patchH / 2 - 0.03, rot: -Math.PI / 4 },
        { x: patchW / 2 - 0.03, y: patchH / 2 - 0.03, rot: Math.PI / 4 },
        { x: -patchW / 2 + 0.03, y: -patchH / 2 + 0.03, rot: Math.PI / 4 },
        { x: patchW / 2 - 0.03, y: -patchH / 2 + 0.03, rot: -Math.PI / 4 },
      ];

      const tapeGeo = new THREE.PlaneGeometry(0.08, 0.035);
      const tapeMat = this.getTapeMaterial();

      tapeCorners.forEach((tc) => {
        const tapeMesh = new THREE.Mesh(tapeGeo, tapeMat);
        tapeMesh.position.set(tc.x, tc.y, 0.003);
        tapeMesh.rotation.z = tc.rot;
        patchMesh.add(tapeMesh);
      });
    }

    // 2. Torn Exhibition Poster (Points 5, 6)
    if (rng() > 0.6 && visualDensity > 0.4) {
      const side = rng() > 0.5 ? 'left' : 'right';
      const wallX = side === 'left' ? -halfW + 0.016 : halfW - 0.016;
      const rotY = side === 'left' ? Math.PI / 2 : -Math.PI / 2;

      const posterW = 0.9;
      const posterH = 1.35;
      const posterY = 2.1 + rng() * 0.4;
      const posterZ = -0.8 - rng() * (L - 1.6);

      const posterGeo = this.createTornPosterGeometry(posterW, posterH, segmentIndex * 17);
      const posterMat = new THREE.MeshBasicMaterial({
        map: this.getPosterTexture(segmentIndex),
        side: THREE.DoubleSide,
      });

      const posterMesh = new THREE.Mesh(posterGeo, posterMat);
      posterMesh.position.set(wallX, posterY, posterZ);
      posterMesh.rotation.y = rotY;
      posterMesh.rotation.z = (rng() - 0.5) * 0.05;
      group.add(posterMesh);

      // Top tape strips holding poster
      const topTape1 = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.04), this.getTapeMaterial());
      topTape1.position.set(-posterW / 2 + 0.06, posterH / 2, 0.003);
      posterMesh.add(topTape1);

      const topTape2 = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.04), this.getTapeMaterial());
      topTape2.position.set(posterW / 2 - 0.06, posterH / 2, 0.003);
      posterMesh.add(topTape2);
    }

    // 3. Physical 3D Objects: Pencils, Erasers, Stools, Rulers, Paper Stacks (Points 16, 17)
    // Only place on select segments to keep performance crisp and gallery curated
    if (rng() > 0.45 && visualDensity > 0.3) {
      const objChoice = Math.floor(rng() * 5);
      const floorZ = -rng() * (L - 1.2);
      // Place near wall corners so player movement along center is never obstructed
      const sideSign = rng() > 0.5 ? 1 : -1;
      const floorX = sideSign * (halfW - 0.45 - rng() * 0.3);

      if (objChoice === 0) {
        // Hexagonal wooden drafting pencil on the floor
        const pencilGroup = new THREE.Group();
        const bodyGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6);
        const body = new THREE.Mesh(bodyGeo, this.getPencilWoodMaterial());
        body.rotation.z = Math.PI / 2;
        pencilGroup.add(body);

        const coneGeo = new THREE.ConeGeometry(0.012, 0.04, 6);
        const cone = new THREE.Mesh(coneGeo, this.getPencilWoodMaterial());
        cone.rotation.z = -Math.PI / 2;
        cone.position.x = 0.18;
        pencilGroup.add(cone);

        const tipGeo = new THREE.ConeGeometry(0.005, 0.015, 6);
        const tip = new THREE.Mesh(tipGeo, this.getGraphiteMaterial());
        tip.rotation.z = -Math.PI / 2;
        tip.position.x = 0.205;
        pencilGroup.add(tip);

        pencilGroup.position.set(floorX, 0.015, floorZ);
        pencilGroup.rotation.y = rng() * Math.PI * 2;
        group.add(pencilGroup);
      } else if (objChoice === 1) {
        // Block eraser with graphite smudges
        const eraserGeo = new THREE.BoxGeometry(0.12, 0.03, 0.06);
        const eraser = new THREE.Mesh(eraserGeo, this.getEraserMaterial());
        eraser.position.set(floorX, 0.015, floorZ);
        eraser.rotation.y = rng() * Math.PI * 2;
        group.add(eraser);
      } else if (objChoice === 2) {
        // Wooden drafting scale ruler
        const rulerGeo = new THREE.BoxGeometry(0.65, 0.015, 0.05);
        const ruler = new THREE.Mesh(rulerGeo, this.getPencilWoodMaterial());
        ruler.position.set(floorX, 0.01, floorZ);
        ruler.rotation.y = rng() * Math.PI * 2;
        group.add(ruler);
      } else if (objChoice === 3) {
        // Stack of discarded sketch paper sheets on floor
        const stackGroup = new THREE.Group();
        const numSheets = 3 + Math.floor(rng() * 4);
        for (let s = 0; s < numSheets; s++) {
          const sheetGeo = new THREE.PlaneGeometry(0.48, 0.65);
          const sheetMat = new THREE.MeshBasicMaterial({
            map: this.getPatchTexture((segmentIndex + s) % 4),
            side: THREE.DoubleSide,
          });
          const sheet = new THREE.Mesh(sheetGeo, sheetMat);
          sheet.rotation.x = -Math.PI / 2;
          sheet.rotation.z = (rng() - 0.5) * 0.25;
          sheet.position.set(0, s * 0.003 + 0.004, 0);
          stackGroup.add(sheet);
        }
        stackGroup.position.set(floorX, 0, floorZ);
        group.add(stackGroup);
      } else if (objChoice === 4) {
        // Rolled architectural blueprints leaning in corner
        const rollGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 12);
        const rollMat = new THREE.MeshBasicMaterial({ color: 0xded6c7 });
        const roll = new THREE.Mesh(rollGeo, rollMat);
        roll.position.set(sideSign * (halfW - 0.15), 0.42, floorZ);
        roll.rotation.z = sideSign * 0.18; // Leaning against wall
        roll.rotation.x = 0.1;
        group.add(roll);
      }
    }

    // 4. Floor Coffee Rings (Point 22)
    if (rng() > 0.7) {
      const ringGeo = new THREE.PlaneGeometry(0.4, 0.4);
      const ringMesh = new THREE.Mesh(ringGeo, this.getCoffeeStainMaterial());
      ringMesh.rotation.x = -Math.PI / 2;
      const ringX = (rng() - 0.5) * (halfW * 1.3);
      ringMesh.position.set(ringX, 0.008, -rng() * L);
      group.add(ringMesh);
    }

    // 5. Exposed Wooden Ceiling Cross-Beams (Point 21)
    if (segmentIndex % 2 === 0) {
      const beamGeo = new THREE.BoxGeometry(halfW * 2 + 0.2, 0.22, 0.28);
      const beamMesh = new THREE.Mesh(beamGeo, this.getWoodBeamMaterial());
      beamMesh.position.set(0, H - 0.11, -L / 2);
      group.add(beamMesh);

      // Hanging lamp wire down from beam center (Point 19 & 21)
      const wirePoints = [
        new THREE.Vector3(0, H - 0.22, -L / 2),
        new THREE.Vector3(0, H - 1.1, -L / 2),
      ];
      const wireGeo = new THREE.BufferGeometry().setFromPoints(wirePoints);
      const wire = new THREE.Line(
        wireGeo,
        new THREE.LineBasicMaterial({ color: 0x221c17, linewidth: 1.5 })
      );
      group.add(wire);

      // Hanging vintage bell lamp shade
      const shadeGeo = new THREE.ConeGeometry(0.22, 0.18, 12, 1, true);
      const shadeMat = new THREE.MeshBasicMaterial({
        color: 0x362f27,
        side: THREE.DoubleSide,
      });
      const shade = new THREE.Mesh(shadeGeo, shadeMat);
      shade.position.set(0, H - 1.15, -L / 2);
      group.add(shade);

      // Soft warm incandescent light bulb
      const bulbGeo = new THREE.SphereGeometry(0.045, 8, 8);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffeed2 });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(0, H - 1.2, -L / 2);
      group.add(bulb);
    }

    return group;
  }
}
