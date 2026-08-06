/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Paper } from '../types';
import { Sparkles, Library, HelpCircle, RefreshCw, AlertTriangle, BookOpen, MessageSquare, List, ShieldCheck } from 'lucide-react';
import ResearchIntegrityBanner from './ResearchIntegrityBanner';
import { postWithAiRouting } from '../lib/localAiService';

interface WritingCompanionProps {
  papers: Paper[];
}

export default function WritingCompanion({ papers }: WritingCompanionProps) {
  const [draftContent, setDraftContent] = useState<string>(() => {
    return localStorage.getItem('draft_companion_text') || 
      "Writing academic papers is a high-cognitive-load task. Researchers must weave together multiple lines of evidence, theoretical models, and empirical data, all while keeping citations strictly correct. Because attention is all you need, neural network sequence structures can be simplified. It has been proven that metric-centric gamification in research applications induces severe anxiety and disrupts flow states, causing imposter syndrome thoughts. Therefore, Zotero and Mendeley could be designed differently.";
  });

  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'unsupported' | 'supported' | 'contradictions' | 'suggestions'>('unsupported');

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setDraftContent(text);
    localStorage.setItem('draft_companion_text', text);
  };

  const handleAnalyzeDraft = async () => {
    if (!draftContent) return;
    setLoadingAnalysis(true);

    try {
      // Package library papers details for context
      const libraryContext = papers.map((p) => ({
        id: p.id,
        title: p.title,
        authors: p.authors,
        structuredSummary: p.structuredSummary,
      }));

      const res = await postWithAiRouting('/api/gemini/analyze-draft', {
        draftText: draftContent,
        papersInLibrary: libraryContext,
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full" id="writing-companion-module">
      <ResearchIntegrityBanner />
      
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* LEFT COLUMN: Distraction-free draft editor */}
      <div className="flex-1 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 flex flex-col justify-between">
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex justify-between items-center pb-3 border-b border-stone-150">
            <div>
              <h2 className="font-sans font-medium text-stone-900 dark:text-stone-100 text-base">Quiet Drafting Desk</h2>
              <p className="font-sans text-[11px] text-stone-400">Write freely. Your work is saved locally in real-time.</p>
            </div>
            
            <button
              onClick={handleAnalyzeDraft}
              disabled={loadingAnalysis || !draftContent}
              className="font-sans text-xs bg-[#912A4A] text-white px-3.5 py-2 rounded hover:bg-[#78223d] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#912A4A] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950"
            >
              {loadingAnalysis ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Cross-Reference Library
            </button>
          </div>

          <label htmlFor="draft-companion-textarea" className="sr-only">Academic Paper Draft Editor</label>
          <textarea
            id="draft-companion-textarea"
            value={draftContent}
            onChange={handleTextChange}
            className="flex-1 w-full font-serif font-light text-stone-800 dark:text-stone-200 text-sm p-4 bg-stone-50/50 dark:bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-[#912A4A] focus:ring-offset-2 dark:focus:ring-offset-stone-950 resize-none min-h-[350px] leading-relaxed"
            placeholder="Outline your thoughts, connect concepts, and type drafts here... When ready, click 'Cross-Reference Library' on the top right to verify claims against your academic database."
          />
        </div>

        <div className="pt-4 border-t border-stone-150/60 flex justify-between items-center text-[10px] text-stone-400 font-sans">
          <span>Words: {draftContent.trim() ? draftContent.trim().split(/\s+/).length : 0} · Characters: {draftContent.length}</span>
          <span>Draft safe · Offline first</span>
        </div>
      </div>

      {/* RIGHT COLUMN: AI Scholar Inspector Panel */}
      <div className="w-full lg:w-96 bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-lg p-5 flex flex-col">
        <div className="flex items-center gap-2 mb-4 border-b border-stone-200 dark:border-stone-800 pb-3">
          <Library className="w-4 h-4 text-[#912A4A] dark:text-rose-400" />
          <h3 className="font-sans font-medium text-xs text-[#912A4A] dark:text-rose-400 tracking-wide">AI Scholar Claim-Checker</h3>
        </div>

        {loadingAnalysis ? (
          <div className="flex-1 flex flex-col items-start justify-start py-16 space-y-3">
            <div className="w-5 h-5 border-2 border-[#912A4A] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-sans text-xs text-stone-500 italic text-left px-4">Scanning your library, checking local findings, tracking evidence lines...</p>
          </div>
        ) : analysisResult ? (
          <div className="flex-1 flex flex-col">
            {/* Sub-tabs inside the claims checker */}
            <div className="grid grid-cols-4 gap-1 border-b border-stone-200 dark:border-stone-800 pb-3 mb-4 text-[10px] font-sans">
              <button
                onClick={() => setActiveAnalysisTab('unsupported')}
                className={`py-1 rounded text-left cursor-pointer ${
                  activeAnalysisTab === 'unsupported' ? 'bg-[#912A4A]/10 text-[#912A4A] font-semibold' : 'text-stone-400'
                }`}
                title="Unsupported claims in draft"
              >
                Unsupported
              </button>
              <button
                onClick={() => setActiveAnalysisTab('supported')}
                className={`py-1 rounded text-left cursor-pointer ${
                  activeAnalysisTab === 'supported' ? 'bg-[#912A4A]/10 text-[#912A4A] font-semibold' : 'text-stone-400'
                }`}
                title="Claims supported by library"
              >
                Supported
              </button>
              <button
                onClick={() => setActiveAnalysisTab('contradictions')}
                className={`py-1 rounded text-left cursor-pointer ${
                  activeAnalysisTab === 'contradictions' ? 'bg-[#912A4A]/10 text-[#912A4A] font-semibold' : 'text-stone-400'
                }`}
                title="Contradictions in library"
              >
                Debates
              </button>
              <button
                onClick={() => setActiveAnalysisTab('suggestions')}
                className={`py-1 rounded text-left cursor-pointer ${
                  activeAnalysisTab === 'suggestions' ? 'bg-[#912A4A]/10 text-[#912A4A] dark:text-rose-300 font-semibold' : 'text-stone-400'
                }`}
                title="Argument outline suggestions"
              >
                Structure
              </button>
            </div>

            {/* Render selected check panel */}
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[380px] pr-1 font-sans">
              {activeAnalysisTab === 'unsupported' && (
                <div className="space-y-3">
                  {analysisResult.unsupportedClaims?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-red-50/50 dark:bg-red-950/10 border border-red-150 dark:border-red-900/40 rounded-lg space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-semibold text-[10px]">
                        <AlertTriangle className="w-3.5 h-3.5" /> Unsupported Statement
                      </div>
                      <p className="italic text-stone-700 dark:text-stone-300">"{item.claimText}"</p>
                      <p className="text-stone-500 text-[11px]"><strong className="text-stone-600 dark:text-stone-400">Issue:</strong> {item.issue}</p>
                      <p className="text-emerald-700 dark:text-emerald-400 text-[11px]"><strong className="text-stone-600 dark:text-stone-400">Recommendation:</strong> {item.recommendation}</p>
                    </div>
                  ))}

                  {(!analysisResult.unsupportedClaims || analysisResult.unsupportedClaims.length === 0) && (
                    <p className="text-left py-12 text-stone-400 text-xs italic">All claims in draft possess trace evidence lines!</p>
                  )}
                </div>
              )}

              {activeAnalysisTab === 'supported' && (
                <div className="space-y-3">
                  {analysisResult.supportedByLibrary?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-emerald-50/45 dark:bg-emerald-950/10 border border-emerald-150 dark:border-emerald-900/40 rounded-lg space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-[10px]">
                        <BookOpen className="w-3.5 h-3.5" /> Supported by Library
                      </div>
                      <p className="italic text-stone-700 dark:text-stone-300">"{item.claimText}"</p>
                      <p className="text-stone-600 dark:text-stone-400 text-[11px]"><strong className="text-stone-700 dark:text-stone-300">Evidence Source:</strong> {item.paperTitle}</p>
                      <p className="text-stone-500 text-[11px]"><strong className="text-stone-700 dark:text-stone-300">How:</strong> {item.howItSupports}</p>
                    </div>
                  ))}

                  {(!analysisResult.supportedByLibrary || analysisResult.supportedByLibrary.length === 0) && (
                    <p className="text-left py-12 text-stone-400 text-xs italic">No matching library evidence found for active statements.</p>
                  )}
                </div>
              )}

              {activeAnalysisTab === 'contradictions' && (
                <div className="space-y-3">
                  {analysisResult.contradictoryEvidence?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-[#912A4A]/5 dark:bg-[#912A4A]/10 border border-[#912A4A]/20 dark:border-[#912A4A]/40 rounded-lg space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-[#912A4A] dark:text-rose-400 font-semibold text-[10px]">
                        <MessageSquare className="w-3.5 h-3.5" /> Relational Contradiction
                      </div>
                      <p className="italic text-stone-700 dark:text-stone-300">"{item.draftClaim}"</p>
                      <p className="text-stone-600 dark:text-stone-400 text-[11px]"><strong className="text-[#912A4A] dark:text-rose-400">Contradictory Source:</strong> {item.paperTitle}</p>
                      <p className="text-stone-500 text-[11px]"><strong className="text-stone-700 dark:text-stone-300">Details:</strong> {item.conflictDetails}</p>
                    </div>
                  ))}

                  {(!analysisResult.contradictoryEvidence || analysisResult.contradictoryEvidence.length === 0) && (
                    <p className="text-left py-12 text-stone-400 text-xs italic">No contradictory citations flagged in your library.</p>
                  )}
                </div>
              )}

              {activeAnalysisTab === 'suggestions' && (
                <div className="bg-white dark:bg-stone-950 p-4 border border-stone-200 rounded-lg space-y-3 text-xs">
                  <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 mb-2">
                    <List className="w-4 h-4 text-[#912A4A]" /> Structure Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {analysisResult.outlineSuggestions?.map((item: string, idx: number) => (
                      <li key={idx} className="text-stone-600 dark:text-stone-400 leading-relaxed flex items-start gap-2">
                        <span className="font-mono text-[9px] bg-stone-100 dark:bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded inline-block mt-0.5">{idx + 1}</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-start justify-start py-24 text-left text-stone-400 dark:text-stone-500 font-sans text-xs">
            <HelpCircle className="w-8 h-8 text-stone-300 mb-2" />
            <p className="px-4">Click "Cross-Reference Library" on the left to verify academic statement support, track contradictions, and organize argument hierarchies.</p>
          </div>
        )}
      </div>

      </div>
    </div>
  );
}
