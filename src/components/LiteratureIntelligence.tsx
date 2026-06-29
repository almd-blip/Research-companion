/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Paper } from '../types';
import { Sparkles, Brain, CheckCircle, ShieldAlert, Star, Layers, Shuffle } from 'lucide-react';

interface LiteratureIntelligenceProps {
  papers: Paper[];
  onUpdatePaper: (updated: Paper) => void;
}

export default function LiteratureIntelligence({ papers, onUpdatePaper }: LiteratureIntelligenceProps) {
  const [activeSubTab, setActiveSubTab] = useState<'single' | 'synthesis'>('single');
  const [selectedPaperId, setSelectedPaperId] = useState<string>(papers[0]?.id || '');
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Synthesis states
  const [selectedPaperIdsForSynthesis, setSelectedPaperIdsForSynthesis] = useState<string[]>([]);
  const [synthesisResult, setSynthesisResult] = useState<any>(null);
  const [loadingSynthesis, setLoadingSynthesis] = useState(false);

  const selectedPaper = papers.find((p) => p.id === selectedPaperId);

  const handleGenerateSummary = async () => {
    if (!selectedPaper) return;
    setLoadingSummary(true);

    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedPaper.title,
          authors: selectedPaper.authors,
          abstract: selectedPaper.abstract || '',
          notes: selectedPaper.notes || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated: Paper = {
          ...selectedPaper,
          structuredSummary: data,
        };
        onUpdatePaper(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleToggleSynthesisPaper = (id: string) => {
    setSelectedPaperIdsForSynthesis((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleRunSynthesis = async () => {
    if (selectedPaperIdsForSynthesis.length < 2) return;
    setLoadingSynthesis(true);

    try {
      const papersToSynthesize = papers.filter((p) => selectedPaperIdsForSynthesis.includes(p.id));
      const res = await fetch('/api/gemini/connect-literature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ papers: papersToSynthesize }),
      });

      if (res.ok) {
        const data = await res.json();
        setSynthesisResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSynthesis(false);
    }
  };

  return (
    <div className="space-y-6" id="literature-intelligence-module">
      {/* Sub tabs navigation */}
      <div className="border-b border-stone-200 dark:border-stone-800 flex justify-between items-center pb-2">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveSubTab('single')}
            className={`font-sans text-xs pb-2 border-b-2 font-medium cursor-pointer ${
              activeSubTab === 'single' ? 'border-amber-900 text-amber-900 dark:text-amber-400' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            Single-Paper Meta Analysis
          </button>
          <button
            onClick={() => setActiveSubTab('synthesis')}
            className={`font-sans text-xs pb-2 border-b-2 font-medium cursor-pointer ${
              activeSubTab === 'synthesis' ? 'border-amber-900 text-amber-900 dark:text-amber-400' : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            Multi-Paper Synthesis Workshop
          </button>
        </div>
      </div>

      {/* SINGLE PAPER ANALYSIS SECTION */}
      {activeSubTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls column */}
          <div className="lg:col-span-1 bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 p-5 rounded-lg h-fit space-y-4">
            <div className="space-y-1.5">
              <label className="font-sans font-medium text-[10px] text-stone-400 tracking-wide">Select Document</label>
              <select
                value={selectedPaperId}
                onChange={(e) => setSelectedPaperId(e.target.value)}
                className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800"
              >
                {papers.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {selectedPaper && (
              <div className="space-y-3 pt-3 border-t border-amber-900/10">
                <p className="font-sans text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed italic">
                  "{selectedPaper.abstract || 'No abstract provided.'}"
                </p>

                <button
                  onClick={handleGenerateSummary}
                  disabled={loadingSummary}
                  className="w-full font-sans text-xs bg-amber-900 text-white py-2.5 rounded hover:bg-amber-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {selectedPaper.structuredSummary ? 'Re-generate Intelligence' : 'Generate Structured Summary'}
                </button>
              </div>
            )}
          </div>

          {/* Results/Summary column */}
          <div className="lg:col-span-2 space-y-6">
            {loadingSummary ? (
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-12 text-left flex flex-col items-start justify-start space-y-3">
                <div className="w-6 h-6 border-2 border-amber-900 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-sans text-xs text-stone-500 italic">Gemini is parsing research methods, mapping participants, and assessing evidence strength...</p>
              </div>
            ) : selectedPaper?.structuredSummary ? (
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 space-y-6">
                
                {/* Visual Title Header */}
                <div className="border-b border-stone-100 dark:border-stone-900 pb-4 flex justify-between items-start gap-4">
                  <div>
                    <span className="font-sans text-[9px] text-amber-800 tracking-wide font-semibold">Gemini Intelligence Profile</span>
                    <h2 className="font-sans font-bold text-stone-900 dark:text-stone-100 text-lg leading-snug mt-1">
                      {selectedPaper.title}
                    </h2>
                  </div>
                  
                  {/* Evidence Strength Star Bar */}
                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className="font-sans text-[9px] text-stone-400 tracking-wide mb-1">Evidence Strength</span>
                    <div className="flex gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < (selectedPaper.structuredSummary?.evidenceStrength || 0)
                              ? 'fill-current text-amber-500'
                              : 'text-stone-200 dark:text-stone-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Structured Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100">Research Question</h4>
                    <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {selectedPaper.structuredSummary.researchQuestion}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100">Methodologies</h4>
                    <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {selectedPaper.structuredSummary.methods}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100">Participants & Subject</h4>
                    <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {selectedPaper.structuredSummary.participants}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100">Key Outcomes</h4>
                    <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {selectedPaper.structuredSummary.findings}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100">Limitations Identified</h4>
                    <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {selectedPaper.structuredSummary.limitations}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100">Strength Justification</h4>
                    <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {selectedPaper.structuredSummary.evidenceExplanation}
                    </p>
                  </div>
                </div>

                {/* Key Quotes */}
                {selectedPaper.structuredSummary.keyQuotations && (
                  <div className="pt-4 border-t border-stone-100 dark:border-stone-900 space-y-2">
                    <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100">Traceable Key Quotations</h4>
                    <div className="space-y-2">
                      {selectedPaper.structuredSummary.keyQuotations.map((quote, i) => (
                        <blockquote key={i} className="pl-4 border-l-2 border-stone-200 dark:border-stone-800 font-sans text-xs text-stone-500 italic leading-relaxed">
                          "{quote}"
                        </blockquote>
                      ))}
                    </div>
                  </div>
                )}

                {/* Future research directions */}
                <div className="pt-4 border-t border-stone-100 dark:border-stone-900 space-y-1.5">
                  <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100">Future Research Gaps</h4>
                  <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    {selectedPaper.structuredSummary.futureResearch}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-12 text-left text-stone-400 dark:text-stone-500 font-sans text-xs">
                Select a reference from the library pane on the left, then click "Generate Structured Summary" to deploy our meta-analytical model.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CROSS PAPER SYNTHESIS WORKSHOP */}
      {activeSubTab === 'synthesis' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Paper selector checkboxes column */}
          <div className="lg:col-span-1 bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 p-5 rounded-lg h-fit space-y-4">
            <h3 className="font-sans font-medium text-xs text-amber-800 dark:text-amber-400 tracking-wide">Select Synthesis Sources</h3>
            <p className="font-sans text-[11px] text-stone-500 leading-tight">
              Check at least two documents in your library to explore agreement, methodological debates, and thematic consensus.
            </p>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {papers.map((p) => (
                <label
                  key={p.id}
                  className="flex items-start gap-3 p-2 bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded text-xs font-sans cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedPaperIdsForSynthesis.includes(p.id)}
                    onChange={() => handleToggleSynthesisPaper(p.id)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-stone-800 dark:text-stone-200 line-clamp-2 leading-tight">{p.title}</p>
                    <p className="text-[10px] text-stone-400 truncate mt-0.5">{p.authors}</p>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={handleRunSynthesis}
              disabled={loadingSynthesis || selectedPaperIdsForSynthesis.length < 2}
              className="w-full font-sans text-xs bg-amber-900 text-white py-2.5 rounded hover:bg-amber-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Brain className="w-4 h-4" /> Synthesize Relationships
            </button>
          </div>

          {/* Result view column */}
          <div className="lg:col-span-2 space-y-6">
            {loadingSynthesis ? (
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-12 text-left flex flex-col items-start justify-start space-y-3">
                <div className="w-6 h-6 border-2 border-amber-900 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-sans text-xs text-stone-500 italic">Synthesizing multiple literature perspectives, isolating thematic convergences, mapping debates...</p>
              </div>
            ) : synthesisResult ? (
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 space-y-6">
                <div className="border-b border-stone-100 dark:border-stone-900 pb-3">
                  <span className="font-sans text-[9px] text-amber-800 tracking-wide font-semibold">Gemini Synthesis Report</span>
                  <h3 className="font-sans font-bold text-stone-900 dark:text-stone-100 text-base mt-1">Cross-Paper Synthesis Output</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="font-sans font-semibold text-xs text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Points of Academic Convergence
                    </h4>
                    <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {synthesisResult.agreements}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-4 border-t border-stone-100 dark:border-stone-900">
                    <h4 className="font-sans font-semibold text-xs text-amber-800 dark:text-amber-400 flex items-center gap-1">
                      <Shuffle className="w-4 h-4" /> Divergences, Nuances & Methodological Debates
                    </h4>
                    <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {synthesisResult.disagreements}
                    </p>
                  </div>

                  {/* Thematic clusters */}
                  {synthesisResult.thematicClusters && (
                    <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-900">
                      <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <Layers className="w-4 h-4" /> Structured Thematic Clusters
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {synthesisResult.thematicClusters.map((cluster: any, idx: number) => (
                          <div key={idx} className="p-4 bg-stone-50 dark:bg-stone-900 rounded border border-stone-200/50 dark:border-stone-800 space-y-2">
                            <span className="text-[10px] font-mono bg-stone-200/60 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-500">Theme {idx + 1}</span>
                            <h5 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-xs">{cluster.themeName}</h5>
                            <p className="font-sans text-[11px] text-stone-600 dark:text-stone-400 leading-normal">{cluster.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-12 text-left text-stone-400 dark:text-stone-500 font-sans text-xs">
                Select multiple papers in the synthesis console on the left, then click "Synthesize Relationships" to inspect multi-perspective thematic agreements and divisions.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
