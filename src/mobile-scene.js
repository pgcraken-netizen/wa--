import * as THREE from 'three';
import { MEMBERS } from './data.js';

const ROOM_W = 14, ROOM_D = 12, ROOM_H = 4;
const B = (color, opts = {}) => new THREE.MeshBasicMaterial({ color, ...opts });

export function buildMobileScene(scene, cameraCtrl) {
  scene.background = new THREE.Color(0xf0e8d8);

  buildRoom(scene);
  buildBlackboard(scene, cameraCtrl);
  buildShelves(scene, cameraCtrl);
  buildDesk(scene, cameraCtrl);
  buildNoticeboard(scene, cameraCtrl);
}

function buildRoom(scene) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), B(0xe2d5be));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_H), B(0xf0e8d8));
  back.position.set(0, ROOM_H / 2, -ROOM_D / 2);
  scene.add(back);

  const left = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), B(0xeee6d6));
  left.rotation.y = Math.PI / 2;
  left.position.set(-ROOM_W / 2, ROOM_H / 2, 0);
  scene.add(left);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), B(0xeee6d6));
  right.rotation.y = -Math.PI / 2;
  right.position.set(ROOM_W / 2, ROOM_H / 2, 0);
  scene.add(right);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), B(0xf5f0e8));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = ROOM_H;
  scene.add(ceil);

  // Window
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), B(0xc8e8f8, { transparent: true, opacity: 0.55 }));
  win.rotation.y = Math.PI / 2;
  win.position.set(-ROOM_W / 2 + 0.02, 2.2, -0.5);
  scene.add(win);
}

function buildBlackboard(scene, cameraCtrl) {
  const group = new THREE.Group();

  const frame = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.2, 0.12), B(0x3a2a1a));
  group.add(frame);

  const board = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.8, 0.04), B(0x1a3320));
  board.position.z = 0.05;
  group.add(board);

  // Bar chart bars using MEMBERS data
  const maxCount = Math.max(...MEMBERS.map(m => m.count));
  const barW = 0.36, maxBarH = 1.8;
  const totalMembers = MEMBERS.length;
  const startX = -(totalMembers - 1) * (barW + 0.08) / 2;

  MEMBERS.forEach((m, i) => {
    const h = (m.count / maxCount) * maxBarH;
    const color = new THREE.Color();
    color.setHSL(((m.hue % 360) + 360) / 360, m.sat * 0.7, 0.55);

    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(barW, h, 0.03),
      new THREE.MeshBasicMaterial({ color })
    );
    bar.position.set(startX + i * (barW + 0.08), -maxBarH / 2 + h / 2 + 0.1, 0.07);
    group.add(bar);
  });

  group.position.set(0, 2.1, -ROOM_D / 2 + 0.08);
  group.userData.focusTarget = 'blackboard';
  board.userData.focusTarget = 'blackboard';

  scene.add(group);
}

function buildShelves(scene, cameraCtrl) {
  const leftMembers  = MEMBERS.filter(m => m.wall === 'left');
  const rightMembers = MEMBERS.filter(m => m.wall === 'right');

  buildShelfWall(scene, cameraCtrl, leftMembers,  'left');
  buildShelfWall(scene, cameraCtrl, rightMembers, 'right');
}

function buildShelfWall(scene, cameraCtrl, members, side) {
  const group = new THREE.Group();
  const signX = side === 'left' ? 1 : -1;

  members.forEach((m, i) => {
    const unit = buildSimpleShelf(m);
    unit.position.set(0, 0, m.zOffset);
    group.add(unit);
  });

  group.position.set(side === 'left' ? -ROOM_W / 2 + 0.18 : ROOM_W / 2 - 0.18, 0, -5);
  group.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
  group.userData.focusTarget = side === 'left' ? 'leftShelf' : 'rightShelf';

  scene.add(group);
}

function buildSimpleShelf(member) {
  const group = new THREE.Group();
  const W = 2.0, H = 2.8, D = 0.28;

  // Shelf frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, H, D), B(0x8b5c30));
  frame.position.y = H / 2 + 0.15;
  group.add(frame);

  const back = new THREE.Mesh(new THREE.BoxGeometry(W, H - 0.1, 0.04), B(0x6b4420));
  back.position.set(0, H / 2 + 0.15, -D / 2 + 0.02);
  group.add(back);

  // Books — simplified rectangles filling shelves
  const maxCount = 110;
  const fillRatio = Math.min(member.count / maxCount, 1);
  const shelves = 5;
  const color = new THREE.Color();
  color.setHSL(((member.hue % 360) + 360) / 360, member.sat * 0.7, 0.50);

  for (let r = 0; r < shelves; r++) {
    const rowFill = Math.min(1, Math.max(0, fillRatio * shelves - r));
    if (rowFill <= 0) break;
    const bookW = W * 0.9 * rowFill;
    const bookH = 0.36 + Math.random() * 0.06;
    const y = 0.18 + r * 0.5 + bookH / 2 + 0.05;

    // Slight color variation per shelf
    const c2 = color.clone();
    c2.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);

    const books = new THREE.Mesh(
      new THREE.BoxGeometry(bookW, bookH, D * 0.8),
      new THREE.MeshBasicMaterial({ color: c2 })
    );
    books.position.set(-W * 0.45 + bookW / 2, y, 0);
    group.add(books);
  }

  group.userData.focusTarget = member.wall === 'left' ? 'leftShelf' : 'rightShelf';
  group.userData.memberName = member.name;
  return group;
}

function buildDesk(scene, cameraCtrl) {
  const group = new THREE.Group();

  const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.9), B(0xb88a52));
  top.position.y = 0.74;
  group.add(top);

  const legMat = B(0x8b6030);
  [[-0.7, -0.4], [-0.7, 0.4], [0.7, -0.4], [0.7, 0.4]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.74, 0.06), legMat);
    leg.position.set(x, 0.37, z);
    group.add(leg);
  });

  // Open book on desk
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.42), B(0xf5f0e4));
  book.position.set(0, 0.78, 0);
  group.add(book);

  // Bookmark card hint
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.4, 0.005), B(0xf7f2e4));
  card.position.set(0.25, 0.80, -0.05);
  card.rotation.z = 0.08;
  group.add(card);

  group.position.set(0, 0, 2.5);
  group.userData.focusTarget = 'desk';
  top.userData.focusTarget = 'desk';
  book.userData.focusTarget = 'desk';
  card.userData.focusTarget = 'desk';

  scene.add(group);
}

function buildNoticeboard(scene, cameraCtrl) {
  const group = new THREE.Group();

  const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.08), B(0xc8a870));
  group.add(board);
  board.userData.focusTarget = 'noticeboard';

  const frameMat = B(0x7a5a30);
  [[2.5, 0.1, 0, 0.85], [2.5, 0.1, 0, -0.85]].forEach(([w, h, x, y]) => {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), frameMat);
    f.position.set(x, y, 0.04);
    group.add(f);
  });

  const papers = [
    { color: 0xfffde8, x: -0.6, y: 0.3 },
    { color: 0xe8f4ff, x:  0.4, y: 0.4 },
    { color: 0xfff0e8, x: -0.4, y: -0.2 },
    { color: 0xf0ffe8, x:  0.5, y: -0.3 },
  ];
  papers.forEach(p => {
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.01), B(p.color));
    paper.position.set(p.x, p.y, 0.05);
    group.add(paper);
  });

  group.position.set(6.6, 1.9, 4.0);
  group.rotation.y = -Math.PI / 2;
  group.userData.focusTarget = 'noticeboard';

  scene.add(group);
}
