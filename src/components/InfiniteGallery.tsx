/**
 * InfiniteGallery: The core Three.js 3D WebGL runtime.
 * Reconstructs the infinite hand-drawn gallery corridor from the user sketch:
 * - Forward direction is strictly negative Z (W -> -Z, S -> +Z)
 * - Managed CorridorSegment circular buffer via CorridorManager
 * - Seamless dynamic recycling outside visible fog frustum (zero popping)
 * - Explicit Mouse Look toggle with native Pointer Lock API
 * - Physically real walking camera with synchronized head bobbing and audio
 * - Procedural artworks and click inspection modal
 * - Speed-reactive graphite dust, footstep disturbance puffs, and hand-drawn player shadow
 * - Chapter progression and portal numbering
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CorridorManager } from '../utils/corridorManager';
import { PlayerController } from '../hooks/useWalkingController';
import {
  createFloorSketchTexture,
  createWallSketchTexture,
  createCeilingSketchTexture,
} from '../utils/sketchTextures';
import { getArtworkLibrary, ArtworkData } from '../utils/proceduralArtworks';
import { GraphiteDust } from './GraphiteDust';
import { FloatingPaperSheets } from './FloatingPaperSheets';
import { galleryAudio } from '../utils/audioSystem';
import { StartScreen } from './StartScreen';
import { GalleryHUD } from './GalleryHUD';
import { ArtworkInspectModal } from './ArtworkInspectModal';
import { SketchCanvasOverlay } from './SketchCanvasOverlay';

export const InfiniteGallery: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerController | null>(null);
  const corridorManagerRef = useRef<CorridorManager | null>(null);

  // App & Experience state
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [distanceWalked, setDistanceWalked] = useState<number>(0);
  const [stepCount, setStepCount] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMouseLook, setIsMouseLook] = useState<boolean>(true);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);
  const [inspectedArtwork, setInspectedArtwork] = useState<ArtworkData | null>(null);
  const [isSprinting, setIsSprinting] = useState<boolean>(false);
  const [speedFactor, setSpeedFactor] = useState<number>(0);
  const [currentChapter, setCurrentChapter] = useState<{ number: number; name: string }>({
    number: 1,
    name: 'Pure Graphite',
  });
  const [currentPortalNumber, setCurrentPortalNumber] = useState<number>(1);

  // References for Raycasting click inspection
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mousePointer = useRef(new THREE.Vector2());

  // Handle start button click
  const handleStart = () => {
    galleryAudio.init();
    galleryAudio.resume();
    setHasStarted(true);

    // Request pointer lock if mouse look enabled
    if (playerRef.current?.isMouseLookEnabled && containerRef.current) {
      const canvas = containerRef.current.querySelector('canvas');
      canvas?.requestPointerLock?.();
    }
  };

  // Toggle Mouse Look
  const handleToggleMouseLook = useCallback(() => {
    if (playerRef.current) {
      const enabled = playerRef.current.toggleMouseLook();
      setIsMouseLook(enabled);
    }
  }, []);

  // Pause toggle
  const handleTogglePause = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.isPaused = !playerRef.current.isPaused;
      setIsPaused(playerRef.current.isPaused);
    }
  }, []);

  // Reset to initial origin
  const handleResetPosition = useCallback(() => {
    if (playerRef.current && cameraRef.current) {
      playerRef.current.position.set(0, 1.75, 4.0);
      playerRef.current.velocity.set(0, 0, 0);
      playerRef.current.yaw = 0;
      playerRef.current.pitch = 0;
    }
  }, []);

  // Mobile movement input
  const handleMobileMove = useCallback((dir: { x: number; y: number }) => {
    if (playerRef.current) {
      playerRef.current.touchMoveVector = dir;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Warm Paper Environment
    const scene = new THREE.Scene();
    const paperColor = 0xf4eee3; // Archival paper tone
    scene.background = new THREE.Color(paperColor);

    // Atmospheric pencil depth fog: far corridor dissolves into the paper background
    // Fog starts at 38m and fully obscures at 68m, safely within the 72m+ continuous corridor buffer!
    scene.fog = new THREE.Fog(paperColor, 38, 68);

    // 2. Camera: Wide architectural field of view (56°) matching the sketch vanishing point
    const fov = 56;
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 180);
    cameraRef.current = camera;
    scene.add(camera);

    // 3. WebGL Renderer with smooth tone-mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Monochrome Architectural Lighting
    const ambientLight = new THREE.AmbientLight(0xf8f4eb, 1.15);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfffbf2, 0.65);
    dirLight1.position.set(0, 12, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xeddcc8, 0.4);
    dirLight2.position.set(0, 10, -30);
    scene.add(dirLight2);

    // 5. Shared Procedural Materials (reused across all segments to minimize draw calls)
    const floorTex = createFloorSketchTexture();
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(1, 2.0);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.9,
      metalness: 0.0,
    });

    const wallTex = createWallSketchTexture();
    wallTex.wrapS = THREE.RepeatWrapping;
    wallTex.wrapT = THREE.RepeatWrapping;
    wallTex.repeat.set(3, 1);
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.95,
      metalness: 0.0,
    });

    const ceilingTex = createCeilingSketchTexture();
    ceilingTex.wrapS = THREE.RepeatWrapping;
    ceilingTex.wrapT = THREE.RepeatWrapping;
    ceilingTex.repeat.set(1, 2.0);
    const ceilingMat = new THREE.MeshStandardMaterial({
      map: ceilingTex,
      roughness: 0.95,
      metalness: 0.0,
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x221d19,
      roughness: 0.85,
      metalness: 0.05,
    });

    const archMat = new THREE.MeshStandardMaterial({
      color: 0xf2ece1,
      roughness: 0.95,
      metalness: 0.0,
    });

    const pencilLineMat = new THREE.LineBasicMaterial({
      color: 0x1e1916,
      linewidth: 2,
    });

    // 6. Artwork Library
    const artworks = getArtworkLibrary();

    // 7. Circular Buffer Corridor Manager
    const corridorManager = new CorridorManager(
      scene,
      artworks,
      floorMat,
      wallMat,
      ceilingMat,
      frameMat,
      pencilLineMat,
      archMat
    );
    corridorManagerRef.current = corridorManager;

    // 8. Graphite Dust Particle System (Atmospheric + Footstep puffs + Player shadow)
    const dust = new GraphiteDust();
    scene.add(dust.group);

    // 8b. Floating Paper Sheets Tumbling through Corridor Air (Point 29)
    const floatingPaper = new FloatingPaperSheets();
    scene.add(floatingPaper.group);

    // 9. Player Controller (starts at z = 4.0 looking forward towards negative Z)
    const player = new PlayerController(camera, 4.0);
    playerRef.current = player;

    // Hook footstep puff to player footsteps
    player.onFootstep = (footPos) => {
      dust.spawnFootstepPuff(footPos, player.yaw);
    };

    // 10. Pointer Lock & Mouse Look Event Binding
    const canvas = renderer.domElement;

    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === canvas;
      player.isPointerLocked = locked;
      setIsPointerLocked(locked);
    };
    document.addEventListener('pointerlockchange', onPointerLockChange);

    // Canvas click handling
    let pointerDownPos = { x: 0, y: 0 };
    const onMouseDown = (e: MouseEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      player.handleMouseDown(e);
    };

    const onMouseUp = (e: MouseEvent) => {
      player.handleMouseUp();

      // Check if this was a click (not a camera drag)
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist < 6) {
        // If mouse look is enabled and pointer is not locked, request pointer lock
        if (player.isMouseLookEnabled && !player.isPointerLocked) {
          canvas.requestPointerLock?.();
        }

        // Raycast candidate artworks for inspection
        const rect = canvas.getBoundingClientRect();
        mousePointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mousePointer.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.current.setFromCamera(mousePointer.current, camera);

        const activeArtworks = corridorManager.getInteractiveArtworks();
        const candidateMeshes = activeArtworks.map((item) => item.mesh);

        const intersects = raycaster.current.intersectObjects(candidateMeshes, false);
        if (intersects.length > 0) {
          const hit = intersects[0];
          const found = activeArtworks.find((item) => item.mesh === hit.object);
          if (found && hit.distance < 14.0) {
            // Free pointer lock during close inspection modal
            if (document.pointerLockElement) {
              document.exitPointerLock();
            }
            setInspectedArtwork(found.artwork);
          }
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      player.handleMouseMove(e);
    };

    // Touch look on mobile
    let touchStartLook = { x: 0, y: 0 };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartLook = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && playerRef.current) {
        const dx = e.touches[0].clientX - touchStartLook.x;
        const dy = e.touches[0].clientY - touchStartLook.y;
        touchStartLook = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        // If touching right 65% of screen, control look
        if (e.touches[0].clientX > window.innerWidth * 0.35) {
          playerRef.current.handleTouchLook(dx, dy);
        }
      }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });

    // 11. Responsive Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 12. Main 60 FPS Animation Loop
    const clock = new THREE.Clock();
    let animId: number;
    let syncThrottle = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);
      player.update(delta);

      const playerZ = player.position.z;

      // Dynamic corridor segment recycling & proximity reaction
      corridorManager.update(playerZ, artworks, player.position, delta);

      // Update ambient graphite dust, footstep puffs, and player shadow
      dust.update(delta, player.position, player.speedFactor);

      // Update tumbling floating sketch paper sheets
      floatingPaper.update(delta, player.position, player.speedFactor);

      // Throttle React state updates to ~15fps to keep rendering at solid 60 FPS
      syncThrottle += delta;
      if (syncThrottle > 0.065) {
        syncThrottle = 0;
        setDistanceWalked(player.distanceWalked);
        setStepCount(player.stepCount);
        setIsSprinting(player.isSprinting);
        setSpeedFactor(player.speedFactor);

        const ch = corridorManager.getCurrentChapter(playerZ);
        setCurrentChapter(ch);

        const portalNum = Math.max(1, Math.floor(Math.abs(playerZ) / 12) + 1);
        setCurrentPortalNumber(portalNum);
      }

      // Render scene
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      player.destroy();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#f4eee3]">
      {/* 3D WebGL Canvas Container */}
      <div
        id="infinite-gallery-canvas-container"
        ref={containerRef}
        className="absolute inset-0 h-full w-full cursor-crosshair active:cursor-grabbing"
      />

      {/* Living Sketch & Paper Texture Overlay */}
      <SketchCanvasOverlay
        subtleJitter={true}
        speedFactor={speedFactor}
        isSprinting={isSprinting}
      />

      {/* Opening Minimal Start Screen */}
      {!hasStarted && <StartScreen onEnter={handleStart} />}

      {/* Minimal Pencil HUD */}
      {hasStarted && (
        <GalleryHUD
          distanceWalked={distanceWalked}
          stepCount={stepCount}
          isPaused={isPaused}
          isMouseLook={isMouseLook}
          isPointerLocked={isPointerLocked}
          isSprinting={isSprinting}
          currentChapter={currentChapter}
          currentPortalNumber={currentPortalNumber}
          onTogglePause={handleTogglePause}
          onToggleMouseLook={handleToggleMouseLook}
          onResetPosition={handleResetPosition}
          onMobileMove={handleMobileMove}
        />
      )}

      {/* Artwork Inspection Modal */}
      {inspectedArtwork && (
        <ArtworkInspectModal
          artwork={inspectedArtwork}
          onClose={() => setInspectedArtwork(null)}
        />
      )}
    </div>
  );
};
