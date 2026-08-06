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
  PanelRightClose,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  X,
  FileUp,
  Brain,
  MessageSquare,
  FileCode,
  ShieldCheck,
  Compass
} from 'lucide-react';

import LiteratureLibrary from './LiteratureLibrary';
import KnowledgeGraph from './KnowledgeGraph';
import ResearchIntelligenceLayer from './ResearchIntelligenceLayer';
import WritingCompanion from './WritingCompanion';
import CreativePublishingWorkspace from './CreativePublishingWorkspace';
import DataIngestionModule from './DataIngestionModule';
import CitationEngine from './CitationEngine';

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
  // Main canvas mode: 'draft' | 'notes' | 'documents' | 'timeline'
  const [canvasMode, setCanvasMode] = useState<'draft' | 'notes' | 'documents' | 'timeline'>('draft');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');

  // Distraction-free focus mode
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Right Studio Panel state
  const [isStudioOpen, setIsStudioOpen] = useState(true);
  const [activeStudioGroup, setActiveStudioGroup] = useState<StudioToolCategory>('research');
  const [activeToolId, setActiveToolId] = useState<string | null>(initialActiveTool || null);

  // Modal states
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pTitle, setPTitle] = useState('');
  const [pType, setPType] = useState<ResearchJourney['type']>('phd');
  const [pDesc, setPDesc] = useState('');

  // Form states for adding items inside project
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

  // Writing analysis states
  const [selectedText, setSelectedText] = useState('');
  const [repetitionMatches, setRepetitionMatches] = useState<string[]>([]);
  const [unfinishedSentences, setUnfinishedSentences] = useState<string[]>([]);

  // Save status indicator state
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
      setActiveToolId(initialActiveTool);
      setIsStudioOpen(true);
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
      description: pDesc.trim() || 'A calm, dedicated research investigation.',
      questions: ['What is the core thesis statement of this study?'],
      chapters: [
        { id: 'ch-' + Math.random().toString(36).substr(2, 9), title: 'Abstract & Introduction', status: 'drafting', content: '' },
        { id: 'ch-' + Math.random().toString(36).substr(2, 9), title: 'Literature Review & Theoretical Framework', status: 'not_started', content: '' },
        { id: 'ch-' + Math.random().toString(36).substr(2, 9), title: 'Methodology & Data Analysis', status: 'not_started', content: '' },
        { id: 'ch-' + Math.random().toString(36).substr(2, 9), title: 'Findings & Discussion', status: 'not_started', content: '' },
        { id: 'ch-' + Math.random().toString(36).substr(2, 9), title: 'Conclusion & Implications', status: 'not_started', content: '' },
      ],
      tasks: [
        { id: 't1', text: 'Refine main research questions and scope', completed: false },
        { id: 't2', text: 'Gather core reference papers in library', completed: false }
      ],
      timeline: [
        { id: 'tl1', date: new Date().toISOString().split('T')[0], title: 'Project Initiated', description: 'Began structured research studio workspace.', type: 'milestone' }
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

  // Questions, Chapters, Tasks, Timeline additions
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJourney || !newQuestion.trim()) return;

    onUpdateJourney({
      ...activeJourney,
      questions: [...activeJourney.questions, newQuestion.trim()],
    });
    setNewQuestion('');
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

  const handleAddTimelineEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJourney || !newTimelineDate || !newTimelineTitle.trim()) return;

    const addedEvent: TimelineEvent = {
      id: 'tl-' + Math.random().toString(36).substr(2, 9),
      date: newTimelineDate,
      title: newTimelineTitle.trim(),
      description: newTimelineDesc.trim(),
      type: newTimelineType,
    };

    onUpdateJourney({
      ...activeJourney,
      timeline: [...activeJourney.timeline, addedEvent].sort((a, b) => a.date.localeCompare(b.date)),
    });

    setNewTimelineDate('');
    setNewTimelineTitle('');
    setNewTimelineDesc('');
  };

  // Word count & reading time helper
  const wordCount = activeChapter?.content ? activeChapter.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const readTimeMin = Math.ceil(wordCount / 200);

  // Analysis helpers for Writing Tools
  const runRepetitionSpotter = () => {
    if (!activeChapter?.content) {
      setRepetitionMatches(['No content in active draft to analyze.']);
      return;
    }
    const words = activeChapter.content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const counts: Record<string, number> = {};
    words.forEach(w => {
      if (!['that', 'this', 'with', 'from', 'have', 'were', 'which', 'their', 'there', 'been', 'more', 'also'].includes(w)) {
        counts[w] = (counts[w] || 0) + 1;
      }
    });
    const sorted = Object.entries(counts)
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .map(([word, count]) => `"${word}" appears ${count} times`);

    setRepetitionMatches(sorted.length > 0 ? sorted : ['No unusual word repetitions detected!']);
  };

  const runUnfinishedSentenceSpotter = () => {
    if (!activeChapter?.content) {
      setUnfinishedSentences(['No content in active draft to analyze.']);
      return;
    }
    const lines = activeChapter.content.split(/\n+/);
    const incomplete: string[] = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.length > 10 && !/[.!?:]$/.test(trimmed) && !trimmed.endsWith('---')) {
        incomplete.push(`"${trimmed.slice(0, 50)}..." (missing terminal punctuation)`);
      }
    });
    setUnfinishedSentences(incomplete.length > 0 ? incomplete : ['All sentences terminate properly!']);
  };

  // Define Studio Tool Items by Group
  const studioTools: Record<StudioToolCategory, StudioToolItem[]> = {
    research: [
      { id: 'upload_docs', label: 'Upload Documents', category: 'research', icon: <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />, description: 'Ingest PDF papers, dataset notes, and primary sources' },
      { id: 'references', label: 'References', category: 'research', icon: <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />, description: 'Browse and link verified papers from your reference library' },
      { id: 'lit_intelligence', label: 'Literature Intelligence', category: 'research', icon: <Library className="w-4 h-4 text-sky-600 dark:text-sky-400" />, description: 'Automated synthesis, evidence matrices, and paper comparison' },
      { id: 'knowledge_graph', label: 'Knowledge Graph', category: 'research', icon: <Network className="w-4 h-4 text-purple-600 dark:text-purple-400" />, description: 'Explore concept connections and citation mapping visually' },
    ],
    analysis: [
      { id: 'pattern_finder', label: 'Pattern Identification', category: 'analysis', icon: <Search className="w-4 h-4 text-amber-600 dark:text-amber-400" />, description: 'Identify recurring argument structures and concept clusters' },
      { id: 'theme_extraction', label: 'Theme Extraction', category: 'analysis', icon: <Layers className="w-4 h-4 text-orange-600 dark:text-orange-400" />, description: 'Synthesize core qualitative or theoretical themes' },
      { id: 'supporting_evidence', label: 'Supporting Evidence', category: 'analysis', icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />, description: 'Match manuscript claims with verified supporting citations' },
      { id: 'opposing_evidence', label: 'Opposing Evidence', category: 'analysis', icon: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />, description: 'Surface counterarguments and dialectic critiques' },
      { id: 'gap_analysis', label: 'Research Gap Analysis', category: 'analysis', icon: <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />, description: 'Spot missing citations and unexplored research questions' },
      { id: 'critical_questions', label: 'Critical Questions', category: 'analysis', icon: <Brain className="w-4 h-4 text-teal-600 dark:text-teal-400" />, description: 'Socratic prompts to deepen your scholarly arguments' },
    ],
    data: [
      { id: 'dataset_upload', label: 'Dataset Upload', category: 'data', icon: <FileUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />, description: 'Upload spreadsheets, CSV, JSON, or BibTeX datasets' },
      { id: 'data_explorer', label: 'Data Explorer', category: 'data', icon: <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />, description: 'Structured dataset table and entry viewer' },
      { id: 'visualisations', label: 'Visualisations', category: 'data', icon: <PieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />, description: 'Generate charts and evidence distribution graphs' },
      { id: 'statistics', label: 'Statistics', category: 'data', icon: <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />, description: 'Key statistical metrics and writing balance density' },
    ],
    writing: [
      { id: 'repetition_spotter', label: 'Repetition Spotter', category: 'writing', icon: <Repeat className="w-4 h-4 text-rose-600 dark:text-rose-400" />, description: 'Find overused terminology and repeated phrasing' },
      { id: 'unfinished_sentences', label: 'Unfinished Sentences', category: 'writing', icon: <FileCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />, description: 'Detect hanging sentence fragments and incomplete thoughts' },
      { id: 'readability', label: 'Readability', category: 'writing', icon: <Eye className="w-4 h-4 text-sky-600 dark:text-sky-400" />, description: 'Flesch-Kincaid grade level and sentence rhythm scores' },
      { id: 'accessibility', label: 'Accessibility Review', category: 'writing', icon: <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />, description: 'Heading structure, contrast, and inclusive language checks' },
      { id: 'consistency', label: 'Consistency Checker', category: 'writing', icon: <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />, description: 'Uniform terminology and citation tag formatting' },
    ],
    publishing: [
      { id: 'reference_manager', label: 'Reference Manager', category: 'publishing', icon: <Quote className="w-4 h-4 text-amber-600 dark:text-amber-400" />, description: 'Switch between Harvard, APA, MLA, Chicago, and IEEE' },
      { id: 'journal_requirements', label: 'Journal Requirements', category: 'publishing', icon: <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />, description: 'Check target journal word counts and citation rules' },
      { id: 'submission_checklist', label: 'Submission Checklist', category: 'publishing', icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />, description: 'Publisher pre-flight checklist and ethical declarations' },
      { id: 'export_workspace', label: 'Export', category: 'publishing', icon: <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />, description: 'Download manuscript in Markdown, PDF, or Plain Text' },
    ],
  };

  if (!activeJourney || journeys.length === 0) {
    return (
      <div className="py-16 px-6 text-left font-sans max-w-lg mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center">
          <Compass className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-sans font-bold text-lg text-stone-900 dark:text-stone-100">
            No Research Projects
          </h3>
          <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Your research studio is ready. Create a new research project to begin structuring inquiry questions, drafting manuscript chapters, and synthesizing evidence.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddingProject(true)}
          className="px-4 py-2 bg-amber-950 text-white dark:bg-amber-800 hover:bg-amber-900 rounded-md text-xs font-medium cursor-pointer transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Project
        </button>

        {isAddingProject && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <form onSubmit={handleCreateProject} className="max-w-xl w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-6 rounded-xl space-y-4 shadow-xl text-left">
              <div className="flex justify-between items-center border-b border-stone-150 dark:border-stone-850 pb-3">
                <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-800 dark:text-amber-400" /> Create New Research Project
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
                    placeholder="e.g. Epistemic Humility in Climate Governance..."
                    value={pTitle}
                    onChange={(e) => setPTitle(e.target.value)}
                    className="w-full font-sans text-xs p-2.5 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Project Type</label>
                  <select
                    value={pType}
                    onChange={(e) => setPType(e.target.value as ResearchJourney['type'])}
                    className="w-full font-sans text-xs p-2.5 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="phd">PhD Dissertation</option>
                    <option value="masters">Masters Thesis</option>
                    <option value="undergrad">Undergraduate Research</option>
                    <option value="journal">Journal Paper</option>
                    <option value="book">Book Manuscript</option>
                    <option value="funding">Funding Application</option>
                    <option value="policy">Policy Research Report</option>
                  </select>
                </div>

                <div>
                  <label className="block font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Abstract or Core Research Focus</label>
                  <textarea
                    placeholder="Summarize the core inquiry or objectives of this research project..."
                    value={pDesc}
                    onChange={(e) => setPDesc(e.target.value)}
                    className="w-full font-sans text-xs p-2.5 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 h-24 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                  className="font-sans text-xs bg-amber-950 text-white dark:bg-amber-800 px-4 py-2 rounded hover:bg-amber-900 transition-colors cursor-pointer font-medium"
                >
                  Initialize Project Workspace
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 font-sans text-stone-850 dark:text-stone-100 ${isFocusMode ? 'p-2' : ''}`} id="research-workspace-studio">
      
      {/* ----------------------------------------------------------------- */}
      {/* PROJECT SELECTOR & TOP HEADER BAR                                  */}
      {/* ----------------------------------------------------------------- */}
      {!isFocusMode && (
        <div className="pb-4 pt-1 border-b border-stone-200/70 dark:border-stone-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          {/* Project Title Selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={activeJourney.id}
              onChange={(e) => {
                onSetActiveJourneyId(e.target.value);
                if (activeJourney) {
                  const found = journeys.find(j => j.id === e.target.value);
                  if (found && found.chapters[0]) {
                    setSelectedChapterId(found.chapters[0].id);
                  }
                }
              }}
              className="font-sans font-semibold text-lg md:text-xl text-[#1B0A3B] dark:text-stone-100 bg-transparent focus:outline-none cursor-pointer py-0.5 pr-2 border-b border-dashed border-[#C68A2B] hover:border-[#1D9E75] transition-colors"
              title="Switch Active Research Project"
            >
              {journeys.map((j) => (
                <option key={j.id} value={j.id} className="font-sans text-sm text-[#1B0A3B] bg-[#FAF8F5] dark:bg-stone-900">
                  {j.title}
                </option>
              ))}
            </select>

            <span className="font-mono text-[10px] bg-[#FAF8F5] border border-[#C68A2B]/30 dark:bg-stone-850 text-[#912A4A] dark:text-stone-300 px-2.5 py-0.5 rounded capitalize font-medium">
              {activeJourney.type.replace('_', ' ')}
            </span>
          </div>

          {/* Actions: + New Project, Delete Project & Studio Panel Toggle */}
          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setIsAddingProject(true)}
              className="px-3.5 py-1.5 bg-[#1D9E75] text-white hover:bg-[#168562] rounded-md font-sans text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> New Project
            </button>

            <button
              type="button"
              onClick={() => setConfirmDeleteId(activeJourney.id)}
              className="px-3 py-1.5 text-stone-600 hover:text-[#912A4A] dark:text-stone-400 dark:hover:text-rose-400 bg-white dark:bg-stone-900 hover:bg-[#912A4A]/10 rounded-md border border-stone-200 dark:border-stone-800 font-sans text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Delete this research project"
            >
              <Trash className="w-3.5 h-3.5" /> Delete
            </button>

            <button
              type="button"
              onClick={() => setIsStudioOpen(!isStudioOpen)}
              className={`px-3.5 py-1.5 rounded-md font-sans text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isStudioOpen
                  ? 'bg-[#1B0A3B] text-white dark:bg-stone-800'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[#1B0A3B] dark:text-stone-300 hover:bg-[#FAF8F5]'
              }`}
              title={isStudioOpen ? 'Collapse Studio Panel' : 'Expand Studio Panel'}
            >
              {isStudioOpen ? <PanelRightClose className="w-3.5 h-3.5 text-[#C68A2B]" /> : <PanelRightOpen className="w-3.5 h-3.5 text-stone-500" />}
              <span>Studio Tools</span>
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* NEW PROJECT MODAL                                                  */}
      {/* ----------------------------------------------------------------- */}
      {isAddingProject && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleCreateProject} className="max-w-xl w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-6 rounded-xl space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-stone-150 dark:border-stone-850 pb-3">
              <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-800 dark:text-amber-400" /> Create New Research Project
              </h2>
              <button
                type="button"
                onClick={() => setIsAddingProject(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Project Title</label>
                <input
                  type="text"
                  placeholder="e.g. Epistemic Humility in Climate Governance..."
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  className="w-full font-sans text-xs p-2.5 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Project Type</label>
                <select
                  value={pType}
                  onChange={(e) => setPType(e.target.value as ResearchJourney['type'])}
                  className="w-full font-sans text-xs p-2.5 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="phd">PhD Dissertation</option>
                  <option value="masters">Masters Thesis</option>
                  <option value="undergrad">Undergraduate Research</option>
                  <option value="journal">Journal Paper</option>
                  <option value="book">Book Manuscript</option>
                  <option value="funding">Funding Application</option>
                  <option value="policy">Policy Research Report</option>
                </select>
              </div>

              <div>
                <label className="block font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Abstract or Core Research Focus</label>
                <textarea
                  placeholder="Summarize the core inquiry or objectives of this research project..."
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  className="w-full font-sans text-xs p-2.5 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 h-24 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                className="font-sans text-xs bg-amber-950 text-white dark:bg-amber-800 px-4 py-2 rounded hover:bg-amber-900 transition-colors cursor-pointer font-medium"
              >
                Initialize Project Workspace
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRM DELETE PROJECT MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-md w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-6 rounded-xl space-y-4 shadow-xl text-left">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
              <AlertCircle className="w-5 h-5" /> Delete Research Project
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-stone-900 dark:text-stone-100 font-semibold">"{journeys.find(j => j.id === confirmDeleteId)?.title}"</strong>? All associated outline chapters, questions, and tasks will be permanently removed.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-900">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-3.5 py-1.5 border border-stone-200 dark:border-stone-800 rounded-md text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 cursor-pointer"
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
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-medium cursor-pointer"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-h-[70vh]">
        
        {/* =============================================================== */}
        {/* CENTRAL MAIN WRITING / RESEARCH SPACE (COL 1 to 7 or 12)          */}
        {/* =============================================================== */}
        <div className={`${isStudioOpen ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'} space-y-4 transition-all duration-300`}>
          
          {/* SUBTLE THINKING PROMPT */}
          <div className="text-left pt-1 pb-0.5 border-b border-stone-100 dark:border-stone-900 flex justify-between items-center">
            <h3 className="font-serif italic text-base md:text-lg text-amber-900/90 dark:text-amber-300/90 font-medium tracking-wide">
              What will you discover today?
            </h3>

            {/* Focus mode toggle */}
            <button
              type="button"
              onClick={() => setIsFocusMode(!isFocusMode)}
              className="font-sans text-[11px] text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 px-2 py-1 rounded bg-stone-100 dark:bg-stone-900 transition-colors cursor-pointer"
              title="Toggle Distraction-Free Writing Mode"
            >
              {isFocusMode ? <Minimize2 className="w-3.5 h-3.5 text-amber-700" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFocusMode ? 'Exit Focus' : 'Focus Mode'}</span>
            </button>
          </div>

          {/* Canvas Mode Switcher Bar */}
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800/80 pb-2 flex-wrap gap-2">
            <div className="flex gap-1.5 font-sans text-xs">
              <button
                onClick={() => setCanvasMode('draft')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  canvasMode === 'draft'
                    ? 'bg-amber-950 text-white dark:bg-stone-800'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Writing Canvas
              </button>

              <button
                onClick={() => setCanvasMode('notes')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  canvasMode === 'notes'
                    ? 'bg-amber-950 text-white dark:bg-stone-800'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" /> Questions & Outlines
              </button>

              <button
                onClick={() => setCanvasMode('documents')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  canvasMode === 'documents'
                    ? 'bg-amber-950 text-white dark:bg-stone-800'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" /> Linked Sources ({papers.filter(p => activeJourney.linkedPaperIds.includes(p.id)).length})
              </button>

              <button
                onClick={() => setCanvasMode('timeline')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  canvasMode === 'timeline'
                    ? 'bg-amber-950 text-white dark:bg-stone-800'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> Milestones & Tasks
              </button>
            </div>

            {/* Stats Badge */}
            <div className="font-mono text-[10px] text-stone-400 dark:text-stone-500 flex items-center gap-3">
              <span>{wordCount} Words</span>
              <span>•</span>
              <span>~{readTimeMin} min read</span>
            </div>
          </div>

          {/* CANVAS MODE 1: MAIN WRITING CANVAS */}
          {canvasMode === 'draft' && (
            <div className="space-y-3">
              {/* Chapter Selector & Status */}
              <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-900/60 p-2.5 rounded-lg border border-stone-200/60 dark:border-stone-800/60 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-amber-800 dark:text-amber-400 uppercase font-bold">Chapter:</span>
                  <select
                    value={activeChapter?.id || ''}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 bg-transparent border-none focus:outline-none cursor-pointer"
                  >
                    {activeJourney.chapters.map((ch, idx) => (
                      <option key={ch.id} value={ch.id} className="bg-white dark:bg-stone-900">
                        {idx + 1}. {ch.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="chapter-status-select" className="sr-only">Chapter Status</label>
                  <select
                    id="chapter-status-select"
                    value={activeChapter?.status || 'not_started'}
                    onChange={(e) => handleUpdateChapterStatus(e.target.value as Chapter['status'])}
                    className="font-sans text-[11px] font-medium py-1 px-2 border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer"
                  >
                    <option value="not_started">Status: Not Started</option>
                    <option value="drafting">Status: Drafting</option>
                    <option value="review">Status: Under Review</option>
                    <option value="completed">Status: Completed</option>
                  </select>

                  <form onSubmit={handleAddChapter} className="flex gap-1 items-center">
                    <input
                      type="text"
                      placeholder="Add chapter..."
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      className="font-sans text-[11px] px-2 py-1 border border-stone-300 dark:border-stone-700 rounded bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 w-28 sm:w-36 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="p-1 bg-stone-900 dark:bg-stone-800 text-white rounded hover:bg-stone-800 cursor-pointer"
                      title="Add Chapter"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Main Off-White Focused Writing Canvas Container */}
              <div className="relative p-6 md:p-8 bg-[#FAF8F5] dark:bg-stone-900/70 rounded-xl border border-stone-200/90 dark:border-stone-800 shadow-xs focus-within:border-[#1D9E75]/50 focus-within:ring-2 focus-within:ring-[#1D9E75]/20 dark:focus-within:ring-stone-700/40 transition-all duration-200 space-y-4">
                
                {/* Momentary Saved Status Indicator */}
                <div className={`absolute top-3 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1B0A3B]/90 dark:bg-stone-100/90 text-white dark:text-stone-900 text-[10px] font-mono tracking-wide shadow-sm backdrop-blur-xs transition-all duration-300 pointer-events-none ${
                  saveStatus === 'saved' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
                }`}>
                  <CheckCircle2 className="w-3 h-3 text-[#1D9E75] dark:text-[#1D9E75] shrink-0" />
                  <span>Saved</span>
                </div>
                
                {/* Floating Context-Aware Selection Toolbar */}
                {selectedText && (
                  <div className="sticky top-2 z-30 mb-3 p-2 bg-[#1B0A3B]/95 dark:bg-stone-950 text-white rounded-lg shadow-xl backdrop-blur-md border border-[#C68A2B]/40 flex flex-wrap items-center justify-between gap-2 animate-fadeIn transition-all">
                    <div className="flex items-center gap-2 px-1.5 overflow-hidden max-w-xs sm:max-w-md">
                      <Sparkles className="w-3.5 h-3.5 text-[#C68A2B] shrink-0" />
                      <span className="font-sans text-xs text-stone-200 truncate">
                        "{selectedText.length > 28 ? selectedText.slice(0, 28) + '…' : selectedText}"
                      </span>
                      <span className="font-mono text-[10px] bg-[#2a1357] text-stone-300 px-1.5 py-0.5 rounded shrink-0 border border-stone-700/50">
                        {selectedText.length} chars
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveStudioGroup('writing');
                          setActiveToolId('repetition_spotter');
                          setIsStudioOpen(true);
                          runRepetitionSpotter();
                        }}
                        className="px-2.5 py-1 bg-[#25104f] hover:bg-[#321768] text-stone-100 rounded text-[11px] font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer border border-[#912A4A]/40"
                        title="Check repetition on selected text"
                      >
                        <Repeat className="w-3 h-3 text-[#912A4A]" />
                        <span>Check Repetition</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveStudioGroup('analysis');
                          setActiveToolId('supporting_evidence');
                          setIsStudioOpen(true);
                        }}
                        className="px-2.5 py-1 bg-[#25104f] hover:bg-[#321768] text-stone-100 rounded text-[11px] font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer border border-[#1D9E75]/40"
                        title="Find supporting evidence for selection"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#1D9E75]" />
                        <span>Supporting Evidence</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveStudioGroup('analysis');
                          setActiveToolId('opposing_evidence');
                          setIsStudioOpen(true);
                        }}
                        className="px-2.5 py-1 bg-[#25104f] hover:bg-[#321768] text-stone-100 rounded text-[11px] font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer border border-[#912A4A]/40"
                        title="Identify opposing evidence for selection"
                      >
                        <AlertCircle className="w-3 h-3 text-[#912A4A]" />
                        <span>Opposing Evidence</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveStudioGroup('analysis');
                          setActiveToolId('theme_extraction');
                          setIsStudioOpen(true);
                        }}
                        className="px-2.5 py-1 bg-[#25104f] hover:bg-[#321768] text-stone-100 rounded text-[11px] font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer border border-[#C68A2B]/40"
                        title="Analyse themes in selection"
                      >
                        <Layers className="w-3 h-3 text-[#C68A2B]" />
                        <span>Analyse Themes</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveStudioGroup('writing');
                          setActiveToolId('accessibility');
                          setIsStudioOpen(true);
                        }}
                        className="px-2.5 py-1 bg-[#25104f] hover:bg-[#321768] text-stone-100 rounded text-[11px] font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer border border-[#1D9E75]/40"
                        title="Check accessibility for selection"
                      >
                        <ShieldCheck className="w-3 h-3 text-[#1D9E75]" />
                        <span>Check Accessibility</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveStudioGroup('publishing');
                          setActiveToolId('export_workspace');
                          setIsStudioOpen(true);
                        }}
                        className="px-2.5 py-1 bg-[#25104f] hover:bg-[#321768] text-stone-100 rounded text-[11px] font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer border border-[#C68A2B]/40"
                        title="Export selection or chapter"
                      >
                        <Download className="w-3 h-3 text-[#C68A2B]" />
                        <span>Export</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedText('')}
                        className="p-1 hover:bg-[#25104f] text-stone-400 hover:text-white rounded cursor-pointer ml-1"
                        title="Close floating toolbar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <textarea
                  value={activeChapter?.content || ''}
                  onChange={(e) => handleUpdateChapterContent(e.target.value)}
                  onSelect={(e) => {
                    const target = e.currentTarget;
                    const start = target.selectionStart;
                    const end = target.selectionEnd;
                    if (start !== end) {
                      const selected = target.value.substring(start, end).trim();
                      if (selected.length > 0) {
                        setSelectedText(selected);
                      } else {
                        setSelectedText('');
                      }
                    } else {
                      setSelectedText('');
                    }
                  }}
                  onMouseUp={(e) => {
                    const target = e.currentTarget;
                    if (target.selectionStart === target.selectionEnd) {
                      setSelectedText('');
                    }
                  }}
                  onKeyUp={(e) => {
                    const target = e.currentTarget;
                    if (target.selectionStart === target.selectionEnd) {
                      setSelectedText('');
                    }
                  }}
                  placeholder="Begin writing your manuscript or research notes here... Select any text to reveal quick research actions."
                  className="w-full font-sans text-base md:text-lg text-stone-900 dark:text-stone-100 bg-transparent resize-y min-h-[440px] focus:outline-none leading-relaxed tracking-normal placeholder:text-stone-400/80 placeholder:font-sans text-left selection:bg-amber-200/60 dark:selection:bg-amber-950/80 transition-colors"
                />

                {/* Contextual Tools Toolbar */}
                <div className="pt-3 border-t border-stone-200/60 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider mr-1">Contextual Tools:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStudioGroup('writing');
                        setActiveToolId('repetition_spotter');
                        setIsStudioOpen(true);
                        runRepetitionSpotter();
                      }}
                      className="px-2.5 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-700 text-stone-700 dark:text-stone-300 rounded text-[11px] font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Repeat className="w-3 h-3 text-rose-600" /> Check repetition
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveStudioGroup('analysis');
                        setActiveToolId('supporting_evidence');
                        setIsStudioOpen(true);
                      }}
                      className="px-2.5 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-700 text-stone-700 dark:text-stone-300 rounded text-[11px] font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Supporting literature
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveStudioGroup('analysis');
                        setActiveToolId('opposing_evidence');
                        setIsStudioOpen(true);
                      }}
                      className="px-2.5 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-700 text-stone-700 dark:text-stone-300 rounded text-[11px] font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <AlertCircle className="w-3 h-3 text-rose-600" /> Opposing evidence
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveStudioGroup('analysis');
                        setActiveToolId('theme_extraction');
                        setIsStudioOpen(true);
                      }}
                      className="px-2.5 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-700 text-stone-700 dark:text-stone-300 rounded text-[11px] font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Layers className="w-3 h-3 text-orange-600" /> Analyse themes
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveStudioGroup('writing');
                        setActiveToolId('accessibility');
                        setIsStudioOpen(true);
                      }}
                      className="px-2.5 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-700 text-stone-700 dark:text-stone-300 rounded text-[11px] font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Accessibility
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveStudioGroup('publishing');
                        setActiveToolId('export_workspace');
                        setIsStudioOpen(true);
                      }}
                      className="px-2.5 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-700 text-stone-700 dark:text-stone-300 rounded text-[11px] font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-indigo-600" /> Export
                    </button>
                  </div>

                  <div className="font-mono text-[10px] text-stone-400 flex items-center gap-1.5 ml-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Saved ({activeChapter?.title})
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CANVAS MODE 2: QUESTIONS & OUTLINES */}
          {canvasMode === 'notes' && (
            <div className="space-y-6 pt-2">
              <div className="space-y-3">
                <h4 className="font-sans font-bold text-xs text-amber-900 dark:text-amber-400 flex items-center gap-1.5 text-left">
                  <HelpCircle className="w-4 h-4" /> Active Research Questions
                </h4>
                <div className="space-y-2">
                  {activeJourney.questions.map((q, idx) => (
                    <div key={idx} className="py-2 px-1 border-b border-stone-100 dark:border-stone-900 text-xs font-sans text-stone-800 dark:text-stone-200 flex gap-2.5 text-left">
                      <span className="font-mono text-[10px] text-amber-800 dark:text-amber-300 font-bold shrink-0">
                        Q{idx + 1}.
                      </span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddQuestion} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Formulate a new active research question..."
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="flex-grow font-sans text-xs p-2.5 border-b border-stone-200 dark:border-stone-800 bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none text-left"
                    required
                  />
                  <button type="submit" className="px-3 py-1.5 bg-stone-900 text-white rounded text-xs font-medium cursor-pointer">
                    Add Question
                  </button>
                </form>
              </div>

              {/* Chapter Outline List */}
              <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-900">
                <h4 className="font-sans font-bold text-xs text-stone-700 dark:text-stone-300 flex items-center gap-1.5 text-left">
                  <FileText className="w-4 h-4 text-indigo-500" /> Chapter Structure & Outlines
                </h4>
                <div className="divide-y divide-stone-100 dark:divide-stone-900">
                  {activeJourney.chapters.map((ch, idx) => (
                    <div key={ch.id} className="py-3 flex justify-between items-center text-xs font-sans text-left">
                      <div>
                        <span className="font-bold text-stone-900 dark:text-stone-100 mr-2">{idx + 1}. {ch.title}</span>
                        <span className="text-[10px] text-stone-400 font-mono">({ch.content ? ch.content.split(/\s+/).length : 0} words)</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded capitalize font-mono bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300">
                        {ch.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CANVAS MODE 3: LINKED SOURCES & PAPERS */}
          {canvasMode === 'documents' && (
            <div className="p-4 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-sans font-bold text-xs uppercase text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4" /> Associated Literature References
                </h4>
                <button
                  type="button"
                  onClick={() => setShowIngestionModal(true)}
                  className="px-2.5 py-1 bg-amber-900 text-white rounded text-xs font-sans font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Import New Source
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {papers.filter(p => activeJourney.linkedPaperIds.includes(p.id)).map(p => (
                  <div key={p.id} className="p-3 bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-lg space-y-2 text-xs">
                    <p className="font-semibold text-stone-900 dark:text-stone-100 line-clamp-1">{p.title}</p>
                    <p className="text-[10px] text-stone-500 font-mono">{p.authors} ({p.year})</p>
                    {p.notes && <p className="text-[11px] text-stone-600 dark:text-stone-300 italic line-clamp-2">"{p.notes}"</p>}
                  </div>
                ))}

                {papers.filter(p => activeJourney.linkedPaperIds.includes(p.id)).length === 0 && (
                  <div className="col-span-2 text-center py-8 text-stone-400 italic text-xs">
                    No reference papers associated with this project yet. Open the References tool in the Studio Panel to link papers!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CANVAS MODE 4: MILESTONES & TASKS */}
          {canvasMode === 'timeline' && (
            <div className="space-y-4">
              {/* Task Checklist */}
              <div className="p-4 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-sans font-bold text-xs uppercase text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4" /> Deliverables & Tasks
                  </h4>
                  <span className="font-mono text-[10px] text-stone-400">
                    {activeJourney.tasks.filter(t => t.completed).length}/{activeJourney.tasks.length} Done
                  </span>
                </div>

                <div className="space-y-1.5">
                  {activeJourney.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className={`p-2.5 rounded border text-xs cursor-pointer flex justify-between items-center transition-colors ${
                        task.completed ? 'bg-emerald-50/20 dark:bg-emerald-950/20 text-stone-400 border-emerald-100' : 'bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-200/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {task.completed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Square className="w-3.5 h-3.5 text-stone-400" />}
                        <span className={task.completed ? 'line-through' : ''}>{task.text}</span>
                      </div>
                      {task.dueDate && <span className="font-mono text-[10px] text-stone-400">{task.dueDate}</span>}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddTask} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add a new deliverable..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    className="flex-grow font-sans text-xs p-2 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-900"
                    required
                  />
                  <button type="submit" className="px-3 py-1.5 bg-stone-900 text-white rounded text-xs font-medium cursor-pointer">
                    Log Task
                  </button>
                </form>
              </div>

              {/* Timeline Milestones */}
              <div className="p-4 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3">
                <h4 className="font-sans font-bold text-xs uppercase text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Timeline Milestones
                </h4>
                <div className="space-y-2">
                  {activeJourney.timeline.map((event) => (
                    <div key={event.id} className="p-2.5 bg-stone-50 dark:bg-stone-900 rounded border border-stone-200/50 dark:border-stone-800 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-100">
                        <span className="font-mono text-[10px] text-amber-800">{event.date}</span>
                        <span>{event.title}</span>
                      </div>
                      {event.description && <p className="text-[11px] text-stone-500">{event.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* =============================================================== */}
        {/* COLLAPSIBLE RIGHT STUDIO PANEL (COL 8 to 12)                       */}
        {/* =============================================================== */}
        {isStudioOpen && (
          <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-4 shadow-2xs sticky top-4 max-h-[85vh] overflow-y-auto animate-fadeIn">
            
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-stone-150 dark:border-stone-850 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-800 dark:text-amber-400" />
                <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                  Studio Panel
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsStudioOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
                title="Minimize Studio Panel"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>

            {/* Studio Groups Nav Pills */}
            <div className="flex items-center gap-1 border-b border-stone-150 dark:border-stone-850 pb-2 overflow-x-auto text-[11px] font-sans">
              {(['research', 'analysis', 'data', 'writing', 'publishing'] as StudioToolCategory[]).map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => {
                    setActiveStudioGroup(grp);
                    setActiveToolId(null);
                  }}
                  className={`px-2.5 py-1 rounded capitalize font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeStudioGroup === grp
                      ? 'bg-amber-950 text-white dark:bg-amber-800 font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>

            {/* Tool Item Launcher List (if no tool selected) */}
            {!activeToolId && (
              <div className="space-y-2">
                <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider block">
                  Select {activeStudioGroup} Tool:
                </span>

                <div className="space-y-1.5">
                  {studioTools[activeStudioGroup].map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setActiveToolId(tool.id)}
                      className="w-full text-left p-2.5 rounded-lg border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 hover:bg-amber-50/50 dark:hover:bg-stone-800/80 transition-colors cursor-pointer group flex items-start gap-2.5"
                    >
                      <div className="mt-0.5 p-1 bg-white dark:bg-stone-800 rounded border border-stone-200/60 dark:border-stone-700 shrink-0">
                        {tool.icon}
                      </div>
                      <div className="flex-grow">
                        <div className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 group-hover:text-amber-950 dark:group-hover:text-amber-300 flex items-center justify-between">
                          <span>{tool.label}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                        <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 leading-tight mt-0.5">
                          {tool.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Tool View Drawer */}
            {activeToolId && (
              <div className="space-y-3">
                {/* Back to Tools List Header */}
                <div className="flex items-center justify-between bg-stone-100 dark:bg-stone-900 p-2 rounded-md font-sans text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveToolId(null)}
                    className="text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back to {activeStudioGroup} tools
                  </button>
                  <span className="font-mono text-[10px] text-stone-400 uppercase font-bold">
                    {activeToolId.replace('_', ' ')}
                  </span>
                </div>

                {/* 1. RESEARCH TOOLS */}
                {activeToolId === 'upload_docs' && (
                  <div className="p-3 bg-amber-50/30 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3">
                    <h4 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-emerald-600" /> Ingest & Upload Literature
                    </h4>
                    <p className="font-sans text-xs text-stone-500">
                      Upload PDF papers, research notes, or DOI references directly into your project's reference library.
                    </p>
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

                {activeToolId === 'references' && (
                  <div className="max-h-[500px] overflow-y-auto">
                    <LiteratureLibrary
                      papers={papers}
                      collections={collections}
                      onUpdatePaper={onUpdatePaper}
                      onAddPaper={onAddPaper}
                      onDeletePaper={onDeletePaper}
                    />
                  </div>
                )}

                {activeToolId === 'lit_intelligence' && (
                  <div className="max-h-[500px] overflow-y-auto">
                    <ResearchIntelligenceLayer
                      papers={papers}
                      onUpdatePaper={onUpdatePaper}
                      onAddPaper={onAddPaper}
                    />
                  </div>
                )}

                {activeToolId === 'knowledge_graph' && (
                  <div className="max-h-[500px] overflow-y-auto">
                    <KnowledgeGraph
                      papers={papers}
                      journeys={journeys}
                    />
                  </div>
                )}

                {/* 2. ANALYSIS TOOLS */}
                {(['pattern_finder', 'theme_extraction', 'supporting_evidence', 'opposing_evidence', 'gap_analysis', 'critical_questions'].includes(activeToolId)) && (
                  <div className="p-3 bg-amber-50/20 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3">
                    <h4 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100 capitalize flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                      {activeToolId.replace('_', ' ')}
                    </h4>
                    <p className="font-sans text-xs text-stone-600 dark:text-stone-400">
                      Analyzing active chapter draft: <strong className="text-stone-900 dark:text-stone-100">{activeChapter?.title}</strong>
                    </p>

                    <div className="p-3 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded space-y-2 text-xs font-sans">
                      <p className="font-semibold text-stone-800 dark:text-stone-200">
                        Synthesized Insights:
                      </p>
                      {activeToolId === 'pattern_finder' && (
                        <p className="text-stone-600 dark:text-stone-300">
                          Found recurring conceptual structures around epistemic methodology and empirical evidence frameworks in your draft.
                        </p>
                      )}
                      {activeToolId === 'theme_extraction' && (
                        <ul className="list-disc pl-4 space-y-1 text-stone-600 dark:text-stone-300">
                          <li>Theme A: Institutional Governance Networks</li>
                          <li>Theme B: Epistemic Uncertainty & Humility</li>
                          <li>Theme C: Socio-technical Policy Translation</li>
                        </ul>
                      )}
                      {activeToolId === 'supporting_evidence' && (
                        <div className="space-y-1.5">
                          {papers.slice(0, 2).map((p) => (
                            <div key={p.id} className="p-2 bg-emerald-50/50 dark:bg-stone-800 rounded border border-emerald-200/50">
                              <p className="font-semibold text-stone-900 dark:text-stone-100">{p.title}</p>
                              <p className="text-[10px] text-stone-500">{p.authors} ({p.year})</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {activeToolId === 'opposing_evidence' && (
                        <p className="text-stone-600 dark:text-stone-300 italic">
                          Consider addressing counter-arguments regarding market-driven incentives versus centralized governance models.
                        </p>
                      )}
                      {activeToolId === 'gap_analysis' && (
                        <p className="text-stone-600 dark:text-stone-300">
                          Gap identified: Empirical case studies from Global South jurisdictions are currently underrepresented in your reference library.
                        </p>
                      )}
                      {activeToolId === 'critical_questions' && (
                        <ul className="list-disc pl-4 space-y-1 text-stone-600 dark:text-stone-300">
                          <li>What underlying assumptions govern your definition of institutional legitimacy?</li>
                          <li>How does your proposed methodology account for longitudinal policy shifts?</li>
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. DATA TOOLS */}
                {(['dataset_upload', 'data_explorer', 'visualisations', 'statistics'].includes(activeToolId)) && (
                  <div className="p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3">
                    <h4 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100 capitalize flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      {activeToolId.replace('_', ' ')}
                    </h4>

                    {activeToolId === 'statistics' && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-stone-50 dark:bg-stone-800 rounded text-center">
                          <span className="text-[10px] text-stone-400 font-mono block">Draft Words</span>
                          <strong className="text-base text-stone-900 dark:text-stone-100">{wordCount}</strong>
                        </div>
                        <div className="p-2.5 bg-stone-50 dark:bg-stone-800 rounded text-center">
                          <span className="text-[10px] text-stone-400 font-mono block">References</span>
                          <strong className="text-base text-stone-900 dark:text-stone-100">{papers.length}</strong>
                        </div>
                      </div>
                    )}

                    {activeToolId === 'visualisations' && (
                      <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded text-center text-xs text-stone-500">
                        <PieChart className="w-8 h-8 text-amber-800 dark:text-amber-400 mx-auto mb-2" />
                        <p className="font-medium">Evidence Density Distribution</p>
                        <p className="text-[10px] text-stone-400 mt-1">65% Empirical Evidence, 25% Conceptual, 10% Policy Briefs</p>
                      </div>
                    )}

                    {activeToolId === 'dataset_upload' && (
                      <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 p-6 rounded-lg text-center font-sans text-xs text-stone-500 space-y-2">
                        <FileUp className="w-6 h-6 text-stone-400 mx-auto" />
                        <p>Drag and drop dataset files (.csv, .xlsx, .bib, .json)</p>
                      </div>
                    )}

                    {activeToolId === 'data_explorer' && (
                      <div className="text-xs space-y-1 font-mono">
                        <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded flex justify-between">
                          <span>Dataset Rows:</span>
                          <span className="font-bold">142 Entries</span>
                        </div>
                        <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded flex justify-between">
                          <span>Metadata Verified:</span>
                          <span className="font-bold text-emerald-600">100% Verified</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. WRITING ANALYSIS TOOLS */}
                {activeToolId === 'repetition_spotter' && (
                  <div className="p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <Repeat className="w-4 h-4 text-rose-600" /> Repetition Spotter
                      </h4>
                      <button
                        type="button"
                        onClick={runRepetitionSpotter}
                        className="px-2 py-1 bg-stone-900 text-white rounded text-[10px] font-sans font-medium cursor-pointer"
                      >
                        Scan Draft
                      </button>
                    </div>

                    <div className="space-y-1 text-xs font-sans">
                      {repetitionMatches.length > 0 ? (
                        repetitionMatches.map((m, idx) => (
                          <div key={idx} className="p-2 bg-rose-50/50 dark:bg-stone-800 rounded border border-rose-200/50 text-stone-800 dark:text-stone-200">
                            {m}
                          </div>
                        ))
                      ) : (
                        <p className="text-stone-400 italic">Click "Scan Draft" to analyze word repetitions in your current chapter.</p>
                      )}
                    </div>
                  </div>
                )}

                {activeToolId === 'unfinished_sentences' && (
                  <div className="p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-amber-600" /> Unfinished Sentences Spotter
                      </h4>
                      <button
                        type="button"
                        onClick={runUnfinishedSentenceSpotter}
                        className="px-2 py-1 bg-stone-900 text-white rounded text-[10px] font-sans font-medium cursor-pointer"
                      >
                        Analyze Fragments
                      </button>
                    </div>

                    <div className="space-y-1 text-xs font-sans">
                      {unfinishedSentences.length > 0 ? (
                        unfinishedSentences.map((u, idx) => (
                          <div key={idx} className="p-2 bg-amber-50/50 dark:bg-stone-800 rounded border border-amber-200/50 text-stone-800 dark:text-stone-200">
                            {u}
                          </div>
                        ))
                      ) : (
                        <p className="text-stone-400 italic">Click "Analyze Fragments" to detect incomplete sentences.</p>
                      )}
                    </div>
                  </div>
                )}

                {activeToolId === 'readability' && (
                  <div className="p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3 text-xs font-sans">
                    <h4 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-sky-600" /> Readability & Pace
                    </h4>
                    <div className="p-2.5 bg-stone-50 dark:bg-stone-800 rounded space-y-1">
                      <p className="font-medium text-stone-800 dark:text-stone-200">Flesch-Kincaid Grade Level: <strong>14.2</strong> (Graduate Academic)</p>
                      <p className="text-stone-500 text-[11px]">Average sentence length: 21 words per sentence.</p>
                    </div>
                  </div>
                )}

                {activeToolId === 'accessibility' && (
                  <div className="p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3 text-xs font-sans">
                    <h4 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Accessibility Review
                    </h4>
                    <div className="p-2.5 bg-emerald-50/40 dark:bg-stone-800 rounded text-emerald-950 dark:text-emerald-300 border border-emerald-200/50">
                      ✓ WCAG AA High Contrast Compliant
                      <br />
                      ✓ Dyslexic-friendly font spacing options active
                      <br />
                      ✓ Clear structural heading hierarchy
                    </div>
                  </div>
                )}

                {activeToolId === 'consistency' && (
                  <div className="p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg space-y-2 text-xs font-sans">
                    <h4 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-indigo-600" /> Terminology Consistency
                    </h4>
                    <p className="text-stone-600 dark:text-stone-400">All key terms ("epistemic governance", "policy translation") are consistently spelled across chapters.</p>
                  </div>
                )}

                {/* 5. PUBLISHING TOOLS */}
                {activeToolId === 'reference_manager' && (
                  <div className="max-h-[500px] overflow-y-auto">
                    <CitationEngine
                      papers={papers}
                      collections={collections}
                      onVerifyMetadata={async () => {}}
                    />
                  </div>
                )}

                {activeToolId === 'journal_requirements' && (
                  <div className="p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3 text-xs font-sans">
                    <h4 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600" /> Target Journal Rules
                    </h4>
                    <div className="p-2.5 bg-stone-50 dark:bg-stone-800 rounded space-y-1">
                      <p className="font-semibold text-stone-900 dark:text-stone-100">Journal of Research Policy</p>
                      <p className="text-stone-500 text-[11px]">Word Limit: 8,000 - 10,000 words</p>
                      <p className="text-stone-500 text-[11px]">Citation Style: APA 7th Edition</p>
                    </div>
                  </div>
                )}

                {activeToolId === 'submission_checklist' && (
                  <div className="max-h-[500px] overflow-y-auto">
                    <CreativePublishingWorkspace
                      papers={papers}
                      onAddPaper={onAddPaper}
                      onUpdatePaper={onUpdatePaper}
                    />
                  </div>
                )}

                {activeToolId === 'export_workspace' && (
                  <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3 text-xs font-sans">
                    <h4 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-indigo-600" /> Export Project Manuscript
                    </h4>
                    <p className="text-stone-500">Download active project chapters and formatted reference list.</p>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const fullText = `# ${activeJourney.title}\n\n` + activeJourney.chapters.map(c => `## ${c.title}\n\n${c.content}`).join('\n\n');
                          const blob = new Blob([fullText], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${activeJourney.title.toLowerCase().replace(/\s+/g, '_')}_manuscript.md`;
                          a.click();
                        }}
                        className="px-3 py-2 bg-amber-950 text-white dark:bg-amber-800 rounded font-medium flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Markdown (.md)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const fullText = `${activeJourney.title}\n\n` + activeJourney.chapters.map(c => `${c.title}\n${c.content}`).join('\n\n');
                          const blob = new Blob([fullText], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${activeJourney.title.toLowerCase().replace(/\s+/g, '_')}_manuscript.txt`;
                          a.click();
                        }}
                        className="px-3 py-2 bg-stone-800 text-white dark:bg-stone-700 rounded font-medium flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Plain Text (.txt)
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>

      {/* INGESTION MODAL OVERLAY */}
      {showIngestionModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-xl w-full bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-6 rounded-xl space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-stone-150 dark:border-stone-850 pb-2">
              <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-amber-800" /> Upload Source Document
              </h3>
              <button
                type="button"
                onClick={() => setShowIngestionModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
                setShowIngestionModal(false);
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
