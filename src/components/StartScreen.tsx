/**
 * StartScreen: Cinematic animated architectural drawing sequence
 * Implements Prompt Point 49:
 * On first load, draws the corridor gradually onto paper:
 * white paper -> single pencil line -> perspective lines -> walls -> frames -> corridor
 * Followed by "ENTER THE GALLERY" with controls and smooth entry fade.
 */
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  onEnter: () => void;
}

export const StartScreen: React.FC<Props> = ({ onEnter }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [isEntering, setIsEntering] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let progress = 0;
    const startTime = performance.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const drawPencilLine = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      p: number,
      alpha: number = 0.55,
      width: number = 1.4
    ) => {
      if (p <= 0) return;
      const currentP = Math.min(1, p);
      const curX = x0 + (x1 - x0) * currentP;
      const curY = y0 + (y1 - y0) * currentP;

      ctx.strokeStyle = `rgba(38, 30, 24, ${alpha})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x0, y0);

      // Subtle organic hand-drawn jitter along stroke
      const steps = 12;
      for (let i = 1; i <= steps; i++) {
        const t = (i / steps) * currentP;
        const lx = x0 + (x1 - x0) * t + (Math.sin(t * 19) - 0.5) * 0.8;
        const ly = y0 + (y1 - y0) * t + (Math.cos(t * 23) - 0.5) * 0.8;
        ctx.lineTo(lx, ly);
      }
      ctx.lineTo(curX, curY);
      ctx.stroke();
    };

    const render = () => {
      animId = requestAnimationFrame(render);
      const elapsed = (performance.now() - startTime) / 1000;
      progress = Math.min(1, elapsed / 3.2);

      const w = canvas.width;
      const h = canvas.height;
      const vpx = w * 0.5;
      const vpy = h * 0.48;

      // 1. Archival Warm Paper Background
      ctx.fillStyle = '#f4eee3';
      ctx.fillRect(0, 0, w, h);

      // Subtle paper tooth grain
      ctx.fillStyle = 'rgba(50, 40, 30, 0.025)';
      for (let i = 0; i < 200; i++) {
        ctx.fillRect((i * 137.5) % w, (i * 269.3) % h, 2, 2);
      }

      // Stage 1: Single Horizon line (0.0 to 0.25)
      const p1 = Math.min(1, Math.max(0, elapsed / 0.6));
      drawPencilLine(w * 0.1, vpy, w * 0.9, vpy, p1, 0.35, 1.2);

      // Stage 2: Perspective guide lines from vanishing point (0.4 to 1.4)
      const p2 = Math.min(1, Math.max(0, (elapsed - 0.4) / 0.8));
      if (p2 > 0) {
        // Floor corners
        drawPencilLine(vpx, vpy, 0, h, p2, 0.6, 2.0);
        drawPencilLine(vpx, vpy, w, h, p2, 0.6, 2.0);
        // Ceiling corners
        drawPencilLine(vpx, vpy, 0, 0, p2, 0.45, 1.6);
        drawPencilLine(vpx, vpy, w, 0, p2, 0.45, 1.6);

        // Floor plank radiating lines
        for (let i = 1; i <= 5; i++) {
          const fx = (w / 6) * i;
          drawPencilLine(vpx, vpy, fx, h, p2, 0.25, 1.0);
        }
      }

      // Stage 3: Doorway Arches & Vertical Wall lines (1.0 to 2.0)
      const p3 = Math.min(1, Math.max(0, (elapsed - 1.0) / 0.8));
      if (p3 > 0) {
        // Portal arch in middle ground
        const archW = w * 0.28;
        const archH = h * 0.42;
        const ax0 = vpx - archW / 2;
        const ax1 = vpx + archW / 2;
        const ay0 = vpy + archH * 0.45;
        const ay1 = vpy - archH * 0.55;

        drawPencilLine(ax0, ay0, ax0, ay1 + archW / 4, p3, 0.65, 2.2);
        drawPencilLine(ax1, ay0, ax1, ay1 + archW / 4, p3, 0.65, 2.2);

        // Roman arch curve
        if (p3 > 0.4) {
          ctx.strokeStyle = 'rgba(38, 30, 24, 0.65)';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.arc(vpx, ay1 + archW / 4, archW / 2, Math.PI, Math.PI + Math.PI * Math.min(1, (p3 - 0.4) * 1.6), false);
          ctx.stroke();
        }
      }

      // Stage 4: Framed Artworks on walls (1.6 to 2.6)
      const p4 = Math.min(1, Math.max(0, (elapsed - 1.6) / 0.8));
      if (p4 > 0) {
        // Left frame
        const lx = w * 0.16;
        const ly = h * 0.5;
        const fw = w * 0.12;
        const fh = h * 0.22;
        drawPencilLine(lx, ly - fh / 2, lx + fw, ly - fh / 2, p4, 0.7, 2.0);
        drawPencilLine(lx + fw, ly - fh / 2, lx + fw, ly + fh / 2, p4, 0.7, 2.0);
        drawPencilLine(lx + fw, ly + fh / 2, lx, ly + fh / 2, p4, 0.7, 2.0);
        drawPencilLine(lx, ly + fh / 2, lx, ly - fh / 2, p4, 0.7, 2.0);

        // Right frame
        const rx = w * 0.72;
        drawPencilLine(rx, ly - fh / 2, rx + fw, ly - fh / 2, p4, 0.7, 2.0);
        drawPencilLine(rx + fw, ly - fh / 2, rx + fw, ly + fh / 2, p4, 0.7, 2.0);
        drawPencilLine(rx + fw, ly + fh / 2, rx, ly + fh / 2, p4, 0.7, 2.0);
        drawPencilLine(rx, ly + fh / 2, rx, ly - fh / 2, p4, 0.7, 2.0);

        // Subtle cross-hatching inside frame
        if (p4 > 0.6) {
          ctx.strokeStyle = 'rgba(45, 36, 28, 0.2)';
          ctx.lineWidth = 1.0;
          for (let y = ly - fh / 2 + 10; y < ly + fh / 2; y += 14) {
            ctx.beginPath();
            ctx.moveTo(lx + 8, y);
            ctx.lineTo(lx + fw - 8, y + 6);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(rx + 8, y);
            ctx.lineTo(rx + fw - 8, y + 6);
            ctx.stroke();
          }
        }
      }

      // Show UI controls when drawing reaches completion
      if (elapsed > 2.2 && !showControls) {
        setShowControls(true);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [showControls]);

  const handleStart = () => {
    setIsEntering(true);
    setTimeout(() => {
      onEnter();
    }, 700);
  };

  return (
    <div
      id="start-screen"
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center select-none transition-all duration-700 ${
        isEntering ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Architectural Canvas Animation */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
      />

      {/* Foreground Curatorial Card */}
      <div
        className={`relative z-10 flex max-w-lg flex-col items-center border border-[#362e27] bg-[#f4eee3]/90 backdrop-blur-[2px] p-8 text-center sm:p-12 shadow-[0_12px_40px_rgba(40,32,24,0.08)] transition-all duration-1000 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Architectural corner marks */}
        <div className="pointer-events-none absolute -left-2 -top-2 h-4 w-4 border-l-2 border-t-2 border-[#362e27]" />
        <div className="pointer-events-none absolute -right-2 -top-2 h-4 w-4 border-r-2 border-t-2 border-[#362e27]" />
        <div className="pointer-events-none absolute -bottom-2 -left-2 h-4 w-4 border-b-2 border-l-2 border-[#362e27]" />
        <div className="pointer-events-none absolute -bottom-2 -right-2 h-4 w-4 border-b-2 border-r-2 border-[#362e27]" />

        {/* Curatorial Annotation */}
        <p className="font-['Architects_Daughter'] text-xs tracking-[0.25em] text-[#6d6153] uppercase">
          Plate I · Abandoned Architectural Sketchbook
        </p>

        {/* Title */}
        <h1 className="mt-3 font-['Playfair_Display'] text-3xl font-semibold tracking-wider text-[#211b17] sm:text-4xl">
          ENTER THE GALLERY
        </h1>

        <div className="my-5 h-[1px] w-24 bg-[#362e27]/40" />

        {/* Movement Controls */}
        <div className="space-y-1.5 font-['Courier_Prime'] text-xs tracking-wider text-[#493f35]">
          <p>W A S D / ARROW KEYS — WALK</p>
          <p>MOUSE / DRAG — LOOK</p>
          <p className="text-[11px] text-[#786b5e]">CLICK ARTWORKS TO INSPECT</p>
        </div>

        {/* Enter Button */}
        <button
          id="btn-enter-gallery"
          onClick={handleStart}
          className="group relative mt-7 cursor-pointer border border-[#2b2520] bg-transparent px-8 py-3 font-['Courier_Prime'] text-sm font-bold tracking-[0.2em] text-[#211b17] uppercase transition-all duration-200 hover:bg-[#211b17] hover:text-[#f4eee3] active:scale-98"
        >
          [ ENTER ]
        </button>

        <p className="mt-7 font-['Architects_Daughter'] text-[11px] text-[#7f7365]">
          Infinite 3D corridor reconstructed from graphite drawings
        </p>
      </div>
    </div>
  );
};
