/**
 * SketchCanvasOverlay: Adds living pencil sketch micro-details
 * directly over the WebGL canvas:
 * - Subtle organic paper texture and fibrous grain
 * - Living pencil line jitter modulated by walking/sprinting speedFactor
 * - Architectural drafting frame with corner registration tick crosses (+)
 * - Warm antique sketchbook vignette
 */
import React, { useEffect, useRef } from 'react';

interface Props {
  subtleJitter?: boolean;
  speedFactor?: number;
  isSprinting?: boolean;
}

export const SketchCanvasOverlay: React.FC<Props> = ({
  subtleJitter = true,
  speedFactor = 0,
  isSprinting = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speedFactor);
  const sprintRef = useRef(isSprinting);

  useEffect(() => {
    speedRef.current = speedFactor;
    sprintRef.current = isSprinting;
  }, [speedFactor, isSprinting]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let animationFrameId: number;
    let frameCount = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Pre-render a fine paper noise tile
    const tileSize = 256;
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = tileSize;
    noiseCanvas.height = tileSize;
    const nCtx = noiseCanvas.getContext('2d')!;
    const nData = nCtx.createImageData(tileSize, tileSize);
    for (let i = 0; i < nData.data.length; i += 4) {
      const v = 240 + (Math.random() - 0.5) * 20;
      nData.data[i] = v;
      nData.data[i + 1] = v - 4;
      nData.data[i + 2] = v - 10;
      nData.data[i + 3] = 18; // translucent paper fibers
    }
    nCtx.putImageData(nData, 0, 0);

    const render = () => {
      frameCount++;
      const w = canvas.width;
      const h = canvas.height;
      const currentSpeed = speedRef.current;
      const currentSprint = sprintRef.current;

      ctx.clearRect(0, 0, w, h);

      // 1. Subtle Paper Texture Wash
      const pattern = ctx.createPattern(noiseCanvas, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, w, h);
      }

      // 2. Soft Edge Vignette (Antique sketchbook page edges)
      const grad = ctx.createRadialGradient(
        w / 2,
        h / 2,
        Math.min(w, h) * 0.38,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.78
      );
      grad.addColorStop(0, 'rgba(244, 238, 227, 0)');
      grad.addColorStop(1, 'rgba(40, 32, 25, 0.14)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 3. Living Architectural Border Frame with Corner Crosses (Enhancement 01 & 16)
      if (subtleJitter) {
        // Line jitter intensity scales smoothly with walking speed
        const jitterAmp = 0.5 + currentSpeed * (currentSprint ? 2.5 : 1.2);
        const jx = (Math.sin(frameCount * 0.25) + (Math.random() - 0.5) * 0.5) * jitterAmp;
        const jy = (Math.cos(frameCount * 0.31) + (Math.random() - 0.5) * 0.5) * jitterAmp;

        const pad = 16;
        const x1 = pad + jx;
        const y1 = pad + jy;
        const x2 = w - pad + jx;
        const y2 = h - pad + jy;
        const crossExt = 14; // How far the line extends past corners like a drafting sketch

        ctx.strokeStyle = `rgba(32, 26, 20, ${0.12 + currentSpeed * 0.08})`;
        ctx.lineWidth = 1.2;

        // Top line
        ctx.beginPath();
        ctx.moveTo(x1 - crossExt, y1);
        ctx.lineTo(x2 + crossExt, y1);
        ctx.stroke();

        // Bottom line
        ctx.beginPath();
        ctx.moveTo(x1 - crossExt, y2);
        ctx.lineTo(x2 + crossExt, y2);
        ctx.stroke();

        // Left line
        ctx.beginPath();
        ctx.moveTo(x1, y1 - crossExt);
        ctx.lineTo(x1, y2 + crossExt);
        ctx.stroke();

        // Right line
        ctx.beginPath();
        ctx.moveTo(x2, y1 - crossExt);
        ctx.lineTo(x2, y2 + crossExt);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [subtleJitter]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-10 h-full w-full opacity-85 mix-blend-multiply"
    />
  );
};
