import * as THREE from 'three';
import { createBlackboard } from './blackboard.js';
import { createShelves } from './shelves.js';
import { createDesk } from './desk.js';

const ROOM_W = 18, ROOM_D = 16, ROOM_H = 4.2;

export function buildScene(scene, cameraCtrl, audioSys) {
  scene.background = new THREE.Color(0xf0e8d8);
  scene.fog = new THREE.FogExp2(0xf0e8d8, 0.04);

  buildRoom(scene);
  buildLighting(scene);

  // Blackboard (back wall center)
  const blackboard = createBlackboard(cameraCtrl, audioSys);
  blackboard.position.set(0, 2.1, -ROOM_D / 2 + 0.08);
  scene.add(blackboard);

  // Left bookshelves
  const leftShelves = createShelves('left', cameraCtrl);
  leftShelves.position.set(-ROOM_W / 2 + 0.18, 0, -6.8);
  leftShelves.rotation.y = Math.PI / 2;
  scene.add(leftShelves);

  // Right bookshelves
  const rightShelves = createShelves('right', cameraCtrl);
  rightShelves.position.set(ROOM_W / 2 - 0.18, 0, -6.8);
  rightShelves.rotation.y = -Math.PI / 2;
  scene.add(rightShelves);

  // Desk
  const desk = createDesk(cameraCtrl);
  desk.position.set(0, 0, 2.5);
  scene.add(desk);

  // Noticeboard
  buildNoticeboard(scene, cameraCtrl);

  // Reading tables
  buildReadingTables(scene);

  // Bell
  buildBell(scene);

  return scene;
}

function buildRoom(scene) {
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xe2d5be, roughness: 0.85,
  });
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xf0e8d8, roughness: 0.92,
  });
  const ceilMat = new THREE.MeshStandardMaterial({
    color: 0xf5f0e8, roughness: 0.9,
  });

  // Floor with tile grid
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D, 18, 16), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Back wall
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_H), wallMat);
  backWall.position.set(0, ROOM_H / 2, -ROOM_D / 2);
  backWall.receiveShadow = true;
  scene.add(backWall);

  // Front wall (behind camera, partial)
  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_H), wallMat);
  frontWall.position.set(0, ROOM_H / 2, ROOM_D / 2);
  frontWall.rotation.y = Math.PI;
  scene.add(frontWall);

  // Left wall
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-ROOM_W / 2, ROOM_H / 2, 0);
  leftWall.receiveShadow = true;
  scene.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), wallMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(ROOM_W / 2, ROOM_H / 2, 0);
  rightWall.receiveShadow = true;
  scene.add(rightWall);

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ROOM_H;
  scene.add(ceiling);

  // Ceiling grid tiles (subtle)
  const tileGeo = new THREE.PlaneGeometry(1.2, 1.2);
  const tileMat = new THREE.MeshStandardMaterial({ color: 0xf8f4ec, roughness: 0.9 });
  for (let x = -7; x <= 7; x += 1.25) {
    for (let z = -7; z <= 7; z += 1.25) {
      const tile = new THREE.Mesh(tileGeo, tileMat);
      tile.rotation.x = Math.PI / 2;
      tile.position.set(x, ROOM_H - 0.01, z);
      scene.add(tile);
    }
  }

  // Fluorescent light fixtures
  const fixtureMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xfff8e0),
    emissiveIntensity: 0.6,
  });
  [[-3, 0], [0, 0], [3, 0], [-3, -3], [3, -3]].forEach(([x, z]) => {
    const fix = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.28), fixtureMat);
    fix.position.set(x, ROOM_H - 0.03, z);
    scene.add(fix);
  });

  // Window (left wall)
  const windowGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 2.2),
    new THREE.MeshBasicMaterial({ color: 0xc8e8f8, transparent: true, opacity: 0.55 })
  );
  windowGlass.rotation.y = Math.PI / 2;
  windowGlass.position.set(-ROOM_W / 2 + 0.02, 2.2, -0.5);
  scene.add(windowGlass);

  // Window frame
  const wfMat = new THREE.MeshStandardMaterial({ color: 0xf0ece0, roughness: 0.7 });
  buildWindowFrame(scene, -ROOM_W / 2, 2.2, -0.5, wfMat);

  // Baseboard
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xd4c4a0, roughness: 0.8 });
  [
    [new THREE.BoxGeometry(ROOM_W, 0.12, 0.06), [0, 0.06, -ROOM_D / 2 + 0.03], 0],
    [new THREE.BoxGeometry(ROOM_D, 0.12, 0.06), [ROOM_W / 2 - 0.03, 0.06, 0], Math.PI / 2],
    [new THREE.BoxGeometry(ROOM_D, 0.12, 0.06), [-ROOM_W / 2 + 0.03, 0.06, 0], -Math.PI / 2],
  ].forEach(([geo, pos, ry]) => {
    const mesh = new THREE.Mesh(geo, baseMat);
    mesh.position.set(...pos);
    mesh.rotation.y = ry;
    scene.add(mesh);
  });
}

function buildWindowFrame(scene, wx, wy, wz, mat) {
  const thickness = 0.06;
  const ww = 3.0, wh = 2.4;
  [
    [ww + thickness, thickness, 0, wy + wh / 2],
    [ww + thickness, thickness, 0, wy - wh / 2],
    [thickness, wh, -wh / 2 + wz, wy],
    [thickness, wh, wh / 2 + wz, wy],
  ].forEach(([w, h, pz, py]) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(thickness, h, w), mat);
    mesh.rotation.y = Math.PI / 2;
    mesh.position.set(wx, py, pz);
    scene.add(mesh);
  });
}

function buildLighting(scene) {
  // Ambient
  const ambient = new THREE.AmbientLight(0xfff8e8, 0.45);
  scene.add(ambient);

  // Main ceiling lights (warm)
  [[-3, 0], [0, 0], [3, 0], [-3, -3], [3, -3]].forEach(([x, z]) => {
    const light = new THREE.PointLight(0xfff5e0, 0.5, 8, 1.5);
    light.position.set(x, 3.9, z);
    scene.add(light);
  });

  // Window light (directional, from left-outside)
  const sunLight = new THREE.DirectionalLight(0xfff8e8, 0.9);
  sunLight.position.set(-6, 4, 1);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 30;
  sunLight.shadow.camera.left  = -12;
  sunLight.shadow.camera.right =  12;
  sunLight.shadow.camera.top   =  8;
  sunLight.shadow.camera.bottom = -8;
  scene.add(sunLight);

  // Time-based tint
  applyTimeOfDay(scene);
}

function applyTimeOfDay(scene) {
  const hour = new Date().getHours();
  let ambientColor, ambientIntensity;

  if (hour >= 6 && hour < 9) {
    // Sunrise: warm pink-orange
    ambientColor = 0xffe8d0; ambientIntensity = 0.38;
  } else if (hour >= 9 && hour < 16) {
    // Daytime: neutral warm
    ambientColor = 0xfff8e8; ambientIntensity = 0.45;
  } else if (hour >= 16 && hour < 19) {
    // Golden hour
    ambientColor = 0xffe0a0; ambientIntensity = 0.40;
  } else if (hour >= 19 && hour < 22) {
    // Evening lamp
    ambientColor = 0xffd880; ambientIntensity = 0.30;
  } else {
    // Night: subdued
    ambientColor = 0xd0d8e8; ambientIntensity = 0.20;
  }

  // Update existing ambient (first in scene)
  scene.traverse(obj => {
    if (obj.isAmbientLight) {
      obj.color.set(ambientColor);
      obj.intensity = ambientIntensity;
    }
  });

  // Fog color follows ambient
  if (scene.fog) scene.fog.color.set(ambientColor);
  scene.background = new THREE.Color(ambientColor);
}

function buildNoticeboard(scene, cameraCtrl) {
  const group = new THREE.Group();

  // Cork board
  const corkMat = new THREE.MeshStandardMaterial({
    color: 0xc8a870,
    roughness: 0.92,
  });

  const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.06), corkMat);
  group.add(board);

  // Frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x7a5a30, roughness: 0.8 });
  [[2.5, 0.1, 0.08, 0, 0.85], [2.5, 0.1, 0.08, 0, -0.85],
   [0.1, 1.8, 0.08, -1.25, 0], [0.1, 1.8, 0.08, 1.25, 0]].forEach(([w, h, d, x, y]) => {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat);
    f.position.set(x, y, 0.04);
    group.add(f);
  });

  // Pinned papers (5-6 notices)
  const notices = [
    { title: '新着',    color: 0xfffde8, x: -0.7, y:  0.3, rot: -0.05 },
    { title: '今週のおすすめ', color: 0xe8f4ff, x:  0.3, y:  0.4, rot:  0.04 },
    { title: '読書会',   color: 0xfff0e8, x: -0.5, y: -0.2, rot:  0.06 },
    { title: 'お知らせ', color: 0xf0ffe8, x:  0.6, y: -0.3, rot: -0.03 },
    { title: '近況',    color: 0xffe8f4, x:  0.1, y:  0.1, rot:  0.02 },
  ];

  notices.forEach(n => {
    const paper = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.55, 0.005),
      new THREE.MeshStandardMaterial({ color: n.color, roughness: 0.9 })
    );
    paper.position.set(n.x, n.y, 0.04);
    paper.rotation.z = n.rot;

    // New notice floats slightly
    if (n.title === '新着') {
      paper.position.z = 0.08;
      paper.userData.update = (elapsed) => {
        paper.position.y = n.y + Math.sin(elapsed * 1.5) * 0.01;
        paper.rotation.z = n.rot + Math.sin(elapsed * 0.8) * 0.015;
      };
    }

    group.add(paper);

    // Pin dot
    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.4, metalness: 0.3 })
    );
    pin.position.set(n.x, n.y + 0.24, 0.07);
    group.add(pin);
  });

  // Title text on board
  const titleTex = buildNoticeTitle();
  const titleMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 0.22),
    new THREE.MeshBasicMaterial({ map: titleTex, transparent: true })
  );
  titleMesh.position.set(0, 0.68, 0.05);
  group.add(titleMesh);

  group.position.set(7.4, 1.9, 4.5);
  group.rotation.y = -Math.PI / 2;

  group.userData.focusTarget = 'noticeboard';
  board.userData.focusTarget = 'noticeboard';

  scene.add(group);
}

function buildNoticeTitle() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f0e8c8';
  ctx.fillRect(0, 0, 512, 64);
  ctx.fillStyle = '#4a3020';
  ctx.font = "bold 22px 'Hiragino Mincho ProN','Yu Mincho',serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('図書委員会 掲示板', 256, 32);
  return new THREE.CanvasTexture(c);
}

function buildReadingTables(scene) {
  const topMat = new THREE.MeshStandardMaterial({ color: 0xb88a52, roughness: 0.6 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x8b6030, roughness: 0.8 });

  const positions = [
    [-1.8, 0, -1.0], [1.8, 0, -1.0],
    [-1.8, 0,  1.0], [1.8, 0,  1.0],
  ];

  positions.forEach(([x, y, z]) => {
    // Table top
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.7), topMat);
    top.position.set(x, 0.73, z);
    top.castShadow = true; top.receiveShadow = true;
    scene.add(top);

    // Legs
    [[-0.48, -0.3], [-0.48, 0.3], [0.48, -0.3], [0.48, 0.3]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.73, 0.05), legMat);
      leg.position.set(x + lx, 0.365, z + lz);
      scene.add(leg);
    });

    // Chair
    buildChair(scene, x, z);
  });
}

function buildChair(scene, tx, tz) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xc8a870, roughness: 0.75 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x8b6030, roughness: 0.8 });

  const cx = tx + (Math.random() - 0.5) * 0.3;
  const cz = tz + 0.6 + Math.random() * 0.2;

  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.42), mat);
  seat.position.set(cx, 0.44, cz);
  scene.add(seat);

  // Seat legs
  [[-0.18, -0.18], [-0.18, 0.18], [0.18, -0.18], [0.18, 0.18]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.44, 0.03), legMat);
    leg.position.set(cx + lx, 0.22, cz + lz);
    scene.add(leg);
  });

  // Backrest
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.35, 0.04), mat);
  back.position.set(cx, 0.67, cz - 0.21);
  back.rotation.x = 0.08;
  scene.add(back);
}

function buildBell(scene) {
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xd4aa44, roughness: 0.3, metalness: 0.7 });

  // Support beam
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.4), new THREE.MeshStandardMaterial({ color: 0x8b6030, roughness: 0.7 }));
  beam.position.set(3, ROOM_H - 0.25, 5.5);
  scene.add(beam);

  // Bell
  const bellGroup = new THREE.Group();
  const bell = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.2, 16, 1, true),
    metalMat
  );
  bell.rotation.x = Math.PI;
  bellGroup.add(bell);

  const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), metalMat);
  clapper.position.y = -0.14;
  bellGroup.add(clapper);

  bellGroup.position.set(3, ROOM_H - 0.45, 5.5);

  // Gentle swing
  bellGroup.userData.update = (elapsed) => {
    bellGroup.rotation.z = Math.sin(elapsed * 0.3) * 0.025;
  };

  scene.add(bellGroup);
}
