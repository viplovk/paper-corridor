/**
 * GalleryHUD: Minimalist architectural sketch-style interface:
 * - Real-time gallery meter, pace counter, and corridor portal number
 * - Chapter progression indicator (Pure Graphite, Heavy Graphite, Erased, etc.)
 * - Sprinting / Walking status badge
 * - Dedicated MOUSE LOOK toggle control
 * - "CLICK TO LOOK" subtle hint when mouse look is active but pointer is not locked
 * - Sound mute/unmute control
 * - Pause and Reset position buttons
 * - Mobile on-screen thumb buttons (Walk Forward / Backward / Lateral)
 */
import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, HelpCircle, Pause, Play, RotateCcw, Compass, Zap } from 'lucide-react';
import { galleryAudio } from '../utils/audioSystem';

interface Props {
  distanceWalked: number;
  stepCount: number;
  isPaused: boolean;
  isMouseLook: boolean;
  isPointerLocked: boolean;
  isSprinting?: boolean;
  currentChapter?: { number: number; name: string };
  currentPortalNumber?: number;
  onTogglePause: () => void;
  onToggleMouseLook: () => void;
  onResetPosition: () => void;
  onMobileMove: (dir: { x: number; y: number }) => void;
}

export const GalleryHUD: React.FC<Props> = ({
  distanceWalked,
  stepCount,
  isPaused,
  isMouseLook,
  isPointerLocked,
  isSprinting = false,
  currentChapter = { number: 1, name: 'Pure Graphite' },
  currentPortalNumber = 1,
  onTogglePause,
  onToggleMouseLook,
  onResetPosition,
  onMobileMove,
}) => {
  const [showControlsHint, setShowControlsHint] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(galleryAudio.getIsMuted());
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  // Auto-hide controls hint after 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControlsHint(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleToggleSound = () => {
    const muted = galleryAudio.toggleMute();
    setIsMuted(muted);
  };

  const romanNumerals = ['I', 'II', 'III', 'IV', 'V'];
  const chapterRoman = romanNumerals[currentChapter.number - 1] || `${currentChapter.number}`;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 select-none sm:p-6">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between">
        {/* Gallery Meter, Chapter & Portal number */}
        <div
          id="gallery-stats-badge"
          className="pointer-events-auto border border-[#3b332b] bg-[#f5efe4]/95 px-3.5 py-2 shadow-xs backdrop-blur-xs"
        >
          <div className="flex items-center gap-2">
            <span className="font-['Courier_Prime'] text-[11px] font-bold tracking-widest text-[#26201b] uppercase">
              {distanceWalked.toFixed(1)} M · {stepCount} PACES
            </span>
            {isSprinting && (
              <span className="flex items-center gap-0.5 rounded-xs bg-[#2b2520] px-1.5 py-0.5 font-['Courier_Prime'] text-[9px] font-semibold tracking-wider text-[#f5efe4] uppercase">
                <Zap className="h-2.5 w-2.5" /> SPRINT
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="font-['Architects_Daughter'] text-[11px] text-[#524538]">
              Portal #{String(currentPortalNumber).padStart(3, '0')} · Chapter {chapterRoman}: {currentChapter.name}
            </p>
          </div>
        </div>

        {/* Center Hint: CLICK TO LOOK (shown when Mouse Look is ON but Pointer Lock is released) */}
        {isMouseLook && !isPointerLocked && !isTouchDevice && (
          <div
            id="hint-click-to-look"
            className="pointer-events-none border border-dashed border-[#554b41] bg-[#f5efe4]/90 px-3.5 py-1.5 text-center shadow-xs"
          >
            <p className="font-['Courier_Prime'] text-[11px] font-bold tracking-widest text-[#2c2621] uppercase">
              CLICK CANVAS TO LOOK
            </p>
          </div>
        )}

        {/* Minimal Control Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Mouse Look Toggle Button */}
          <button
            id="btn-toggle-mouse-look"
            onClick={onToggleMouseLook}
            className="flex items-center gap-1.5 border border-[#3b332b] bg-[#f5efe4]/95 px-2.5 py-1.5 font-['Courier_Prime'] text-[11px] font-bold tracking-wider text-[#26201b] uppercase transition-colors hover:bg-[#26201b] hover:text-[#f5efe4]"
            title="Toggle Mouse Look (Pointer Lock)"
          >
            <span>MOUSE LOOK</span>
            <span className="font-mono text-xs">
              {isMouseLook ? 'ON ●' : 'OFF ○'}
            </span>
          </button>

          {/* Pause / Play */}
          <button
            id="btn-toggle-pause"
            onClick={onTogglePause}
            className="flex h-8 w-8 items-center justify-center border border-[#3b332b] bg-[#f5efe4]/95 text-[#2b2520] transition-colors hover:bg-[#2b2520] hover:text-[#f5efe4]"
            title={isPaused ? 'Resume Walking (Space)' : 'Pause Walking (Space)'}
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </button>

          {/* Mute / Unmute */}
          <button
            id="btn-toggle-sound"
            onClick={handleToggleSound}
            className="flex h-8 w-8 items-center justify-center border border-[#3b332b] bg-[#f5efe4]/95 text-[#2b2520] transition-colors hover:bg-[#2b2520] hover:text-[#f5efe4]"
            title={isMuted ? 'Unmute footsteps & ambience' : 'Mute sound'}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>

          {/* Reset position to start of gallery */}
          <button
            id="btn-reset-pos"
            onClick={onResetPosition}
            className="flex h-8 w-8 items-center justify-center border border-[#3b332b] bg-[#f5efe4]/95 text-[#2b2520] transition-colors hover:bg-[#2b2520] hover:text-[#f5efe4]"
            title="Return to gallery origin"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Help / Controls toggle */}
          <button
            id="btn-toggle-help"
            onClick={() => setShowControlsHint(!showControlsHint)}
            className="flex h-8 w-8 items-center justify-center border border-[#3b332b] bg-[#f5efe4]/95 text-[#2b2520] transition-colors hover:bg-[#2b2520] hover:text-[#f5efe4]"
            title="Show / hide controls guide"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Center Controls Hint (Auto-fades out, clickable to dismiss or re-open) */}
      {showControlsHint && (
        <div
          id="controls-hint-card"
          className="pointer-events-auto mx-auto my-auto max-w-sm border border-[#3b332b] bg-[#f5efe4]/95 p-4 text-center shadow-lg transition-opacity duration-500 backdrop-blur-xs"
          onClick={() => setShowControlsHint(false)}
        >
          <div className="border border-dashed border-[#5d5246] p-3.5">
            <p className="font-['Playfair_Display'] text-sm font-semibold tracking-wide text-[#26201b]">
              Gallery Navigation
            </p>
            <div className="mt-2 space-y-1 font-['Courier_Prime'] text-[11px] text-[#4d4237]">
              <p>W / ↑ : Walk forward</p>
              <p>Shift + W : Sprint forward</p>
              <p>S / ↓ : Walk backward</p>
              <p>A / D : Strafe left / right</p>
              <p>Mouse Look : Click canvas to steer perspective</p>
              <p>Space : Pause / unpause</p>
              <p>Click artwork : Inspect closely</p>
            </div>
            <p className="mt-3 font-['Architects_Daughter'] text-[10px] text-[#7d7062]">
              [ click to dismiss ]
            </p>
          </div>
        </div>
      )}

      {/* Bottom Area: Mobile Touch Controls (Walk Forward / Backward / Lateral) & Vanishing Point Legend */}
      <div className="flex items-end justify-between">
        {isTouchDevice ? (
          <div className="pointer-events-auto flex gap-2">
            <button
              id="mobile-btn-left"
              onTouchStart={() => onMobileMove({ x: -1, y: 0 })}
              onTouchEnd={() => onMobileMove({ x: 0, y: 0 })}
              className="flex h-12 w-12 items-center justify-center border border-[#3b332b] bg-[#f5efe4]/90 font-['Courier_Prime'] text-sm font-bold text-[#2b2520] active:bg-[#2b2520] active:text-[#f5efe4]"
            >
              ←
            </button>
            <div className="flex flex-col gap-1">
              <button
                id="mobile-btn-forward"
                onTouchStart={() => onMobileMove({ x: 0, y: 1 })}
                onTouchEnd={() => onMobileMove({ x: 0, y: 0 })}
                className="flex h-12 w-14 items-center justify-center border border-[#3b332b] bg-[#f5efe4]/90 font-['Courier_Prime'] text-sm font-bold text-[#2b2520] active:bg-[#2b2520] active:text-[#f5efe4]"
              >
                WALK
              </button>
              <button
                id="mobile-btn-backward"
                onTouchStart={() => onMobileMove({ x: 0, y: -1 })}
                onTouchEnd={() => onMobileMove({ x: 0, y: 0 })}
                className="flex h-10 w-14 items-center justify-center border border-[#3b332b] bg-[#f5efe4]/90 font-['Courier_Prime'] text-xs font-bold text-[#2b2520] active:bg-[#2b2520] active:text-[#f5efe4]"
              >
                BACK
              </button>
            </div>
            <button
              id="mobile-btn-right"
              onTouchStart={() => onMobileMove({ x: 1, y: 0 })}
              onTouchEnd={() => onMobileMove({ x: 0, y: 0 })}
              className="flex h-12 w-12 items-center justify-center border border-[#3b332b] bg-[#f5efe4]/90 font-['Courier_Prime'] text-sm font-bold text-[#2b2520] active:bg-[#2b2520] active:text-[#f5efe4]"
            >
              →
            </button>
          </div>
        ) : (
          <div className="pointer-events-none hidden items-center gap-1.5 font-['Architects_Daughter'] text-xs text-[#726658] sm:flex">
            <Compass className="h-3.5 w-3.5" />
            <span>Central vanishing point · Hand-drafted infinite perspective</span>
          </div>
        )}

        {/* Status indicator */}
        <div className="text-right font-['Courier_Prime'] text-[10px] text-[#7a6f63]">
          {isPaused ? (
            <span className="font-bold text-[#a13b2c]">[ PAUSED ]</span>
          ) : (
            <span>PENCIL GRAPHITE ENGINE · 60 FPS</span>
          )}
        </div>
      </div>
    </div>
  );
};
