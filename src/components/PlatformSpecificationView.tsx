/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { SYSTEM_SPECIFICATION } from '../data';
import { BookOpen, Settings, ZoomIn, ZoomOut, Type, Compass } from 'lucide-react';

export default function PlatformSpecificationView() {
  const [useSerif, setUseSerif] = useState(true);
  const [fontSize, setFontSize] = useState<'s' | 'm' | 'l' | 'xl'>('m');
  const [activeSection, setActiveSection] = useState<string>('spec-1');

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 's': return 'text-xs';
      case 'm': return 'text-sm leading-relaxed';
      case 'l': return 'text-base leading-relaxed';
      case 'xl': return 'text-lg leading-loose';
    }
  };

  const handleScrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full" id="specification-workspace-module">
      
      {/* Dynamic index navigation outline */}
      <div className="w-full lg:w-72 bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 p-5 rounded-lg h-fit space-y-4">
        <h4 className="font-sans font-medium text-xs text-amber-800 tracking-wide flex items-center gap-1.5 border-b border-amber-900/10 pb-2">
          <Compass className="w-4 h-4 text-amber-800" /> Platform Specification index
        </h4>
        
        <div className="space-y-1 max-h-[350px] overflow-y-auto pr-1">
          {SYSTEM_SPECIFICATION.sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => handleScrollToSection(sec.id)}
              className={`w-full text-left p-2.5 rounded font-sans text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSection === sec.id
                  ? 'bg-amber-950 text-white font-medium'
                  : 'text-stone-600 hover:bg-stone-100/60'
              }`}
            >
              <span className="truncate">{sec.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main specification content document */}
      <div className="flex-1 bg-white dark:bg-stone-950 border border-stone-200 rounded-lg p-6 md:p-8 space-y-8 max-h-[600px] overflow-y-auto relative">
        
        {/* Floating Accessibility Controls Panel */}
        <div className="sticky top-0 bg-stone-50 dark:bg-stone-900 border border-stone-200 p-3 rounded-lg flex flex-wrap gap-4 items-center justify-between text-xs font-sans shadow-sm z-10 mb-4">
          <div className="flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-stone-400" />
            <span className="font-semibold text-stone-700 dark:text-stone-300">Accessibility Reading Settings:</span>
          </div>

          <div className="flex gap-3 flex-wrap items-center">
            {/* Serif vs Sans */}
            <button
              onClick={() => setUseSerif(!useSerif)}
              className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-stone-950 border rounded hover:bg-stone-50 transition-colors"
              title="Toggle Font Serif"
            >
              <Type className="w-3.5 h-3.5 text-stone-500" />
              <span>{useSerif ? 'Serif Font' : 'Sans-Serif'}</span>
            </button>

            {/* Font sizing buttons */}
            <div className="flex items-center border rounded bg-white overflow-hidden">
              <button
                onClick={() => setFontSize('s')}
                className={`px-2 py-1 border-r text-[10px] ${fontSize === 's' ? 'bg-stone-200 text-stone-800 font-bold' : 'text-stone-500'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('m')}
                className={`px-2.5 py-1 border-r text-xs ${fontSize === 'm' ? 'bg-stone-200 text-stone-800 font-bold' : 'text-stone-500'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('l')}
                className={`px-3 py-1 border-r text-sm ${fontSize === 'l' ? 'bg-stone-200 text-stone-800 font-bold' : 'text-stone-500'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('xl')}
                className={`px-3.5 py-1 text-base ${fontSize === 'xl' ? 'bg-stone-200 text-stone-800 font-bold' : 'text-stone-500'}`}
              >
                A
              </button>
            </div>
          </div>
        </div>

        {/* Article header */}
        <div className="text-center space-y-3 pb-6 border-b border-stone-150/80 max-w-2xl mx-auto">
          <span className="font-sans text-[10px] capitalize font-mono tracking-wide text-amber-800 font-semibold flex items-center gap-1 justify-center">
            <BookOpen className="w-4 h-4" /> Academic Specification Paper
          </span>
          <h1 className="font-sans font-bold tracking-tight text-xl md:text-2xl text-stone-950 leading-tight">
            {SYSTEM_SPECIFICATION.title}
          </h1>
          <p className="font-sans text-xs text-stone-500 italic font-light">{SYSTEM_SPECIFICATION.subtitle}</p>

          <div className="pt-3 flex justify-center gap-4 text-[10px] text-stone-400 font-mono">
            <span>By: {SYSTEM_SPECIFICATION.authors}</span>
            <span>·</span>
            <span>Published: {SYSTEM_SPECIFICATION.date}</span>
          </div>
        </div>

        {/* Abstract */}
        <div className="bg-stone-50/50 p-5 rounded border border-stone-100 max-w-2xl mx-auto font-sans text-xs leading-relaxed italic text-stone-600">
          <p className="font-semibold text-[10px] capitalize font-mono tracking-wide mb-1.5 text-stone-500">Abstract</p>
          "{SYSTEM_SPECIFICATION.abstract}"
        </div>

        {/* Core content text blocks */}
        <div className={`max-w-2xl mx-auto space-y-8 text-stone-700 leading-relaxed font-light ${useSerif ? 'font-serif' : 'font-sans'}`}>
          {SYSTEM_SPECIFICATION.sections.map((sec) => (
            <section
              key={sec.id}
              id={sec.id}
              className="space-y-3 scroll-mt-24"
              onMouseEnter={() => setActiveSection(sec.id)}
            >
              <h3 className="font-sans font-bold text-stone-900 border-b border-stone-100 pb-1.5 text-sm md:text-base">
                {sec.title}
              </h3>
              <p className={`whitespace-pre-line leading-relaxed ${getFontSizeClass()}`}>
                {sec.content}
              </p>
            </section>
          ))}
        </div>
      </div>

    </div>
  );
}
