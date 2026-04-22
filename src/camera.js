import * as THREE from 'three';

const PRESETS = {
  home:       { pos: [0, 1.65, 7.5],  look: [0, 1.5, 0],      label: '' },
  blackboard: { pos: [0, 2.0, -3.8],  look: [0, 2.0, -7.5],   label: '黒板　— 今月の空気' },
  leftShelf:  { pos: [-5.5, 1.6, -2], look: [-8.5, 1.5, -2],  label: '本棚　— 左翼の記録' },
  rightShelf: { pos: [5.5, 1.6, -2],  look: [8.5, 1.5, -2],   label: '本棚　— 右翼の記録' },
  desk:       { pos: [0, 1.9, 1.5],   look: [0, 0.85, 2.8],   label: '机　— しおりを拾う' },
  noticeboard:{ pos: [5.5, 1.6, 4.5], look: [8.5, 1.5, 5.0],  label: '掲示板　— 新着' },
};

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.targetPos  = camera.position.clone();
    this.targetLook = new THREE.Vector3(0, 1.5, 0);
    this.currentLook = new THREE.Vector3(0, 1.5, 0);
    this.breathT = 0;
    this.currentPreset = 'home';
    this._labelTimeout = null;
    this.onDeskFocus = null;
    this.onBlackboardFocus = null;
  }

  focusOn(presetName) {
    const p = PRESETS[presetName];
    if (!p) return;
    this.currentPreset = presetName;

    this.targetPos.set(...p.pos);
    this.targetLook.set(...p.look);

    const el = document.getElementById('focus-label');
    const backBtn = document.getElementById('back-btn');

    if (this._labelTimeout) clearTimeout(this._labelTimeout);

    if (p.label) {
      el.textContent = p.label;
      el.classList.add('show');
      backBtn.classList.add('show');
      this._labelTimeout = setTimeout(() => el.classList.remove('show'), 2800);
    }

    if (presetName === 'desk' && this.onDeskFocus) {
      setTimeout(() => this.onDeskFocus(), 800);
    }
  }

  goHome() {
    this.focusOn('home');
    const backBtn = document.getElementById('back-btn');
    backBtn.classList.remove('show');
    document.getElementById('focus-label').classList.remove('show');
  }

  update(delta) {
    const t = this.breathT += delta * 0.35;
    const breath = Math.sin(t) * 0.0008;
    const drift  = Math.sin(t * 0.4) * 0.0003;

    const speed = this.currentPreset === 'home' ? 0.04 : 0.055;
    this.camera.position.lerp(this.targetPos, speed);
    this.camera.position.y += breath;
    this.camera.position.x += drift;

    this.currentLook.lerp(this.targetLook, 0.06);
    this.camera.lookAt(this.currentLook);
  }
}

export { PRESETS };
