/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ResearchJourney, Paper } from '../types';

interface FundingWorkspaceProps {
  journeys: ResearchJourney[];
  papers: Paper[];
  onUpdateJourney: (updated: ResearchJourney) => void;
}

export default function FundingWorkspace({ journeys, papers, onUpdateJourney }: FundingWorkspaceProps) {
  const fundingJourneys = journeys.filter((j) => j.type === 'phd' || j.type === 'funding' || j.fundingDetails);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>(fundingJourneys[0]?.id || journeys[0]?.id || '');
  
  const activeJourney = journeys.find((j) => j.id === selectedJourneyId);

  // New reusable snippet states
  const [newSnippet, setNewSnippet] = useState('');

  // New priority criteria states
  const [newPriority, setNewPriority] = useState('');

  const handleAddSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJourney || !newSnippet) return;

    const snippets = activeJourney.reusableSnippets || [];
    const updated: ResearchJourney = {
      ...activeJourney,
      reusableSnippets: [...snippets, newSnippet],
    };

    onUpdateJourney(updated);
    setNewSnippet('');
  };

  const handleDeleteSnippet = (index: number) => {
    if (!activeJourney) return;
    const snippets = activeJourney.reusableSnippets || [];
    const updated: ResearchJourney = {
      ...activeJourney,
      reusableSnippets: snippets.filter((_, idx) => idx !== index),
    };
    onUpdateJourney(updated);
  };

  const handleUpdateImpact = (text: string) => {
    if (!activeJourney) return;
    const details = activeJourney.fundingDetails || {
      funderName: 'National Funding Body',
      priorityCriteria: [],
      impactStatement: '',
      collaborators: '',
    };

    onUpdateJourney({
      ...activeJourney,
      fundingDetails: {
        ...details,
        impactStatement: text,
      },
    });
  };

  const handleUpdateFunderName = (name: string) => {
    if (!activeJourney) return;
    const details = activeJourney.fundingDetails || {
      funderName: '',
      priorityCriteria: [],
      impactStatement: '',
      collaborators: '',
    };

    onUpdateJourney({
      ...activeJourney,
      fundingDetails: {
        ...details,
        funderName: name,
      },
    });
  };

  const handleAddPriority = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJourney || !newPriority) return;

    const details = activeJourney.fundingDetails || {
      funderName: 'National Funding Body',
      priorityCriteria: [],
      impactStatement: '',
      collaborators: '',
    };

    onUpdateJourney({
      ...activeJourney,
      fundingDetails: {
        ...details,
        priorityCriteria: [...details.priorityCriteria, newPriority],
      },
    });

    setNewPriority('');
  };

  return (
    <div className="space-y-6" id="funding-workspace-module">
      
      {/* Selector tab */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <h2 className="font-sans font-medium text-stone-900 dark:text-stone-100 text-lg flex items-center gap-2">
             Funding & Grants Workspace
          </h2>
          <p className="font-sans text-xs text-stone-500 mt-0.5">Integrate literature directly with grant preparations, impact statements, and funder benchmarks.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-sans text-xs text-stone-400">Select Journey:</span>
          <select
            value={selectedJourneyId}
            onChange={(e) => setSelectedJourneyId(e.target.value)}
            className="font-sans text-xs p-1.5 border border-stone-200 rounded text-stone-800 bg-white"
          >
            {journeys.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>
      </div>

      {activeJourney ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Workspace Column: Funder Priorities and Impact Statements */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Funder profile */}
            <div className="bg-white dark:bg-stone-950 border border-stone-200 rounded-lg p-5 space-y-4">
              <h3 className="font-sans font-semibold text-stone-950 text-sm flex items-center gap-1.5 border-b border-stone-100 pb-2">
                 Funder Specifics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-sans text-[10px] text-stone-400 tracking-wide font-semibold">Funder / Scheme Name</label>
                  <input
                    type="text"
                    value={activeJourney.fundingDetails?.funderName || ''}
                    onChange={(e) => handleUpdateFunderName(e.target.value)}
                    placeholder="e.g., European Research Council, NSF..."
                    className="w-full font-sans text-xs p-2 border border-stone-200 rounded"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-sans text-[10px] text-stone-400 tracking-wide font-semibold">Active Collaborators</label>
                  <input
                    type="text"
                    value={activeJourney.fundingDetails?.collaborators || ''}
                    onChange={(e) => {
                      if (!activeJourney) return;
                      const details = activeJourney.fundingDetails || { funderName: '', priorityCriteria: [], impactStatement: '', collaborators: '' };
                      onUpdateJourney({
                        ...activeJourney,
                        fundingDetails: { ...details, collaborators: e.target.value }
                      });
                    }}
                    placeholder="Institutions or researchers involved..."
                    className="w-full font-sans text-xs p-2 border border-stone-200 rounded"
                  />
                </div>
              </div>

              {/* Priority checklist */}
              <div className="space-y-2">
                <h4 className="font-sans font-semibold text-xs text-stone-800 flex items-center gap-1">
                   Priority Compliance Benchmarks
                </h4>
                
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                  {activeJourney.fundingDetails?.priorityCriteria.map((crit, idx) => (
                    <div key={idx} className="p-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200/50 rounded flex gap-2.5 items-start text-xs font-sans text-stone-650 leading-relaxed">
                      <span className="font-mono text-[9px] bg-[#912A4A]/10 text-[#912A4A] w-4 h-4 flex items-center justify-center rounded-full shrink-0 mt-0.5">{idx + 1}</span>
                      <span>{crit}</span>
                    </div>
                  ))}

                  {(!activeJourney.fundingDetails || activeJourney.fundingDetails.priorityCriteria.length === 0) && (
                    <p className="font-sans text-xs text-stone-400 italic">No specific compliance priorities logged yet.</p>
                  )}
                </div>

                <form onSubmit={handleAddPriority} className="flex gap-2 pt-2 border-t border-stone-100">
                  <input
                    type="text"
                    placeholder="Define a crucial funder focus or assessment benchmark..."
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
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

            {/* Impact Statement sandbox */}
            <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-3">
              <h3 className="font-sans font-semibold text-stone-950 text-sm flex items-center gap-1.5">
                 Societal Impact and Outreach Statement
              </h3>
              <p className="font-sans text-xs text-stone-500">
                Funder evaluations weigh structural, societal, or industrial outreach heavily. Map out your dissemination plans.
              </p>

              <textarea
                value={activeJourney.fundingDetails?.impactStatement || ''}
                onChange={(e) => handleUpdateImpact(e.target.value)}
                className="w-full font-sans text-xs p-3 border border-stone-200 rounded bg-stone-50/50 text-stone-800 h-36 focus:outline-none"
                placeholder="Draft the pathway to impact, describing how this research translates beyond academia to policy, industry, or marginalized communities..."
              />
            </div>

          </div>

          {/* SIDEBAR: Reusable Snippets & Capability Profile */}
          <div className="lg:col-span-1 bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 p-5 rounded-lg space-y-4 h-fit">
            <h4 className="font-sans font-medium text-xs text-[#912A4A] dark:text-rose-400 tracking-wide flex items-center gap-1.5">
               Reusable Bio & Capability Profile
            </h4>
            <p className="font-sans text-[11px] text-stone-500">
              Store reusable descriptions (bios, project methodology standards, impact statements) to quickly paste across grant bids and proposals.
            </p>

            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {activeJourney.reusableSnippets?.map((snip, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-stone-950 border border-stone-150 rounded text-xs font-sans space-y-1.5">
                  <p className="text-stone-600 line-clamp-3 leading-relaxed italic">"{snip}"</p>
                  <div className="flex justify-between items-center text-[10px] text-stone-400 border-t pt-1.5 border-stone-50">
                    <span>Snippet #{idx + 1}</span>
                    <button
                      onClick={() => handleDeleteSnippet(idx)}
                      className="text-stone-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {(!activeJourney.reusableSnippets || activeJourney.reusableSnippets.length === 0) && (
                <p className="font-sans text-xs text-stone-400 italic">No reusable capability snippets saved.</p>
              )}
            </div>

            <form onSubmit={handleAddSnippet} className="space-y-2 border-t border-stone-200 pt-3">
              <textarea
                placeholder="Write a reusable statement (e.g. lab capabilities, researcher bios)..."
                value={newSnippet}
                onChange={(e) => setNewSnippet(e.target.value)}
                className="w-full font-sans text-xs p-2 border border-stone-200 rounded h-16 bg-white"
                required
              />
              <button
                type="submit"
                className="w-full font-sans text-xs bg-[#912A4A] text-white py-1.5 rounded hover:bg-[#78223d] transition-colors"
              >
                Save Snippet
              </button>
            </form>
          </div>

        </div>
      ) : (
        <div className="text-left py-24 font-sans text-stone-400 text-xs">
          Select or initialize an active Research Journey to unlock the funding applications panel.
        </div>
      )}

    </div>
  );
}
