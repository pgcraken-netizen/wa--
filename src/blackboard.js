import * as THREE from 'three';
import { MEMBERS, BLACKBOARD_DATA } from './data.js';

const W = 1024, H = 512;

function rand(min, max) { return min + Math.random() * (max - min); }

function chalkLine(ctx, x1, y1, x2, y2, color, lw = 2.5) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(2, Math.floor(dist / 3));
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t + rand(-1, 1);
    const y = y1 + (y2 - y1) * t + rand(-0.8, 0.8);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lw + rand(0, 0.8);
  ctx.globalAlpha = rand(0.65, 0.95);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function chalkText(ctx, text, x, y, size, color, align = 'center') {
  ctx.font = `bold ${size}px 'Hiragino Mincho ProN','Yu Mincho',serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  // shadow pass for chalk dust
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = color;
    ctx.fillText(text, x + rand(-1.5, 1.5), y + rand(-1, 1));
  }
  ctx.globalAlpha = rand(0.78, 0.95);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
}

export function createBlackboard(cameraCtrl, audioSys) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);

  let animProgress = 0;
  let animating = false;
  let animStarted = false;

  function drawBase() {
    // Board surface
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0,   '#1c3d2b');
    grad.addColorStop(0.5, '#1a3828');
    grad.addColorStop(1,   '#183325');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Chalk dust texture
    for (let i = 0; i < 8000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${rand(0.005, 0.022)})`;
      ctx.fillRect(rand(0, W), rand(0, H), rand(0.5, 2), rand(0.5, 2));
    }

    // Old data traces (previous month, very faint)
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#fff8d0';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(rand(150, 900), rand(200, 400), rand(20, 60), rand(30, 120));
    }
    ctx.globalAlpha = 1;
  }

  function drawChart(p) {
    const PAD_L = 130, PAD_B = 110, PAD_T = 90;
    const chartW = W - PAD_L - 60;
    const chartH = H - PAD_T - PAD_B;
    const maxVal = BLACKBOARD_DATA.max;

    // Title
    chalkText(ctx, BLACKBOARD_DATA.title, W / 2, 32, 22, '#ffe87a');
    // underline
    chalkLine(ctx, PAD_L, 52, W - 60, 52, 'rgba(255,232,122,0.5)', 1.2);
    chalkText(ctx, BLACKBOARD_DATA.subtitle, W / 2, 68, 15, 'rgba(255,255,255,0.75)');

    // Y label
    ctx.save();
    ctx.translate(28, H / 2 + 20);
    ctx.rotate(-Math.PI / 2);
    chalkText(ctx, BLACKBOARD_DATA.yLabel, 0, 0, 14, 'rgba(255,255,255,0.7)');
    ctx.restore();

    // X axis
    chalkLine(ctx, PAD_L, H - PAD_B, W - 60, H - PAD_B, 'rgba(255,255,255,0.8)', 2);
    // Y axis
    chalkLine(ctx, PAD_L, PAD_T, PAD_L, H - PAD_B, 'rgba(255,255,255,0.8)', 2);

    // Arrow tips
    chalkLine(ctx, W - 60, H - PAD_B, W - 50, H - PAD_B - 5, 'rgba(255,255,255,0.7)', 1.5);
    chalkLine(ctx, W - 60, H - PAD_B, W - 50, H - PAD_B + 5, 'rgba(255,255,255,0.7)', 1.5);
    chalkLine(ctx, PAD_L, PAD_T, PAD_L - 5, PAD_T + 10, 'rgba(255,255,255,0.7)', 1.5);
    chalkLine(ctx, PAD_L, PAD_T, PAD_L + 5, PAD_T + 10, 'rgba(255,255,255,0.7)', 1.5);

    // Y grid lines & labels
    const gridSteps = [0, 20, 40, 60, 80, 100, 120, 140];
    gridSteps.forEach(v => {
      const gy = (H - PAD_B) - (v / maxVal) * chartH;
      chalkLine(ctx, PAD_L - 6, gy, W - 60, gy, 'rgba(255,255,255,0.08)', 1);
      chalkText(ctx, String(v), PAD_L - 14, gy, 13, 'rgba(255,255,255,0.65)', 'right');
    });

    const barCount = MEMBERS.length;
    const barW = (chartW / barCount) * 0.55;
    const barGap = chartW / barCount;

    MEMBERS.forEach((m, i) => {
      const barProgress = Math.max(0, Math.min(1, (p - i * 0.08) / 0.6));
      if (barProgress <= 0) return;

      const fullH = (m.count / maxVal) * chartH;
      const drawH = fullH * barProgress;
      const bx = PAD_L + barGap * i + (barGap - barW) / 2;
      const by = (H - PAD_B) - drawH;

      const color = BLACKBOARD_DATA.barColors[i];

      // Bar fill with chalk strokes
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = color;
      ctx.fillRect(bx, by, barW, drawH);

      // Chalk hatching on bar
      ctx.globalAlpha = 0.25;
      for (let stripe = 0; stripe < drawH; stripe += 6) {
        chalkLine(ctx, bx, by + stripe, bx + barW, by + stripe, 'rgba(255,255,255,0.4)', 0.8);
      }
      ctx.globalAlpha = 1;

      // Value label (appears when bar is near full)
      if (barProgress > 0.85) {
        const numAlpha = (barProgress - 0.85) / 0.15;
        ctx.globalAlpha = numAlpha;
        chalkText(ctx, String(m.count), bx + barW / 2, by - 14, 15, '#fff8d0');
        ctx.globalAlpha = 1;
      }

      // Member name
      if (barProgress > 0.5) {
        const nameAlpha = (barProgress - 0.5) / 0.5;
        ctx.globalAlpha = nameAlpha * 0.9;
        ctx.font = `13px 'Hiragino Mincho ProN','Yu Mincho',serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(m.name, bx + barW / 2, H - PAD_B + 10);
        ctx.globalAlpha = 1;
      }
    });

    // X label
    if (p > 0.9) {
      chalkText(ctx, BLACKBOARD_DATA.xLabel, W / 2, H - 20, 13, 'rgba(255,255,255,0.6)');
    }

    // Decorative chalk drawings (corners)
    if (p > 0.95) {
      drawCornerDecos(ctx, p);
    }
  }

  function drawCornerDecos(ctx, p) {
    const a = (p - 0.95) / 0.05;
    ctx.globalAlpha = a * 0.7;

    // Top-left: book stack icon
    chalkLine(ctx, 52, 22, 90, 22, '#ffe87a', 4);
    chalkLine(ctx, 48, 28, 94, 28, '#78c8f5', 3);
    chalkLine(ctx, 50, 34, 92, 34, '#f07878', 3);
    chalkLine(ctx, 48, 40, 90, 40, '#90e085', 2);

    // Top-right: bell
    ctx.beginPath();
    ctx.arc(W - 72, 32, 12, Math.PI, 0);
    ctx.strokeStyle = 'rgba(255, 232, 122, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    chalkLine(ctx, W - 84, 44, W - 60, 44, 'rgba(255,232,122,0.7)', 2);
    chalkLine(ctx, W - 72, 44, W - 72, 50, 'rgba(255,232,122,0.6)', 1.5);

    // Bottom-left: flowers
    [30, 50, 70].forEach((fx, fi) => {
      const colors = ['#f090d0', '#c890f0', '#90c0f5'];
      ctx.beginPath();
      ctx.arc(fx, H - 30, 7, 0, Math.PI * 2);
      ctx.strokeStyle = colors[fi];
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Bottom-right: tree
    ctx.beginPath();
    ctx.arc(W - 60, H - 38, 14, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(144, 224, 133, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    chalkLine(ctx, W - 60, H - 24, W - 60, H - 12, 'rgba(139, 90, 43, 0.8)', 2);

    ctx.globalAlpha = 1;
  }

  function redraw(p) {
    drawBase();
    drawChart(p);
  }

  // Start with base
  redraw(0);

  // Geometry & material
  const geo = new THREE.PlaneGeometry(5.0, 2.5);
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.92,
    metalness: 0.0,
  });

  const board = new THREE.Mesh(geo, mat);
  board.receiveShadow = true;

  // Wood frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x7a4a22, roughness: 0.8 });
  const frameGroup = new THREE.Group();

  // Frame borders
  const borders = [
    [5.4, 0.1, 0.08, 0, 1.3, 0.04],  // top
    [5.4, 0.1, 0.08, 0, -1.3, 0.04], // bottom
    [0.1, 2.7, 0.08, -2.6, 0, 0.04], // left
    [0.1, 2.7, 0.08, 2.6, 0, 0.04],  // right
  ];
  borders.forEach(([w, h, d, x, y, z]) => {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat);
    f.position.set(x, y, z);
    frameGroup.add(f);
  });

  // Chalk tray
  const tray = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.12, 0.18), frameMat);
  tray.position.set(0, -1.32, 0.06);
  frameGroup.add(tray);

  frameGroup.add(board);

  frameGroup.userData.focusTarget = 'blackboard';
  frameGroup.userData.focusLabel = '黒板';
  board.userData.focusTarget = 'blackboard';

  // Animation hook
  frameGroup.userData.update = (elapsed) => {
    if (!animStarted) return;
    if (!animating) return;
    animProgress += 0.008;
    if (animProgress >= 1) { animProgress = 1; animating = false; }
    redraw(animProgress);
    texture.needsUpdate = true;

    // Chalk sound on bar drawing
    if (animating && Math.random() < 0.08 && audioSys) {
      audioSys.playChalk();
    }
  };

  // Triggered when camera focuses on blackboard
  cameraCtrl.onBlackboardFocus = () => {
    if (!animStarted) {
      animStarted = true;
      animating = true;
      animProgress = 0;
    }
  };

  return frameGroup;
}
