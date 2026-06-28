/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Download, Upload, Shield, Settings2, Trash } from 'lucide-react';

interface SettingsProps {
  onResetAllData: () => void;
}

export default function Settings({ onResetAllData }: SettingsProps) {
  const [scholarName, setScholarName] = useState(() => localStorage.getItem('wellbeing_advisor_name') || 'Scholar');
  const [affiliation, setAffiliation] = useState(() => localStorage.getItem('scholar_affiliation') || 'Imperial College London');
  const [fieldOfStudy, setFieldOfStudy] = useState(() => localStorage.getItem('scholar_field') || 'HCI & Neurosymbolic AI');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('wellbeing_advisor_name', scholarName);
    localStorage.setItem('scholar_affiliation', affiliation);
    localStorage.setItem('scholar_field', fieldOfStudy);
    alert('Scholarly identity saved to your local offline cache.');
  };

  const handleExportData = () => {
    // Collect all local state values
    const data = {
      scholarProfile: { scholarName, affiliation, fieldOfStudy },
      dailyFocus: localStorage.getItem('research_daily_focus') || '',
      smallWins: localStorage.getItem('wellbeing_small_wins') || '',
      draftText: localStorage.getItem('draft_companion_text') || '',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scholar_companion_${Date.now()}.rcp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" id="settings-module">
      
      {/* Profile configuration */}
      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-stone-950 border border-stone-200 rounded-lg p-6 space-y-4">
        <h3 className="font-sans font-semibold text-stone-950 text-sm flex items-center gap-1.5 border-b border-stone-100 pb-2">
          <Settings2 className="w-4 h-4 text-stone-500" /> Scholar Identity Profile
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-sans text-[10px] text-stone-400 tracking-wide font-semibold">Scholar name</label>
            <input
              type="text"
              value={scholarName}
              onChange={(e) => setScholarName(e.target.value)}
              className="w-full font-sans text-xs p-2.5 border border-stone-200 rounded"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-sans text-[10px] text-stone-400 tracking-wide font-semibold">Institution / Affiliation</label>
            <input
              type="text"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              className="w-full font-sans text-xs p-2.5 border border-stone-200 rounded"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-sans text-[10px] text-stone-400 tracking-wide font-semibold">Field of inquiry / specialty</label>
          <input
            type="text"
            value={fieldOfStudy}
            onChange={(e) => setFieldOfStudy(e.target.value)}
            className="w-full font-sans text-xs p-2.5 border border-stone-200 rounded"
          />
        </div>

        <button
          type="submit"
          className="font-sans text-xs bg-amber-950 text-white px-4 py-2 rounded hover:bg-amber-900 transition-colors cursor-pointer"
        >
          Update Identity Cache
        </button>
      </form>

      {/* Local storage diagnostics */}
      <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
        <h3 className="font-sans font-semibold text-stone-950 text-sm flex items-center gap-1.5 border-b border-stone-100 pb-2">
          <Database className="w-4 h-4 text-stone-500" /> Local Database Diagnostics
        </h3>

        <div className="flex justify-between items-center text-xs font-sans">
          <div>
            <p className="font-semibold text-stone-850">Offline Local Storage Engine</p>
            <p className="text-stone-400 text-[11px] mt-0.5">Your files, notes, draft sandboxes, and research progress reside strictly on device.</p>
          </div>

          <span className="font-mono text-xs bg-stone-100 px-2 py-0.5 rounded text-stone-500">
            {Math.round(JSON.stringify(localStorage).length / 1024)} KB Used
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="font-sans text-xs border border-stone-250 py-2 rounded flex justify-center items-center gap-1.5 hover:bg-stone-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" /> Export System Backup (.rcp)
          </button>
          
          <button
            onClick={() => {
              if (confirm('Permanently reset your entire local cache, papers, and wellbeing goals back to initial standards? This cannot be undone.')) {
                onResetAllData();
              }
            }}
            className="font-sans text-xs border border-red-200 text-red-700 py-2 rounded flex justify-center items-center gap-1.5 hover:bg-red-50/50 cursor-pointer"
          >
            <Trash className="w-3.5 h-3.5 text-red-500" /> Reset System Cache
          </button>
        </div>
      </div>

      {/* Safety & security panel */}
      <div className="bg-stone-50 p-5 rounded-lg border border-stone-200 text-xs font-sans text-stone-500 space-y-2 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-stone-800">Privacy First Architecture</p>
          <p className="leading-relaxed mt-0.5">
            Research Companion never shares your draft materials, research notes, or identity profiles with external telemetry layers. Gemini requests are proxy-routed securely via cloud servers without caching or training on your content.
          </p>
        </div>
      </div>

    </div>
  );
}
