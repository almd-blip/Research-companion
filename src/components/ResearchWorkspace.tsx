/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ResearchJourney, Paper, Chapter, Task, TimelineEvent, Collection } from '../types';
import { PrintModal } from './PrintModal';
import {
  Plus,
  Trash2,
  AlertTriangle,
  Bookmark,
  Copy,
  Check,
  X,
  BookOpen,
  FileText,
  Sparkles,
  Compass,
  Columns,
  Maximize2,
  Minimize2,
  Clock,
  Layers,
  Upload,
  ChevronDown,
  ChevronUp,
  PenTool,
  Download,
  Share2,
  Printer,
  Feather,
  Scale,
  Map,
  ArrowLeft,
  ListTree,
  BookMarked,
  CheckSquare,
  History,
  Search,
  Link,
  Unlink
} from 'lucide-react';

import LiteratureLibrary from './LiteratureLibrary';
import KnowledgeGraph from './KnowledgeGraph';
import ResearchIntelligenceLayer from './ResearchIntelligenceLayer';
import WritingCompanion from './WritingCompanion';
import CreativePublishingWorkspace from './CreativePublishingWorkspace';
import FundingWorkspace from './FundingWorkspace';
import DataIngestionModule from './DataIngestionModule';
import CitationEngine from './CitationEngine';
import ResearchTimeline from './ResearchTimeline';
import ReflectiveWins from './ReflectiveWins';
import PerspectiveCheck from './PerspectiveCheck';

interface ResearchWorkspaceProps {
  journeys: ResearchJourney[];
  papers: Paper[];
  collections?: Collection[];
  onUpdateJourney: (updated: ResearchJourney) => void;
  onAddJourney: (journey: ResearchJourney) => void;
  onDeleteJourney?: (id: string) => void;
  activeJourneyId: string;
  onSetActiveJourneyId: (id: string) => void;
  onUpdatePaper?: (updated: Paper) => void;
  onAddPaper?: (added: Paper) => void;
  onDeletePaper?: (id: string) => void;
  initialActiveTool?: string;
  navKey?: number;
}

export type CompanionToolId =
  | 'none'
  | 'references'
  | 'lit_intelligence'
  | 'writing_companion'
  | 'perspective_check'
  | 'outline'
  | 'chapter_sources'
  | 'tasks'
  | 'history'
  | 'knowledge_graph'
  | 'publishing_export'
  | 'grants_proposals'
  | 'upload_docs'
  | 'analysis';

export default function ResearchWorkspace({
  journeys,
  papers,
  collections = [],
  onUpdateJourney,
  onAddJourney,
  onDeleteJourney,
  activeJourneyId,
  onSetActiveJourneyId,
  onUpdatePaper = () => {},
  onAddPaper = () => {},
  onDeletePaper = () => {},
  initialActiveTool,
  navKey,
}: ResearchWorkspaceProps) {
  // Navigation mode: 'write' (Unified writing workspace) | 'plan' (Roadmap & timeline)
  const [navEnvironmentMode, setNavEnvironmentMode] = useState<'write' | 'plan'>('write');

  // Companion tool active in the writing area
  const [activeCompanionTool, setActiveCompanionTool] = useState<CompanionToolId>(() => {
    if (initialActiveTool) {
      if (['references', 'lit_intelligence', 'writing_companion', 'writing', 'repetition_spotter', 'perspective_check', 'knowledge_graph', 'publishing_export', 'grants_proposals', 'upload_docs', 'analysis'].includes(initialActiveTool)) {
        return (initialActiveTool === 'writing' || initialActiveTool === 'repetition_spotter') ? 'writing_companion' : (initialActiveTool as CompanionToolId);
      }
    }
    return 'none';
  });

  // Companion Layout: 'split' (side-by-side with writing canvas) | 'full' (full-width tool view)
  const [companionViewLayout, setCompanionViewLayout] = useState<'split' | 'full'>('split');

  // Selected chapter in active journey
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [isChapterDropdownOpen, setIsChapterDropdownOpen] = useState(false);

  // Distraction-free focus mode
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Print modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Reflective Strip State ("Second Thought Signature")
  const [showReflectiveStrip, setShowReflectiveStrip] = useState(true);
  const [pauseStripType, setPauseStripType] = useState<'initial' | 'stretch'>('initial');
  const [dismissedInitialStrip, setDismissedInitialStrip] = useState<boolean>(() => {
    return localStorage.getItem('scholar_dismissed_initial_pause_strip') === 'true';
  });
  const [hasShownStretchReminder, setHasShownStretchReminder] = useState<boolean>(() => {
    return localStorage.getItem('scholar_pause_stretch_reminder_shown') === 'true';
  });
  const [writingSessionSeconds, setWritingSessionSeconds] = useState<number>(0);

  // Reflection Shelf State ("Private Thinking Space")
  const [isReflectionShelfOpen, setIsReflectionShelfOpen] = useState(false);
  const [newThoughtText, setNewThoughtText] = useState('');
  const [newThoughtTag, setNewThoughtTag] = useState<'Research Insight' | 'Reflection' | 'Question' | 'Idea' | 'Later'>('Reflection');
  const [copiedReflectionId, setCopiedReflectionId] = useState<string | null>(null);

  interface ReflectionItem {
    id: string;
    text: string;
    tag: 'Research Insight' | 'Reflection' | 'Question' | 'Idea' | 'Later';
    timestamp: number;
    journeyId: string;
  }

  const [reflections, setReflections] = useState<ReflectionItem[]>(() => {
    const cached = localStorage.getItem(`scholar_reflections_${activeJourneyId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: 'ref-default-1',
        text: 'Consider expanding the discussion on methodological limitations before concluding Section 3.',
        tag: 'Research Insight',
        timestamp: Date.now() - 3600000 * 3,
        journeyId: activeJourneyId,
      },
      {
        id: 'ref-default-2',
        text: 'Should I reframe the core thesis around epistemic humility in automated systems?',
        tag: 'Question',
        timestamp: Date.now() - 3600000 * 18,
        journeyId: activeJourneyId,
      },
    ];
  });

  useEffect(() => {
    const cached = localStorage.getItem(`scholar_reflections_${activeJourneyId}`);
    if (cached) {
      try {
        setReflections(JSON.parse(cached));
      } catch (e) {}
    }
  }, [activeJourneyId]);

  // Contextual Selection Toolbar
  const [selectedText, setSelectedText] = useState('');
  const [contextResult, setContextResult] = useState<string | null>(null);
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);

  // Bottom Context Strip Drawer: 'outline' | 'sources' | 'tasks' | 'history' | null
  const [bottomContextDrawer, setBottomContextDrawer] = useState<'outline' | 'sources' | 'tasks' | 'history' | null>(null);

  // Floating Action Modals
  const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState(false);
  const [floatingActionModal, setFloatingActionModal] = useState<'note' | 'ai' | 'thought' | 'voice' | 'pause' | null>(null);
  const [quickThoughtText, setQuickThoughtText] = useState('');

  // Project Creation Modal
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pTitle, setPTitle] = useState('');
  const [pType, setPType] = useState<ResearchJourney['type']>('phd');
  const [pDesc, setPDesc] = useState('');

  // Form states for items inside project
  const [newQuestion, setNewQuestion] = useState('');
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [isLinkingChapterSources, setIsLinkingChapterSources] = useState(false);
  const [chapterSourceSearch, setChapterSourceSearch] = useState('');

  // Save status indicator
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const saveTimeoutRef = useRef<number | null>(null);

  const activeJourney = journeys.find((j) => j.id === activeJourneyId) || journeys[0];

  // Sync selected chapter on load or active journey change
  useEffect(() => {
    if (activeJourney && activeJourney.chapters.length > 0) {
      if (!selectedChapterId || !activeJourney.chapters.some(c => c.id === selectedChapterId)) {
        setSelectedChapterId(activeJourney.chapters[0].id);
      }
    }
  }, [activeJourney, selectedChapterId]);

  // Sync initialActiveTool from external routing
  useEffect(() => {
    if (initialActiveTool) {
      if (initialActiveTool === 'plan') {
        setNavEnvironmentMode('plan');
      } else {
        if (['writing', 'repetition_spotter'].includes(initialActiveTool)) {
          setActiveCompanionTool('writing_companion');
        } else {
          setActiveCompanionTool(initialActiveTool as CompanionToolId);
        }
        setNavEnvironmentMode('write');
      }
    }
  }, [initialActiveTool, navKey]);

  // Writing session timer for adaptive gentle reminders
  useEffect(() => {
    const timer = setInterval(() => {
      setWritingSessionSeconds((prev) => {
        const nextSec = prev + 1;
        if (nextSec >= 2700 && !hasShownStretchReminder) {
          setShowReflectiveStrip(true);
          setPauseStripType('stretch');
        }
        return nextSec;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [hasShownStretchReminder]);

  // Escape key handler to close modals/drawers/focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFocusMode) setIsFocusMode(false);
        if (isReflectionShelfOpen) setIsReflectionShelfOpen(false);
        if (bottomContextDrawer) setBottomContextDrawer(null);
        if (isAddingProject) setIsAddingProject(false);
        if (isPrintModalOpen) setIsPrintModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, isReflectionShelfOpen, bottomContextDrawer, isAddingProject, isPrintModalOpen]);

  const activeChapter = activeJourney?.chapters.find((ch) => ch.id === selectedChapterId) || activeJourney?.chapters[0];

  // Derive sources directly linked to the active chapter or section in the writing area
  const chapterPaperIds: string[] = (activeChapter && activeChapter.linkedPaperIds)
    ? activeChapter.linkedPaperIds
    : (activeJourney?.linkedPaperIds || []);
  const chapterLinkedPapers = papers.filter((p) => chapterPaperIds.includes(p.id));

  // Check if a paper is cited in the active chapter draft text
  const isPaperCitedInChapterDraft = (paper: Paper) => {
    if (!activeContent) return false;
    const firstAuthor = paper.authors.split(',')[0].trim().toLowerCase();
    const yearStr = paper.year.toString();
    const contentLower = activeContent.toLowerCase();
    return contentLower.includes(firstAuthor) || contentLower.includes(yearStr);
  };

  // Compute Word, Character & Read stats
  const activeContent = activeChapter?.content || '';
  const wordCount = activeContent.trim() ? activeContent.trim().split(/\s+/).length : 0;
  const characterCount = activeContent.length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  // --- Handlers ---

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle.trim()) return;

    const newProject: ResearchJourney = {
      id: 'proj-' + Math.random().toString(36).substr(2, 9),
      title: pTitle.trim(),
      type: pType,
      description: pDesc.trim() || 'A calm, dedicated writing and reflective project.',
      questions: ['What is the core idea or story to explore?'],
      chapters: [
        { id: 'ch-' + Math.random().toString(36).substr(2, 9), title: 'Chapter 1: Opening Reflections', status: 'drafting', content: '' },
        { id: 'ch-' + Math.random().toString(36).substr(2, 9), title: 'Chapter 2: Development & Inquiry', status: 'not_started', content: '' },
        { id: 'ch-' + Math.random().toString(36).substr(2, 9), title: 'Chapter 3: Synthesis & Perspective', status: 'not_started', content: '' },
      ],
      tasks: [
        { id: 't1', text: 'Refine central premise and main themes', completed: false },
        { id: 't2', text: 'Gather reference notes and initial outlines', completed: false }
      ],
      timeline: [
        { id: 'tl1', date: new Date().toISOString().split('T')[0], title: 'Project Initiated', description: 'Created new writing workspace.', type: 'milestone' }
      ],
      linkedPaperIds: papers.slice(0, 3).map(p => p.id),
    };

    onAddJourney(newProject);
    onSetActiveJourneyId(newProject.id);
    setIsAddingProject(false);
    setPTitle('');
    setPDesc('');
  };

  const handleUpdateChapterContent = (content: string) => {
    if (!activeJourney || !activeChapter) return;
    const updatedChs = activeJourney.chapters.map((ch) =>
      ch.id === activeChapter.id ? { ...ch, content } : ch
    );
    onUpdateJourney({
      ...activeJourney,
      chapters: updatedChs,
    });

    setSaveStatus('saved');
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      setSaveStatus('idle');
    }, 2200);
  };

  // Helper for inserting citations or text takeaways directly into the active chapter manuscript
  const handleInsertIntoDraft = (textToInsert: string) => {
    if (!activeJourney || !activeChapter) return;
    const current = activeChapter.content || '';
    const needsSpace = current.length > 0 && !current.endsWith(' ') && !current.endsWith('\n') && !textToInsert.startsWith(' ') && !textToInsert.startsWith('\n');
    const updated = `${current}${needsSpace ? ' ' : ''}${textToInsert}`;
    handleUpdateChapterContent(updated);
  };

  // Toggle linking a paper directly to the active chapter
  const handleTogglePaperLinkToChapter = (paperId: string) => {
    if (!activeJourney || !activeChapter) return;
    const currentChapterPaperIds = activeChapter.linkedPaperIds || activeJourney.linkedPaperIds || [];
    const isLinked = currentChapterPaperIds.includes(paperId);
    const newChapterPaperIds = isLinked
      ? currentChapterPaperIds.filter((id) => id !== paperId)
      : [...currentChapterPaperIds, paperId];

    const updatedChs = activeJourney.chapters.map((ch) =>
      ch.id === activeChapter.id ? { ...ch, linkedPaperIds: newChapterPaperIds } : ch
    );

    // Also ensure project includes the paper
    const updatedJourneyPaperIds = activeJourney.linkedPaperIds.includes(paperId)
      ? activeJourney.linkedPaperIds
      : [...activeJourney.linkedPaperIds, paperId];

    onUpdateJourney({
      ...activeJourney,
      chapters: updatedChs,
      linkedPaperIds: updatedJourneyPaperIds,
    });
  };

  // Helper for inserting paper citation directly into the active chapter manuscript & auto-linking
  const handleInsertPaperCitation = (paper: Paper) => {
    const citation = `(${paper.authors.split(',')[0]} et al., ${paper.year})`;
    handleInsertIntoDraft(citation);
    if (activeChapter) {
      const currentChapterPaperIds = activeChapter.linkedPaperIds || activeJourney?.linkedPaperIds || [];
      if (!currentChapterPaperIds.includes(paper.id)) {
        const updatedChs = activeJourney!.chapters.map((ch) =>
          ch.id === activeChapter.id ? { ...ch, linkedPaperIds: [...currentChapterPaperIds, paper.id] } : ch
        );
        onUpdateJourney({
          ...activeJourney!,
          chapters: updatedChs,
        });
      }
    }
  };

  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJourney || !newChapterTitle.trim()) return;

    const addedCh: Chapter = {
      id: 'ch-' + Math.random().toString(36).substr(2, 9),
      title: newChapterTitle.trim(),
      status: 'not_started',
      content: '',
    };

    onUpdateJourney({
      ...activeJourney,
      chapters: [...activeJourney.chapters, addedCh],
    });
    setSelectedChapterId(addedCh.id);
    setNewChapterTitle('');
    setIsChapterDropdownOpen(false);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJourney || !newQuestion.trim()) return;

    onUpdateJourney({
      ...activeJourney,
      questions: [...activeJourney.questions, newQuestion.trim()],
    });
    setNewQuestion('');
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJourney || !newTaskText.trim()) return;

    const newTask: Task = {
      id: 't-' + Math.random().toString(36).substr(2, 9),
      text: newTaskText.trim(),
      completed: false,
    };

    onUpdateJourney({
      ...activeJourney,
      tasks: [...activeJourney.tasks, newTask],
    });
    setNewTaskText('');
  };

  const handleToggleTask = (taskId: string) => {
    if (!activeJourney) return;
    const updatedTasks = activeJourney.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onUpdateJourney({
      ...activeJourney,
      tasks: updatedTasks,
    });
  };

  const handleAddReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThoughtText.trim()) return;
    const newItem: ReflectionItem = {
      id: `ref-${Date.now()}`,
      text: newThoughtText.trim(),
      tag: newThoughtTag,
      timestamp: Date.now(),
      journeyId: activeJourneyId,
    };
    const updated = [newItem, ...reflections];
    setReflections(updated);
    localStorage.setItem(`scholar_reflections_${activeJourneyId}`, JSON.stringify(updated));
    setNewThoughtText('');
  };

  const handleDeleteReflection = (id: string) => {
    const updated = reflections.filter((r) => r.id !== id);
    setReflections(updated);
    localStorage.setItem(`scholar_reflections_${activeJourneyId}`, JSON.stringify(updated));
  };

  const handleCopyReflection = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReflectionId(id);
    setTimeout(() => setCopiedReflectionId(null), 2000);
  };

  // Focus mode view
  if (isFocusMode) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF8F5] dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col h-screen overflow-hidden animate-fadeIn" id="focus-mode-interface">
        {/* Fixed Non-Scrolling Top Header - Always visible without scrolling */}
        <header className="shrink-0 z-50 bg-[#FAF8F5]/98 dark:bg-stone-950/98 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-850 px-4 sm:px-8 py-3.5 shadow-2xs">
          <div className="max-w-4xl w-full mx-auto flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setIsFocusMode(false)}
              className="font-sans text-xs px-4 py-2 rounded-lg bg-[#912A4A] text-white hover:bg-[#78223d] transition-all flex items-center gap-2 cursor-pointer font-semibold shadow-xs shrink-0"
              id="exit-focus-mode-btn"
              title="Exit Focus Mode (Esc)"
            >
              <span>Exit Focus</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3 truncate">
              <span className="font-serif font-bold text-sm sm:text-base text-stone-800 dark:text-stone-200 truncate">
                {activeJourney.title}
              </span>
              <span className="text-stone-300 dark:text-stone-700 hidden sm:inline">•</span>
              <span className="font-sans text-xs text-[#912A4A] dark:text-rose-400 font-medium truncate hidden sm:inline">
                {activeChapter?.title}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 font-mono shrink-0">
              <span>Words: {wordCount} · Characters: {characterCount}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Text Area Container */}
        <main className="flex-grow overflow-y-auto px-4 sm:px-8 py-6 md:py-10">
          <div className="max-w-4xl w-full mx-auto min-h-full flex flex-col">
            <textarea
              value={activeChapter?.content || ''}
              onChange={(e) => handleUpdateChapterContent(e.target.value)}
              placeholder="Begin writing your manuscript etc..."
              autoFocus
              className="w-full flex-grow min-h-[65vh] font-sans text-base md:text-lg text-stone-900 dark:text-stone-100 bg-transparent resize-none focus:outline-none leading-[1.85] tracking-[0.012em] placeholder:text-stone-400 dark:placeholder:text-stone-600 py-2"
            />
          </div>
        </main>

        {/* Fixed Non-Scrolling Bottom Status Bar */}
        <footer className="shrink-0 bg-[#FAF8F5]/98 dark:bg-stone-950/98 border-t border-stone-200/60 dark:border-stone-850 px-4 sm:px-8 py-2.5">
          <div className="max-w-4xl w-full mx-auto flex justify-between items-center text-xs text-stone-500 font-mono">
            <span>Words: {wordCount} · Characters: {characterCount}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-sans font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Draft safe · Offline first
            </span>
          </div>
        </footer>
      </div>
    );
  }

  // Raw text for print view
  const rawNotesText = [
    `SECOND THOUGHT — PROJECT NOTES`,
    `Title: ${activeJourney?.title || 'Project Notes'}`,
    activeJourney?.description ? `Description: ${activeJourney.description}` : '',
    `Section: ${activeChapter?.title || 'Draft Notes'}`,
    `----------------------------------------`,
    activeChapter?.content || 'No content drafted in this note yet.',
  ].filter(Boolean).join('\n\n');

  // Render Companion Tool Component
  const renderCompanionToolComponent = () => {
    switch (activeCompanionTool) {
      case 'references':
        return (
          <LiteratureLibrary
            papers={papers}
            collections={collections}
            onUpdatePaper={onUpdatePaper}
            onAddPaper={onAddPaper}
            onDeletePaper={onDeletePaper}
            onInsertCitation={(citation) => handleInsertIntoDraft(citation)}
          />
        );

      case 'lit_intelligence':
        return (
          <div className="space-y-4">
            <div className="pb-2 border-b border-stone-200/60 dark:border-stone-800 flex justify-between items-center">
              <div>
                <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                  Paper Summaries & Literature Synthesis
                </h3>
                <p className="text-xs text-stone-500">
                  Cross-paper findings, empirical themes, and key takeaways connected to your library.
                </p>
              </div>
            </div>
            <ResearchIntelligenceLayer
              papers={papers}
              onUpdatePaper={onUpdatePaper}
              onAddPaper={onAddPaper}
              onInsertIntoDraft={(text) => handleInsertIntoDraft(text)}
            />
          </div>
        );

      case 'writing_companion':
        return (
          <WritingCompanion
            papers={papers}
            draftContent={activeChapter?.content || ''}
            onUpdateDraftContent={handleUpdateChapterContent}
            activeChapterTitle={activeChapter?.title}
            journeyTitle={activeJourney?.title}
            onInsertCitation={(citation) => handleInsertIntoDraft(citation)}
          />
        );

      case 'perspective_check':
        return (
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl p-5 shadow-xs">
            <PerspectiveCheck
              papers={papers}
              activeJourney={activeJourney}
              onInsertIntoDraft={(text) => handleInsertIntoDraft(text)}
            />
          </div>
        );

      case 'outline':
        return (
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl p-5 shadow-xs space-y-4 text-xs font-sans">
            <div className="flex justify-between items-center border-b border-stone-150 dark:border-stone-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  Project Outline
                </h3>
                <p className="text-xs text-stone-500">
                  Chapter structure for <strong className="text-stone-700 dark:text-stone-300 font-medium">{activeJourney.title}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {activeJourney.chapters.map((ch, idx) => (
                <div
                  key={ch.id}
                  onClick={() => setSelectedChapterId(ch.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    ch.id === activeChapter?.id
                      ? 'bg-[#912A4A]/5 dark:bg-rose-950/20 border-[#912A4A]/40 dark:border-rose-800 text-stone-900 dark:text-stone-100 shadow-2xs'
                      : 'bg-stone-50/70 dark:bg-stone-950/60 border-stone-200/70 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-850'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#912A4A] dark:text-rose-400">
                      {idx + 1}.
                    </span>
                    <div>
                      <span className="font-semibold block">{ch.title}</span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {ch.content ? ch.content.trim().split(/\s+/).filter(Boolean).length : 0} words
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                      {ch.status ? ch.status.replace('_', ' ') : 'drafting'}
                    </span>
                    {ch.id === activeChapter?.id && (
                      <span className="text-[10px] font-bold text-[#912A4A] dark:text-rose-400">Active</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Chapter */}
            <form onSubmit={handleAddChapter} className="pt-2 border-t border-stone-150 dark:border-stone-800 flex gap-2">
              <input
                type="text"
                placeholder="New chapter or section title..."
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                className="flex-grow font-sans text-xs p-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#912A4A]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-[#912A4A] hover:bg-[#78223d] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                Add Chapter
              </button>
            </form>
          </div>
        );

      case 'chapter_sources':
        const unlinkedLibraryPapers = papers.filter((p) =>
          !chapterPaperIds.includes(p.id) &&
          (chapterSourceSearch.trim() === '' ||
            p.title.toLowerCase().includes(chapterSourceSearch.toLowerCase()) ||
            p.authors.toLowerCase().includes(chapterSourceSearch.toLowerCase()) ||
            p.tags.some(t => t.toLowerCase().includes(chapterSourceSearch.toLowerCase())))
        );

        return (
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl p-5 shadow-xs space-y-4 text-xs font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-150 dark:border-stone-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                    Chapter Sources
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-400 font-mono text-[10px] font-semibold">
                    {chapterLinkedPapers.length}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Sources directly linked to <strong className="text-stone-800 dark:text-stone-200 font-medium">{activeChapter?.title || 'Current Section'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLinkingChapterSources(!isLinkingChapterSources)}
                  className="px-2.5 py-1.5 bg-[#912A4A] hover:bg-[#78223d] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
                  id="link-more-sources-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isLinkingChapterSources ? 'Done Linking' : 'Link Literature'}</span>
                </button>
              </div>
            </div>

            {/* Quick search/picker to link literature directly to this chapter */}
            {isLinkingChapterSources && (
              <div className="p-3.5 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200/70 dark:border-stone-800 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-800 dark:text-stone-200 text-xs">
                    Attach Literature from Library to this Chapter:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLinkingChapterSources(false)}
                    className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search library papers by title, author, or keyword..."
                    value={chapterSourceSearch}
                    onChange={(e) => setChapterSourceSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#912A4A]"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {unlinkedLibraryPapers.length === 0 ? (
                    <div className="text-center py-3 text-stone-400 text-xs">
                      {chapterSourceSearch ? 'No matching unlinked literature found.' : 'All library literature is currently linked to this chapter.'}
                    </div>
                  ) : (
                    unlinkedLibraryPapers.map((paper) => (
                      <div
                        key={paper.id}
                        className="p-2 bg-white dark:bg-stone-900 rounded-lg border border-stone-200/60 dark:border-stone-800 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-stone-800 dark:text-stone-200 truncate">{paper.title}</p>
                          <p className="text-[10px] text-stone-400">{paper.authors.split(',')[0]} ({paper.year})</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTogglePaperLinkToChapter(paper.id)}
                          className="px-2 py-1 bg-stone-100 hover:bg-[#912A4A] hover:text-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded text-[11px] font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Link</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* List of currently linked sources for active chapter */}
            {chapterLinkedPapers.length === 0 ? (
              <div className="p-6 text-center bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200/60 dark:border-stone-800 space-y-2">
                <BookOpen className="w-6 h-6 mx-auto text-stone-400" />
                <p className="text-stone-700 dark:text-stone-300 font-medium">No sources linked to this chapter yet.</p>
                <p className="text-[11px] text-stone-500">
                  Link relevant literature directly to <strong className="text-stone-800 dark:text-stone-200">{activeChapter?.title || 'this section'}</strong> or insert citations while drafting.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLinkingChapterSources(true)}
                    className="px-3 py-1.5 bg-[#912A4A] text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#78223d]"
                  >
                    + Link Sources to Chapter
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                {chapterLinkedPapers.map((paper) => {
                  const isCited = isPaperCitedInChapterDraft(paper);
                  return (
                    <div
                      key={paper.id}
                      className="p-3.5 bg-stone-50/80 dark:bg-stone-950/70 rounded-xl border border-stone-200/70 dark:border-stone-800 space-y-2 hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <span className="font-semibold text-stone-900 dark:text-stone-100 leading-snug block">
                            {paper.title}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                            <span>{paper.authors} ({paper.year})</span>
                            <span className="text-stone-300 dark:text-stone-700">•</span>
                            <span className="font-mono text-[10px]">{paper.journal || 'Academic publication'}</span>
                          </div>
                          {paper.tags && paper.tags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              {paper.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[9px] font-mono px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleInsertPaperCitation(paper)}
                            className="text-[11px] px-2.5 py-1 bg-white dark:bg-stone-800 hover:bg-[#912A4A] hover:text-white dark:hover:bg-rose-900 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-lg cursor-pointer transition-colors font-medium"
                            title="Insert citation into active draft"
                          >
                            Cite
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePaperLinkToChapter(paper.id)}
                            className="text-[11px] p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded cursor-pointer transition-colors"
                            title="Unlink source from this chapter"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {isCited && (
                        <div className="flex items-center gap-1 text-[10px] font-medium text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-200/50 dark:border-teal-900/30 w-fit">
                          <Check className="w-3 h-3" />
                          <span>Cited in active draft</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'tasks':
        const completedTasksCount = activeJourney.tasks.filter(t => t.completed).length;
        const totalTasksCount = activeJourney.tasks.length;
        return (
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl p-5 shadow-xs space-y-4 text-xs font-sans">
            <div className="flex justify-between items-center border-b border-stone-150 dark:border-stone-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  Chapter Tasks ({completedTasksCount}/{totalTasksCount})
                </h3>
                <p className="text-xs text-stone-500">
                  Research milestones & drafting to-dos for <strong className="text-stone-700 dark:text-stone-300 font-medium">{activeJourney.title}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
              {activeJourney.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                    task.completed
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/20 text-stone-400 border-emerald-200/60 dark:border-emerald-900/40'
                      : 'bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 border-stone-200/70 dark:border-stone-800 hover:border-[#912A4A]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => {}}
                      className="rounded text-teal-600 focus:ring-teal-500 accent-teal-600 dark:accent-teal-500 cursor-pointer"
                    />
                    <span className={task.completed ? 'line-through text-stone-400' : 'font-medium'}>
                      {task.text}
                    </span>
                  </div>
                  {task.completed && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                </div>
              ))}
            </div>

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="flex gap-2 pt-2 border-t border-stone-150 dark:border-stone-800">
              <input
                type="text"
                placeholder="Add research task or milestone..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="flex-grow font-sans text-xs p-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#912A4A]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-[#912A4A] hover:bg-[#78223d] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                Add Task
              </button>
            </form>
          </div>
        );

      case 'history':
        return (
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl p-5 shadow-xs space-y-4 text-xs font-sans">
            <div className="flex justify-between items-center border-b border-stone-150 dark:border-stone-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  Version History & Snapshots
                </h3>
                <p className="text-xs text-stone-500">
                  Auto-saved revisions for <strong className="text-stone-700 dark:text-stone-300 font-medium">{activeChapter?.title || 'Draft'}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 block">Current Live Working Draft</span>
                    <span className="text-[11px] text-stone-500">{wordCount} words · Auto-saved to local browser storage</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase px-2 py-0.5 rounded bg-emerald-100/60 dark:bg-emerald-900/60">
                  Active
                </span>
              </div>

              <div className="p-3 bg-stone-50/70 dark:bg-stone-950/60 rounded-xl border border-stone-200/60 dark:border-stone-800 flex justify-between items-center text-stone-600 dark:text-stone-400">
                <div>
                  <span className="font-medium text-stone-800 dark:text-stone-200 block">Session Checkpoint</span>
                  <span className="text-[11px] text-stone-400">Draft integrity preserved · Offline first</span>
                </div>
                <span className="font-mono text-[10px] text-stone-400">Synced</span>
              </div>
            </div>
          </div>
        );

      case 'knowledge_graph':
        return (
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl p-4 shadow-xs">
            <KnowledgeGraph papers={papers} journeys={journeys} />
          </div>
        );

      case 'publishing_export':
        return (
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl p-4 shadow-xs">
            <CreativePublishingWorkspace
              papers={papers}
              onAddPaper={onAddPaper}
              onUpdatePaper={onUpdatePaper}
            />
          </div>
        );

      case 'grants_proposals':
        return (
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl p-4 shadow-xs">
            <FundingWorkspace
              journeys={journeys}
              papers={papers}
              onUpdateJourney={onUpdateJourney}
            />
          </div>
        );

      case 'upload_docs':
        return (
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl p-5 shadow-xs">
            <DataIngestionModule
              existingPapers={papers}
              collections={collections}
              onIngestPapers={(newPapers) => {
                newPapers.forEach((paper) => {
                  onAddPaper(paper);
                  if (activeJourney) {
                    onUpdateJourney({
                      ...activeJourney,
                      linkedPaperIds: [...activeJourney.linkedPaperIds, paper.id],
                    });
                  }
                });
              }}
            />
          </div>
        );

      case 'analysis':
        return (
          <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl space-y-4 text-xs font-sans shadow-xs">
            <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
              Socratic Analysis & Research Gaps
            </h4>
            <p className="text-stone-600 dark:text-stone-300">
              Analyzing active draft: <strong>{activeChapter?.title}</strong>
            </p>
            <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-lg space-y-2 border border-stone-200/60 dark:border-stone-800">
              <p className="font-semibold text-[#912A4A] dark:text-rose-400">Critical Prompts:</p>
              <ul className="list-disc pl-4 space-y-1.5 text-stone-700 dark:text-stone-300">
                <li>What underlying assumptions govern your definition of institutional legitimacy?</li>
                <li>How does your proposed methodology account for longitudinal policy shifts?</li>
                <li>Gap identified: Empirical case studies from underrepresented groups are currently sparse in your reference library.</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 font-sans text-stone-850 dark:text-stone-100 w-full" id="second-thought-writing-studio">
      {/* Print Preview Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title={activeJourney?.title || 'Project Notes'}
        subtitle={activeJourney?.description}
        rawTextToCopy={rawNotesText}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b border-stone-200 pb-2">
              <h2 className="text-lg font-serif font-bold text-stone-800">
                {activeChapter?.title || 'Draft Notes'}
              </h2>
              <span className="text-xs font-mono text-stone-500 uppercase">
                Status: {activeChapter?.status ? activeChapter.status.replace('_', ' ') : 'Drafting'}
              </span>
            </div>
            <div className="whitespace-pre-wrap font-sans text-sm text-stone-900 leading-relaxed pt-2">
              {activeChapter?.content || 'No content drafted in this note yet.'}
            </div>
          </div>
        </div>
      </PrintModal>

      {/* ----------------------------------------------------------------- */}
      {/* TOP CONTROLS & PROJECT SELECTOR BAR                              */}
      {/* Layout Order: Quiet Drafting Desk -> Draft Editor                */}
      {/* Project Header: Round rectangle box with Title, '+' and Bin symbol */}
      {/* Chapter Selection Menu without 'writing workspace'                */}
      {/* ----------------------------------------------------------------- */}
      <div className="pb-4 border-b border-stone-200/80 dark:border-stone-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Quiet Drafting Desk & Draft Editor Layout Header + Rounded Rectangle Project Box */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Main Title Order: Quiet Drafting Desk -> Draft Editor */}
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif font-bold text-lg md:text-xl text-stone-900 dark:text-stone-100">
              Quiet Drafting Desk
            </h2>
            <span className="font-sans text-[11px] px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold border border-stone-200 dark:border-stone-700 shadow-2xs">
              Draft Editor
            </span>
          </div>

          {/* Project Title (seamless without rectangular box) + Delete button */}
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <select
                value={activeJourney.id}
                onChange={(e) => {
                  onSetActiveJourneyId(e.target.value);
                  const found = journeys.find(j => j.id === e.target.value);
                  if (found && found.chapters[0]) {
                    setSelectedChapterId(found.chapters[0].id);
                  }
                }}
                className="font-serif font-semibold text-xs md:text-sm text-stone-800 dark:text-stone-200 bg-transparent focus:outline-none cursor-pointer pr-3 py-1 hover:text-[#912A4A] dark:hover:text-rose-300 transition-colors"
                title="Switch Active Project"
              >
                {journeys.map((j) => (
                  <option key={j.id} value={j.id} className="font-sans text-xs text-stone-900 bg-white dark:bg-stone-900">
                    {j.title}
                  </option>
                ))}
              </select>
            </div>

            {onDeleteJourney && (
              <button
                type="button"
                onClick={() => setConfirmDeleteId(activeJourney.id)}
                className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                title="Delete Current Project"
                aria-label="Delete Current Project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="max-w-md w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-6 rounded-xl space-y-4 shadow-xl text-left">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  Delete Writing Project?
                </h3>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
                Are you sure you want to delete <strong className="text-stone-800 dark:text-stone-200">"{journeys.find(j => j.id === confirmDeleteId)?.title}"</strong>?
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-150 dark:border-stone-850">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="font-sans text-xs px-3 py-2 border border-stone-200 dark:border-stone-800 rounded text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteJourney && confirmDeleteId) {
                      onDeleteJourney(confirmDeleteId);
                    }
                    setConfirmDeleteId(null);
                  }}
                  className="font-sans text-xs bg-rose-600 text-white hover:bg-rose-700 px-4 py-2 rounded transition-colors cursor-pointer font-medium"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right: Chapter Selector and Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Chapter Selector */}
          <div className="relative group">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-stone-200/60 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 hover:bg-stone-50 dark:hover:bg-stone-850 transition-colors shadow-2xs">
              <button
                type="button"
                onClick={() => setIsChapterDropdownOpen(!isChapterDropdownOpen)}
                className="font-serif font-semibold text-stone-900 dark:text-stone-100 hover:text-[#912A4A] dark:hover:text-rose-300 flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <span>{activeChapter?.title || 'Chapter 1: Opening Reflections'}</span>
                {isChapterDropdownOpen ? (
                  <ChevronUp className="w-3 h-3 text-[#912A4A] dark:text-rose-300" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                )}
              </button>

              <span className="font-sans text-[10px] text-stone-400 border-l border-stone-200 dark:border-stone-700 pl-1.5 uppercase font-medium">
                {activeChapter?.status ? activeChapter.status.replace('_', ' ') : 'drafting'}
              </span>

              <button
                type="button"
                onClick={() => setIsChapterDropdownOpen(true)}
                className="p-0.5 text-stone-400 hover:text-[#912A4A] dark:hover:text-rose-300 cursor-pointer text-[10px] font-sans flex items-center gap-0.5"
                title="Add Chapter"
              >
                <span>+ Add</span>
              </button>
            </div>

            {/* Chapter Dropdown Menu */}
            {isChapterDropdownOpen && (
              <div className="absolute top-full right-0 sm:left-0 mt-1 w-64 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl p-2.5 z-40 space-y-2 animate-fadeIn text-xs">
                <div className="font-mono text-[10px] text-stone-400 uppercase tracking-wider px-2 py-1 flex justify-between items-center">
                  <span>Chapters</span>
                  <span className="text-[10px] text-stone-400 font-sans not-italic">Select or add</span>
                </div>

                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  {activeJourney.chapters.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setSelectedChapterId(ch.id);
                        setIsChapterDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between cursor-pointer transition-colors ${
                        ch.id === activeChapter?.id
                          ? 'bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-300 font-semibold'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <span className="truncate">{ch.title}</span>
                      {ch.id === activeChapter?.id && <Check className="w-3 h-3 text-[#912A4A]" />}
                    </button>
                  ))}
                </div>

                {/* Add Chapter Form */}
                <form onSubmit={handleAddChapter} className="pt-2 border-t border-stone-100 dark:border-stone-800 flex gap-1.5">
                  <input
                    type="text"
                    placeholder="New chapter title..."
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    className="flex-grow font-sans text-xs p-1.5 border border-stone-200 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                  />
                  <button type="submit" className="px-2.5 py-1.5 bg-[#912A4A] text-white rounded text-xs cursor-pointer hover:bg-[#78223d] flex items-center gap-1 font-medium">
                    Add
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Quick Header Actions: Print Notes & Focus Mode */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs no-print"
              id="desk-print-notes-btn"
              title="Print Notes & Manuscript"
            >
              <Printer className="w-3.5 h-3.5 text-stone-500" />
              <span>Print Notes</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFocusMode(true)}
              className="px-3 py-1.5 rounded-lg bg-[#912A4A] hover:bg-[#78223d] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              id="desk-focus-mode-btn"
              title="Enter Distraction-Free Focus Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Focus Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* UNIFIED WRITING WORKSPACE: QUIET DRAFTING DESK                    */}
      {/* Contains the ONE and only writing canvas + Side Margin Tools Tabs   */}
      {/* ----------------------------------------------------------------- */}
      {navEnvironmentMode === 'write' && (
        <div className="space-y-4" id="quiet-drafting-desk">

          {/* SECOND THOUGHT SIGNATURE FEATURE: Adaptive Reflective Pause Strip */}
          {showReflectiveStrip && (
            <div className="p-4 bg-[#FAF8F5] dark:bg-stone-900/60 rounded-xl border-l-3 border-[#912A4A] text-stone-800 dark:text-stone-200 flex items-center justify-between shadow-xs animate-fadeIn transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-2.5">
                <span className="font-sans not-italic uppercase tracking-widest text-xs font-bold text-[#912A4A] dark:text-rose-400 shrink-0">
                  Pause:
                </span>
                <span className="font-serif text-base sm:text-lg italic font-medium leading-tight text-stone-900 dark:text-stone-100">
                  What will you discover today?
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReflectiveStrip(false);
                  if (pauseStripType === 'initial') {
                    setDismissedInitialStrip(true);
                    localStorage.setItem('scholar_dismissed_initial_pause_strip', 'true');
                  } else if (pauseStripType === 'stretch') {
                    setHasShownStretchReminder(true);
                    localStorage.setItem('scholar_pause_stretch_reminder_shown', 'true');
                  }
                }}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-sans not-italic cursor-pointer px-2 py-1 rounded hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors shrink-0 flex items-center gap-1"
                aria-label="Dismiss Pause Reminder"
              >
                <X className="w-3.5 h-3.5" />
                <span>Dismiss</span>
              </button>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* MAIN WRITING CANVAS & COMPANION WORKSPACE (RESPONSIVE GRID)      */}
          {/* --------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* WRITING CANVAS COLUMN (Visible in Split View or when Companion is None) */}
            {!(activeCompanionTool !== 'none' && companionViewLayout === 'full') && (
              <div
                className={`${
                  activeCompanionTool === 'none'
                    ? 'lg:col-span-12'
                    : 'lg:col-span-6 xl:col-span-6'
                } space-y-4 transition-all duration-200`}
              >
                <div className="relative p-4 sm:p-6 md:p-8 bg-white dark:bg-stone-900/80 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs min-h-[56vh]">
                  
                  {/* Subtle Top Auto-Saved Indicator */}
                  {saveStatus === 'saved' && (
                    <div className="flex justify-end pb-2 mb-1">
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 opacity-80">
                        <Check className="w-3 h-3" /> Auto-saved
                      </div>
                    </div>
                  )}

                  {/* SIDE MARGIN TABS (Shelf Tab Model with bookmark and text label, aligned at margin) */}
                  <div className="absolute -right-3.5 top-12 z-20 flex flex-col gap-2 pointer-events-auto select-none">
                    
                    {/* Tab 1: Reflection Shelf */}
                    <button
                      type="button"
                      onClick={() => setIsReflectionShelfOpen(!isReflectionShelfOpen)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-r-lg shadow-md border border-l-0 text-xs font-medium transition-all duration-150 cursor-pointer ${
                        isReflectionShelfOpen
                          ? 'bg-[#912A4A] text-white border-rose-900 font-semibold translate-x-0.5'
                          : 'bg-white dark:bg-stone-850 hover:bg-[#FAF8F5] dark:hover:bg-stone-800 text-[#912A4A] dark:text-rose-300 border-stone-200 dark:border-stone-700 hover:translate-x-0.5'
                      }`}
                      title="Open Reflection Shelf"
                      aria-label="Open Reflection Shelf"
                      id="margin-tab-reflection-shelf"
                    >
                      <Bookmark className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-sans text-[11px] whitespace-nowrap font-medium">Reflection Shelf</span>
                    </button>

                    {/* Tab 2: Check References */}
                    <button
                      type="button"
                      onClick={() => {
                        if (activeCompanionTool === 'references') {
                          setActiveCompanionTool('none');
                        } else {
                          setActiveCompanionTool('references');
                          setCompanionViewLayout('split');
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-r-lg shadow-md border border-l-0 text-xs font-medium transition-all duration-150 cursor-pointer ${
                        activeCompanionTool === 'references'
                          ? 'bg-[#912A4A] text-white border-rose-900 font-semibold translate-x-0.5'
                          : 'bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:translate-x-0.5'
                      }`}
                      title="Browse and insert citations from your library"
                      aria-label="References Library"
                      id="margin-tab-references"
                    >
                      <BookOpen className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span className="font-sans text-[11px] whitespace-nowrap font-medium">
                        References ({papers.length})
                      </span>
                    </button>

                    {/* Tab 3: Paper Summaries */}
                    <button
                      type="button"
                      onClick={() => {
                        if (activeCompanionTool === 'lit_intelligence') {
                          setActiveCompanionTool('none');
                        } else {
                          setActiveCompanionTool('lit_intelligence');
                          setCompanionViewLayout('split');
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-r-lg shadow-md border border-l-0 text-xs font-medium transition-all duration-150 cursor-pointer ${
                        activeCompanionTool === 'lit_intelligence'
                          ? 'bg-[#912A4A] text-white border-rose-900 font-semibold translate-x-0.5'
                          : 'bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:translate-x-0.5'
                      }`}
                      title="Literature synthesis & key paper takeaways"
                      aria-label="Paper Summaries"
                      id="margin-tab-paper-summaries"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                      <span className="font-sans text-[11px] whitespace-nowrap font-medium">Paper Summaries</span>
                    </button>

                    {/* Tab 4: Writing Assistant (Feather icon) */}
                    <button
                      type="button"
                      onClick={() => {
                        if (activeCompanionTool === 'writing_companion') {
                          setActiveCompanionTool('none');
                        } else {
                          setActiveCompanionTool('writing_companion');
                          setCompanionViewLayout('split');
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-r-lg shadow-md border border-l-0 text-xs font-medium transition-all duration-150 cursor-pointer ${
                        activeCompanionTool === 'writing_companion'
                          ? 'bg-[#912A4A] text-white border-rose-900 font-semibold translate-x-0.5'
                          : 'bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:translate-x-0.5'
                      }`}
                      title="Live draft feedback, claims grounding & suggestions"
                      aria-label="Writing Assistant"
                      id="margin-tab-writing-assistant"
                    >
                      <Feather className="w-3.5 h-3.5 shrink-0 text-[#912A4A] dark:text-rose-400" />
                      <span className="font-sans text-[11px] whitespace-nowrap font-medium">Writing Assistant</span>
                    </button>

                    {/* Tab 5: Perspective Check (Scale icon) */}
                    <button
                      type="button"
                      onClick={() => {
                        if (activeCompanionTool === 'perspective_check') {
                          setActiveCompanionTool('none');
                        } else {
                          setActiveCompanionTool('perspective_check');
                          setCompanionViewLayout('split');
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-r-lg shadow-md border border-l-0 text-xs font-medium transition-all duration-150 cursor-pointer ${
                        activeCompanionTool === 'perspective_check'
                          ? 'bg-[#912A4A] text-white border-rose-900 font-semibold translate-x-0.5'
                          : 'bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:translate-x-0.5'
                      }`}
                      title="Reflect on epistemic perspectives & missing voices"
                      aria-label="Perspective Check"
                      id="margin-tab-perspective-check"
                    >
                      <Scale className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-sans text-[11px] whitespace-nowrap font-medium">Perspective Check</span>
                    </button>

                    {/* Tab 6: Outline */}
                    <button
                      type="button"
                      onClick={() => {
                        if (activeCompanionTool === 'outline') {
                          setActiveCompanionTool('none');
                        } else {
                          setActiveCompanionTool('outline');
                          setCompanionViewLayout('split');
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-r-lg shadow-md border border-l-0 text-xs font-medium transition-all duration-150 cursor-pointer ${
                        activeCompanionTool === 'outline'
                          ? 'bg-[#912A4A] text-white border-rose-900 font-semibold translate-x-0.5'
                          : 'bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:translate-x-0.5'
                      }`}
                      title="View and organize chapter outline"
                      aria-label="Outline"
                      id="margin-tab-outline"
                    >
                      <ListTree className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-sans text-[11px] whitespace-nowrap font-medium">Outline</span>
                    </button>

                    {/* Tab 7: Chapter sources */}
                    <button
                      type="button"
                      onClick={() => {
                        if (activeCompanionTool === 'chapter_sources') {
                          setActiveCompanionTool('none');
                        } else {
                          setActiveCompanionTool('chapter_sources');
                          setCompanionViewLayout('split');
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-r-lg shadow-md border border-l-0 text-xs font-medium transition-all duration-150 cursor-pointer ${
                        activeCompanionTool === 'chapter_sources'
                          ? 'bg-[#912A4A] text-white border-rose-900 font-semibold translate-x-0.5'
                          : 'bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:translate-x-0.5'
                      }`}
                      title="Chapter-specific sources and references"
                      aria-label="Chapter sources"
                      id="margin-tab-chapter-sources"
                    >
                      <BookMarked className="w-3.5 h-3.5 shrink-0 text-amber-700 dark:text-amber-300" />
                      <span className="font-sans text-[11px] whitespace-nowrap font-medium">
                        Chapter sources ({chapterLinkedPapers.length})
                      </span>
                    </button>

                    {/* Tab 8: Tasks */}
                    <button
                      type="button"
                      onClick={() => {
                        if (activeCompanionTool === 'tasks') {
                          setActiveCompanionTool('none');
                        } else {
                          setActiveCompanionTool('tasks');
                          setCompanionViewLayout('split');
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-r-lg shadow-md border border-l-0 text-xs font-medium transition-all duration-150 cursor-pointer ${
                        activeCompanionTool === 'tasks'
                          ? 'bg-[#912A4A] text-white border-rose-900 font-semibold translate-x-0.5'
                          : 'bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:translate-x-0.5'
                      }`}
                      title="Research milestones and tasks"
                      aria-label="Tasks"
                      id="margin-tab-tasks"
                    >
                      <CheckSquare className="w-3.5 h-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                      <span className="font-sans text-[11px] whitespace-nowrap font-medium">
                        Tasks ({activeJourney.tasks.filter(t => t.completed).length}/{activeJourney.tasks.length})
                      </span>
                    </button>

                    {/* Tab 9: History */}
                    <button
                      type="button"
                      onClick={() => {
                        if (activeCompanionTool === 'history') {
                          setActiveCompanionTool('none');
                        } else {
                          setActiveCompanionTool('history');
                          setCompanionViewLayout('split');
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-r-lg shadow-md border border-l-0 text-xs font-medium transition-all duration-150 cursor-pointer ${
                        activeCompanionTool === 'history'
                          ? 'bg-[#912A4A] text-white border-rose-900 font-semibold translate-x-0.5'
                          : 'bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:translate-x-0.5'
                      }`}
                      title="Draft history and auto-save snapshots"
                      aria-label="History"
                      id="margin-tab-history"
                    >
                      <History className="w-3.5 h-3.5 shrink-0 text-stone-500 dark:text-stone-400" />
                      <span className="font-sans text-[11px] whitespace-nowrap font-medium">History</span>
                    </button>

                  </div>

                  {/* Contextual Selection Toolbar */}
                  {selectedText && (
                    <div className="sticky top-2 z-30 mb-4 p-2 bg-[#1B0A3B]/95 dark:bg-stone-950 text-white rounded-xl shadow-xl backdrop-blur-md border border-[#912A4A]/40 flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
                      <div className="font-sans text-xs text-stone-300 px-2 truncate max-w-xs">
                        "{selectedText.length > 28 ? selectedText.slice(0, 28) + '…' : selectedText}"
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          onClick={() => {
                            setActiveCompanionTool('references');
                            setCompanionViewLayout('split');
                          }}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-sans font-medium transition-colors cursor-pointer"
                        >
                          Find Citation
                        </button>
                        <button
                          onClick={() => {
                            setActiveCompanionTool('writing_companion');
                            setCompanionViewLayout('split');
                          }}
                          className="px-2.5 py-1 bg-[#912A4A] hover:bg-[#78223d] text-white rounded text-[11px] font-sans font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          Check Evidence
                        </button>
                        <button
                          onClick={() => setSelectedText('')}
                          className="p-1 text-stone-400 hover:text-white cursor-pointer"
                          aria-label="Close selection bar"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* The ONE Writing Area Textarea */}
                  <textarea
                    value={activeChapter?.content || ''}
                    onChange={(e) => handleUpdateChapterContent(e.target.value)}
                    onSelect={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      const start = target.selectionStart;
                      const end = target.selectionEnd;
                      if (start !== end) {
                        setSelectedText(target.value.substring(start, end));
                      } else {
                        setSelectedText('');
                      }
                    }}
                    placeholder="Write freely. Your work is saved locally in real-time."
                    className="w-full font-sans text-base text-stone-900 dark:text-stone-100 bg-transparent resize-y min-h-[460px] focus:outline-none leading-[1.85] tracking-[0.012em] placeholder:text-stone-400/70 dark:placeholder:text-stone-600 placeholder:font-sans selection:bg-[#912A4A]/20 dark:selection:bg-rose-900/40 py-2"
                  />
                </div>

                {/* BOTTOM STATUS BAR */}
                <div className="pt-2 px-1">
                  <div className="flex items-center justify-between flex-wrap gap-3 text-xs">
                    {/* Word and Character Count */}
                    <div className="font-mono text-xs text-stone-600 dark:text-stone-400 font-medium">
                      Words: {wordCount} · Characters: {characterCount}
                    </div>

                    {/* Draft safe · Offline first */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 font-sans">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Draft safe · Offline first</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* COMPANION TOOL COLUMN (Visible in Split View or Full View) */}
            {activeCompanionTool !== 'none' && (
              <div
                className={`${
                  companionViewLayout === 'full'
                    ? 'lg:col-span-12'
                    : 'lg:col-span-6 xl:col-span-6'
                } space-y-3 transition-all duration-200 ${
                  companionViewLayout === 'split' ? 'max-h-[85vh] overflow-y-auto pr-1' : ''
                }`}
              >
                {/* Full View Return Header */}
                {companionViewLayout === 'full' && (
                  <div className="flex items-center justify-between p-3 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setCompanionViewLayout('split')}
                      className="text-[#912A4A] dark:text-rose-400 font-semibold hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>← Return to Split View with Manuscript Draft</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveCompanionTool('none')}
                      className="px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs border border-stone-200/80 dark:border-stone-700"
                      aria-label="Close Tool"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Close</span>
                    </button>
                  </div>
                )}

                {/* Split View Header Bar with Close Button */}
                {companionViewLayout === 'split' && (
                  <div className="flex items-center justify-between px-3 py-2 bg-stone-50 dark:bg-stone-900/90 rounded-xl border border-stone-200/80 dark:border-stone-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-800 dark:text-stone-200 text-xs capitalize">
                        {activeCompanionTool === 'references' && 'References Library'}
                        {activeCompanionTool === 'lit_intelligence' && 'Paper Summaries & Synthesis'}
                        {activeCompanionTool === 'writing_companion' && 'Writing Assistant'}
                        {activeCompanionTool === 'perspective_check' && 'Perspective Check'}
                        {activeCompanionTool === 'outline' && 'Project Outline'}
                        {activeCompanionTool === 'chapter_sources' && 'Chapter Sources'}
                        {activeCompanionTool === 'tasks' && 'Chapter Tasks'}
                        {activeCompanionTool === 'history' && 'Version History'}
                        {activeCompanionTool === 'knowledge_graph' && 'Knowledge Graph'}
                        {activeCompanionTool === 'publishing_export' && 'Publishing Studio'}
                        {activeCompanionTool === 'grants_proposals' && 'Grants & Proposals'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCompanionViewLayout('full')}
                        className="text-[11px] text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:underline cursor-pointer"
                        title="Expand tool to full width"
                      >
                        Full view
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCompanionTool('none')}
                        className="px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs border border-stone-200/80 dark:border-stone-700"
                        aria-label="Close Companion Tool"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Close</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Render the Active Companion Tool */}
                {renderCompanionToolComponent()}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* ROADMAP & PLAN ENVIRONMENT MODE                                   */}
      {/* ----------------------------------------------------------------- */}
      {navEnvironmentMode === 'plan' && (
        <div className="space-y-6 animate-fadeIn" id="roadmap-and-plan-view">
          <div className="pb-3 border-b border-stone-200/80 dark:border-stone-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                Project Plan & Roadmap
              </h3>
              <p className="font-sans text-xs text-stone-500">
                Structure chapters, active research questions, tasks, and milestone timelines.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNavEnvironmentMode('write')}
              className="self-start sm:self-center px-3.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-200/80 dark:border-stone-700 shadow-2xs"
              id="exit-roadmap-and-plan-btn"
              title="Return to Quiet Drafting Desk"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit Roadmap and Plan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Questions Panel - Unboxed */}
            <div className="pl-4 border-l-2 border-[#912A4A]/40 space-y-3 text-left">
              <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5 uppercase tracking-wider">
                Active Research Questions ({activeJourney.questions.length})
              </h4>
              <div className="space-y-2">
                {activeJourney.questions.map((q, idx) => (
                  <div key={idx} className="p-2.5 bg-white/60 dark:bg-stone-900/60 rounded-lg border border-stone-200/60 dark:border-stone-800 text-xs text-stone-800 dark:text-stone-200 flex gap-2">
                    <span className="font-mono text-[10px] text-[#912A4A] dark:text-rose-400 font-bold">Q{idx + 1}.</span>
                    <span className="leading-relaxed">{q}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddQuestion} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add research question..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="flex-grow font-sans text-xs p-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#912A4A]"
                />
                <button type="submit" className="px-3 py-1.5 bg-[#912A4A] hover:bg-[#78223d] text-white rounded-lg text-xs font-semibold cursor-pointer">
                  Add
                </button>
              </form>
            </div>

            {/* Tasks & Deliverables - Unboxed */}
            <div className="pl-4 border-l-2 border-stone-200 dark:border-stone-800 space-y-3 text-left">
              <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5 uppercase tracking-wider">
                Deliverables & Tasks ({activeJourney.tasks.length})
              </h4>
              <div className="space-y-2">
                {activeJourney.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex justify-between items-center transition-colors ${
                      task.completed ? 'bg-emerald-50/10 text-stone-400 border-emerald-200/40 dark:border-emerald-900/30' : 'bg-white/60 dark:bg-stone-900/60 text-stone-800 dark:text-stone-200 border-stone-200/60 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={task.completed ? 'line-through' : ''}>{task.text}</span>
                    </div>
                    {task.completed && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddTask} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="New task..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  className="flex-grow font-sans text-xs p-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#912A4A]"
                />
                <button type="submit" className="px-3 py-1.5 bg-[#912A4A] hover:bg-[#78223d] text-white rounded-lg text-xs font-semibold cursor-pointer">
                  Log Task
                </button>
              </form>
            </div>
          </div>

          <ReflectiveWins />

          <ResearchTimeline
            journeys={journeys}
            activeJourneyId={activeJourney.id}
            onSetActiveJourneyId={onSetActiveJourneyId}
            onUpdateJourney={onUpdateJourney}
          />
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* REFLECTION SHELF ("PRIVATE THINKING SPACE") DRAWER                */}
      {/* ----------------------------------------------------------------- */}
      {isReflectionShelfOpen && (
        <>
          {/* Backdrop Overlay to close on outside click */}
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setIsReflectionShelfOpen(false)}
            aria-hidden="true"
          />

          <div
            className="fixed inset-y-0 right-0 z-50 w-80 sm:w-96 bg-white dark:bg-stone-950 border-l border-stone-200 dark:border-stone-800 p-5 shadow-2xl flex flex-col justify-between animate-fadeIn text-xs"
            id="reflection-notes-drawer"
          >
            <div className="space-y-4 flex-grow overflow-y-auto pr-1">
              <div className="flex justify-between items-center border-b border-stone-150 dark:border-stone-850 pb-2.5">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-[#912A4A] dark:text-rose-400" />
                  <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                    Private Reflection Shelf
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReflectionShelfOpen(false)}
                  className="px-2.5 py-1 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-850 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  id="close-reflection-shelf-top-btn"
                  title="Close Shelf (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>

              {/* Add Thought Form */}
              <form onSubmit={handleAddReflection} className="space-y-2">
                <textarea
                  placeholder="Capture a private reflection, question, or thought..."
                  value={newThoughtText}
                  onChange={(e) => setNewThoughtText(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 dark:border-stone-800 rounded-lg text-xs bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-[#912A4A] h-20"
                />
                <div className="flex justify-between items-center">
                  <select
                    value={newThoughtTag}
                    onChange={(e) => setNewThoughtTag(e.target.value as any)}
                    className="font-sans text-[11px] p-1 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-900"
                  >
                    <option value="Reflection">Reflection</option>
                    <option value="Research Insight">Research Insight</option>
                    <option value="Question">Question</option>
                    <option value="Idea">Idea</option>
                    <option value="Later">Later</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#912A4A] text-white rounded text-xs font-medium cursor-pointer"
                  >
                    Save Thought
                  </button>
                </div>
              </form>

              {/* List of Reflections */}
              <div className="space-y-2.5 pt-2">
                {reflections.map((r) => (
                  <div key={r.id} className="p-3 bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-lg space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-semibold text-[#912A4A] dark:text-rose-400 uppercase tracking-wider">
                        {r.tag}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyReflection(r.id, r.text)}
                          className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                          title="Copy to clipboard"
                        >
                          {copiedReflectionId === r.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => handleDeleteReflection(r.id)}
                          className="text-stone-400 hover:text-rose-600 cursor-pointer"
                          title="Delete thought"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-stone-800 dark:text-stone-200 leading-relaxed font-sans">
                      {r.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Close Button Footer */}
            <div className="pt-3 border-t border-stone-150 dark:border-stone-850 mt-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsReflectionShelfOpen(false)}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold rounded-lg transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                id="close-reflection-shelf-bottom-btn"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close Window</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Project Creation Modal */}
      {isAddingProject && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form
            onSubmit={handleCreateProject}
            className="max-w-lg w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-6 rounded-2xl space-y-4 shadow-2xl text-left"
          >
            <div className="flex justify-between items-center border-b border-stone-150 dark:border-stone-850 pb-3">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                Create New Writing Workspace
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingProject(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Project Title</label>
                <input
                  type="text"
                  placeholder="e.g. Epistemic Humility in Machine Reasoning"
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  className="w-full font-sans text-xs p-2.5 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#912A4A]"
                  required
                />
              </div>

              <div>
                <label className="block font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Format Type</label>
                <select
                  value={pType}
                  onChange={(e) => setPType(e.target.value as any)}
                  className="w-full font-sans text-xs p-2.5 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#912A4A] cursor-pointer"
                >
                  <option value="book">Book & Novel Manuscript</option>
                  <option value="journal">Essay & Journal Article</option>
                  <option value="phd">Research Project & Dissertation</option>
                  <option value="policy">Reflective Journaling & Notes</option>
                </select>
              </div>

              <div>
                <label className="block font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Premise or Abstract</label>
                <textarea
                  placeholder="Describe the central premise or vision of this writing project..."
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  className="w-full font-sans text-xs p-2.5 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 h-24 focus:outline-none focus:ring-1 focus:ring-[#912A4A]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-150 dark:border-stone-850">
              <button
                type="button"
                onClick={() => setIsAddingProject(false)}
                className="font-sans text-xs px-3 py-2 border border-stone-200 dark:border-stone-800 rounded text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="font-sans text-xs bg-[#912A4A] text-white hover:bg-[#78223d] px-4 py-2 rounded transition-colors cursor-pointer font-medium"
              >
                Create Workspace
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* FLOATING PLUS SYMBOL MENU (+) & SPEED DIAL QUICK ACTIONS          */}
      {/* ----------------------------------------------------------------- */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end no-print">
        {/* Floating Speed Dial Action Items */}
        {isFloatingMenuOpen && (
          <>
            {/* Backdrop click dismiss */}
            <div
              className="fixed inset-0 z-30 bg-black/20 dark:bg-black/40 backdrop-blur-[1px]"
              onClick={() => setIsFloatingMenuOpen(false)}
              aria-hidden="true"
            />

            <div className="relative z-40 mb-3 flex flex-col items-end gap-2 animate-fadeIn">
              {/* Option 1: New Note & Reflection */}
              <button
                type="button"
                onClick={() => {
                  setIsFloatingMenuOpen(false);
                  setIsReflectionShelfOpen(true);
                }}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold transition-all duration-150 hover:scale-105 cursor-pointer"
                id="fab-action-new-note"
              >
                <span>New Note / Reflection</span>
                <div className="w-7 h-7 rounded-full bg-[#FAF8F5] dark:bg-stone-800 flex items-center justify-center text-[#912A4A] dark:text-rose-400 border border-[#912A4A]/20">
                  <Bookmark className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Option 2: Writing Assistant */}
              <button
                type="button"
                onClick={() => {
                  setIsFloatingMenuOpen(false);
                  setActiveCompanionTool('writing_companion');
                  setCompanionViewLayout('split');
                }}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold transition-all duration-150 hover:scale-105 cursor-pointer"
                id="fab-action-writing-assistant"
              >
                <span>Writing Assistant</span>
                <div className="w-7 h-7 rounded-full bg-[#1B0A3B]/10 dark:bg-[#1B0A3B] flex items-center justify-center text-[#1B0A3B] dark:text-stone-200 border border-[#1B0A3B]/20 dark:border-[#351a67]">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Option 3: Check References */}
              <button
                type="button"
                onClick={() => {
                  setIsFloatingMenuOpen(false);
                  setActiveCompanionTool('references');
                  setCompanionViewLayout('split');
                }}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold transition-all duration-150 hover:scale-105 cursor-pointer"
                id="fab-action-references"
              >
                <span>Check References ({papers.length})</span>
                <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Option 4: Focus Mode */}
              <button
                type="button"
                onClick={() => {
                  setIsFloatingMenuOpen(false);
                  setIsFocusMode(true);
                }}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold transition-all duration-150 hover:scale-105 cursor-pointer"
                id="fab-action-focus"
              >
                <span>Focus Mode</span>
                <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-[#912A4A] dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Option 5: Print Notes */}
              <button
                type="button"
                onClick={() => {
                  setIsFloatingMenuOpen(false);
                  setIsPrintModalOpen(true);
                }}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold transition-all duration-150 hover:scale-105 cursor-pointer"
                id="fab-action-print"
              >
                <span>Print Notes</span>
                <div className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                  <Printer className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          </>
        )}

        {/* Primary Floating Plus Symbol Button (+) */}
        <button
          type="button"
          onClick={() => setIsFloatingMenuOpen(!isFloatingMenuOpen)}
          className={`relative z-40 w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-108 cursor-pointer ${
            isFloatingMenuOpen
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rotate-45 ring-4 ring-black/10'
              : 'bg-[#912A4A] hover:bg-[#78223d] text-white ring-4 ring-[#912A4A]/20'
          }`}
          title={isFloatingMenuOpen ? "Close Quick Actions Menu" : "Quick Actions (+)"}
          aria-label={isFloatingMenuOpen ? "Close Quick Actions Menu" : "Quick Actions Menu"}
          id="fab-plus-menu-btn"
        >
          <Plus className="w-6 h-6 transition-transform duration-200" />
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* DISTRACTION-FREE FULLSCREEN FOCUS MODE (ALWAYS VISIBLE EXIT BTN) */}
      {/* ----------------------------------------------------------------- */}
      {isFocusMode && (
        <div className="fixed inset-0 z-50 bg-[#FAF8F5] dark:bg-stone-950 flex flex-col justify-between p-6 sm:p-10 animate-fadeIn">
          {/* Top Bar: Always Visible Exit Focus Button */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-serif font-bold text-base md:text-lg text-stone-900 dark:text-stone-100">
                {activeJourney?.title || 'Quiet Drafting Desk'}
              </span>
              <span className="font-sans text-[11px] px-2.5 py-0.5 rounded-full bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium">
                {activeChapter?.title || 'Draft Editor'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-stone-400">
                {wordCount} words · {characterCount} chars
              </span>
              <button
                type="button"
                onClick={() => setIsFocusMode(false)}
                className="px-3.5 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-md"
                id="exit-focus-mode-fullscreen-btn"
                title="Exit Focus Mode (Esc)"
              >
                <X className="w-3.5 h-3.5" />
                <span>Exit Focus</span>
              </button>
            </div>
          </div>

          {/* Centered Large Distraction-Free Canvas */}
          <div className="flex-grow flex flex-col justify-center max-w-4xl w-full mx-auto py-6 overflow-y-auto">
            <textarea
              value={activeChapter?.content || ''}
              onChange={(e) => handleUpdateChapterContent(e.target.value)}
              placeholder="Write freely. Your work is saved locally in real-time."
              autoFocus
              className="w-full h-full min-h-[60vh] font-serif text-lg md:text-xl text-stone-900 dark:text-stone-100 bg-transparent resize-none focus:outline-none leading-relaxed tracking-wide placeholder:text-stone-400/60 selection:bg-[#912A4A]/20"
            />
          </div>

          {/* Bottom Bar: Status */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800 text-stone-400 text-xs shrink-0 font-sans">
            <span>Focus Mode Active · Press <kbd className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-800 rounded text-[10px]">Esc</kbd> to exit</span>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono">
              <Check className="w-3 h-3" /> Auto-saving locally
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
