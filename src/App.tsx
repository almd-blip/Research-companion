/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Paper, ResearchJourney, Collection, MoodCheckIn, AccessibilitySettings, DEFAULT_ACCESSIBILITY_SETTINGS } from './types';
import { INITIAL_PAPERS, INITIAL_JOURNEYS, INITIAL_COLLECTIONS } from './data';

// Import sub-modules
import ResearchHome from './components/ResearchHome';
import LiteratureLibrary from './components/LiteratureLibrary';
import KnowledgeGraph from './components/KnowledgeGraph';
import LiteratureIntelligence from './components/LiteratureIntelligence';
import ResearchIntelligenceLayer from './components/ResearchIntelligenceLayer';
import ResearchWorkspace from './components/ResearchWorkspace';
import WritingCompanion from './components/WritingCompanion';
import CitationEngine from './components/CitationEngine';
import ResearchWellbeing from './components/ResearchWellbeing';
import FundingWorkspace from './components/FundingWorkspace';
import CreativePublishingWorkspace from './components/CreativePublishingWorkspace';
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
  Clock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export default function App() {
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [researchSubTab, setResearchSubTab] = useState<string>('projects');
  const [referenceSubMode, setReferenceSubMode] = useState<'library' | 'verifier'>('library');

  // Sidebar parent section collapse/expand state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pause: true,
    explore: true,
    ready: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleNavigate = (tab: string, subTab?: string) => {
    setActiveTab(tab);
    if (subTab) {
      setResearchSubTab(subTab);
    }
  };

  // Accessibility parameters driven dynamically
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>(() => {
    const cached = localStorage.getItem('scholar_accessibility_settings');
    if (cached) {
      try { return JSON.parse(cached); } catch {}
    }
    return DEFAULT_ACCESSIBILITY_SETTINGS;
  });

  const handleAccessibilityChange = (newSettings: AccessibilitySettings) => {
    setAccessibilitySettings(newSettings);
    localStorage.setItem('scholar_accessibility_settings', JSON.stringify(newSettings));
    window.dispatchEvent(new Event('accessibility_settings_updated'));
  };

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

  useEffect(() => {
    const isDyslexic = Boolean(accessibilitySettings?.dyslexiaFont || fontStyle === 'dyslexic');
    if (isDyslexic) {
      document.body.classList.add('font-dyslexic');
    } else {
      document.body.classList.remove('font-dyslexic');
    }
  }, [accessibilitySettings?.dyslexiaFont, fontStyle]);

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

  const handleDeleteJourney = (id: string) => {
    setJourneys((prev) => {
      const next = prev.filter((j) => j.id !== id);
      if (activeJourneyId === id) {
        setActiveJourneyId(next[0]?.id || '');
      }
      return next;
    });
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
      className={`min-h-screen bg-[#FAF8F5] dark:bg-stone-950 text-[#1B0A3B] dark:text-stone-100 flex flex-col md:flex-row ${getFontStyleClass()} ${getFontSizeClass()} ${getHighContrastClass()}`}
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
      {/* Sidebar - Structured by 3 Parent Choices and Submenus */}
      <aside className="w-full md:w-64 bg-[#FAF8F5] dark:bg-[#1B0A3B] text-stone-800 dark:text-stone-200 border-r border-stone-200 dark:border-[#2c135a] flex flex-col justify-between p-4 shrink-0 z-10 shadow-md max-h-screen overflow-y-auto">
        <div className="space-y-5">
          {/* Logo / Header */}
          <div className="pb-1 px-1">
            <button
              type="button"
              onClick={() => setShowLanding(true)}
              className="cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#912A4A] rounded p-1 transition-opacity hover:opacity-80 text-left block"
              title="Return to Arrival Screen"
            >
              <img 
                src={theme === 'light' ? '/assets/logo_cream.png' : '/assets/logo_transparent.png'} 
                alt="Second Thought Publishing Logo" 
                className="h-10 md:h-11 w-auto object-contain max-w-[170px]"
                referrerPolicy="no-referrer"
              />
            </button>
          </div>

          {/* Structured Parent Navigation Menu */}
          <nav className="space-y-4" role="tablist" aria-label="Calm Companion Menu">
            
            {/* 1. PAUSE AND BREATHE (Parent 1) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between group">
                <button
                  type="button"
                  onClick={() => {
                    handleNavigate('wellbeing');
                    setOpenSections((prev) => ({ ...prev, pause: true }));
                  }}
                  className={`flex-grow text-left px-2.5 py-1.5 rounded-md text-xs font-sans font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === 'wellbeing' || activeTab === 'focus'
                      ? 'text-[#912A4A] bg-[#912A4A]/10 dark:text-rose-300 dark:bg-[#291452]'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 dark:text-stone-300 dark:hover:text-white dark:hover:bg-[#25114a]'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400 shrink-0" />
                  <span>Pause and Breathe</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleSection('pause')}
                  className="p-1 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 rounded cursor-pointer"
                  title="Toggle submenu"
                >
                  {openSections.pause ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              {openSections.pause && (
                <div className="pl-4 space-y-0.5 border-l border-stone-300 dark:border-[#351a67] ml-3.5">
                  <button
                    role="tab"
                    aria-selected={activeTab === 'wellbeing'}
                    onClick={() => handleNavigate('wellbeing')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-sans flex items-center transition-all cursor-pointer ${
                      activeTab === 'wellbeing'
                        ? 'bg-stone-200/80 text-stone-900 font-semibold border-l-2 border-[#912A4A] dark:bg-[#291452] dark:text-white dark:border-rose-400'
                        : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white'
                    }`}
                  >
                    Wellbeing
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'focus'}
                    onClick={() => handleNavigate('focus')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-sans flex items-center transition-all cursor-pointer ${
                      activeTab === 'focus'
                        ? 'bg-stone-200/80 text-stone-900 font-semibold border-l-2 border-[#912A4A] dark:bg-[#291452] dark:text-white dark:border-rose-400'
                        : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white'
                    }`}
                  >
                    Focus Space
                  </button>
                </div>
              )}
            </div>

            {/* 2. EXPLORE (Parent 2) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between group">
                <button
                  type="button"
                  onClick={() => {
                    handleNavigate('about');
                    setOpenSections((prev) => ({ ...prev, explore: true }));
                  }}
                  className={`flex-grow text-left px-2.5 py-1.5 rounded-md text-xs font-sans font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === 'about' || activeTab === 'accessibility'
                      ? 'text-[#912A4A] bg-[#912A4A]/10 dark:text-rose-300 dark:bg-[#291452]'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 dark:text-stone-300 dark:hover:text-white dark:hover:bg-[#25114a]'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400 shrink-0" />
                  <span>Explore</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleSection('explore')}
                  className="p-1 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 rounded cursor-pointer"
                  title="Toggle submenu"
                >
                  {openSections.explore ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              {openSections.explore && (
                <div className="pl-4 space-y-0.5 border-l border-stone-300 dark:border-[#351a67] ml-3.5">
                  <button
                    role="tab"
                    aria-selected={activeTab === 'about'}
                    onClick={() => handleNavigate('about')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-sans flex items-center transition-all cursor-pointer ${
                      activeTab === 'about'
                        ? 'bg-stone-200/80 text-stone-900 font-semibold border-l-2 border-[#912A4A] dark:bg-[#291452] dark:text-white dark:border-rose-400'
                        : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white'
                    }`}
                  >
                    About
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'accessibility'}
                    onClick={() => handleNavigate('accessibility')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-sans flex items-center transition-all cursor-pointer ${
                      activeTab === 'accessibility'
                        ? 'bg-stone-200/80 text-stone-900 font-semibold border-l-2 border-[#912A4A] dark:bg-[#291452] dark:text-white dark:border-rose-400'
                        : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white'
                    }`}
                  >
                    Accessibility
                  </button>
                </div>
              )}
            </div>

            {/* 3. I'M READY (Parent 3) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between group">
                <button
                  type="button"
                  onClick={() => {
                    handleNavigate('dashboard');
                    setOpenSections((prev) => ({ ...prev, ready: true }));
                  }}
                  className={`flex-grow text-left px-2.5 py-1.5 rounded-md text-xs font-sans font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === 'dashboard' || activeTab === 'research' || activeTab === 'ai_assistant'
                      ? 'text-[#912A4A] bg-[#912A4A]/10 dark:text-rose-300 dark:bg-[#291452]'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 dark:text-stone-300 dark:hover:text-white dark:hover:bg-[#25114a]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400 shrink-0" />
                  <span>I'm Ready</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleSection('ready')}
                  className="p-1 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 rounded cursor-pointer"
                  title="Toggle submenu"
                >
                  {openSections.ready ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              {openSections.ready && (
                <div className="pl-4 space-y-0.5 border-l border-stone-300 dark:border-[#351a67] ml-3.5">
                  
                  {/* Primary Landing View: Projects */}
                  <button
                    role="tab"
                    aria-selected={activeTab === 'dashboard'}
                    onClick={() => handleNavigate('dashboard')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-sans flex items-center transition-all cursor-pointer ${
                      activeTab === 'dashboard'
                        ? 'bg-stone-200/80 text-stone-900 font-semibold border-l-2 border-[#912A4A] dark:bg-[#291452] dark:text-white dark:border-rose-400'
                        : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white'
                    }`}
                  >
                    Projects
                  </button>

                  {/* Document Analytical, Referencing & Data Tools Submenu */}
                  <div className="pt-2.5 pb-1">
                    <span className="text-[11.5px] font-sans font-semibold text-stone-800 dark:text-stone-200 block px-2">
                      Research & Writing Tools
                    </span>
                  </div>

                  <div className="pl-1.5 space-y-0.5">
                    <button
                      role="tab"
                      aria-selected={activeTab === 'research' && researchSubTab === 'references'}
                      onClick={() => handleNavigate('research', 'references')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] font-sans flex items-center transition-all cursor-pointer ${
                        activeTab === 'research' && researchSubTab === 'references'
                          ? 'bg-stone-200/80 text-stone-900 font-semibold border-l-2 border-[#912A4A] dark:bg-[#291452] dark:text-white dark:border-rose-400'
                          : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white'
                      }`}
                    >
                      References
                    </button>

                    <button
                      role="tab"
                      aria-selected={activeTab === 'research' && researchSubTab === 'literature'}
                      onClick={() => handleNavigate('research', 'literature')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] font-sans flex items-center transition-all cursor-pointer ${
                        activeTab === 'research' && researchSubTab === 'literature'
                          ? 'bg-stone-200/80 text-stone-900 font-semibold border-l-2 border-[#912A4A] dark:bg-[#291452] dark:text-white dark:border-rose-400'
                          : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white'
                      }`}
                    >
                      Paper Summaries
                    </button>

                    <button
                      role="tab"
                      aria-selected={activeTab === 'research' && researchSubTab === 'analysis'}
                      onClick={() => handleNavigate('research', 'analysis')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] font-sans flex items-center transition-all cursor-pointer ${
                        activeTab === 'research' && researchSubTab === 'analysis'
                          ? 'bg-stone-200/80 text-stone-900 font-semibold border-l-2 border-[#912A4A] dark:bg-[#291452] dark:text-white dark:border-rose-400'
                          : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white'
                      }`}
                    >
                      Concept Map
                    </button>

                    <button
                      role="tab"
                      aria-selected={activeTab === 'research' && researchSubTab === 'writing'}
                      onClick={() => handleNavigate('research', 'writing')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] font-sans flex items-center transition-all cursor-pointer ${
                        activeTab === 'research' && researchSubTab === 'writing'
                          ? 'bg-stone-200/80 text-stone-900 font-semibold border-l-2 border-[#912A4A] dark:bg-[#291452] dark:text-white dark:border-rose-400'
                          : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white'
                      }`}
                    >
                      Writing Assistant
                    </button>

                    <button
                      role="tab"
                      aria-selected={activeTab === 'research' && researchSubTab === 'publishing'}
                      onClick={() => handleNavigate('research', 'publishing')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] font-sans flex items-center transition-all cursor-pointer ${
                        activeTab === 'research' && researchSubTab === 'publishing'
                          ? 'bg-stone-200/80 text-stone-900 font-semibold border-l-2 border-[#912A4A] dark:bg-[#291452] dark:text-white dark:border-rose-400'
                          : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white'
                      }`}
                    >
                      Publishing & Export
                    </button>

                    <button
                      role="tab"
                      aria-selected={activeTab === 'research' && researchSubTab === 'funding'}
                      onClick={() => handleNavigate('research', 'funding')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] font-sans flex items-center transition-all cursor-pointer ${
                        activeTab === 'research' && researchSubTab === 'funding'
                          ? 'bg-stone-200/80 text-stone-900 font-semibold border-l-2 border-[#912A4A] dark:bg-[#291452] dark:text-white dark:border-rose-400'
                          : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white'
                      }`}
                    >
                      Grants & Proposals
                    </button>

                    <button
                      role="tab"
                      aria-selected={activeTab === 'ai_assistant'}
                      onClick={() => handleNavigate('ai_assistant')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] font-sans flex items-center transition-all cursor-pointer ${
                        activeTab === 'ai_assistant'
                          ? 'bg-stone-200/80 text-stone-900 font-semibold border-l-2 border-[#912A4A] dark:bg-[#291452] dark:text-white dark:border-rose-400'
                          : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-[#25114a] dark:hover:text-white'
                      }`}
                    >
                      Ask AI
                    </button>
                  </div>
                </div>
              )}
            </div>

          </nav>
        </div>

        {/* Footer Utilities */}
        <div className="pt-3 border-t border-stone-200 dark:border-[#351a67] mt-3 space-y-1 text-left">
          <button
            role="tab"
            aria-selected={activeTab === 'feedback'}
            onClick={() => handleNavigate('feedback')}
            className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-sans flex items-center transition-all cursor-pointer ${
              activeTab === 'feedback'
                ? 'bg-stone-200/80 text-stone-900 font-semibold dark:bg-[#291452] dark:text-white'
                : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-[#25114a]'
            }`}
          >
            Feedback
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'settings'}
            onClick={() => handleNavigate('settings')}
            className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-sans flex items-center transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-stone-200/80 text-stone-900 font-semibold dark:bg-[#291452] dark:text-white'
                : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-[#25114a]'
            }`}
          >
            Settings
          </button>
        </div>
      </aside>

      {/* Main viewport */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto h-full">
          
          {/* RESEARCH WORKSPACE & HOME */}
          {(activeTab === 'dashboard' || activeTab === 'research') && (
            <div className="animate-fadeIn">
              <ResearchWorkspace
                journeys={journeys}
                papers={papers}
                collections={collections}
                onUpdateJourney={handleUpdateJourney}
                onAddJourney={handleAddJourney}
                onDeleteJourney={handleDeleteJourney}
                activeJourneyId={activeJourneyId}
                onSetActiveJourneyId={setActiveJourneyId}
                onUpdatePaper={handleUpdatePaper}
                onAddPaper={handleAddPaper}
                onDeletePaper={handleDeletePaper}
                initialActiveTool={
                  researchSubTab === 'references'
                    ? 'references'
                    : researchSubTab === 'literature'
                    ? 'lit_intelligence'
                    : researchSubTab === 'analysis'
                    ? 'knowledge_graph'
                    : researchSubTab === 'writing'
                    ? 'repetition_spotter'
                    : researchSubTab === 'publishing'
                    ? 'journal_requirements'
                    : researchSubTab === 'funding'
                    ? 'export_workspace'
                    : undefined
                }
              />
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
              accessibilitySettings={accessibilitySettings}
              onAccessibilitySettingsChange={handleAccessibilityChange}
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
              accessibilitySettings={accessibilitySettings}
              onAccessibilitySettingsChange={handleAccessibilityChange}
            />
          )}

        </div>
      </main>

      {/* Global Visible Feedback Trigger Button - floating in the bottom-right for instant accessibility */}
      <button
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-[#912A4A] hover:bg-[#78223d] text-white px-3 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs transition-all hover:scale-105 cursor-pointer border border-[#912A4A]/20"
        title="Share your emotional friction, bugs, or ideas"
      >
        <MessageSquare className="w-4 h-4 text-rose-200" />
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
