/**
 * CorridorSegment: A modular 3D corridor segment of length L (12 meters).
 * Follows the coordinate convention:
 * - Local Z spans from 0 to -L (negative Z is forward)
 * - Contains floor planks, walls, high ceiling with track lights,
 *   arched doorway portal at z = -L, and framed artworks with museum placards.
 * 
 * Enhancements:
 * - Corridor numbering on doorway arch portal (Enhancement 12)
 * - Handwritten annotations beside artworks (Enhancement 11)
 * - The Artist's Presence physical objects (pencil, eraser, ruler, coffee ring) (Enhancement 20)
 * - Artwork proximity reaction (Enhancement 04)
 * - Special segment moments (Giant unfinished sketch, mirror section) (Enhancements 21, 23)
 */
import * as THREE from 'three';
import {
  ArtworkData,
  createWallAnnotationTexture,
  createMirrorSurfaceTexture,
} from '../utils/proceduralArtworks';
import {
  createDoorwayArchTexture,
  createGiantUnfinishedSketchTexture,
  createAbstractPaperWorldTexture,
} from '../utils/sketchTextures';
import { CrackSystem } from '../utils/crackSystem';
import { EnvironmentalDetails } from '../utils/environmentalDetails';
import { galleryAudio } from '../utils/audioSystem';

export interface SegmentConfig {
  length: number; // 12
  width: number;  // 5.6
  height: number; // 5.2
  leftArtworks: ArtworkData[];
  rightArtworks: ArtworkData[];
}

export class CorridorSegment {
  public group: THREE.Group;
  public zStart: number = 0;
  public length: number;
  public width: number;
  public height: number;
  public segmentIndex: number = 0;

  // Cached artwork meshes for dynamic recycling and click inspection
  public leftCanvasMeshes: THREE.Mesh[] = [];
  public leftPlacardMeshes: THREE.Mesh[] = [];
  public rightCanvasMeshes: THREE.Mesh[] = [];
  public rightPlacardMeshes: THREE.Mesh[] = [];

  // Wall Annotation Meshes
  public leftAnnotationMesh: THREE.Mesh | null = null;
  public rightAnnotationMesh: THREE.Mesh | null = null;

  // Doorway arch number plaque
  public archNumberMesh: THREE.Mesh | null = null;

  // Artist presence group (pencil, eraser, ruler, coffee ring)
  private artistPresenceGroup: THREE.Group | null = null;

  // Atmospheric environmental & damage layers
  private damageGroup: THREE.Group = new THREE.Group();
  private envDetailsGroup: THREE.Group = new THREE.Group();
  private windowGroup: THREE.Group = new THREE.Group();

  // Floor and Wall meshes for chapter theming
  public floorMesh: THREE.Mesh | null = null;
  public leftWallMesh: THREE.Mesh | null = null;
  public rightWallMesh: THREE.Mesh | null = null;

  // Special moment meshes
  private specialGroup: THREE.Group | null = null;

  // Proximity sound tracking
  private isNearArtwork: boolean = false;

  public interactiveArtworks: {
    mesh: THREE.Mesh;
    artwork: ArtworkData;
    worldPos: THREE.Vector3;
  }[] = [];

  // Convenience getter matching specification: segment.position.z
  public get position(): THREE.Vector3 {
    return this.group.position;
  }

  constructor(
    config: SegmentConfig,
    floorMaterial: THREE.Material,
    wallMaterial: THREE.Material,
    ceilingMaterial: THREE.Material,
    frameMaterial: THREE.Material,
    pencilLineMaterial: THREE.LineBasicMaterial,
    archMaterial: THREE.Material
  ) {
    this.length = config.length;
    this.width = config.width;
    this.height = config.height;

    this.group = new THREE.Group();
    this.buildGeometry(
      floorMaterial,
      wallMaterial,
      ceilingMaterial,
      frameMaterial,
      pencilLineMaterial,
      archMaterial,
      config.leftArtworks,
      config.rightArtworks
    );
  }

  private buildGeometry(
    floorMaterial: THREE.Material,
    wallMaterial: THREE.Material,
    ceilingMaterial: THREE.Material,
    frameMaterial: THREE.Material,
    pencilLineMaterial: THREE.LineBasicMaterial,
    archMaterial: THREE.Material,
    leftArtworks: ArtworkData[],
    rightArtworks: ArtworkData[]
  ) {
    const halfW = this.width / 2;
    const L = this.length;
    const H = this.height;

    // 1. Floor Plane (Facing Up +Y, spanning z = 0 to z = -L)
    const floorGeo = new THREE.PlaneGeometry(this.width, L, 1, 1);
    this.floorMesh = new THREE.Mesh(floorGeo, floorMaterial);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.set(0, 0, -L / 2);
    this.floorMesh.receiveShadow = true;
    this.group.add(this.floorMesh);

    // 2. Ceiling Plane (Facing Down -Y, spanning z = 0 to z = -L)
    const ceilingGeo = new THREE.PlaneGeometry(this.width, L, 1, 1);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMaterial);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(0, H, -L / 2);
    this.group.add(ceilingMesh);

    // 3. Left Wall (Facing +X, spanning z = 0 to z = -L)
    const leftWallGeo = new THREE.PlaneGeometry(L, H, 1, 1);
    this.leftWallMesh = new THREE.Mesh(leftWallGeo, wallMaterial);
    this.leftWallMesh.rotation.y = Math.PI / 2;
    this.leftWallMesh.position.set(-halfW, H / 2, -L / 2);
    this.group.add(this.leftWallMesh);

    // 4. Right Wall (Facing -X, spanning z = 0 to z = -L)
    const rightWallGeo = new THREE.PlaneGeometry(L, H, 1, 1);
    this.rightWallMesh = new THREE.Mesh(rightWallGeo, wallMaterial);
    this.rightWallMesh.rotation.y = -Math.PI / 2;
    this.rightWallMesh.position.set(halfW, H / 2, -L / 2);
    this.group.add(this.rightWallMesh);

    // 5. Perspective Contour Lines (along corners from z = 0 to z = -L)
    this.addPerspectiveContourLines(halfW, H, L, pencilLineMaterial);

    // 6. Suspended Track Lighting down center (from z = 0 to z = -L)
    this.addTrackLighting(H, L, frameMaterial, pencilLineMaterial);

    // 7. Arched Doorway Portal at z = -L (flush boundary)
    this.addArchedDoorway(halfW, H, L, archMaterial, pencilLineMaterial);

    // 8. Framed Artworks on Left and Right Walls (centered at z = -L / 2 = -6)
    this.addWallArtworks(halfW, L, frameMaterial, leftArtworks, rightArtworks);

    // 9. Artist's Presence physical objects
    this.artistPresenceGroup = new THREE.Group();
    this.group.add(this.artistPresenceGroup);
    this.updateArtistPresence(this.segmentIndex);

    // 10. Architectural Damage, Paper Patches, and Window Moments
    this.group.add(this.damageGroup);
    this.group.add(this.envDetailsGroup);
    this.group.add(this.windowGroup);
    this.updateAtmosphere(this.segmentIndex);
  }

  // Bold graphite lines along structural corners with subtle organic hand-drawn deviation
  private addPerspectiveContourLines(
    halfW: number,
    H: number,
    L: number,
    material: THREE.LineBasicMaterial
  ) {
    const corners = [
      { x: -halfW, y: 0.01 },       // Floor-left
      { x: halfW, y: 0.01 },        // Floor-right
      { x: -halfW, y: H - 0.01 },   // Ceiling-left
      { x: halfW, y: H - 0.01 },    // Ceiling-right
    ];

    corners.forEach((c) => {
      const points: THREE.Vector3[] = [];
      const steps = 12;
      for (let s = 0; s <= steps; s++) {
        const z = -(s / steps) * L;
        const jx = Math.sin(s * 3.7) * 0.007;
        const jy = Math.cos(s * 4.1) * 0.007;
        points.push(new THREE.Vector3(c.x + jx, c.y + jy, z));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeo, material);
      this.group.add(line);
    });
  }

  // Ceiling track wire and hanging bell lamps matching sketch
  private addTrackLighting(
    H: number,
    L: number,
    frameMaterial: THREE.Material,
    pencilLineMaterial: THREE.LineBasicMaterial
  ) {
    const trackY = H - 0.15;

    // Center suspension cable from 0 to -L
    const cablePoints = [
      new THREE.Vector3(0, trackY, 0),
      new THREE.Vector3(0, trackY, -L),
    ];
    const cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
    const cable = new THREE.Line(cableGeo, pencilLineMaterial);
    this.group.add(cable);

    // Secondary parallel wire (double-stroke style in sketch)
    const cable2Points = [
      new THREE.Vector3(0.06, trackY, 0),
      new THREE.Vector3(0.06, trackY, -L),
    ];
    const cable2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cable2Points), pencilLineMaterial);
    this.group.add(cable2);

    const lampSpacing = 6.0;
    const numLamps = Math.floor(L / lampSpacing);

    const bellGeo = new THREE.ConeGeometry(0.18, 0.32, 8, 1, true);
    bellGeo.rotateX(Math.PI);

    for (let i = 0; i < numLamps; i++) {
      const zPos = -(3.0 + i * lampSpacing);

      const cordPoints = [
        new THREE.Vector3(0, trackY, zPos),
        new THREE.Vector3(0, trackY - 0.45, zPos),
      ];
      const cord = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cordPoints), pencilLineMaterial);
      this.group.add(cord);

      const bellMesh = new THREE.Mesh(bellGeo, frameMaterial);
      bellMesh.position.set(0, trackY - 0.45 - 0.16, zPos);
      this.group.add(bellMesh);

      const rimGeo = new THREE.RingGeometry(0.16, 0.19, 12);
      rimGeo.rotateX(-Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, frameMaterial);
      rimMesh.position.set(0, trackY - 0.45 - 0.32, zPos);
      this.group.add(rimMesh);
    }
  }

  // Arched doorway portal at z = -L with corridor number keystone
  private addArchedDoorway(
    halfW: number,
    H: number,
    L: number,
    archMaterial: THREE.Material,
    pencilLineMaterial: THREE.LineBasicMaterial
  ) {
    const jambDepth = 0.35;
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, -L + jambDepth / 2);

    const archW = 4.2;
    const archH = 4.4;
    const springH = 3.0;
    const radius = archW / 2;
    const jambWidth = (this.width - archW) / 2;

    // Left arch column
    const leftJambGeo = new THREE.BoxGeometry(jambWidth, springH, jambDepth);
    const leftJamb = new THREE.Mesh(leftJambGeo, archMaterial);
    leftJamb.position.set(-halfW + jambWidth / 2, springH / 2, 0);
    archGroup.add(leftJamb);

    // Right arch column
    const rightJambGeo = new THREE.BoxGeometry(jambWidth, springH, jambDepth);
    const rightJamb = new THREE.Mesh(rightJambGeo, archMaterial);
    rightJamb.position.set(halfW - jambWidth / 2, springH / 2, 0);
    archGroup.add(rightJamb);

    // Top wall above arch curve up to ceiling
    const topWallGeo = new THREE.BoxGeometry(this.width, H - archH, jambDepth);
    const topWall = new THREE.Mesh(topWallGeo, archMaterial);
    topWall.position.set(0, archH + (H - archH) / 2, 0);
    archGroup.add(topWall);

    // Left & right spandrel fillers
    const spandrelW = (this.width - archW) / 2;
    const spandrelH = archH - springH;
    const leftSpandrelGeo = new THREE.BoxGeometry(spandrelW, spandrelH, jambDepth);
    const leftSpandrel = new THREE.Mesh(leftSpandrelGeo, archMaterial);
    leftSpandrel.position.set(-halfW + spandrelW / 2, springH + spandrelH / 2, 0);
    archGroup.add(leftSpandrel);

    const rightSpandrelGeo = new THREE.BoxGeometry(spandrelW, spandrelH, jambDepth);
    const rightSpandrel = new THREE.Mesh(rightSpandrelGeo, archMaterial);
    rightSpandrel.position.set(halfW - spandrelW / 2, springH + spandrelH / 2, 0);
    archGroup.add(rightSpandrel);

    // Curved Roman arch outline
    const archCurvePoints: THREE.Vector3[] = [];
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI;
      const x = -Math.cos(theta) * radius;
      const y = springH + Math.sin(theta) * radius;
      archCurvePoints.push(new THREE.Vector3(x, y, -jambDepth / 2));
    }
    const archCurve = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(archCurvePoints),
      pencilLineMaterial
    );
    archGroup.add(archCurve);

    // Outer arch concentric bevel line
    const outerArchPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI;
      const x = -Math.cos(theta) * (radius + 0.12);
      const y = springH + Math.sin(theta) * (radius + 0.12);
      outerArchPoints.push(new THREE.Vector3(x, y, -jambDepth / 2));
    }
    const outerArch = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(outerArchPoints),
      pencilLineMaterial
    );
    archGroup.add(outerArch);

    // Corridor Numbering Keystone Plaque (Enhancement 12)
    const plaqueGeo = new THREE.PlaneGeometry(1.2, 0.55);
    const plaqueTex = createDoorwayArchTexture(this.segmentIndex + 1);
    const plaqueMat = new THREE.MeshBasicMaterial({
      map: plaqueTex,
      toneMapped: false,
    });
    this.archNumberMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
    // Positioned directly on the keystone center above the arch curve
    this.archNumberMesh.position.set(0, archH + 0.28, -jambDepth / 2 - 0.005);
    archGroup.add(this.archNumberMesh);

    this.group.add(archGroup);
  }

  // Update arch number when recycled
  public updateDoorwayNumber(num: number) {
    if (this.archNumberMesh) {
      const tex = createDoorwayArchTexture(num);
      (this.archNumberMesh.material as THREE.MeshBasicMaterial).map = tex;
      (this.archNumberMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
    }
  }

  // Framed Artworks on Left and Right Walls (centered at z = -L / 2)
  private addWallArtworks(
    halfW: number,
    L: number,
    frameMaterial: THREE.Material,
    leftArtworks: ArtworkData[],
    rightArtworks: ArtworkData[]
  ) {
    const artEyeY = 2.4;
    const artZ = -L / 2;

    // Left wall artwork
    if (leftArtworks[0]) {
      const display = this.createArtworkDisplay(
        leftArtworks[0],
        -halfW + 0.05,
        artEyeY,
        artZ,
        Math.PI / 2,
        frameMaterial,
        'left'
      );
      this.leftCanvasMeshes.push(display.canvasMesh);
      this.leftPlacardMeshes.push(display.placardMesh);
    }

    // Right wall artwork
    if (rightArtworks[0]) {
      const display = this.createArtworkDisplay(
        rightArtworks[0],
        halfW - 0.05,
        artEyeY,
        artZ,
        -Math.PI / 2,
        frameMaterial,
        'right'
      );
      this.rightCanvasMeshes.push(display.canvasMesh);
      this.rightPlacardMeshes.push(display.placardMesh);
    }
  }

  private createArtworkDisplay(
    artwork: ArtworkData,
    x: number,
    y: number,
    z: number,
    rotationY: number,
    frameMaterial: THREE.Material,
    side: 'left' | 'right'
  ) {
    const artGroup = new THREE.Group();
    artGroup.position.set(x, y, z);
    artGroup.rotation.y = rotationY;

    const frameW = 2.4;
    const frameH = 2.4;
    const frameDepth = 0.08;
    const borderThickness = 0.14;

    // Frame variations based on segment & side (Points 10, 13, 14, 15)
    const frameStyle = (this.segmentIndex * 3 + (side === 'left' ? 0 : 2)) % 5;

    // 1. Outer Frame (varied by style)
    if (frameStyle === 2) {
      // Frameless taped sketch: raw sheet of paper held with 4 corner tape strips
      const tapeCorners = [
        { x: -frameW / 2 + 0.06, y: frameH / 2 - 0.04, rot: -Math.PI / 4 },
        { x: frameW / 2 - 0.06, y: frameH / 2 - 0.04, rot: Math.PI / 4 },
        { x: -frameW / 2 + 0.06, y: -frameH / 2 + 0.04, rot: Math.PI / 4 },
        { x: frameW / 2 - 0.06, y: -frameH / 2 + 0.04, rot: -Math.PI / 4 },
      ];
      tapeCorners.forEach((tc) => {
        const tapeMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(0.16, 0.05),
          EnvironmentalDetails.getTapeMaterial()
        );
        tapeMesh.position.set(tc.x, tc.y, 0.025);
        tapeMesh.rotation.z = tc.rot;
        artGroup.add(tapeMesh);
      });
    } else if (frameStyle === 3) {
      // Hand-drawn double-line border on wall plaster
      const borderPoints = [
        new THREE.Vector3(-frameW / 2, -frameH / 2, 0.005),
        new THREE.Vector3(frameW / 2, -frameH / 2, 0.005),
        new THREE.Vector3(frameW / 2, frameH / 2, 0.005),
        new THREE.Vector3(-frameW / 2, frameH / 2, 0.005),
        new THREE.Vector3(-frameW / 2, -frameH / 2, 0.005),
      ];
      const borderLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(borderPoints),
        new THREE.LineBasicMaterial({ color: 0x2b241e, linewidth: 2 })
      );
      artGroup.add(borderLine);
    } else {
      // Standard or weathered frame
      const frameOuterGeo = new THREE.BoxGeometry(frameW, frameH, frameDepth);
      const frameOuter = new THREE.Mesh(frameOuterGeo, frameMaterial);
      frameOuter.position.z = frameDepth / 2;
      artGroup.add(frameOuter);

      if (frameStyle === 4) {
        // Slightly crooked frame (aged gallery feel)
        artGroup.rotation.z = (Math.sin(this.segmentIndex * 1.7) * 0.035);
      }
    }

    // 2. Artwork Canvas Inset
    const canvasW = frameW - borderThickness * 2;
    const canvasH = frameH - borderThickness * 2;
    const canvasGeo = new THREE.PlaneGeometry(canvasW, canvasH);
    const canvasMat = new THREE.MeshBasicMaterial({
      map: artwork.texture,
      toneMapped: false,
    });
    const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
    canvasMesh.position.z = frameDepth + 0.005;
    artGroup.add(canvasMesh);

    // 3. Hanging cord / nail wire
    const nailPoints = [
      new THREE.Vector3(-0.4, frameH / 2, 0),
      new THREE.Vector3(0, frameH / 2 + 0.3, 0),
      new THREE.Vector3(0.4, frameH / 2, 0),
    ];
    const nailLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(nailPoints),
      new THREE.LineBasicMaterial({ color: 0x332e29, linewidth: 1.5 })
    );
    artGroup.add(nailLine);

    // 4. Museum Title Placard pinned below frame
    const placardW = 0.85;
    const placardH = 0.3;
    const placardGeo = new THREE.PlaneGeometry(placardW, placardH);
    const placardMat = new THREE.MeshBasicMaterial({
      map: artwork.placardTexture,
      toneMapped: false,
    });
    const placardMesh = new THREE.Mesh(placardGeo, placardMat);
    placardMesh.position.set(0, -frameH / 2 - 0.28, frameDepth / 2);
    artGroup.add(placardMesh);

    // 5. Handwritten Annotation beside artwork on the wall plaster (Enhancement 11)
    const annotations = [
      'study #07',
      'unfinished',
      'remember this',
      'perspective test',
      'observe closely',
      'version 03',
      "don't erase",
      '04:32',
      'study in graphite',
    ];
    const noteText = annotations[(this.segmentIndex * 2 + (side === 'left' ? 0 : 1)) % annotations.length];
    const noteTex = createWallAnnotationTexture(noteText);
    const noteGeo = new THREE.PlaneGeometry(1.0, 0.45);
    const noteMat = new THREE.MeshBasicMaterial({
      map: noteTex,
      transparent: true,
      depthWrite: false,
    });
    const noteMesh = new THREE.Mesh(noteGeo, noteMat);
    // Positioned to the side of the framed artwork
    const noteOffsetX = side === 'left' ? frameW / 2 + 0.65 : -(frameW / 2 + 0.65);
    noteMesh.position.set(noteOffsetX, 0.1, 0.01);
    artGroup.add(noteMesh);

    if (side === 'left') {
      this.leftAnnotationMesh = noteMesh;
    } else {
      this.rightAnnotationMesh = noteMesh;
    }

    // Drop shadow plane
    const shadowGeo = new THREE.PlaneGeometry(frameW + 0.15, frameH + 0.15);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x221d19,
      transparent: true,
      opacity: 0.12,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0.04, -0.04, -0.002);
    artGroup.add(shadowMesh);

    this.group.add(artGroup);

    this.interactiveArtworks.push({
      mesh: canvasMesh,
      artwork,
      worldPos: new THREE.Vector3(x, y, z),
    });

    return { canvasMesh, placardMesh };
  }

  // The Artist's Presence physical objects (Enhancement 20)
  public updateArtistPresence(segmentIndex: number) {
    if (!this.artistPresenceGroup) return;

    // Clear existing presence items
    while (this.artistPresenceGroup.children.length > 0) {
      this.artistPresenceGroup.remove(this.artistPresenceGroup.children[0]);
    }

    const type = segmentIndex % 6;
    const halfW = this.width / 2;

    // 1. A physical wooden graphite pencil on the floor
    if (type === 1) {
      const pencilGroup = new THREE.Group();
      pencilGroup.position.set(-halfW + 0.65, 0.025, -6.5);
      pencilGroup.rotation.y = 0.38;

      // Hexagonal yellow wood body
      const bodyGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.28, 6);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcaa34d, roughness: 0.8 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.z = Math.PI / 2;
      pencilGroup.add(body);

      // Sharpened cedar wood cone
      const coneGeo = new THREE.ConeGeometry(0.015, 0.045, 6);
      const coneMat = new THREE.MeshStandardMaterial({ color: 0xd8c29d, roughness: 0.9 });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.rotation.z = -Math.PI / 2;
      cone.position.set(0.16, 0, 0);
      pencilGroup.add(cone);

      // Black graphite tip
      const tipGeo = new THREE.ConeGeometry(0.006, 0.018, 6);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0x181410 });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.rotation.z = -Math.PI / 2;
      tip.position.set(0.185, 0, 0);
      pencilGroup.add(tip);

      this.artistPresenceGroup.add(pencilGroup);
    }
    // 2. A rubber block eraser on the floor with graphite smudges
    else if (type === 3) {
      const eraserGeo = new THREE.BoxGeometry(0.14, 0.035, 0.08);
      const eraserMat = new THREE.MeshStandardMaterial({ color: 0xe6ded2, roughness: 0.95 });
      const eraser = new THREE.Mesh(eraserGeo, eraserMat);
      eraser.position.set(halfW - 0.7, 0.018, -4.8);
      eraser.rotation.y = -0.45;
      this.artistPresenceGroup.add(eraser);
    }
    // 3. A circular coffee cup ring stain decal on the floor
    else if (type === 4) {
      const coffeeCanvas = document.createElement('canvas');
      coffeeCanvas.width = 128;
      coffeeCanvas.height = 128;
      const cCtx = coffeeCanvas.getContext('2d')!;
      cCtx.strokeStyle = 'rgba(75, 52, 35, 0.45)';
      cCtx.lineWidth = 4.0;
      cCtx.beginPath();
      cCtx.arc(64, 64, 45, 0, Math.PI * 2);
      cCtx.stroke();
      // Coffee drop splatters
      cCtx.fillStyle = 'rgba(75, 52, 35, 0.4)';
      cCtx.beginPath();
      cCtx.arc(114, 70, 3.5, 0, Math.PI * 2);
      cCtx.arc(28, 92, 2.5, 0, Math.PI * 2);
      cCtx.fill();

      const coffeeTex = new THREE.CanvasTexture(coffeeCanvas);
      const coffeeGeo = new THREE.PlaneGeometry(0.45, 0.45);
      const coffeeMat = new THREE.MeshBasicMaterial({
        map: coffeeTex,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });
      const coffeeMesh = new THREE.Mesh(coffeeGeo, coffeeMat);
      coffeeMesh.rotation.x = -Math.PI / 2;
      coffeeMesh.position.set(0.4, 0.016, -7.2);
      this.artistPresenceGroup.add(coffeeMesh);
    }
    // 4. Wooden architectural drafting ruler
    else if (type === 5) {
      const rulerGeo = new THREE.BoxGeometry(0.65, 0.008, 0.06);
      const rulerMat = new THREE.MeshStandardMaterial({ color: 0xc8b79d, roughness: 0.85 });
      const ruler = new THREE.Mesh(rulerGeo, rulerMat);
      ruler.position.set(-0.8, 0.015, -3.6);
      ruler.rotation.y = 0.22;
      this.artistPresenceGroup.add(ruler);
    }
  }

  // Artwork Proximity Reaction: triggers subtle stroke jitter and soft pencil scratch audio
  public checkProximityReaction(cameraPos: THREE.Vector3, delta: number) {
    const worldArtPos = new THREE.Vector3();
    let closestDist = 999;

    this.interactiveArtworks.forEach((item) => {
      item.mesh.getWorldPosition(worldArtPos);
      const dist = cameraPos.distanceTo(worldArtPos);
      if (dist < closestDist) {
        closestDist = dist;
      }

      // If user is standing close to artwork (< 3.5m), apply subtle living pencil vibration
      if (dist < 3.5) {
        const jitter = Math.sin(performance.now() * 0.008) * 0.002;
        item.mesh.position.z = 0.08 + 0.005 + jitter;
      } else {
        item.mesh.position.z = 0.08 + 0.005;
      }
    });

    if (closestDist < 3.2 && !this.isNearArtwork) {
      this.isNearArtwork = true;
      galleryAudio.playPencilScratch();
    } else if (closestDist >= 3.6) {
      this.isNearArtwork = false;
    }
  }

  // Dynamic recycling: update artwork textures without re-creating geometries
  public updateArtworks(leftArts: ArtworkData[], rightArts: ArtworkData[]) {
    this.interactiveArtworks = [];

    // Left artwork
    if (this.leftCanvasMeshes[0] && leftArts[0]) {
      const mesh = this.leftCanvasMeshes[0];
      (mesh.material as THREE.MeshBasicMaterial).map = leftArts[0].texture;
      (mesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
      if (this.leftPlacardMeshes[0]) {
        (this.leftPlacardMeshes[0].material as THREE.MeshBasicMaterial).map = leftArts[0].placardTexture;
        (this.leftPlacardMeshes[0].material as THREE.MeshBasicMaterial).needsUpdate = true;
      }
      this.interactiveArtworks.push({
        mesh,
        artwork: leftArts[0],
        worldPos: new THREE.Vector3(),
      });
    }

    // Right artwork
    if (this.rightCanvasMeshes[0] && rightArts[0]) {
      const mesh = this.rightCanvasMeshes[0];
      (mesh.material as THREE.MeshBasicMaterial).map = rightArts[0].texture;
      (mesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
      if (this.rightPlacardMeshes[0]) {
        (this.rightPlacardMeshes[0].material as THREE.MeshBasicMaterial).map = rightArts[0].placardTexture;
        (this.rightPlacardMeshes[0].material as THREE.MeshBasicMaterial).needsUpdate = true;
      }
      this.interactiveArtworks.push({
        mesh,
        artwork: rightArts[0],
        worldPos: new THREE.Vector3(),
      });
    }

    // Update Doorway Arch Number
    this.updateDoorwayNumber(this.segmentIndex + 1);

    // Update physical artist presence items
    this.updateArtistPresence(this.segmentIndex);

    // Update environmental damage, paper patches, and window openings
    this.updateAtmosphere(this.segmentIndex);
  }

  // Updates architectural damage, paper patches, and window moments
  public updateAtmosphere(segmentIndex: number) {
    const halfW = this.width / 2;
    const H = this.height;
    const L = this.length;

    // Calculate deterministic visual density
    const seed = Math.abs(segmentIndex * 19.37 + 5.11);
    const density = Math.abs((Math.sin(seed) * 43758.5453) % 1);

    // 1. Update Damage (branching cracks, chipped plaster)
    while (this.damageGroup.children.length > 0) {
      this.damageGroup.remove(this.damageGroup.children[0]);
    }
    const damage = CrackSystem.generateSegmentDamage(segmentIndex, halfW, H, L, density);
    this.damageGroup.add(damage);

    // 2. Update Environmental Details (patches, posters, rulers, paper stacks)
    while (this.envDetailsGroup.children.length > 0) {
      this.envDetailsGroup.remove(this.envDetailsGroup.children[0]);
    }
    const env = EnvironmentalDetails.populateSegment(segmentIndex, halfW, H, L, density);
    this.envDetailsGroup.add(env);

    // 3. Window / Outside Paper World (Point 20: on select segments e.g. index % 8 === 6)
    while (this.windowGroup.children.length > 0) {
      this.windowGroup.remove(this.windowGroup.children[0]);
    }

    if (segmentIndex % 8 === 6) {
      const windowArch = new THREE.Group();
      const winW = 2.4;
      const winH = 3.6;
      const winY = 2.4;
      const winZ = -L / 2;

      // Outer window opening outline on right wall
      const framePoints: THREE.Vector3[] = [];
      const steps = 16;
      // Arch curve at top
      for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * Math.PI;
        const x = winZ + Math.cos(theta) * (winW / 2);
        const y = winY + winH / 2 - winW / 2 + Math.sin(theta) * (winW / 2);
        framePoints.push(new THREE.Vector3(halfW - 0.005, y, x));
      }
      // Straight sides down to sill
      framePoints.push(new THREE.Vector3(halfW - 0.005, winY - winH / 2, winZ - winW / 2));
      framePoints.push(new THREE.Vector3(halfW - 0.005, winY - winH / 2, winZ + winW / 2));
      framePoints.push(framePoints[0]);

      const frameGeo = new THREE.BufferGeometry().setFromPoints(framePoints);
      const frameLine = new THREE.Line(
        frameGeo,
        new THREE.LineBasicMaterial({ color: 0x221c17, linewidth: 2.5 })
      );
      windowArch.add(frameLine);

      // Deep external plane showing the infinite abstract paper world outside
      const outsideGeo = new THREE.PlaneGeometry(8.0, 7.0);
      const outsideMat = new THREE.MeshBasicMaterial({
        map: createAbstractPaperWorldTexture(),
        side: THREE.DoubleSide,
      });
      const outsideMesh = new THREE.Mesh(outsideGeo, outsideMat);
      // Positioned 4.5m outside the right wall
      outsideMesh.position.set(halfW + 4.5, winY + 0.5, winZ);
      outsideMesh.rotation.y = -Math.PI / 2;
      windowArch.add(outsideMesh);

      this.windowGroup.add(windowArch);
    }
  }

  // Reposition this entire corridor segment along Z axis
  public setZPosition(z: number) {
    this.zStart = z;
    this.group.position.z = z;
  }
}
