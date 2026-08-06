/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SOUNDSCAPES } from '../data';
import { Clock, Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, BookOpen, AlertCircle, Heart, CheckCircle2, RefreshCw } from 'lucide-react';

interface SelfCareTopic {
  id: string;
  title: string;
  emoji: string;
  description: string;
  quote: string;
  tips: string[];
  reflectionPrompt: string;
}

export default function ResearchWellbeing({ mode }: { mode?: 'focus' | 'wellbeing' } = {}) {
  const [activeWellbeingTab, setActiveWellbeingTab] = useState<'focus' | 'self_care' | 'wins' | 'reflections'>(
    mode === 'wellbeing' ? 'self_care' : 'focus'
  );
  const [activeTopicId, setActiveTopicId] = useState<string>('overwhelm');

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

  // Small wins log - with a listener to sync with homepage
  const [smallWins, setSmallWins] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('wellbeing_small_wins') || '["Completed literature outline of section 1.2", "Corrected DOI and metadata of two foundational papers"]');
  });
  const [newWin, setNewWin] = useState('');

  // Daily random encouraging reminder generator
  const [encouragement, setEncouragement] = useState<string>('');

  const encouragements = [
    "You do not have to write a perfect paper today. You just have to write a terrible first draft.",
    "Rest is not an earned luxury. It is a biological necessity for intellectual synthesis.",
    "Every experienced researcher has felt completely lost at some point. You are in excellent company.",
    "The scope of your project is allowed to change. Narrowing your focus is a sign of high scholarly maturity.",
    "Your value as a human being is entirely independent of your research progress or publication metrics.",
    "A page of bullet points is fully drafted. Give yourself permission to make a mess.",
    "Celebrate the tiny victories. Finding a missing citation is real research progress."
  ];

  useEffect(() => {
    // Pick random encouragement
    const random = encouragements[Math.floor(Math.random() * encouragements.length)];
    setEncouragement(random);

    const handleSyncWins = () => {
      setSmallWins(JSON.parse(localStorage.getItem('wellbeing_small_wins') || '[]'));
    };

    window.addEventListener('small_wins_updated', handleSyncWins);
    return () => {
      window.removeEventListener('small_wins_updated', handleSyncWins);
    };
  }, []);

  const handleRefreshEncouragement = () => {
    const currentIdx = encouragements.indexOf(encouragement);
    let nextIdx = Math.floor(Math.random() * encouragements.length);
    while (nextIdx === currentIdx && encouragements.length > 1) {
      nextIdx = Math.floor(Math.random() * encouragements.length);
    }
    setEncouragement(encouragements[nextIdx]);
  };

  const selfCareTopics: SelfCareTopic[] = [
    {
      id: 'self_care_principles',
      title: 'Research Self-Care',
      emoji: '🕯️',
      description: 'Foundational principles of sustaining yourself in academic spaces.',
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
      title: 'Overwhelm & Density',
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
      title: 'Imposter Feelings',
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
      title: 'Writing Avoidance',
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
      title: 'Sustaining Confidence',
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
        setNotification("Focus session resolved. Please take an offline screen-free break.");
        setIsBreak(true);
        setTimeLeft(5 * 60); // 5 minute break
      } else {
        setNotification("Break interval completed. Ready to anchor focus?");
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

  const handleAddWin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWin) return;
    const updated = [newWin, ...smallWins];
    setSmallWins(updated);
    localStorage.setItem('wellbeing_small_wins', JSON.stringify(updated));
    setNewWin('');
    window.dispatchEvent(new Event('small_wins_updated'));
  };

  const handleDeleteWin = (index: number) => {
    const updated = smallWins.filter((_, idx) => idx !== index);
    setSmallWins(updated);
    localStorage.setItem('wellbeing_small_wins', JSON.stringify(updated));
    window.dispatchEvent(new Event('small_wins_updated'));
  };

  const activeTopic = selfCareTopics.find(t => t.id === activeTopicId) || selfCareTopics[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans" id="research-wellbeing-module">
      
      {/* Page Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-5 text-left">
        <h1 className="font-sans font-medium tracking-tight text-3xl text-stone-900 dark:text-stone-100">
          {mode === 'focus' ? 'Calm focus deck' : 'Research wellbeing center'}
        </h1>
        <p className="font-sans text-stone-500 text-sm mt-1.5 leading-relaxed">
          {mode === 'focus' 
            ? 'Work gently without alerts, badges, or noise. Pair your writing blocks with procedurally generated audio soundscapes.'
            : 'Sustaining your mental and emotional wellness is an active requirement of rigorous scholarship. This is not meditation; it is research self-preservation.'}
        </p>
      </div>

      {/* Accessible Dynamic Banner */}
      {notification && (
        <div className="bg-[#912A4A]/10 dark:bg-[#912A4A]/30 border border-[#912A4A]/20 p-4 rounded-lg flex justify-between items-center animate-fadeIn" role="alert">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#912A4A] dark:text-rose-400 shrink-0" />
            <p className="font-sans text-xs text-[#912A4A] dark:text-rose-200 font-medium">{notification}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs text-[#912A4A] dark:text-rose-300 hover:underline px-2 py-1 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Wellbeing Navigation */}
      {mode !== 'focus' && (
        <div className="border-b border-stone-200 dark:border-stone-800 flex justify-between items-center pb-2 text-left">
          <div className="flex gap-4" role="tablist" aria-label="Wellbeing sections">
            <button
              role="tab"
              aria-selected={activeWellbeingTab === 'self_care'}
              onClick={() => setActiveWellbeingTab('self_care')}
              className={`font-sans text-xs pb-2 border-b-2 font-medium cursor-pointer transition-all ${
                activeWellbeingTab === 'self_care' ? 'border-[#912A4A] dark:border-rose-400 text-[#912A4A] dark:text-rose-400 font-bold' : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              Sustaining yourself guides
            </button>
            <button
              role="tab"
              aria-selected={activeWellbeingTab === 'wins'}
              onClick={() => setActiveWellbeingTab('wins')}
              className={`font-sans text-xs pb-2 border-b-2 font-medium cursor-pointer transition-all ${
                activeWellbeingTab === 'wins' ? 'border-[#912A4A] dark:border-rose-400 text-[#912A4A] dark:text-rose-400 font-bold' : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              Reflective wins & progress
            </button>
            <button
              role="tab"
              aria-selected={activeWellbeingTab === 'reflections'}
              onClick={() => setActiveWellbeingTab('reflections')}
              className={`font-sans text-xs pb-2 border-b-2 font-medium cursor-pointer transition-all ${
                activeWellbeingTab === 'reflections' ? 'border-[#912A4A] dark:border-rose-400 text-[#912A4A] dark:text-rose-400 font-bold' : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              Gentle encouragements
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: CALM FOCUS DECK */}
      {activeWellbeingTab === 'focus' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
          
          {/* Pomodoro Timer */}
          <div className="bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 p-8 rounded-lg flex flex-col items-start justify-start space-y-6">
            <div className="text-left">
              <span className="font-sans text-[10px] font-mono text-[#912A4A] dark:text-rose-400 font-semibold">
                {isBreak ? 'Gentle decompression interval' : 'Quiet study interval'}
              </span>
              <h2 className="font-mono text-5xl font-light text-stone-900 dark:text-stone-100 tracking-tight mt-2">
                {formatTime(timeLeft)}
              </h2>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                aria-label={timerRunning ? "Pause focus timer" : "Start focus timer"}
                className="w-12 h-12 rounded-full bg-[#912A4A] hover:bg-[#78223d] text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              >
                {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 pl-0.5" />}
              </button>
              <button
                onClick={handlePomodoroReset}
                aria-label="Reset focus timer"
                className="w-12 h-12 rounded-full border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-700 dark:text-stone-300 flex items-center justify-center hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            <p className="font-sans text-[11px] text-stone-500 italic max-w-xs text-left leading-relaxed">
              "No streaks. No alerts. Work gently until the timer resolves. If you feel tired, close the app and rest."
            </p>
          </div>

          {/* Soundscapes */}
          <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-6 rounded-lg flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <h3 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#912A4A]" /> Procedural Soundscapes
              </h3>
              <p className="font-sans text-xs text-stone-500 leading-relaxed">
                Procedurally synthesized rain and breeze textures. These are generated inside your browser using raw mathematical waves to establish acoustic calm.
              </p>

              <div className="space-y-2">
                {SOUNDSCAPES.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => toggleSoundscape(sound.id)}
                    className={`w-full text-left p-3 rounded-lg border font-sans text-xs flex justify-between items-center transition-all cursor-pointer ${
                      activeSoundscape === sound.id
                        ? 'bg-[#912A4A]/10 border-[#912A4A]/30 text-[#912A4A] dark:text-rose-300 font-semibold'
                        : 'bg-stone-50/50 dark:bg-stone-900/30 border-stone-150 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-250 dark:hover:border-stone-700'
                    }`}
                  >
                    <span>{sound.name}</span>
                    <span className="font-mono text-[9px] bg-stone-100 dark:bg-stone-900 px-2 py-0.5 rounded text-stone-400">
                      {activeSoundscape === sound.id ? 'synthesizing' : sound.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {activeSoundscape && (
              <div className="pt-4 border-t border-stone-100 dark:border-stone-850 mt-4 text-[10px] font-sans text-stone-400 flex items-center justify-center gap-1">
                <VolumeX className="w-3.5 h-3.5" /> Toggle active soundscape to silence synthesizer.
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: SUSTAINING YOURSELF GUIDES */}
      {activeWellbeingTab === 'self_care' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          
          {/* Menu of topics */}
          <div className="lg:col-span-1 bg-stone-50/50 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-800 p-4 rounded-lg space-y-2 h-fit">
            <h4 className="text-[10px] font-bold text-stone-400 block mb-2 font-sans">Sustaining topics</h4>
            {selfCareTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setActiveTopicId(topic.id)}
                className={`w-full text-left p-3 rounded-md font-sans text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTopicId === topic.id
                    ? 'bg-white dark:bg-stone-950 border border-[#912A4A]/20 dark:border-stone-700 text-stone-950 dark:text-stone-100 font-medium shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                }`}
              >
                <span className="text-sm">{topic.emoji}</span>
                <span>{topic.title}</span>
              </button>
            ))}
          </div>

          {/* Details column */}
          <div className="lg:col-span-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 space-y-6 shadow-xs">
            <div>
              <span className="text-[10px] font-mono text-[#912A4A] dark:text-rose-400 font-semibold">Academic support strategy</span>
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-100 mt-1 flex items-center gap-2">
                <span>{activeTopic.emoji}</span> {activeTopic.title}
              </h2>
              <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">{activeTopic.description}</p>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-900/30 border border-stone-150 dark:border-stone-800 rounded-lg text-xs italic text-stone-600 dark:text-stone-400 leading-relaxed">
              "{activeTopic.quote}"
            </div>

            <div className="space-y-3.5 pt-4 border-t border-stone-100 dark:border-stone-850">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">Gentle actionable steps:</h4>
              <ul className="space-y-2.5">
                {activeTopic.tips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-stone-600 dark:text-stone-400 flex items-start gap-2.5 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-[#912A4A]/5 border border-[#912A4A]/15 rounded-lg space-y-1.5 animate-fadeIn">
              <h4 className="text-xs font-semibold text-[#912A4A] dark:text-rose-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Support Reflection Prompt:
              </h4>
              <p className="text-xs italic text-stone-600 dark:text-stone-400 leading-relaxed">
                "{activeTopic.reflectionPrompt}"
              </p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: CELEBRATE TODAY'S PROGRESS */}
      {activeWellbeingTab === 'wins' && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 space-y-6 shadow-xs animate-fadeIn">
          <div>
            <h3 className="font-sans font-semibold text-stone-950 dark:text-stone-100 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#912A4A] dark:text-rose-400" /> Celebrate Today's Progress
            </h3>
            <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
              Research contains almost no instant feedback loops. Track small micro-wins (e.g., correcting one citation, reading a page, typing 50 messy words) to foster momentum and remember that any positive action is a complete victory.
            </p>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {smallWins.map((win, idx) => (
              <div key={idx} className="p-3 bg-emerald-50/10 dark:bg-emerald-950/15 border border-emerald-100/60 dark:border-emerald-900/40 rounded-lg flex justify-between items-center text-xs animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500 shrink-0"></span>
                  <span className="text-stone-800 dark:text-stone-200 leading-relaxed">{win}</span>
                </div>
                <button
                  onClick={() => handleDeleteWin(idx)}
                  className="text-stone-400 hover:text-red-500 text-[10px] font-mono px-1 rounded transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            ))}

            {smallWins.length === 0 && (
              <div className="text-left py-8 text-stone-400 text-xs italic">
                No micro-wins logged yet today. Remember: simply checking in today is a win. Record it below!
              </div>
            )}
          </div>

          <form onSubmit={handleAddWin} className="flex gap-2 pt-4 border-t border-stone-100 dark:border-stone-850">
            <label htmlFor="micro-win-input" className="sr-only">Record a micro win</label>
            <input
              id="micro-win-input"
              type="text"
              placeholder="Record a small focus accomplishment (e.g., read an abstract, opened the app)..."
              value={newWin}
              onChange={(e) => setNewWin(e.target.value)}
              className="flex-grow font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-[#912A4A]"
              required
            />
            <button
              type="submit"
              className="font-sans text-xs bg-[#912A4A] hover:bg-[#78223d] text-white px-4 py-2 rounded shadow-sm transition-colors cursor-pointer shrink-0"
            >
              Log Win
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: GENTLE ENCOURAGEMENTS */}
      {activeWellbeingTab === 'reflections' && (
        <div className="max-w-2xl bg-stone-50 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-800 rounded-lg p-8 text-left space-y-6 shadow-xs animate-fadeIn">
          <div className="flex justify-start">
            <Heart className="w-8 h-8 text-rose-500 animate-pulse" />
          </div>
          
          <div className="space-y-4">
            <span className="text-[9px] font-mono font-semibold text-[#912A4A] dark:text-rose-400">
              Gentle companion dialogue
            </span>
            <p className="text-base text-stone-800 dark:text-stone-100 italic leading-relaxed max-w-lg">
              "{encouragement}"
            </p>
          </div>

          <div className="pt-4 border-t border-stone-100 dark:border-stone-850/50 flex justify-start">
            <button
              onClick={handleRefreshEncouragement}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Another gentle reminder
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
