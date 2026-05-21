// Web Audio API Retro Sound Effects & Music Synthesizer

class AudioSystem {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.masterVolume = null;
        
        // Channel Gains
        this.musicGain = null;
        this.sfxGain = null;
        
        // Volumes (0.0 to 1.0)
        this.musicVolume = 0.4;
        this.sfxVolume = 0.5;
        
        // Noise buffer cache
        this.noiseBuffer = null;
        
        // BGM State
        this.bgmInterval = null;
        this.bgmStep = 0;
    }

    init() {
        if (this.ctx) return;
        
        try {
            // Support both standard and prefixed AudioContext
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            
            // Master gain node
            this.masterVolume = this.ctx.createGain();
            this.masterVolume.gain.setValueAtTime(this.muted ? 0 : 0.25, this.ctx.currentTime); // keep it balanced
            this.masterVolume.connect(this.ctx.destination);
            
            // Channel gains connecting to Master
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
            this.musicGain.connect(this.masterVolume);
            
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
            this.sfxGain.connect(this.masterVolume);
            
            // Build noise buffer once for explosions/shots
            this.createNoiseBuffer();
        } catch (e) {
            console.warn("Web Audio API not supported in this browser:", e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMusicVolume(vol) {
        this.musicVolume = Math.max(0, Math.min(1, vol));
        if (this.musicGain && this.ctx) {
            this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        }
    }

    setSfxVolume(vol) {
        this.sfxVolume = Math.max(0, Math.min(1, vol));
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterVolume && this.ctx) {
            this.masterVolume.gain.setValueAtTime(this.muted ? 0 : 0.25, this.ctx.currentTime);
        }
        return this.muted;
    }

    createNoiseBuffer() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds of noise
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    playNoise(duration, lowpassFreq, volume) {
        if (!this.ctx || this.muted || this.sfxVolume === 0) return;
        this.resume();

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(lowpassFreq, this.ctx.currentTime);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.sfxGain);

        noise.start();
        noise.stop(this.ctx.currentTime + duration);
    }

    playJump() {
        if (!this.ctx || this.muted || this.sfxVolume === 0) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(750, this.ctx.currentTime + 0.12);
        
        gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    playShoot() {
        if (!this.ctx || this.muted || this.sfxVolume === 0) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(900, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);

        // Add subtle noisy friction to the shot
        this.playNoise(0.08, 1200, 0.4);
    }



    playHit() {
        if (!this.ctx || this.muted || this.sfxVolume === 0) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.setValueAtTime(100, this.ctx.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);

        // Quick crunch noise
        this.playNoise(0.06, 600, 0.5);
    }



    playAmmo() {
        if (!this.ctx || this.muted || this.sfxVolume === 0) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'triangle';
        const t = this.ctx.currentTime;
        osc.frequency.setValueAtTime(523, t); // C5
        osc.frequency.setValueAtTime(659, t + 0.06); // E5
        osc.frequency.setValueAtTime(784, t + 0.12); // G5
        osc.frequency.setValueAtTime(1047, t + 0.18); // C6
        
        gainNode.gain.setValueAtTime(0.25, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        osc.start();
        osc.stop(t + 0.35);
    }

    playPowerup() {
        if (!this.ctx || this.muted || this.sfxVolume === 0) return;
        this.resume();

        // Inspiring powerup chime (arpeggio synth sweep)
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.type = 'sine';
        
        const t = this.ctx.currentTime;
        osc.frequency.setValueAtTime(587.33, t); // D5
        osc.frequency.setValueAtTime(783.99, t + 0.06); // G5
        osc.frequency.setValueAtTime(987.77, t + 0.12); // B5
        osc.frequency.setValueAtTime(1479.98, t + 0.18); // F#6
        
        gainNode.gain.setValueAtTime(0.25, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        osc.start();
        osc.stop(t + 0.45);
    }

    playZombieDeath() {
        if (!this.ctx || this.muted || this.sfxVolume === 0) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, this.ctx.currentTime);

        gainNode.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playPlayerHit() {
        if (!this.ctx || this.muted || this.sfxVolume === 0) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.25);
        
        gainNode.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);

        // Heavy low-pass explosion rumble
        this.playNoise(0.3, 300, 0.8);
    }

    playGameOver() {
        this.stopBGM();
        if (!this.ctx || this.muted || this.sfxVolume === 0) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        
        const t = this.ctx.currentTime;
        osc.frequency.setValueAtTime(440, t);       // A4
        osc.frequency.setValueAtTime(349, t + 0.15);  // F4
        osc.frequency.setValueAtTime(293, t + 0.3);   // D4
        osc.frequency.setValueAtTime(220, t + 0.45);  // A3
        osc.frequency.setValueAtTime(165, t + 0.6);   // E3
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, t);

        gainNode.gain.setValueAtTime(0.3, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 1.0);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        osc.start();
        osc.stop(t + 1.0);
    }

    // --- PROCEDURAL MUSIC (BGM) Sequencer ---

    startBGM() {
        if (this.bgmInterval) return;
        
        this.init();
        this.resume();
        this.bgmStep = 0;
        
        const tempo = 135; // BPM
        const intervalMs = (60 / tempo / 2) * 1000; // 8th note duration in ms
        
        // Start play immediately and then loop
        this.playBgmStep();
        this.bgmInterval = setInterval(() => {
            this.playBgmStep();
        }, intervalMs);
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }

    playBgmStep() {
        if (!this.ctx || this.muted || this.musicVolume === 0) return;
        
        const t = this.ctx.currentTime;
        const step = this.bgmStep % 16;
        const stepDuration = 60 / 135 / 2;
        
        // A minor / F major / C major / G major chords bassline
        const bassNotes = [
            110.00, 110.00, 110.00, 110.00, // A2 (Am)
            87.31,  87.31,  87.31,  87.31,  // F2 (F)
            130.81, 130.81, 130.81, 130.81, // C3 (C)
            98.00,  98.00,  98.00,  98.00   // G2 (G)
        ];
        
        // Spooky upbeat retro lead melody (sine/triangle for chiptune feel)
        const melodyNotes = [
            220.00, 0, 261.63, 329.63, 0, 261.63, 329.63, 0, // Am lead
            349.23, 0, 261.63, 349.23, 0, 349.23, 440.00, 0, // F lead
            261.63, 0, 329.63, 392.00, 0, 329.63, 392.00, 0, // C lead
            392.00, 0, 293.66, 392.00, 0, 392.00, 493.88, 0  // G lead
        ];

        // 1. Play Bass Note (Triangle oscillator)
        const bassFreq = bassNotes[step];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassFreq, t);
        
        bassGain.gain.setValueAtTime(this.musicVolume * 0.14, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration - 0.02);
        
        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain);
        
        bassOsc.start(t);
        bassOsc.stop(t + stepDuration - 0.01);
        
        // 2. Play lead melody note on certain steps
        const leadFreq = melodyNotes[this.bgmStep % 32];
        if (leadFreq > 0) {
            const leadOsc = this.ctx.createOscillator();
            const leadGain = this.ctx.createGain();
            
            leadOsc.type = 'triangle'; // triangle is soft and retro
            leadOsc.frequency.setValueAtTime(leadFreq, t);
            
            leadGain.gain.setValueAtTime(this.musicVolume * 0.08, t);
            leadGain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 1.4);
            
            leadOsc.connect(leadGain);
            leadGain.connect(this.musicGain);
            
            leadOsc.start(t);
            leadOsc.stop(t + stepDuration * 1.4);
        }
        
        this.bgmStep++;
    }
}

// Global instance of audio system
const gameAudio = new AudioSystem();
