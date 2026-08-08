/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SOUNDSCAPES } from '../data';
import ResearchWellbeingInsights from './ResearchWellbeingInsights';
import BreatheExercise from './BreatheExercise';
import ReflectiveWins from './ReflectiveWins';

interface SelfCareTopic {
  id: string;
  title: string;
  emoji: string;
  description: string;
  quote: string;
  tips: string[];
  reflectionPrompt: string;
}

export interface FocusTimerSharedProps {
  preferredFocusMinutes: number;
  preferredBreakMinutes: number;
  timeLeft: number;
  timerRunning: boolean;
  isBreak: boolean;
  completedSessions: number;
  changeFocusDuration: (mins: number) => void;
  changeBreakDuration: (mins: number) => void;
  toggleTimerRunning: () => void;
  resetTimer: () => void;
}

export default function ResearchWellbeing({
  mode,
  onExitFocus,
  timerProps,
}: {
  mode?: 'focus' | 'wellbeing';
  onExitFocus?: () => void;
  timerProps?: FocusTimerSharedProps;
} = {}) {
  // Wellbeing Library child destinations: 'home' | 'insights' | 'guides' | 'breathe' | 'wins'
  const [activeChildDestination, setActiveChildDestination] = useState<'home' | 'insights' | 'guides' | 'breathe' | 'wins'>(
    'home'
  );

  // Progressive disclosure states for self-care topics
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({
    self_care_principles: true,
    overwhelm: false,
    imposter_feelings: false,
    writing_avoidance: false,
    confidence: false,
  });

  const toggleTopic = (id: string) => {
    setOpenTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const setAllTopicsOpen = (open: boolean) => {
    setOpenTopics({
      self_care_principles: open,
      overwhelm: open,
      imposter_feelings: open,
      writing_avoidance: open,
      confidence: open,
    });
  };

  // User customizable focus & break duration (in minutes) - Local fallbacks
  const [localPreferredFocusMinutes, setLocalPreferredFocusMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('scholar_preferred_focus_minutes');
    return saved ? Math.max(1, parseInt(saved, 10)) : 25;
  });

  const [localPreferredBreakMinutes, setLocalPreferredBreakMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('scholar_preferred_break_minutes');
    return saved ? Math.max(1, parseInt(saved, 10)) : 5;
  });

  const [customFocusInput, setCustomFocusInput] = useState<string>('');
  const [customBreakInput, setCustomBreakInput] = useState<string>('');

  // Focus timer states & contextual encouragement - Local fallbacks
  const [localTimeLeft, setLocalTimeLeft] = useState(() => localPreferredFocusMinutes * 60);
  const [localTimerRunning, setLocalTimerRunning] = useState(false);
  const [localIsBreak, setLocalIsBreak] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Change focus duration - Local fallback
  const localChangeFocusDuration = (mins: number) => {
    const validMins = Math.max(1, Math.min(180, mins));
    setLocalPreferredFocusMinutes(validMins);
    localStorage.setItem('scholar_preferred_focus_minutes', validMins.toString());
    if (!localTimerRunning && !localIsBreak) {
      setLocalTimeLeft(validMins * 60);
    }
  };

  // Change break duration - Local fallback
  const localChangeBreakDuration = (mins: number) => {
    const validMins = Math.max(1, Math.min(60, mins));
    setLocalPreferredBreakMinutes(validMins);
    localStorage.setItem('scholar_preferred_break_minutes', validMins.toString());
    if (!localTimerRunning && localIsBreak) {
      setLocalTimeLeft(validMins * 60);
    }
  };

  // Focus session counter for contextual encouragement - Local fallback
  const [localCompletedSessions, setLocalCompletedSessions] = useState<number>(() => {
    const cached = localStorage.getItem('scholar_focus_completed_sessions');
    return cached ? parseInt(cached, 10) : 0;
  });

  const localPomodoroReset = () => {
    setLocalTimerRunning(false);
    setLocalIsBreak(false);
    setLocalTimeLeft(localPreferredFocusMinutes * 60);
  };

  const [showGentleEncouragement, setShowGentleEncouragement] = useState<boolean>(false);

  // Procedural Web Audio states
  const [activeSoundscape, setActiveSoundscape] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const selfCareTopics: SelfCareTopic[] = [
    {
      id: 'self_care_principles',
      title: 'Research self-care',
      emoji: '🕯️',
      description: 'Foundational principles of sustaining yourself in creative and research spaces.',
      quote: 'Scholarship is a journey of endurance, not a temporary sprint. If you burn out, your ideas cannot reach the world.',
      tips: [
        'Establish clear offline blocks. Close your computer fully at a set hour.',
        'Protect your sleep and meal cycles. Intellectual work uses high amounts of energy.',
        'Build friendships or community networks outside of your research topic to maintain perspective.',
        'Do not work in your sleeping area if possible, to separate resting space from cognitive arenas.',
        'Accept that some days will have zero output, and that is a healthy part of the writing rhythm.'
      ],
      reflectionPrompt: 'What is one boundary you can set today to protect your evening rest?'
    },
    {
      id: 'overwhelm',
      title: 'Overwhelm & density',
      emoji: '🌊',
      description: 'Navigating information overload and excessive lists of tasks.',
      quote: 'Overwhelm happens when cognitive demands exceed current working memory limits. It is a design constraint, not a personal flaw.',
      tips: [
        'Close all browser tabs except the single paper you are reading.',
        'Convert complex folders into simple, isolated list structures.',
        'Choose just ONE achievable action step—like reading half an abstract—and ignore everything else.',
        'Take a 10-minute walk without your phone to allow spatial visual decompression.',
        'Remember you do not need to read every paper in your field. Settle for sufficient understanding.'
      ],
      reflectionPrompt: 'If you could only do one five-minute task today to release pressure, what would it be?'
    },
    {
      id: 'imposter_feelings',
      title: 'Imposter feelings',
      emoji: '💭',
      description: 'Coping with self-doubt and the constant fear of being exposed.',
      quote: 'The imposter phenomenon is the psychological tax of working among dedicated minds. It is a base-rate error, not an accurate evaluation.',
      tips: [
        'Acknowledge that feelings of fraudulence are exceptionally common among senior scholars.',
        'Stop comparing your internal draft process with other people\'s polished, published outputs.',
        'Keep an offline folder of kind emails, supervisor compliments, or successful micro-wins.',
        'Accept that your research does not have to be revolutionary to be valuable and useful.',
        'Your supervisors or peers are human beings, not absolute arbiters of your intelligence.'
      ],
      reflectionPrompt: 'What is one piece of concrete evidence from your past work that supports your capability?'
    },
    {
      id: 'writing_avoidance',
      title: 'Writing avoidance',
      emoji: '🫣',
      description: 'Understanding why you are dodging the draft page and how to break the cycle.',
      quote: 'Avoidance is almost always the nervous system protecting you from the vulnerability of failing your own standards.',
      tips: [
        'Write in bullet points. Forbid yourself from writing full sentences for the first 10 minutes.',
        'Set a timer for 10 minutes and agree to write absolute nonsense or messy notes.',
        'Use the Writing Companion without looking at citation styles. Focus strictly on rough ideas.',
        'Remember that a terrible first draft is the essential raw material for a beautiful final edit.',
        'Speak your thoughts aloud into a recorder first, then transcribe the messy ideas.'
      ],
      reflectionPrompt: 'How messy can you make your first draft today while still allowing yourself to polish it later?'
    },
    {
      id: 'confidence',
      title: 'Sustaining confidence',
      emoji: '🌱',
      description: 'Nurturing confidence during prolonged periods without feedback loops.',
      quote: 'Research contains massive feedback delays. You must learn to validate your own momentum internally.',
      tips: [
        'Anchor your progress on task completions (wins), not on immediate results or supervisor praise.',
        'Remember that an rejected draft or a negative review is a commentary on the text, not on your character.',
        'Look back at what you knew six months ago. Recognize the massive cognitive distance you have traveled.',
        'Break your projects down into small, digestible chunks so you can check things off regularly.',
        'Teach a friend or family member a simple concept from your field. Hear how much you actually know.'
      ],
      reflectionPrompt: 'What is one concept in your field you understand deeply now that felt completely foreign a year ago?'
    }
  ];

  // Effective timer state derived from shared timerProps or local state
  const preferredFocusMinutes = timerProps ? timerProps.preferredFocusMinutes : localPreferredFocusMinutes;
  const preferredBreakMinutes = timerProps ? timerProps.preferredBreakMinutes : localPreferredBreakMinutes;
  const timeLeft = timerProps ? timerProps.timeLeft : localTimeLeft;
  const timerRunning = timerProps ? timerProps.timerRunning : localTimerRunning;
  const isBreak = timerProps ? timerProps.isBreak : localIsBreak;
  const completedSessions = timerProps ? timerProps.completedSessions : localCompletedSessions;

  const changeFocusDuration = timerProps ? timerProps.changeFocusDuration : localChangeFocusDuration;
  const changeBreakDuration = timerProps ? timerProps.changeBreakDuration : localChangeBreakDuration;
  const toggleTimerRunning = timerProps ? timerProps.toggleTimerRunning : () => setLocalTimerRunning(!localTimerRunning);
  const handlePomodoroReset = timerProps ? timerProps.resetTimer : localPomodoroReset;

  // Local Pomodoro timer effect (only if no timerProps supplied)
  useEffect(() => {
    if (timerProps) return; // Managed centrally by App
    let interval: any = null;
    if (localTimerRunning && localTimeLeft > 0) {
      interval = setInterval(() => {
        setLocalTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (localTimeLeft === 0) {
      setLocalTimerRunning(false);
      if (!localIsBreak) {
        const nextSessions = localCompletedSessions + 1;
        setLocalCompletedSessions(nextSessions);
        localStorage.setItem('scholar_focus_completed_sessions', nextSessions.toString());

        if (nextSessions % 2 === 0) {
          setShowGentleEncouragement(true);
        } else {
          setNotification('Focus session resolved. Please take an offline screen-free break.');
        }

        setLocalIsBreak(true);
        setLocalTimeLeft(localPreferredBreakMinutes * 60);
      } else {
        setNotification('Break interval completed. Ready to anchor focus?');
        setLocalIsBreak(false);
        setLocalTimeLeft(localPreferredFocusMinutes * 60);
      }
    }
    return () => clearInterval(interval);
  }, [timerProps, localTimerRunning, localTimeLeft, localIsBreak, localCompletedSessions, localPreferredFocusMinutes, localPreferredBreakMinutes]);

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

  // Procedural audio synthesizer
  const startProceduralAudio = (type: 'rain' | 'breeze') => {
    stopProceduralAudio();

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      noiseSourceRef.current = whiteNoise;

      const filter = ctx.createBiquadFilter();
      filterRef.current = filter;

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.08, ctx.currentTime);
      gainRef.current = mainGain;

      if (type === 'rain') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);
        filter.Q.setValueAtTime(0.7, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(mainGain);
        mainGain.connect(ctx.destination);
      } else if (type === 'breeze') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
        lfoRef.current = lfo;

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(150, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        whiteNoise.connect(filter);
        filter.connect(mainGain);
        mainGain.connect(ctx.destination);

        lfo.start();
      }

      whiteNoise.start();
    } catch (err) {
      console.error('Procedural Web Audio init failed:', err);
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
        stopProceduralAudio();
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans px-2 sm:px-4" id="research-wellbeing-module">
      
      {/* Header */}
      {activeChildDestination !== 'insights' && (
        <div className="pb-4" id="wellbeing-header-container">
          <div className="space-y-1.5 text-left" id="wellbeing-header-text">
            {mode === 'focus' && (
              <div className="pb-1">
                <button
                  type="button"
                  onClick={onExitFocus}
                  className="font-sans text-xs px-3 py-1.5 rounded-md border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 transition-colors flex items-center gap-2 cursor-pointer font-semibold inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75]"
                  id="wellbeing-exit-focus-mode-btn"
                  title="Exit focus space"
                >
                  <span>Exit focus</span>
                </button>
              </div>
            )}
            <h1 className="font-sans font-medium tracking-tight text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 flex items-center gap-3" id="wellbeing-page-title">
              {mode === 'focus'
                ? 'Calm focus space'
                : activeChildDestination === 'breathe'
                ? 'Pause, Breathe and Be present'
                : 'Wellbeing centre'}
            </h1>
            <p className="font-sans text-stone-500 dark:text-stone-400 text-xs sm:text-sm leading-relaxed" id="wellbeing-page-subtitle">
              {mode === 'focus'
                ? 'Work gently without alerts, badges, or noise. Pair your writing blocks with procedurally generated audio soundscapes.'
                : activeChildDestination === 'breathe'
                ? 'Experiential breathing exercises, rhythmic pacing, and grounding focus practices to anchor presence during research.'
                : 'Sustaining your mental and emotional wellness is an active requirement of thoughtful creation and rigorous inquiry. This is not meditation; it is research and creative self-preservation.'}
            </p>
            {mode !== 'focus' && activeChildDestination !== 'breathe' && (
              <div className="flex items-center gap-1.5 pt-1.5 text-xs font-sans text-stone-400 dark:text-stone-500" id="wellbeing-reading-indicator">
                <span>Self-care, focus tools & reflective support</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contextual Banner */}
      {notification && (
        <div className="bg-[#1d9e75]/10 dark:bg-[#1d9e75]/25 border border-[#1d9e75]/30 p-4 rounded-md flex justify-between items-center animate-fadeIn text-left" role="alert">
          <p className="font-sans text-xs text-[#1d9e75] dark:text-[#28c093] font-medium">{notification}</p>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs text-[#1d9e75] dark:text-[#28c093] hover:underline px-2 py-1 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Contextual Gentle Encouragement Callout (After ~2 focus sessions) */}
      <AnimatePresence>
        {showGentleEncouragement && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-5 bg-stone-50 dark:bg-stone-900/60 border border-[#1d9e75]/40 rounded-lg space-y-3 text-left animate-fadeIn"
            role="dialog"
            aria-label="Gentle encouragement"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1d9e75] dark:text-[#28c093]">
              <span>Gentle encouragement</span>
            </div>
            <p className="font-sans text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
              You have completed two focus sessions. Sustained attention is a valuable practice, and taking a deliberate rest is essential for research recovery. Consider stepping away or taking a gentle breathing pause. Progress does not require perfection.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowGentleEncouragement(false);
                  setActiveChildDestination('breathe');
                }}
                className="px-3.5 py-1.5 rounded-md bg-[#1d9e75] hover:bg-[#168260] dark:bg-[#28c093] dark:hover:bg-[#1e9a75] text-white dark:text-stone-950 text-xs font-sans font-semibold transition-colors cursor-pointer"
              >
                Pause, breathe and be present
              </button>
              <button
                type="button"
                onClick={() => setShowGentleEncouragement(false)}
                className="px-3 py-1.5 rounded-md border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-sans font-medium transition-colors cursor-pointer"
              >
                Continue gently
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WELLBEING CENTRE -> 3 CARDS IN ROWS OF 2 SEPARATED BY BURGUNDY VERTICAL DIVIDER */}
      {mode !== 'focus' && (
        <div className="space-y-6">
          {/* HOME VIEW: ONLY 3 CARDS IN ROWS OF 2 SEPARATED BY BURGUNDY VERTICAL DIVIDERS */}
          {activeChildDestination === 'home' && (
            <div className="space-y-8 max-w-5xl mx-auto py-6 animate-fadeIn" id="wellbeing-home-cards">
              {/* Row 1: Card 1 (Pause, Breathe & Be Present) & Card 2 (Sustaining Yourself Guides) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative items-stretch">
                {/* Vertical Burgundy Divider between Col 1 and Col 2 */}
                <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-[52px] bottom-[48px] w-[2px] bg-[#912A4A] pointer-events-none" />

                {/* Card 1: Pause, Breathe & Be Present */}
                <button
                  type="button"
                  onClick={() => setActiveChildDestination('breathe')}
                  className="group flex flex-col justify-between text-left pl-0 pr-4 md:pl-0 md:pr-6 py-4 md:py-6 rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#912A4A]/50 bg-transparent border-0 hover:bg-stone-500/5 min-h-[200px]"
                  id="wellbeing-card-breathe"
                >
                  <div className="space-y-3">
                    <h2 className="text-lg sm:text-xl font-medium tracking-tight text-stone-900 dark:text-stone-100 group-hover:underline flex items-center gap-2">
                      Pause, Breathe & Be Present
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                      Experiential breathing exercises, rhythmic pacing, and grounding focus practices to anchor presence during research.
                    </p>
                  </div>
                  <div className="flex items-center justify-end pt-8 mt-auto w-full gap-2">
                    <span className="text-xs font-semibold text-[#912A4A] opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      Find out more →
                    </span>
                  </div>
                </button>

                {/* Card 2: Sustaining Yourself Guides */}
                <button
                  type="button"
                  onClick={() => setActiveChildDestination('guides')}
                  className="group flex flex-col justify-between text-left pl-4 pr-0 md:pl-6 md:pr-0 py-4 md:py-6 rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#912A4A]/50 bg-transparent border-0 hover:bg-stone-500/5 min-h-[200px]"
                  id="wellbeing-card-guides"
                >
                  <div className="space-y-3">
                    <h2 className="text-lg sm:text-xl font-medium tracking-tight text-stone-900 dark:text-stone-100 group-hover:underline flex items-center gap-2">
                      Sustaining Yourself Guides
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                      Practical guidance for sustaining cognitive energy, managing project density, and navigating creative or research overwhelm.
                    </p>
                  </div>
                  <div className="flex items-center justify-end pt-8 mt-auto w-full gap-2">
                    <span className="text-xs font-semibold text-[#912A4A] opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      Find out more →
                    </span>
                  </div>
                </button>
              </div>

              {/* Row 2: Card 3 (Wellbeing Research Insights) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative items-stretch">
                {/* Vertical Burgundy Divider between Col 1 and Col 2 */}
                <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-[52px] bottom-[48px] w-[2px] bg-[#912A4A] pointer-events-none" />

                {/* Card 3: Wellbeing Research Insights */}
                <button
                  type="button"
                  onClick={() => setActiveChildDestination('insights')}
                  className="group flex flex-col justify-between text-left pl-0 pr-4 md:pl-0 md:pr-6 py-4 md:py-6 rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#912A4A]/50 bg-transparent border-0 hover:bg-stone-500/5 min-h-[200px]"
                  id="wellbeing-card-insights"
                >
                  <div className="space-y-3">
                    <h2 className="text-lg sm:text-xl font-medium tracking-tight text-stone-900 dark:text-stone-100 group-hover:underline flex items-center gap-2">
                      Wellbeing Research Insights
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                      Evidence-based literature syntheses and research on wellbeing, cognitive fatigue, and endurance.
                    </p>
                  </div>
                  <div className="flex items-center justify-end pt-8 mt-auto w-full gap-2">
                    <span className="text-xs font-semibold text-[#912A4A] opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      Find out more →
                    </span>
                  </div>
                </button>

                {/* Empty Col 2 for balance in row 2 grid */}
                <div className="hidden md:block" />
              </div>
            </div>
          )}

          {/* DETAIL VIEWS HEADER: Back button & Breadcrumb bar when inside a child view */}
          {activeChildDestination !== 'home' && (
            <div className="space-y-6">
              {activeChildDestination !== 'insights' && (
                <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
                  <button
                    type="button"
                    onClick={() => setActiveChildDestination('home')}
                    className="text-xs font-semibold text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                    id="wellbeing-back-to-home-btn"
                  >
                    <span>Back to Wellbeing centre</span>
                  </button>

                  {/* Sub-destination tabs for quick switching between child cards (hidden on breathe page as requested) */}
                  {activeChildDestination !== 'breathe' && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-400" role="tablist">
                      <button
                        role="tab"
                        aria-selected={activeChildDestination === 'breathe'}
                        onClick={() => setActiveChildDestination('breathe')}
                        className={`hover:text-[#912A4A] transition-colors cursor-pointer font-medium py-1 px-2.5 rounded-md border ${
                          activeChildDestination === 'breathe'
                            ? 'bg-white dark:bg-stone-800 text-[#912A4A] dark:text-rose-400 font-semibold border-[#912A4A]/40 shadow-xs'
                            : 'border-transparent'
                        }`}
                      >
                        Pause, Breathe & Be Present
                      </button>
                      <span>•</span>
                      <button
                        role="tab"
                        aria-selected={activeChildDestination === 'guides'}
                        onClick={() => setActiveChildDestination('guides')}
                        className={`hover:text-[#912A4A] transition-colors cursor-pointer font-medium py-1 px-2.5 rounded-md border ${
                          activeChildDestination === 'guides'
                            ? 'bg-white dark:bg-stone-800 text-[#912A4A] dark:text-rose-400 font-semibold border-[#912A4A]/40 shadow-xs'
                            : 'border-transparent'
                        }`}
                      >
                        Sustaining Yourself Guides
                      </button>
                      <span>•</span>
                      <button
                        role="tab"
                        aria-selected={activeChildDestination === 'insights'}
                        onClick={() => setActiveChildDestination('insights')}
                        className={`hover:text-[#912A4A] transition-colors cursor-pointer font-medium py-1 px-2.5 rounded-md border ${
                          activeChildDestination === 'insights'
                            ? 'bg-white dark:bg-stone-800 text-[#912A4A] dark:text-rose-400 font-semibold border-[#912A4A]/40 shadow-xs'
                            : 'border-transparent'
                        }`}
                      >
                        Wellbeing Research Insights
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* CHILD DESTINATION 1: PAUSE, BREATHE & BE PRESENT */}
              {activeChildDestination === 'breathe' && (
                <div className="animate-fadeIn">
                  <BreatheExercise />
                </div>
              )}

              {/* CHILD DESTINATION 2: SUSTAINING YOURSELF GUIDES */}
              {activeChildDestination === 'guides' && (
                <div className="space-y-4 text-left animate-fadeIn" id="wellbeing-selfcare-list">
                  <div className="flex items-center justify-between pb-2 text-xs text-stone-500">
                    <span className="font-sans text-xs text-stone-600 dark:text-stone-400">
                      Practical guidance for sustaining energy and momentum during research and creative practice.
                    </span>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <button
                        type="button"
                        onClick={() => setAllTopicsOpen(true)}
                        className="hover:text-[#1d9e75] dark:hover:text-[#28c093] transition-colors cursor-pointer underline underline-offset-2"
                        id="wellbeing-expand-all-btn"
                      >
                        Expand all
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setAllTopicsOpen(false)}
                        className="hover:text-[#1d9e75] dark:hover:text-[#28c093] transition-colors cursor-pointer underline underline-offset-2"
                        id="wellbeing-collapse-all-btn"
                      >
                        Collapse all
                      </button>
                    </div>
                  </div>

                  <div className="space-y-0">
                    {selfCareTopics.map((topic) => {
                      const isOpen = openTopics[topic.id];
                      return (
                        <React.Fragment key={topic.id}>
                          <div className="py-2 text-left" id={`wellbeing-item-${topic.id}`}>
                            <button
                              type="button"
                              onClick={() => toggleTopic(topic.id)}
                              aria-expanded={isOpen}
                              aria-controls={`wellbeing-content-${topic.id}`}
                              className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75] rounded-sm py-1 cursor-pointer group"
                              id={`wellbeing-btn-${topic.id}`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <h3 className="font-sans font-semibold text-base sm:text-lg tracking-tight text-stone-900 dark:text-stone-100 group-hover:text-[#1d9e75] dark:group-hover:text-[#28c093] transition-colors flex items-center gap-2">
                                  <span>{topic.emoji}</span> {topic.title}
                                </h3>
                                <span
                                  className="text-lg font-mono font-medium text-[#1d9e75] dark:text-[#28c093] shrink-0 leading-none select-none ml-2 pt-0.5"
                                  aria-hidden="true"
                                >
                                  {isOpen ? '−' : '+'}
                                </span>
                              </div>

                              <p className="mt-2 font-sans text-sm sm:text-base text-stone-700 dark:text-stone-300 font-normal leading-relaxed">
                                {topic.description}
                              </p>
                            </button>

                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div
                                  id={`wellbeing-content-${topic.id}`}
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{
                                    height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                                    opacity: { duration: 0.25, ease: 'easeInOut', delay: 0.05 }
                                  }}
                                  className="overflow-hidden space-y-4 pt-3 pb-2"
                                >
                                  <div className="p-4 bg-stone-50 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 rounded-md text-xs sm:text-sm italic text-stone-700 dark:text-stone-300 leading-relaxed">
                                    "{topic.quote}"
                                  </div>

                                  <div className="space-y-2 pt-1">
                                    <h4 className="text-xs font-semibold tracking-wider text-stone-900 dark:text-stone-100 font-sans">
                                      Gentle actionable steps:
                                    </h4>
                                    <ul className="space-y-2">
                                      {topic.tips.map((tip, idx) => (
                                        <li key={idx} className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 flex items-start gap-2.5 leading-relaxed">
                                          <span className="text-[#1d9e75] dark:text-[#28c093] font-bold select-none">•</span>
                                          <span>{tip}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="p-4 bg-[#1d9e75]/5 dark:bg-[#1d9e75]/15 border border-[#1d9e75]/20 dark:border-[#1d9e75]/30 rounded-md space-y-1">
                                    <h4 className="text-xs font-semibold text-[#1d9e75] dark:text-[#28c093] flex items-center gap-1.5 font-sans">
                                      Support reflection prompt:
                                    </h4>
                                    <p className="text-xs sm:text-sm italic text-stone-700 dark:text-stone-300 leading-relaxed">
                                      "{topic.reflectionPrompt}"
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CHILD DESTINATION 3: WELLBEING RESEARCH INSIGHTS */}
              {activeChildDestination === 'insights' && (
                <div className="animate-fadeIn">
                  <ResearchWellbeingInsights />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FOCUS SPACE VIEW (Mode = 'focus') */}
      {mode === 'focus' && (
        <div className="space-y-8 text-left py-2" id="wellbeing-focus-section">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pomodoro Timer */}
            <div className="bg-stone-50 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 p-6 rounded-md flex flex-col justify-between space-y-5">
              <div className="space-y-2">
                <span className="font-sans text-xs font-mono text-[#1d9e75] dark:text-[#28c093] font-semibold tracking-wider">
                  {isBreak ? `Gentle decompression interval (${preferredBreakMinutes}m)` : `Quiet study interval (${preferredFocusMinutes}m)`}
                </span>
                <h2 className="font-mono text-5xl font-light text-stone-900 dark:text-stone-100 tracking-tight">
                  {formatTime(timeLeft)}
                </h2>
              </div>

              {/* Focus Duration Selection */}
              <div className="space-y-2.5 pt-2 border-t border-stone-200/80 dark:border-stone-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">
                    Preferred focus duration:
                  </label>
                  <span className="text-[11px] font-mono text-stone-500">
                    {preferredFocusMinutes} min
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[15, 20, 25, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => changeFocusDuration(mins)}
                      className={`px-2.5 py-1 text-xs rounded border transition-all cursor-pointer font-medium ${
                        preferredFocusMinutes === mins
                          ? 'bg-[#1d9e75] text-white font-semibold border-[#1d9e75] shadow-xs'
                          : 'bg-white dark:bg-stone-950 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>

                {/* Custom focus input */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Custom:</span>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={customFocusInput}
                    onChange={(e) => setCustomFocusInput(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-20 px-2.5 py-1 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#1d9e75]"
                  />
                  <span className="text-[11px] text-stone-500">min</span>
                  <button
                    type="button"
                    onClick={() => {
                      const parsed = parseInt(customFocusInput, 10);
                      if (!isNaN(parsed) && parsed > 0 && parsed <= 180) {
                        changeFocusDuration(parsed);
                        setCustomFocusInput('');
                      }
                    }}
                    disabled={!customFocusInput.trim() || isNaN(parseInt(customFocusInput, 10)) || parseInt(customFocusInput, 10) <= 0}
                    className="px-2.5 py-1 text-xs rounded bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-700 disabled:opacity-40 cursor-pointer font-medium transition-colors"
                  >
                    Set
                  </button>
                </div>

                {/* Break Duration Preset Selector & Custom Break Input */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
                      Break length ({preferredBreakMinutes} min):
                    </span>
                    <div className="flex items-center gap-1">
                      {[3, 5, 10, 15, 20].map((bmins) => (
                        <button
                          key={bmins}
                          type="button"
                          onClick={() => changeBreakDuration(bmins)}
                          className={`px-2 py-0.5 text-[11px] rounded border transition-colors cursor-pointer ${
                            preferredBreakMinutes === bmins
                              ? 'bg-stone-700 dark:bg-stone-300 text-white dark:text-stone-900 font-semibold border-stone-700'
                              : 'bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800'
                          }`}
                        >
                          {bmins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom break input */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Custom break:</span>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={customBreakInput}
                      onChange={(e) => setCustomBreakInput(e.target.value)}
                      placeholder="e.g. 7"
                      className="w-20 px-2.5 py-1 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#1d9e75]"
                    />
                    <span className="text-[11px] text-stone-500">min</span>
                    <button
                      type="button"
                      onClick={() => {
                        const parsed = parseInt(customBreakInput, 10);
                        if (!isNaN(parsed) && parsed > 0 && parsed <= 60) {
                          changeBreakDuration(parsed);
                          setCustomBreakInput('');
                        }
                      }}
                      disabled={!customBreakInput.trim() || isNaN(parseInt(customBreakInput, 10)) || parseInt(customBreakInput, 10) <= 0}
                      className="px-2.5 py-1 text-xs rounded bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-700 disabled:opacity-40 cursor-pointer font-medium transition-colors"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={toggleTimerRunning}
                  className="px-5 py-2.5 rounded-md bg-[#1d9e75] hover:bg-[#168260] dark:bg-[#28c093] dark:hover:bg-[#1e9a75] text-white dark:text-stone-950 text-xs font-sans font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75]"
                >
                  {timerRunning ? 'Pause' : 'Start interval'}
                </button>
                <button
                  type="button"
                  onClick={handlePomodoroReset}
                  className="px-4 py-2.5 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-700 dark:text-stone-300 text-xs font-sans font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75]"
                >
                  Reset
                </button>
              </div>

              <p className="font-sans text-xs text-stone-500 dark:text-stone-400 italic leading-relaxed pt-1">
                "No streaks. No alerts. Work gently until the timer resolves. If you feel tired, close the app and rest."
              </p>
            </div>

            {/* Soundscapes */}
            <div className="bg-white dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 p-6 rounded-md flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <h3 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-sm">
                  Procedural soundscapes
                </h3>
                <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Procedurally synthesized rain and breeze textures generated inside your browser using mathematical audio buffers.
                </p>

                <div className="space-y-2 pt-2">
                  {SOUNDSCAPES.map((sound) => (
                    <button
                      key={sound.id}
                      type="button"
                      onClick={() => toggleSoundscape(sound.id)}
                      className={`w-full text-left p-3 rounded-md border font-sans text-xs flex justify-between items-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75] ${
                        activeSoundscape === sound.id
                          ? 'bg-[#1d9e75]/10 border-[#1d9e75]/30 text-[#1d9e75] dark:text-[#28c093] font-semibold'
                          : 'bg-stone-50/50 dark:bg-stone-900/30 border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <span>{sound.name}</span>
                      <span className="font-mono text-[10px] bg-stone-100 dark:bg-stone-900 px-2 py-0.5 rounded text-stone-500">
                        {activeSoundscape === sound.id ? 'synthesizing' : sound.type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {activeSoundscape && (
                <div className="pt-3 text-[11px] font-sans text-stone-400 text-center">
                  Click active soundscape to stop audio synthesizer.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
