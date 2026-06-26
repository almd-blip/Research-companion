/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Paper, Collection, Annotation } from '../types';
import { Search, Tag, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, FileText, Plus, Trash } from 'lucide-react';

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
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <label htmlFor="library-search" className="sr-only">Search Literature Library</label>
            <input
              id="library-search"
              type="text"
              placeholder="Search literature by title, author, tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full font-sans text-xs pl-9 pr-4 py-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
            />
          </div>

          <div className="flex gap-2">
            <label htmlFor="collection-filter" className="sr-only">Filter by Collection</label>
            <select
              id="collection-filter"
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="font-sans text-xs px-3 py-2 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
            >
              <option value="all">All Collections</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="font-sans text-xs bg-amber-900/10 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300 border border-amber-900/20 px-3 py-2 rounded hover:bg-amber-900/20 transition-all flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950"
            >
              <Plus className="w-4 h-4" /> Add Document
            </button>
          </div>
        </div>

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

        {/* Papers Listing Grid */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredPapers.map((p) => {
            const col = collections.find((c) => c.id === p.collectionId);
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPaper(p)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPaper(p);
                  }
                }}
                className={`p-4 border rounded-lg cursor-pointer transition-all flex justify-between items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950 ${
                  selectedPaper?.id === p.id
                    ? 'border-amber-900/30 bg-amber-50/15 dark:bg-stone-900/30'
                    : 'border-stone-200 dark:border-stone-900 bg-white dark:bg-stone-950 hover:border-stone-300 dark:hover:border-stone-800'
                }`}
              >
                <div className="space-y-1 pr-4 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-xs sm:text-sm line-clamp-1">
                      {p.title}
                    </h3>
                    {p.verificationStatus === 'missing_metadata' && (
                      <span className="flex items-center gap-0.5 text-[9px] bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-200/50">
                        <AlertTriangle className="w-2.5 h-2.5" /> Incomplete
                      </span>
                    )}
                    {p.verificationStatus === 'verified' && (
                      <span className="flex items-center gap-0.5 text-[9px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-200/50">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                      </span>
                    )}
                  </div>

                  <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">
                    {p.authors}
                  </p>

                  <div className="flex items-center gap-3 pt-2 text-[10px] text-stone-400 font-sans">
                    <span>{p.journal ? `${p.journal} (${p.year})` : p.year}</span>
                    {col && (
                      <span className="px-1.5 py-0.5 rounded-full border text-[9px] bg-stone-50 dark:bg-stone-900">
                        {col.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="font-mono text-[9px] text-stone-400">
                    {p.doi ? 'DOI Locked' : 'No DOI'}
                  </span>
                  
                  {p.verificationStatus === 'missing_metadata' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVerifyMetadata(p);
                      }}
                      disabled={verifyingId === p.id}
                      className="font-sans text-[10px] bg-amber-900/10 dark:bg-amber-900/25 text-amber-900 dark:text-amber-400 border border-amber-900/20 px-2 py-0.5 rounded hover:bg-amber-900/20 transition-all flex items-center gap-0.5"
                    >
                      {verifyingId === p.id ? (
                        <span className="w-2 h-2 border border-amber-900 border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <Sparkles className="w-2.5 h-2.5" />
                      )}
                      Repair
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredPapers.length === 0 && (
            <div className="text-center py-12 text-stone-400 dark:text-stone-500 font-sans text-xs">
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
                <span className="font-sans text-[9px] text-stone-400 uppercase tracking-wider">Document Inspector</span>
                <button
                  onClick={() => {
                    if (confirm('Delete this reference material permanently from local database?')) {
                      onDeletePaper(selectedPaper.id);
                      setSelectedPaper(papers.find((p) => p.id !== selectedPaper.id) || null);
                    }
                  }}
                  className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="Remove Paper"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>

              <h2 className="font-sans font-bold text-stone-900 dark:text-stone-100 text-base leading-snug">
                {selectedPaper.title}
              </h2>
              <p className="font-sans text-xs text-stone-600 dark:text-stone-400">
                {selectedPaper.authors}
              </p>
            </div>

            {/* Metadata check block */}
            <div className="p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded space-y-2">
              <h4 className="font-sans font-medium text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-wider">Metadata Completeness</h4>
              
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
                    <ShieldAlert className="w-3.5 h-3.5" /> Missing fields for citation formatting:
                  </p>
                  <p className="text-[10px] font-mono text-stone-400 uppercase mt-1">
                    {selectedPaper.missingFields.join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Abstract */}
            {selectedPaper.abstract && (
              <div className="space-y-1">
                <h4 className="font-sans font-semibold text-[10px] text-stone-400 uppercase tracking-wider">Abstract</h4>
                <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed italic line-clamp-4">
                  "{selectedPaper.abstract}"
                </p>
              </div>
            )}

            {/* Local Notes */}
            <div className="space-y-2">
              <label htmlFor="local-notes-textarea" className="font-sans font-semibold text-[10px] text-stone-400 uppercase tracking-wider block">Local Notes</label>
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
              <h4 className="font-sans font-semibold text-[10px] text-stone-400 uppercase tracking-wider">Highlights & PDF Annotations</h4>
              
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
          <div className="text-center py-24 text-stone-400 dark:text-stone-500 font-sans text-xs">
            <p>Select a document from the list to view its citation completeness, record notes, and manage marginal highlights.</p>
          </div>
        )}
      </div>

    </div>
  );
}
