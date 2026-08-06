/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ResearchJourney, Paper, Chapter, Task, TimelineEvent, Collection } from '../types';
import {
  HelpCircle,
  FileText,
  CheckSquare,
  Calendar,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  Check,
  Link as LinkIcon,
  Trash,
  Square,
  Sparkles,
  Upload,
  BookOpen,
  Library,
  Network,
  Layers,
  Search,
  BarChart3,
  Database,
  PieChart,
  Repeat,
  AlertCircle,
  Eye,
  CheckCircle2,
  Download,
  Quote,
  Maximize2,
  Minimize2,
  X,
  FileUp,
  Brain,
  MessageSquare,
  FileCode,
  ShieldCheck,
  Compass,
  Mic,
  RotateCcw,
  Sparkle
} from 'lucide-react';

import LiteratureLibrary from './LiteratureLibrary';
import KnowledgeGraph from './KnowledgeGraph';
import ResearchIntelligenceLayer from './ResearchIntelligenceLayer';
import WritingCompanion from './WritingCompanion';
import CreativePublishingWorkspace from './CreativePublishingWorkspace';
import DataIngestionModule from './DataIngestionModule';
import CitationEngine from './CitationEngine';
import ResearchTimeline from './ResearchTimeline';

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
}

export type StudioToolCategory = 'research' | 'analysis' | 'data' | 'writing' | 'publishing';

export interface StudioToolItem {
  id: string;
  label: string;
  category: StudioToolCategory;
  icon: React.ReactNode;
  description: string;
}

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
}: ResearchWorkspaceProps) {
  // Primary Navigation Mode in Writing Environment: 'write' | 'research' | 'plan'
  const [navEnvironmentMode, setNavEnvironmentMode] = useState<'write' | 'research' | 'plan'>('write');

  // Selected chapter
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [isChapterDropdownOpen, setIsChapterDropdownOpen] = useState(false);

  // Distraction-free focus mode
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Reflective Strip State ("Second Thought Signature")
  const [showReflectiveStrip, setShowReflectiveStrip] = useState(true);

  // Research Tools Modal/Drawer state
  const [activeResearchTool, setActiveResearchTool] = useState<string | null>(initialActiveTool || null);

  // Contextual Drawer (appears on text selection)
  const [selectedText, setSelectedText] = useState('');
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);
  const [activeContextTool, setActiveContextTool] = useState<string | null>(null);
  const [contextResult, setContextResult] = useState<string | null>(null);
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);

  // Bottom Context Strip Drawer: 'outline' | 'sources' | 'tasks' | 'history' | null
  const [bottomContextDrawer, setBottomContextDrawer] = useState<'outline' | 'sources' | 'tasks' | 'history' | null>(null);

  // Floating Menu ('○' Second Thought Circular Action Button)
  const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState(false);
  const [floatingActionModal, setFloatingActionModal] = useState<'note' | 'ai' | 'thought' | 'voice' | 'pause' | null>(null);
  const [quickThoughtText, setQuickThoughtText] = useState('');
  const [quickAiPrompt, setQuickAiPrompt] = useState('');
  const [quickAiResponse, setQuickAiResponse] = useState('');

  // Modals
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pTitle, setPTitle] = useState('');
  const [pType, setPType] = useState<ResearchJourney['type']>('phd');
  const [pDesc, setPDesc] = useState('');

  // Form states for items inside project
  const [newQuestion, setNewQuestion] = useState('');
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTimelineDate, setNewTimelineDate] = useState('');
  const [newTimelineTitle, setNewTimelineTitle] = useState('');
  const [newTimelineDesc, setNewTimelineDesc] = useState('');
  const [newTimelineType, setNewTimelineType] = useState<TimelineEvent['type']>('milestone');

  // Ingestion modal for Upload Documents
  const [showIngestionModal, setShowIngestionModal] = useState(false);

  // Save status indicator
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const saveTimeoutRef = useRef<number | null>(null);

  const activeJourney = journeys.find((j) => j.id === activeJourneyId) || journeys[0];

  // Sync selected chapter on load or active journey change
  useEffect(() => {
    if (activeJourney && activeJourney.chapters.length > 0 && !selectedChapterId) {
      setSelectedChapterId(activeJourney.chapters[0].id);
    }
  }, [activeJourney, selectedChapterId]);

  useEffect(() => {
    if (initialActiveTool) {
      setActiveResearchTool(initialActiveTool);
      setNavEnvironmentMode('research');
    }
  }, [initialActiveTool]);

  const activeChapter = activeJourney?.chapters.find((ch) => ch.id === selectedChapterId) || activeJourney?.chapters[0];

  // Project Creation
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

  // Chapter Content Update
  const handleUpdateChapterContent = (content: string) => {
    if (!activeJourney || !activeChapter) return;
    const updatedChs = activeJourney.chapters.map((ch) =>
      ch.id === activeChapter.id ? { ...ch, content } : ch
    );
    onUpdateJourney({
      ...activeJourney,
      chapters: updatedChs,
    });

    if (content.trim().length > 10 && showReflectiveStrip) {
      // Gently collapse reflective strip when typing begins
      setShowReflectiveStrip(false);
    }

    setSaveStatus('saved');
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      setSaveStatus('idle');
    }, 2200);
  };

  const handleUpdateChapterStatus = (status: Chapter['status']) => {
    if (!activeJourney || !activeChapter) return;
    const updatedChs = activeJourney.chapters.map((ch) =>
      ch.id === activeChapter.id ? { ...ch, status } : ch
    );
    onUpdateJourney({
      ...activeJourney,
      chapters: updatedChs,
    });
  };

  // Chapter Addition
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

    const addedTask: Task = {
      id: 'task-' + Math.random().toString(36).substr(2, 9),
      text: newTaskText.trim(),
      completed: false,
      dueDate: newTaskDueDate || undefined,
    };

    onUpdateJourney({
      ...activeJourney,
      tasks: [...activeJourney.tasks, addedTask],
    });

    setNewTaskText('');
    setNewTaskDueDate('');
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

  // Word count & read time helper
  const wordCount = activeChapter?.content ? activeChapter.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  // Contextual Tool Trigger for Selected Text
  const handleTriggerContextTool = (tool: string) => {
    setActiveContextTool(tool);
    setIsGeneratingContext(true);
    setIsContextDrawerOpen(true);

    setTimeout(() => {
      setIsGeneratingContext(false);
      if (tool === 'research') {
        setContextResult(`Research Synthesis on "${selectedText.slice(0, 40)}...":\n\nThis passage connects with core literature on institutional epistemology and reflective practice. Key authors emphasize creating intentional pause intervals prior to drafting structural arguments.`);
      } else if (tool === 'summarise') {
        setContextResult(`Summary:\n\n"${selectedText}"\n\nCore takeaway: Reflective inquiry requires deliberate spacing and structured thematic clarity.`);
      } else if (tool === 'compare') {
        setContextResult(`Comparative View:\n\nPrimary Claim: Focuses on qualitative reflection.\nCounter Claim: Highlights empirical dataset validation.\nSynthesis: Both perspectives are complementary across iterative revision phases.`);
      } else if (tool === 'citation') {
        setContextResult(`Recommended Citations:\n1. Mercer, E. (2024). "Space Before Response: Epistemic Design in Creative Writing". Journal of Reflective Practice, 18(2), 104-118.\n2. Aris, L. (2023). "Mindful Drafting & Narrative Structure". Oxford University Press.`);
      } else if (tool === 'outline') {
        setContextResult(`Generated Outline Segment:\n\nI. Premise Introduction\nII. Foundational Literature & Perspectives\nIII. Critical Reflection & Evidence Synthesis\nIV. Concluding Implications`);
      } else if (tool === 'ai') {
        setContextResult(`Thoughtful AI Partner:\n\nConsider expanding on how this idea impacts your reader's perspective. Would adding a concrete narrative example strengthen the emotional resonance?`);
      }
    }, 600);
  };

  // Empty state guard
  if (!activeJourney || journeys.length === 0) {
    return (
      <div className="py-16 px-6 text-center font-sans max-w-lg mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-300 flex items-center justify-center mx-auto">
          <Compass className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
            No Active Projects
          </h3>
          <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Your writing studio is ready. Create a new writing or research project to begin structuring thoughts, drafting chapters, and exploring ideas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddingProject(true)}
          className="px-4 py-2 bg-[#912A4A] text-white hover:bg-[#78223d] rounded-md text-xs font-medium cursor-pointer transition-colors inline-flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Create New Project
        </button>

        {isAddingProject && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <form onSubmit={handleCreateProject} className="max-w-xl w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-6 rounded-xl space-y-4 shadow-xl text-left">
              <div className="flex justify-between items-center border-b border-stone-150 dark:border-stone-850 pb-3">
                <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#912A4A] dark:text-rose-400" /> Create New Writing Project
                </h2>
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
                    placeholder="e.g. The Quiet Architecture of Reflection..."
                    value={pTitle}
                    onChange={(e) => setPTitle(e.target.value)}
                    className="w-full font-sans text-xs p-2.5 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#912A4A]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Project Type</label>
                  <select
                    value={pType}
                    onChange={(e) => setPType(e.target.value as ResearchJourney['type'])}
                    className="w-full font-sans text-xs p-2.5 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#912A4A] cursor-pointer"
                  >
                    <option value="book">Book & Novel Manuscript</option>
                    <option value="journal">Essay & Journal Article</option>
                    <option value="phd">Academic Research & Dissertation</option>
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
      </div>
    );
  }

  // =========================================================================
  // FOCUS MODE: ULTRA-PURE DISTRACTION-FREE WRITING
  // =========================================================================
  if (isFocusMode) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF8F5] dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col p-6 md:p-12 overflow-y-auto animate-fadeIn">
        {/* Focus Top Bar */}
        <div className="max-w-3xl w-full mx-auto flex items-center justify-between pb-6 border-b border-stone-200/60 dark:border-stone-850 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-serif font-bold text-sm md:text-base text-stone-800 dark:text-stone-200">
              {activeJourney.title}
            </span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span className="font-sans text-xs text-[#912A4A] dark:text-rose-400 font-medium">
              {activeChapter?.title}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsFocusMode(false)}
            className="font-sans text-xs px-3 py-1.5 rounded-md bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" /> Exit Focus
          </button>
        </div>

        {/* Focus Writing Canvas */}
        <div className="max-w-3xl w-full mx-auto flex-grow my-8 space-y-4">
          <textarea
            value={activeChapter?.content || ''}
            onChange={(e) => handleUpdateChapterContent(e.target.value)}
            placeholder="Begin writing..."
            autoFocus
            className="w-full h-full min-h-[60vh] font-sans text-base md:text-lg text-stone-900 dark:text-stone-100 bg-transparent resize-none focus:outline-none leading-relaxed tracking-normal placeholder:text-stone-300 dark:placeholder:text-stone-700"
          />
        </div>

        {/* Focus Footer */}
        <div className="max-w-3xl w-full mx-auto pt-4 border-t border-stone-200/60 dark:border-stone-850 flex justify-between items-center text-xs text-stone-400 font-mono shrink-0">
          <span>{wordCount} Words</span>
          <span>~{readTimeMin} min read</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN THREE-ZONE WRITING INTERFACE
  // =========================================================================
  return (
    <div className="space-y-6 font-sans text-stone-850 dark:text-stone-100 max-w-7xl mx-auto" id="second-thought-writing-studio">
      
      {/* ----------------------------------------------------------------- */}
      {/* ZONE 1: TOP NAVIGATION & CONTROLS BAR                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="pb-3 border-b border-stone-200/80 dark:border-stone-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Project Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
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
              className="font-serif font-bold text-lg md:text-xl text-stone-900 dark:text-stone-100 bg-transparent focus:outline-none cursor-pointer pr-6 py-0.5"
              title="Switch Active Project"
            >
              {journeys.map((j) => (
                <option key={j.id} value={j.id} className="font-sans text-sm text-stone-900 bg-white dark:bg-stone-900">
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsAddingProject(true)}
            className="p-1 text-stone-400 hover:text-[#912A4A] dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
            title="Create New Project"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Center / Right: Chapter Selector + Primary Environment Mode (Write | Research | Plan) + Focus Mode */}
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Chapter Controls: Chapter 1 ▼ \n Drafting (stacked) */}
          <div className="relative group">
            <div className="flex flex-col items-start px-2 py-1 rounded-lg hover:bg-stone-100/60 dark:hover:bg-stone-900/60 transition-colors">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsChapterDropdownOpen(!isChapterDropdownOpen)}
                  className="font-serif font-semibold text-stone-900 dark:text-stone-100 hover:text-[#912A4A] dark:hover:text-rose-300 flex items-center gap-1 cursor-pointer text-sm"
                >
                  <span>{activeChapter?.title || 'Chapter 1'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors" />
                </button>

                {/* Add Chapter button: revealed only on hover */}
                <button
                  type="button"
                  onClick={() => setIsChapterDropdownOpen(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-stone-400 hover:text-[#912A4A] dark:hover:text-rose-300 cursor-pointer text-[11px] flex items-center gap-0.5 ml-1"
                  title="Add Chapter"
                >
                  <Plus className="w-3 h-3" />
                  <span className="font-sans text-[10px]">Add</span>
                </button>
              </div>

              <span className="font-sans text-[11px] text-stone-500 dark:text-stone-400 capitalize">
                {activeChapter?.status ? activeChapter.status.replace('_', ' ') : 'Drafting'}
              </span>
            </div>

            {/* Chapter Dropdown Menu */}
            {isChapterDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl p-2.5 z-40 space-y-2 animate-fadeIn text-xs">
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
                      {ch.id === activeChapter?.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>

                {/* Add Chapter Form inside Dropdown */}
                <form onSubmit={handleAddChapter} className="pt-2 border-t border-stone-100 dark:border-stone-800 flex gap-1.5">
                  <input
                    type="text"
                    placeholder="New chapter title..."
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    className="flex-grow font-sans text-xs p-1.5 border border-stone-200 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                  />
                  <button type="submit" className="px-2 py-1.5 bg-[#912A4A] text-white rounded text-xs cursor-pointer hover:bg-[#78223d] flex items-center gap-1 font-medium">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Primary Environment Modes: Write | Research | Plan */}
          <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-lg border border-stone-200/60 dark:border-stone-800 text-xs font-medium">
            <button
              onClick={() => {
                setNavEnvironmentMode('write');
                setActiveResearchTool(null);
              }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                navEnvironmentMode === 'write'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Write
            </button>

            <button
              onClick={() => setNavEnvironmentMode('research')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                navEnvironmentMode === 'research'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Research
            </button>

            <button
              onClick={() => {
                setNavEnvironmentMode('plan');
                setActiveResearchTool(null);
              }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                navEnvironmentMode === 'plan'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Plan
            </button>
          </div>

          {/* Focus Mode Button */}
          <button
            type="button"
            onClick={() => setIsFocusMode(true)}
            className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Enter Distraction-Free Focus Mode"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Focus Mode</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* ZONE 2: MAIN WRITING CANVAS (WRITE MODE)                          */}
      {/* Occupies 70-80% of screen, visually dominates the interface       */}
      {/* ----------------------------------------------------------------- */}
      {navEnvironmentMode === 'write' && (
        <div className="space-y-4">
          
          {/* SECOND THOUGHT SIGNATURE FEATURE: Subtle Reflective Strip */}
          {showReflectiveStrip && (
            <div className="p-3.5 bg-[#FAF8F5] dark:bg-stone-900/60 rounded-xl border-l-2 border-[#912A4A] text-stone-700 dark:text-stone-300 flex items-center justify-between text-xs font-serif italic shadow-xs animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="font-sans not-italic uppercase tracking-widest text-[10px] font-bold text-[#912A4A] dark:text-rose-400">
                  Pause:
                </span>
                <span>What will you discover today?</span>
              </div>
              <button
                onClick={() => setShowReflectiveStrip(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-[10px] font-sans not-italic cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Main Pristine Canvas Surface */}
          <div className="relative p-6 md:p-10 bg-white dark:bg-stone-900/80 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs transition-all duration-200 min-h-[58vh]">
            
            {/* Save Status Pill */}
            {saveStatus === 'saved' && (
              <div className="absolute top-4 right-6 text-[10px] font-mono text-stone-400 tracking-wider uppercase flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> Saved
              </div>
            )}

            {/* Contextual Selection Bar (revealed when text selected) */}
            {selectedText && (
              <div className="sticky top-2 z-30 mb-4 p-2 bg-[#1B0A3B]/95 dark:bg-stone-950 text-white rounded-xl shadow-xl backdrop-blur-md border border-[#912A4A]/40 flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
                <div className="font-sans text-xs text-stone-300 px-2 truncate max-w-xs">
                  "{selectedText.length > 28 ? selectedText.slice(0, 28) + '…' : selectedText}"
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    onClick={() => handleTriggerContextTool('research')}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-sans font-medium transition-colors cursor-pointer"
                  >
                    Research
                  </button>
                  <button
                    onClick={() => handleTriggerContextTool('summarise')}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-sans font-medium transition-colors cursor-pointer"
                  >
                    Summarise
                  </button>
                  <button
                    onClick={() => handleTriggerContextTool('compare')}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-sans font-medium transition-colors cursor-pointer"
                  >
                    Compare
                  </button>
                  <button
                    onClick={() => handleTriggerContextTool('citation')}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-sans font-medium transition-colors cursor-pointer"
                  >
                    Find Citation
                  </button>
                  <button
                    onClick={() => handleTriggerContextTool('outline')}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-sans font-medium transition-colors cursor-pointer"
                  >
                    Generate Outline
                  </button>
                  <button
                    onClick={() => handleTriggerContextTool('ai')}
                    className="px-2.5 py-1 bg-[#912A4A] hover:bg-[#78223d] text-white rounded text-[11px] font-sans font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-rose-300" /> Ask AI
                  </button>
                  <button
                    onClick={() => setSelectedText('')}
                    className="p-1 text-stone-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Writing Textarea */}
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
              placeholder="Begin writing your manuscript, essay, novel, or reflective journal entry here... Highlight any text to reveal contextual tools."
              className="w-full font-sans text-base md:text-lg text-stone-900 dark:text-stone-100 bg-transparent resize-y min-h-[460px] focus:outline-none leading-relaxed tracking-normal placeholder:text-stone-400/70 placeholder:font-sans selection:bg-[#912A4A]/20 dark:selection:bg-rose-900/40"
            />
          </div>

          {/* --------------------------------------------------------------- */}
          {/* ZONE 3: CONTEXTUAL TOOLS BOTTOM STRIP                            */}
          {/* Outline | Sources | Tasks | History                            */}
          {/* --------------------------------------------------------------- */}
          <div className="pt-2 border-t border-stone-200/60 dark:border-stone-850 flex items-center justify-between flex-wrap gap-3">
            
            {/* Contextual Quick Drawer Tabs */}
            <div className="flex items-center gap-4 text-xs font-medium text-stone-600 dark:text-stone-400">
              <button
                onClick={() => setBottomContextDrawer(bottomContextDrawer === 'outline' ? null : 'outline')}
                className={`hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer ${
                  bottomContextDrawer === 'outline' ? 'text-[#912A4A] dark:text-rose-400 font-bold' : ''
                }`}
              >
                Outline
              </button>

              <button
                onClick={() => setBottomContextDrawer(bottomContextDrawer === 'sources' ? null : 'sources')}
                className={`hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer ${
                  bottomContextDrawer === 'sources' ? 'text-[#912A4A] dark:text-rose-400 font-bold' : ''
                }`}
              >
                Sources ({papers.filter(p => activeJourney.linkedPaperIds.includes(p.id)).length})
              </button>

              <button
                onClick={() => setBottomContextDrawer(bottomContextDrawer === 'tasks' ? null : 'tasks')}
                className={`hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer ${
                  bottomContextDrawer === 'tasks' ? 'text-[#912A4A] dark:text-rose-400 font-bold' : ''
                }`}
              >
                Tasks ({activeJourney.tasks.filter(t => t.completed).length}/{activeJourney.tasks.length})
              </button>

              <button
                onClick={() => setBottomContextDrawer(bottomContextDrawer === 'history' ? null : 'history')}
                className={`hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer ${
                  bottomContextDrawer === 'history' ? 'text-[#912A4A] dark:text-rose-400 font-bold' : ''
                }`}
              >
                History
              </button>
            </div>

            {/* Word Count Stats */}
            <div className="font-mono text-[11px] text-stone-400 dark:text-stone-500 flex items-center gap-3">
              <span>{wordCount} Words</span>
              <span>•</span>
              <span>~{readTimeMin} min read</span>
            </div>
          </div>

          {/* Bottom Contextual Expandable Drawer */}
          {bottomContextDrawer && (
            <div className="p-4 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl space-y-3 animate-fadeIn text-xs">
              <div className="flex justify-end items-center border-b border-stone-200/60 dark:border-stone-800 pb-2">
                <button
                  onClick={() => setBottomContextDrawer(null)}
                  className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer flex items-center gap-1 text-[11px]"
                  aria-label="Close drawer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {bottomContextDrawer === 'outline' && (
                <div className="space-y-2">
                  <p className="text-stone-600 dark:text-stone-300">Chapter hierarchy for <strong className="text-stone-900 dark:text-stone-100">{activeJourney.title}</strong>:</p>
                  <div className="space-y-1">
                    {activeJourney.chapters.map((ch, idx) => (
                      <div key={ch.id} className="p-2 bg-white dark:bg-stone-950 rounded border border-stone-200/60 dark:border-stone-800 flex justify-between items-center">
                        <span>{idx + 1}. {ch.title}</span>
                        <span className="font-mono text-[10px] text-stone-400 uppercase">{ch.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bottomContextDrawer === 'sources' && (
                <div className="space-y-2">
                  <p className="text-stone-600 dark:text-stone-300">Linked reference literature:</p>
                  <div className="space-y-1.5">
                    {papers.filter(p => activeJourney.linkedPaperIds.includes(p.id)).slice(0, 4).map((p) => (
                      <div key={p.id} className="p-2 bg-white dark:bg-stone-950 rounded border border-stone-200/60 dark:border-stone-800">
                        <span className="font-semibold text-stone-900 dark:text-stone-100 block">{p.title}</span>
                        <span className="text-stone-400 text-[10px]">{p.authors} ({p.year})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bottomContextDrawer === 'tasks' && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    {activeJourney.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(task.id)}
                        className={`p-2 rounded border cursor-pointer flex items-center justify-between transition-colors ${
                          task.completed ? 'bg-emerald-50/20 text-stone-400 border-emerald-100' : 'bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 border-stone-200/60 dark:border-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {task.completed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Square className="w-3.5 h-3.5 text-stone-400" />}
                          <span className={task.completed ? 'line-through' : ''}>{task.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddTask} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add new task..."
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      className="flex-grow font-sans text-xs p-1.5 border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-950"
                    />
                    <button type="submit" className="px-3 py-1.5 bg-[#912A4A] text-white rounded text-xs cursor-pointer">
                      Add
                    </button>
                  </form>
                </div>
              )}

              {bottomContextDrawer === 'history' && (
                <div className="space-y-1 text-stone-600 dark:text-stone-300">
                  <div className="p-2 bg-white dark:bg-stone-950 rounded border border-stone-200/60 dark:border-stone-800 flex justify-between">
                    <span>Draft auto-saved to local session</span>
                    <span className="font-mono text-[10px] text-stone-400">Just now</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-stone-950 rounded border border-stone-200/60 dark:border-stone-800 flex justify-between">
                    <span>Chapter created: {activeChapter?.title}</span>
                    <span className="font-mono text-[10px] text-stone-400">Today</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* RESEARCH ENVIRONMENT MODE                                         */}
      {/* ----------------------------------------------------------------- */}
      {navEnvironmentMode === 'research' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="flex justify-between items-center pb-2 border-b border-stone-200/80 dark:border-stone-850">
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                Research Tools
              </h3>
              <p className="font-sans text-xs text-stone-500">
                Select a research module to explore literature, analyze evidence, or manage citations.
              </p>
            </div>

            {activeResearchTool && (
              <button
                onClick={() => setActiveResearchTool(null)}
                className="font-sans text-xs px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                ← Back to Research Tools
              </button>
            )}
          </div>

          {!activeResearchTool && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveResearchTool('upload_docs')}
                className="p-5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl text-left hover:border-[#912A4A] transition-all cursor-pointer space-y-2 group"
              >
                <div className="p-2 bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-300 rounded-lg w-fit">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#912A4A] dark:group-hover:text-rose-300">
                  Upload Documents
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Add PDF papers, spreadsheets, notes, or reference files directly.
                </p>
              </button>

              <button
                onClick={() => setActiveResearchTool('references')}
                className="p-5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl text-left hover:border-[#912A4A] transition-all cursor-pointer space-y-2 group"
              >
                <div className="p-2 bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-300 rounded-lg w-fit">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#912A4A] dark:group-hover:text-rose-300">
                  References
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Browse, search, and manage your saved reference list.
                </p>
              </button>

              <button
                onClick={() => setActiveResearchTool('lit_intelligence')}
                className="p-5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl text-left hover:border-[#912A4A] transition-all cursor-pointer space-y-2 group"
              >
                <div className="p-2 bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-300 rounded-lg w-fit">
                  <Library className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#912A4A] dark:group-hover:text-rose-300">
                  Paper Summaries
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Compare key findings and themes across your reading list.
                </p>
              </button>

              <button
                onClick={() => setActiveResearchTool('knowledge_graph')}
                className="p-5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl text-left hover:border-[#912A4A] transition-all cursor-pointer space-y-2 group"
              >
                <div className="p-2 bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-300 rounded-lg w-fit">
                  <Network className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#912A4A] dark:group-hover:text-rose-300">
                  Concept Map
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Visually map how your ideas, topics, and citations connect.
                </p>
              </button>

              <button
                onClick={() => setActiveResearchTool('analysis')}
                className="p-5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl text-left hover:border-[#912A4A] transition-all cursor-pointer space-y-2 group"
              >
                <div className="p-2 bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-300 rounded-lg w-fit">
                  <Brain className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#912A4A] dark:group-hover:text-rose-300">
                  Questions & Gaps
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Explore deeper questions, counter-arguments, and missing ideas.
                </p>
              </button>

              <button
                onClick={() => setActiveResearchTool('writing_companion')}
                className="p-5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl text-left hover:border-[#912A4A] transition-all cursor-pointer space-y-2 group"
              >
                <div className="p-2 bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-300 rounded-lg w-fit">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#912A4A] dark:group-hover:text-rose-300">
                  Writing Assistant
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Get thoughtful feedback on tone, structure, and writing flow.
                </p>
              </button>
            </div>
          )}

          {/* Active Research Tool Render */}
          {activeResearchTool === 'upload_docs' && (
            <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl space-y-4">
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
          )}

          {activeResearchTool === 'references' && (
            <LiteratureLibrary
              papers={papers}
              collections={collections}
              onUpdatePaper={onUpdatePaper}
              onAddPaper={onAddPaper}
              onDeletePaper={onDeletePaper}
            />
          )}

          {activeResearchTool === 'lit_intelligence' && (
            <ResearchIntelligenceLayer
              papers={papers}
              onUpdatePaper={onUpdatePaper}
              onAddPaper={onAddPaper}
            />
          )}

          {activeResearchTool === 'knowledge_graph' && (
            <KnowledgeGraph
              papers={papers}
              journeys={journeys}
            />
          )}

          {activeResearchTool === 'analysis' && (
            <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl space-y-4 text-xs font-sans">
              <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                Socratic Analysis & Research Gap
              </h4>
              <p className="text-stone-600 dark:text-stone-300">
                Analyzing active draft: <strong>{activeChapter?.title}</strong>
              </p>
              <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-lg space-y-2 border border-stone-200/60 dark:border-stone-800">
                <p className="font-semibold text-[#912A4A] dark:text-rose-400">Critical Prompts:</p>
                <ul className="list-disc pl-4 space-y-1.5 text-stone-700 dark:text-stone-300">
                  <li>What underlying assumptions govern your definition of institutional legitimacy?</li>
                  <li>How does your proposed methodology account for longitudinal policy shifts?</li>
                  <li>Gap identified: Empirical case studies from Global South jurisdictions are currently underrepresented in your reference library.</li>
                </ul>
              </div>
            </div>
          )}

          {activeResearchTool === 'writing_companion' && (
            <WritingCompanion
              papers={papers}
            />
          )}

        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* PLAN ENVIRONMENT MODE                                             */}
      {/* ----------------------------------------------------------------- */}
      {navEnvironmentMode === 'plan' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="pb-2 border-b border-stone-200/80 dark:border-stone-850">
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
              Project Plan & Roadmap
            </h3>
            <p className="font-sans text-xs text-stone-500">
              Structure chapters, active research questions, tasks, and milestone timelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Questions Panel */}
            <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl space-y-3">
              <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#912A4A]" /> Active Research Questions
              </h4>
              <div className="space-y-2">
                {activeJourney.questions.map((q, idx) => (
                  <div key={idx} className="p-2.5 bg-stone-50 dark:bg-stone-950 rounded border border-stone-200/60 dark:border-stone-800 text-xs text-stone-800 dark:text-stone-200 flex gap-2">
                    <span className="font-mono text-[10px] text-[#912A4A] font-bold">Q{idx + 1}.</span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddQuestion} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add research question..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="flex-grow font-sans text-xs p-2 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-950"
                />
                <button type="submit" className="px-3 py-1.5 bg-[#912A4A] text-white rounded text-xs cursor-pointer">
                  Add
                </button>
              </form>
            </div>

            {/* Tasks & Deliverables */}
            <div className="p-5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl space-y-3">
              <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-600" /> Deliverables & Tasks
              </h4>
              <div className="space-y-2">
                {activeJourney.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={`p-2.5 rounded border text-xs cursor-pointer flex justify-between items-center transition-colors ${
                      task.completed ? 'bg-emerald-50/20 text-stone-400 border-emerald-100' : 'bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200 border-stone-200/60 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {task.completed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Square className="w-3.5 h-3.5 text-stone-400" />}
                      <span className={task.completed ? 'line-through' : ''}>{task.text}</span>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddTask} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="New task..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  className="flex-grow font-sans text-xs p-2 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-950"
                />
                <button type="submit" className="px-3 py-1.5 bg-[#912A4A] text-white rounded text-xs cursor-pointer">
                  Log Task
                </button>
              </form>
            </div>
          </div>

          {/* Timeline View */}
          <ResearchTimeline
            journeys={journeys}
            activeJourneyId={activeJourney.id}
            onSetActiveJourneyId={onSetActiveJourneyId}
            onUpdateJourney={onUpdateJourney}
          />
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* FLOATING ACTION MENU ('○' Second Thought Circular Button)          */}
      {/* ----------------------------------------------------------------- */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative">
          {isFloatingMenuOpen && (
            <div className="absolute bottom-14 right-0 w-48 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl p-2 space-y-1 text-xs font-sans animate-fadeIn">
              <button
                onClick={() => {
                  setFloatingActionModal('note');
                  setIsFloatingMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#912A4A]" />
                <span>+ New Note</span>
              </button>

              <button
                onClick={() => {
                  setFloatingActionModal('ai');
                  setIsFloatingMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#912A4A]" />
                <span>+ AI Assistant</span>
              </button>

              <button
                onClick={() => {
                  setFloatingActionModal('thought');
                  setIsFloatingMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Brain className="w-3.5 h-3.5 text-[#912A4A]" />
                <span>+ Capture Thought</span>
              </button>

              <button
                onClick={() => {
                  setFloatingActionModal('voice');
                  setIsFloatingMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Mic className="w-3.5 h-3.5 text-[#912A4A]" />
                <span>+ Voice</span>
              </button>

              <button
                onClick={() => {
                  setFloatingActionModal('pause');
                  setIsFloatingMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer transition-colors border-t border-stone-100 dark:border-stone-800 pt-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#912A4A]" />
                <span>+ Pause</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setIsFloatingMenuOpen(!isFloatingMenuOpen)}
            className="w-11 h-11 rounded-full bg-[#912A4A] hover:bg-[#78223d] text-white shadow-lg flex items-center justify-center font-serif text-lg font-bold cursor-pointer transition-transform hover:scale-105"
            title="Second Thought Actions"
          >
            ○
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* FLOATING ACTION MODALS (Quick Note, AI, Thought, Voice, Pause)    */}
      {/* ----------------------------------------------------------------- */}
      {floatingActionModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-md w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-6 rounded-2xl space-y-4 shadow-2xl text-left">
            <div className="flex justify-between items-center border-b border-stone-150 dark:border-stone-850 pb-2">
              <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 capitalize">
                {floatingActionModal === 'note' && '+ New Note'}
                {floatingActionModal === 'ai' && '+ AI Assistant'}
                {floatingActionModal === 'thought' && '+ Capture Thought'}
                {floatingActionModal === 'voice' && '+ Voice Dictation'}
                {floatingActionModal === 'pause' && '+ Reflective Pause'}
              </h3>
              <button
                onClick={() => setFloatingActionModal(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {floatingActionModal === 'note' && (
              <div className="space-y-3">
                <textarea
                  placeholder="Jot down a quick note or outline point..."
                  value={quickThoughtText}
                  onChange={(e) => setQuickThoughtText(e.target.value)}
                  className="w-full p-3 border border-stone-200 dark:border-stone-800 rounded-lg text-xs bg-stone-50 dark:bg-stone-900 h-28 focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (quickThoughtText.trim()) {
                      handleUpdateChapterContent((activeChapter?.content || '') + '\n\nNote: ' + quickThoughtText);
                    }
                    setQuickThoughtText('');
                    setFloatingActionModal(null);
                  }}
                  className="w-full py-2 bg-[#912A4A] text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Append Note to Draft
                </button>
              </div>
            )}

            {floatingActionModal === 'ai' && (
              <div className="space-y-3 text-xs">
                <p className="text-stone-600 dark:text-stone-300">Ask your AI Assistant for writing feedback or structural guidance:</p>
                <input
                  type="text"
                  placeholder="e.g. How can I transition smoothly into chapter 2?"
                  value={quickAiPrompt}
                  onChange={(e) => setQuickAiPrompt(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900"
                />
                <button
                  onClick={() => {
                    setQuickAiResponse("Reflective Recommendation: Use a bridging question at the end of Chapter 1 that introduces the key inquiry of Chapter 2. This maintains narrative momentum.");
                  }}
                  className="w-full py-2 bg-[#912A4A] text-white rounded-lg font-medium cursor-pointer"
                >
                  Ask Assistant
                </button>
                {quickAiResponse && (
                  <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200/60 dark:border-stone-800 text-stone-800 dark:text-stone-200">
                    {quickAiResponse}
                  </div>
                )}
              </div>
            )}

            {floatingActionModal === 'thought' && (
              <div className="space-y-3 text-xs">
                <p className="text-stone-600 dark:text-stone-300">Capture a sudden idea before it fades:</p>
                <textarea
                  placeholder="Describe your thought..."
                  value={quickThoughtText}
                  onChange={(e) => setQuickThoughtText(e.target.value)}
                  className="w-full p-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900 h-24"
                />
                <button
                  onClick={() => {
                    setQuickThoughtText('');
                    setFloatingActionModal(null);
                  }}
                  className="w-full py-2 bg-[#912A4A] text-white rounded-lg font-medium cursor-pointer"
                >
                  Save Thought
                </button>
              </div>
            )}

            {floatingActionModal === 'voice' && (
              <div className="py-6 text-center space-y-3 text-xs">
                <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-[#912A4A] flex items-center justify-center mx-auto animate-pulse">
                  <Mic className="w-6 h-6" />
                </div>
                <p className="text-stone-600 dark:text-stone-300">Speak naturally to dictate your draft or capture ideas.</p>
                <button
                  onClick={() => setFloatingActionModal(null)}
                  className="px-4 py-2 bg-[#912A4A] text-white rounded-lg font-medium cursor-pointer"
                >
                  Done Dictating
                </button>
              </div>
            )}

            {floatingActionModal === 'pause' && (
              <div className="py-8 text-center space-y-4 text-xs font-serif">
                <div className="w-14 h-14 rounded-full bg-[#912A4A]/10 text-[#912A4A] flex items-center justify-center mx-auto animate-pulse">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">Pause & Reflect</h4>
                  <p className="text-stone-500 italic max-w-xs mx-auto">
                    "Take a slow breath. Step back from the screen for a moment before continuing."
                  </p>
                </div>
                <button
                  onClick={() => setFloatingActionModal(null)}
                  className="px-5 py-2 bg-[#912A4A] text-white rounded-lg font-sans text-xs cursor-pointer"
                >
                  Resume Writing
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* CONTEXTUAL SLIDE-OVER DRAWER FOR TEXT SELECTION                   */}
      {/* ----------------------------------------------------------------- */}
      {isContextDrawerOpen && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-stone-950 border-l border-stone-200 dark:border-stone-800 shadow-2xl p-6 z-50 flex flex-col justify-between animate-fadeIn">
          <div className="space-y-4 overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-200/80 dark:border-stone-800 pb-3">
              <span className="font-mono text-[10px] uppercase font-bold text-[#912A4A] dark:text-rose-400">
                Contextual Tool: {activeContextTool}
              </span>
              <button
                onClick={() => setIsContextDrawerOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200/60 dark:border-stone-800 text-xs italic text-stone-700 dark:text-stone-300">
              "{selectedText}"
            </div>

            {isGeneratingContext ? (
              <div className="py-12 text-center text-xs text-stone-400 space-y-2">
                <Sparkles className="w-5 h-5 text-[#912A4A] mx-auto animate-spin" />
                <p>Generating thoughtful synthesis...</p>
              </div>
            ) : (
              <div className="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200/80 dark:border-stone-800 text-xs font-sans text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed">
                {contextResult}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800 flex gap-2">
            <button
              onClick={() => {
                if (contextResult) {
                  handleUpdateChapterContent((activeChapter?.content || '') + '\n\n' + contextResult);
                }
                setIsContextDrawerOpen(false);
              }}
              className="flex-grow py-2 bg-[#912A4A] text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-[#78223d]"
            >
              Insert into Draft
            </button>
            <button
              onClick={() => setIsContextDrawerOpen(false)}
              className="px-4 py-2 border border-stone-200 dark:border-stone-800 rounded-lg text-xs text-stone-600 dark:text-stone-400 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
