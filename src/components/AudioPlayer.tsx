import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  const startAtmosphereSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Soft water stream white noise generator
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Water bandpass filter (simulating gentle river stream)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();

      // Gentle Thai bell / pentatonic chime generator
      // Pentatonic notes (Thai Ranad / Gong scale approx): F, G, A, C, D
      const notes = [349.23, 392.0, 440.0, 523.25, 587.33, 698.46];

      const playChime = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const freq = notes[Math.floor(Math.random() * notes.length)];

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        noteGain.gain.setValueAtTime(0.001, ctx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.0);

        osc.connect(noteGain);
        noteGain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 3.2);

        // Schedule next random chime
        const nextTime = 2500 + Math.random() * 4500;
        timerRef.current = window.setTimeout(playChime, nextTime);
      };

      playChime();
      setIsPlaying(true);
    } catch (e) {
      console.warn('AudioContext not allowed yet', e);
    }
  };

  const stopAtmosphereSound = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  };

  const toggleSound = () => {
    if (isPlaying) {
      stopAtmosphereSound();
    } else {
      startAtmosphereSound();
    }
  };

  useEffect(() => {
    return () => {
      stopAtmosphereSound();
    };
  }, []);

  return (
    <button
      onClick={toggleSound}
      className={`pointer-events-auto p-2.5 sm:px-3 sm:py-2.5 rounded-xl border backdrop-blur-md transition-all shadow-md active:scale-95 flex items-center space-x-1.5 text-xs ${
        isPlaying
          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
          : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-slate-200'
      }`}
      title={isPlaying ? 'ปิดเสียงบรรยากาศ' : 'เปิดเสียงบรรยากาศริมน้ำ & ดนตรีไทย'}
    >
      {isPlaying ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
      <span className="hidden sm:inline font-medium">
        {isPlaying ? 'เสียงบรรยากาศเปิดอยู่' : 'เปิดเสียง'}
      </span>
    </button>
  );
};
