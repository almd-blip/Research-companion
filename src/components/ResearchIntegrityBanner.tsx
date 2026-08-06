/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, UserCheck, Sparkles, BookOpen, HelpCircle, X, Compass, FileText, AlertCircle } from 'lucide-react';

interface ResearchIntegrityBannerProps {
  compact?: boolean;
  onOpenResearchPlan?: () => void;
  onOpenQuestionDev?: () => void;
}

export default function ResearchIntegrityBanner({
  compact = false,
  onOpenResearchPlan,
  onOpenQuestionDev,
}: ResearchIntegrityBannerProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Banner / Badge */}
      <div className="bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-sans shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-md bg-amber-900/10 text-amber-900 dark:bg-stone-800 dark:text-amber-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-stone-800 dark:text-stone-200 text-xs flex items-center gap-1.5">
              <span>Research Integrity Boundary Active</span>
              <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-mono px-1.5 py-0.2 rounded font-bold uppercase">
                Assistant • Not Author
              </span>
            </p>
            {!compact && (
              <p className="text-[11px] text-stone-500 leading-snug mt-0.5 truncate">
                The AI supports research analysis and critical review. It will never write complete papers or outputs on your behalf.
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="text-[11px] font-sans font-medium text-amber-900 dark:text-amber-400 hover:underline px-2.5 py-1 rounded bg-amber-50/50 dark:bg-stone-800/80 border border-amber-900/10 dark:border-stone-700 cursor-pointer transition-colors"
        >
          View Principles & Scope
        </button>
      </div>

      {/* Modal / Detailed Policy Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-6 max-w-2xl w-full shadow-2xl space-y-5 my-8">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-stone-150 dark:border-stone-900 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-900 text-white dark:bg-amber-800">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base text-stone-900 dark:text-stone-100">
                    Research Integrity Policy
                  </h3>
                  <p className="font-sans text-xs text-stone-500">
                    The AI acts as an analytical partner — never as an author or ghostwriter.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg text-xs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Premise */}
            <div className="p-3.5 bg-amber-50/40 dark:bg-stone-900/60 border border-amber-900/10 dark:border-stone-800 rounded-lg text-xs font-sans text-stone-700 dark:text-stone-300 leading-relaxed">
              <strong className="text-amber-950 dark:text-amber-300 font-semibold block mb-1">
                Boundary Commitment:
              </strong>
              The Research Companion will <strong>never write, generate, or produce complete academic papers, articles, books, chapters, or reports</strong> on behalf of the user. The AI is designed strictly to support the research process, not replace the researcher.
            </div>

            {/* Grid of Capabilities vs Responsibilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              
              {/* Permissible AI Assistance */}
              <div className="bg-stone-50/70 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> What the AI May Assist With
                </h4>
                <ul className="space-y-1.5 text-[11px] text-stone-600 dark:text-stone-400">
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span> Organising research materials & literature
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span> Identifying themes, patterns & theoretical models
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span> Comparing arguments & mapping literature
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span> Identifying supporting & opposing evidence
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span> Highlighting knowledge gaps & unanswered questions
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span> Suggesting possible research directions
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span> Structuring notes, outlines & conceptual frameworks
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span> Checking clarity, consistency & logical cohesion
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span> Assisting with editing of user-written text
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span> Identifying biases, assumptions & limitations
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span> Supporting data exploration & pattern interpretation
                  </li>
                </ul>
              </div>

              {/* User Responsibilities */}
              <div className="bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-xs">
                  <UserCheck className="w-4 h-4 text-amber-800 dark:text-amber-400" /> Researcher Responsibilities
                </h4>
                <ul className="space-y-1.5 text-[11px] text-stone-600 dark:text-stone-400">
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-800 dark:text-amber-400 font-bold">•</span> Forming original arguments & core hypotheses
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-800 dark:text-amber-400 font-bold">•</span> Interpreting empirical evidence & findings
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-800 dark:text-amber-400 font-bold">•</span> Drawing academic conclusions
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-800 dark:text-amber-400 font-bold">•</span> Writing original scholarly work
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-800 dark:text-amber-400 font-bold">•</span> Making final scholarly judgements
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-800 dark:text-amber-400 font-bold">•</span> Ensuring factual accuracy & correct citations
                  </li>
                </ul>

                {/* Alternative Support */}
                <div className="pt-3 border-t border-amber-900/10 dark:border-stone-800 space-y-1.5">
                  <h5 className="font-semibold text-[11px] text-amber-950 dark:text-amber-300">
                    Alternative Support Options:
                  </h5>
                  <p className="text-[10px] text-stone-500 leading-relaxed">
                    When requested to generate outputs, the AI instead provides research plans, key research questions, draft peer-reviews, structural feedback, and logical consistency checks.
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-150 dark:border-stone-900">
              <span className="text-[10px] text-stone-400 italic">
                A non-generative, author-led academic workflow.
              </span>

              <div className="flex gap-2">
                {onOpenResearchPlan && (
                  <button
                    onClick={() => {
                      setShowModal(false);
                      onOpenResearchPlan();
                    }}
                    className="font-sans text-xs px-3 py-1.5 rounded bg-amber-900 text-white hover:bg-amber-800 transition-colors flex items-center gap-1"
                  >
                    <Compass className="w-3.5 h-3.5" /> Research Plan Helper
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="font-sans text-xs px-4 py-1.5 rounded bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
                >
                  Understood
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
