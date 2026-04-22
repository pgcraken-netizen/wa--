import * as THREE from 'three';
import { MEMBERS } from './data.js';

const WOOD_COLOR  = 0x8b5c30;
const WOOD_DARK   = 0x6b4420;
const SHELF_ROWS  = 5;
const SHELF_H_GAP = 0.52;
const SHELF_BOTTOM = 0.18;
const BOOKS_PER_ROW = 22;
const BOOK_W = 0.095;
const BOOK_H_BASE = 0.42;
const BOOK_D = 0.25;
const UNIT_W = 2.2;

// materialはcreateShelvesのisMobileフラグで決定
let woodMat, woodDarkMat;

function initMats(isMobile) {
  if (woodMat) return; // 初回のみ
  if (isMobile) {
    woodMat     = new THREE.MeshLambertMaterial({ color: WOOD_COLOR });
    woodDarkMat = new THREE.MeshLambertMaterial({ color: WOOD_DARK });
  } else {
    woodMat     = new THREE.MeshStandardMaterial({ color: WOOD_COLOR, roughness: 0.75 });
    woodDarkMat = new THREE.MeshStandardMaterial({ color: WOOD_DARK, roughness: 0.8 });
  }
}

// per-member shelf unit
function buildShelfUnit(member, side, isMobile) {
  const group = new THREE.Group();
  const signX = side === 'left' ? 1 : -1; // books face inward

  // Frame
  const frameDepth = 0.32;

  // Back panel
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(UNIT_W, SHELF_ROWS * SHELF_H_GAP + 0.3, 0.04),
    woodDarkMat
  );
  back.position.set(0, (SHELF_ROWS * SHELF_H_GAP + 0.3) / 2 + SHELF_BOTTOM, -frameDepth / 2 + 0.02);
  group.add(back);

  // Side panels
  [-UNIT_W / 2, UNIT_W / 2].forEach(x => {
    const side = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, SHELF_ROWS * SHELF_H_GAP + 0.5, frameDepth),
      woodMat
    );
    side.position.set(x, (SHELF_ROWS * SHELF_H_GAP + 0.5) / 2 + SHELF_BOTTOM, 0);
    group.add(side);
  });

  // Bottom
  const bottom = new THREE.Mesh(
    new THREE.BoxGeometry(UNIT_W, 0.06, frameDepth),
    woodMat
  );
  bottom.position.set(0, SHELF_BOTTOM, 0);
  group.add(bottom);

  // Top
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(UNIT_W + 0.1, 0.06, frameDepth + 0.04),
    woodMat
  );
  top.position.set(0, SHELF_ROWS * SHELF_H_GAP + SHELF_BOTTOM + 0.05, 0);
  group.add(top);

  // Shelves
  for (let r = 0; r < SHELF_ROWS; r++) {
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(UNIT_W, 0.05, frameDepth),
      woodMat
    );
    shelf.position.set(0, SHELF_BOTTOM + r * SHELF_H_GAP, 0);
    group.add(shelf);
  }

  // Books
  const count = member.count;
  const totalBooks = Math.min(count, SHELF_ROWS * BOOKS_PER_ROW);
  if (totalBooks > 0) {
    addBooks(group, totalBooks, member.hue, member.sat, side, count, isMobile);
  }

  // Member name label (canvas texture)
  const labelTex = buildLabel(member.name, member.count);
  const labelMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.22),
    new THREE.MeshBasicMaterial({ map: labelTex, transparent: true })
  );
  // Position label on side panel visible from room center
  labelMesh.position.set(signX * (UNIT_W / 2 - 0.04), SHELF_ROWS * SHELF_H_GAP + SHELF_BOTTOM - 0.12, 0.05);
  labelMesh.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
  group.add(labelMesh);

  // Focal data
  group.userData.focusTarget = side === 'left' ? 'leftShelf' : 'rightShelf';
  group.userData.memberName = member.name;

  // Subtle hover animation
  group.userData.update = (elapsed) => {
    // Very slight lean of topmost book
  };

  return group;
}

function addBooks(group, totalBooks, hue, sat, side, rawCount, isMobile) {
  const geo = new THREE.BoxGeometry(BOOK_W, 1, BOOK_D);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  const mat = isMobile
    ? new THREE.MeshLambertMaterial()
    : new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0 });
  const mesh = new THREE.InstancedMesh(geo, mat, totalBooks + 6);
  mesh.castShadow = false;

  let idx = 0;
  const frameDepth = 0.32;

  for (let r = 0; r < SHELF_ROWS && idx < totalBooks; r++) {
    const booksInRow = Math.min(BOOKS_PER_ROW, totalBooks - r * BOOKS_PER_ROW);
    if (booksInRow <= 0) break;

    const rowFill = booksInRow / BOOKS_PER_ROW;
    const startX = -UNIT_W / 2 + 0.07;

    for (let c = 0; c < booksInRow && idx < totalBooks; c++) {
      const h = BOOK_H_BASE * (0.75 + Math.random() * 0.5);
      const w = BOOK_W * (0.85 + Math.random() * 0.3);
      const tilt = (Math.random() - 0.5) * 0.06;

      dummy.position.set(
        startX + c * (UNIT_W - 0.14) / BOOKS_PER_ROW,
        SHELF_BOTTOM + r * SHELF_H_GAP + 0.05 + h / 2,
        -frameDepth / 2 + BOOK_D / 2 + 0.02
      );
      dummy.rotation.set(0, 0, tilt);
      dummy.scale.set(w / BOOK_W, h, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);

      // Varied colors in member's hue range
      const l = 0.38 + Math.random() * 0.28;
      const s = sat * (0.7 + Math.random() * 0.3);
      const hShift = hue + (Math.random() - 0.5) * 55;
      color.setHSL(((hShift % 360) + 360) / 360, s, l);
      mesh.setColorAt(idx, color);

      idx++;
    }

    // If shelf is overfull, add lying books on top
    if (rowFill >= 0.95 && r === SHELF_ROWS - 1) {
      for (let k = 0; k < 3 && idx < totalBooks + 3; k++) {
        dummy.position.set(
          -UNIT_W / 4 + k * 0.14,
          SHELF_BOTTOM + r * SHELF_H_GAP + BOOK_H_BASE * 1.1,
          -frameDepth / 2 + BOOK_D / 2
        );
        dummy.rotation.set(Math.PI / 2, 0, (Math.random() - 0.5) * 0.3);
        dummy.scale.set(1, BOOK_W * 1.2, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);
        color.setHSL(((hue + Math.random() * 40) % 360) / 360, sat * 0.8, 0.45);
        mesh.setColorAt(idx, color);
        idx++;
      }
    }
  }

  // Overflow stack on top of shelf (まちこ style)
  if (rawCount > SHELF_ROWS * BOOKS_PER_ROW) {
    for (let k = 0; k < Math.min(5, idx); k++) {
      dummy.position.set(
        UNIT_W / 4 - k * 0.03,
        SHELF_BOTTOM + SHELF_ROWS * SHELF_H_GAP + 0.15 + k * 0.08,
        0
      );
      dummy.rotation.set(0, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.15);
      dummy.scale.set(1, BOOK_H_BASE * 0.9, 1);
      dummy.updateMatrix();
      if (idx < totalBooks + 6) {
        mesh.setMatrixAt(idx, dummy.matrix);
        color.setHSL(((hue + Math.random() * 60) % 360) / 360, sat, 0.5);
        mesh.setColorAt(idx, color);
        idx++;
      }
    }
  }

  mesh.count = idx;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  group.add(mesh);
}

function buildLabel(name, count) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 100;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f7f0dc';
  ctx.fillRect(0, 0, 256, 100);
  ctx.strokeStyle = '#2a2a4a';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 252, 96);
  ctx.fillStyle = '#1a2a6c';
  ctx.font = "bold 32px 'Hiragino Mincho ProN','Yu Mincho',serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 128, 42);
  ctx.font = "20px 'Hiragino Mincho ProN','Yu Mincho',serif";
  ctx.fillStyle = '#555';
  ctx.fillText(`${count}冊`, 128, 74);
  const t = new THREE.CanvasTexture(c);
  return t;
}

export function createShelves(side, cameraCtrl, isMobile = false) {
  initMats(isMobile);
  const group = new THREE.Group();
  const members = MEMBERS.filter(m => m.wall === side);

  members.forEach(m => {
    const unit = buildShelfUnit(m, side, isMobile);
    unit.position.set(0, 0, m.zOffset);
    group.add(unit);
  });

  group.userData.focusTarget = side === 'left' ? 'leftShelf' : 'rightShelf';

  // Store reference for adding new books
  group.userData.addBook = (memberName) => {
    // flash and slightly shift to indicate new book
    const target = group.children.find(c => c.userData.memberName === memberName);
    if (target) {
      const origX = target.position.x;
      target.position.x += (side === 'left' ? -0.04 : 0.04);
      setTimeout(() => { target.position.x = origX; }, 300);
    }
  };

  return group;
}
