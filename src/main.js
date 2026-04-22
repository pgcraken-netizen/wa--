import * as THREE from 'three';
import { CameraController } from './camera.js';
import { AudioSystem } from './audio.js';
import { buildScene } from './scene.js';
import { setupOverlay } from './overlay.js';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

let renderer, scene, camera, cameraCtrl, audioSys, clock;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// ── veilは必ずフェード（JS成否に関わらず）──
function fadeVeil(delay = 800) {
  const veil = document.getElementById('veil');
  setTimeout(() => {
    veil.style.opacity = '0';
    setTimeout(() => { veil.style.display = 'none'; }, 4500);
  }, delay);
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
  console.error('[WA読書部]', msg);
}

function checkWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  } catch { return false; }
}

function init() {
  if (!checkWebGL()) {
    showError('このブラウザはWebGLに対応していません。Chrome / Safari 最新版でお試しください。');
    return;
  }

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.getElementById('canvas-container').appendChild(renderer.domElement);
  } catch (e) {
    showError('描画エンジンの初期化に失敗しました: ' + e.message);
    return;
  }

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 60);
  camera.position.set(0, 1.65, 8.5);
  camera.lookAt(0, 1.5, 0);

  cameraCtrl = new CameraController(camera);
  audioSys = new AudioSystem();
  clock = new THREE.Clock();

  try {
    buildScene(scene, cameraCtrl, audioSys, isMobile);
  } catch (e) {
    showError('シーン構築エラー: ' + e.message);
    // シーン構築失敗しても描画ループは続ける
  }

  try {
    setupOverlay(scene, cameraCtrl, audioSys);
  } catch (e) {
    console.error('overlay error:', e);
  }

  window._goHome = () => cameraCtrl.goHome();
  window.addEventListener('resize', onResize);
  renderer.domElement.addEventListener('click', onClick);
  if (!isMobile) renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('touchstart', onTouch, { passive: true });

  // ヒント
  setTimeout(() => {
    const hint = document.getElementById('hint');
    if (hint) {
      hint.classList.add('show');
      setTimeout(() => hint.classList.remove('show'), 5000);
    }
  }, 2000);
}

function resolveTarget(object) {
  let obj = object;
  for (let i = 0; i < 8; i++) {
    if (obj.userData && obj.userData.focusTarget) return obj.userData.focusTarget;
    if (!obj.parent) break;
    obj = obj.parent;
  }
  return null;
}

function onClick(e) {
  if (!renderer || !scene) return;
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(scene.children, true);

  for (const hit of hits) {
    const target = resolveTarget(hit.object);
    if (target) {
      cameraCtrl.focusOn(target);
      if (target === 'blackboard' && cameraCtrl.onBlackboardFocus) {
        setTimeout(() => cameraCtrl.onBlackboardFocus(), 700);
      }
      if (audioSys) audioSys.playClick();
      return;
    }
  }

  if (cameraCtrl && cameraCtrl.currentPreset !== 'home') {
    cameraCtrl.goHome();
  }
}

function onTouch(e) {
  if (e.touches.length === 1) {
    onClick({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
  }
}

function onMouseMove(e) {
  if (!renderer || !scene) return;
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  let found = false;
  for (const hit of hits) {
    if (resolveTarget(hit.object)) { found = true; break; }
  }
  renderer.domElement.style.cursor = found ? 'pointer' : 'default';
}

function onResize() {
  if (!renderer || !camera) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  if (!renderer || !scene || !camera) return;
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  if (cameraCtrl) cameraCtrl.update(delta);
  scene.traverse(obj => {
    if (obj.userData && obj.userData.update) {
      try { obj.userData.update(elapsed, delta); } catch {}
    }
  });
  renderer.render(scene, camera);
}

// veilは必ずフェード（JS成否に関わらず）
fadeVeil(600);
init();
animate();
