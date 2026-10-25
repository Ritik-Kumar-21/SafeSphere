/**
 * EMBER Emergency Broadcast System - Tactical Audio Engine
 * Uses Web Audio API for zero-dependency, guaranteed-offline sound effects
 */

class TacticalAudioEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        
        // Load mute state from localStorage
        const storedMute = localStorage.getItem("ember_audio_muted");
        if (storedMute !== null) {
            this.muted = storedMute === "true";
        }
    }

    initContext() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }

    setMuted(mute) {
        this.muted = !!mute;
        if (this.muted) {
            this.stopEmergencyAlarm();
        }
        localStorage.setItem("ember_audio_muted", this.muted ? "true" : "false");
    }

    toggleMute() {
        this.setMuted(!this.muted);
        return this.muted;
    }

    playSwitchClick() {
        if (this.muted) return;
        this.initContext();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playArmTone() {
        if (this.muted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
    }

    playPing() {
        if (this.muted) return;
        this.initContext();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08); // A5

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
    }

    playSuccessChime() {
        if (this.muted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const noteStart = now + (idx * 0.07);

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0, noteStart);
            gain.gain.linearRampToValueAtTime(0.2, noteStart + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.28);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(noteStart);
            osc.stop(noteStart + 0.3);
        });
    }

    playEmergencyAlarm(duration = 5.0) {
        if (this.muted) return;
        this.initContext();
        if (!this.ctx) return;

        // Stop any currently running alarm before initiating new alarm
        this.stopEmergencyAlarm();

        const now = this.ctx.currentTime;
        const totalDuration = Number(duration) || 5.0;

        // Master Gain Envelope: fast attack, sustained full volume, clean exponential fade-out
        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(0.001, now);
        masterGain.gain.linearRampToValueAtTime(0.38, now + 0.06);
        masterGain.gain.setValueAtTime(0.38, now + Math.max(0, totalDuration - 0.45));
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + totalDuration);

        // Low-pass resonant filter for authentic industrial siren horn acoustics
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1550, now);
        filter.Q.setValueAtTime(3.8, now);

        // Primary Horn Oscillator: sawtooth wave for piercing high-threat urgency
        const osc1 = this.ctx.createOscillator();
        osc1.type = "sawtooth";

        // Sub-Harmonic Oscillator: triangle wave an octave lower for heavy acoustic weight
        const osc2 = this.ctx.createOscillator();
        osc2.type = "triangle";

        // Generate rapid sweeping siren frequency cycles across the full 5.0 seconds
        // 0.5s per cycle: 0.25s rising (520Hz -> 880Hz), 0.25s falling (880Hz -> 520Hz)
        // Exactly 10 cycles over 5.0 seconds for an urgent, pulse-pounding klaxon siren.
        const cycleDuration = 0.5;
        const totalCycles = Math.ceil(totalDuration / cycleDuration);

        for (let i = 0; i < totalCycles; i++) {
            const cycleStart = now + (i * cycleDuration);
            const cycleMid = cycleStart + (cycleDuration / 2);
            const cycleEnd = cycleStart + cycleDuration;

            // Primary horn frequency sweep
            osc1.frequency.setValueAtTime(520, cycleStart);
            if (cycleMid < now + totalDuration) {
                osc1.frequency.linearRampToValueAtTime(880, cycleMid);
            }
            if (cycleEnd <= now + totalDuration) {
                osc1.frequency.linearRampToValueAtTime(520, cycleEnd);
            } else {
                osc1.frequency.linearRampToValueAtTime(520, now + totalDuration);
            }

            // Sub-harmonic drone frequency sweep (half frequency)
            osc2.frequency.setValueAtTime(260, cycleStart);
            if (cycleMid < now + totalDuration) {
                osc2.frequency.linearRampToValueAtTime(440, cycleMid);
            }
            if (cycleEnd <= now + totalDuration) {
                osc2.frequency.linearRampToValueAtTime(260, cycleEnd);
            } else {
                osc2.frequency.linearRampToValueAtTime(260, now + totalDuration);
            }
        }

        // Sub-harmonic mix balance
        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(0.55, now);

        osc1.connect(filter);
        osc2.connect(subGain);
        subGain.connect(filter);

        filter.connect(masterGain);
        masterGain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);

        osc1.stop(now + totalDuration);
        osc2.stop(now + totalDuration);

        this._activeAlarmNodes = [osc1, osc2, masterGain];
        setTimeout(() => {
            if (this._activeAlarmNodes && this._activeAlarmNodes[0] === osc1) {
                this._activeAlarmNodes = null;
            }
        }, totalDuration * 1000);
    }

    stopEmergencyAlarm() {
        if (this._activeAlarmNodes) {
            try {
                const [osc1, osc2, masterGain] = this._activeAlarmNodes;
                if (this.ctx && masterGain) {
                    masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                    masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
                }
                if (osc1) osc1.stop();
                if (osc2) osc2.stop();
            } catch (e) {
                // Ignore if already stopped
            }
            this._activeAlarmNodes = null;
        }
    }
}

window.soundEngine = new TacticalAudioEngine();
