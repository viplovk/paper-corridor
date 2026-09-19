/**
 * Procedural pencil sketch artworks inspired directly by the uploaded sketch:
 * - Flowers in a bottle / vase still life (Left foreground of reference)
 * - Pineapple and bananas fruit still life (Right foreground of reference)
 * - Classical architectural elevation with arched windows
 * - Mountain landscape with sun and clouds
 * - Figurative portraits sketch
 * - Botanical branch study
 * - Geometric mandala sketch
 * - Surreal pencil composition
 */
import * as THREE from 'three';

export interface ArtworkData {
  id: string;
  title: string;
  artist: string;
  year: string;
  medium: string;
  texture: THREE.CanvasTexture;
  placardTexture: THREE.CanvasTexture;
  aspectRatio: number; // width / height
}

// Utility to draw rough hand-drawn pencil stroke between two points
function drawRoughLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: {
    color?: string;
    width?: number;
    roughness?: number;
    doubleStroke?: boolean;
  } = {}
) {
  const {
    color = 'rgba(25, 22, 19, 0.85)',
    width = 2,
    roughness = 1.5,
    doubleStroke = true,
  } = options;

  const passes = doubleStroke ? 2 : 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy);
  const segments = Math.max(3, Math.floor(distance / 20));

  for (let p = 0; p < passes; p++) {
    ctx.strokeStyle = p === 0 ? color : color.replace(/[\d\.]+\)$/, '0.45)');
    ctx.lineWidth = p === 0 ? width : width * 0.7;
    ctx.beginPath();
    ctx.moveTo(x1 + (Math.random() - 0.5) * roughness, y1 + (Math.random() - 0.5) * roughness);

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const nx = x1 + dx * t + (Math.random() - 0.5) * roughness;
      const ny = y1 + dy * t + (Math.random() - 0.5) * roughness;
      ctx.lineTo(nx, ny);
    }
    ctx.lineTo(x2 + (Math.random() - 0.5) * roughness, y2 + (Math.random() - 0.5) * roughness);
    ctx.stroke();
  }
}

// Draw a hand-drawn rough rectangle (frame or border)
function drawRoughRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color = 'rgba(25, 22, 19, 0.85)',
  lineWidth = 2.5
) {
  drawRoughLine(ctx, x, y, x + w, y, { color, width: lineWidth });
  drawRoughLine(ctx, x + w, y, x + w, y + h, { color, width: lineWidth });
  drawRoughLine(ctx, x + w, y + h, x, y + h, { color, width: lineWidth });
  drawRoughLine(ctx, x, y + h, x, y, { color, width: lineWidth });
}

// Draw pencil hatch shading in an area
function drawHatching(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  angle = Math.PI / 4,
  density = 8,
  color = 'rgba(40, 35, 30, 0.25)'
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.0;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const maxDim = Math.hypot(w, h);

  for (let d = -maxDim; d < maxDim * 2; d += density) {
    ctx.beginPath();
    const lx1 = x + d * cos - maxDim * sin;
    const ly1 = y + d * sin + maxDim * cos;
    const lx2 = x + d * cos + maxDim * sin;
    const ly2 = y + d * sin - maxDim * cos;
    ctx.moveTo(lx1, ly1);
    ctx.lineTo(lx2, ly2);
    ctx.stroke();
  }
  ctx.restore();
}

function initPaperCanvas(w = 1024, h = 1024): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Warm off-white paper
  ctx.fillStyle = '#f6f1e7';
  ctx.fillRect(0, 0, w, h);

  // Subtle paper grain
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    d[i] = Math.min(255, Math.max(0, d[i] + n));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n - 2));
  }
  ctx.putImageData(imgData, 0, 0);

  // Inner pencil border with organic hand-drawn margins
  const margin = 50;
  drawRoughRect(ctx, margin, margin, w - margin * 2, h - margin * 2, 'rgba(30, 26, 22, 0.8)', 2.5);
  drawRoughRect(ctx, margin + 8, margin + 8, w - (margin + 8) * 2, h - (margin + 8) * 2, 'rgba(50, 44, 38, 0.35)', 1.2);

  return [canvas, ctx];
}

// 1. Flowers in Bottle (Left Wall foreground of sketch)
function createFlowersInBottleArtwork(): CanvasTexturePair {
  const [canvas, ctx] = initPaperCanvas(1024, 1024);
  const cx = 512;
  const cy = 600;

  // Table horizon line
  drawRoughLine(ctx, 80, 780, 944, 780, { color: 'rgba(30, 25, 20, 0.7)', width: 2.2 });
  drawHatching(ctx, 100, 782, 824, 180, Math.PI / 4, 14, 'rgba(40, 35, 30, 0.15)');

  // Glass bottle / vase
  // Neck
  drawRoughLine(ctx, cx - 35, cy - 80, cx - 30, cy + 40, { width: 3.0 });
  drawRoughLine(ctx, cx + 35, cy - 80, cx + 30, cy + 40, { width: 3.0 });
  drawRoughLine(ctx, cx - 40, cy - 80, cx + 40, cy - 80, { width: 2.5 });

  // Bottle body
  drawRoughLine(ctx, cx - 30, cy + 40, cx - 110, cy + 110, { width: 3.2 });
  drawRoughLine(ctx, cx + 30, cy + 40, cx + 110, cy + 110, { width: 3.2 });
  drawRoughLine(ctx, cx - 110, cy + 110, cx - 110, cy + 240, { width: 3.5 });
  drawRoughLine(ctx, cx + 110, cy + 110, cx + 110, cy + 240, { width: 3.5 });
  drawRoughLine(ctx, cx - 110, cy + 240, cx + 110, cy + 240, { width: 3.2 });

  // Bottle hatched shading (reflections)
  drawHatching(ctx, cx - 100, cy + 110, 70, 120, Math.PI / 3, 7, 'rgba(30, 25, 20, 0.35)');
  drawHatching(ctx, cx + 40, cy + 110, 60, 120, -Math.PI / 3, 9, 'rgba(30, 25, 20, 0.25)');

  // Water level
  drawRoughLine(ctx, cx - 90, cy + 180, cx + 90, cy + 180, { color: 'rgba(35, 30, 25, 0.6)', width: 2.0 });

  // Stems emerging from bottle
  const stemAngles = [-0.35, -0.15, 0.05, 0.25, 0.45];
  const stemHeights = [280, 360, 420, 340, 290];

  stemAngles.forEach((ang, i) => {
    const h = stemHeights[i];
    const topX = cx + Math.sin(ang) * h;
    const topY = cy - 80 - Math.cos(ang) * h;

    // Stem curve
    drawRoughLine(ctx, cx, cy - 60, topX, topY, { width: 2.4 });

    // Round flower / blossom buds at tips (just like in the sketch)
    ctx.fillStyle = 'rgba(25, 22, 19, 0.9)';
    ctx.beginPath();
    ctx.arc(topX, topY, 18 + (i % 2) * 6, 0, Math.PI * 2);
    ctx.fill();

    // Petal contours
    for (let p = 0; p < 5; p++) {
      const pa = (p / 5) * Math.PI * 2;
      const px = topX + Math.cos(pa) * 28;
      const py = topY + Math.sin(pa) * 28;
      drawRoughLine(ctx, topX, topY, px, py, { width: 1.6 });
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  return finishArtwork(
    canvas,
    'Still Life with Bottle and Wildflowers',
    'Elena Vane',
    '1924',
    'Graphite & charcoal on laid paper'
  );
}

// 2. Fruit Still Life: Pineapple and Bananas (Right Wall foreground of sketch)
function createFruitStillLifeArtwork(): CanvasTexturePair {
  const [canvas, ctx] = initPaperCanvas(1024, 1024);
  const cx = 460;
  const cy = 560;

  // Table surface
  drawRoughLine(ctx, 80, 760, 944, 760, { color: 'rgba(30, 25, 20, 0.7)', width: 2.2 });
  drawHatching(ctx, 90, 762, 840, 180, Math.PI / 4, 12, 'rgba(35, 30, 25, 0.15)');

  // Platter / dish
  ctx.strokeStyle = 'rgba(25, 22, 19, 0.85)';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(cx + 60, cy + 180, 320, 45, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Pineapple body
  const px = cx - 80;
  const py = cy + 40;
  ctx.fillStyle = 'rgba(240, 230, 215, 0.5)';
  ctx.beginPath();
  ctx.ellipse(px, py, 95, 130, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(25, 22, 19, 0.9)';
  ctx.lineWidth = 3.0;
  ctx.stroke();

  // Pineapple criss-cross scale hatching
  drawHatching(ctx, px - 90, py - 130, 180, 260, Math.PI / 3, 14, 'rgba(25, 20, 18, 0.6)');
  drawHatching(ctx, px - 90, py - 130, 180, 260, -Math.PI / 3, 14, 'rgba(25, 20, 18, 0.6)');

  // Pineapple spiky crown leaves
  const leafAngles = [-0.8, -0.5, -0.2, 0.0, 0.25, 0.55, 0.85];
  leafAngles.forEach((ang) => {
    const lx = px + Math.sin(ang) * 140;
    const ly = py - 130 - Math.cos(ang) * 130;
    drawRoughLine(ctx, px + (Math.random() - 0.5) * 30, py - 110, lx, ly, { width: 2.8 });
    // Leaf spine
    drawRoughLine(ctx, px, py - 110, lx, ly, { width: 1.4 });
  });

  // Bananas bunch resting on the platter (matching sketch!)
  const bananaBases = [
    { startX: cx + 20, startY: cy + 120, endX: cx + 290, endY: cy + 80, bow: 60 },
    { startX: cx + 15, startY: cy + 150, endX: cx + 310, endY: cy + 110, bow: 65 },
    { startX: cx + 25, startY: cy + 175, endX: cx + 280, endY: cy + 145, bow: 50 },
  ];

  bananaBases.forEach((b, i) => {
    ctx.strokeStyle = 'rgba(25, 22, 19, 0.9)';
    ctx.lineWidth = 3.2;

    // Top curve
    ctx.beginPath();
    ctx.moveTo(b.startX, b.startY);
    ctx.quadraticCurveTo((b.startX + b.endX) / 2, b.startY + b.bow, b.endX, b.endY);
    ctx.stroke();

    // Bottom curve
    ctx.beginPath();
    ctx.moveTo(b.startX, b.startY + 26);
    ctx.quadraticCurveTo((b.startX + b.endX) / 2, b.startY + b.bow + 32, b.endX, b.endY + 14);
    ctx.stroke();

    // Banana tip stem
    ctx.fillStyle = 'rgba(30, 25, 20, 0.9)';
    ctx.fillRect(b.startX - 12, b.startY + 4, 14, 18);
    // Banana blossom tip
    ctx.fillRect(b.endX - 2, b.endY + 2, 8, 10);

    // Subtle shading on lower curve
    drawHatching(ctx, b.startX + 20, b.startY + 10, b.endX - b.startX, 50, Math.PI / 4, 9, 'rgba(40, 35, 30, 0.3)');
  });

  // Small round fruit (lemon / apple) nestled on the left
  ctx.strokeStyle = 'rgba(25, 22, 19, 0.9)';
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.arc(cx - 160, cy + 160, 48, 0, Math.PI * 2);
  ctx.stroke();
  drawHatching(ctx, cx - 210, cy + 120, 90, 90, Math.PI / 3, 8, 'rgba(35, 30, 25, 0.4)');

  return finishArtwork(
    canvas,
    'Pineapple and Bananas with Fruit Platter',
    'Henri Moreau',
    '1931',
    'Charcoal & carbon pencil on wove paper'
  );
}

// 3. Classical Architectural Elevation (Left wall second frame in sketch)
function createArchitectureArtwork(): CanvasTexturePair {
  const [canvas, ctx] = initPaperCanvas(1024, 1024);
  const cx = 512;

  // Base stairs / podium
  drawRoughLine(ctx, 160, 840, 864, 840, { width: 3.5 });
  drawRoughLine(ctx, 180, 815, 844, 815, { width: 2.8 });
  drawRoughLine(ctx, 200, 790, 824, 790, { width: 2.8 });

  // Classical columns (4 columns)
  const colXs = [240, 420, 604, 784];
  colXs.forEach((colX) => {
    // Column shafts
    drawRoughLine(ctx, colX - 20, 790, colX - 18, 420, { width: 2.5 });
    drawRoughLine(ctx, colX + 20, 790, colX + 18, 420, { width: 2.5 });
    // Fluting lines
    drawRoughLine(ctx, colX - 7, 790, colX - 7, 420, { width: 1.2, color: 'rgba(40, 35, 30, 0.35)' });
    drawRoughLine(ctx, colX + 7, 790, colX + 7, 420, { width: 1.2, color: 'rgba(40, 35, 30, 0.35)' });

    // Capital
    drawRoughLine(ctx, colX - 28, 420, colX + 28, 420, { width: 3.0 });
    drawRoughLine(ctx, colX - 32, 400, colX + 32, 400, { width: 3.2 });
  });

  // Entablature & Pediment (Triangle roof)
  drawRoughLine(ctx, 180, 400, 844, 400, { width: 3.5 });
  drawRoughLine(ctx, 180, 360, 844, 360, { width: 3.0 });
  // Pediment triangle
  drawRoughLine(ctx, 180, 360, cx, 190, { width: 3.5 });
  drawRoughLine(ctx, 844, 360, cx, 190, { width: 3.5 });
  // Tympanum hatch
  drawHatching(ctx, 220, 200, 584, 160, Math.PI / 4, 12, 'rgba(40, 35, 30, 0.2)');

  // Central grand arched portal
  ctx.strokeStyle = 'rgba(25, 20, 18, 0.9)';
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.moveTo(cx - 70, 790);
  ctx.lineTo(cx - 70, 580);
  ctx.arc(cx, 580, 70, Math.PI, 0);
  ctx.lineTo(cx + 70, 790);
  ctx.stroke();
  drawHatching(ctx, cx - 70, 510, 140, 280, Math.PI / 4, 8, 'rgba(20, 18, 15, 0.55)');

  // Arched side windows
  [330, 694].forEach((wx) => {
    ctx.strokeStyle = 'rgba(25, 20, 18, 0.85)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(wx - 35, 690);
    ctx.lineTo(wx - 35, 540);
    ctx.arc(wx, 540, 35, Math.PI, 0);
    ctx.lineTo(wx + 35, 690);
    ctx.closePath();
    ctx.stroke();
    drawHatching(ctx, wx - 35, 505, 70, 185, Math.PI / 4, 8, 'rgba(25, 20, 18, 0.4)');
  });

  return finishArtwork(
    canvas,
    'Study of Neo-Classical Elevation with Portico',
    'Arthur Pendelton',
    '1918',
    'Architectural graphite drawing on heavy Bristol'
  );
}

// 4. Mountain and Landscape (Right wall landscape sketch)
function createLandscapeArtwork(): CanvasTexturePair {
  const [canvas, ctx] = initPaperCanvas(1024, 1024);

  // Distant sun with pencil ray lines
  const sx = 720;
  const sy = 310;
  ctx.strokeStyle = 'rgba(30, 25, 20, 0.9)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(sx, sy, 55, 0, Math.PI * 2);
  ctx.stroke();

  for (let r = 0; r < 14; r++) {
    const ra = (r / 14) * Math.PI * 2;
    drawRoughLine(ctx, sx + Math.cos(ra) * 70, sy + Math.sin(ra) * 70, sx + Math.cos(ra) * 110, sy + Math.sin(ra) * 110, {
      width: 1.8,
      color: 'rgba(40, 35, 30, 0.6)',
    });
  }

  // Drifting pencil clouds
  [
    { x: 260, y: 240, w: 220 },
    { x: 500, y: 190, w: 180 },
  ].forEach((cl) => {
    ctx.strokeStyle = 'rgba(35, 30, 25, 0.7)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cl.x, cl.y, 40, Math.PI, Math.PI * 1.8);
    ctx.arc(cl.x + 50, cl.y - 18, 50, Math.PI * 1.1, Math.PI * 1.9);
    ctx.arc(cl.x + 110, cl.y, 42, Math.PI * 1.2, 0);
    ctx.stroke();
  });

  // Primary Mountain Peak
  drawRoughLine(ctx, 120, 720, 440, 330, { width: 3.5 });
  drawRoughLine(ctx, 440, 330, 800, 720, { width: 3.5 });
  // Mountain ridge
  drawRoughLine(ctx, 440, 330, 480, 720, { width: 2.8 });

  // Mountain shading (shadowed face)
  drawHatching(ctx, 140, 330, 340, 390, Math.PI / 3, 9, 'rgba(25, 22, 19, 0.55)');
  drawHatching(ctx, 140, 420, 340, 300, -Math.PI / 4, 14, 'rgba(25, 22, 19, 0.35)');

  // Secondary rolling hills
  drawRoughLine(ctx, 80, 760, 944, 760, { width: 2.4 });
  drawRoughLine(ctx, 80, 830, 944, 830, { width: 3.0 });
  drawHatching(ctx, 90, 760, 840, 120, Math.PI / 6, 12, 'rgba(35, 30, 25, 0.25)');

  // Solitary pine tree silhouette in foreground
  const tx = 280;
  const ty = 760;
  drawRoughLine(ctx, tx, ty, tx, ty - 180, { width: 3.8 });
  for (let branch = 0; branch < 9; branch++) {
    const by = ty - 40 - branch * 15;
    const bSpan = 15 + (9 - branch) * 8;
    drawRoughLine(ctx, tx - bSpan, by + 10, tx + bSpan, by + 10, { width: 2.5 });
  }

  return finishArtwork(
    canvas,
    'Alpine Ridge under Morning Sunlight',
    'Clara Lindqvist',
    '1938',
    'Graphite pencil & silverpoint wash on paper'
  );
}

// 5. Figurative Portrait Study (Contour lines)
function createFiguresArtwork(): CanvasTexturePair {
  const [canvas, ctx] = initPaperCanvas(1024, 1024);

  // Profile face 1 (looking right)
  const cx1 = 380;
  const cy1 = 480;
  drawRoughLine(ctx, cx1 - 60, cy1 - 180, cx1 + 20, cy1 - 120, { width: 3.0 }); // Forehead
  drawRoughLine(ctx, cx1 + 20, cy1 - 120, cx1 + 45, cy1 - 50, { width: 3.2 }); // Nose
  drawRoughLine(ctx, cx1 + 45, cy1 - 50, cx1 + 15, cy1 - 30, { width: 2.6 });
  drawRoughLine(ctx, cx1 + 15, cy1 - 30, cx1 + 35, cy1 + 10, { width: 3.0 }); // Lips
  drawRoughLine(ctx, cx1 + 35, cy1 + 10, cx1 + 10, cy1 + 40, { width: 2.6 });
  drawRoughLine(ctx, cx1 + 10, cy1 + 40, cx1 + 30, cy1 + 90, { width: 3.2 }); // Chin
  drawRoughLine(ctx, cx1 + 30, cy1 + 90, cx1 - 40, cy1 + 160, { width: 3.2 }); // Jawline

  // Eye and brow
  drawRoughLine(ctx, cx1 - 10, cy1 - 85, cx1 + 18, cy1 - 85, { width: 3.0 });
  drawRoughLine(ctx, cx1 - 5, cy1 - 70, cx1 + 15, cy1 - 70, { width: 2.2 });
  ctx.fillStyle = 'rgba(25, 20, 18, 0.9)';
  ctx.beginPath();
  ctx.arc(cx1 + 5, cy1 - 70, 5, 0, Math.PI * 2);
  ctx.fill();

  // Shading on cheek and neck
  drawHatching(ctx, cx1 - 80, cy1 + 10, 100, 140, Math.PI / 4, 10, 'rgba(30, 25, 20, 0.35)');

  // Profile face 2 (intertwined / looking left)
  const cx2 = 640;
  const cy2 = 520;
  drawRoughLine(ctx, cx2 + 60, cy2 - 160, cx2 - 20, cy2 - 100, { width: 3.0 });
  drawRoughLine(ctx, cx2 - 20, cy2 - 100, cx2 - 40, cy2 - 30, { width: 3.2 });
  drawRoughLine(ctx, cx2 - 40, cy2 - 30, cx2 - 15, cy2, { width: 2.6 });
  drawRoughLine(ctx, cx2 - 15, cy2, cx2 - 35, cy2 + 35, { width: 3.0 });
  drawRoughLine(ctx, cx2 - 35, cy2 + 35, cx2 - 20, cy2 + 90, { width: 3.2 });

  drawHatching(ctx, cx2 - 20, cy2 + 20, 100, 120, -Math.PI / 3, 11, 'rgba(30, 25, 20, 0.35)');

  return finishArtwork(
    canvas,
    'Dialogue in Contours: Two Figures',
    'Karel Novak',
    '1942',
    'Conté crayon and graphite on handmade parchment'
  );
}

// 6. Sacred Geometry & Mandala
function createMandalaArtwork(): CanvasTexturePair {
  const [canvas, ctx] = initPaperCanvas(1024, 1024);
  const cx = 512;
  const cy = 512;

  // Concentric compass circles
  const radii = [60, 130, 210, 310, 400];
  radii.forEach((r, idx) => {
    ctx.strokeStyle = idx % 2 === 0 ? 'rgba(25, 22, 19, 0.85)' : 'rgba(45, 40, 35, 0.5)';
    ctx.lineWidth = idx === 3 ? 3.0 : 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Intersecting petal arcs (Flower of Life pattern)
  const petR = 130;
  for (let a = 0; a < 6; a++) {
    const angle = (a / 6) * Math.PI * 2;
    const px = cx + Math.cos(angle) * petR;
    const py = cy + Math.sin(angle) * petR;
    ctx.strokeStyle = 'rgba(30, 25, 20, 0.7)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(px, py, petR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Outer radial rays
  for (let ray = 0; ray < 24; ray++) {
    const rAngle = (ray / 24) * Math.PI * 2;
    drawRoughLine(
      ctx,
      cx + Math.cos(rAngle) * 310,
      cy + Math.sin(rAngle) * 310,
      cx + Math.cos(rAngle) * 400,
      cy + Math.sin(rAngle) * 400,
      { width: 1.8, color: 'rgba(35, 30, 25, 0.6)' }
    );
  }

  // Central graphite stipple
  drawHatching(ctx, cx - 50, cy - 50, 100, 100, Math.PI / 4, 6, 'rgba(20, 18, 15, 0.7)');

  return finishArtwork(
    canvas,
    'Harmonic Progression No. 7',
    'Maya S. Lin',
    '1929',
    'Ink and graphite compass construction on parchment'
  );
}

// 7. Botanical Study
function createBotanicalArtwork(): CanvasTexturePair {
  const [canvas, ctx] = initPaperCanvas(1024, 1024);
  const cx = 512;

  // Main arching branch
  drawRoughLine(ctx, cx - 180, 880, cx - 40, 600, { width: 4.0 });
  drawRoughLine(ctx, cx - 40, 600, cx + 80, 360, { width: 3.2 });
  drawRoughLine(ctx, cx + 80, 360, cx + 180, 160, { width: 2.4 });

  // Branch offshoots with realistic leaves
  const leafNodes = [
    { x: cx - 110, y: 740, angle: -0.6, len: 140 },
    { x: cx - 30, y: 590, angle: 0.7, len: 160 },
    { x: cx + 20, y: 460, angle: -0.75, len: 170 },
    { x: cx + 80, y: 350, angle: 0.8, len: 150 },
    { x: cx + 140, y: 240, angle: -0.5, len: 130 },
  ];

  leafNodes.forEach((node) => {
    const ex = node.x + Math.cos(node.angle) * node.len;
    const ey = node.y + Math.sin(node.angle) * node.len;

    // Leaf center vein
    drawRoughLine(ctx, node.x, node.y, ex, ey, { width: 2.2 });

    // Leaf outline (pointed oval)
    ctx.strokeStyle = 'rgba(25, 22, 19, 0.85)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(node.x, node.y);
    const midX = (node.x + ex) / 2;
    const midY = (node.y + ey) / 2;
    const perpX = -Math.sin(node.angle) * 38;
    const perpY = Math.cos(node.angle) * 38;

    ctx.quadraticCurveTo(midX + perpX, midY + perpY, ex, ey);
    ctx.quadraticCurveTo(midX - perpX, midY - perpY, node.x, node.y);
    ctx.stroke();

    // Leaf veins
    for (let v = 0.2; v <= 0.8; v += 0.2) {
      const vx = node.x + (ex - node.x) * v;
      const vy = node.y + (ey - node.y) * v;
      drawRoughLine(ctx, vx, vy, vx + perpX * 0.7, vy + perpY * 0.7, { width: 1.0, color: 'rgba(35, 30, 25, 0.4)' });
      drawRoughLine(ctx, vx, vy, vx - perpX * 0.7, vy - perpY * 0.7, { width: 1.0, color: 'rgba(35, 30, 25, 0.4)' });
    }
  });

  return finishArtwork(
    canvas,
    'Foliage Study: Eucalyptus Obliqua',
    'Julian Davies',
    '1911',
    'Field pencil illustration with graphite wash'
  );
}

// 8. Surreal / Eye & Sphere study
function createSurrealArtwork(): CanvasTexturePair {
  const [canvas, ctx] = initPaperCanvas(1024, 1024);
  const cx = 512;
  const cy = 480;

  // Giant open architectural eye
  ctx.strokeStyle = 'rgba(25, 20, 18, 0.9)';
  ctx.lineWidth = 3.5;
  // Eye lids
  ctx.beginPath();
  ctx.moveTo(cx - 240, cy);
  ctx.quadraticCurveTo(cx, cy - 160, cx + 240, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 240, cy);
  ctx.quadraticCurveTo(cx, cy + 160, cx + 240, cy);
  ctx.stroke();

  // Iris
  ctx.beginPath();
  ctx.arc(cx, cy, 90, 0, Math.PI * 2);
  ctx.stroke();
  // Iris radial lines
  for (let a = 0; a < 36; a++) {
    const ang = (a / 36) * Math.PI * 2;
    drawRoughLine(ctx, cx + Math.cos(ang) * 45, cy + Math.sin(ang) * 45, cx + Math.cos(ang) * 88, cy + Math.sin(ang) * 88, {
      width: 1.4,
      color: 'rgba(30, 25, 20, 0.65)',
    });
  }

  // Pupil (solid graphite)
  ctx.fillStyle = 'rgba(20, 18, 15, 0.95)';
  ctx.beginPath();
  ctx.arc(cx, cy, 40, 0, Math.PI * 2);
  ctx.fill();

  // Floating sphere cast shadow
  drawRoughLine(ctx, 100, 780, 924, 780, { width: 2.5 });
  ctx.strokeStyle = 'rgba(30, 25, 20, 0.8)';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(cx, 830, 140, 28, 0, 0, Math.PI * 2);
  ctx.stroke();
  drawHatching(ctx, cx - 140, 802, 280, 56, 0, 8, 'rgba(20, 18, 15, 0.6)');

  return finishArtwork(
    canvas,
    'The Omniscient Meridian',
    'Valentin Vane',
    '1936',
    'Pencil and silverpoint on calendered paper'
  );
}

// Generate the museum placard card underneath the artwork
function createPlacardCanvas(title: string, artist: string, year: string, medium: string): THREE.CanvasTexture {
  const width = 512;
  const height = 180;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Warm cream paper placard
  ctx.fillStyle = '#f8f4ec';
  ctx.fillRect(0, 0, width, height);

  // Rough outer pencil border
  drawRoughRect(ctx, 10, 10, width - 20, height - 20, 'rgba(35, 30, 25, 0.7)', 1.5);

  // Handwritten museum metadata
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title
  ctx.font = '600 24px "Playfair Display", Georgia, serif';
  ctx.fillStyle = '#1e1a17';
  ctx.fillText(title, width / 2, 48, width - 40);

  // Artist & Year
  ctx.font = 'italic 18px "Courier Prime", monospace';
  ctx.fillStyle = '#3a342f';
  ctx.fillText(`${artist}, ${year}`, width / 2, 88);

  // Medium / technique
  ctx.font = '14px "Courier Prime", monospace';
  ctx.fillStyle = '#5a524a';
  ctx.fillText(medium, width / 2, 126, width - 50);

  // Little archival accession code in bottom corner
  ctx.font = '11px monospace';
  ctx.fillStyle = '#7a7065';
  ctx.textAlign = 'right';
  ctx.fillText(`INV. ${Math.floor(1000 + Math.random() * 9000)}`, width - 24, height - 20);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

interface CanvasTexturePair {
  texture: THREE.CanvasTexture;
  placardTexture: THREE.CanvasTexture;
  title: string;
  artist: string;
  year: string;
  medium: string;
}

function finishArtwork(
  canvas: HTMLCanvasElement,
  title: string,
  artist: string,
  year: string,
  medium: string
): CanvasTexturePair {
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  const placardTexture = createPlacardCanvas(title, artist, year, medium);
  return {
    texture,
    placardTexture,
    title,
    artist,
    year,
    medium,
  };
}

// Architectural corner tick crosses
function drawConstructionCrosses(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = 'rgba(40, 35, 30, 0.25)';
  ctx.lineWidth = 1;
  const corners = [
    [50, 50],
    [w - 50, 50],
    [50, h - 50],
    [w - 50, h - 50],
  ];
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy);
    ctx.lineTo(cx + 15, cy);
    ctx.moveTo(cx, cy - 15);
    ctx.lineTo(cx, cy + 15);
    ctx.stroke();
  });
}

function drawSignature(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  ctx.font = 'italic 16px "Architects Daughter", cursive, sans-serif';
  ctx.fillStyle = 'rgba(30, 25, 20, 0.65)';
  ctx.fillText(text, x, y);
}

// 9. Artist's Hands Drawing Each Other (Homage to Escher/Da Vinci sketch)
function createArtistHandsArtwork(): CanvasTexturePair {
  const [canvas, ctx] = initPaperCanvas(1024, 1024);
  const width = 1024;
  const height = 1024;

  // Outer border & framing construction lines
  drawRoughRect(ctx, 40, 40, width - 80, height - 80, 'rgba(25, 22, 19, 0.85)', 2.5);
  drawConstructionCrosses(ctx, width, height);

  // Left hand holding pencil drawing right cuff
  ctx.strokeStyle = 'rgba(28, 24, 20, 0.85)';
  ctx.lineWidth = 2.4;

  // Hand 1 (drawing)
  ctx.beginPath();
  ctx.moveTo(120, 360);
  ctx.bezierCurveTo(160, 280, 220, 250, 320, 240);
  ctx.bezierCurveTo(360, 240, 420, 260, 450, 310); // wrist/knuckles
  ctx.stroke();

  // Fingers grasping graphite pencil
  ctx.beginPath();
  ctx.moveTo(340, 240);
  ctx.lineTo(440, 210);
  ctx.lineTo(480, 270);
  ctx.stroke();

  // Pencil shaft angled down towards second hand
  ctx.strokeStyle = 'rgba(20, 16, 12, 0.95)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(360, 180);
  ctx.lineTo(580, 420);
  ctx.stroke();
  // Pencil tip lead
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.moveTo(580, 420);
  ctx.lineTo(595, 435);
  ctx.lineTo(585, 440);
  ctx.fill();

  // Hand 2 (drawn into existence with shading becoming outline)
  ctx.strokeStyle = 'rgba(35, 30, 25, 0.75)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(520, 440);
  ctx.bezierCurveTo(620, 400, 720, 460, 760, 560);
  ctx.stroke();

  // Shading cross-hatch
  drawHatching(ctx, 160, 260, 200, 180, Math.PI / 4, 10, 'rgba(30, 25, 20, 0.35)');
  drawHatching(ctx, 500, 420, 220, 160, -Math.PI / 4, 12, 'rgba(35, 30, 25, 0.3)');

  // Signature
  drawSignature(ctx, width - 260, height - 60, 'M. C. Escher study');

  return finishArtwork(
    canvas,
    'Drawing Hands (Study in Graphite)',
    'Studio Archive',
    '1948',
    'Charcoal & 3B graphite on parchment'
  );
}

// 10. Endless Architectural Staircase
function createEndlessStairsArtwork(): CanvasTexturePair {
  const [canvas, ctx] = initPaperCanvas(1024, 1024);
  const width = 1024;
  const height = 1024;
  drawRoughRect(ctx, 40, 40, width - 80, height - 80, 'rgba(25, 22, 19, 0.85)', 2.5);
  drawConstructionCrosses(ctx, width, height);

  // Triangular impossible perspective staircase
  const steps = 18;
  ctx.strokeStyle = 'rgba(20, 18, 15, 0.85)';
  ctx.lineWidth = 2.2;

  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const x = 160 + t * 480;
    const y = 600 - t * 380;
    // Step tread & riser
    ctx.strokeRect(x, y, 42, 24);
    // Hatch under riser
    drawHatching(ctx, x, y, 42, 24, Math.PI / 3, 6, 'rgba(25, 20, 15, 0.4)');
  }

  // Descending return stairs
  for (let i = 0; i < 12; i++) {
    const t = i / 12;
    const x = 640 - t * 340;
    const y = 220 + t * 440;
    ctx.strokeRect(x, y, 36, 20);
    drawHatching(ctx, x, y, 36, 20, -Math.PI / 4, 7, 'rgba(25, 20, 15, 0.35)');
  }

  // Central vanishing point lines
  ctx.strokeStyle = 'rgba(50, 45, 40, 0.2)';
  ctx.lineWidth = 1.0;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
    ctx.beginPath();
    ctx.moveTo(width / 2, height / 2);
    ctx.lineTo(width / 2 + Math.cos(a) * 360, height / 2 + Math.sin(a) * 360);
    ctx.stroke();
  }

  drawSignature(ctx, width - 260, height - 60, 'Infinite Step #12');

  return finishArtwork(
    canvas,
    'The Infinite Ascent',
    'Architectural Study Group',
    '1961',
    'Fine-point drafting pen & graphite wash'
  );
}

// 11. Anatomy Study with Handwritten Measurement Callouts
function createAnatomyStudyArtwork(): CanvasTexturePair {
  const [canvas, ctx] = initPaperCanvas(1024, 1024);
  const width = 1024;
  const height = 1024;
  drawRoughRect(ctx, 40, 40, width - 80, height - 80, 'rgba(25, 22, 19, 0.85)', 2.5);
  drawConstructionCrosses(ctx, width, height);

  // Anatomical skull & facial proportions grid (Da Vinci style)
  ctx.strokeStyle = 'rgba(24, 20, 16, 0.85)';
  ctx.lineWidth = 2.0;

  // Cranium circle
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.42, 170, 0, Math.PI * 2);
  ctx.stroke();

  // Jaw curve
  ctx.beginPath();
  ctx.moveTo(width / 2 - 140, height * 0.42);
  ctx.bezierCurveTo(width / 2 - 110, height * 0.72, width / 2 + 110, height * 0.72, width / 2 + 140, height * 0.42);
  ctx.stroke();

  // Eye line, nose line, mouth line
  ctx.strokeStyle = 'rgba(40, 35, 30, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(100, height * 0.42);
  ctx.lineTo(width - 100, height * 0.42);
  ctx.moveTo(140, height * 0.54);
  ctx.lineTo(width - 140, height * 0.54);
  ctx.moveTo(180, height * 0.64);
  ctx.lineTo(width - 180, height * 0.64);
  ctx.stroke();

  // Eye socket sketch
  ctx.strokeStyle = 'rgba(25, 20, 16, 0.85)';
  ctx.lineWidth = 2.0;
  ctx.strokeRect(width / 2 - 105, height * 0.38, 70, 50);
  ctx.strokeRect(width / 2 + 35, height * 0.38, 70, 50);

  // Detailed graphite shading
  drawHatching(ctx, width / 2 - 100, height * 0.4, 60, 40, Math.PI / 4, 8, 'rgba(25, 20, 15, 0.4)');
  drawHatching(ctx, width / 2 + 40, height * 0.4, 60, 40, Math.PI / 4, 8, 'rgba(25, 20, 15, 0.4)');

  // Mirror-handwriting annotations (Da Vinci style backwards script)
  ctx.font = '16px "Architects Daughter", cursive, sans-serif';
  ctx.fillStyle = 'rgba(35, 30, 25, 0.65)';
  ctx.fillText('proportio divina · a/b = 1.618', 80, 120);
  ctx.fillText('distantia oculorum = latitudo nasi', 80, 150);
  ctx.fillText('vide naturam in omnibus', width - 340, height - 90);

  return finishArtwork(
    canvas,
    'Study of Cranial Proportions',
    'Master of the Codex',
    '1490',
    'Silverpoint & lead pencil on primed paper'
  );
}

// 12. Erased Ghost Study (Story Moment: Half-erased drawing with rubber dust smudges)
function createEraserGhostArtwork(): CanvasTexturePair {
  const [canvas, ctx] = initPaperCanvas(1024, 1024);
  const width = 1024;
  const height = 1024;
  drawRoughRect(ctx, 40, 40, width - 80, height - 80, 'rgba(25, 22, 19, 0.85)', 2.5);
  drawConstructionCrosses(ctx, width, height);

  // Classical portrait sketch underneath
  ctx.strokeStyle = 'rgba(30, 25, 20, 0.65)';
  ctx.lineWidth = 2.0;

  // Face outline
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.45, 180, 0, Math.PI * 2);
  ctx.stroke();

  // Hair curls
  for (let c = 0; c < 16; c++) {
    const angle = (c / 16) * Math.PI - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(width / 2 + Math.cos(angle) * 190, height * 0.45 + Math.sin(angle) * 190, 30, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Eraser streaks: diagonal broad eraser sweeps across the portrait!
  for (let s = 0; s < 8; s++) {
    const startX = 100 + s * 90;
    const grad = ctx.createLinearGradient(startX, 100, startX + 160, height - 100);
    grad.addColorStop(0, 'rgba(244, 238, 227, 0.85)');
    grad.addColorStop(0.5, 'rgba(250, 246, 238, 0.95)');
    grad.addColorStop(1, 'rgba(244, 238, 227, 0.8)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(startX + 80, height / 2, 70, 320, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Faint handwritten frustrated note
  ctx.font = 'bold 24px "Architects Daughter", cursive, sans-serif';
  ctx.fillStyle = 'rgba(40, 32, 26, 0.85)';
  ctx.fillText('FAILED PERSPECTIVE · START OVER', 120, height - 120);

  drawSignature(ctx, width - 240, height - 60, 'Untitled [Abandoned]');

  return finishArtwork(
    canvas,
    'Abandoned Portrait (Study #09)',
    'Unknown Draftsman',
    'Circa 1912',
    'Graphite, kneaded eraser marks & chalk'
  );
}

// Handwritten wall annotation beside artworks (Enhancement 11)
export function createWallAnnotationTexture(annotation: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = '19px "Architects Daughter", cursive, sans-serif';
  ctx.fillStyle = 'rgba(30, 25, 20, 0.72)';
  ctx.textAlign = 'left';

  // Draw subtle pencil arrow or bracket
  ctx.strokeStyle = 'rgba(40, 35, 30, 0.5)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(10, 40);
  ctx.lineTo(40, 40);
  ctx.lineTo(32, 34);
  ctx.moveTo(40, 40);
  ctx.lineTo(32, 46);
  ctx.stroke();

  ctx.fillText(annotation, 48, 44);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Hand-drawn mirror surface texture (Enhancement 23)
export function createMirrorSurfaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#dcd4c6';
  ctx.fillRect(0, 0, 512, 512);

  // Silvered glass pencil diagonal sheen lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 8.0;
  for (let i = -200; i < 700; i += 120) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 300, 512);
    ctx.stroke();
  }

  // Faint graphite reflection lines of corridor perspective
  ctx.strokeStyle = 'rgba(45, 40, 35, 0.25)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(256, 256);
  ctx.lineTo(0, 0);
  ctx.moveTo(256, 256);
  ctx.lineTo(512, 0);
  ctx.moveTo(256, 256);
  ctx.lineTo(0, 512);
  ctx.moveTo(256, 256);
  ctx.lineTo(512, 512);
  ctx.stroke();

  ctx.font = '18px "Architects Daughter", cursive, sans-serif';
  ctx.fillStyle = 'rgba(35, 30, 25, 0.55)';
  ctx.textAlign = 'center';
  ctx.fillText('REFLECTIO [OBSERVE YOURSELF]', 256, 460);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

let cachedArtworks: ArtworkData[] | null = null;

export function getArtworkLibrary(): ArtworkData[] {
  if (cachedArtworks) return cachedArtworks;

  const creators = [
    createFlowersInBottleArtwork,
    createFruitStillLifeArtwork,
    createArchitectureArtwork,
    createLandscapeArtwork,
    createFiguresArtwork,
    createMandalaArtwork,
    createBotanicalArtwork,
    createSurrealArtwork,
    createArtistHandsArtwork,
    createEndlessStairsArtwork,
    createAnatomyStudyArtwork,
    createEraserGhostArtwork,
  ];

  cachedArtworks = creators.map((creator, i) => {
    const art = creator();
    return {
      id: `art-${i}`,
      title: art.title,
      artist: art.artist,
      year: art.year,
      medium: art.medium,
      texture: art.texture,
      placardTexture: art.placardTexture,
      aspectRatio: 1.0,
    };
  });

  return cachedArtworks;
}
