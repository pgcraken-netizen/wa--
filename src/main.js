import * as THREE from 'three';
import { CameraController } from './camera.js';
import { AudioSystem } from './audio.js';
import { buildScene } from './scene.js';
import { buildMobileScene } from './mobile-scene.js';
import { setupOverlay } from './overlay.js';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

let renderer, scene, camera, cameraCtrl, audioSys, clock;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function setStatus(msg) {
  const el = document.getElementById('status-msg');
  if (el) el.textContent = msg;
}

function init() {
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'low-power' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.shadowMap.enabled = false;
    if (!isMobile) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.85;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    document.getElementById('canvas-container').appendChild(renderer.domElement);
  } catch (e) {
    setStatus('WebGLが使用できません');
    return;
  }

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 60);
  camera.position.set(0, 1.65, 8.5);
  camera.lookAt(0, 1.5, 0);

  cameraCtrl = new CameraController(camera);
  clock = new THREE.Clock();

  setStatus('');

  try {
    if (isMobile) {
      buildMobileScene(scene, cameraCtrl);
    } else {
      audioSys = new AudioSystem();
      buildScene(scene, cameraCtrl, audioSys);
    }
    setupOverlay(scene, cameraCtrl, audioSys);
  } catch (e) {
    console.error('Scene build error:', e);
  }

  window._goHome = () => cameraCtrl.goHome();

  window.addEventListener('resize', onResize);
  renderer.domElement.addEventListener('click', onClick);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('touchstart', onTouch, { passive: true });

  entrance();
}

function entrance() {
  const veil = document.getElementById('veil');
  const hint = document.getElementById('hint');

  veil.style.opacity = '1';
  setTimeout(() => {
    veil.style.opacity = '0';
    setTimeout(() => {
      veil.style.pointerEvents = 'none';
      if (hint) {
        hint.classList.add('show');
        setTimeout(() => hint.classList.remove('show'), 5000);
      }
    }, 4000);
  }, 600);
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

  if (cameraCtrl.currentPreset !== 'home') {
    cameraCtrl.goHome();
  }
}

function onTouch(e) {
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    onClick({ clientX: touch.clientX, clientY: touch.clientY });
  }
}

function onMouseMove(e) {
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
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  cameraCtrl.update(delta);

  if (!isMobile) {
    scene.traverse(obj => {
      if (obj.userData && obj.userData.update) {
        obj.userData.update(elapsed, delta);
      }
    });
  }

  renderer.render(scene, camera);
}

init();
animate();
