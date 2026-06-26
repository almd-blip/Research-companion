/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { WELLBEING_RESOURCES, SOUNDSCAPES } from '../data';
import { Clock, Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, BookOpen, AlertCircle, Heart } from 'lucide-react';

export default function ResearchWellbeing() {
  const [activeWellbeingTab, setActiveWellbeingTab] = useState<'wellbeing_guides' | 'pomodoro' | 'decompression'>('pomodoro');
  const [activeGuide, setActiveGuide] = useState<'impostor' | 'supervisor' | 'rejection'>('impostor');

  // Pomodoro states
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Procedural Web Audio States
  const [activeSoundscape, setActiveSoundscape] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Small wins log
  const [smallWins, setSmallWins] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('wellbeing_small_wins') || '["Completed literature outline of Chapter 1", "Corrected Vance et al. citation metadata"]');
  });
  const [newWin, setNewWin] = useState('');

  // Pomodoro timer effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerRunning(false);
      if (!isBreak) {
        setNotification("Deep work session completed! Take a gentle, offline breath.");
        setIsBreak(true);
        setTimeLeft(5 * 60);
      } else {
        setNotification("Break completed. Ready to anchor focus?");
        setIsBreak(false);
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft, isBreak]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopProceduralAudio();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePomodoroReset = () => {
    setTimerRunning(false);
    setIsBreak(false);
    setTimeLeft(25 * 60);
  };

  // ----------------- PROCEDURAL AUDIO SYNTHESIZER -----------------
  // Synthesizes natural sounds using pure mathematics via the Web Audio API
  const startProceduralAudio = (type: 'rain' | 'breeze') => {
    stopProceduralAudio();

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // 1. Generate White Noise Buffer
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      // 2. Setup Noise Source Node
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      noiseSourceRef.current = whiteNoise;

      // 3. Setup Filter Node (BiquadFilter)
      const filter = ctx.createBiquadFilter();
      filterRef.current = filter;

      // 4. Setup Main Gain Node
      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.08, ctx.currentTime);
      gainRef.current = mainGain;

      if (type === 'rain') {
        // Muted library rain uses bandpass to eliminate harsh highs and deep rumbles
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);
        filter.Q.setValueAtTime(0.7, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(mainGain);
        mainGain.connect(ctx.destination);
      } else if (type === 'breeze') {
        // Coastal breeze uses lowpass filter modulated by an LFO to simulate gusts
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, ctx.currentTime);

        // LFO (Low Frequency Oscillator) to modulate breeze swell
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // very slow cycle (12 seconds)
        lfoRef.current = lfo;

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(150, ctx.currentTime); // frequency swing

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency); // hook LFO up to cut-off frequency
        
        whiteNoise.connect(filter);
        filter.connect(mainGain);
        mainGain.connect(ctx.destination);

        lfo.start();
      }

      whiteNoise.start();
    } catch (err) {
      console.error('Failed to initialize Web Audio Synthesizer:', err);
    }
  };

  const stopProceduralAudio = () => {
    try {
      if (noiseSourceRef.current) {
        noiseSourceRef.current.stop();
        noiseSourceRef.current.disconnect();
        noiseSourceRef.current = null;
      }
      if (lfoRef.current) {
        lfoRef.current.stop();
        lfoRef.current.disconnect();
        lfoRef.current = null;
      }
      if (filterRef.current) {
        filterRef.current.disconnect();
        filterRef.current = null;
      }
      if (gainRef.current) {
        gainRef.current.disconnect();
        gainRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch (e) {
      console.warn('Audio cleanup exception:', e);
    }
  };

  const toggleSoundscape = (soundscapeId: string) => {
    if (activeSoundscape === soundscapeId) {
      stopProceduralAudio();
      setActiveSoundscape(null);
    } else {
      setActiveSoundscape(soundscapeId);
      if (soundscapeId === 'sound-1') {
        startProceduralAudio('rain');
      } else if (soundscapeId === 'sound-3') {
        startProceduralAudio('breeze');
      } else {
        // Fallback or mute for other sound types
        stopProceduralAudio();
      }
    }
  };

  const handleAddWin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWin) return;
    const updated = [...smallWins, newWin];
    setSmallWins(updated);
    localStorage.setItem('wellbeing_small_wins', JSON.stringify(updated));
    setNewWin('');
  };

  const handleDeleteWin = (index: number) => {
    const updated = smallWins.filter((_, idx) => idx !== index);
    setSmallWins(updated);
    localStorage.setItem('wellbeing_small_wins', JSON.stringify(updated));
  };

  const getActiveGuideDetails = () => {
    if (activeGuide === 'impostor') return WELLBEING_RESOURCES.impostorSyndrome;
    if (activeGuide === 'supervisor') return WELLBEING_RESOURCES.supervisorMeetings;
    return WELLBEING_RESOURCES.rejectionRecovery;
  };

  const guide = getActiveGuideDetails();

  return (
    <div className="space-y-6" id="research-wellbeing-module">
      
      {/* Dynamic Accessible Notification Banner */}
      {notification && (
        <div className="bg-amber-900/10 dark:bg-amber-900/30 border border-amber-900/25 p-4 rounded-lg flex justify-between items-center animate-fadeIn" role="alert">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-800 dark:text-amber-400" />
            <p className="font-sans text-xs text-amber-900 dark:text-amber-200 font-medium">{notification}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="font-sans text-xs text-amber-900 dark:text-amber-300 hover:underline px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sub tabs navigation */}
      <div className="border-b border-stone-200 dark:border-stone-800 flex justify-between items-center pb-2">
        <div className="flex gap-4" role="tablist" aria-label="Wellbeing sections">
          <button
            role="tab"
            aria-selected={activeWellbeingTab === 'pomodoro'}
            onClick={() => setActiveWellbeingTab('pomodoro')}
            className={`font-sans text-xs pb-2 border-b-2 font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              activeWellbeingTab === 'pomodoro' ? 'border-amber-900 text-amber-900 dark:text-amber-400' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            Calm Focus Deck
          </button>
          <button
            role="tab"
            aria-selected={activeWellbeingTab === 'wellbeing_guides'}
            onClick={() => setActiveWellbeingTab('wellbeing_guides')}
            className={`font-sans text-xs pb-2 border-b-2 font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              activeWellbeingTab === 'wellbeing_guides' ? 'border-amber-900 text-amber-900 dark:text-amber-400' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            Academic Support Library
          </button>
          <button
            role="tab"
            aria-selected={activeWellbeingTab === 'decompression'}
            onClick={() => setActiveWellbeingTab('decompression')}
            className={`font-sans text-xs pb-2 border-b-2 font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              activeWellbeingTab === 'decompression' ? 'border-amber-900 text-amber-900 dark:text-amber-400' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            Reflective Small Wins Journal
          </button>
        </div>
      </div>

      {/* POMODORO & PROCEDURAL AUDIO DECK */}
      {activeWellbeingTab === 'pomodoro' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Pomodoro Timer Block */}
          <div className="bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 p-8 rounded-lg flex flex-col items-center justify-center space-y-6">
            <div className="text-center">
              <span className="font-sans text-[10px] uppercase font-mono tracking-wider text-amber-800 dark:text-amber-500">
                {isBreak ? 'Gentle Break Interval' : 'Deep Work Focus Hour'}
              </span>
              <h2 className="font-mono text-5xl font-light text-stone-900 dark:text-stone-100 tracking-tight mt-2">
                {formatTime(timeLeft)}
              </h2>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                aria-label={timerRunning ? "Pause work session timer" : "Start work session timer"}
                className="w-12 h-12 rounded-full bg-amber-950 text-white flex items-center justify-center hover:bg-amber-900 transition-colors shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              >
                {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 pl-0.5" />}
              </button>
              <button
                onClick={handlePomodoroReset}
                aria-label="Reset timer"
                className="w-12 h-12 rounded-full border border-amber-900/10 bg-white dark:bg-stone-950 text-amber-900 flex items-center justify-center hover:bg-amber-50/30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              >
                <RotateCcw className="w-5 h-5 text-amber-800" />
              </button>
            </div>

            <p className="font-sans text-[11px] text-stone-500 italic max-w-xs text-center leading-normal">
              "No streaks. No bells. Work gently until the timer resolves. If you feel tired, rest."
            </p>
          </div>

          {/* Procedural Audio Soundscapes mixer */}
          <div className="bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 p-6 rounded-lg flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-amber-800" /> Procedural Audio Soundscapes
              </h3>
              <p className="font-sans text-xs text-stone-500 leading-normal">
                Procedurally synthesized rain and forest breeze generated directly in your browser. Restores spatial calmness inside quiet reading rooms.
              </p>

              <div className="space-y-2">
                {SOUNDSCAPES.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => toggleSoundscape(sound.id)}
                    aria-label={`Toggle soundscape ${sound.name}`}
                    className={`w-full text-left p-3 rounded-lg border font-sans text-xs flex justify-between items-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950 ${
                      activeSoundscape === sound.id
                        ? 'bg-amber-900/15 border-amber-900/35 text-amber-950 font-semibold'
                        : 'bg-white dark:bg-stone-950 border-stone-150 text-stone-700 hover:border-stone-250'
                    }`}
                  >
                    <span>{sound.name}</span>
                    <span className="font-mono text-[9px] uppercase bg-stone-50 px-2 py-0.5 rounded text-stone-400">
                      {activeSoundscape === sound.id ? 'synthesizing' : sound.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {activeSoundscape && (
              <div className="pt-4 border-t border-amber-900/10 mt-4 text-[10px] font-sans text-stone-400 flex items-center gap-1 text-center justify-center">
                <VolumeX className="w-3.5 h-3.5" /> Toggle selected soundscape to completely terminate procedural context.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ACADEMIC SUPPORT LIBRARY */}
      {activeWellbeingTab === 'wellbeing_guides' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Guides navigation list */}
          <div className="lg:col-span-1 bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 p-4 rounded-lg h-fit space-y-2">
            <h4 className="font-sans font-medium text-xs text-amber-800 uppercase tracking-wider mb-2">Support Topics</h4>
            
            <button
              onClick={() => setActiveGuide('impostor')}
              className={`w-full text-left p-3 rounded font-sans text-xs flex items-center gap-2 ${
                activeGuide === 'impostor' ? 'bg-white dark:bg-stone-950 border border-amber-900/10 text-stone-950 font-medium' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Heart className="w-4 h-4 text-rose-500 shrink-0" /> Impostor Phenomenon
            </button>

            <button
              onClick={() => setActiveGuide('supervisor')}
              className={`w-full text-left p-3 rounded font-sans text-xs flex items-center gap-2 ${
                activeGuide === 'supervisor' ? 'bg-white dark:bg-stone-950 border border-amber-900/10 text-stone-950 font-medium' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-500 shrink-0" /> Supervisor Meeting Strategy
            </button>

            <button
              onClick={() => setActiveGuide('rejection')}
              className={`w-full text-left p-3 rounded font-sans text-xs flex items-center gap-2 ${
                activeGuide === 'rejection' ? 'bg-white dark:bg-stone-950 border border-amber-900/10 text-stone-950 font-medium' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" /> Rejection and Reviewers
            </button>
          </div>

          {/* Guide detail rendering */}
          <div className="lg:col-span-2 bg-white dark:bg-stone-950 border border-stone-200 rounded-lg p-6 space-y-6">
            <div>
              <span className="font-sans text-[10px] uppercase font-mono tracking-wider text-amber-800">Support Material</span>
              <h2 className="font-sans font-bold text-stone-950 text-base leading-snug mt-1">
                {guide.title}
              </h2>
              <p className="font-sans text-xs text-stone-400 mt-0.5">{guide.subtitle}</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-stone-100">
              {guide.sections.map((sec, idx) => (
                <div key={idx} className="space-y-1 font-sans text-xs leading-relaxed">
                  <h4 className="font-semibold text-stone-900">{sec.heading}</h4>
                  <p className="text-stone-600 dark:text-stone-400">{sec.content}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-amber-50/15 border border-amber-900/10 rounded-lg space-y-2">
              <h4 className="font-sans font-semibold text-xs text-amber-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Reassuring Reflection Prompt
              </h4>
              <p className="font-sans text-xs italic text-stone-600 leading-normal">
                "{guide.reflectionPrompt}"
              </p>
            </div>
          </div>

        </div>
      )}

      {/* REFLECTIVE SMALL WINS JOURNAL */}
      {activeWellbeingTab === 'decompression' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 space-y-5">
          <div>
            <h3 className="font-sans font-semibold text-stone-950 dark:text-stone-100 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-800 dark:text-amber-400" /> Reflective Journal of Small Wins
            </h3>
            <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-1">
              Graduate research has very few instant feedback loops. Keep track of incremental wins (e.g., writing 50 words, resolving a reference, reading an abstract) to reinforce your scholarly momentum.
            </p>
          </div>

          <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
            {smallWins.map((win, idx) => (
              <div key={idx} className="p-3 bg-emerald-50/10 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/40 rounded flex justify-between items-center text-xs font-sans">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                  <span className="text-stone-800 dark:text-stone-200">{win}</span>
                </div>
                <button
                  onClick={() => handleDeleteWin(idx)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-mono text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            ))}

            {smallWins.length === 0 && (
              <p className="font-sans text-xs text-stone-400 italic text-center py-6">Record your first micro-accomplishment to anchor momentum today.</p>
            )}
          </div>

          <form onSubmit={handleAddWin} className="flex gap-2 border-t border-stone-100 dark:border-stone-800 pt-4">
            <label htmlFor="small-win-input" className="sr-only">Record a small win or accomplishment</label>
            <input
              id="small-win-input"
              type="text"
              placeholder="Record an academic or focus accomplishment today..."
              value={newWin}
              onChange={(e) => setNewWin(e.target.value)}
              className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
              required
            />
            <button
              type="submit"
              className="font-sans text-xs bg-amber-950 text-white px-4 py-2 rounded shrink-0 hover:bg-amber-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950 cursor-pointer"
            >
              Log Win
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
