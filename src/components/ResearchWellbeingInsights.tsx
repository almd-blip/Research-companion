/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResearchWellbeingInsight, 
  UserUploadedDoc 
} from '../types/wellbeingInsights';
import { INITIAL_WELLBEING_INSIGHTS } from '../data/wellbeingInsightsData';
import { getUserLibrary } from '../lib/userLibraryStorage';
import ArticleReaderModal from './ArticleReaderModal';
import MyResearchLibrary from './MyResearchLibrary';

export default function ResearchWellbeingInsights() {
  const [insights, setInsights] = useState<ResearchWellbeingInsight[]>(() => {
    const raw = localStorage.getItem('second_thought_insights');
    return raw ? JSON.parse(raw) : INITIAL_WELLBEING_INSIGHTS;
  });

  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'insights' | 'my_library'>('insights');
  const [evidenceTab, setEvidenceTab] = useState<'academic' | 'creative' | 'additional'>('academic');

  // Progressive disclosure states (matching About page layout)
  const [openInsights, setOpenInsights] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (INITIAL_WELLBEING_INSIGHTS[0]) {
      initial[INITIAL_WELLBEING_INSIGHTS[0].id] = true;
    }
    return initial;
  });

  const toggleInsight = (id: string) => {
    setOpenInsights((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const setAllInsightsOpen = (open: boolean) => {
    const nextState: Record<string, boolean> = {};
    insights.forEach((i) => {
      nextState[i.id] = open;
    });
    setOpenInsights(nextState);
  };

  // Reader Modal State
  const [readerArticle, setReaderArticle] = useState<any | null>(null);

  // Editable summary state
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  // User library sync
  const [userDocs, setUserDocs] = useState<UserUploadedDoc[]>([]);

  useEffect(() => {
    setUserDocs(getUserLibrary());
    const handleSync = () => {
      setUserDocs(getUserLibrary());
    };
    window.addEventListener('user_library_updated', handleSync);
    return () => {
      window.removeEventListener('user_library_updated', handleSync);
    };
  }, []);

  const handleSaveInsights = (updated: ResearchWellbeingInsight[]) => {
    setInsights(updated);
    localStorage.setItem('second_thought_insights', JSON.stringify(updated));
  };

  const selectedInsight = insights.find(i => i.id === selectedInsightId) || null;

  const handleStartEditSummary = (insight: ResearchWellbeingInsight) => {
    setSummaryText(insight.summary);
    setEditingSummary(true);
  };

  const handleSaveSummary = () => {
    if (!selectedInsight) return;
    const updated = insights.map(i => i.id === selectedInsight.id ? { ...i, summary: summaryText } : i);
    handleSaveInsights(updated);
    setEditingSummary(false);
  };

  const filteredInsights = insights.filter(ins => {
    const query = searchQuery.toLowerCase();
    return (
      ins.title.toLowerCase().includes(query) ||
      ins.researchQuestion.toLowerCase().includes(query) ||
      ins.category.toLowerCase().includes(query) ||
      ins.summary.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans px-2 sm:px-4 text-left" id="research-wellbeing-insights-root">
      
      {/* Header (Matching About Page Layout) */}
      <div className="pb-4" id="wellbeing-insights-header-container">
        <div className="space-y-1.5" id="wellbeing-insights-header-text">
          <h1 className="font-sans font-medium tracking-tight text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 flex items-center gap-3" id="wellbeing-insights-title">
            <span>Wellbeing Research Insights</span>
          </h1>
          <p className="font-sans text-stone-500 dark:text-stone-400 text-xs sm:text-sm leading-relaxed" id="wellbeing-insights-subtitle">
            Curated evidence library exploring the human experience of writing, research, creative practice, cognition, identity, and personal wellbeing.
          </p>
          <div className="flex items-center gap-1.5 pt-1.5 text-xs font-sans text-stone-400 dark:text-stone-500" id="wellbeing-insights-meta">
            <span>Open Access papers, evidence syntheses & extended references</span>
          </div>
        </div>
      </div>

      {/* Control bar (Matching About Page Section Controls) */}
      <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 dark:text-stone-400 pb-2 gap-y-2" id="wellbeing-insights-controls">
        <div className="flex items-center gap-3 font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className={`hover:text-[#1d9e75] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75] flex items-center gap-1.5 ${
              activeTab === 'insights' ? 'text-[#1d9e75] dark:text-[#28c093] font-semibold underline underline-offset-4' : ''
            }`}
            id="wellbeing-insights-tab-directory"
          >
            <span>Insights Directory</span>
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setActiveTab('my_library')}
            className={`hover:text-[#1d9e75] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75] flex items-center gap-1.5 ${
              activeTab === 'my_library' ? 'text-[#1d9e75] dark:text-[#28c093] font-semibold underline underline-offset-4' : ''
            }`}
            id="wellbeing-insights-tab-library"
          >
            <span>My Research Library</span>
            {userDocs.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#1d9e75] text-white font-bold">
                {userDocs.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'insights' && !selectedInsight && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAllInsightsOpen(true)}
              className="hover:text-[#1d9e75] dark:hover:text-[#28c093] transition-colors cursor-pointer underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75]"
              id="wellbeing-insights-expand-all-btn"
            >
              Expand All
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setAllInsightsOpen(false)}
              className="hover:text-[#1d9e75] dark:hover:text-[#28c093] transition-colors cursor-pointer underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75]"
              id="wellbeing-insights-collapse-all-btn"
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: MY RESEARCH LIBRARY */}
      {activeTab === 'my_library' && (
        <MyResearchLibrary 
          insights={insights}
          onOpenArticleReader={(doc) => setReaderArticle({
            id: doc.id,
            title: doc.title,
            authors: doc.authors,
            year: doc.year,
            journal: doc.filename,
            licence: 'User Uploaded Copy',
            source: 'Local Storage',
            abstract: doc.notes || 'User uploaded research copy',
            keywords: doc.tags,
            fullText: doc.textContent,
            researchType: 'user paper'
          })}
        />
      )}

      {/* VIEW 2: INSIGHTS DIRECTORY (Unboxed Progressive Disclosure List) */}
      {activeTab === 'insights' && !selectedInsight && (
        <div className="space-y-6" id="wellbeing-insights-directory">
          
          {/* Unboxed Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2">
            <div className="relative flex-grow max-w-md">
              <input
                type="text"
                placeholder="Search research evidence, topics, authors or DOIs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-md bg-stone-50 dark:bg-stone-900/40 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-[#1d9e75] text-stone-800 dark:text-stone-200"
              />
            </div>

            <div className="text-xs text-stone-500 dark:text-stone-400 font-sans flex items-center gap-1.5">
              <span>Offline Open-Access & Extended Evidence</span>
            </div>
          </div>

          {/* Unboxed Progressive Disclosure List (Matching About Page) */}
          <div className="space-y-0" id="wellbeing-insights-principles-list">
            {filteredInsights.map((insight) => {
              const isOpen = openInsights[insight.id];
              const openAccessCount = insight.embeddedArticles.length;
              const extendedCount = insight.additionalSources.length;
              const userAttachedCount = userDocs.filter(d => d.attachedInsightIds?.includes(insight.id)).length;

              return (
                <React.Fragment key={insight.id}>
                  <div className="py-2 text-left" id={`wellbeing-insight-item-${insight.id}`}>
                    <button
                      type="button"
                      onClick={() => toggleInsight(insight.id)}
                      aria-expanded={isOpen}
                      aria-controls={`wellbeing-insight-content-${insight.id}`}
                      className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950 rounded-sm py-1 cursor-pointer group"
                      id={`wellbeing-insight-btn-${insight.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="font-sans font-semibold text-base sm:text-lg tracking-tight text-stone-900 dark:text-stone-100 group-hover:text-[#1d9e75] dark:group-hover:text-[#28c093] transition-colors">
                            {insight.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold tracking-wider text-[#1d9e75] dark:text-[#28c093]">
                              {insight.category}
                            </span>
                            <span className="text-stone-300 dark:text-stone-700">•</span>
                            <span className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                              {insight.readingTime}
                            </span>
                          </div>
                        </div>
                        <span
                          className="text-lg font-mono font-medium text-[#1d9e75] dark:text-[#28c093] shrink-0 leading-none select-none ml-2 pt-0.5"
                          aria-hidden="true"
                        >
                          {isOpen ? '−' : '+'}
                        </span>
                      </div>

                      {/* 1st-layer statement (always visible, 16pt space below title) */}
                      <p className="mt-[16pt] font-sans text-sm sm:text-base text-stone-800 dark:text-stone-200 font-normal leading-relaxed">
                        "{insight.researchQuestion}"
                      </p>
                    </button>

                    {/* 2nd-layer full text (revealed on expansion with smooth height transition) */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`wellbeing-insight-content-${insight.id}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{
                            height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                            opacity: { duration: 0.25, ease: 'easeInOut', delay: 0.05 }
                          }}
                          className="overflow-hidden space-y-4 pt-3 pb-2"
                        >
                          <p className="font-sans text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed italic">
                            {insight.summary}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                            <div className="flex items-center gap-3 font-mono text-stone-500">
                              {openAccessCount > 0 && (
                                <span className="text-[#1d9e75] dark:text-[#28c093] font-semibold flex items-center gap-1">
                                  {openAccessCount} CC Papers
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                {extendedCount} Extended
                              </span>
                              {userAttachedCount > 0 && (
                                <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                                  {userAttachedCount} Uploaded
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInsightId(insight.id);
                                setEvidenceTab('academic');
                              }}
                              className="font-sans font-semibold text-xs text-[#1d9e75] dark:text-[#28c093] hover:underline flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75]"
                            >
                              <span>Explore Evidence & Read Papers →</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </React.Fragment>
              );
            })}

            {filteredInsights.length === 0 && (
              <div className="py-12 text-center text-stone-400 dark:text-stone-500 text-xs sm:text-sm italic border border-dashed border-stone-200 dark:border-stone-800 rounded-md">
                No wellbeing research insights match your search query. Try searching for terms like "impostor", "writing", "wellbeing", or "burnout".
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: SINGLE INSIGHT FULL DETAIL (Unboxed Layout) */}
      {activeTab === 'insights' && selectedInsight && (
        <div className="space-y-6 text-left py-2" id="wellbeing-single-insight-view">
          
          {/* Back button */}
          <div className="flex items-center justify-between pb-2">
            <button
              type="button"
              onClick={() => setSelectedInsightId(null)}
              className="text-xs font-sans font-semibold text-stone-700 dark:text-stone-300 hover:text-[#1d9e75] dark:hover:text-[#28c093] transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75]"
            >
              <span>← Back to Insights Directory</span>
            </button>

            <span className="text-xs font-mono text-stone-400">
              Insight: {selectedInsight.id}
            </span>
          </div>

          {/* Unboxed Header */}
          <div className="space-y-3">
            <h1 className="font-sans font-medium tracking-tight text-2xl sm:text-3xl text-stone-900 dark:text-stone-100" id="single-insight-title">
              {selectedInsight.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-[#1d9e75] dark:text-[#28c093]">
                {selectedInsight.category}
              </span>
              <span className="text-xs text-stone-500 font-sans flex items-center gap-1">
                {selectedInsight.readingTime}
              </span>
            </div>

            {/* Core Research Question (Unboxed) */}
            <div className="p-4 bg-stone-50 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 rounded-md space-y-1">
              <span className="text-[11px] font-mono font-semibold tracking-wider text-[#1d9e75] dark:text-[#28c093]">
                Core research question
              </span>
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200 flex items-start gap-2">
                <span>"{selectedInsight.researchQuestion}"</span>
              </p>
            </div>

            {/* Second Thought Plain-English Summary (Unboxed) */}
            <div className="p-4 sm:p-5 bg-stone-50/50 dark:bg-stone-900/30 border border-stone-200/80 dark:border-stone-800 rounded-md space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-sans font-semibold text-sm text-[#1d9e75] dark:text-[#28c093] flex items-center gap-2">
                  <span>Second Thought Plain-English Summary</span>
                </h3>
                
                {!editingSummary ? (
                  <button
                    type="button"
                    onClick={() => handleStartEditSummary(selectedInsight)}
                    className="text-xs text-stone-500 hover:text-[#1d9e75] flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <span>Edit Summary</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveSummary}
                      className="px-2.5 py-1 text-xs rounded bg-[#1d9e75] text-white font-semibold flex items-center gap-1"
                    >
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSummary(false)}
                      className="text-xs text-stone-400 hover:text-stone-600"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {!editingSummary ? (
                <div className="text-xs sm:text-sm leading-relaxed text-stone-700 dark:text-stone-300 space-y-2 whitespace-pre-wrap font-sans">
                  {selectedInsight.summary || 'Plain-English summary coming soon.'}
                </div>
              ) : (
                <textarea
                  rows={6}
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 border border-[#1d9e75] rounded-md bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* RESEARCH EVIDENCE SECTION (Unboxed Tabs) */}
          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
              <h3 className="font-sans font-semibold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Research Evidence & Papers</span>
              </h3>

              {/* Evidence Category Controls */}
              <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 font-medium">
                <button
                  type="button"
                  onClick={() => setEvidenceTab('academic')}
                  className={`hover:text-[#1d9e75] transition-colors cursor-pointer ${
                    evidenceTab === 'academic' ? 'text-[#1d9e75] dark:text-[#28c093] font-semibold underline underline-offset-4' : ''
                  }`}
                >
                  Research Literature
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setEvidenceTab('creative')}
                  className={`hover:text-[#1d9e75] transition-colors cursor-pointer ${
                    evidenceTab === 'creative' ? 'text-[#1d9e75] dark:text-[#28c093] font-semibold underline underline-offset-4' : ''
                  }`}
                >
                  Creative Practice
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setEvidenceTab('additional')}
                  className={`hover:text-[#1d9e75] transition-colors cursor-pointer ${
                    evidenceTab === 'additional' ? 'text-[#1d9e75] dark:text-[#28c093] font-semibold underline underline-offset-4' : ''
                  }`}
                >
                  Extended Sources & Uploads
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: ACADEMIC RESEARCH */}
            {evidenceTab === 'academic' && (
              <div className="space-y-4">
                {/* Embedded Open Access Articles */}
                {selectedInsight.embeddedArticles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-[#1d9e75] dark:text-[#28c093] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <span>Layer 1: Embedded Open-Access Articles (Full Text Included)</span>
                    </h4>

                    {selectedInsight.embeddedArticles.map((art) => (
                      <div 
                        key={art.id}
                        className="p-4 bg-stone-50 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 rounded-md space-y-3 text-left"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#1d9e75] text-white">
                            Available Offline ({art.licence})
                          </span>
                          <span className="text-xs font-mono text-stone-500">
                            Type: {art.researchType}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-sans font-semibold text-base text-stone-900 dark:text-stone-100">
                            {art.title}
                          </h4>
                          <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 font-medium">
                            {art.authors} ({art.year}) • <span className="italic">{art.journal}</span>
                          </p>
                        </div>

                        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed italic border-l-2 border-[#1d9e75] pl-3 py-1">
                          "{art.abstract}"
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                          <span className="text-[11px] font-mono text-stone-500">DOI: {art.doi}</span>
                          <button
                            type="button"
                            onClick={() => setReaderArticle(art)}
                            className="px-3.5 py-1.5 rounded-md bg-[#1d9e75] hover:bg-[#16815f] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9e75]"
                          >
                            <span>Read Full Text Offline</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Research Sources */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <span>Literature Citations & Publishers</span>
                  </h4>

                  {selectedInsight.additionalSources.filter(s => s.category === 'academic').map((src) => (
                    <div 
                      key={src.id}
                      className="p-4 bg-stone-50 dark:bg-stone-900/30 border border-stone-200/80 dark:border-stone-800 rounded-md space-y-2 text-left"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {src.licenceStatus}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500">
                          Type: {src.researchType}
                        </span>
                      </div>

                      <h4 className="font-sans font-semibold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                        {src.title}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                        {src.authors} ({src.year}) • <span className="italic">{src.publication}</span>
                      </p>

                      <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                        <strong className="text-stone-800 dark:text-stone-200">Relevance:</strong> {src.researchRelevance}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        {src.doi && (
                          <a
                            href={src.doi}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#1d9e75] hover:underline font-mono flex items-center gap-1"
                          >
                            DOI Link ↗
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('my_library');
                          }}
                          className="px-3 py-1 rounded-md border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs transition-colors flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <span>Upload Your Own Copy</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: CREATIVE PRACTICE RESEARCH */}
            {evidenceTab === 'creative' && (
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-[#1d9e75] dark:text-[#28c093] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <span>Creative Practice & Labor Research</span>
                </h4>

                {selectedInsight.additionalSources.filter(s => s.category === 'creative').map((src) => (
                  <div 
                    key={src.id}
                    className="p-4 bg-stone-50 dark:bg-stone-900/30 border border-stone-200/80 dark:border-stone-800 rounded-md space-y-2 text-left"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        {src.licenceStatus}
                      </span>
                      <span className="text-[10px] font-mono text-stone-500">
                        Type: {src.researchType}
                      </span>
                    </div>

                    <h4 className="font-sans font-semibold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                      {src.title}
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                      {src.authors} ({src.year}) • <span className="italic">{src.publication}</span>
                    </p>

                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                      <strong className="text-stone-800 dark:text-stone-200">Relevance:</strong> {src.researchRelevance}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      {src.doi && (
                        <a
                          href={src.doi}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#1d9e75] hover:underline font-mono flex items-center gap-1"
                        >
                          DOI Link ↗
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('my_library');
                        }}
                        className="px-3 py-1 rounded-md border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs transition-colors flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <span>Upload Your Own Copy</span>
                      </button>
                    </div>
                  </div>
                ))}

                {selectedInsight.additionalSources.filter(s => s.category === 'creative').length === 0 && (
                  <div className="p-6 text-center text-xs text-stone-500 italic bg-stone-50 dark:bg-stone-900/30 rounded-md border border-stone-200/60 dark:border-stone-800">
                    Creative practice sources are integrated across the main research literature and extended evidence tabs for this insight.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: ADDITIONAL SOURCES & MY UPLOADS */}
            {evidenceTab === 'additional' && (
              <div className="space-y-6">
                
                {/* Additional sources */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <span>Layer 2: Extended Research Sources (Non-Open Access / Books)</span>
                  </h4>

                  {selectedInsight.additionalSources.map((src) => (
                    <div 
                      key={src.id}
                      className="p-4 bg-stone-50 dark:bg-stone-900/30 border border-stone-200/80 dark:border-stone-800 rounded-md space-y-2 text-left"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {src.licenceStatus}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500">
                          Type: {src.researchType}
                        </span>
                      </div>

                      <h4 className="font-sans font-semibold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                        {src.title}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                        {src.authors} ({src.year}) • <span className="italic">{src.publication}</span>
                      </p>

                      <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                        <strong className="text-stone-800 dark:text-stone-200">Relevance:</strong> {src.researchRelevance}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        {src.doi ? (
                          <a
                            href={src.doi}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#1d9e75] hover:underline font-mono flex items-center gap-1"
                          >
                            DOI Link ↗
                          </a>
                        ) : src.publisherUrl ? (
                          <a
                            href={src.publisherUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#1d9e75] hover:underline font-mono flex items-center gap-1"
                          >
                            Publisher Link ↗
                          </a>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('my_library');
                          }}
                          className="px-3 py-1 rounded-md border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs transition-colors flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <span>Upload Your Own Copy</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* User uploaded papers attached to this insight */}
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-[#1d9e75] dark:text-[#28c093] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <span>Your Uploaded Papers Attached to This Insight</span>
                    </h4>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('my_library');
                      }}
                      className="text-xs text-[#1d9e75] font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Upload & Attach Paper</span>
                    </button>
                  </div>

                  {userDocs.filter(d => d.attachedInsightIds?.includes(selectedInsight.id)).length > 0 ? (
                    userDocs.filter(d => d.attachedInsightIds?.includes(selectedInsight.id)).map(doc => (
                      <div key={doc.id} className="p-3.5 rounded-md bg-stone-50 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between text-xs sm:text-sm">
                        <div className="space-y-0.5 text-left">
                          <p className="font-semibold text-stone-900 dark:text-stone-100">{doc.title}</p>
                          <p className="text-xs text-stone-500">{doc.authors} ({doc.year}) • {doc.filename}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReaderArticle({
                            id: doc.id,
                            title: doc.title,
                            authors: doc.authors,
                            year: doc.year,
                            journal: doc.filename,
                            licence: 'User Uploaded Copy',
                            source: 'Local Storage',
                            abstract: doc.notes || 'User uploaded document',
                            keywords: doc.tags,
                            fullText: doc.textContent,
                            researchType: 'user paper'
                          })}
                          className="px-3 py-1.5 rounded-md bg-[#1d9e75] text-white font-semibold text-xs shrink-0 cursor-pointer hover:bg-[#16815f]"
                        >
                          Read Offline
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs sm:text-sm text-stone-400 dark:text-stone-500 italic text-left">
                      No personal research papers linked to this insight yet. Upload your legally obtained PDFs to read them offline alongside this insight.
                    </p>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* READ ARTICLE MODAL */}
      {readerArticle && (
        <ArticleReaderModal
          article={readerArticle}
          onClose={() => setReaderArticle(null)}
        />
      )}

    </div>
  );
}

