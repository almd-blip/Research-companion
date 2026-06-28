/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Paper, CitationStyle } from '../types';
import { Check, Clipboard, Library, AlertTriangle, CheckCircle } from 'lucide-react';

interface CitationEngineProps {
  papers: Paper[];
  onVerifyMetadata: (paper: Paper) => Promise<void>;
}

export default function CitationEngine({ papers, onVerifyMetadata }: CitationEngineProps) {
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>('APA7');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const formatCitation = (paper: Paper, style: CitationStyle): string => {
    const authorsList = paper.authors;
    const yearStr = paper.year ? `(${paper.year})` : '';
    const titleStr = paper.title ? `"${paper.title}"` : '';
    const journalStr = paper.journal ? `${paper.journal}` : '';
    const doiStr = paper.doi ? `doi:${paper.doi}` : '';

    switch (style) {
      case 'APA7': {
        const formattedAuthors = formatAPAAuthors(authorsList);
        return `${formattedAuthors} ${yearStr}. ${paper.title}. ${journalStr ? `*${journalStr}*` : ''}.${doiStr ? ` https://doi.org/${paper.doi}` : ''}`;
      }
      case 'Harvard': {
        const hAuthors = formatHarvardAuthors(authorsList);
        return `${hAuthors} ${paper.year}, '${paper.title}', ${journalStr ? `*${journalStr}*` : ''}.${doiStr ? ` Available from: doi:${paper.doi}` : ''}`;
      }
      case 'Chicago': {
        return `${authorsList}. "${paper.title}." ${journalStr ? `*${journalStr}*` : ''} (${paper.year}).${doiStr ? ` https://doi.org/${paper.doi}` : ''}`;
      }
      case 'IEEE': {
        return `[1] ${authorsList}, "${paper.title}," ${journalStr ? `*${journalStr}*` : ''}, vol. XX, no. XX, ${paper.year}.${doiStr ? ` doi: ${paper.doi}` : ''}`;
      }
      case 'MLA9': {
        return `${authorsList}. "${paper.title}." ${journalStr ? `*${journalStr}*` : ''}, vol. XX, no. XX, ${paper.year}.${doiStr ? ` doi:${paper.doi}` : ''}`;
      }
      default:
        return `${authorsList} (${paper.year}). ${paper.title}.`;
    }
  };

  const formatAPAAuthors = (authors: string): string => {
    const parts = authors.split(',').map((a) => a.trim());
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} & ${parts[1]}`;
    return `${parts[0]} et al.`;
  };

  const formatHarvardAuthors = (authors: string): string => {
    const parts = authors.split(',').map((a) => a.trim());
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
    return `${parts[0]} et al.`;
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRepairMetadata = async (paper: Paper) => {
    setVerifyingId(paper.id);
    await onVerifyMetadata(paper);
    setVerifyingId(null);
  };

  const missingMetadataPapers = papers.filter((p) => p.verificationStatus === 'missing_metadata');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="citation-engine-module">
      
      {/* Bibliographic style options and references list */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5">
                <Library className="w-4 h-4 text-amber-800" /> Academic Bibliography Generator
              </h3>
              <p className="font-sans text-[11px] text-stone-400">Perfect formatting aligned to active style conventions.</p>
            </div>

            {/* Style Selector */}
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value as CitationStyle)}
              className="font-sans text-xs p-2 border border-stone-200 rounded text-stone-800 bg-white"
            >
              <option value="APA7">APA 7th Edition</option>
              <option value="Harvard">Harvard Cite</option>
              <option value="Chicago">Chicago Author-Date</option>
              <option value="IEEE">IEEE Reference Style</option>
              <option value="MLA9">MLA 9th Edition</option>
            </select>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {papers.map((p) => {
              const cite = formatCitation(p, selectedStyle);
              return (
                <div key={p.id} className="p-3 border border-stone-100 dark:border-stone-900 bg-stone-50/20 rounded font-serif text-xs leading-relaxed flex gap-4 justify-between group items-start">
                  <div className="text-stone-700 dark:text-stone-300">
                    {/* Render basic HTML representation for italicizing journals */}
                    {cite.split('*').map((part, idx) => (
                      idx % 2 === 1 ? <em key={idx} className="font-medium italic">{part}</em> : part
                    ))}
                  </div>

                  <button
                    onClick={() => handleCopy(p.id, cite.replace(/\*/g, ''))}
                    className="p-1 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-all cursor-pointer opacity-80"
                    title="Copy to Clipboard"
                  >
                    {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* METADATA AUDIT WORKBENCH SIDEBAR */}
      <div className="lg:col-span-1 bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 p-5 rounded-lg space-y-4 h-fit">
        <div>
          <h4 className="font-sans font-medium text-xs text-amber-800 tracking-wide">Metadata Verification Workbench</h4>
          <p className="font-sans text-[11px] text-stone-500 mt-1">
            References with incomplete parameters violate citation accuracy standards. Complete missing DOIs to lock academic integrity.
          </p>
        </div>

        <div className="space-y-3 pt-3 border-t border-amber-900/10">
          <div className="flex justify-between text-xs font-sans">
            <span className="text-stone-500">Incomplete References:</span>
            <span className={`font-semibold ${missingMetadataPapers.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {missingMetadataPapers.length} flagged
            </span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {missingMetadataPapers.map((p) => (
              <div key={p.id} className="p-2.5 bg-white border border-stone-200/50 rounded text-xs space-y-2">
                <div className="flex gap-1.5 items-start">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-sans font-semibold text-stone-800 line-clamp-1 leading-tight">{p.title}</h5>
                    <p className="font-sans text-[10px] text-stone-400 mt-0.5">Missing: {p.missingFields.join(', ')}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleRepairMetadata(p)}
                  disabled={verifyingId === p.id}
                  className="w-full font-sans text-[10px] bg-amber-900/10 text-amber-900 py-1 rounded hover:bg-amber-900/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  {verifyingId === p.id ? (
                    <span className="w-2.5 h-2.5 border border-amber-900 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  Auto DOI Lookup & Repair
                </button>
              </div>
            ))}

            {missingMetadataPapers.length === 0 && (
              <div className="text-center py-8 text-emerald-600 font-sans text-xs italic flex flex-col items-center gap-1">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                100% of references verified!
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
