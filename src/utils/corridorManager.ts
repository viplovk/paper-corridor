/**
 * CorridorManager: Fixed Segment Pool Continuous Streaming Engine.
 *
 * Implements strict architecture requirements:
 * - FORWARD = NEGATIVE Z, BACKWARD = POSITIVE Z
 * - SEGMENT_LENGTH = 12
 * - SEGMENT_COUNT = 16
 * - FORWARD_BUFFER = 72
 * - RECYCLE_MARGIN = 36
 *
 * Visual Chapters Engine:
 * - Chapter 1: Pure Graphite (thin fine lines, pristine paper)
 * - Chapter 2: Heavy Graphite (4B/6B dense cross-hatching, deep charcoal)
 * - Chapter 3: Erased (eraser smudges, chalk rubs, ghost architectural outlines)
 * - Chapter 4: Architectural Blueprint (dimension lines, "5.2m", protractors)
 * - Chapter 5: Abstract (impossible vanishing perspective angles)
 *
 * Proximity Artwork Interaction & Story Moments:
 * - Giant Unfinished Colonnade Mural at segment 8
 * - Reflective Mirror Frame at segment 14
 * - Automatic proximity reaction sound & vibration
 */
import * as THREE from 'three';
import { CorridorSegment, SegmentConfig } from '../components/CorridorSegment';
import { ArtworkData, createMirrorSurfaceTexture } from './proceduralArtworks';
import {
  createChapterWallTexture,
  createFloorPlanksWithMarksTexture,
  createGiantUnfinishedSketchTexture,
} from './sketchTextures';
import { PUBLIC_DOMAIN_ARTWORKS, loadWebArtwork } from './webArtworks';

export const SEGMENT_LENGTH = 12;
export const SEGMENT_COUNT = 16;
export const FORWARD_BUFFER = 72;
export const RECYCLE_MARGIN = 36;

export class CorridorManager {
  public segments: CorridorSegment[] = [];
  public segmentWidth: number = 5.6;
  public segmentHeight: number = 5.2;

  private nextSegmentCounter: number = 0;
  private entranceVestibuleGroup: THREE.Group | null = null;

  // Cached chapter wall materials
  private chapterWallMaterials: THREE.MeshStandardMaterial[] = [];
  private floorMarkMaterials: THREE.MeshStandardMaterial[] = [];

  constructor(
    scene: THREE.Scene,
    artworkLibrary: ArtworkData[],
    floorMat: THREE.Material,
    wallMat: THREE.Material,
    ceilingMat: THREE.Material,
    frameMat: THREE.Material,
    pencilLineMat: THREE.LineBasicMaterial,
    archMat: THREE.Material
  ) {
    // 1. Pre-generate Chapter Materials
    for (let ch = 1; ch <= 5; ch++) {
      const tex = createChapterWallTexture(ch);
      tex.repeat.set(3, 1);
      this.chapterWallMaterials.push(
        new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.95,
          metalness: 0.0,
        })
      );
    }

    for (let f = 0; f < 5; f++) {
      const fTex = createFloorPlanksWithMarksTexture(f);
      fTex.repeat.set(1, 2.0);
      this.floorMarkMaterials.push(
        new THREE.MeshStandardMaterial({
          map: fTex,
          roughness: 0.9,
          metalness: 0.0,
        })
      );
    }

    // 2. Build initial entrance vestibule covering z in [0, 6] to prevent blank space at startup
    this.buildEntranceVestibule(
      scene,
      floorMat,
      wallMat,
      ceilingMat,
      frameMat,
      pencilLineMat,
      archMat,
      artworkLibrary[0]
    );

    // 3. Initialize the 16-segment fixed pool from z = 0 to z = -180
    this.initSegmentPool(
      scene,
      artworkLibrary,
      floorMat,
      wallMat,
      ceilingMat,
      frameMat,
      pencilLineMat,
      archMat
    );

    // 4. Asynchronously preload and pencil-convert museum masterworks into artworkLibrary
    PUBLIC_DOMAIN_ARTWORKS.forEach((source) => {
      loadWebArtwork(source, (processedArt) => {
        artworkLibrary.push(processedArt);
      });
    });
  }

  /**
   * Returns current chapter information based on player's position along negative Z axis.
   * Every 4 segments (48 meters) advances to a new chapter.
   */
  public getCurrentChapter(cameraZ: number): { number: number; name: string } {
    const distance = Math.max(0, -cameraZ);
    const chapterIndex = Math.floor(distance / (SEGMENT_LENGTH * 4));
    const chapterNum = (chapterIndex % 5) + 1;

    const names = [
      'Pure Graphite',
      'Heavy Graphite',
      'Erased & Faded',
      'Architectural Blueprint',
      'Abstract Perspective',
    ];

    return {
      number: chapterNum,
      name: names[chapterNum - 1],
    };
  }

  /**
   * Helper: returns the segment with the smallest Z (furthest ahead into negative Z).
   */
  public getFrontmostSegment(): CorridorSegment {
    let frontmost = this.segments[0];
    for (let i = 1; i < this.segments.length; i++) {
      if (this.segments[i].position.z < frontmost.position.z) {
        frontmost = this.segments[i];
      }
    }
    return frontmost;
  }

  /**
   * Helper: returns the segment with the largest Z (furthest behind player in positive Z).
   */
  public getBackmostSegment(): CorridorSegment {
    let backmost = this.segments[0];
    for (let i = 1; i < this.segments.length; i++) {
      if (this.segments[i].position.z > backmost.position.z) {
        backmost = this.segments[i];
      }
    }
    return backmost;
  }

  /**
   * Initializes 16 contiguous segments:
   * Segment 0  = z = 0
   * Segment 1  = z = -12
   * ...
   * Segment 15 = z = -180
   */
  private initSegmentPool(
    scene: THREE.Scene,
    artworkLibrary: ArtworkData[],
    floorMat: THREE.Material,
    wallMat: THREE.Material,
    ceilingMat: THREE.Material,
    frameMat: THREE.Material,
    pencilLineMat: THREE.LineBasicMaterial,
    archMat: THREE.Material
  ) {
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const zStart = -i * SEGMENT_LENGTH;

      // Select pair of artworks from library
      const artOffset = (i * 2) % artworkLibrary.length;
      const leftArts = [artworkLibrary[artOffset]];
      const rightArts = [artworkLibrary[(artOffset + 1) % artworkLibrary.length]];

      const config: SegmentConfig = {
        length: SEGMENT_LENGTH,
        width: this.segmentWidth,
        height: this.segmentHeight,
        leftArtworks: leftArts,
        rightArtworks: rightArts,
      };

      // Chapter-specific material assignment
      const chNum = (Math.floor(i / 4) % 5) + 1;
      const chWallMat = this.chapterWallMaterials[chNum - 1] || wallMat;
      const chFloorMat = this.floorMarkMaterials[i % this.floorMarkMaterials.length] || floorMat;

      const segment = new CorridorSegment(
        config,
        chFloorMat,
        chWallMat,
        ceilingMat,
        frameMat,
        pencilLineMat,
        archMat
      );

      segment.segmentIndex = i;
      segment.setZPosition(zStart);
      scene.add(segment.group);
      this.segments.push(segment);
    }

    this.nextSegmentCounter = SEGMENT_COUNT;
  }

  /**
   * Entrance Vestibule: Spans z from 0 to +5.5.
   * Gives the visitor a solid starting room with a back wall and museum dedication plaque.
   */
  private buildEntranceVestibule(
    scene: THREE.Scene,
    floorMat: THREE.Material,
    wallMat: THREE.Material,
    ceilingMat: THREE.Material,
    frameMat: THREE.Material,
    pencilLineMat: THREE.LineBasicMaterial,
    archMat: THREE.Material,
    sampleArt: ArtworkData
  ) {
    const vestGroup = new THREE.Group();
    const halfW = this.segmentWidth / 2;
    const H = this.segmentHeight;
    const vestLength = 6.0;

    // Floor (z = 0 to +6)
    const floorGeo = new THREE.PlaneGeometry(this.segmentWidth, vestLength);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, vestLength / 2);
    floorMesh.receiveShadow = true;
    vestGroup.add(floorMesh);

    // Ceiling (z = 0 to +6)
    const ceilingGeo = new THREE.PlaneGeometry(this.segmentWidth, vestLength);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(0, H, vestLength / 2);
    vestGroup.add(ceilingMesh);

    // Left Wall
    const leftWallGeo = new THREE.PlaneGeometry(vestLength, H);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-halfW, H / 2, vestLength / 2);
    vestGroup.add(leftWall);

    // Right Wall
    const rightWallGeo = new THREE.PlaneGeometry(vestLength, H);
    const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(halfW, H / 2, vestLength / 2);
    vestGroup.add(rightWall);

    // Back Wall at z = +vestLength (facing -Z into gallery)
    const backWallGeo = new THREE.PlaneGeometry(this.segmentWidth, H);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.rotation.y = Math.PI;
    backWall.position.set(0, H / 2, vestLength);
    vestGroup.add(backWall);

    // Entrance Dedication Plaque on back wall
    const plaqueGeo = new THREE.PlaneGeometry(2.4, 1.2);
    const plaqueMat = new THREE.MeshBasicMaterial({
      map: sampleArt.placardTexture,
      toneMapped: false,
    });
    const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaque.rotation.y = Math.PI;
    plaque.position.set(0, 2.5, vestLength - 0.05);
    vestGroup.add(plaque);

    // Contour pencil lines along vestibule corners
    const vestCorners = [
      { x: -halfW, y: 0.01 },
      { x: halfW, y: 0.01 },
      { x: -halfW, y: H - 0.01 },
      { x: halfW, y: H - 0.01 },
    ];
    vestCorners.forEach((c) => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(c.x, c.y, 0),
        new THREE.Vector3(c.x, c.y, vestLength),
      ]);
      vestGroup.add(new THREE.Line(lineGeo, pencilLineMat));
    });

    scene.add(vestGroup);
    this.entranceVestibuleGroup = vestGroup;
  }

  /**
   * Continuous Forward Buffer Update:
   * Called every animation frame.
   */
  public update(
    cameraZ: number,
    artworkLibrary: ArtworkData[],
    cameraPos?: THREE.Vector3,
    delta: number = 0.016
  ) {
    // 1. Calculate frontmost Z (smallest Z, most negative)
    let frontmostZ = Math.min(...this.segments.map((segment) => segment.position.z));
    let distanceToFront = Math.abs(cameraZ - frontmostZ);

    // 2. Continuous Forward Buffer Loop:
    let forwardRecycles = 0;
    while (distanceToFront < FORWARD_BUFFER && forwardRecycles < SEGMENT_COUNT) {
      const backmost = this.getBackmostSegment();
      const frontmost = this.getFrontmostSegment();

      // STRICT RULE: New segment must always be positioned relative to the CURRENT FRONTMOST SEGMENT
      const newZ = frontmost.position.z - SEGMENT_LENGTH;
      backmost.setZPosition(newZ);
      backmost.segmentIndex = this.nextSegmentCounter++;

      // Cycle fresh procedural artworks from library
      const artIdx = Math.abs(backmost.segmentIndex * 2) % artworkLibrary.length;
      let leftArt = artworkLibrary[artIdx];
      let rightArt = artworkLibrary[(artIdx + 1) % artworkLibrary.length];

      // Special moment: segment 8 has Giant Colonnade Mural
      if (backmost.segmentIndex === 8) {
        const muralTex = createGiantUnfinishedSketchTexture();
        leftArt = {
          ...leftArt,
          title: 'Study for Colonnade (Unfinished Mural)',
          artist: 'Master Architect',
          year: '1924',
          medium: 'Architectural charcoal on wall plaster',
          texture: muralTex,
        };
      }
      // Special moment: segment 14 has Mirror Section
      else if (backmost.segmentIndex === 14) {
        const mirrorTex = createMirrorSurfaceTexture();
        rightArt = {
          ...rightArt,
          title: 'The Speculum (Pencil Reflection)',
          artist: 'Corridor Phenomenon',
          year: 'Present',
          medium: 'Silvered plate and graphite drawing',
          texture: mirrorTex,
        };
      }

      backmost.updateArtworks([leftArt], [rightArt]);

      // Apply chapter theming to walls and floors
      const chNum = (Math.floor(Math.abs(newZ) / (SEGMENT_LENGTH * 4)) % 5) + 1;
      const chWallMat = this.chapterWallMaterials[chNum - 1];
      const chFloorMat = this.floorMarkMaterials[backmost.segmentIndex % this.floorMarkMaterials.length];

      if (backmost.leftWallMesh && chWallMat) backmost.leftWallMesh.material = chWallMat;
      if (backmost.rightWallMesh && chWallMat) backmost.rightWallMesh.material = chWallMat;
      if (backmost.floorMesh && chFloorMat) backmost.floorMesh.material = chFloorMat;

      // Recalculate frontmost Z and distanceToFront
      frontmostZ = Math.min(...this.segments.map((segment) => segment.position.z));
      distanceToFront = Math.abs(cameraZ - frontmostZ);

      forwardRecycles++;
    }

    // 3. Reverse Walking Buffer Support:
    let backmostZ = Math.max(...this.segments.map((segment) => segment.position.z));
    let distanceToBack = Math.abs(backmostZ - cameraZ);

    let reverseRecycles = 0;
    while (
      cameraZ < -24 &&
      distanceToBack < RECYCLE_MARGIN &&
      distanceToFront > FORWARD_BUFFER + SEGMENT_LENGTH * 2 &&
      reverseRecycles < SEGMENT_COUNT
    ) {
      const currentFront = this.getFrontmostSegment();
      const currentBack = this.getBackmostSegment();

      const newZ = currentBack.position.z + SEGMENT_LENGTH;
      currentFront.setZPosition(newZ);
      currentFront.segmentIndex = --this.nextSegmentCounter;

      const artIdx = Math.abs(currentFront.segmentIndex * 2) % artworkLibrary.length;
      const leftArt = artworkLibrary[artIdx];
      const rightArt = artworkLibrary[(artIdx + 1) % artworkLibrary.length];
      currentFront.updateArtworks([leftArt], [rightArt]);

      // Recalculate
      backmostZ = Math.max(...this.segments.map((segment) => segment.position.z));
      distanceToBack = Math.abs(backmostZ - cameraZ);

      frontmostZ = Math.min(...this.segments.map((segment) => segment.position.z));
      distanceToFront = Math.abs(cameraZ - frontmostZ);

      reverseRecycles++;
    }

    // 4. Proximity reaction check on active nearby segments
    if (cameraPos) {
      this.segments.forEach((seg) => {
        const segDist = Math.abs(seg.position.z - cameraZ);
        if (segDist < SEGMENT_LENGTH * 1.5) {
          seg.checkProximityReaction(cameraPos, delta);
        }
      });
    }
  }

  /**
   * Gathers all candidate interactive meshes for raycast inspection
   */
  public getInteractiveArtworks() {
    const list: {
      mesh: THREE.Mesh;
      artwork: ArtworkData;
      worldPos: THREE.Vector3;
    }[] = [];

    this.segments.forEach((seg) => {
      seg.interactiveArtworks.forEach((item) => {
        list.push(item);
      });
    });

    return list;
  }
}
