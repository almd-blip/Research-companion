/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Book, Compass, Shield, Heart, Eye, Download, Info } from 'lucide-react';
import PlatformSpecificationView from './PlatformSpecificationView';

export default function About() {
  const [showSpec, setShowSpec] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans" id="about-module">
      {/* Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-5">
        <h1 className="font-sans font-medium tracking-tight text-3xl text-stone-900 dark:text-stone-100">
          About Research Companion
        </h1>
        <p className="font-sans text-stone-500 text-sm mt-1">
          A gentle, human-centric space designed to support you through the emotional and intellectual journeys of research.
        </p>
      </div>

      {!showSpec ? (
        <div className="space-y-8 animate-fadeIn">
          {/* Main Statement */}
          <div className="bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 rounded-lg p-6 md:p-8 space-y-4">
            <h2 className="text-xl font-medium text-amber-900 dark:text-amber-400">Our Core Philosophy</h2>
            <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">
              Research is often treated as a series of cold milestones—milestones that demand continuous output, high speeds, and rigid linear metrics. But research is actually a human endeavor. It is non-linear, filled with ambiguity, self-doubt, breakthroughs, and fatigue.
            </p>
            <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed font-semibold">
              Research Companion is not mere research software. It is a calm companion that helps people sustain themselves through the many journeys of research.
            </p>
          </div>

          {/* Grid of details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Purpose */}
            <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-6 rounded-lg space-y-3">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-800" /> Purpose
              </h3>
              <p className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">
                Whether you are writing a simple essay, a PhD dissertation, a journal paper, a funding proposal, or policy reports—we aim to shield your bandwidth. This companion exists to reduce cognitive load and provide supportive, non-judgmental guidance so you can find flow without overwhelm.
              </p>
            </div>

            {/* How it Works */}
            <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-6 rounded-lg space-y-3">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-800" /> How It Works
              </h3>
              <p className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">
                By indicating your project type and your emotional arrival state, the companion adjusts its interface focus, prompts, and micro-guidance. It organizes your papers, assists with citation metadata corrections via Gemini, maps concept connections dynamically, and tracks small wins securely on your device.
              </p>
            </div>

            {/* Design for Growth */}
            <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-6 rounded-lg space-y-3">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" /> Design for Growth
              </h3>
              <p className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">
                We believe that mistakes, errors, and rejections are natural components of scholarship, not personal labels. We omit high-pressure gamification features like streaks or urgent daily targets, replacing them with spacious negative space and gentle micro-wins.
              </p>
            </div>

            {/* Offline-First */}
            <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-6 rounded-lg space-y-3">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" /> Offline-First Principles
              </h3>
              <p className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">
                Your draft materials, files, feedback, and notes reside strictly on-device in your local cache. Research is often completed in remote archives, on trains, or in quiet libraries. By operating offline, we safeguard your data ownership and prevent distractions from constant internet dependency.
              </p>
            </div>

            {/* Accessibility */}
            <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-6 rounded-lg space-y-3">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" /> Accessibility & Wellbeing
              </h3>
              <p className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">
                Our layouts prioritize fluid margins, optimal text line-lengths, adjustable font sizes, high-contrast states, and friendly, readable interfaces. Rest, reflective breaks, and screen-free decompressions are integrated as active necessities, rather than passive rewards.
              </p>
            </div>

            {/* Privacy */}
            <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-6 rounded-lg space-y-3">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-500" /> Absolute Data Privacy
              </h3>
              <p className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">
                We never tracking or cache your writing drafts. Your feedback forms, projects, and personal parameters remain in your browser. Any AI interaction via Gemini is proxy-routed securely with zero persistent server-side caching or model training on your workspace.
              </p>
            </div>
          </div>

          {/* Call-to-action to read technical specification paper */}
          <div className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1 text-left">
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Academic Specification & Roadmap</h4>
              <p className="text-stone-500 text-xs">Read our formal design specification, database architectures, and engineering guidelines.</p>
            </div>
            <button
              onClick={() => setShowSpec(true)}
              className="font-sans text-xs bg-stone-900 dark:bg-stone-800 hover:bg-stone-850 dark:hover:bg-stone-700 text-white px-4 py-2.5 rounded transition-all cursor-pointer flex items-center gap-2 shadow-sm text-left"
            >
              <Book className="w-4 h-4" /> Open Specification Paper
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowSpec(false)}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-sans cursor-pointer flex items-center gap-1"
            >
              ← Back to About Companion
            </button>
          </div>
          <PlatformSpecificationView />
        </div>
      )}
    </div>
  );
}
