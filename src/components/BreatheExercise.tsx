/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type BreathPatternId = 'box' | 'calm' | 'gentle';

interface BreathPattern {
  id: BreathPatternId;
  name: string;
  description: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
}

const BREATH_PATTERNS: BreathPattern[] = [
  {
    id: 'box',
    name: 'Box breathing (4-4-4-4)',
    description: 'Equal intervals for steady focus and grounding.',
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
  },
  {
    id: 'calm',
    name: 'Calm presence (4-7-8)',
    description: 'Extended exhale to soothe the nervous system.',
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
  },
  {
    id: 'gentle',
    name: 'Gentle pacing (4-6)',
    description: 'Simple rhythmic flow without breath holds.',
    inhale: 4,
    holdIn: 0,
    exhale: 6,
    holdOut: 0,
  },
];

export default function BreatheExercise() {
  const [selectedPatternId, setSelectedPatternId] = useState<BreathPatternId>('box');
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'holdIn' | 'exhale' | 'holdOut'>('inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Audio ambient synthesizer
  const [audioActive, setAudioActive] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const activePattern = BREATH_PATTERNS.find((p) => p.id === selectedPatternId) || BREATH_PATTERNS[0];

  // Reset timer on pattern change
  useEffect(() => {
    setIsActive(false);
    setPhase('inhale');
    setPhaseSecondsLeft(activePattern.inhale);
    setCompletedCycles(0);
  }, [selectedPatternId]);

  // Breathing loop timer
  useEffect(() => {
    let timer: any = null;
    if (isActive) {
      timer = setInterval(() => {
        setPhaseSecondsLeft((prev) => {
          if (prev > 1) {
            return prev - 1;
          }

          // Advance phase
          if (phase === 'inhale') {
            if (activePattern.holdIn > 0) {
              setPhase('holdIn');
              return activePattern.holdIn;
            } else {
              setPhase('exhale');
              return activePattern.exhale;
            }
          } else if (phase === 'holdIn') {
            setPhase('exhale');
            return activePattern.exhale;
          } else if (phase === 'exhale') {
            if (activePattern.holdOut > 0) {
              setPhase('holdOut');
              return activePattern.holdOut;
            } else {
              setCompletedCycles((c) => c + 1);
              setPhase('inhale');
              return activePattern.inhale;
            }
          } else {
            setCompletedCycles((c) => c + 1);
            setPhase('inhale');
            return activePattern.inhale;
          }
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, phase, activePattern]);

  // Audio synthesizer cleanup
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const toggleAudio = () => {
    if (audioActive) {
      stopAudio();
      setAudioActive(false);
    } else {
      startAudio();
      setAudioActive(true);
    }
  };

  const startAudio = () => {
    try {
      stopAudio();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noiseSourceRef.current = noise;
      gainNodeRef.current = gain;
    } catch (e) {
      console.warn('Audio synthesis unavailable', e);
    }
  };

  const stopAudio = () => {
    try {
      if (noiseSourceRef.current) {
        noiseSourceRef.current.stop();
        noiseSourceRef.current.disconnect();
        noiseSourceRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('inhale');
    setPhaseSecondsLeft(activePattern.inhale);
    setCompletedCycles(0);
  };

  const getPhasePrompt = () => {
    switch (phase) {
      case 'inhale':
        return 'Inhale slowly and fill your lungs with space';
      case 'holdIn':
        return 'Rest quietly in the stillness';
      case 'exhale':
        return 'Exhale softly and release all tension';
      case 'holdOut':
        return 'Pause gently before your next breath';
    }
  };

  const getPhaseScale = () => {
    if (!isActive) return 1;
    switch (phase) {
      case 'inhale':
        return 1.35;
      case 'holdIn':
        return 1.35;
      case 'exhale':
        return 0.85;
      case 'holdOut':
        return 0.85;
    }
  };

  return (
    <div className="space-y-6 text-left py-2" id="breathe-exercise-module">
      {/* Overview & Intro */}
      <div className="space-y-1.5">
        <h3 className="font-sans font-semibold text-base sm:text-lg text-stone-900 dark:text-stone-100">
          Breathe for calm and presence exercises
        </h3>
        <p className="font-sans text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
          An experiential practice area designed for immediate grounding. Use these rhythmic breathing exercises whenever you feel cognitive saturation, writing fatigue, or restless tension.
        </p>
      </div>

      {/* Pattern Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {BREATH_PATTERNS.map((pattern) => {
          const isSelected = pattern.id === selectedPatternId;
          return (
            <button
              key={pattern.id}
              type="button"
              onClick={() => setSelectedPatternId(pattern.id)}
              className={`p-3.5 rounded-md border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75] ${
                isSelected
                  ? 'bg-[#1d9e75]/10 border-[#1d9e75] dark:bg-[#28c093]/15 dark:border-[#28c093] text-stone-900 dark:text-stone-100'
                  : 'bg-stone-50 dark:bg-stone-900/40 border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <div className="font-sans font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                {pattern.name}
              </div>
              <div className="font-sans text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-snug">
                {pattern.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Breathing Arena */}
      <div className="p-6 sm:p-8 bg-stone-50 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 rounded-lg flex flex-col items-start justify-start space-y-8 text-left relative overflow-hidden pl-0 sm:pl-0">
        {/* Animated Expanding / Contracting Circle */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center my-4">
          <motion.div
            className="absolute inset-0 rounded-full bg-[#1d9e75]/15 dark:bg-[#28c093]/20 border-2 border-[#1d9e75]/40 dark:border-[#28c093]/50"
            animate={{
              scale: getPhaseScale(),
            }}
            transition={{
              duration: isActive ? phaseSecondsLeft : 0.8,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-[#1d9e75]/25 dark:bg-[#28c093]/30 border border-[#1d9e75]/60 dark:border-[#28c093]/70"
            animate={{
              scale: getPhaseScale(),
            }}
            transition={{
              duration: isActive ? phaseSecondsLeft : 0.8,
              ease: 'easeInOut',
            }}
          />

          {/* Central Counter & Phase Label */}
          <div className="relative z-10 space-y-1 text-center">
            <span className="text-3xl sm:text-4xl font-mono font-light text-stone-900 dark:text-stone-100 block">
              {isActive ? phaseSecondsLeft : activePattern.inhale}
            </span>
            <span className="text-xs font-mono font-semibold tracking-wider text-[#1d9e75] dark:text-[#28c093] block">
              {isActive ? (phase === 'holdIn' || phase === 'holdOut' ? 'Hold' : phase) : 'Ready'}
            </span>
          </div>
        </div>

        {/* Phase Prompt / Guidance */}
        <p className="font-sans text-xs sm:text-sm text-stone-700 dark:text-stone-300 italic max-w-md h-6 text-left">
          {isActive ? getPhasePrompt() : 'Click start breathing exercise to begin your practice'}
        </p>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-start gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className="px-5 py-2.5 rounded-md bg-[#1d9e75] hover:bg-[#168260] dark:bg-[#28c093] dark:hover:bg-[#1e9a75] text-white dark:text-stone-950 font-sans text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75]"
          >
            {isActive ? (
              <span>Pause exercise</span>
            ) : (
              <span>Start breathing exercise</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-sans text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75]"
          >
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={toggleAudio}
            className={`px-3.5 py-2.5 rounded-md border text-xs font-sans font-semibold flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75] ${
              audioActive
                ? 'bg-[#1d9e75]/10 border-[#1d9e75] text-[#1d9e75] dark:text-[#28c093]'
                : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
            title="Toggle background ambient tone"
          >
            <span>{audioActive ? 'Ambient tone on' : 'Ambient tone'}</span>
          </button>
        </div>

        {/* Cycles Counter */}
        {completedCycles > 0 && (
          <div className="pt-2 text-[11px] font-mono text-stone-400 dark:text-stone-500">
            Completed cycles: {completedCycles}
          </div>
        )}
      </div>
    </div>
  );
}
