import * as THREE from 'three';

const WOOD = new THREE.MeshStandardMaterial({ color: 0x9b6b3a, roughness: 0.7 });
const WOOD_LIGHT = new THREE.MeshStandardMaterial({ color: 0xb88050, roughness: 0.65 });

export function createDesk(cameraCtrl, onBookmarkOpen) {
  const group = new THREE.Group();

  // Table top
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.06, 1.1),
    WOOD_LIGHT
  );
  top.position.set(0, 0.74, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Legs
  [[-0.85, -0.45], [-0.85, 0.45], [0.85, -0.45], [0.85, 0.45]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.74, 0.06),
      WOOD
    );
    leg.position.set(x, 0.37, z);
    group.add(leg);
  });

  // Cross beam
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.05, 0.05),
    WOOD
  );
  beam.position.set(0, 0.2, 0);
  group.add(beam);

  // Stack of books on left side
  const bookColors = [0x8b3a3a, 0x3a5a8b, 0x3a8b5a, 0x8b7a3a];
  bookColors.forEach((c, i) => {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.04 + i * 0.005, 0.20),
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 })
    );
    book.position.set(-0.62, 0.77 + i * 0.044, -0.1);
    book.rotation.y = (Math.random() - 0.5) * 0.15;
    group.add(book);
  });

  // Open book in center
  const openBook = buildOpenBook();
  openBook.position.set(0.1, 0.77, 0.1);
  openBook.rotation.y = -0.15;
  group.add(openBook);

  // Inkwell (small cylinder)
  const inkwell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.3, metalness: 0.4 })
  );
  inkwell.position.set(0.72, 0.79, -0.3);
  group.add(inkwell);

  // Bookmark card (しおり) — 3D object on desk
  const bookmark = buildBookmarkCard();
  bookmark.position.set(0.5, 0.77, 0.35);
  bookmark.rotation.y = 0.3;
  bookmark.rotation.z = 0.05;
  group.add(bookmark);

  // Bookmark click target
  bookmark.userData.focusTarget = 'desk';
  bookmark.userData.focusLabel = 'しおり';
  bookmark.traverse(c => {
    if (c.isMesh) c.userData.focusTarget = 'desk';
  });

  // Floating animation for bookmark
  let t = 0;
  bookmark.userData.update = (elapsed) => {
    bookmark.position.y = 0.77 + Math.sin(elapsed * 1.2) * 0.005;
    bookmark.rotation.z = 0.05 + Math.sin(elapsed * 0.7) * 0.012;
  };

  group.userData.focusTarget = 'desk';
  top.userData.focusTarget = 'desk';

  // Lamp
  const lamp = buildLamp();
  lamp.position.set(0.7, 0.77, -0.38);
  group.add(lamp);

  return group;
}

function buildOpenBook() {
  const group = new THREE.Group();
  const pageMat = new THREE.MeshStandardMaterial({ color: 0xf8f4e8, roughness: 0.9, side: THREE.DoubleSide });
  const coverMat = new THREE.MeshStandardMaterial({ color: 0x2a4a7a, roughness: 0.7 });

  // Left page
  const leftPage = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3), pageMat);
  leftPage.position.set(-0.11, 0.003, 0);
  leftPage.rotation.set(-Math.PI / 2, 0, 0);
  group.add(leftPage);

  // Right page
  const rightPage = leftPage.clone();
  rightPage.position.set(0.11, 0.003, 0);
  group.add(rightPage);

  // Cover
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.005, 0.31), coverMat);
  cover.position.set(0, 0, 0);
  group.add(cover);

  // Spine
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 0.31), coverMat);
  spine.position.set(0, 0.006, 0);
  group.add(spine);

  // Text lines (canvas)
  const lineTex = buildPageLines();
  leftPage.material = new THREE.MeshStandardMaterial({ map: lineTex, roughness: 0.9, side: THREE.DoubleSide });
  rightPage.material = leftPage.material.clone();

  return group;
}

function buildPageLines() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 192;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f8f4e8';
  ctx.fillRect(0, 0, 128, 192);
  ctx.strokeStyle = 'rgba(26, 42, 108, 0.18)';
  ctx.lineWidth = 1;
  for (let y = 20; y < 180; y += 14) {
    ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(118, y); ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

function buildBookmarkCard() {
  const group = new THREE.Group();

  const w = 0.22, h = 0.34;

  // Card body
  const cardMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e0, roughness: 0.9 });
  const card = new THREE.Mesh(new THREE.BoxGeometry(w, 0.003, h), cardMat);
  group.add(card);

  // Blue header
  const headerMat = new THREE.MeshStandardMaterial({ color: 0x1a2a6c, roughness: 0.7 });
  const header = new THREE.Mesh(new THREE.BoxGeometry(w, 0.004, 0.06), headerMat);
  header.position.set(0, 0.001, -h / 2 + 0.03);
  group.add(header);

  // Tab on header (dark blue raised)
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.004, 0.025), headerMat);
  tab.position.set(0.065, 0.002, -h / 2 - 0.005);
  group.add(tab);

  // Canvas texture for lines
  const lineTex = buildCardTexture();
  const linesMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 0.01, h - 0.01),
    new THREE.MeshBasicMaterial({ map: lineTex, transparent: true })
  );
  linesMesh.rotation.x = -Math.PI / 2;
  linesMesh.position.y = 0.002;
  group.add(linesMesh);

  return group;
}

function buildCardTexture() {
  const c = document.createElement('canvas');
  c.width = 200; c.height = 300;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f7f2e4';
  ctx.fillRect(0, 0, 200, 300);

  // Header
  ctx.fillStyle = '#1a2a6c';
  ctx.fillRect(0, 0, 200, 52);

  // Title text in header
  ctx.fillStyle = 'white';
  ctx.font = "10px 'Hiragino Mincho ProN','Yu Mincho',serif";
  ctx.textAlign = 'left';
  ctx.fillText('読書記録しおり', 10, 24);
  ctx.textAlign = 'right';
  ctx.fillText('ワタシ文庫', 190, 24);

  // Table lines
  ctx.strokeStyle = '#1a2a6c';
  ctx.lineWidth = 1.5;

  // Horizontal lines
  const rows = [52, 78, 104, 130, 156, 182, 208, 234, 260, 286];
  rows.forEach(y => {
    ctx.beginPath(); ctx.moveTo(2, y); ctx.lineTo(198, y); ctx.stroke();
  });

  // Vertical lines
  ctx.beginPath(); ctx.moveTo(2, 52); ctx.lineTo(2, 286); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(54, 52); ctx.lineTo(54, 286); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(148, 52); ctx.lineTo(148, 286); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(198, 52); ctx.lineTo(198, 286); ctx.stroke();

  // Header row
  ctx.fillStyle = '#1a2a6c';
  ctx.font = "9px 'Hiragino Mincho ProN','Yu Mincho',serif";
  ctx.textAlign = 'center';
  ctx.fillText('日付', 28, 65);
  ctx.fillText('書　名', 101, 65);
  ctx.fillText('著者名', 173, 65);

  return new THREE.CanvasTexture(c);
}

function buildLamp() {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x888878, roughness: 0.4, metalness: 0.6 });

  // Pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.38, 8), metalMat);
  pole.position.y = 0.19;
  group.add(pole);

  // Shade
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.09, 0.12, 12, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x3a2a18, roughness: 0.7, side: THREE.DoubleSide })
  );
  shade.position.y = 0.39;
  shade.rotation.x = Math.PI;
  group.add(shade);

  // Warm point light
  const light = new THREE.PointLight(0xfff0c0, 0.6, 2.5);
  light.position.y = 0.36;
  group.add(light);

  return group;
}
