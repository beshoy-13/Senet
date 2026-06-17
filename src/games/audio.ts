let audioCtx: AudioContext | null = null;
let muted = false;
let musicInterval: any = null;
let musicPlaying = false;
let noteIndex = 0;

// Soft cyber-brutalist arpeggio sequence
const melody = [
  110.00, 164.81, 220.00, 196.00,
  130.81, 196.00, 261.63, 246.94,
  146.83, 220.00, 293.66, 261.63,
  164.81, 246.94, 329.63, 293.66
];

try {
  const saved = localStorage.getItem('boardGamesMuted');
  muted = saved === 'true';
} catch {}

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function playNextMelodyNote() {
  if (muted || !musicPlaying) return;
  try {
    const ctx = getContext();
    if (ctx.state === 'suspended') return;
    
    const freq = melody[noteIndex];
    noteIndex = (noteIndex + 1) % melody.length;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle'; // Soft retro synth tone
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    // Very quiet ambient background volume
    gain.gain.setValueAtTime(0.0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.95);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.0);
  } catch {}
}

function beep(freq: number, duration: number, type: OscillatorType = 'square') {
  if (muted) return;
  try {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  } catch {}
}

export const AudioManager = {
  playMove() { beep(600, 80, 'square'); },
  playWin() {
    beep(523, 150, 'sine');
    setTimeout(() => beep(659, 150, 'sine'), 160);
    setTimeout(() => beep(784, 200, 'sine'), 320);
  },
  playDraw() { beep(300, 200, 'triangle'); },
  playClick() { beep(800, 50, 'square'); },
  playHover() { beep(1000, 30, 'sine'); },
  playError() { beep(200, 200, 'sawtooth'); },
  playDiceRoll() {
    if (muted) return;
    try {
      const ctx = getContext();
      if (ctx.state === 'suspended') return;
      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const rattleTime = now + (i * 0.08);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300 + Math.random() * 200, rattleTime);
        gain.gain.setValueAtTime(0.08, rattleTime);
        gain.gain.exponentialRampToValueAtTime(0.001, rattleTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(rattleTime);
        osc.stop(rattleTime + 0.06);
      }
      const landTime = now + 0.35;
      const oscLand = ctx.createOscillator();
      const gainLand = ctx.createGain();
      oscLand.type = 'sine';
      oscLand.frequency.setValueAtTime(150, landTime);
      gainLand.gain.setValueAtTime(0.12, landTime);
      gainLand.gain.exponentialRampToValueAtTime(0.001, landTime + 0.15);
      oscLand.connect(gainLand);
      gainLand.connect(ctx.destination);
      oscLand.start(landTime);
      oscLand.stop(landTime + 0.16);
    } catch {}
  },
  
  get isMuted() { return muted; },
  
  startMusic() {
    if (muted) return;
    if (musicPlaying) return;
    musicPlaying = true;
    
    if (musicInterval) clearInterval(musicInterval);
    
    // Auto-resume context upon user interaction to bypass browser policies
    try {
      const ctx = getContext();
      if (ctx.state === 'suspended') {
        const resume = () => {
          ctx.resume().then(() => {
            window.removeEventListener('click', resume);
            window.removeEventListener('keydown', resume);
            window.removeEventListener('touchstart', resume);
          });
        };
        window.addEventListener('click', resume);
        window.addEventListener('keydown', resume);
        window.addEventListener('touchstart', resume);
      }
    } catch {}

    musicInterval = setInterval(playNextMelodyNote, 600);
  },

  stopMusic() {
    musicPlaying = false;
    if (musicInterval) {
      clearInterval(musicInterval);
      musicInterval = null;
    }
  },

  toggle() {
    muted = !muted;
    try { localStorage.setItem('boardGamesMuted', JSON.stringify(muted)); } catch {}
    if (muted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return muted;
  },

  setMuted(val: boolean) {
    muted = val;
    try { localStorage.setItem('boardGamesMuted', JSON.stringify(val)); } catch {}
    if (muted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  },
};