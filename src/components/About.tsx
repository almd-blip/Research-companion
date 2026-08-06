/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Book, Compass, Shield, Heart, Eye, Info, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PlatformSpecificationView from './PlatformSpecificationView';

export default function About() {
  const [showSpec, setShowSpec] = useState(false);

  // Track individual section collapse states (Philosophy open by default, others collapsible)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    philosophy: true,
    purpose: false,
    howItWorks: false,
    growth: false,
    offline: false,
    accessibility: false,
    privacy: false,
    integrity: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllSections = (open: boolean) => {
    setOpenSections({
      philosophy: open,
      purpose: open,
      howItWorks: open,
      growth: open,
      offline: open,
      accessibility: open,
      privacy: open,
      integrity: open,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans" id="about-module">
      {/* Header (Always Visible) */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-5" id="about-header-container">
        <div className="space-y-1" id="about-header-text">
          <h1 className="font-sans font-medium tracking-tight text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 flex items-center gap-3" id="about-page-title">
            About Research Companion
          </h1>
          <p className="font-sans text-stone-500 dark:text-stone-400 text-xs sm:text-sm" id="about-page-subtitle">
            A gentle, human-centric space designed to support you through the emotional and intellectual journeys of research.
          </p>
        </div>
      </div>

      {/* Main Progressive Disclosure Content */}
      {!showSpec ? (
        <div className="space-y-6 pt-2" id="about-main-content">
          {/* Control bar for section disclosure */}
          <div className="flex justify-end gap-3 text-xs text-stone-500 dark:text-stone-400" id="about-section-controls">
            <button
              type="button"
              onClick={() => setAllSections(true)}
              className="hover:text-[#912A4A] dark:hover:text-rose-400 transition-colors cursor-pointer underline underline-offset-2"
              id="about-expand-all-btn"
            >
              Expand All
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setAllSections(false)}
              className="hover:text-[#912A4A] dark:hover:text-rose-400 transition-colors cursor-pointer underline underline-offset-2"
              id="about-collapse-all-btn"
            >
              Collapse All
            </button>
          </div>

          {/* Our Core Philosophy Section */}
          <div className="bg-[#912A4A]/5 dark:bg-stone-900/40 border border-[#912A4A]/15 dark:border-stone-800 rounded-lg p-5 md:p-6 space-y-3" id="about-philosophy-card">
            <button
              type="button"
              onClick={() => toggleSection('philosophy')}
              className="w-full flex items-center justify-between text-left group cursor-pointer focus:outline-none"
              id="about-philosophy-toggle-btn"
              aria-expanded={openSections.philosophy}
            >
              <h2 className="text-lg md:text-xl font-medium text-[#912A4A] dark:text-rose-400" id="about-philosophy-title">
                Our Core Philosophy
              </h2>
              <div className="p-1.5 rounded-full bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-400 group-hover:bg-[#912A4A]/20 transition-colors flex items-center justify-center shrink-0" id="about-philosophy-icon-wrap">
                {openSections.philosophy ? (
                  <Minus className="w-4 h-4 text-[#912A4A] dark:text-rose-400" id="about-philosophy-minus" />
                ) : (
                  <Plus className="w-4 h-4 text-[#912A4A] dark:text-rose-400" id="about-philosophy-plus" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {openSections.philosophy && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3 overflow-hidden pt-1"
                  id="about-philosophy-content"
                >
                  <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed" id="about-philosophy-desc-1">
                    Research is often treated as a series of cold milestones—milestones that demand continuous output, high speeds, and rigid linear metrics. But research is actually a human endeavor. It is non-linear, filled with ambiguity, self-doubt, breakthroughs, and fatigue.
                  </p>
                  <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed font-semibold" id="about-philosophy-desc-2">
                    Research Companion is not mere research software. It is a calm companion that helps people sustain themselves through the many journeys of research.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Grid of detail sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="about-sections-grid">
            {/* Purpose */}
            <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-5 rounded-lg space-y-3 transition-colors" id="about-purpose-card">
              <button
                type="button"
                onClick={() => toggleSection('purpose')}
                className="w-full flex items-center justify-between text-left group cursor-pointer focus:outline-none"
                id="about-purpose-toggle-btn"
                aria-expanded={openSections.purpose}
              >
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2" id="about-purpose-title">
                  <Compass className="w-4 h-4 text-[#912A4A] dark:text-rose-400" id="about-purpose-icon" /> Purpose
                </h3>
                <div className="p-1 rounded-full bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-400 group-hover:bg-[#912A4A]/20 transition-colors flex items-center justify-center shrink-0" id="about-purpose-icon-wrap">
                  {openSections.purpose ? (
                    <Minus className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" id="about-purpose-minus" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" id="about-purpose-plus" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {openSections.purpose && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed overflow-hidden"
                    id="about-purpose-desc"
                  >
                    Whether you are writing a simple essay, a PhD dissertation, a journal paper, a funding proposal, or policy reports—we aim to shield your bandwidth. This companion exists to reduce cognitive load and provide supportive, non-judgmental guidance so you can find flow without overwhelm.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* How it Works */}
            <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-5 rounded-lg space-y-3 transition-colors" id="about-howitworks-card">
              <button
                type="button"
                onClick={() => toggleSection('howItWorks')}
                className="w-full flex items-center justify-between text-left group cursor-pointer focus:outline-none"
                id="about-howitworks-toggle-btn"
                aria-expanded={openSections.howItWorks}
              >
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2" id="about-howitworks-title">
                  <Info className="w-4 h-4 text-[#912A4A] dark:text-rose-400" id="about-howitworks-icon" /> How It Works
                </h3>
                <div className="p-1 rounded-full bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-400 group-hover:bg-[#912A4A]/20 transition-colors flex items-center justify-center shrink-0" id="about-howitworks-icon-wrap">
                  {openSections.howItWorks ? (
                    <Minus className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" id="about-howitworks-minus" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" id="about-howitworks-plus" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {openSections.howItWorks && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed overflow-hidden"
                    id="about-howitworks-desc"
                  >
                    By indicating your project type and your emotional arrival state, the companion adjusts its interface focus, prompts, and micro-guidance. It organizes your papers, assists with citation metadata corrections via Gemini, maps concept connections dynamically, and tracks small wins securely on your device.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Design for Growth */}
            <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-5 rounded-lg space-y-3 transition-colors" id="about-growth-card">
              <button
                type="button"
                onClick={() => toggleSection('growth')}
                className="w-full flex items-center justify-between text-left group cursor-pointer focus:outline-none"
                id="about-growth-toggle-btn"
                aria-expanded={openSections.growth}
              >
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2" id="about-growth-title">
                  <Heart className="w-4 h-4 text-rose-500" id="about-growth-icon" /> Design for Growth
                </h3>
                <div className="p-1 rounded-full bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-400 group-hover:bg-[#912A4A]/20 transition-colors flex items-center justify-center shrink-0" id="about-growth-icon-wrap">
                  {openSections.growth ? (
                    <Minus className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" id="about-growth-minus" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" id="about-growth-plus" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {openSections.growth && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed overflow-hidden"
                    id="about-growth-desc"
                  >
                    We believe that mistakes, errors, and rejections are natural components of scholarship, not personal labels. We omit high-pressure gamification features like streaks or urgent daily targets, replacing them with spacious negative space and gentle micro-wins.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Offline-First */}
            <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-5 rounded-lg space-y-3 transition-colors" id="about-offline-card">
              <button
                type="button"
                onClick={() => toggleSection('offline')}
                className="w-full flex items-center justify-between text-left group cursor-pointer focus:outline-none"
                id="about-offline-toggle-btn"
                aria-expanded={openSections.offline}
              >
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2" id="about-offline-title">
                  <Shield className="w-4 h-4 text-emerald-600" id="about-offline-icon" /> Offline-First Principles
                </h3>
                <div className="p-1 rounded-full bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-400 group-hover:bg-[#912A4A]/20 transition-colors flex items-center justify-center shrink-0" id="about-offline-icon-wrap">
                  {openSections.offline ? (
                    <Minus className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" id="about-offline-minus" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" id="about-offline-plus" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {openSections.offline && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed overflow-hidden"
                    id="about-offline-desc"
                  >
                    Your draft materials, files, feedback, and notes reside strictly on-device in your local cache. Research is often completed in remote archives, on trains, or in quiet libraries. By operating offline, we safeguard your data ownership and prevent distractions from constant internet dependency.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Accessibility */}
            <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-5 rounded-lg space-y-3 transition-colors" id="about-accessibility-card">
              <button
                type="button"
                onClick={() => toggleSection('accessibility')}
                className="w-full flex items-center justify-between text-left group cursor-pointer focus:outline-none"
                id="about-accessibility-toggle-btn"
                aria-expanded={openSections.accessibility}
              >
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2" id="about-accessibility-title">
                  <Eye className="w-4 h-4 text-blue-500" id="about-accessibility-icon" /> Accessibility & Wellbeing
                </h3>
                <div className="p-1 rounded-full bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-400 group-hover:bg-[#912A4A]/20 transition-colors flex items-center justify-center shrink-0" id="about-accessibility-icon-wrap">
                  {openSections.accessibility ? (
                    <Minus className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" id="about-accessibility-minus" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" id="about-accessibility-plus" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {openSections.accessibility && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed overflow-hidden"
                    id="about-accessibility-desc"
                  >
                    Our layouts prioritize fluid margins, optimal text line-lengths, adjustable font sizes, high-contrast states, and friendly, readable interfaces. Rest, reflective breaks, and screen-free decompressions are integrated as active necessities, rather than passive rewards.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Privacy */}
            <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-5 rounded-lg space-y-3 transition-colors" id="about-privacy-card">
              <button
                type="button"
                onClick={() => toggleSection('privacy')}
                className="w-full flex items-center justify-between text-left group cursor-pointer focus:outline-none"
                id="about-privacy-toggle-btn"
                aria-expanded={openSections.privacy}
              >
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2" id="about-privacy-title">
                  <Shield className="w-4 h-4 text-purple-500" id="about-privacy-icon" /> Absolute Data Privacy
                </h3>
                <div className="p-1 rounded-full bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-400 group-hover:bg-[#912A4A]/20 transition-colors flex items-center justify-center shrink-0" id="about-privacy-icon-wrap">
                  {openSections.privacy ? (
                    <Minus className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" id="about-privacy-minus" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" id="about-privacy-plus" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {openSections.privacy && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed overflow-hidden"
                    id="about-privacy-desc"
                  >
                    We never tracking or cache your writing drafts. Your feedback forms, projects, and personal parameters remain in your browser. Any AI interaction via Gemini is proxy-routed securely with zero persistent server-side caching or model training on your workspace.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Research Integrity Boundary */}
            <div className="bg-[#912A4A]/5 dark:bg-stone-900/40 border border-[#912A4A]/15 dark:border-stone-800 p-5 rounded-lg space-y-3 md:col-span-2 transition-colors" id="about-integrity-card">
              <button
                type="button"
                onClick={() => toggleSection('integrity')}
                className="w-full flex items-center justify-between text-left group cursor-pointer focus:outline-none"
                id="about-integrity-toggle-btn"
                aria-expanded={openSections.integrity}
              >
                <h3 className="text-sm font-semibold text-[#912A4A] dark:text-rose-400 flex items-center gap-2" id="about-integrity-title">
                  <Shield className="w-4 h-4 text-[#912A4A] dark:text-rose-400" id="about-integrity-icon" /> Research Integrity Boundary
                </h3>
                <div className="p-1 rounded-full bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-400 group-hover:bg-[#912A4A]/20 transition-colors flex items-center justify-center shrink-0" id="about-integrity-icon-wrap">
                  {openSections.integrity ? (
                    <Minus className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" id="about-integrity-minus" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" id="about-integrity-plus" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {openSections.integrity && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-stone-700 dark:text-stone-300 text-xs leading-relaxed overflow-hidden"
                    id="about-integrity-desc"
                  >
                    The Research Companion will <strong>never write, generate, or produce complete academic papers, articles, books, reports, or research outputs on your behalf</strong>. The purpose of the AI is to support the research process, not replace the researcher. The AI acts as a research assistant, critical thinking partner, and analytical tool — helping you organize materials, identify themes, map literature, evaluate evidence, structure notes, and check logic — while you remain solely responsible for forming arguments, interpreting evidence, drawing conclusions, and writing original work.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Call-to-action to read technical specification paper */}
          <div className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="about-spec-banner">
            <div className="space-y-1 text-left" id="about-spec-info">
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100" id="about-spec-title">Academic Specification & Roadmap</h4>
              <p className="text-stone-500 text-xs" id="about-spec-subtitle">Read our formal design specification, database architectures, and engineering guidelines.</p>
            </div>
            <button
              onClick={() => setShowSpec(true)}
              className="font-sans text-xs bg-stone-900 dark:bg-stone-800 hover:bg-stone-850 dark:hover:bg-stone-700 text-white px-4 py-2.5 rounded transition-all cursor-pointer flex items-center gap-2 shadow-sm text-left shrink-0"
              id="about-open-spec-btn"
            >
              <Book className="w-4 h-4" id="about-spec-book-icon" /> Open Specification Paper
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-2" id="about-spec-container">
          <div className="flex justify-between items-center" id="about-spec-nav">
            <button
              onClick={() => setShowSpec(false)}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-sans cursor-pointer flex items-center gap-1"
              id="about-back-to-about-btn"
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

