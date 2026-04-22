export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.ambientGain = null;
    this.ready = false;
    this._initOnInteraction();
  }

  _initOnInteraction() {
    const init = () => {
      if (this.ready) return;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._startAmbient();
      this.ready = true;
      document.removeEventListener('click', init);
    };
    document.addEventListener('click', init, { once: true });
  }

  _startAmbient() {
    // Filtered noise → library hum
    const bufSize = this.ctx.sampleRate * 3;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let lastVal = 0;
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1;
      lastVal = lastVal * 0.99 + white * 0.01;
      data[i] = lastVal;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buf;
    source.loop = true;

    const lpf = this.ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 300;

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.04;

    source.connect(lpf).connect(this.ambientGain).connect(this.ctx.destination);
    source.start();
  }

  playChalk() {
    if (!this.ready) return;
    const duration = 0.18;
    const bufSize = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const env = Math.sin((i / bufSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.4;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buf;

    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 2200 + Math.random() * 800;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.25;

    source.connect(hpf).connect(gain).connect(this.ctx.destination);
    source.start();
  }

  playPaper() {
    if (!this.ready) return;
    const duration = 0.12;
    const bufSize = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const env = Math.exp(-i / (bufSize * 0.3));
      data[i] = (Math.random() * 2 - 1) * env * 0.5;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buf;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 4000;
    bpf.Q.value = 0.8;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.3;

    source.connect(bpf).connect(gain).connect(this.ctx.destination);
    source.start();
  }

  playClick() {
    if (!this.ready) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playBookAppear() {
    if (!this.ready) return;
    this.playPaper();
    setTimeout(() => this.playPaper(), 80);
    setTimeout(() => this.playClick(), 160);
  }
}
