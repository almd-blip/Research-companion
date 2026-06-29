/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ResearchJourney, Paper, Chapter, Task, TimelineEvent } from '../types';
import { HelpCircle, FileText, CheckSquare, Calendar, ChevronRight, Plus, Check, Link, Trash, Square } from 'lucide-react';

interface ResearchWorkspaceProps {
  journeys: ResearchJourney[];
  papers: Paper[];
  onUpdateJourney: (updated: ResearchJourney) => void;
  onAddJourney: (journey: ResearchJourney) => void;
  activeJourneyId: string;
  onSetActiveJourneyId: (id: string) => void;
}

export default function ResearchWorkspace({
  journeys,
  papers,
  onUpdateJourney,
  onAddJourney,
  activeJourneyId,
  onSetActiveJourneyId,
}: ResearchWorkspaceProps) {
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'chapters' | 'tasks' | 'timeline'>('overview');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');

  // Form states for adding items
  const [isAddingJourney, setIsAddingJourney] = useState(false);
  const [jTitle, setJTitle] = useState('');
  const [jType, setJType] = useState<ResearchJourney['type']>('phd');
  const [jDesc, setJDesc] = useState('');

  // Element addition states
  const [newQuestion, setNewQuestion] = useState('');
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTimelineDate, setNewTimelineDate] = useState('');
  const [newTimelineTitle, setNewTimelineTitle] = useState('');
  const [newTimelineDesc, setNewTimelineDesc] = useState('');
  const [newTimelineType, setNewTimelineType] = useState<TimelineEvent['type']>('milestone');

  const activeJourney = journeys.find((j) => j.id === activeJourneyId) || journeys[0];

  const handleCreateJourney = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jTitle) return;

    const added: ResearchJourney = {
      id: 'journey-' + Math.random().toString(36).substr(2, 9),
      title: jTitle,
      type: jType,
      description: jDesc,
      questions: [],
      chapters: [
        { id: 'ch-' + Math.random().toString(36).substr(2, 9), title: 'Introduction', status: 'not_started', content: '' },
        { id: 'ch-' + Math.random().toString(36).substr(2, 9), title: 'Literature Review', status: 'not_started', content: '' },
      ],
      tasks: [],
      timeline: [],
      linkedPaperIds: [],
    };

    onAddJourney(added);
    onSetActiveJourneyId(added.id);
    setIsAddingJourney(false);

    setJTitle('');
    setJDesc('');
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJourney || !newQuestion) return;

    const updated: ResearchJourney = {
      ...activeJourney,
      questions: [...activeJourney.questions, newQuestion],
    };
    onUpdateJourney(updated);
    setNewQuestion('');
  };

  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJourney || !newChapterTitle) return;

    const addedCh: Chapter = {
      id: 'ch-' + Math.random().toString(36).substr(2, 9),
      title: newChapterTitle,
      status: 'not_started',
      content: '',
    };

    const updated: ResearchJourney = {
      ...activeJourney,
      chapters: [...activeJourney.chapters, addedCh],
    };
    onUpdateJourney(updated);
    setNewChapterTitle('');
  };

  const handleUpdateChapterContent = (chapterId: string, content: string) => {
    if (!activeJourney) return;
    const updatedChs = activeJourney.chapters.map((ch) =>
      ch.id === chapterId ? { ...ch, content } : ch
    );
    onUpdateJourney({
      ...activeJourney,
      chapters: updatedChs,
    });
  };

  const handleUpdateChapterStatus = (chapterId: string, status: Chapter['status']) => {
    if (!activeJourney) return;
    const updatedChs = activeJourney.chapters.map((ch) =>
      ch.id === chapterId ? { ...ch, status } : ch
    );
    onUpdateJourney({
      ...activeJourney,
      chapters: updatedChs,
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJourney || !newTaskText) return;

    const addedTask: Task = {
      id: 'task-' + Math.random().toString(36).substr(2, 9),
      text: newTaskText,
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
    if (!activeJourney || !newTimelineDate || !newTimelineTitle) return;

    const addedEvent: TimelineEvent = {
      id: 'tl-' + Math.random().toString(36).substr(2, 9),
      date: newTimelineDate,
      title: newTimelineTitle,
      description: newTimelineDesc,
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

  if (isAddingJourney) {
    return (
      <form onSubmit={handleCreateJourney} className="max-w-2xl mx-auto bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 p-6 rounded-lg space-y-4">
        <h2 className="font-sans font-bold text-lg text-stone-900 dark:text-stone-100">Initialize a New Research Journey</h2>
        <p className="font-sans text-xs text-stone-500">Define the type of investigation, chapters structure, and milestones timeline below.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-sans text-xs font-semibold text-stone-600 dark:text-stone-400">Journey Name</label>
            <input
              type="text"
              placeholder="e.g., Thesis on Quantum Entanglement..."
              value={jTitle}
              onChange={(e) => setJTitle(e.target.value)}
              className="w-full font-sans text-xs p-2.5 border border-stone-200 rounded bg-white"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-sans text-xs font-semibold text-stone-600 dark:text-stone-400">Scholarly Journey Type</label>
            <select
              value={jType}
              onChange={(e) => setJType(e.target.value as ResearchJourney['type'])}
              className="w-full font-sans text-xs p-2.5 border border-stone-200 rounded bg-white text-stone-850"
            >
              <option value="phd">PhD Dissertation</option>
              <option value="masters">Masters Dissertation</option>
              <option value="undergrad">Undergraduate Research</option>
              <option value="journal">Journal Paper</option>
              <option value="book">Book Manuscript</option>
              <option value="funding">Funding Bid</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-sans text-xs font-semibold text-stone-600 dark:text-stone-400">Core Investigation Abstract</label>
          <textarea
            placeholder="A short summary of the main research focus..."
            value={jDesc}
            onChange={(e) => setJDesc(e.target.value)}
            className="w-full font-sans text-xs p-2.5 border border-stone-200 rounded bg-white h-24"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => setIsAddingJourney(false)}
            className="font-sans text-xs px-3 py-2 border border-stone-200 rounded text-stone-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="font-sans text-xs bg-amber-950 text-white px-3 py-2 rounded hover:bg-amber-900"
          >
            Deploy Journey Board
          </button>
        </div>
      </form>
    );
  }

  if (!activeJourney) {
    return (
      <div className="text-left py-24 font-sans text-stone-400 text-xs">
        No active journey boards found. Click "Add New Journey" above to initialize your board.
      </div>
    );
  }

  return (
    <div className="space-y-6" id="research-workspace-module">
      {/* Selector and title panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-sans text-[10px] bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded border border-amber-200/50 capitalize font-mono">
              {activeJourney.type}
            </span>
            <select
              value={activeJourney.id}
              onChange={(e) => onSetActiveJourneyId(e.target.value)}
              className="font-sans font-medium text-lg text-stone-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 cursor-pointer text-stone-850"
            >
              {journeys.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>
          <p className="font-sans text-xs text-stone-500 line-clamp-1 mt-1 max-w-2xl">{activeJourney.description}</p>
        </div>

        <button
          onClick={() => setIsAddingJourney(true)}
          className="font-sans text-xs bg-amber-900/10 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300 border border-amber-900/20 px-3 py-2 rounded hover:bg-amber-900/20 transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
        >
          <Plus className="w-4 h-4" /> New Journey
        </button>
      </div>

      {/* Navigation tabs inside the active workspace */}
      <div className="flex gap-4 border-b border-stone-100 dark:border-stone-900 text-xs font-sans">
        <button
          onClick={() => setWorkspaceTab('overview')}
          className={`pb-2 border-b-2 cursor-pointer ${
            workspaceTab === 'overview' ? 'border-amber-900 text-amber-900' : 'border-transparent text-stone-400'
          }`}
        >
          Overview & Questions
        </button>
        <button
          onClick={() => {
            setWorkspaceTab('chapters');
            if (activeJourney.chapters[0] && !selectedChapterId) {
              setSelectedChapterId(activeJourney.chapters[0].id);
            }
          }}
          className={`pb-2 border-b-2 cursor-pointer ${
            workspaceTab === 'chapters' ? 'border-amber-900 text-amber-900' : 'border-transparent text-stone-400'
          }`}
        >
          Chapters Outline ({activeJourney.chapters.length})
        </button>
        <button
          onClick={() => setWorkspaceTab('tasks')}
          className={`pb-2 border-b-2 cursor-pointer ${
            workspaceTab === 'tasks' ? 'border-amber-900 text-amber-900' : 'border-transparent text-stone-400'
          }`}
        >
          Task Matrix ({activeJourney.tasks.length})
        </button>
        <button
          onClick={() => setWorkspaceTab('timeline')}
          className={`pb-2 border-b-2 cursor-pointer ${
            workspaceTab === 'timeline' ? 'border-amber-900 text-amber-900' : 'border-transparent text-stone-400'
          }`}
        >
          Timeline & Milestones
        </button>
      </div>

      {/* OVERVIEW & QUESTIONS TAB */}
      {workspaceTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Questions board */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-stone-950 p-5 border border-stone-200 dark:border-stone-800 rounded-lg space-y-4">
              <h3 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-800" /> Active Research Questions
              </h3>
              
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {activeJourney.questions.map((q, idx) => (
                  <div key={idx} className="p-3 bg-stone-50 dark:bg-stone-900/40 rounded border border-stone-200/50 dark:border-stone-800 text-xs font-sans text-stone-700 leading-normal flex gap-3">
                    <span className="font-mono text-[10px] bg-amber-100 dark:bg-amber-950/50 text-amber-800 text-center w-5 h-5 flex items-center justify-center rounded-full shrink-0">Q{idx + 1}</span>
                    <span>{q}</span>
                  </div>
                ))}

                {activeJourney.questions.length === 0 && (
                  <p className="font-sans text-xs text-stone-400 italic">No research questions added yet.</p>
                )}
              </div>

              <form onSubmit={handleAddQuestion} className="flex gap-2 border-t border-stone-100 pt-3">
                <input
                  type="text"
                  placeholder="Formulate a new active research question..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full font-sans text-xs p-2 border border-stone-200 rounded"
                  required
                />
                <button
                  type="submit"
                  className="font-sans text-xs bg-stone-900 text-white px-3 py-1.5 rounded"
                >
                  Add
                </button>
              </form>
            </div>
          </div>

          {/* Connected literature sidebar */}
          <div className="lg:col-span-1 bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 p-5 rounded-lg space-y-4 h-fit">
            <h4 className="font-sans font-medium text-xs text-amber-800 tracking-wide flex items-center gap-1">
              <Link className="w-3.5 h-3.5" /> Associated References
            </h4>
            <p className="font-sans text-[11px] text-stone-500">Papers linked directly to this investigation context.</p>
            
            <div className="space-y-2">
              {papers.filter(p => activeJourney.linkedPaperIds.includes(p.id)).map(p => (
                <div key={p.id} className="p-2 bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded font-sans text-xs space-y-1">
                  <p className="font-semibold text-stone-800 line-clamp-1">{p.title}</p>
                  <p className="text-[10px] text-stone-400 truncate">{p.authors}</p>
                </div>
              ))}

              {papers.filter(p => activeJourney.linkedPaperIds.includes(p.id)).length === 0 && (
                <p className="font-sans text-xs text-stone-400 italic">No literature references linked. Select library or drag concept nodes on the graph.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHAPTERS OUTLINE TAB */}
      {workspaceTab === 'chapters' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chapter selector lists */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-stone-950 border border-stone-200 rounded-lg p-4 space-y-3">
              <h4 className="font-sans font-medium text-xs text-stone-500 tracking-wide">Chapter outlines</h4>
              
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {activeJourney.chapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChapterId(ch.id)}
                    className={`w-full text-left p-3 rounded font-sans text-xs flex justify-between items-center ${
                      selectedChapterId === ch.id
                        ? 'bg-amber-50/40 border border-amber-900/20 text-stone-900'
                        : 'bg-transparent text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span className="truncate pr-2">{idx + 1}. {ch.title}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-mono capitalize shrink-0 ${
                      ch.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                      ch.status === 'drafting' ? 'bg-amber-100 text-amber-800' :
                      ch.status === 'review' ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {ch.status.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleAddChapter} className="flex gap-2 border-t border-stone-100 pt-3">
                <input
                  type="text"
                  placeholder="New chapter title..."
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  className="w-full font-sans text-xs p-2 border border-stone-200 rounded"
                  required
                />
                <button
                  type="submit"
                  className="font-sans text-xs bg-stone-900 text-white px-3 py-2 rounded shrink-0"
                >
                  Create
                </button>
              </form>
            </div>
          </div>

          {/* Chapter writing / editing workbench */}
          <div className="lg:col-span-2">
            {selectedChapterId ? (
              (() => {
                const chapter = activeJourney.chapters.find(ch => ch.id === selectedChapterId);
                if (!chapter) return null;
                return (
                  <div className="bg-white dark:bg-stone-950 border border-stone-200 rounded-lg p-5 space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                      <h3 className="font-sans font-bold text-stone-950 text-sm">{chapter.title} Writing Sandbox</h3>
                      
                      <select
                        value={chapter.status}
                        onChange={(e) => handleUpdateChapterStatus(chapter.id, e.target.value as Chapter['status'])}
                        className="font-sans text-xs p-1.5 border border-stone-200 rounded text-stone-800"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="drafting">Drafting</option>
                        <option value="review">Under Review</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <textarea
                      value={chapter.content}
                      onChange={(e) => handleUpdateChapterContent(chapter.id, e.target.value)}
                      className="w-full font-serif text-sm p-4 border border-stone-200 rounded bg-amber-50/5 text-stone-800 h-80 focus:outline-none focus:ring-1 focus:ring-amber-700/20 font-light leading-relaxed"
                      placeholder="Use this sandbox to outline arguments, structure research paragraphs, and write draft narratives... Your writing is saved locally."
                    />
                  </div>
                );
              })()
            ) : (
              <div className="bg-white border border-stone-200 rounded-lg p-12 text-left text-stone-400 font-sans text-xs">
                Select a chapter outline to write or review drafting progress.
              </div>
            )}
          </div>

        </div>
      )}

      {/* TASK MATRIX TAB */}
      {workspaceTab === 'tasks' && (
        <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-lg p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="font-sans font-semibold text-stone-950 text-sm flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-600" /> Research Task Checklist
            </h3>
            <span className="font-mono text-xs text-stone-400">
              {activeJourney.tasks.filter(t => t.completed).length}/{activeJourney.tasks.length} Resolved
            </span>
          </div>

          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {activeJourney.tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task.id)}
                className={`p-3.5 border rounded-lg cursor-pointer transition-all flex items-center justify-between font-sans text-xs ${
                  task.completed
                    ? 'border-emerald-100 bg-emerald-50/20 text-stone-400 dark:bg-emerald-950/10'
                    : 'border-stone-150 bg-white hover:border-stone-250 text-stone-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {task.completed ? (
                    <Check className="w-4 h-4 text-emerald-600 border border-emerald-600 rounded-full shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-stone-300 inline-block shrink-0"></span>
                  )}
                  <span className={task.completed ? 'line-through' : ''}>{task.text}</span>
                </div>

                {task.dueDate && (
                  <span className="font-mono text-[10px] text-stone-400 shrink-0">
                    Due {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}

            {activeJourney.tasks.length === 0 && (
              <p className="font-sans text-xs text-stone-400 italic text-left py-6">No tasks mapped on your journey yet.</p>
            )}
          </div>

          <form onSubmit={handleAddTask} className="flex gap-2 border-t border-stone-100 pt-4 flex-col sm:flex-row">
            <input
              type="text"
              placeholder="Record a micro-task or academic deliverable..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="flex-1 font-sans text-xs p-2.5 border border-stone-200 rounded"
              required
            />
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="font-sans text-xs p-2.5 border border-stone-200 rounded"
            />
            <button
              type="submit"
              className="font-sans text-xs bg-amber-950 text-white px-4 py-2 rounded hover:bg-amber-900"
            >
              Log Task
            </button>
          </form>
        </div>
      )}

      {/* TIMELINE TAB */}
      {workspaceTab === 'timeline' && (
        <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-lg p-6 space-y-6">
          <h3 className="font-sans font-semibold text-stone-950 text-sm flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" /> Milestone & Submission Timeline
          </h3>

          {/* Interactive timeline map */}
          <div className="relative pl-6 border-l-2 border-stone-100 space-y-6 max-h-[350px] overflow-y-auto">
            {activeJourney.timeline.map((event) => (
              <div key={event.id} className="relative">
                {/* Custom icon positioning */}
                <span className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white shadow ${
                  event.type === 'milestone' ? 'bg-amber-500' :
                  event.type === 'meeting' ? 'bg-blue-500' :
                  event.type === 'submission' ? 'bg-rose-500' : 'bg-stone-500'
                }`}></span>

                <div className="space-y-1 font-sans">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-stone-400">{event.date}</span>
                    <span className="font-semibold text-xs text-stone-900">{event.title}</span>
                    <span className="text-[9px] capitalize font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-400">{event.type}</span>
                  </div>
                  <p className="text-xs text-stone-500 leading-normal">{event.description}</p>
                </div>
              </div>
            ))}

            {activeJourney.timeline.length === 0 && (
              <p className="font-sans text-xs text-stone-400 italic py-6">No timeline events or upcoming submissions logged.</p>
            )}
          </div>

          <form onSubmit={handleAddTimelineEvent} className="border-t border-stone-100 pt-4 space-y-3">
            <h4 className="font-sans font-semibold text-xs text-stone-850">Schedule Milestone Event</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="date"
                value={newTimelineDate}
                onChange={(e) => setNewTimelineDate(e.target.value)}
                className="font-sans text-xs p-2 border border-stone-200 rounded"
                required
              />
              <input
                type="text"
                placeholder="Event Title (e.g., Committee Review...)"
                value={newTimelineTitle}
                onChange={(e) => setNewTimelineTitle(e.target.value)}
                className="font-sans text-xs p-2 border border-stone-200 rounded"
                required
              />
              <select
                value={newTimelineType}
                onChange={(e) => setNewTimelineType(e.target.value as TimelineEvent['type'])}
                className="font-sans text-xs p-2 border border-stone-200 rounded"
              >
                <option value="milestone">Academic Milestone</option>
                <option value="meeting">Supervisor Meeting</option>
                <option value="draft">Draft Submission</option>
                <option value="submission">Conference/Funder Submission</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Short Description or Goals..."
              value={newTimelineDesc}
              onChange={(e) => setNewTimelineDesc(e.target.value)}
              className="w-full font-sans text-xs p-2 border border-stone-200 rounded"
            />
            <button
              type="submit"
              className="font-sans text-xs bg-stone-900 text-white px-3 py-1.5 rounded"
            >
              Deploy Timeline Event
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
