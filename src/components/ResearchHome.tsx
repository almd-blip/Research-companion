/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ResearchJourney, Paper, MoodCheckIn } from '../types';
import { HelpCircle, Sparkles, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface ResearchHomeProps {
  journeys: ResearchJourney[];
  papers: Paper[];
  onSelectJourney: (id: string) => void;
  onSetTab: (tab: string) => void;
  onAddMoodCheckIn: (mood: MoodCheckIn) => void;
  moodCheckIns: MoodCheckIn[];
}

export default function ResearchHome({
  journeys,
  papers,
  onSelectJourney,
  onSetTab,
  onAddMoodCheckIn,
  moodCheckIns,
}: ResearchHomeProps) {
  const [dailyFocus, setDailyFocus] = useState('');
  const [savedFocus, setSavedFocus] = useState(() => {
    return localStorage.getItem('daily_focus') || '';
  });
  const [advisorMessage, setAdvisorMessage] = useState<any>(null);
  const [loadingAdvisor, setLoadingAdvisor] = useState(false);

  const moods: { label: string; value: MoodCheckIn['state']; desc: string; emoji: string }[] = [
    { label: 'Focused', value: 'focused', desc: 'Ready for deep, uninterrupted thinking', emoji: '✨' },
    { label: 'Curious', value: 'curious', desc: 'Exploring alternative links and pathways', emoji: '🔍' },
    { label: 'Overwhelmed', value: 'overwhelmed', desc: 'Drowning in literature and expectations', emoji: '🌊' },
    { label: 'Stuck', value: 'stuck', desc: 'Facing a cognitive wall or code crash', emoji: '🧱' },
    { label: 'Doubting myself', value: 'doubting', desc: 'Feeling like an academic impostor', emoji: '💭' },
    { label: 'Tired', value: 'tired', desc: 'Low energy, physical or mental fatigue', emoji: '💤' },
  ];

  const handleMoodSelect = async (state: MoodCheckIn['state']) => {
    const newCheckIn: MoodCheckIn = {
      id: Math.random().toString(),
      timestamp: new Date().toISOString(),
      state,
    };
    onAddMoodCheckIn(newCheckIn);
    setLoadingAdvisor(true);

    try {
      // Consult Gemini on the server for mood-based academic advice
      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moodState: state,
          projectDetails: journeys[0] ? `${journeys[0].title}: ${journeys[0].description}` : 'Academic inquiry',
          question: `I am feeling ${state} today. Please guide me.`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAdvisorMessage(data);
      } else {
        setAdvisorMessage(getFallbackAdvice(state));
      }
    } catch (err) {
      console.error(err);
      setAdvisorMessage(getFallbackAdvice(state));
    } finally {
      setLoadingAdvisor(false);
    }
  };

  const getFallbackAdvice = (state: MoodCheckIn['state']) => {
    const fallbackMap: Record<MoodCheckIn['state'], any> = {
      focused: {
        mentoringResponse: "Outstanding. You are in a high-focus zone. Protect this boundary. Turn off communications and dive into drafting or complex structuring.",
        actionSteps: ["Write down your single focus goal", "Close all browser tabs except reference papers", "Engage in 50 minutes of deep work"],
        reflectionPrompt: "What is the single most valuable paragraph you want to complete in this session?"
      },
      curious: {
        mentoringResponse: "Curiosity is the engine of original scholarship. Follow the rabbit hole today, but keep a tracing log to avoid getting lost.",
        actionSteps: ["Browse index pages of your favorite collection", "Sketch a quick conceptual link in the knowledge graph", "Jot down three speculative questions"],
        reflectionPrompt: "What hidden connections might exist between your primary question and your secondary field?"
      },
      overwhelmed: {
        mentoringResponse: "A common and valid response to high-density academic spaces. Overwhelm is simply cognitive capacity reaching its temporary limit. There is no need to make massive progress today.",
        actionSteps: ["Break a task into three ridiculous, simple sub-steps", "Tackle just one spelling correction in references", "Close all tabs and set a 15-minute Pomodoro timer just to outline"],
        reflectionPrompt: "If you could only do one 5-minute task today to release pressure, what would it be?"
      },
      stuck: {
        mentoringResponse: "Being stuck is a critical stage of learning, not a defect. It indicates your brain is integrating conflicting concepts. It is an intellectual milestone.",
        actionSteps: ["Write a paragraph explaining exactly WHY you are stuck, in plain, non-academic language", "Look up the methodology section of an opposing paper", "Discuss the blockage with the advisor check-in panel"],
        reflectionPrompt: "How would you explain your current blockage to a 10-year-old?"
      },
      doubting: {
        mentoringResponse: "Imposter phenomenon is the psychological tax of working alongside dedicated minds. It is a predictable base-rate error, not a reflection of your intelligence.",
        actionSteps: ["Read the Impostor Syndrome Guide in the Wellbeing Centre", "Record one small win in your daily focus tracker", "List three active decisions you made that led to your progress"],
        reflectionPrompt: "What evidence supports your capability today rather than your fears?"
      },
      tired: {
        mentoringResponse: "Scholarly research is a marathon, not a dash. Fatigue degrades cognitive synthesis. Rest is not an reward for completing work; it is a metabolic necessity.",
        actionSteps: ["Enable the 'Nature Breeze' soundscape in wellbeing", "Read an abstract in calm reading mode without taking notes", "Do a metadata-only review of 3 references in the Library"],
        reflectionPrompt: "How can you adapt your desk setup or schedule to prioritize physical decompression today?"
      },
    };
    return fallbackMap[state];
  };

  const handleSaveFocus = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('daily_focus', dailyFocus);
    setSavedFocus(dailyFocus);
    setDailyFocus('');
  };

  const handleClearFocus = () => {
    localStorage.removeItem('daily_focus');
    setSavedFocus('');
  };

  const latestMood = moodCheckIns && moodCheckIns.length > 0 ? moodCheckIns[moodCheckIns.length - 1] : undefined;

  return (
    <div className="space-y-8" id="research-home-module">
      {/* Header section with academic warm paper theme */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-5">
        <h1 className="font-sans font-medium tracking-tight text-3xl text-stone-900 dark:text-stone-100">
          Welcome back, Scholar.
        </h1>
        <p className="font-sans text-stone-500 text-sm mt-1">
          A quiet workspace designed to help you think clearly, structure traceably, and work sustainably.
        </p>
      </div>

      {/* Grid of Focus & Mood */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Today's Focus Card */}
        <div className="bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 p-6 rounded-lg flex flex-col justify-between">
          <div>
            <h2 className="font-sans font-medium text-stone-900 dark:text-stone-100 text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-800 dark:text-amber-500" /> Today's Sole Focus
            </h2>
            <p className="font-sans text-xs text-stone-500 mt-1 mb-4">
              Academic research is complex. Choose just one achievable micro-goal for today to safeguard your mental bandwidth.
            </p>

            {savedFocus ? (
              <div className="bg-white dark:bg-stone-950 p-4 border border-stone-200 dark:border-stone-800 rounded flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 dark:text-amber-500">Current Objective</span>
                  <p className="font-sans font-medium text-stone-800 dark:text-stone-200 text-sm mt-1">{savedFocus}</p>
                </div>
                <button
                  onClick={handleClearFocus}
                  className="font-sans text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1"
                >
                  Mark Completed
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveFocus} className="space-y-3">
                <label htmlFor="daily-focus-input" className="sr-only">Today's Sole Focus Goal</label>
                <input
                  id="daily-focus-input"
                  type="text"
                  placeholder="e.g., Structure Chapter 2 methodology outline..."
                  value={dailyFocus}
                  onChange={(e) => setDailyFocus(e.target.value)}
                  className="w-full font-sans text-sm p-3 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-amber-700/40 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
                  required
                />
                <button
                  type="submit"
                  className="w-full font-sans text-xs bg-amber-900/10 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300 border border-amber-900/20 py-2 rounded hover:bg-amber-900/20 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950"
                >
                  Anchor Focus Goal
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-amber-900/10 dark:border-stone-800 flex justify-between items-center text-xs text-stone-500 font-sans">
            <span>Library Status: {papers.length} Papers loaded</span>
            <span>Active Journeys: {journeys.length}</span>
          </div>
        </div>

        {/* How are you arriving today? */}
        <div className="bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 p-6 rounded-lg flex flex-col justify-between">
          <div>
            <h2 className="font-sans font-medium text-stone-900 dark:text-stone-100 text-lg flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-800 dark:text-amber-500" /> How are you arriving today?
            </h2>
            <p className="font-sans text-xs text-stone-500 mt-1 mb-4">
              Select your current psychological state. Our platform adapts to your focus and provides evidence-based, calm guidance.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {moods.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleMoodSelect(m.value)}
                  className={`p-2.5 rounded text-left border font-sans transition-all flex flex-col justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950 ${
                    latestMood?.state === m.value
                      ? 'bg-amber-900/15 border-amber-900/35 dark:border-amber-800/80'
                      : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 justify-between w-full">
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">{m.label}</span>
                    <span className="text-xs">{m.emoji}</span>
                  </div>
                  <span className="text-[10px] text-stone-400 leading-tight mt-1">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {latestMood && (
            <div className="mt-4 text-xs font-sans text-stone-500 flex items-center gap-1.5">
              <span>Selected State:</span>
              <span className="font-semibold text-stone-700 dark:text-stone-300 capitalize">{latestMood.state}</span>
              <span className="text-[10px] text-stone-400">({new Date(latestMood.timestamp).toLocaleTimeString()})</span>
            </div>
          )}
        </div>

      </div>

      {/* Advisor response if generated */}
      {(loadingAdvisor || advisorMessage) && (
        <div className="bg-amber-50/10 dark:bg-stone-900/20 border border-amber-900/10 dark:border-stone-800 p-6 rounded-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Sparkles className="w-24 h-24 text-amber-900" />
          </div>

          {loadingAdvisor ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-2">
              <div className="w-5 h-5 border-2 border-amber-900 border-t-transparent dark:border-amber-500 dark:border-t-transparent rounded-full animate-spin"></div>
              <p className="font-sans text-xs text-stone-500 italic">Consulting academic advisor, formulating quiet guidance...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-800 dark:text-amber-400" />
                <h3 className="font-sans font-medium text-xs text-amber-800 dark:text-amber-400 uppercase tracking-wider">Advisor Check-In Dialogue</h3>
              </div>

              <div className="max-w-3xl">
                <p className="font-sans text-stone-700 dark:text-stone-300 text-sm leading-relaxed whitespace-pre-line italic">
                  "{advisorMessage.mentoringResponse}"
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-amber-900/5 dark:border-stone-800/40">
                <div>
                  <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Recommended Action Steps Today:
                  </h4>
                  <ul className="space-y-2">
                    {advisorMessage.actionSteps?.map((step: string, index: number) => (
                      <li key={index} className="font-sans text-xs text-stone-600 dark:text-stone-400 flex items-start gap-2">
                        <span className="font-mono text-[10px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-500 inline-block mt-0.5">{index + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-blue-600" /> Supportive Reflection Prompt:
                  </h4>
                  <div className="p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded">
                    <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed italic">
                      {advisorMessage.reflectionPrompt}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Journeys List */}
      <div className="space-y-4">
        <h3 className="font-sans font-medium text-stone-900 dark:text-stone-100 text-lg">Active Research Journeys</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {journeys.map((j) => (
            <div
              key={j.id}
              className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-5 rounded-lg flex flex-col justify-between hover:border-amber-900/20 dark:hover:border-stone-700 transition-all shadow-sm"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h4 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-sm truncate">{j.title}</h4>
                  <span className="font-mono text-[9px] uppercase bg-stone-100 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/80 px-2 py-0.5 rounded text-stone-500">
                    {j.type}
                  </span>
                </div>
                <p className="font-sans text-xs text-stone-500 dark:text-stone-400 line-clamp-3 leading-relaxed mb-4">
                  {j.description}
                </p>
              </div>

              <div className="flex items-center justify-between mt-2 pt-3 border-t border-stone-100 dark:border-stone-900 text-[11px] text-stone-400">
                <span>{j.chapters.length} chapters · {j.tasks.filter(t => t.completed).length}/{j.tasks.length} tasks</span>
                <button
                  onClick={() => {
                    onSelectJourney(j.id);
                    onSetTab('workspace');
                  }}
                  className="font-sans text-amber-800 dark:text-amber-400 hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1.5"
                >
                  Enter Journey →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
