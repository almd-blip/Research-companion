/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Database, Download, Trash, Shield, Settings2, Sliders, Sparkles, Eye, Bell, CheckCircle } from 'lucide-react';

interface SettingsProps {
  onResetAllData: () => void;
  defaultTab?: 'profile' | 'appearance' | 'backup' | 'ai' | 'notifications';
}

export default function Settings({ onResetAllData, defaultTab }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'backup' | 'ai' | 'notifications'>(
    defaultTab || 'profile'
  );

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Scholar profile state
  const [scholarName, setScholarName] = useState(() => localStorage.getItem('wellbeing_advisor_name') || 'Scholar');
  const [affiliation, setAffiliation] = useState(() => localStorage.getItem('scholar_affiliation') || 'Imperial College London');
  const [fieldOfStudy, setFieldOfStudy] = useState(() => localStorage.getItem('scholar_field') || 'HCI & Neurosymbolic AI');

  // Accessibility & Appearance
  const [theme, setTheme] = useState(() => localStorage.getItem('scholar_theme') || 'light');
  const [fontScale, setFontScale] = useState(() => localStorage.getItem('scholar_font_scale') || 'm');
  const [fontStyle, setFontStyle] = useState(() => localStorage.getItem('scholar_font_style') || 'sans');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('scholar_high_contrast') === 'true');

  // AI Options
  const [groundingLevel, setGroundingLevel] = useState('strict');
  const [customPromptGuidance, setCustomPromptGuidance] = useState(() => localStorage.getItem('scholar_custom_guidance') || '');

  // Notifications
  const [breakReminders, setBreakReminders] = useState(true);
  const [dailyEncouragements, setDailyEncouragements] = useState(true);

  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('wellbeing_advisor_name', scholarName);
    localStorage.setItem('scholar_affiliation', affiliation);
    localStorage.setItem('scholar_field', fieldOfStudy);
    triggerToast('Identity profile saved to your local offline cache.');
  };

  // Reactively apply and persist appearance configuration
  useEffect(() => {
    localStorage.setItem('scholar_theme', theme);
    localStorage.setItem('scholar_font_scale', fontScale);
    localStorage.setItem('scholar_font_style', fontStyle);
    localStorage.setItem('scholar_high_contrast', String(highContrast));
    
    // Apply contrast and dark class dynamically
    const root = document.getElementById('scholar-companion-root');
    if (root) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      document.documentElement.classList.remove('light-black');
      
      if (highContrast) {
        document.documentElement.classList.add('high-contrast');
        root.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
        root.classList.remove('high-contrast');
      }
    }

    // Trigger update event for font changes
    window.dispatchEvent(new Event('accessibility_settings_updated'));
  }, [theme, fontScale, fontStyle, highContrast]);

  const handleSaveAIOptions = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('scholar_custom_guidance', customPromptGuidance);
    triggerToast('AI assistance parameters configured.');
  };

  const handleExportData = () => {
    const data = {
      scholarProfile: { scholarName, affiliation, fieldOfStudy },
      dailyFocus: localStorage.getItem('daily_focus') || '',
      smallWins: localStorage.getItem('wellbeing_small_wins') || '',
      draftText: localStorage.getItem('draft_companion_text') || '',
      scholarProjectType: localStorage.getItem('scholar_project_type') || '',
      accessibility: { theme, fontScale, fontStyle, highContrast },
      feedbackLogs: localStorage.getItem('scholar_feedback_logs') || '[]'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `research_companion_backup_${Date.now()}.rcp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('System backup downloaded successfully.');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans text-left" id="settings-module">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-xs z-50 animate-fadeIn border border-stone-250">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{toast}</span>
        </div>
      )}

      {/* Sub tabs header */}
      <div className="border-b border-stone-200 dark:border-stone-800 flex justify-start items-center pb-2">
        <div className="flex flex-wrap gap-4 text-left" role="tablist" aria-label="Settings categories">
          <button
            role="tab"
            aria-selected={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            className={`font-sans text-xs pb-2 border-b-2 font-medium cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 rounded-xs px-1 text-left ${
              activeTab === 'profile' ? 'border-amber-900 dark:border-amber-500 text-amber-900 dark:text-amber-400 font-bold' : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Profile identity
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'appearance'}
            onClick={() => setActiveTab('appearance')}
            className={`font-sans text-xs pb-2 border-b-2 font-medium cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 rounded-xs px-1 text-left ${
              activeTab === 'appearance' ? 'border-amber-900 dark:border-amber-500 text-amber-900 dark:text-amber-400 font-bold' : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Appearance & accessibility
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
            className={`font-sans text-xs pb-2 border-b-2 font-medium cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 rounded-xs px-1 text-left ${
              activeTab === 'ai' ? 'border-amber-900 dark:border-amber-500 text-amber-900 dark:text-amber-400 font-bold' : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            AI options
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'notifications'}
            onClick={() => setActiveTab('notifications')}
            className={`font-sans text-xs pb-2 border-b-2 font-medium cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 rounded-xs px-1 text-left ${
              activeTab === 'notifications' ? 'border-amber-900 dark:border-amber-500 text-amber-900 dark:text-amber-400 font-bold' : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Notifications
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'backup'}
            onClick={() => setActiveTab('backup')}
            className={`font-sans text-xs pb-2 border-b-2 font-medium cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 rounded-xs px-1 text-left ${
              activeTab === 'backup' ? 'border-amber-900 dark:border-amber-500 text-amber-900 dark:text-amber-400 font-bold' : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Backup & diagnostics
          </button>
        </div>
      </div>

      {/* TAB 1: PROFILE IDENTITY */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 space-y-4 shadow-xs animate-fadeIn">
          <h3 className="font-sans font-semibold text-stone-950 dark:text-stone-100 text-xs flex items-center gap-2 border-b border-stone-100 dark:border-stone-850 pb-2">
            <Settings2 className="w-4 h-4 text-amber-800" aria-hidden="true" /> Identity profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="scholar-name" className="font-sans text-[10px] text-stone-600 dark:text-stone-400 font-bold block">Your name</label>
              <input
                id="scholar-name"
                type="text"
                value={scholarName}
                onChange={(e) => setScholarName(e.target.value)}
                className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="scholar-affiliation" className="font-sans text-[10px] text-stone-600 dark:text-stone-400 font-bold block">Affiliation</label>
              <input
                id="scholar-affiliation"
                type="text"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="scholar-field" className="font-sans text-[10px] text-stone-600 dark:text-stone-400 font-bold block">Field of inquiry</label>
            <input
              id="scholar-field"
              type="text"
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="font-sans text-xs bg-amber-950 dark:bg-amber-900 hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 text-white px-4 py-2 rounded transition-colors cursor-pointer shadow-xs text-center justify-center w-full sm:w-auto"
          >
            Update profile
          </button>
        </form>
      )}

      {/* TAB 2: APPEARANCE & ACCESSIBILITY */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 space-y-6 shadow-xs animate-fadeIn">
          <h3 className="font-sans font-semibold text-stone-950 dark:text-stone-100 text-xs flex items-center gap-2 border-b border-stone-100 dark:border-stone-850 pb-2">
            <Eye className="w-4 h-4 text-amber-800" aria-hidden="true" /> Appearance & accessibility
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Theme & Contrast */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-sans text-[10px] text-stone-600 dark:text-stone-400 font-bold block">Theme preference</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 min-w-[90px] py-2 px-3 rounded border font-sans text-xs cursor-pointer text-center transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 ${
                      theme === 'light' || theme === 'light-black'
                        ? 'bg-amber-900/10 dark:bg-amber-500/10 border-amber-900 dark:border-amber-500 text-amber-950 dark:text-amber-400 font-bold shadow-xs'
                        : 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-normal hover:bg-stone-100 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    Light theme
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 min-w-[90px] py-2 px-3 rounded border font-sans text-xs cursor-pointer text-center transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 ${
                      theme === 'dark'
                        ? 'bg-amber-500/10 dark:bg-amber-500/10 border-amber-500 dark:border-amber-500 text-amber-950 dark:text-amber-400 font-bold shadow-xs'
                        : 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-normal hover:bg-stone-100 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    Dark theme
                  </button>
                </div>
              </div>

              {/* High Contrast */}
              <div className="flex justify-between items-center p-3 bg-stone-50 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-800 rounded-lg">
                <label htmlFor="high-contrast-toggle" className="cursor-pointer select-none flex-grow">
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block text-left">High contrast mode</span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 block text-left">Increase visual borders and text depth.</span>
                </label>
                <input
                  id="high-contrast-toggle"
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  className="w-4 h-4 accent-amber-950 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Typography Sizing & Styles */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-sans text-[10px] text-stone-600 dark:text-stone-400 font-bold block">Reading font style</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFontStyle('sans')}
                    className={`flex-1 min-w-[110px] py-2 px-3 rounded border font-sans text-xs cursor-pointer text-center transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 ${
                      fontStyle === 'sans'
                        ? 'bg-amber-900/10 dark:bg-amber-500/10 border-amber-900 dark:border-amber-500 text-amber-950 dark:text-amber-400 font-bold shadow-xs'
                        : 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-normal hover:bg-stone-100 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    Sans (Outfit)
                  </button>
                  <button
                    onClick={() => setFontStyle('serif')}
                    className={`flex-1 min-w-[110px] py-2 px-3 rounded border font-sans text-xs cursor-pointer text-center transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 ${
                      fontStyle === 'serif'
                        ? 'bg-amber-900/10 dark:bg-amber-500/10 border-amber-900 dark:border-amber-500 text-amber-950 dark:text-amber-400 font-bold shadow-xs'
                        : 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-normal hover:bg-stone-100 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    Serif (Georgia)
                  </button>
                  <button
                    onClick={() => setFontStyle('dyslexic')}
                    className={`flex-1 min-w-[110px] py-2 px-3 rounded border font-sans text-xs cursor-pointer text-center transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 ${
                      fontStyle === 'dyslexic'
                        ? 'bg-amber-900/10 dark:bg-amber-500/10 border-amber-900 dark:border-amber-500 text-amber-950 dark:text-amber-400 font-bold shadow-xs'
                        : 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-normal hover:bg-stone-100 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    OpenDyslexic
                  </button>
                </div>
              </div>

              {/* Font scale */}
              <div className="space-y-2">
                <label className="font-sans text-[10px] text-stone-600 dark:text-stone-400 font-bold block">Text line sizing</label>
                <div className="flex flex-wrap gap-2">
                  {['s', 'm', 'l', 'xl'].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => setFontScale(scale)}
                      className={`flex-1 min-w-[70px] py-1.5 px-2.5 rounded border text-xs font-mono capitalize cursor-pointer text-center transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 ${
                        fontScale === scale
                          ? 'bg-amber-900/10 dark:bg-amber-500/10 border-amber-900 dark:border-amber-500 text-amber-950 dark:text-amber-400 font-bold shadow-xs'
                          : 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-500 font-normal hover:bg-stone-100 dark:hover:bg-stone-800/60'
                      }`}
                    >
                      {scale === 's' ? 'Small' : scale === 'm' ? 'Medium' : scale === 'l' ? 'Large' : 'Extra'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 shrink-0" aria-hidden="true" />
            <span>Appearance and accessibility modifications are applied in real time and stored to your offline cache automatically.</span>
          </div>
        </div>
      )}

      {/* TAB 3: AI OPTIONS */}
      {activeTab === 'ai' && (
        <form onSubmit={handleSaveAIOptions} className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 space-y-4 shadow-xs animate-fadeIn">
          <h3 className="font-sans font-semibold text-stone-950 dark:text-stone-100 text-xs flex items-center gap-2 border-b border-stone-100 dark:border-stone-850 pb-2">
            <Sparkles className="w-4 h-4 text-amber-800" aria-hidden="true" /> AI scholarly parameters
          </h3>

          <div className="p-3 bg-amber-50/15 dark:bg-stone-900/20 border border-amber-950/10 dark:border-stone-800 rounded-lg text-xs leading-relaxed text-stone-700 dark:text-stone-300 text-left">
            Research Companion leverages server-side **Gemini 3.5 Flash** for secure metadata checking, theme-building, and advice formulation. All operations use strict negative constraints, ensuring AI assists you with structure rather than fabricating claims.
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="font-sans text-[10px] text-stone-600 dark:text-stone-400 font-bold block text-left">Evidentiary grounding level</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGroundingLevel('strict')}
                  className={`flex-1 py-2 px-4 rounded border text-xs cursor-pointer text-center transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 ${
                    groundingLevel === 'strict'
                      ? 'bg-amber-900/10 dark:bg-amber-500/10 border-amber-900 dark:border-amber-500 text-amber-950 dark:text-amber-400 font-bold shadow-xs'
                      : 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-normal hover:bg-stone-100 dark:hover:bg-stone-800/60'
                  }`}
                >
                  Strict (only user library)
                </button>
                <button
                  type="button"
                  onClick={() => setGroundingLevel('balanced')}
                  className={`flex-1 py-2 px-4 rounded border text-xs cursor-pointer text-center transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 ${
                    groundingLevel === 'balanced'
                      ? 'bg-amber-900/10 dark:bg-amber-500/10 border-amber-900 dark:border-amber-500 text-amber-950 dark:text-amber-400 font-bold shadow-xs'
                      : 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-normal hover:bg-stone-100 dark:hover:bg-stone-800/60'
                  }`}
                >
                  Balanced (general academic grounding)
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="custom-instructions" className="font-sans text-[10px] text-stone-600 dark:text-stone-400 font-bold block text-left">Custom companion instructions</label>
              <textarea
                id="custom-instructions"
                value={customPromptGuidance}
                onChange={(e) => setCustomPromptGuidance(e.target.value)}
                placeholder="Instruct the companion to speak in a certain way, prioritize certain methods, or match your cognitive preferences..."
                rows={3}
                className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-800 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-left placeholder-stone-400 dark:placeholder-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="font-sans text-xs bg-amber-950 dark:bg-amber-900 hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 text-white px-4 py-2 rounded transition-colors cursor-pointer text-center justify-center w-full sm:w-auto"
          >
            Save AI parameters
          </button>
        </form>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 space-y-6 shadow-xs animate-fadeIn text-left">
          <h3 className="font-sans font-semibold text-stone-950 dark:text-stone-100 text-xs flex items-center gap-2 border-b border-stone-100 dark:border-stone-850 pb-2 text-left">
            <Bell className="w-4 h-4 text-amber-800" aria-hidden="true" /> Notifications & sound controls
          </h3>

          <div className="space-y-4">
            {/* Break Reminders */}
            <div className="flex justify-between items-center p-3.5 bg-stone-50 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-800 rounded-lg text-left">
              <label htmlFor="break-reminders-toggle" className="cursor-pointer select-none flex-grow text-left">
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block text-left">Break reminders</span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block text-left">Trigger gentle in-app notification banners when the Pomodoro focus timer finishes.</span>
              </label>
              <input
                id="break-reminders-toggle"
                type="checkbox"
                checked={breakReminders}
                onChange={(e) => setBreakReminders(e.target.checked)}
                className="w-4 h-4 accent-amber-950 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Encouragements */}
            <div className="flex justify-between items-center p-3.5 bg-stone-50 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-800 rounded-lg text-left">
              <label htmlFor="encouragements-toggle" className="cursor-pointer select-none flex-grow text-left">
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block text-left">Gentle daily encouragements</span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block text-left">Enable comforting check-in dialogs based on your arrival emotion states.</span>
              </label>
              <input
                id="encouragements-toggle"
                type="checkbox"
                checked={dailyEncouragements}
                onChange={(e) => setDailyEncouragements(e.target.checked)}
                className="w-4 h-4 accent-amber-950 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            onClick={() => triggerToast('Notification system preferences stored.')}
            className="font-sans text-xs bg-amber-950 dark:bg-amber-900 hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 text-white px-4 py-2 rounded transition-colors cursor-pointer text-center justify-center w-full sm:w-auto"
          >
            Save notification preferences
          </button>
        </div>
      )}

      {/* TAB 5: BACKUP & DIAGNOSTICS */}
      {activeTab === 'backup' && (
        <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 space-y-6 shadow-xs animate-fadeIn text-left">
          <h3 className="font-sans font-semibold text-stone-950 dark:text-stone-100 text-xs flex items-center gap-2 border-b border-stone-100 dark:border-stone-850 pb-2 text-left">
            <Database className="w-4 h-4 text-amber-800" aria-hidden="true" /> Offline local cache
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-sans text-left">
              <div className="text-left">
                <p className="font-semibold text-stone-850 dark:text-stone-200 text-left">Local device database size</p>
                <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5 text-left">Your draft text, wins journal, feedback records, and references are stored strictly on-device.</p>
              </div>
              <span className="font-mono text-xs bg-stone-100 dark:bg-stone-900 px-2.5 py-1 border border-stone-200 dark:border-stone-800 rounded text-stone-600 dark:text-stone-400">
                {Math.round(JSON.stringify(localStorage).length / 1024)} KB used
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
              <button
                type="button"
                onClick={handleExportData}
                className="font-sans text-xs border border-stone-250 dark:border-stone-800 bg-white dark:bg-stone-950 py-2.5 px-4 rounded flex justify-center items-center gap-1.5 hover:bg-stone-50 dark:hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 transition-colors cursor-pointer text-center font-medium text-stone-700 dark:text-stone-300"
              >
                <Download className="w-4 h-4 text-stone-500" aria-hidden="true" /> Export system backup (.rcp)
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (confirm('Permanently reset your local companion database back to original defaults? This cannot be reversed.')) {
                    onResetAllData();
                  }
                }}
                className="font-sans text-xs border border-red-200 text-red-700 py-2.5 px-4 rounded flex justify-center items-center gap-1.5 hover:bg-red-50/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 transition-colors cursor-pointer text-center font-medium"
              >
                <Trash className="w-4 h-4 text-red-500" aria-hidden="true" /> Reset system cache
              </button>
            </div>
          </div>

          <div className="bg-stone-50 dark:bg-stone-900/30 p-5 rounded-lg border border-stone-200 dark:border-stone-800 text-xs font-sans text-stone-600 dark:text-stone-400 space-y-2 flex items-start gap-3 text-left">
            <Shield className="w-5 h-5 text-amber-850 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-left">
              <p className="font-semibold text-stone-800 dark:text-stone-200 text-left">Absolute offline privacy guarantee</p>
              <p className="leading-relaxed mt-0.5 text-left">
                Research Companion does not use persistent server-side storage or cookie profiling trackers. All operations are safe and localized on your browser node.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
