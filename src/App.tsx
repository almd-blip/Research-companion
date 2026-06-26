/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Paper, ResearchJourney, Collection, MoodCheckIn } from './types';
import { INITIAL_PAPERS, INITIAL_JOURNEYS, INITIAL_COLLECTIONS } from './data';

// Import all sub-modules
import ResearchHome from './components/ResearchHome';
import LiteratureLibrary from './components/LiteratureLibrary';
import KnowledgeGraph from './components/KnowledgeGraph';
import LiteratureIntelligence from './components/LiteratureIntelligence';
import ResearchWorkspace from './components/ResearchWorkspace';
import WritingCompanion from './components/WritingCompanion';
import CitationEngine from './components/CitationEngine';
import ResearchWellbeing from './components/ResearchWellbeing';
import FundingWorkspace from './components/FundingWorkspace';
import PlatformSpecificationView from './components/PlatformSpecificationView';
import Settings from './components/Settings';

import {
  Compass,
  Library,
  Network,
  Sparkles,
  Award,
  BookOpen,
  CheckSquare,
  FileText,
  HelpCircle,
  Heart,
  Settings as SettingsIcon,
  Search,
  Plus
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Load state from local storage or defaults
  const [papers, setPapers] = useState<Paper[]>(() => {
    const cached = localStorage.getItem('scholar_papers');
    return cached ? JSON.parse(cached) : INITIAL_PAPERS;
  });

  const [journeys, setJourneys] = useState<ResearchJourney[]>(() => {
    const cached = localStorage.getItem('scholar_journeys');
    return cached ? JSON.parse(cached) : INITIAL_JOURNEYS;
  });

  const [collections] = useState<Collection[]>(INITIAL_COLLECTIONS);
  const [activeJourneyId, setActiveJourneyId] = useState<string>(() => journeys[0]?.id || '');
  const [moodCheckIns, setMoodCheckIns] = useState<MoodCheckIn[]>(() => {
    const cached = localStorage.getItem('scholar_moods');
    return cached ? JSON.parse(cached) : [];
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('scholar_papers', JSON.stringify(papers));
  }, [papers]);

  useEffect(() => {
    localStorage.setItem('scholar_journeys', JSON.stringify(journeys));
  }, [journeys]);

  useEffect(() => {
    localStorage.setItem('scholar_moods', JSON.stringify(moodCheckIns));
  }, [moodCheckIns]);

  const handleUpdatePaper = (updated: Paper) => {
    setPapers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleAddPaper = (added: Paper) => {
    setPapers((prev) => [...prev, added]);
  };

  const handleDeletePaper = (id: string) => {
    setPapers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateJourney = (updated: ResearchJourney) => {
    setJourneys((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  };

  const handleAddJourney = (added: ResearchJourney) => {
    setJourneys((prev) => [...prev, added]);
  };

  const handleResetAllData = () => {
    localStorage.clear();
    setPapers(INITIAL_PAPERS);
    setJourneys(INITIAL_JOURNEYS);
    setMoodCheckIns([]);
    setActiveJourneyId(INITIAL_JOURNEYS[0]?.id || '');
    setActiveTab('dashboard');
  };

  const handleAddMoodCheckIn = (added: MoodCheckIn) => {
    setMoodCheckIns((prev) => [...prev, added]);
  };

  // Metadata verification bridge helper for child modules
  const handleVerifyMetadataBridge = async (paper: Paper) => {
    try {
      const res = await fetch('/api/gemini/metadata-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paper.title,
          authors: paper.authors,
          doi: paper.doi,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated: Paper = {
          ...paper,
          title: data.correctedTitle || paper.title,
          authors: data.correctedAuthors || paper.authors,
          journal: data.correctedJournal || paper.journal,
          year: data.correctedYear || paper.year,
          doi: data.correctedDoi || paper.doi,
          missingFields: data.missingFields || [],
          verificationStatus: data.verificationStatus || 'verified',
        };
        handleUpdatePaper(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 flex flex-col md:flex-row font-sans" id="scholar-companion-root">
      
      {/* Dynamic, responsive Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-stone-900 text-stone-200 border-r border-stone-850 flex flex-col justify-between p-5 shrink-0">
        <div className="space-y-6">
          {/* Platform Title */}
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-500 animate-pulse" />
              <h1 className="font-sans font-bold text-sm tracking-wide text-amber-500">
                Research Companion
              </h1>
            </div>
            <p className="font-sans text-[10px] text-stone-500 mt-1 tracking-wide">Academic Sandbox Platform</p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1" role="tablist" aria-label="Primary Navigation">
            <button
              role="tab"
              aria-selected={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
                activeTab === 'dashboard' ? 'bg-stone-800 text-white font-medium border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
              }`}
            >
              <Compass className="w-4 h-4" /> Dashboard
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'library'}
              onClick={() => setActiveTab('library')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
                activeTab === 'library' ? 'bg-stone-800 text-white font-medium border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
              }`}
            >
              <Library className="w-4 h-4" /> Literature Library ({papers.length})
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'graph'}
              onClick={() => setActiveTab('graph')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
                activeTab === 'graph' ? 'bg-stone-800 text-white font-medium border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
              }`}
            >
              <Network className="w-4 h-4" /> D3 Knowledge Graph
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'intelligence'}
              onClick={() => setActiveTab('intelligence')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
                activeTab === 'intelligence' ? 'bg-stone-800 text-white font-medium border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" /> Literature Intelligence
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'workspace'}
              onClick={() => setActiveTab('workspace')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
                activeTab === 'workspace' ? 'bg-stone-800 text-white font-medium border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
              }`}
            >
              <CheckSquare className="w-4 h-4" /> Journey Workspace
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'writing'}
              onClick={() => setActiveTab('writing')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
                activeTab === 'writing' ? 'bg-stone-800 text-white font-medium border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
              }`}
            >
              <FileText className="w-4 h-4" /> Writing Companion
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'citations'}
              onClick={() => setActiveTab('citations')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
                activeTab === 'citations' ? 'bg-stone-800 text-white font-medium border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
              }`}
            >
              <FileText className="w-4 h-4" /> Citation Engine
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'wellbeing'}
              onClick={() => setActiveTab('wellbeing')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
                activeTab === 'wellbeing' ? 'bg-stone-800 text-white font-medium border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
              }`}
            >
              <Heart className="w-4 h-4" /> Focus & Wellbeing
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'funding'}
              onClick={() => setActiveTab('funding')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
                activeTab === 'funding' ? 'bg-stone-800 text-white font-medium border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-400" /> Funding Bid Workspace
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'spec'}
              onClick={() => setActiveTab('spec')}
              className={`w-full text-left px-3 py-2 rounded text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
                activeTab === 'spec' ? 'bg-stone-800 text-white font-medium border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-stone-300" /> Specification Paper
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-stone-800 mt-6 space-y-2">
          <button
            role="tab"
            aria-selected={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            className={`w-full text-left px-3 py-2 rounded text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 ${
              activeTab === 'settings' ? 'bg-stone-800 text-white font-medium' : 'text-stone-400 hover:bg-stone-800/50'
            }`}
          >
            <SettingsIcon className="w-4 h-4" /> Platform Settings
          </button>
        </div>
      </aside>

      {/* Main Work Arena Content Layout */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto h-full">
          
          {/* Render Active Component Panels */}
          {activeTab === 'dashboard' && (
            <ResearchHome
              papers={papers}
              journeys={journeys}
              onSelectJourney={setActiveJourneyId}
              onSetTab={setActiveTab}
              onAddMoodCheckIn={handleAddMoodCheckIn}
              moodCheckIns={moodCheckIns}
            />
          )}

          {activeTab === 'library' && (
            <LiteratureLibrary
              papers={papers}
              collections={collections}
              onUpdatePaper={handleUpdatePaper}
              onAddPaper={handleAddPaper}
              onDeletePaper={handleDeletePaper}
            />
          )}

          {activeTab === 'graph' && (
            <KnowledgeGraph
              papers={papers}
              journeys={journeys}
            />
          )}

          {activeTab === 'intelligence' && (
            <LiteratureIntelligence
              papers={papers}
              onUpdatePaper={handleUpdatePaper}
            />
          )}

          {activeTab === 'workspace' && (
            <ResearchWorkspace
              journeys={journeys}
              papers={papers}
              onUpdateJourney={handleUpdateJourney}
              onAddJourney={handleAddJourney}
              activeJourneyId={activeJourneyId}
              onSetActiveJourneyId={setActiveJourneyId}
            />
          )}

          {activeTab === 'writing' && (
            <WritingCompanion
              papers={papers}
            />
          )}

          {activeTab === 'citations' && (
            <CitationEngine
              papers={papers}
              onVerifyMetadata={handleVerifyMetadataBridge}
            />
          )}

          {activeTab === 'wellbeing' && (
            <ResearchWellbeing />
          )}

          {activeTab === 'funding' && (
            <FundingWorkspace
              journeys={journeys}
              papers={papers}
              onUpdateJourney={handleUpdateJourney}
            />
          )}

          {activeTab === 'spec' && (
            <PlatformSpecificationView />
          )}

          {activeTab === 'settings' && (
            <Settings
              onResetAllData={handleResetAllData}
            />
          )}

        </div>
      </main>

    </div>
  );
}
