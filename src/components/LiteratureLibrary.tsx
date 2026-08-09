/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trash2, ChevronDown, ChevronRight, ChevronsUpDown, Search, Quote, FilePlus, Plus } from 'lucide-react';
import { Paper, Collection, Annotation } from '../types';
import DataIngestionModule from './DataIngestionModule';

export type CommonCitationStyle = 'Harvard' | 'APA' | 'MLA' | 'Chicago' | 'IEEE';

export const formatPaperPreview = (paper: Paper, style: CommonCitationStyle): string => {
  const authors = paper.authors || 'Unknown Author';
  const year = paper.year || 'n.d.';
  const title = paper.title || 'Untitled';
  const journal = paper.journal && paper.journal !== 'Unspecified' ? paper.journal : '';
  const doi = paper.doi ? paper.doi.replace(/^https?:\/\/doi\.org\//i, '') : '';

  switch (style) {
    case 'Harvard': {
      const parts = authors.split(',').map(a => a.trim());
      const authorFormatted = parts.length > 2 ? `${parts[0]} et al.` : parts.length === 2 ? `${parts[0]} and ${parts[1]}` : parts[0];
      return `${authorFormatted} ${year}, '${title}', ${journal ? `${journal}, ` : ''}${doi ? `Available from: doi:${doi}` : ''}`.trim();
    }
    case 'APA': {
      const parts = authors.split(',').map(a => a.trim());
      const authorFormatted = parts.length > 2 ? `${parts[0]} et al.` : parts.length === 2 ? `${parts[0]} & ${parts[1]}` : parts[0];
      return `${authorFormatted} (${year}). ${title}. ${journal ? `${journal}. ` : ''}${doi ? `https://doi.org/${doi}` : ''}`.trim();
    }
    case 'MLA': {
      return `${authors}. "${title}." ${journal ? `${journal}, ` : ''}${year}.${doi ? ` doi:${doi}.` : ''}`.trim();
    }
    case 'Chicago': {
      return `${authors}. ${year}. "${title}." ${journal ? `${journal}. ` : ''}${doi ? `https://doi.org/${doi}` : ''}`.trim();
    }
    case 'IEEE': {
      return `[1] ${authors}, "${title}," ${journal ? `${journal}, ` : ''}${year}.${doi ? ` doi: ${doi}.` : ''}`.trim();
    }
    default:
      return `${authors} (${year}). ${title}.`;
  }
};

interface LiteratureLibraryProps {
  papers: Paper[];
  collections: Collection[];
  onUpdatePaper: (updated: Paper) => void;
  onAddPaper: (paper: Paper) => void;
  onDeletePaper: (id: string) => void;
}

export default function LiteratureLibrary({
  papers,
  collections,
  onUpdatePaper,
  onAddPaper,
  onDeletePaper,
}: LiteratureLibraryProps) {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(papers[0] || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Citation Style state for formatted paper previews
  const [citationStyle, setCitationStyle] = useState<CommonCitationStyle>('Harvard');
  const [copiedCitation, setCopiedCitation] = useState(false);

  // Data Ingestion Module toggle
  const [showIngestionModule, setShowIngestionModule] = useState(false);

  // New paper modal/form states
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthors, setNewAuthors] = useState('');
  const [newJournal, setNewJournal] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newDoi, setNewDoi] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newAbstract, setNewAbstract] = useState('');

  // Annotation text states
  const [newAnnotationText, setNewAnnotationText] = useState('');
  const [newAnnotationComment, setNewAnnotationComment] = useState('');

  // Progressive disclosure state for reference entries
  const [expandedPaperIds, setExpandedPaperIds] = useState<Record<string, boolean>>({});

  const togglePaperExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedPaperIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleExpandAll = () => {
    const allAreExpanded = filteredPapers.length > 0 && filteredPapers.every((p) => expandedPaperIds[p.id]);
    if (allAreExpanded) {
      setExpandedPaperIds({});
    } else {
      const nextMap: Record<string, boolean> = {};
      filteredPapers.forEach((p) => {
        nextMap[p.id] = true;
      });
      setExpandedPaperIds(nextMap);
    }
  };

  const filteredPapers = papers.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.authors.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCollection = selectedCollection === 'all' || p.collectionId === selectedCollection;

    return matchesSearch && matchesCollection;
  });

  const handleVerifyMetadata = async (paper: Paper) => {
    setVerifyingId(paper.id);
    try {
      const res = await fetch('/api/gemini/metadata-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paper.title,
          authors: paper.authors,
          doi: paper.doi,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated: Paper = {
          ...paper,
          title: data.correctedTitle || paper.title,
          authors: data.correctedAuthors || paper.authors,
          journal: data.correctedJournal || paper.journal,
          year: data.correctedYear || paper.year,
          doi: data.correctedDoi || paper.doi,
          missingFields: data.missingFields || [],
          verificationStatus: data.verificationStatus || 'verified',
        };
        onUpdatePaper(updated);
        if (selectedPaper?.id === paper.id) {
          setSelectedPaper(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleAddPaperSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const added: Paper = {
      id: 'paper-' + Math.random().toString(36).substr(2, 9),
      title: newTitle,
      authors: newAuthors,
      journal: newJournal,
      year: Number(newYear),
      doi: newDoi,
      tags: [],
      notes: newNotes,
      abstract: newAbstract,
      verificationStatus: newDoi ? 'verified' : 'unverified',
      missingFields: newDoi ? [] : ['doi'],
      annotations: [],
    };

    onAddPaper(added);
    setSelectedPaper(added);
    setIsAdding(false);

    // Reset fields
    setNewTitle('');
    setNewAuthors('');
    setNewJournal('');
    setNewYear(new Date().getFullYear());
    setNewDoi('');
    setNewNotes('');
    setNewAbstract('');
  };

  const handleAddAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaper || !newAnnotationText) return;

    const ann: Annotation = {
      id: 'ann-' + Math.random().toString(36).substr(2, 9),
      text: newAnnotationText,
      comment: newAnnotationComment || undefined,
      color: '#FEF08A', // soft yellow highlight
      createdAt: new Date().toISOString(),
    };

    const updated: Paper = {
      ...selectedPaper,
      annotations: [...selectedPaper.annotations, ann],
    };

    onUpdatePaper(updated);
    setSelectedPaper(updated);
    setNewAnnotationText('');
    setNewAnnotationComment('');
  };

  const handleDeleteAnnotation = (annId: string) => {
    if (!selectedPaper) return;
    const updated: Paper = {
      ...selectedPaper,
      annotations: selectedPaper.annotations.filter((a) => a.id !== annId),
    };
    onUpdatePaper(updated);
    setSelectedPaper(updated);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full" id="literature-library-module">
      
      {/* Left Column - Directory and paper listings */}
      <div className="flex-1 space-y-4">
        
        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400 pointer-events-none" />
            <label htmlFor="library-search" className="sr-only">Search Literature Library</label>
            <input
              id="library-search"
              type="text"
              placeholder="Search by title, author, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full font-sans text-xs pl-9 pr-4 py-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
            />
          </div>

          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <label htmlFor="citation-style-global-select" className="sr-only">Citation Preview Style</label>
            <div className="flex items-center gap-1.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded px-2.5 py-1">
              <Quote className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400 shrink-0" />
              <select
                id="citation-style-global-select"
                value={citationStyle}
                onChange={(e) => setCitationStyle(e.target.value as CommonCitationStyle)}
                className="font-sans text-xs bg-transparent text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer font-medium"
                title="Choose citation style format for paper previews"
              >
                <option value="Harvard">Harvard Style</option>
                <option value="APA">APA 7th Edition</option>
                <option value="MLA">MLA 9th Edition</option>
                <option value="Chicago">Chicago Author-Date</option>
                <option value="IEEE">IEEE Format</option>
              </select>
            </div>

            <label htmlFor="collection-filter" className="sr-only">Filter by Collection</label>
            <select
              id="collection-filter"
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="font-sans text-xs px-3 py-2 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus-visible:ring-offset-stone-950"
              title="Filter articles by collection category"
            >
              <option value="all">All Collections</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setShowIngestionModule(!showIngestionModule);
                setIsAdding(false);
              }}
              className={`font-sans text-xs px-3 py-2 rounded transition-all flex items-center gap-1.5 cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                showIngestionModule
                  ? 'bg-amber-900 text-white border-amber-900 dark:bg-amber-800'
                  : 'bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
              title="Import articles from files or text"
            >
              <FilePlus className="w-3.5 h-3.5" />
              Batch Import Dataset
            </button>

            <button
              onClick={() => {
                setIsAdding(!isAdding);
                setShowIngestionModule(false);
              }}
              className="font-sans text-xs bg-amber-900/10 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300 border border-amber-900/20 px-3 py-2 rounded hover:bg-amber-900/20 transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Document
            </button>
          </div>
        </div>

        {/* Data Ingestion Module if active */}
        {showIngestionModule && (
          <div className="animate-fadeIn mb-4">
            <DataIngestionModule
              existingPapers={papers}
              collections={collections}
              onIngestPapers={(newPapers) => {
                newPapers.forEach((paper) => onAddPaper(paper));
                setShowIngestionModule(false);
              }}
              onClose={() => setShowIngestionModule(false)}
            />
          </div>
        )}

        {/* Paper Adding Form if active */}
        {isAdding && (
          <form onSubmit={handleAddPaperSubmit} className="p-5 border border-amber-900/10 bg-amber-50/15 dark:bg-stone-900/20 dark:border-stone-800 rounded-lg space-y-4 animate-fadeIn">
            <h3 className="font-sans font-medium text-sm text-stone-900 dark:text-stone-100">Add New Reference Material</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Paper Title (Required)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200"
                required
              />
              <input
                type="text"
                placeholder="Authors (e.g., Jane Doe, John Smith)"
                value={newAuthors}
                onChange={(e) => setNewAuthors(e.target.value)}
                className="font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200"
              />
              <input
                type="text"
                placeholder="Journal or Conference Publication"
                value={newJournal}
                onChange={(e) => setNewJournal(e.target.value)}
                className="font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Year"
                  value={newYear}
                  onChange={(e) => setNewYear(Number(e.target.value))}
                  className="font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200"
                />
                <input
                  type="text"
                  placeholder="DOI Link or Identifier"
                  value={newDoi}
                  onChange={(e) => setNewDoi(e.target.value)}
                  className="font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200"
                />
              </div>
            </div>

            <textarea
              placeholder="Abstract or Summary"
              value={newAbstract}
              onChange={(e) => setNewAbstract(e.target.value)}
              className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 h-16"
            />
            <textarea
              placeholder="Personal Notes"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 h-16"
            />

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="font-sans text-xs px-3 py-2 border border-stone-200 rounded text-stone-500 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="font-sans text-xs bg-amber-950 text-white px-3 py-2 rounded hover:bg-amber-900 transition-colors"
              >
                Save Paper
              </button>
            </div>
          </form>
        )}

        {/* Papers Listing Grid Header & Progressive Disclosure Control */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800 text-xs font-sans text-stone-500">
          <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
            {filteredPapers.length} {filteredPapers.length === 1 ? 'reference' : 'references'}
          </span>
          {filteredPapers.length > 0 && (
            <button
              type="button"
              onClick={toggleExpandAll}
              className="flex items-center gap-1.5 text-[11px] text-amber-900 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-300 font-medium cursor-pointer transition-colors"
              title="Toggle expand or collapse all reference entries"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
              {filteredPapers.length > 0 && filteredPapers.every((p) => expandedPaperIds[p.id])
                ? 'Collapse All'
                : 'Expand All'}
            </button>
          )}
        </div>

        {/* Papers Listing Grid */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredPapers.map((p) => {
            const col = collections.find((c) => c.id === p.collectionId);
            const isExpanded = !!expandedPaperIds[p.id];

            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedPaper(p);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPaper(p);
                  }
                }}
                className={`p-3.5 border rounded-lg cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950 ${
                  selectedPaper?.id === p.id
                    ? 'border-amber-900/40 bg-amber-50/20 dark:bg-stone-900/40'
                    : 'border-stone-200 dark:border-stone-900 bg-white dark:bg-stone-950 hover:border-stone-300 dark:hover:border-stone-800'
                }`}
              >
                {/* Collapsed View: Shows ONLY title & expand toggle chevron */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => togglePaperExpand(p.id, e)}
                      className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 shrink-0 cursor-pointer transition-colors"
                      title={isExpanded ? 'Collapse reference details' : 'Expand reference details'}
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <h3 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-xs sm:text-sm truncate flex-1">
                      {p.title}
                    </h3>
                  </div>

                  {!isExpanded && (
                    <div className="flex items-center gap-2 shrink-0">
                      {p.verificationStatus === 'missing_metadata' && (
                        <span className="text-[9px] bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-200/50">
                          Incomplete
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => togglePaperExpand(p.id, e)}
                        className="text-[10px] text-stone-400 hover:text-amber-900 dark:hover:text-amber-400 font-sans cursor-pointer hidden sm:inline"
                        title="Click to expand full citation metadata"
                      >
                        Expand details
                      </button>
                    </div>
                  )}
                </div>

                {/* Progressive Disclosure: Expanded View with full metadata & actions */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-900 space-y-2 animate-fadeIn font-sans">
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                      <p className="text-[#1B0A3B]/80 dark:text-stone-300 font-medium">
                        <span className="text-stone-400 font-normal mr-1">Authors:</span>
                        {p.authors || 'Unknown Author'}
                      </p>

                      <div className="flex items-center gap-1.5">
                        {p.verificationStatus === 'missing_metadata' && (
                          <span className="text-[9px] bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-200/50">
                            Incomplete
                          </span>
                        )}
                        {p.verificationStatus === 'verified' && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-200/50">
                            Verified
                          </span>
                        )}
                        {col && (
                          <span className="px-1.5 py-0.5 rounded-full border text-[9px] bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-300">
                            {col.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-stone-500 dark:text-stone-400">
                      <span>{p.journal ? `${p.journal} (${p.year})` : p.year}</span>
                      <span className="font-mono text-[10px]">{p.doi ? `DOI: ${p.doi}` : 'No DOI'}</span>
                    </div>

                    {/* Formatted Citation Preview Snippet */}
                    <p className="font-serif text-[11px] text-amber-900/90 dark:text-amber-300/80 italic pt-2 border-t border-stone-100 dark:border-stone-900 mt-1">
                      <span className="font-mono text-[9px] uppercase font-bold not-italic text-stone-400 mr-1.5">[{citationStyle} Preview]:</span>
                      {formatPaperPreview(p, citationStyle)}
                    </p>

                    {/* Actions in Expanded View */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-900">
                      {p.verificationStatus === 'missing_metadata' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerifyMetadata(p);
                          }}
                          disabled={verifyingId === p.id}
                          className="font-sans text-[10px] bg-amber-900/10 dark:bg-amber-900/25 text-amber-900 dark:text-amber-400 border border-amber-900/20 px-2 py-0.5 rounded hover:bg-amber-900/20 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {verifyingId === p.id && (
                            <span className="w-2 h-2 border border-amber-900 border-t-transparent rounded-full animate-spin"></span>
                          )}
                          Repair Metadata
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete reference "${p.title}" permanently?`)) {
                            onDeletePaper(p.id);
                            if (selectedPaper?.id === p.id) {
                              setSelectedPaper(papers.find((item) => item.id !== p.id) || null);
                            }
                          }
                        }}
                        className="text-[10px] font-sans px-2 py-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer rounded flex items-center gap-1 border border-stone-200/60 dark:border-stone-800"
                        title="Delete reference"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredPapers.length === 0 && (
            <div className="text-left py-12 text-stone-400 dark:text-stone-500 font-sans text-xs">
              No matching literature found in your local library.
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Paper Details, Metadata, Notes and Annotations Inspector */}
      <div className="w-full lg:w-96 bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 rounded-lg p-5 flex flex-col justify-between">
        {selectedPaper ? (
          <div className="space-y-6">
            
            {/* Header detail */}
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-2">
                <span className="font-sans text-[9px] text-stone-400 tracking-wide">Document Inspector</span>
                <button
                  onClick={() => {
                    if (confirm('Delete this reference material permanently from local database?')) {
                      onDeletePaper(selectedPaper.id);
                      setSelectedPaper(papers.find((p) => p.id !== selectedPaper.id) || null);
                    }
                  }}
                  className="p-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1 text-xs font-sans"
                  title="Remove Paper"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              <h2 className="font-sans font-bold text-stone-900 dark:text-stone-100 text-base leading-snug">
                {selectedPaper.title}
              </h2>
              <p className="font-sans text-xs text-stone-600 dark:text-stone-400">
                {selectedPaper.authors}
              </p>
            </div>

            {/* Formatted Citation Preview Card with Dropdown */}
            <div className="p-3.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-stone-150 dark:border-stone-850 pb-2">
                <label htmlFor="inspector-citation-style-select" className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                   Formatted Citation Preview
                </label>

                {/* Dropdown to switch between common citation styles */}
                <select
                  id="inspector-citation-style-select"
                  value={citationStyle}
                  onChange={(e) => setCitationStyle(e.target.value as CommonCitationStyle)}
                  className="font-sans text-xs font-medium py-1 px-2 border border-stone-300 dark:border-stone-700 rounded bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Harvard">Harvard Reference</option>
                  <option value="APA">APA 7th Edition</option>
                  <option value="MLA">MLA 9th Edition</option>
                  <option value="Chicago">Chicago Author-Date</option>
                  <option value="IEEE">IEEE Format</option>
                </select>
              </div>

              {/* Quick Style Selector Buttons */}
              <div className="flex items-center gap-1 flex-wrap text-[10px] font-sans">
                <span className="text-stone-400 text-[9px] uppercase font-mono mr-0.5">Quick Style:</span>
                {(['Harvard', 'APA', 'MLA', 'Chicago', 'IEEE'] as CommonCitationStyle[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setCitationStyle(st)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                      citationStyle === st
                        ? 'bg-amber-900 text-white dark:bg-amber-800 font-bold'
                        : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Live Formatted Citation Box */}
              <div className="p-3 bg-amber-50/40 dark:bg-stone-900/60 border border-amber-900/10 dark:border-stone-800 rounded text-xs font-serif text-stone-800 dark:text-stone-200 leading-relaxed italic select-all">
                {formatPaperPreview(selectedPaper, citationStyle)}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <span className="font-mono text-[10px] text-stone-400">
                  Style: <strong className="text-stone-800 dark:text-stone-200">{citationStyle}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const text = formatPaperPreview(selectedPaper, citationStyle);
                    navigator.clipboard.writeText(text);
                    setCopiedCitation(true);
                    setTimeout(() => setCopiedCitation(false), 2000);
                  }}
                  className="px-2.5 py-1 bg-amber-900 text-white hover:bg-amber-800 dark:bg-amber-800 dark:hover:bg-amber-700 rounded font-sans font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  {copiedCitation ? (
                    <>
                       Copied to Clipboard
                    </>
                  ) : (
                    <>
                       Copy Citation
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Metadata check block */}
            <div className="p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded space-y-2">
              <h4 className="font-sans font-medium text-[10px] text-stone-400 dark:text-stone-500 tracking-wide">Metadata completeness</h4>
              
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-stone-500">DOI Reference:</span>
                <span className="font-mono text-[10px] text-stone-700 dark:text-stone-300">
                  {selectedPaper.doi || 'Not Found'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-stone-500">Status:</span>
                <span className={`capitalize font-semibold text-[10px] ${
                  selectedPaper.verificationStatus === 'verified' ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {selectedPaper.verificationStatus.replace('_', ' ')}
                </span>
              </div>

              {selectedPaper.missingFields.length > 0 && (
                <div className="pt-2 border-t border-stone-100 dark:border-stone-900">
                  <p className="text-[10px] font-sans text-amber-800 dark:text-amber-400 flex items-center gap-1">
                     Missing fields for citation formatting:
                  </p>
                  <p className="text-[10px] font-mono text-stone-400 mt-1">
                    {selectedPaper.missingFields.join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Abstract */}
            {selectedPaper.abstract && (
              <div className="space-y-1">
                <h4 className="font-sans font-semibold text-[10px] text-stone-400 tracking-wide">Abstract</h4>
                <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed italic line-clamp-4">
                  "{selectedPaper.abstract}"
                </p>
              </div>
            )}

            {/* Local Notes */}
            <div className="space-y-2">
              <label htmlFor="local-notes-textarea" className="font-sans font-semibold text-[10px] text-stone-400 tracking-wide block">Local notes</label>
              <textarea
                id="local-notes-textarea"
                value={selectedPaper.notes}
                onChange={(e) => {
                  const updated: Paper = { ...selectedPaper, notes: e.target.value };
                  onUpdatePaper(updated);
                  setSelectedPaper(updated);
                }}
                className="w-full font-sans text-xs p-3 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 h-24 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
                placeholder="Write your research notes, interpretations, or cross-reference queries..."
              />
            </div>

            {/* Highlights and Annotations workbench */}
            <div className="space-y-3">
              <h4 className="font-sans font-semibold text-[10px] text-stone-400 tracking-wide">Highlights & PDF annotations</h4>
              
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {selectedPaper.annotations.map((ann) => (
                  <div key={ann.id} className="p-2.5 bg-yellow-50/50 dark:bg-yellow-950/10 border-l-2 border-yellow-400 dark:border-yellow-700 rounded text-xs space-y-1 font-sans">
                    <div className="flex justify-between items-start text-[10px] text-stone-400">
                      <span>Highlighted excerpt:</span>
                      <button
                        onClick={() => handleDeleteAnnotation(ann.id)}
                        className="text-stone-400 hover:text-red-500 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded px-1"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="italic text-stone-700 dark:text-stone-300">"{ann.text}"</p>
                    {ann.comment && (
                      <div className="pt-1 text-[11px] text-stone-500 border-t border-yellow-200/50 dark:border-yellow-900/20">
                        <span className="font-semibold text-amber-800 dark:text-amber-500">Comment:</span> {ann.comment}
                      </div>
                    )}
                  </div>
                ))}

                {selectedPaper.annotations.length === 0 && (
                  <p className="font-sans text-xs text-stone-400 italic">No highlights recorded yet.</p>
                )}
              </div>

              {/* Add annotation form */}
              <form onSubmit={handleAddAnnotation} className="space-y-2 border-t border-stone-100 dark:border-stone-800 pt-3">
                <label htmlFor="new-annotation-text" className="sr-only">Highlighted text from paper</label>
                <input
                  id="new-annotation-text"
                  type="text"
                  placeholder="Paste highlighted text from paper..."
                  value={newAnnotationText}
                  onChange={(e) => setNewAnnotationText(e.target.value)}
                  className="w-full font-sans text-[11px] p-2 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
                  required
                />
                <label htmlFor="new-annotation-comment" className="sr-only">Marginal annotation comment (optional)</label>
                <input
                  id="new-annotation-comment"
                  type="text"
                  placeholder="Add marginal annotation comment (optional)..."
                  value={newAnnotationComment}
                  onChange={(e) => setNewAnnotationComment(e.target.value)}
                  className="w-full font-sans text-[11px] p-2 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
                />
                <button
                  type="submit"
                  className="w-full font-sans text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border py-1.5 rounded hover:bg-stone-250 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950 cursor-pointer"
                >
                  Record Highlight
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className="text-left py-24 text-stone-400 dark:text-stone-500 font-sans text-xs">
            <p>Select a document from the list to view its citation completeness, record notes, and manage marginal highlights.</p>
          </div>
        )}
      </div>

    </div>
  );
}
