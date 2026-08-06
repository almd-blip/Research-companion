/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Paper, CitationStyle, Collection } from '../types';
import {
  Check,
  Clipboard,
  Library,
  AlertTriangle,
  CheckCircle,
  Download,
  FileCode,
  Filter,
  Search,
  Code,
  Eye,
  X,
  FileText
} from 'lucide-react';

interface CitationEngineProps {
  papers: Paper[];
  collections?: Collection[];
  onVerifyMetadata: (paper: Paper) => Promise<void>;
}

export default function CitationEngine({ papers, collections = [], onVerifyMetadata }: CitationEngineProps) {
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>('APA7');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');

  // BibTeX export modal/preview state
  const [showBibTeXPreview, setShowBibTeXPreview] = useState(false);
  const [copiedBibTeX, setCopiedBibTeX] = useState(false);
  const [activeBibTeXPaper, setActiveBibTeXPaper] = useState<Paper | null>(null);

  // Filtered papers list
  const filteredPapers = papers.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.title.toLowerCase().includes(term) ||
      p.authors.toLowerCase().includes(term) ||
      p.journal.toLowerCase().includes(term) ||
      p.doi.toLowerCase().includes(term) ||
      p.tags.some((t) => t.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === 'all' || p.verificationStatus === statusFilter;

    const matchesCollection =
      collectionFilter === 'all' || p.collectionId === collectionFilter;

    return matchesSearch && matchesStatus && matchesCollection;
  });

  // Citation Formatting Helpers
  const formatCitation = (paper: Paper, style: CitationStyle): string => {
    const authorsList = paper.authors;
    const yearStr = paper.year ? `(${paper.year})` : '';
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

  // BibTeX Generation Helpers
  const generateBibTeXKey = (paper: Paper): string => {
    let authorKey = 'Ref';
    if (paper.authors) {
      const firstAuthor = paper.authors.split(/,|and/)[0].trim();
      const nameParts = firstAuthor.split(' ').filter(Boolean);
      authorKey = nameParts[nameParts.length - 1] || 'Ref';
      authorKey = authorKey.replace(/[^a-zA-Z0-9]/g, '');
    }
    const yearKey = paper.year || '';
    const words = (paper.title || '').split(/\s+/).filter((w) => w.length > 3);
    const titleWord = words[0] || (paper.title || '').split(/\s+/)[0] || '';
    const cleanTitleWord = titleWord.replace(/[^a-zA-Z0-9]/g, '');
    const key = `${authorKey}${yearKey}${cleanTitleWord}` || paper.id;
    return key.toLowerCase();
  };

  const paperToBibTeX = (paper: Paper): string => {
    const key = generateBibTeXKey(paper);
    const fields: string[] = [];

    if (paper.authors) {
      // Clean author formatting for BibTeX (using 'and' separators)
      const cleanAuthors = paper.authors.includes(' and ')
        ? paper.authors
        : paper.authors.replace(/,\s*/g, ' and ');
      fields.push(`  author    = {${cleanAuthors}}`);
    }
    if (paper.title) {
      fields.push(`  title     = {{${paper.title}}}`);
    }
    if (paper.journal) {
      fields.push(`  journal   = {${paper.journal}}`);
    }
    if (paper.year) {
      fields.push(`  year      = {${paper.year}}`);
    }
    if (paper.doi) {
      fields.push(`  doi       = {${paper.doi}}`);
    }
    if (paper.abstract) {
      const cleanAbstract = paper.abstract.replace(/[\{\}]/g, '');
      fields.push(`  abstract  = {${cleanAbstract}}`);
    }
    if (paper.notes) {
      fields.push(`  note      = {${paper.notes.replace(/[\{\}]/g, '')}}`);
    }

    return `@article{${key},\n${fields.join(',\n')}\n}`;
  };

  const generateFullBibTeX = (papersToExport: Paper[]): string => {
    const dateStr = new Date().toISOString().split('T')[0];
    const header = `% ==========================================================\n% BibTeX Export generated by Second Thought Publishing\n% Date: ${dateStr}\n% Total Exported References: ${papersToExport.length}\n% ==========================================================\n\n`;
    const entries = papersToExport.map(paperToBibTeX).join('\n\n');
    return header + entries;
  };

  // Actions
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyBibTeX = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBibTeX(true);
    setTimeout(() => setCopiedBibTeX(false), 2000);
  };

  const handleDownloadBibTeX = (papersToExport: Paper[]) => {
    const bibContent = generateFullBibTeX(papersToExport);
    const blob = new Blob([bibContent], { type: 'text/x-bibtex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `references_export_${new Date().toISOString().slice(0, 10)}.bib`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRepairMetadata = async (paper: Paper) => {
    setVerifyingId(paper.id);
    await onVerifyMetadata(paper);
    setVerifyingId(null);
  };

  const missingMetadataPapers = papers.filter((p) => p.verificationStatus === 'missing_metadata');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="citation-engine-module">
      
      {/* Bibliographic style options, filter toolbar and references list */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-5 space-y-4">
          
          {/* Header & Style Selector */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
            <div>
              <h3 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5">
                <Library className="w-4 h-4 text-amber-800 dark:text-amber-500" /> Academic Bibliography Generator
              </h3>
              <p className="font-sans text-[11px] text-stone-400">Perfect formatting aligned to active style conventions.</p>
            </div>

            {/* Style Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <label htmlFor="citation-style-select" className="sr-only">Citation Style</label>
              <select
                id="citation-style-select"
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value as CitationStyle)}
                className="font-sans text-xs p-2 font-medium border border-stone-300 dark:border-stone-700 rounded text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-900 w-full sm:w-auto focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="Harvard">Harvard Reference Style</option>
                <option value="APA7">APA 7th Edition</option>
                <option value="MLA9">MLA 9th Edition</option>
                <option value="Chicago">Chicago Author-Date</option>
                <option value="IEEE">IEEE Reference Style</option>
              </select>

              <div className="flex items-center gap-1 font-sans text-[10px]">
                {(['Harvard', 'APA7', 'MLA9', 'Chicago', 'IEEE'] as CitationStyle[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStyle(st)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                      selectedStyle === st
                        ? 'bg-amber-900 text-white dark:bg-amber-800 font-bold'
                        : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                    }`}
                  >
                    {st === 'APA7' ? 'APA' : st === 'MLA9' ? 'MLA' : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reference List Filters & BibTeX Export Bar */}
          <div className="bg-stone-50/60 dark:bg-stone-900/60 p-3 rounded-lg border border-stone-200/60 dark:border-stone-800 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
              
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter references by title, author, tag..."
                  className="w-full font-sans text-xs pl-8 pr-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800 dark:text-stone-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0 hidden sm:block" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="font-sans text-xs py-1.5 px-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded text-stone-700 dark:text-stone-300"
                >
                  <option value="all">All Verification Statuses</option>
                  <option value="verified">Verified Only</option>
                  <option value="missing_metadata">Missing Metadata</option>
                  <option value="unverified">Unverified</option>
                </select>

                {collections.length > 0 && (
                  <select
                    value={collectionFilter}
                    onChange={(e) => setCollectionFilter(e.target.value)}
                    className="font-sans text-xs py-1.5 px-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded text-stone-700 dark:text-stone-300"
                  >
                    <option value="all">All Collections</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Filter Summary and BibTeX Export Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1 border-t border-stone-200/40 dark:border-stone-800 text-xs">
              <span className="font-sans text-[11px] text-stone-500 dark:text-stone-400">
                Showing <strong className="text-stone-800 dark:text-stone-200">{filteredPapers.length}</strong> of {papers.length} references
                {(searchTerm || statusFilter !== 'all' || collectionFilter !== 'all') && (
                  <span className="ml-1 text-amber-700 dark:text-amber-400 font-medium">(Filtered)</span>
                )}
              </span>

              {/* BibTeX Export Group */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowBibTeXPreview(true)}
                  disabled={filteredPapers.length === 0}
                  className="font-sans text-xs px-2.5 py-1 bg-amber-900/10 hover:bg-amber-900/20 text-amber-900 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 dark:text-amber-300 border border-amber-900/20 rounded flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  title="Preview raw BibTeX format for current filtered references"
                >
                  <FileCode className="w-3.5 h-3.5" /> Preview BibTeX
                </button>

                <button
                  onClick={() => handleDownloadBibTeX(filteredPapers)}
                  disabled={filteredPapers.length === 0}
                  className="font-sans text-xs px-3 py-1 bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-600 text-white rounded font-medium flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  title="Export filtered reference list as .bib file"
                >
                  <Download className="w-3.5 h-3.5" /> Export BibTeX (.bib)
                </button>
              </div>
            </div>
          </div>

          {/* References List */}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {filteredPapers.map((p) => {
              const cite = formatCitation(p, selectedStyle);
              const bibSnippet = paperToBibTeX(p);

              return (
                <div
                  key={p.id}
                  className="p-3.5 border border-stone-100 dark:border-stone-900 bg-stone-50/20 dark:bg-stone-900/20 hover:border-stone-200 dark:hover:border-stone-800 rounded font-serif text-xs leading-relaxed flex flex-col sm:flex-row gap-3 justify-between group items-start transition-all"
                >
                  <div className="text-stone-700 dark:text-stone-300 flex-1">
                    {/* Render basic HTML representation for italicizing journals */}
                    {cite.split('*').map((part, idx) =>
                      idx % 2 === 1 ? (
                        <em key={idx} className="font-medium italic">
                          {part}
                        </em>
                      ) : (
                        part
                      )
                    )}

                    {p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 font-sans">
                        {p.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions per reference */}
                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                    <button
                      onClick={() => setActiveBibTeXPaper(p)}
                      className="p-1 px-2 text-[10px] font-sans border border-stone-200 dark:border-stone-700 rounded text-stone-500 hover:text-amber-800 dark:hover:text-amber-400 hover:border-amber-700/30 transition-all cursor-pointer flex items-center gap-1"
                      title="View individual BibTeX entry"
                    >
                      <Code className="w-3 h-3" /> BibTeX
                    </button>

                    <button
                      onClick={() => handleCopy(p.id, cite.replace(/\*/g, ''))}
                      className="p-1.5 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-all cursor-pointer opacity-80"
                      title="Copy styled citation to Clipboard"
                    >
                      {copiedId === p.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Clipboard className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredPapers.length === 0 && (
              <div className="py-12 text-center text-stone-400 font-sans text-xs space-y-2">
                <FileText className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-700" />
                <p>No references found matching your active filter criteria.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setCollectionFilter('all');
                  }}
                  className="text-amber-800 dark:text-amber-400 underline hover:text-amber-900 cursor-pointer"
                >
                  Clear search filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* METADATA AUDIT WORKBENCH SIDEBAR */}
      <div className="lg:col-span-1 bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 p-5 rounded-lg space-y-4 h-fit">
        <div>
          <h4 className="font-sans font-medium text-xs text-amber-800 dark:text-amber-400 tracking-wide">
            Metadata Verification Workbench
          </h4>
          <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            References with incomplete parameters violate citation accuracy standards. Complete missing DOIs to lock academic integrity.
          </p>
        </div>

        <div className="space-y-3 pt-3 border-t border-amber-900/10 dark:border-stone-800">
          <div className="flex justify-between text-xs font-sans">
            <span className="text-stone-500 dark:text-stone-400">Incomplete References:</span>
            <span
              className={`font-semibold ${
                missingMetadataPapers.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {missingMetadataPapers.length} flagged
            </span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {missingMetadataPapers.map((p) => (
              <div key={p.id} className="p-2.5 bg-white dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800 rounded text-xs space-y-2">
                <div className="flex gap-1.5 items-start">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-sans font-semibold text-stone-800 dark:text-stone-200 line-clamp-1 leading-tight">{p.title}</h5>
                    <p className="font-sans text-[10px] text-stone-400 mt-0.5">Missing: {p.missingFields.join(', ')}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleRepairMetadata(p)}
                  disabled={verifyingId === p.id}
                  className="w-full font-sans text-[10px] bg-amber-900/10 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 py-1 rounded hover:bg-amber-900/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  {verifyingId === p.id ? (
                    <span className="w-2.5 h-2.5 border border-amber-900 dark:border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  Auto DOI Lookup & Repair
                </button>
              </div>
            ))}

            {missingMetadataPapers.length === 0 && (
              <div className="text-left py-8 text-emerald-600 dark:text-emerald-400 font-sans text-xs italic flex flex-col items-start gap-1">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                100% of references verified!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULL BIBTEX PREVIEW MODAL */}
      {showBibTeXPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-800 dark:text-amber-400" />
                <div>
                  <h3 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-sm">
                    BibTeX Export Preview
                  </h3>
                  <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400">
                    Formatted BibTeX file content for {filteredPapers.length} selected reference(s)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBibTeXPreview(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-stone-950 text-amber-200/90 font-mono text-xs p-4 rounded-md border border-stone-800 whitespace-pre leading-relaxed select-all">
              {generateFullBibTeX(filteredPapers)}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
              <span className="font-sans text-xs text-stone-500">
                Compatible with Overleaf, LaTeX, Zotero, Mendeley & EndNote
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleCopyBibTeX(generateFullBibTeX(filteredPapers))}
                  className="font-sans text-xs px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  {copiedBibTeX ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                  {copiedBibTeX ? 'Copied BibTeX!' : 'Copy to Clipboard'}
                </button>
                <button
                  onClick={() => {
                    handleDownloadBibTeX(filteredPapers);
                    setShowBibTeXPreview(false);
                  }}
                  className="font-sans text-xs px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-600 text-white rounded font-medium flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Download .bib File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE PAPER BIBTEX MODAL */}
      {activeBibTeXPaper && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-amber-800 dark:text-amber-400" />
                <h3 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-sm">
                  BibTeX Entry
                </h3>
              </div>
              <button
                onClick={() => setActiveBibTeXPaper(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="font-sans text-xs font-medium text-stone-800 dark:text-stone-200 line-clamp-2">
              {activeBibTeXPaper.title}
            </p>

            <div className="bg-stone-950 text-amber-200/90 font-mono text-xs p-3.5 rounded border border-stone-800 whitespace-pre select-all">
              {paperToBibTeX(activeBibTeXPaper)}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  handleCopyBibTeX(paperToBibTeX(activeBibTeXPaper));
                  setTimeout(() => setActiveBibTeXPaper(null), 1200);
                }}
                className="font-sans text-xs px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded font-medium flex items-center gap-1.5 cursor-pointer"
              >
                {copiedBibTeX ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                {copiedBibTeX ? 'Copied!' : 'Copy BibTeX Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

