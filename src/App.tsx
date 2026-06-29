/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Paper, ResearchJourney, Collection, MoodCheckIn } from './types';
import { INITIAL_PAPERS, INITIAL_JOURNEYS, INITIAL_COLLECTIONS } from './data';

// Import sub-modules
import ResearchHome from './components/ResearchHome';
import LiteratureLibrary from './components/LiteratureLibrary';
import KnowledgeGraph from './components/KnowledgeGraph';
import LiteratureIntelligence from './components/LiteratureIntelligence';
import ResearchWorkspace from './components/ResearchWorkspace';
import WritingCompanion from './components/WritingCompanion';
import CitationEngine from './components/CitationEngine';
import ResearchWellbeing from './components/ResearchWellbeing';
import FundingWorkspace from './components/FundingWorkspace';
import Settings from './components/Settings';
import About from './components/About';
import FeedbackPanel from './components/FeedbackPanel';
import AIAssistant from './components/AIAssistant';
import FeedbackView from './components/FeedbackView';
import LandingPage from './components/LandingPage';

import {
  Compass,
  BookOpen,
  Heart,
  Settings as SettingsIcon,
  MessageSquare,
  Sparkles,
  Library,
  Network,
  CheckSquare,
  FileText,
  Award,
  Eye,
  Clock
} from 'lucide-react';

export default function App() {
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [researchSubTab, setResearchSubTab] = useState<string>('references');
  const [referenceSubMode, setReferenceSubMode] = useState<'library' | 'verifier'>('library');

  // Accessibility parameters driven dynamically
  const [fontScale, setFontScale] = useState(() => localStorage.getItem('scholar_font_scale') || 'm');
  const [fontStyle, setFontStyle] = useState(() => localStorage.getItem('scholar_font_style') || 'sans');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('scholar_high_contrast') === 'true');
  const [theme, setTheme] = useState(() => localStorage.getItem('scholar_theme') || 'light');

  // Feedback Panel Overlay
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

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

  // Sync accessibility classes on load and listen to changes
  useEffect(() => {
    const handleSyncAccessibility = () => {
      setFontScale(localStorage.getItem('scholar_font_scale') || 'm');
      setFontStyle(localStorage.getItem('scholar_font_style') || 'sans');
      setHighContrast(localStorage.getItem('scholar_high_contrast') === 'true');
      setTheme(localStorage.getItem('scholar_theme') || 'light');
    };

    handleSyncAccessibility();
    window.addEventListener('accessibility_settings_updated', handleSyncAccessibility);
    return () => {
      window.removeEventListener('accessibility_settings_updated', handleSyncAccessibility);
    };
  }, []);

  useEffect(() => {
    triggerRootThemeSync(theme, highContrast);
  }, [theme, highContrast]);

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
    setResearchSubTab('references');
    setReferenceSubMode('library');
    triggerRootThemeSync('light', false);
  };

  const triggerRootThemeSync = (targetTheme: string, contrast: boolean) => {
    const root = document.getElementById('scholar-companion-root');
    if (root) {
      if (targetTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      document.documentElement.classList.remove('light-black');

      if (contrast) {
        document.documentElement.classList.add('high-contrast');
        root.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
        root.classList.remove('high-contrast');
      }
    }
  };

  const handleAddMoodCheckIn = (added: MoodCheckIn) => {
    setMoodCheckIns((prev) => [...prev, added]);
  };

  const handleSelectJourneyFromHome = (id: string) => {
    setActiveJourneyId(id);
    setResearchSubTab('projects');
  };

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

  const getFontSizeClass = () => {
    switch (fontScale) {
      case 's': return 'text-xs md:text-sm';
      case 'l': return 'text-base md:text-lg';
      case 'xl': return 'text-lg md:text-xl';
      default: return 'text-sm md:text-base';
    }
  };

  const getFontStyleClass = () => {
    if (fontStyle === 'serif') return 'font-serif';
    if (fontStyle === 'dyslexic') return 'font-dyslexic tracking-wide leading-relaxed';
    return 'font-sans';
  };

  const getHighContrastClass = () => {
    return highContrast ? 'border-stone-400 dark:border-stone-500 text-black dark:text-white' : '';
  };

  return (
    <div
      className={`min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 flex flex-col md:flex-row ${getFontStyleClass()} ${getFontSizeClass()} ${getHighContrastClass()}`}
      id="scholar-companion-root"
    >
      {showLanding && (
        <LandingPage
          onNavigate={(tab) => {
            setActiveTab(tab);
            setShowLanding(false);
          }}
        />
      )}
      {/* Sidebar - simplified according to redesign principles */}
      <aside className="w-full md:w-60 bg-stone-900 text-stone-200 border-r border-stone-850 flex flex-col justify-between p-5 shrink-0 z-10 shadow-md">
        <div className="space-y-6">
          {/* Logo / Header */}
          <div className="pb-2">
            <img 
              src={theme === 'light' ? '/assets/logo_cream.png' : '/assets/logo_transparent.png'} 
              alt="Second Thought Publishing Logo" 
              className="h-10 md:h-12 w-auto object-contain max-w-[180px]"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Core Simplified Menu */}
          <nav className="space-y-1" role="tablist" aria-label="Calm Companion Menu">
            <button
              role="tab"
              aria-selected={activeTab === 'about'}
              onClick={() => setActiveTab('about')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 ${
                activeTab === 'about' ? 'bg-stone-800 text-white font-semibold border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/40 hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" /> About
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'accessibility'}
              onClick={() => setActiveTab('accessibility')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 ${
                activeTab === 'accessibility' ? 'bg-stone-800 text-white font-semibold border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/40 hover:text-stone-200'
              }`}
            >
              <Eye className="w-4 h-4 shrink-0 text-sky-400" /> Accessibility
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 ${
                activeTab === 'dashboard' ? 'bg-stone-800 text-white font-semibold border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/40 hover:text-stone-200'
              }`}
            >
              <Compass className="w-4 h-4 shrink-0 text-amber-500" /> Home
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'research'}
              onClick={() => setActiveTab('research')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 ${
                activeTab === 'research' ? 'bg-stone-800 text-white font-semibold border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/40 hover:text-stone-200'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0 text-indigo-400" /> Research
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'wellbeing'}
              onClick={() => setActiveTab('wellbeing')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 ${
                activeTab === 'wellbeing' ? 'bg-stone-800 text-white font-semibold border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/40 hover:text-stone-200'
              }`}
            >
              <Heart className="w-4 h-4 shrink-0 text-rose-400" /> Wellbeing
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'focus'}
              onClick={() => setActiveTab('focus')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 ${
                activeTab === 'focus' ? 'bg-stone-800 text-white font-semibold border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/40 hover:text-stone-200'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0 text-emerald-400" /> Focus
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'ai_assistant'}
              onClick={() => setActiveTab('ai_assistant')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 ${
                activeTab === 'ai_assistant' ? 'bg-stone-800 text-white font-semibold border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/40 hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-amber-500" /> AI assistant
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'feedback'}
              onClick={() => setActiveTab('feedback')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 ${
                activeTab === 'feedback' ? 'bg-stone-800 text-white font-semibold border-l-2 border-amber-500' : 'text-stone-400 hover:bg-stone-800/40 hover:text-stone-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0 text-cyan-400" /> Feedback
            </button>
          </nav>
        </div>

        {/* Footer Settings */}
        <div className="pt-6 border-t border-stone-800 mt-6 text-left">
          <button
            role="tab"
            aria-selected={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-sans flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none ${
              activeTab === 'settings' ? 'bg-stone-800 text-white font-semibold' : 'text-stone-400 hover:bg-stone-800/40'
            }`}
          >
            <SettingsIcon className="w-4 h-4 shrink-0" /> Settings
          </button>
        </div>
      </aside>

      {/* Main viewport */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto h-full">
          
          {/* HOME PANEL */}
          {activeTab === 'dashboard' && (
            <ResearchHome
              papers={papers}
              journeys={journeys}
              onSelectJourney={handleSelectJourneyFromHome}
              onSetTab={setActiveTab}
              onAddMoodCheckIn={handleAddMoodCheckIn}
              moodCheckIns={moodCheckIns}
            />
          )}

          {/* RESEARCH HUB WORKSPACE */}
          {activeTab === 'research' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Horizontal Secondary Sub-navigation - extremely clean */}
              <div className="border-b border-stone-200 dark:border-stone-800 pb-1.5 flex flex-wrap gap-2 md:gap-5" role="tablist" aria-label="Research utilities">
                <button
                  role="tab"
                  aria-selected={researchSubTab === 'references'}
                  onClick={() => setResearchSubTab('references')}
                  className={`font-sans text-xs pb-2 border-b-2 font-medium transition-all cursor-pointer ${
                    researchSubTab === 'references' ? 'border-amber-950 dark:border-amber-500 text-amber-950 dark:text-amber-400 font-bold' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                  }`}
                >
                  Reference Manager
                </button>
                <button
                  role="tab"
                  aria-selected={researchSubTab === 'literature'}
                  onClick={() => setResearchSubTab('literature')}
                  className={`font-sans text-xs pb-2 border-b-2 font-medium transition-all cursor-pointer ${
                    researchSubTab === 'literature' ? 'border-amber-950 dark:border-amber-500 text-amber-950 dark:text-amber-400 font-bold' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                  }`}
                >
                  Literature Insights
                </button>
                <button
                  role="tab"
                  aria-selected={researchSubTab === 'analysis'}
                  onClick={() => setResearchSubTab('analysis')}
                  className={`font-sans text-xs pb-2 border-b-2 font-medium transition-all cursor-pointer ${
                    researchSubTab === 'analysis' ? 'border-amber-950 dark:border-amber-500 text-amber-950 dark:text-amber-400 font-bold' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                  }`}
                >
                  Analysis (Knowledge Graph)
                </button>
                <button
                  role="tab"
                  aria-selected={researchSubTab === 'projects'}
                  onClick={() => setResearchSubTab('projects')}
                  className={`font-sans text-xs pb-2 border-b-2 font-medium transition-all cursor-pointer ${
                    researchSubTab === 'projects' ? 'border-amber-950 dark:border-amber-500 text-amber-950 dark:text-amber-400 font-bold' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                  }`}
                >
                  Research Projects
                </button>
                <button
                  role="tab"
                  aria-selected={researchSubTab === 'writing'}
                  onClick={() => setResearchSubTab('writing')}
                  className={`font-sans text-xs pb-2 border-b-2 font-medium transition-all cursor-pointer ${
                    researchSubTab === 'writing' ? 'border-amber-950 dark:border-amber-500 text-amber-950 dark:text-amber-400 font-bold' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                  }`}
                >
                  Writing Companion
                </button>
                <button
                  role="tab"
                  aria-selected={researchSubTab === 'funding'}
                  onClick={() => setResearchSubTab('funding')}
                  className={`font-sans text-xs pb-2 border-b-2 font-medium transition-all cursor-pointer ${
                    researchSubTab === 'funding' ? 'border-amber-950 dark:border-amber-500 text-amber-950 dark:text-amber-400 font-bold' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                  }`}
                >
                  Funding Bid Workspace
                </button>
              </div>

              {/* Sub-tab view rendering */}
              <div className="mt-4">
                {researchSubTab === 'references' && (
                  <div className="space-y-4">
                    {/* Inner references switcher */}
                    <div className="flex gap-2 border-b border-stone-100 dark:border-stone-900 pb-2">
                      <button
                        onClick={() => setReferenceSubMode('library')}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          referenceSubMode === 'library'
                            ? 'bg-amber-950 text-white dark:bg-stone-800 font-medium'
                            : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                        }`}
                      >
                        References Library
                      </button>
                      <button
                        onClick={() => setReferenceSubMode('verifier')}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          referenceSubMode === 'verifier'
                            ? 'bg-amber-950 text-white dark:bg-stone-800 font-medium'
                            : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                        }`}
                      >
                        References Verifier
                      </button>
                    </div>

                    <div className="animate-fadeIn">
                      {referenceSubMode === 'library' ? (
                        <LiteratureLibrary
                          papers={papers}
                          collections={collections}
                          onUpdatePaper={handleUpdatePaper}
                          onAddPaper={handleAddPaper}
                          onDeletePaper={handleDeletePaper}
                        />
                      ) : (
                        <CitationEngine
                          papers={papers}
                          onVerifyMetadata={handleVerifyMetadataBridge}
                        />
                      )}
                    </div>
                  </div>
                )}

                {researchSubTab === 'literature' && (
                  <LiteratureIntelligence
                    papers={papers}
                    onUpdatePaper={handleUpdatePaper}
                  />
                )}

                {researchSubTab === 'analysis' && (
                  <KnowledgeGraph
                    papers={papers}
                    journeys={journeys}
                  />
                )}

                {researchSubTab === 'projects' && (
                  <ResearchWorkspace
                    journeys={journeys}
                    papers={papers}
                    onUpdateJourney={handleUpdateJourney}
                    onAddJourney={handleAddJourney}
                    activeJourneyId={activeJourneyId}
                    onSetActiveJourneyId={setActiveJourneyId}
                  />
                )}

                {researchSubTab === 'writing' && (
                  <WritingCompanion
                    papers={papers}
                  />
                )}

                {researchSubTab === 'funding' && (
                  <FundingWorkspace
                    journeys={journeys}
                    papers={papers}
                    onUpdateJourney={handleUpdateJourney}
                  />
                )}
              </div>

            </div>
          )}

          {/* WELLBEING PANEL */}
          {activeTab === 'wellbeing' && (
            <ResearchWellbeing mode="wellbeing" />
          )}

          {/* FOCUS PANEL */}
          {activeTab === 'focus' && (
            <ResearchWellbeing mode="focus" />
          )}

          {/* ABOUT COMPANION PANEL */}
          {activeTab === 'about' && (
            <About />
          )}

          {/* ACCESSIBILITY PANEL */}
          {activeTab === 'accessibility' && (
            <Settings
              onResetAllData={handleResetAllData}
              defaultTab="appearance"
            />
          )}

          {/* AI ASSISTANT PANEL */}
          {activeTab === 'ai_assistant' && (
            <AIAssistant />
          )}

          {/* FEEDBACK PANEL */}
          {activeTab === 'feedback' && (
            <FeedbackView />
          )}

          {/* SETTINGS PANEL */}
          {activeTab === 'settings' && (
            <Settings
              onResetAllData={handleResetAllData}
            />
          )}

        </div>
      </main>

      {/* Global Visible Feedback Trigger Button - floating in the bottom-right for instant accessibility */}
      <button
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-amber-950 hover:bg-amber-900 text-white px-3 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs transition-all hover:scale-105 cursor-pointer border border-amber-900/10"
        title="Share your emotional friction, bugs, or ideas"
      >
        <MessageSquare className="w-4 h-4 text-amber-400" />
        <span className="font-semibold font-sans">Feedback</span>
      </button>

      {/* Unified Feedback Panel workspace overlay */}
      <FeedbackPanel
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

    </div>
  );
}
