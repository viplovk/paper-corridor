/**
 * Generates procedural pencil sketch textures for paper background,
 * wood floor planks with graphite shading, and wall plaster sketches.
 */
import * as THREE from 'three';

// 1. Paper Grain Texture with subtle graphite fibers
export function createPaperTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base warm off-white / archival paper tone
  ctx.fillStyle = '#f5efe4';
  ctx.fillRect(0, 0, size, size);

  // Organic paper fiber / grain noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // Simple pseudo-random seeded noise for consistent paper texture
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 16;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise - 1));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise - 3));
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle paper fibers (thin sketchy fibrous graphite lines)
  ctx.strokeStyle = 'rgba(60, 50, 40, 0.06)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 4 + Math.random() * 14;
    const angle = Math.random() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 2. Floor Plank Texture: Matches the vertical hand-drawn pencil lines in the uploaded sketch
export function createFloorSketchTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Paper background
  ctx.fillStyle = '#eee6d8';
  ctx.fillRect(0, 0, width, height);

  // Planks running along Y (corridor depth direction)
  const numPlanks = 16;
  const plankWidth = width / numPlanks;

  // Subtle wood tint variation across planks
  for (let p = 0; p < numPlanks; p++) {
    const px = p * plankWidth;
    const tone = Math.random() * 12;
    ctx.fillStyle = `rgba(40, 35, 30, ${0.02 + (tone / 255)})`;
    ctx.fillRect(px, 0, plankWidth, height);
  }

  // Draw hand-drawn longitudinal plank borders (multi-stroke pencil feel)
  for (let p = 0; p <= numPlanks; p++) {
    const xBase = p * plankWidth;
    // Draw 2-3 overlapping graphite strokes for hand-drawn quality
    for (let stroke = 0; stroke < 3; stroke++) {
      ctx.strokeStyle = stroke === 0 ? 'rgba(30, 26, 22, 0.85)' : 'rgba(50, 45, 40, 0.45)';
      ctx.lineWidth = stroke === 0 ? 2.2 : 1.2;
      ctx.beginPath();
      let cx = xBase + (Math.random() - 0.5) * 1.5;
      ctx.moveTo(cx, 0);

      const segments = 24;
      const segH = height / segments;
      for (let s = 1; s <= segments; s++) {
        cx += (Math.random() - 0.5) * 1.8;
        // Keep within bounds
        cx = Math.max(xBase - 3, Math.min(xBase + 3, cx));
        ctx.lineTo(cx, s * segH);
      }
      ctx.stroke();
    }

    // Wood grain pencil scratches inside each plank
    if (p < numPlanks) {
      for (let g = 0; g < 18; g++) {
        const gx = xBase + 3 + Math.random() * (plankWidth - 6);
        const gy = Math.random() * height;
        const gLen = 40 + Math.random() * 120;
        ctx.strokeStyle = 'rgba(40, 35, 30, 0.18)';
        ctx.lineWidth = 0.8 + Math.random() * 0.7;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + (Math.random() - 0.5) * 2, gy + gLen);
        ctx.stroke();
      }

      // Horizontal staggered plank seams / joints (like in sketch)
      const numJoints = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < numJoints; j++) {
        const jy = Math.random() * height;
        ctx.strokeStyle = 'rgba(25, 22, 19, 0.8)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(xBase + 1, jy);
        ctx.lineTo(xBase + plankWidth - 1, jy + (Math.random() - 0.5) * 2);
        ctx.stroke();

        // Little pencil tick / nail dot
        ctx.fillStyle = 'rgba(30, 25, 20, 0.7)';
        ctx.beginPath();
        ctx.arc(xBase + 6, jy - 3, 1.2, 0, Math.PI * 2);
        ctx.arc(xBase + plankWidth - 6, jy - 3, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Cross-hatching shading near outer edges of floor
  for (let side = 0; side < 2; side++) {
    const startX = side === 0 ? 0 : width - 120;
    const endX = side === 0 ? 120 : width;
    ctx.strokeStyle = 'rgba(40, 35, 30, 0.12)';
    ctx.lineWidth = 1;
    for (let y = -100; y < height + 100; y += 14) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y + (side === 0 ? 60 : -60));
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 16;
  return texture;
}

// 3. Wall Pencil Texture: Plaster with architectural pencil strokes and skirting shadows
export function createWallSketchTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Off-white wall paper
  ctx.fillStyle = '#f4eee3';
  ctx.fillRect(0, 0, width, height);

  // Subtle vertical pencil construction guidelines
  ctx.strokeStyle = 'rgba(45, 40, 35, 0.12)';
  ctx.lineWidth = 0.9;
  for (let x = 60; x < width; x += 180) {
    ctx.beginPath();
    ctx.moveTo(x + (Math.random() - 0.5) * 4, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 4, height);
    ctx.stroke();
  }

  // Light diagonal pencil hatch marks along top and bottom edges
  ctx.strokeStyle = 'rgba(35, 30, 25, 0.15)';
  ctx.lineWidth = 1.0;
  // Bottom shading (near baseboard)
  for (let x = 0; x < width + 100; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x - 35, height - 60 - Math.random() * 20);
    ctx.stroke();
  }
  // Top shading (near ceiling corniche)
  for (let x = 0; x < width + 100; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 35, 40 + Math.random() * 25);
    ctx.stroke();
  }

  // Baseboard sketch line along the bottom
  ctx.strokeStyle = 'rgba(25, 20, 18, 0.85)';
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.moveTo(0, height - 8);
  for (let x = 0; x <= width; x += 30) {
    ctx.lineTo(x, height - 8 + (Math.random() - 0.5) * 1.5);
  }
  ctx.stroke();

  // Second skirting pencil line
  ctx.strokeStyle = 'rgba(45, 38, 32, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, height - 28);
  for (let x = 0; x <= width; x += 30) {
    ctx.lineTo(x, height - 28 + (Math.random() - 0.5) * 1.5);
  }
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 16;
  return texture;
}

// 4. Ceiling Pencil Texture: Perspective construction lines and light plaster texture
export function createCeilingSketchTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f7f2ea';
  ctx.fillRect(0, 0, width, height);

  // Longitudinal perspective lines on ceiling
  ctx.strokeStyle = 'rgba(45, 40, 35, 0.18)';
  ctx.lineWidth = 1.2;
  const lines = [width * 0.15, width * 0.35, width * 0.5, width * 0.65, width * 0.85];
  lines.forEach((lx) => {
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    for (let y = 0; y <= height; y += 40) {
      ctx.lineTo(lx + (Math.random() - 0.5) * 2, y);
    }
    ctx.stroke();
  });

  // Track lighting conduit line down center (as in sketch)
  ctx.strokeStyle = 'rgba(20, 18, 15, 0.85)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(width * 0.5, 0);
  for (let y = 0; y <= height; y += 30) {
    ctx.lineTo(width * 0.5 + (Math.random() - 0.5) * 1.5, y);
  }
  ctx.stroke();

  // Parallel conduit wire
  ctx.strokeStyle = 'rgba(40, 35, 30, 0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(width * 0.5 + 8, 0);
  for (let y = 0; y <= height; y += 30) {
    ctx.lineTo(width * 0.5 + 8 + (Math.random() - 0.5) * 1.5, y);
  }
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 5. Visual Chapters Wall Textures (Pure Graphite, Heavy Graphite, Erased, Blueprint, Abstract)
export function createChapterWallTexture(chapter: number): THREE.CanvasTexture {
  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const paperTones = [
    '#f7f2ea', // 1: Pure Graphite - bright clean archival paper
    '#ede5d6', // 2: Heavy Graphite - slightly denser warm tone
    '#faf6ef', // 3: Erased - faded, chalky off-white with smudges
    '#f0ebd8', // 4: Blueprint - drafting paper
    '#e9e2d4', // 5: Abstract - mysterious moody tone
  ];
  ctx.fillStyle = paperTones[(chapter - 1) % paperTones.length] || '#f5efe4';
  ctx.fillRect(0, 0, width, height);

  // Chapter 1: Pure Graphite (thin fine pencil lines, clean architecture)
  if (chapter === 1) {
    ctx.strokeStyle = 'rgba(50, 45, 40, 0.16)';
    ctx.lineWidth = 0.8;
    for (let x = 80; x < width; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(30, 26, 22, 0.7)';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(0, height - 12, width, 12);
  }
  // Chapter 2: Heavy Graphite (dark charcoal, dense cross-hatching, deep graphite corners)
  else if (chapter === 2) {
    ctx.strokeStyle = 'rgba(25, 20, 16, 0.22)';
    ctx.lineWidth = 1.4;
    for (let y = -200; y < height + 200; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y + 260);
      ctx.stroke();
    }
    for (let y = -200; y < height + 200; y += 22) {
      ctx.beginPath();
      ctx.moveTo(width, y);
      ctx.lineTo(0, y + 260);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(20, 16, 12, 0.35)';
    ctx.fillRect(0, height - 32, width, 32);
    ctx.fillStyle = 'rgba(20, 16, 12, 0.2)';
    ctx.fillRect(0, 0, width, 24);
  }
  // Chapter 3: Erased (faded graphite, eraser streaks, ghost drawings)
  else if (chapter === 3) {
    ctx.strokeStyle = 'rgba(60, 50, 42, 0.08)';
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 8; i++) {
      const rx = 100 + i * 90;
      ctx.strokeRect(rx, 200 + (i % 3) * 60, 120, 180);
    }
    for (let s = 0; s < 12; s++) {
      const ex = 100 + Math.random() * 800;
      const ey = 100 + Math.random() * 800;
      const rad = 50 + Math.random() * 90;
      const grad = ctx.createRadialGradient(ex, ey, 5, ex, ey, rad);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ex, ey, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Chapter 4: Architectural Blueprint (measurement lines, dimension marks, annotations)
  else if (chapter === 4) {
    ctx.strokeStyle = 'rgba(40, 35, 30, 0.25)';
    ctx.lineWidth = 1.0;
    const dims = [
      { y: 220, text: 'H = 5.20m [ELEVATION]' },
      { y: 480, text: 'SECTION A-A · W = 5.60m' },
      { y: 740, text: 'STUDY #04 · BASE REF' },
    ];
    dims.forEach((d) => {
      ctx.beginPath();
      ctx.moveTo(40, d.y);
      ctx.lineTo(width - 40, d.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(40, d.y - 12);
      ctx.lineTo(40, d.y + 12);
      ctx.moveTo(width - 40, d.y - 12);
      ctx.lineTo(width - 40, d.y + 12);
      ctx.stroke();

      ctx.font = 'bold 15px "Courier Prime", monospace';
      ctx.fillStyle = 'rgba(30, 25, 20, 0.45)';
      ctx.fillText(d.text, width * 0.35, d.y - 8);
    });

    ctx.beginPath();
    ctx.arc(width * 0.8, 400, 70, 0, Math.PI);
    ctx.stroke();
  }
  // Chapter 5: Abstract (surreal perspective lines, unusual angles)
  else if (chapter === 5) {
    ctx.strokeStyle = 'rgba(35, 30, 25, 0.28)';
    ctx.lineWidth = 1.2;
    for (let a = -0.6; a <= 0.6; a += 0.15) {
      ctx.beginPath();
      ctx.moveTo(width / 2, height / 2);
      ctx.lineTo(width / 2 + Math.cos(a) * 900, height / 2 + Math.sin(a) * 900);
      ctx.stroke();
    }
    for (let r = 80; r < 360; r += 70) {
      ctx.beginPath();
      ctx.ellipse(width / 2, height / 2, r, r * 0.6, 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 16;
  return texture;
}

// 6. Floor Texture with Hand-Drawn Notes and Accidental Marks
export function createFloorPlanksWithMarksTexture(noteType: number = 0): THREE.CanvasTexture {
  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#eee6d8';
  ctx.fillRect(0, 0, width, height);

  const numPlanks = 16;
  const plankWidth = width / numPlanks;

  for (let p = 0; p <= numPlanks; p++) {
    const xBase = p * plankWidth;
    ctx.strokeStyle = 'rgba(35, 30, 25, 0.8)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(xBase, 0);
    ctx.lineTo(xBase, height);
    ctx.stroke();

    if (p < numPlanks) {
      for (let g = 0; g < 12; g++) {
        const gx = xBase + 4 + Math.random() * (plankWidth - 8);
        const gy = Math.random() * height;
        ctx.strokeStyle = 'rgba(45, 40, 35, 0.16)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx, gy + 30 + Math.random() * 60);
        ctx.stroke();
      }
    }
  }

  const notes = [
    { text: 'study #07', sub: '→ 2.4m axis', x: 280, y: 460 },
    { text: 'perspective test', sub: 'vanishing pt //', x: 520, y: 700 },
    { text: 'unfinished', sub: '[redo]', x: 220, y: 240 },
    { text: '2.40m', sub: '← ──── →', x: 620, y: 380 },
    { text: '??', sub: 'remember this', x: 420, y: 820 },
  ];

  const note = notes[noteType % notes.length];
  ctx.save();
  ctx.translate(note.x, note.y);
  ctx.rotate(-0.08 + (noteType % 3) * 0.05);

  ctx.strokeStyle = 'rgba(30, 25, 20, 0.55)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 75, 32, -0.05, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = '17px "Architects Daughter", cursive, sans-serif';
  ctx.fillStyle = 'rgba(28, 24, 20, 0.75)';
  ctx.textAlign = 'center';
  ctx.fillText(note.text, 0, 4);

  ctx.font = '13px "Courier Prime", monospace';
  ctx.fillStyle = 'rgba(40, 35, 30, 0.55)';
  ctx.fillText(note.sub, 0, 22);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 16;
  return texture;
}

// 7. Doorway Monumental Arch Texture with Corridor Numbering
export function createDoorwayArchTexture(corridorNumber: number): THREE.CanvasTexture {
  const width = 512;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f3ede2';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(35, 30, 26, 0.75)';
  ctx.lineWidth = 2.2;
  ctx.strokeRect(16, 16, width - 32, height - 32);
  ctx.strokeRect(width / 2 - 50, 16, 100, 74);

  const numStr = corridorNumber < 1000
    ? String(corridorNumber).padStart(3, '0')
    : String(corridorNumber);

  ctx.font = 'bold 36px "Courier Prime", monospace';
  ctx.fillStyle = 'rgba(25, 20, 16, 0.85)';
  ctx.textAlign = 'center';
  ctx.fillText(numStr, width / 2, 62);

  ctx.font = '15px "Architects Daughter", cursive, sans-serif';
  ctx.fillStyle = 'rgba(50, 44, 38, 0.65)';
  ctx.fillText('GALLERY PORTAL', width / 2, height / 2 + 10);

  ctx.strokeStyle = 'rgba(40, 35, 30, 0.2)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < width; i += 18) {
    ctx.beginPath();
    ctx.moveTo(i, height - 80);
    ctx.lineTo(i + 25, height);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 8. Giant Unfinished Wall Sketch (Mural with construction lines fading into shading)
export function createGiantUnfinishedSketchTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f5efe4';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(55, 48, 42, 0.2)';
  ctx.lineWidth = 1.0;
  for (let x = 0; x < width * 0.6; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width * 0.6, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(30, 25, 20, 0.85)';
  ctx.lineWidth = 2.8;

  for (let c = 0; c < 3; c++) {
    const colX = 140 + c * 220;
    ctx.strokeRect(colX, 160, 90, 720);

    ctx.lineWidth = 1.4;
    for (let f = 1; f <= 4; f++) {
      ctx.beginPath();
      ctx.moveTo(colX + f * 18, 160);
      ctx.lineTo(colX + f * 18, 880);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = 'rgba(25, 20, 16, 0.45)';
  ctx.lineWidth = 1.6;
  for (let y = 140; y < 880; y += 12) {
    ctx.beginPath();
    ctx.moveTo(560, y);
    ctx.lineTo(920, y + 80);
    ctx.stroke();
  }

  ctx.font = '22px "Architects Daughter", cursive, sans-serif';
  ctx.fillStyle = 'rgba(35, 30, 24, 0.75)';
  ctx.fillText('STUDY FOR COLONNADE · IN PROGRESS [DO NOT ERASE]', 80, 960);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 9. Abstract Paper World Texture (Point 20: Window / Outside View)
export function createAbstractPaperWorldTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Archival warm paper infinity background
  ctx.fillStyle = '#faf5ec';
  ctx.fillRect(0, 0, width, height);

  // Subtle paper grain
  ctx.fillStyle = 'rgba(40, 32, 24, 0.03)';
  for (let i = 0; i < 600; i++) {
    ctx.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5);
  }

  // Radiating architectural vanishing guidelines from center-horizon
  const vpHx = width * 0.5;
  const vpHy = height * 0.55;

  ctx.strokeStyle = 'rgba(50, 42, 35, 0.14)';
  ctx.lineWidth = 1.0;
  for (let a = 0; a < Math.PI * 2; a += 0.2) {
    ctx.beginPath();
    ctx.moveTo(vpHx, vpHy);
    ctx.lineTo(vpHx + Math.cos(a) * 900, vpHy + Math.sin(a) * 900);
    ctx.stroke();
  }

  // Distant faint pencil architectural silhouettes on the horizon
  ctx.strokeStyle = 'rgba(38, 32, 26, 0.38)';
  ctx.lineWidth = 1.6;

  // Distant neoclassical dome & spires
  ctx.beginPath();
  ctx.arc(vpHx - 180, vpHy - 40, 70, Math.PI, 0);
  ctx.stroke();
  ctx.strokeRect(vpHx - 220, vpHy - 40, 80, 60);

  // Tower 1
  ctx.strokeRect(vpHx + 120, vpHy - 180, 50, 200);
  ctx.beginPath();
  ctx.moveTo(vpHx + 120, vpHy - 180);
  ctx.lineTo(vpHx + 145, vpHy - 250);
  ctx.lineTo(vpHx + 170, vpHy - 180);
  ctx.stroke();

  // Colonnade arcade in distance
  for (let c = 0; c < 8; c++) {
    const cx = 80 + c * 110;
    ctx.beginPath();
    ctx.arc(cx + 30, vpHy - 20, 25, Math.PI, 0);
    ctx.stroke();
    ctx.strokeRect(cx, vpHy - 20, 10, 40);
    ctx.strokeRect(cx + 50, vpHy - 20, 10, 40);
  }

  // Distant horizon line
  ctx.strokeStyle = 'rgba(30, 25, 20, 0.45)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, vpHy + 20);
  ctx.lineTo(width, vpHy + 20);
  ctx.stroke();

  // Floating geometric coordinate circles and measurement notations
  ctx.strokeStyle = 'rgba(50, 40, 30, 0.2)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(vpHx, vpHy, 220, 0, Math.PI * 2);
  ctx.arc(vpHx, vpHy, 340, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = '14px "Courier Prime", monospace';
  ctx.fillStyle = 'rgba(40, 32, 25, 0.45)';
  ctx.fillText('EXTERNAL VOID // INFINITE PAPER HORIZON', 60, height - 60);
  ctx.fillText('COORD: 43°46\' N, 11°15\' E · ELEVATION ∞', 60, height - 35);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
