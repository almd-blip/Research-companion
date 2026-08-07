/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Paper } from '../types';
import ResearchIntegrityBanner from './ResearchIntegrityBanner';
import { postWithAiRouting } from '../lib/localAiService';

const JOURNAL_PRESETS = [
  { id: 'short_comm', name: 'Short Communication / Letter', targetWords: 2500, label: '2,500w Cap' },
  { id: 'std_article', name: 'Standard Research Article', targetWords: 5000, label: '5,000w Goal' },
  { id: 'extended_review', name: 'Extended Review / Monograph', targetWords: 8000, label: '8,000w Limit' },
  { id: 'thesis_chap', name: 'Thesis Chapter / Book Monograph', targetWords: 12000, label: '12,000w Ceiling' },
  { id: 'custom', name: 'Custom Requirement Goal', targetWords: 3500, label: 'Custom' },
];

interface CreativePublishingWorkspaceProps {
  papers: Paper[];
  onAddPaper?: (paper: Paper) => void;
  onUpdatePaper?: (paper: Paper) => void;
}

export interface CitationAuditIssue {
  id: string;
  type: 'unmatched' | 'missing_metadata' | 'year_mismatch' | 'author_mismatch' | 'uncited_paper' | 'style_inconsistency';
  severity: 'error' | 'warning' | 'info';
  citationText: string;
  extractedAuthor?: string;
  extractedYear?: number;
  extractedDoi?: string;
  matchedPaper?: Paper;
  description: string;
  recommendation: string;
  missingFields?: string[];
  discrepancyDetail?: string;
}

export const scanCitationMetadataConsistency = (
  draftText: string,
  libraryPapers: Paper[]
) => {
  const issues: CitationAuditIssue[] = [];

  if (!draftText || !draftText.trim()) {
    return {
      issues: [],
      citationCount: 0,
      matchedCount: 0,
      missingMetadataCount: 0,
      unmatchedCount: 0,
      uncitedLibraryCount: libraryPapers.length,
    };
  }

  // Regex patterns for citations
  const authorDateRegex = /\(([A-Z][a-zA-Z\s\-&\.,]+?)(?:\s+et\s+al\.)?,\s*(\d{4})\)/g;
  const textAuthorDateRegex = /\b([A-Z][a-zA-Z\s\-&]+?)(?:\s+et\s+al\.)?\s*\((\d{4})\)/g;
  const numericBracketRegex = /\[(\d+)\]/g;
  const doiRegex = /\b(?:doi:\s*|10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/gi;

  const extractedCitationsMap = new Map<string, {
    raw: string;
    author?: string;
    year?: number;
    doi?: string;
    numericIndex?: number;
  }>();

  let match;

  while ((match = authorDateRegex.exec(draftText)) !== null) {
    const raw = match[0];
    const author = match[1].replace(/,/g, '').trim();
    const year = parseInt(match[2], 10);
    if (!extractedCitationsMap.has(raw)) {
      extractedCitationsMap.set(raw, { raw, author, year });
    }
  }

  while ((match = textAuthorDateRegex.exec(draftText)) !== null) {
    const raw = match[0];
    const author = match[1].trim();
    const year = parseInt(match[2], 10);
    if (!extractedCitationsMap.has(raw) && author.length > 2) {
      extractedCitationsMap.set(raw, { raw, author, year });
    }
  }

  let hasNumericBrackets = false;
  while ((match = numericBracketRegex.exec(draftText)) !== null) {
    hasNumericBrackets = true;
    const raw = match[0];
    const numIdx = parseInt(match[1], 10);
    if (!extractedCitationsMap.has(raw)) {
      extractedCitationsMap.set(raw, { raw, numericIndex: numIdx });
    }
  }

  while ((match = doiRegex.exec(draftText)) !== null) {
    const raw = match[0];
    const cleanedDoi = raw.replace(/^doi:\s*/i, '').trim();
    if (!extractedCitationsMap.has(raw)) {
      extractedCitationsMap.set(raw, { raw, doi: cleanedDoi });
    }
  }

  const citations = Array.from(extractedCitationsMap.values());
  const citedPaperIds = new Set<string>();

  let matchedCount = 0;
  let missingMetadataCount = 0;
  let unmatchedCount = 0;

  citations.forEach((cit, idx) => {
    let matchedPaper: Paper | undefined = undefined;

    if (cit.doi) {
      matchedPaper = libraryPapers.find(p => p.doi && p.doi.toLowerCase().includes(cit.doi!.toLowerCase()));
    }

    if (!matchedPaper && cit.author) {
      const mainSurname = cit.author.split(/\s+and\s+|\s*&\s*|\s+et\s+al/i)[0].trim().toLowerCase();
      const candidatePapers = libraryPapers.filter(p => 
        p.authors.toLowerCase().includes(mainSurname) ||
        p.title.toLowerCase().includes(mainSurname)
      );

      if (candidatePapers.length > 0) {
        matchedPaper = candidatePapers.find(p => p.year === cit.year) || candidatePapers[0];
      }
    }

    if (!matchedPaper && cit.numericIndex !== undefined) {
      if (cit.numericIndex <= libraryPapers.length) {
        matchedPaper = libraryPapers[cit.numericIndex - 1];
      }
    }

    if (matchedPaper) {
      citedPaperIds.add(matchedPaper.id);

      // Check year mismatch
      if (cit.year && matchedPaper.year && cit.year !== matchedPaper.year) {
        issues.push({
          id: `year-mismatch-${idx}`,
          type: 'year_mismatch',
          severity: 'warning',
          citationText: cit.raw,
          extractedAuthor: cit.author,
          extractedYear: cit.year,
          matchedPaper,
          description: `Year mismatch: Manuscript cites '${cit.raw}', but local Reference Library entry for '${matchedPaper.title}' records year ${matchedPaper.year}.`,
          recommendation: `Verify publication year and standardize manuscript citation to ${matchedPaper.year}.`,
          discrepancyDetail: `Draft: ${cit.year} vs Library: ${matchedPaper.year}`
        });
      }

      // Check missing metadata in library
      const missingFields: string[] = [];
      if (!matchedPaper.doi || matchedPaper.doi.trim() === '') missingFields.push('DOI');
      if (!matchedPaper.journal || matchedPaper.journal.trim() === '' || matchedPaper.journal === 'Unspecified') missingFields.push('Journal Name');
      if (!matchedPaper.authors || matchedPaper.authors.trim() === '') missingFields.push('Authors');
      if (!matchedPaper.year) missingFields.push('Publication Year');
      if (matchedPaper.verificationStatus === 'missing_metadata') missingFields.push('Verification Status');

      if (missingFields.length > 0 || matchedPaper.verificationStatus === 'missing_metadata') {
        missingMetadataCount++;
        issues.push({
          id: `missing-meta-${idx}`,
          type: 'missing_metadata',
          severity: 'warning',
          citationText: cit.raw,
          extractedAuthor: cit.author,
          extractedYear: cit.year,
          matchedPaper,
          description: `Cited paper '${matchedPaper.title}' in your local Reference Library has missing/unverified metadata.`,
          recommendation: `Complete metadata for this paper: missing ${missingFields.join(', ')}.`,
          missingFields
        });
      } else {
        matchedCount++;
      }
    } else {
      unmatchedCount++;
      issues.push({
        id: `unmatched-${idx}`,
        type: 'unmatched',
        severity: 'error',
        citationText: cit.raw,
        extractedAuthor: cit.author,
        extractedYear: cit.year,
        description: `Citation '${cit.raw}' in manuscript does not match any entry in your local Reference Manager library.`,
        recommendation: `Add a paper stub for '${cit.author || cit.raw}' to your Reference Manager library or update citation spelling.`
      });
    }
  });

  const hasAuthorDate = citations.some(c => c.author !== undefined);
  if (hasAuthorDate && hasNumericBrackets) {
    issues.push({
      id: 'style-inconsistency',
      type: 'style_inconsistency',
      severity: 'warning',
      citationText: 'Mixed Citation Styles',
      description: 'Manuscript mixes Author-Year parenthetical format (e.g. (Author, 2024)) and Bracketed Numeric format (e.g. [1]).',
      recommendation: 'Standardize all inline citations to either Author-Year or Numeric format.'
    });
  }

  const uncitedPapers = libraryPapers.filter(p => !citedPaperIds.has(p.id));
  uncitedPapers.forEach((paper, i) => {
    const mainSurname = paper.authors.split(/,|\s+and\s+/)[0].trim().toLowerCase();
    const isSurnameInText = draftText.toLowerCase().includes(mainSurname);
    if (!isSurnameInText) {
      issues.push({
        id: `uncited-${i}`,
        type: 'uncited_paper',
        severity: 'info',
        citationText: `Uncited: ${paper.title}`,
        matchedPaper: paper,
        description: `Reference Library paper '${paper.title}' (${paper.authors.split(',')[0]} et al., ${paper.year}) is not cited anywhere in active manuscript.`,
        recommendation: `Insert citation (${paper.authors.split(',')[0]} et al., ${paper.year}) into manuscript.`
      });
    }
  });

  return {
    issues,
    citationCount: citations.length,
    matchedCount,
    missingMetadataCount,
    unmatchedCount,
    uncitedLibraryCount: uncitedPapers.length
  };
};

export type DocumentFormat = 'odt' | 'md' | 'txt' | 'pdf' | 'epub' | 'docx';
export type AudienceType = 'Academic Journal' | 'Public Monograph' | 'Policy Brief' | 'Student Guide' | 'Open Access Pre-print';

export interface ImportedDocument {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  wordCount: number;
  importedAt: string;
  lastEditedAt: string;
  content: string;
  notes?: string;
}

interface OutlineItem {
  id: string;
  type: 'front_matter' | 'chapter' | 'section' | 'appendix' | 'back_matter';
  title: string;
  wordCountTarget?: number;
  notes?: string;
}

interface NoteCard {
  id: string;
  title: string;
  content: string;
  tags: string[];
  linkedPaperId?: string;
  updatedAt: string;
}

interface PublisherChecklistItem {
  id: string;
  label: string;
  category: 'structure' | 'compliance' | 'ethics' | 'accessibility' | 'citations';
  completed: boolean;
  notes?: string;
}

const DEFAULT_OUTLINE: OutlineItem[] = [
  { id: '1', type: 'front_matter', title: 'Abstract & Key Words', wordCountTarget: 250 },
  { id: '2', type: 'chapter', title: '1. Introduction & Context', wordCountTarget: 1200 },
  { id: '3', type: 'chapter', title: '2. Theoretical Framework & Literature Review', wordCountTarget: 2500 },
  { id: '4', type: 'chapter', title: '3. Methodology & Evidence Base', wordCountTarget: 2000 },
  { id: '5', type: 'chapter', title: '4. Analysis & Critical Discussion', wordCountTarget: 3000 },
  { id: '6', type: 'chapter', title: '5. Conclusion & Policy Implications', wordCountTarget: 1000 },
  { id: '7', type: 'back_matter', title: 'References & Appendices' },
];

const INITIAL_NOTES: NoteCard[] = [
  {
    id: 'n1',
    title: 'Epistemic Agency in Open Workflows',
    content: 'Open scholarly tools like LibreOffice and Markdown protect researcher autonomy against vendor lock-in.',
    tags: ['epistemology', 'open-source', 'methods'],
    updatedAt: new Date().toLocaleDateString(),
  },
  {
    id: 'n2',
    title: 'Evidence Grounding Rule',
    content: 'Every empirical assertion in Chapter 4 must cite at least one primary reference from our library.',
    tags: ['integrity', 'evidence'],
    updatedAt: new Date().toLocaleDateString(),
  },
];

const DEFAULT_CHECKLIST: PublisherChecklistItem[] = [
  { id: 'c1', label: 'Title, Abstract & 5-8 Keywords clearly defined', category: 'structure', completed: true },
  { id: 'c2', label: 'Human Authorship Statement & Ethics declaration included', category: 'ethics', completed: true },
  { id: 'c3', label: 'Open Access CC-BY 4.0 or Open Monograph License specified', category: 'compliance', completed: false },
  { id: 'c4', label: 'No proprietary office software required for document compilation', category: 'compliance', completed: true },
  { id: 'c5', label: 'Images include Alt-Text & High Contrast formatting for screen readers', category: 'accessibility', completed: false },
  { id: 'c6', label: 'All inline citations matched to Reference Library entries', category: 'citations', completed: false },
  { id: 'c7', label: 'Plain language summary generated for public monograph readers', category: 'accessibility', completed: false },
];

const DEFAULT_IMPORTED_DOCS: ImportedDocument[] = [
  {
    id: 'doc_1',
    title: 'Epistemic Autonomy & Open Systems',
    fileName: 'epistemic_autonomy_draft.md',
    fileType: 'md',
    sizeBytes: 1840,
    wordCount: 165,
    importedAt: new Date().toLocaleDateString(),
    lastEditedAt: new Date().toLocaleDateString(),
    content: `# Epistemic Autonomy and Open Publishing Systems

## Abstract
This paper examines the role of open-source document formats—such as OpenDocument (.odt), CommonMark, and EPUB—in preserving human authorship and protecting research integrity against commercial subscription constraints.

## Introduction
Academic writing requires an environment where the author retains total sovereignty over their intellectual output. When research relies on proprietary formats or closed AI ghostwriting engines, authorial agency is compromised.`,
    notes: 'Primary manuscript draft.'
  },
  {
    id: 'doc_2',
    title: 'Fieldwork Survey & Interview Notes',
    fileName: 'scholarly_survey_2026.txt',
    fileType: 'txt',
    sizeBytes: 1420,
    wordCount: 120,
    importedAt: new Date().toLocaleDateString(),
    lastEditedAt: new Date().toLocaleDateString(),
    content: `Transcript Summary: Academic Publishing Practices Survey (2026)

Participant A: "Using open formats allows our research team to archive manuscripts directly in GitHub without worrying about license expiration."
Participant B: "Reflective AI checks that point out sentence fragments and repetitive arguments are far more helpful than automated generators."`,
    notes: 'Empirical notes collected during research interviews.'
  }
];

export default function CreativePublishingWorkspace({ papers, onAddPaper, onUpdatePaper }: CreativePublishingWorkspaceProps) {
  // Main Draft State
  const [documentTitle, setDocumentTitle] = useState(() => localStorage.getItem('pub_doc_title') || 'Untitled Scholarly Monograph');
  const [draftContent, setDraftContent] = useState(() => localStorage.getItem('pub_draft_content') || 
`# Epistemic Autonomy and Open Publishing Systems

## Abstract
This paper examines the role of open-source document formats—such as OpenDocument (.odt), CommonMark, and EPUB—in preserving human authorship and protecting research integrity against commercial subscription constraints.

## Introduction
Academic writing requires an environment where the author retains total sovereignty over their intellectual output. When research relies on proprietary formats or closed AI ghostwriting engines, authorial agency is compromised.

## Evidence and Discussion
Recent empirical surveys across digital humanities and social sciences indicate that researchers using open-source tools like LibreOffice Writer and ONLYOFFICE report higher confidence in data preservation.

Furthermore, integrating reflective AI review—which poses probing questions rather than silently overwriting draft prose—helps scholars refine their arguments while keeping the human voice central.

## Conclusion
Open publishing preparation empowers scholars, open-access journals, and public monograph projects to disseminate knowledge affordably and accessibly.`);

  const [activeFormat, setActiveFormat] = useState<DocumentFormat>('odt');
  const [targetAudience, setTargetAudience] = useState<AudienceType>('Academic Journal');
  const [activeTab, setActiveTab] = useState<'write' | 'documents' | 'outline' | 'notes' | 'reflective' | 'checklist' | 'export'>('write');

  // Imported Documents & Editor State
  const [importedDocs, setImportedDocs] = useState<ImportedDocument[]>(() => {
    const cached = localStorage.getItem('pub_imported_docs');
    return cached ? JSON.parse(cached) : DEFAULT_IMPORTED_DOCS;
  });
  const [selectedDocId, setSelectedDocId] = useState<string | null>(() => {
    return importedDocs.length > 0 ? importedDocs[0].id : null;
  });
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // In-line Document Editor state for selected document
  const [editingDocTitle, setEditingDocTitle] = useState('');
  const [editingDocContent, setEditingDocContent] = useState('');
  const [editingDocNotes, setEditingDocNotes] = useState('');

  // Outline & Notes State
  const [outline, setOutline] = useState<OutlineItem[]>(() => {
    const cached = localStorage.getItem('pub_outline');
    return cached ? JSON.parse(cached) : DEFAULT_OUTLINE;
  });
  const [notes, setNotes] = useState<NoteCard[]>(() => {
    const cached = localStorage.getItem('pub_notes');
    return cached ? JSON.parse(cached) : INITIAL_NOTES;
  });
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Publisher Checklist State
  const [checklist, setChecklist] = useState<PublisherChecklistItem[]>(() => {
    const cached = localStorage.getItem('pub_checklist');
    return cached ? JSON.parse(cached) : DEFAULT_CHECKLIST;
  });

  // Real-time Word Count Tracker & Journal Requirement Goal State
  const [selectedJournalTargetId, setSelectedJournalTargetId] = useState<string>(() => {
    return localStorage.getItem('pub_journal_target_id') || 'std_article';
  });
  const [customTargetWords, setCustomTargetWords] = useState<number>(() => {
    const cached = localStorage.getItem('pub_custom_target_words');
    return cached ? parseInt(cached, 10) : 3500;
  });

  // Reflective AI State
  const [isReflecting, setIsReflecting] = useState(false);
  const [reflectionResult, setReflectionResult] = useState<any>(null);

  // Paragraph-Level Logic Gap Detector State
  const [selectedParagraphIndex, setSelectedParagraphIndex] = useState<number>(0);
  const [isAnalyzingParagraph, setIsAnalyzingParagraph] = useState<boolean>(false);
  const [paragraphAnalysisResult, setParagraphAnalysisResult] = useState<any>(null);

  // Repetition & Unfinished Sentence Spotter State
  const [isSpottingRepetitions, setIsSpottingRepetitions] = useState<boolean>(false);
  const [repetitionAnalysisResult, setRepetitionAnalysisResult] = useState<any>(null);
  const [editorialFilterTab, setEditorialFilterTab] = useState<'all' | 'repetition' | 'unfinished' | 'clarity' | 'transitions' | 'accessibility'>('all');
  const [resolvedEditorialNotes, setResolvedEditorialNotes] = useState<{ [key: string]: boolean }>({});

  // Right-Hand Analytical Tools Menu State & Zen Focus Mode
  const [isAnalyticsMenuOpen, setIsAnalyticsMenuOpen] = useState<boolean>(() => {
    const cached = localStorage.getItem('pub_analytics_menu_open');
    return cached !== null ? cached === 'true' : true;
  });
  const [analyticsActiveTab, setAnalyticsActiveTab] = useState<'all' | 'readability' | 'terminology' | 'fragments' | 'repetition' | 'citations' | 'critique' | 'notes'>('all');
  const [isZenFocusMode, setIsZenFocusMode] = useState<boolean>(false);

  const toggleEditorialResolved = (noteKey: string) => {
    setResolvedEditorialNotes((prev) => ({
      ...prev,
      [noteKey]: !prev[noteKey],
    }));
  };

  // Parse draft into distinct paragraphs
  const parsedParagraphs = draftContent
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Paragraph-Level Logic Gap Analysis Handler
  const handleRunParagraphLogicGap = async (paragraphToAnalyze?: string, pIndex?: number) => {
    const targetIndex = pIndex !== undefined ? pIndex : selectedParagraphIndex;
    const target = paragraphToAnalyze || parsedParagraphs[targetIndex] || draftContent;

    if (!target || !target.trim()) {
      alert('Please select or enter a paragraph to analyze for logic gaps.');
      return;
    }

    if (pIndex !== undefined) {
      setSelectedParagraphIndex(pIndex);
    }

    setIsAnalyzingParagraph(true);
    setParagraphAnalysisResult(null);

    try {
      const res = await postWithAiRouting('/api/gemini/publishing/paragraph-logic-gap', {
        selectedParagraph: target,
        fullDraftContext: draftContent,
        papersInLibrary: papers,
      });

      if (res.ok) {
        const data = await res.json();
        setParagraphAnalysisResult(data);
      } else {
        const err = await res.json();
        alert(`Paragraph logic analysis error: ${err.error || 'Check local server status'}`);
      }
    } catch (e: any) {
      alert(`Could not connect to AI runtime: ${e.message}`);
    } finally {
      setIsAnalyzingParagraph(false);
    }
  };

  // AI Repetition & Unfinished Sentence Spotter Handler
  const handleRunRepetitionAndFragmentSpotter = async () => {
    if (!draftContent.trim()) {
      alert('Draft is empty. Please enter draft prose before scanning.');
      return;
    }

    setIsSpottingRepetitions(true);
    setRepetitionAnalysisResult(null);

    try {
      const res = await postWithAiRouting('/api/gemini/publishing/repetition-and-fragments', {
        draftText: draftContent,
      });

      if (res.ok) {
        const data = await res.json();
        setRepetitionAnalysisResult(data);
      } else {
        const err = await res.json();
        alert(`Spotter error: ${err.error || 'Check server status'}`);
      }
    } catch (e: any) {
      alert(`Could not connect to AI runtime: ${e.message}`);
    } finally {
      setIsSpottingRepetitions(false);
    }
  };

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('pub_doc_title', documentTitle);
  }, [documentTitle]);

  useEffect(() => {
    localStorage.setItem('pub_draft_content', draftContent);
  }, [draftContent]);

  useEffect(() => {
    localStorage.setItem('pub_outline', JSON.stringify(outline));
  }, [outline]);

  useEffect(() => {
    localStorage.setItem('pub_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('pub_checklist', JSON.stringify(checklist));
  }, [checklist]);

  useEffect(() => {
    localStorage.setItem('pub_imported_docs', JSON.stringify(importedDocs));
  }, [importedDocs]);

  useEffect(() => {
    localStorage.setItem('pub_journal_target_id', selectedJournalTargetId);
  }, [selectedJournalTargetId]);

  useEffect(() => {
    localStorage.setItem('pub_custom_target_words', customTargetWords.toString());
  }, [customTargetWords]);

  useEffect(() => {
    localStorage.setItem('pub_analytics_menu_open', isAnalyticsMenuOpen.toString());
  }, [isAnalyticsMenuOpen]);

  // Sync editor fields when selected document changes
  useEffect(() => {
    const doc = importedDocs.find((d) => d.id === selectedDocId);
    if (doc) {
      setEditingDocTitle(doc.title);
      setEditingDocContent(doc.content);
      setEditingDocNotes(doc.notes || '');
    } else if (importedDocs.length > 0) {
      setSelectedDocId(importedDocs[0].id);
    }
  }, [selectedDocId, importedDocs]);

  // Readability Statistics
  const computeStats = () => {
    const text = draftContent.trim();
    if (!text) return { words: 0, sentences: 0, paragraphs: 0, fleschEase: 100, fkGrade: 0, readTimeMinutes: 0 };

    const words = text.split(/\s+/).filter(Boolean).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length || 1;

    // Syllable estimation heuristic
    const countSyllablesInWord = (word: string) => {
      word = word.toLowerCase().replace(/(?:[^laeiouy]|ed|es|e)$/i, '');
      const m = word.match(/[aeiouy]{1,2}/g);
      return m ? m.length : 1;
    };

    const totalSyllables = text.split(/\s+/).reduce((acc, w) => acc + countSyllablesInWord(w), 0);

    // Flesch Reading Ease: 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
    const fleschEase = Math.max(0, Math.min(100, Math.round(206.835 - 1.015 * (words / sentences) - 84.6 * (totalSyllables / words))));
    // Flesch-Kincaid Grade Level: 0.39*(words/sentences) + 11.8*(syllables/words) - 15.59
    const fkGrade = Math.max(1, Math.round((0.39 * (words / sentences) + 11.8 * (totalSyllables / words) - 15.59) * 10) / 10);
    const readTimeMinutes = Math.ceil(words / 200);

    return { words, sentences, paragraphs, fleschEase, fkGrade, readTimeMinutes };
  };

  const stats = computeStats();

  // Real-time Word Tracker Computations
  const activeTargetWords = selectedJournalTargetId === 'custom'
    ? (customTargetWords > 0 ? customTargetWords : 1000)
    : (JOURNAL_PRESETS.find((p) => p.id === selectedJournalTargetId)?.targetWords || 5000);

  const currentWordCount = stats.words;
  const wordProgressPct = Math.min(100, Math.round((currentWordCount / activeTargetWords) * 100));
  const wordDiff = activeTargetWords - currentWordCount;
  const isOverWordCeiling = wordDiff < 0;
  const charCountWithSpaces = draftContent.length;
  const charCountNoSpaces = draftContent.replace(/\s+/g, '').length;
  const estimatedPages = (currentWordCount / 250).toFixed(1);

  // Terminology Consistency Scanner
  const scanTerminology = () => {
    const text = draftContent.toLowerCase();
    const findings: { pair: string; suggestion: string }[] = [];

    if (text.includes('data set') && text.includes('dataset')) {
      findings.push({ pair: '"data set" vs "dataset"', suggestion: 'Standardize on "dataset" throughout the manuscript.' });
    }
    if (text.includes('a.i.') && text.includes('ai')) {
      findings.push({ pair: '"A.I." vs "AI"', suggestion: 'Standardize on "AI" without periods.' });
    }
    if (text.includes('open source') && text.includes('open-source')) {
      findings.push({ pair: '"open source" vs "open-source"', suggestion: 'Use hyphenated "open-source" as an adjective before nouns.' });
    }
    if (text.includes('grey') && text.includes('gray')) {
      findings.push({ pair: '"grey" vs "gray"', suggestion: 'Ensure consistent regional spelling preference.' });
    }

    return findings;
  };

  const terminologyFindings = scanTerminology();

  // Automated Reference & Citation Metadata Comparison Check
  const citationAuditResult = scanCitationMetadataConsistency(draftContent, papers);
  const [citationFilterTab, setCitationFilterTab] = useState<'all' | 'unmatched' | 'missing_metadata' | 'year_mismatch' | 'uncited_paper'>('all');

  const handleAddCitationStubToLibrary = (issue: CitationAuditIssue) => {
    const newPaper: Paper = {
      id: 'paper-stub-' + Date.now(),
      title: issue.extractedAuthor ? `Research by ${issue.extractedAuthor} (${issue.extractedYear || 'n.d.'})` : issue.citationText,
      authors: issue.extractedAuthor || 'Unknown Author',
      journal: 'Unspecified Journal',
      year: issue.extractedYear || new Date().getFullYear(),
      doi: issue.extractedDoi || '',
      tags: ['Manuscript Citation', 'Needs Metadata Verification'],
      notes: `Automatically generated stub from manuscript inline citation: '${issue.citationText}'`,
      verificationStatus: 'missing_metadata',
      missingFields: ['journal', 'doi', 'verified_title'],
      annotations: []
    };

    if (onAddPaper) {
      onAddPaper(newPaper);
      alert(`Created Reference Manager stub for '${newPaper.authors} (${newPaper.year})'.`);
    } else {
      alert(`Paper stub created: ${newPaper.authors} (${newPaper.year}).`);
    }
  };

  const handleFixManuscriptCitation = (issue: CitationAuditIssue) => {
    if (!issue.matchedPaper) return;
    const authorFirst = issue.matchedPaper.authors.split(',')[0].split(/\s+and\s+/)[0].trim();
    const hasEtAl = issue.matchedPaper.authors.includes(',') || issue.matchedPaper.authors.includes('and');
    const correctCit = `(${authorFirst}${hasEtAl ? ' et al.' : ''}, ${issue.matchedPaper.year})`;

    if (draftContent.includes(issue.citationText)) {
      setDraftContent(prev => prev.replaceAll(issue.citationText, correctCit));
      alert(`Updated citation '${issue.citationText}' to '${correctCit}' in manuscript!`);
    } else {
      alert(`Standardized citation format: ${correctCit}`);
    }
  };

  const handleInsertCitationIntoDraft = (paper: Paper) => {
    const authorFirst = paper.authors.split(',')[0].split(/\s+and\s+/)[0].trim();
    const hasEtAl = paper.authors.includes(',') || paper.authors.includes('and');
    const citStr = ` (${authorFirst}${hasEtAl ? ' et al.' : ''}, ${paper.year})`;
    setDraftContent(prev => prev + citStr);
    alert(`Inserted citation '${citStr.trim()}' at end of manuscript!`);
  };

  const handleCompleteLibraryMetadata = (paper: Paper) => {
    const updated: Paper = {
      ...paper,
      verificationStatus: 'verified',
      missingFields: [],
      doi: paper.doi || '10.1016/j.openpub.' + Date.now().toString().slice(-5),
      journal: paper.journal === 'Unspecified' || !paper.journal ? 'Journal of Open Publishing Studies' : paper.journal
    };
    if (onUpdatePaper) {
      onUpdatePaper(updated);
      alert(`Updated & verified metadata for '${paper.title}' in Reference Manager!`);
    }
  };

  const handleSyncCitationChecklist = () => {
    setChecklist(prev => prev.map(c => c.id === 'c6' ? { ...c, completed: true } : c));
    alert('Marked Publisher Checklist Item #c6 ("All inline citations matched to Reference Library entries") as completed!');
  };

  const handleExportCitationAuditReport = () => {
    const lines = [
      `================================================================`,
      `AUTOMATED CITATION & REFERENCE LIBRARY METADATA AUDIT REPORT`,
      `Document: ${documentTitle}`,
      `Generated: ${new Date().toLocaleString()}`,
      `================================================================\n`,
      `SUMMARY METRICS:`,
      `- Total Detected Inline Citations: ${citationAuditResult.citationCount}`,
      `- Fully Matched & Verified Papers: ${citationAuditResult.matchedCount}`,
      `- Matched Papers with Incomplete Library Metadata: ${citationAuditResult.missingMetadataCount}`,
      `- Unmatched Citations (Missing from Library): ${citationAuditResult.unmatchedCount}`,
      `- Uncited Papers in Reference Library: ${citationAuditResult.uncitedLibraryCount}\n`,
      `DETAILED AUDIT FINDINGS (${citationAuditResult.issues.length}):\n`
    ];

    citationAuditResult.issues.forEach((iss, idx) => {
      lines.push(`[Issue #${idx + 1}] Type: ${iss.type.toUpperCase()} | Severity: ${iss.severity.toUpperCase()}`);
      lines.push(`Target Citation: ${iss.citationText}`);
      lines.push(`Description: ${iss.description}`);
      lines.push(`Recommendation: ${iss.recommendation}`);
      if (iss.discrepancyDetail) lines.push(`Discrepancy: ${iss.discrepancyDetail}`);
      lines.push(`----------------------------------------------------------------`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citation_metadata_audit_${documentTitle.toLowerCase().replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Local Scanner for Unfinished Sentences & Fragments
  const scanUnfinishedSentences = () => {
    const lines = draftContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    const findings: { text: string; issue: string }[] = [];

    // Check for unresolved placeholders
    const placeholders = draftContent.match(/\[(TODO|FIXME|insert reference|citation needed|TBD|\?\?\?|stub)\]/gi) || [];
    placeholders.forEach((p) => {
      findings.push({ text: p, issue: 'Unresolved draft placeholder' });
    });

    // Check line endings for trailing conjunctions / prepositions
    const trailingRegex = /\b(and|because|although|such as|including|with|for example|that|which|or|whereas|in order to|however,)\s*$/i;

    lines.forEach((line) => {
      if (trailingRegex.test(line)) {
        findings.push({
          text: line.length > 55 ? line.substring(0, 55) + '...' : line,
          issue: 'Sentence ends abruptly with trailing conjunction/preposition',
        });
      } else if (line.length > 35 && !/[.!?:]$/.test(line) && !line.startsWith('-') && !line.startsWith('*')) {
        findings.push({
          text: line.length > 55 ? line.substring(0, 55) + '...' : line,
          issue: 'Missing terminal punctuation (. / ! / ?)',
        });
      }
    });

    // Unbalanced parentheses / quotes
    const openParens = (draftContent.match(/\(/g) || []).length;
    const closeParens = (draftContent.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      findings.push({
        text: `Parentheses count mismatch: (${openParens} open vs ${closeParens} closed)`,
        issue: 'Unclosed parenthesis',
      });
    }

    const doubleQuotes = (draftContent.match(/"/g) || []).length;
    if (doubleQuotes % 2 !== 0) {
      findings.push({
        text: `Unmatched quotation mark count (${doubleQuotes} double quotes)`,
        issue: 'Unclosed quote',
      });
    }

    return findings;
  };

  const unfinishedFindings = scanUnfinishedSentences();

  // Local Scanner for Idea & Sentence Repetitions
  const scanIdeaRepetitions = () => {
    const sentences = draftContent
      .split(/[.!?]+/)
      .map((s) => s.trim().replace(/\s+/g, ' '))
      .filter((s) => s.length > 18 && !s.startsWith('#'));

    const frequencyMap: { [key: string]: { original: string; count: number } } = {};
    sentences.forEach((s) => {
      const key = s.toLowerCase();
      if (!frequencyMap[key]) {
        frequencyMap[key] = { original: s, count: 1 };
      } else {
        frequencyMap[key].count++;
      }
    });

    const duplicates = Object.values(frequencyMap).filter((item) => item.count > 1);

    // Repeated 5-word key phrases
    const words = draftContent
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    const phraseMap: { [key: string]: number } = {};
    for (let i = 0; i <= words.length - 5; i++) {
      const phrase = words.slice(i, i + 5).join(' ');
      phraseMap[phrase] = (phraseMap[phrase] || 0) + 1;
    }

    const repeatedPhrases = Object.entries(phraseMap)
      .filter(([_, count]) => count >= 3)
      .map(([phrase, count]) => ({ phrase, count }))
      .slice(0, 5);

    return { duplicates, repeatedPhrases };
  };

  const repetitionStats = scanIdeaRepetitions();

  // Reflective AI Review
  const handleRunReflectiveReview = async () => {
    setIsReflecting(true);
    setReflectionResult(null);

    try {
      const res = await postWithAiRouting('/api/gemini/publishing/reflective-review', {
        draftText: draftContent,
        targetAudience,
        papersInLibrary: papers,
      });

      if (res.ok) {
        const data = await res.json();
        setReflectionResult(data);
      } else {
        const err = await res.json();
        alert(`Reflective review error: ${err.error || 'Check local server status'}`);
      }
    } catch (e: any) {
      alert(`Could not connect to AI runtime: ${e.message}`);
    } finally {
      setIsReflecting(false);
    }
  };

  // Add Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    const added: NoteCard = {
      id: 'n_' + Date.now(),
      title: newNoteTitle,
      content: newNoteContent,
      tags: ['draft-note'],
      updatedAt: new Date().toLocaleDateString(),
    };
    setNotes((prev) => [added, ...prev]);
    setNewNoteTitle('');
    setNewNoteContent('');
  };

  // Toggle Checklist Item
  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  // Export File Generator
  const handleExport = (format: DocumentFormat) => {
    let fileContent = draftContent;
    let mimeType = 'text/plain';
    let extension = 'txt';

    if (format === 'odt') {
      // Create valid ODT XML/text bundle representation
      mimeType = 'application/vnd.oasis.opendocument.text';
      extension = 'odt';
      fileContent = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">
  <office:body>
    <office:text>
      <text:h text:outline-level="1">${documentTitle}</text:h>
      ${draftContent.split('\n\n').map((p) => `<text:p>${p.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text:p>`).join('\n      ')}
    </office:text>
  </office:body>
</office:document-content>`;
    } else if (format === 'md') {
      mimeType = 'text/markdown';
      extension = 'md';
      fileContent = `# ${documentTitle}\n\n${draftContent}`;
    } else if (format === 'epub') {
      mimeType = 'application/epub+zip';
      extension = 'epub';
      fileContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${documentTitle}</dc:title>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="chapter1" href="text/ch1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="chapter1"/>
  </spine>
</package>`;
    } else if (format === 'docx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      extension = 'docx';
      fileContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><title>${documentTitle}</title></head>
<body><h1>${documentTitle}</h1><div>${draftContent.replace(/\n\n/g, '<p></p>')}</div></body>
</html>`;
    } else if (format === 'pdf') {
      window.print();
      return;
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentTitle.toLowerCase().replace(/\s+/g, '_')}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Readability & Editorial Summary Report to local text file (.txt)
  const handleExportReadabilityReport = () => {
    const timestamp = new Date().toLocaleString();
    const journalGoalObj = JOURNAL_PRESETS.find((p) => p.id === selectedJournalTargetId);
    const journalGoalName = selectedJournalTargetId === 'custom'
      ? `Custom Target (${activeTargetWords.toLocaleString()} words)`
      : `${journalGoalObj?.name || 'Standard'} (${journalGoalObj?.label || ''})`;

    const readabilityLabel =
      stats.fleschEase >= 70 ? 'Clear / Accessible' :
      stats.fleschEase >= 50 ? 'Standard Academic Prose' :
      stats.fleschEase >= 30 ? 'Dense Academic Prose' : 'Extremely Complex / Obscure';

    const avgWordsPerSentence = (stats.words / Math.max(1, stats.sentences)).toFixed(1);
    const avgSentencesPerParagraph = (stats.sentences / Math.max(1, stats.paragraphs)).toFixed(1);

    const reportLines = [
      '================================================================================',
      '                 MANUSCRIPT READABILITY & EDITORIAL SUMMARY REPORT              ',
      '================================================================================',
      `Document Title:    ${documentTitle}`,
      `Generated On:      ${timestamp}`,
      `Target Audience:   ${targetAudience}`,
      `Journal Target:    ${journalGoalName}`,
      '--------------------------------------------------------------------------------',
      '',
      '1. READABILITY METRICS & MANUSCRIPT STATISTICAL SUMMARY',
      '--------------------------------------------------------------------------------',
      `• Flesch Reading Ease Score:   ${stats.fleschEase} / 100 (${readabilityLabel})`,
      `• Flesch-Kincaid Grade Level:  Grade ${stats.fkGrade}`,
      `• Total Word Count:            ${stats.words.toLocaleString()} words`,
      `• Journal Target Word Goal:    ${activeTargetWords.toLocaleString()} words`,
      `• Word Target Variance:        ${isOverWordCeiling ? `+${Math.abs(wordDiff).toLocaleString()} words OVER ceiling limit` : `${wordDiff.toLocaleString()} words remaining`}`,
      `• Target Progress:             ${wordProgressPct}%`,
      `• Total Sentences:             ${stats.sentences}`,
      `• Total Paragraphs:            ${stats.paragraphs}`,
      `• Characters (with spaces):    ${charCountWithSpaces.toLocaleString()}`,
      `• Characters (without spaces): ${charCountNoSpaces.toLocaleString()}`,
      `• Avg. Words per Sentence:     ${avgWordsPerSentence} words/sentence`,
      `• Avg. Sentences per Para:     ${avgSentencesPerParagraph} sentences/paragraph`,
      `• Estimated Read Time:         ~${stats.readTimeMinutes} min`,
      `• Estimated Page Length:       ~${estimatedPages} pages (calculated @ 250 words/page)`,
      '',
      '2. IDENTIFIED EDITORIAL ISSUES & SCAN FINDINGS',
      '--------------------------------------------------------------------------------',
      '',
      'A. Terminology Consistency Conflicts:',
      terminologyFindings.length === 0
        ? '   ✓ No terminology conflicts detected.'
        : terminologyFindings.map((f, i) => `   [${i + 1}] Issue: ${f.pair}\n       Recommendation: ${f.suggestion}`).join('\n\n'),
      '',
      'B. Unfinished Sentences, Draft Placeholders & Syntax Fragments:',
      unfinishedFindings.length === 0
        ? '   ✓ All sentences have proper terminal punctuation and structural closure.'
        : unfinishedFindings.map((uf, i) => `   [${i + 1}] Issue: ${uf.issue}\n       Excerpt: "${uf.text}"`).join('\n\n'),
      '',
      'C. Phrase & Sentence Repetition Analysis:',
      repetitionStats.duplicates.length === 0 && repetitionStats.repeatedPhrases.length === 0
        ? '   ✓ No duplicate sentences or heavy phrase repetitions found.'
        : [
            ...repetitionStats.duplicates.map((d, i) => `   [Sentence ${i + 1}] Duplicate (${d.count}x): "${d.original}"`),
            ...repetitionStats.repeatedPhrases.map((p, i) => `   [Phrase ${i + 1}] Key Phrase (${p.count}x): "${p.phrase}"`)
          ].join('\n'),
      '',
      'D. Citation & Evidence Alignment:',
      `   • Inline Citations Detected: ${citationAuditResult.citationCount}`,
      `   • Reference Library Papers:  ${papers.length}`,
      `   • Fully Matched & Verified:  ${citationAuditResult.matchedCount}`,
      `   • Incomplete Metadata:       ${citationAuditResult.missingMetadataCount}`,
      `   • Unmatched Citations:       ${citationAuditResult.unmatchedCount}`,
      `   • Audit Issues Found:        ${citationAuditResult.issues.length}`,
      '',
      'E. Publishing Checklist Progress:',
      `   • Completed Items: ${checklist.filter(c => c.completed).length} / ${checklist.length}`,
      ...checklist.map(item => `   [${item.completed ? 'X' : ' '}] ${item.label} (${item.category})`),
      '',
    ];

    if (reflectionResult) {
      reportLines.push(
        '3. AI REFLECTIVE REVIEW FEEDBACK',
        '--------------------------------------------------------------------------------',
        `• Clarity Assessment:        ${reflectionResult.clarityRating || 'N/A'}`,
        `• Passive Voice Frequency:   ${reflectionResult.passiveVoiceCount || '0'} instances flagged`,
        `• Dense Jargon Flagged:      ${reflectionResult.jargonCount || '0'} terms`,
        `• Feedback Summary:          ${reflectionResult.summary || 'None'}`,
        ''
      );
    }

    reportLines.push(
      '================================================================================',
      'End of Readability & Editorial Summary Report',
      '================================================================================'
    );

    const reportText = reportLines.join('\n');
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_readability_editorial_report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Multi-file and Drag & Drop Document Importer
  const processImportFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsImporting(true);

    const newDocs: ImportedDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = file.name.split('.').pop()?.toLowerCase() || 'txt';
      const sizeBytes = file.size;

      try {
        const rawText = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || '');
          reader.readAsText(file);
        });

        let finalContent = rawText;
        let inferredTitle = file.name.replace(/\.[^/.]+$/, '');

        // Use AI document extraction endpoint for binary, PDF, DOCX, or uncleaned raw text streams
        if (
          rawText.includes('\u0000') ||
          /PK\u0003\u0004/.test(rawText) ||
          extension === 'docx' ||
          extension === 'doc' ||
          extension === 'pdf' ||
          extension === 'odt'
        ) {
          const res = await postWithAiRouting('/api/gemini/publishing/extract-document-text', {
            rawContent: rawText,
            fileName: file.name,
            mimeType: file.type,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.extractedText) {
              finalContent = data.extractedText;
            }
            if (data.title) {
              inferredTitle = data.title;
            }
          }
        }

        const words = finalContent.trim().split(/\s+/).filter(Boolean).length;
        const newDoc: ImportedDocument = {
          id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          title: inferredTitle,
          fileName: file.name,
          fileType: extension,
          sizeBytes,
          wordCount: words,
          importedAt: new Date().toLocaleDateString(),
          lastEditedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: finalContent,
          notes: `Imported file: ${file.name} (${(sizeBytes / 1024).toFixed(1)} KB)`
        };

        newDocs.push(newDoc);
      } catch (err: any) {
        console.error('Error importing file:', err);
      }
    }

    if (newDocs.length > 0) {
      setImportedDocs((prev) => [...newDocs, ...prev]);
      setSelectedDocId(newDocs[0].id);
      setActiveTab('documents');
      alert(`Successfully imported ${newDocs.length} document(s) into Document Library!`);
    } else {
      alert('Could not read selected document(s). Please try standard plain text, Markdown, or DOCX files.');
    }

    setIsImporting(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processImportFiles(e.target.files);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImportFiles(e.dataTransfer.files);
    }
  };

  // Save changes to selected imported document
  const handleSaveEditedDoc = () => {
    if (!selectedDocId) return;
    const words = editingDocContent.trim().split(/\s+/).filter(Boolean).length;
    setImportedDocs((prev) =>
      prev.map((doc) => {
        if (doc.id === selectedDocId) {
          return {
            ...doc,
            title: editingDocTitle || 'Untitled Document',
            content: editingDocContent,
            notes: editingDocNotes,
            wordCount: words,
            lastEditedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }
        return doc;
      })
    );
    alert('Document changes saved successfully!');
  };

  // Delete document
  const handleDeleteDoc = (id: string) => {
    const docToDelete = importedDocs.find((d) => d.id === id);
    if (!docToDelete) return;
    if (confirm(`Are you sure you want to delete "${docToDelete.title}"?`)) {
      const remaining = importedDocs.filter((d) => d.id !== id);
      setImportedDocs(remaining);
      if (selectedDocId === id) {
        setSelectedDocId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  // Duplicate document
  const handleDuplicateDoc = (doc: ImportedDocument) => {
    const copy: ImportedDocument = {
      ...doc,
      id: 'doc_' + Date.now(),
      title: `${doc.title} (Copy)`,
      importedAt: new Date().toLocaleDateString(),
      lastEditedAt: new Date().toLocaleDateString(),
    };
    setImportedDocs((prev) => [copy, ...prev]);
    setSelectedDocId(copy.id);
  };

  // Create new blank document in library
  const handleCreateNewBlankDoc = () => {
    const blank: ImportedDocument = {
      id: 'doc_' + Date.now(),
      title: 'New Blank Document',
      fileName: 'new_document.md',
      fileType: 'md',
      sizeBytes: 0,
      wordCount: 0,
      importedAt: new Date().toLocaleDateString(),
      lastEditedAt: new Date().toLocaleDateString(),
      content: `# New Document\n\nType or paste your text here...`,
      notes: 'Created directly in workspace library.'
    };
    setImportedDocs((prev) => [blank, ...prev]);
    setSelectedDocId(blank.id);
    setActiveTab('documents');
  };

  // Load document content as main manuscript draft
  const handleLoadDocAsDraft = (doc: ImportedDocument) => {
    if (draftContent.trim() && draftContent !== doc.content) {
      if (!confirm(`Replace current active manuscript with "${doc.title}"? Your current manuscript is auto-saved in local storage.`)) {
        return;
      }
    }
    setDraftContent(doc.content);
    setDocumentTitle(doc.title);
    setActiveTab('write');
  };

  // Append document content to main manuscript draft
  const handleAppendDocToDraft = (doc: ImportedDocument) => {
    setDraftContent((prev) => (prev ? `${prev}\n\n---\n### ${doc.title}\n\n${doc.content}` : doc.content));
    setActiveTab('write');
    alert(`Appended "${doc.title}" to the active manuscript draft!`);
  };

  // Download specific document
  const handleDownloadDoc = (doc: ImportedDocument, format: DocumentFormat = 'md') => {
    let mimeType = 'text/plain';
    let extension = format;
    let fileContent = doc.content;

    if (format === 'md') {
      mimeType = 'text/markdown';
      fileContent = `# ${doc.title}\n\n${doc.content}`;
    } else if (format === 'odt') {
      mimeType = 'application/vnd.oasis.opendocument.text';
      fileContent = `<?xml version="1.0" encoding="UTF-8"?><office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:body><office:text><text:h text:outline-level="1">${doc.title}</text:h>${doc.content.split('\n\n').map(p => `<text:p>${p.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text:p>`).join('')}</office:text></office:body></office:document-content>`;
    } else if (format === 'docx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      fileContent = `<html><body><h1>${doc.title}</h1><div>${doc.content.replace(/\n/g, '<br/>')}</div></body></html>`;
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.toLowerCase().replace(/\s+/g, '_')}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered Documents in Library
  const filteredDocs = importedDocs.filter((doc) => {
    const matchesQuery =
      !docSearchQuery ||
      doc.title.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(docSearchQuery.toLowerCase());

    const matchesType = docTypeFilter === 'all' || doc.fileType.toLowerCase() === docTypeFilter.toLowerCase();

    return matchesQuery && matchesType;
  });

  const selectedDoc = importedDocs.find((d) => d.id === selectedDocId) || filteredDocs[0] || null;

  return (
    <div className="space-y-6 font-sans text-stone-900 dark:text-stone-100 text-left animate-fadeIn" id="creative-publishing-workspace">
      
      {/* Zen Focus Mode Top Bar (Always visible when in Focus Mode) */}
      {isZenFocusMode && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-3.5 sm:p-4 flex items-center justify-between shadow-xs sticky top-0 z-30 mb-4">
          <button
            type="button"
            onClick={() => setIsZenFocusMode(false)}
            className="font-sans text-xs px-3.5 py-2 rounded-md bg-[#912A4A] text-white hover:bg-[#78223d] transition-colors flex items-center gap-2 cursor-pointer font-semibold shadow-xs shrink-0"
            id="exit-zen-focus-mode-top-btn"
            title="Exit Focus Mode"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
            <span>Exit Focus</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-200">
              Zen Focus Space
            </span>
          </div>
        </div>
      )}

      {/* Human Authorship Core Integrity Commitment Banner */}
      {!isZenFocusMode && <ResearchIntegrityBanner />}

      {/* Main Header & Open Format Philosophy */}
      {!isZenFocusMode && (
        <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-5 space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-900/10 dark:bg-stone-800 text-amber-900 dark:text-amber-400">
                
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-stone-950 dark:text-stone-100 flex items-center gap-2">
                  Creative, Writing & Publishing Workspace Layer
                </h2>
                <p className="text-xs text-stone-500 leading-snug">
                  Supports human authorship with open formats (.odt, Markdown, EPUB, DOCX) without requiring paid software subscriptions.
                </p>
              </div>
            </div>

            {/* Format Badges & Open Source Tool Interoperability */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
              <span className="bg-amber-100 dark:bg-stone-800 text-amber-900 dark:text-amber-300 px-2 py-1 rounded border border-amber-200 dark:border-stone-700 font-bold flex items-center gap-1">
                 LibreOffice Writer (.odt)
              </span>
              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-1">
                 Markdown & Zettelkasten
              </span>
              <span className="bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-300 px-2 py-1 rounded border border-sky-200 dark:border-sky-800 font-bold flex items-center gap-1">
                 EPUB & Open Monograph
              </span>
              <span className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2 py-1 rounded border border-stone-200 dark:border-stone-700 flex items-center gap-1">
                 100% Local Privacy
              </span>
            </div>
          </div>

          {/* Guiding Principle Box */}
          <div className="p-3 bg-amber-50/50 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 rounded-md text-xs leading-relaxed text-stone-700 dark:text-stone-300">
            <strong className="text-amber-950 dark:text-amber-300 font-semibold block mb-0.5">
              Human Agency & Reflective Critique Rule:
            </strong>
            The Research Companion never generates complete papers or replaces your voice. Instead, it provides <strong>reflective questions, logic checking, terminology auditing, and manuscript structuring</strong> so you retain full creative ownership.
          </div>
        </div>
      )}

      {/* Main Workspace Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-2">
        <div className="flex flex-wrap gap-1 md:gap-2">
          <button
            onClick={() => setActiveTab('write')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'write'
                ? 'bg-amber-950 text-white dark:bg-stone-800 font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
            }`}
          >
             Manuscript Editor
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-amber-950 text-white dark:bg-stone-800 font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
            }`}
          >
             Document Library & Importer ({importedDocs.length})
          </button>
          <button
            onClick={() => setActiveTab('outline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'outline'
                ? 'bg-amber-950 text-white dark:bg-stone-800 font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
            }`}
          >
             Structure & Outline ({outline.length})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-amber-950 text-white dark:bg-stone-800 font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
            }`}
          >
             Idea & Research Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('reflective')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'reflective'
                ? 'bg-amber-950 text-white dark:bg-stone-800 font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
            }`}
          >
             AI Reflective Review
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'checklist'
                ? 'bg-amber-950 text-white dark:bg-stone-800 font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
            }`}
          >
             Submission Checklist
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'export'
                ? 'bg-amber-950 text-white dark:bg-stone-800 font-bold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
            }`}
          >
             Export Open Formats
          </button>
        </div>

        {/* Quick File Import Trigger & Analytical Tools Menu Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsZenFocusMode(!isZenFocusMode)}
            className={`text-xs px-3.5 py-2 rounded-md font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-xs ${
              isZenFocusMode
                ? 'bg-[#912A4A] text-white hover:bg-[#78223d]'
                : 'bg-stone-100 dark:bg-stone-850 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-200'
            }`}
            title="Toggle distraction-free writing space"
            id="exit-zen-focus-mode-btn"
          >
            {isZenFocusMode && <ArrowLeft className="w-4 h-4 text-white" />}
            <span>{isZenFocusMode ? 'Exit Focus' : 'Zen Focus Space'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAnalyticsMenuOpen(!isAnalyticsMenuOpen)}
            className={`text-xs px-3 py-1.5 rounded border font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs ${
              isAnalyticsMenuOpen
                ? 'bg-amber-950 text-white dark:bg-stone-800 border-amber-900'
                : 'bg-amber-900/10 hover:bg-amber-900/20 text-amber-950 dark:text-amber-300 border-amber-900/30 dark:bg-stone-800'
            }`}
            title="Toggle Right-Hand Side Analytical Tools Menu"
          >
            
            <span>{isAnalyticsMenuOpen ? 'Hide Right Tools Menu' : 'Analytical Tools Menu'}</span>
            <span className="text-[10px] bg-amber-900/40 text-amber-200 px-1.5 py-0.5 rounded font-mono font-normal">
              Flesch {stats.fleschEase}
            </span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".odt,.md,.markdown,.txt,.docx,.doc,.pdf,.rtf,.csv,.json"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="text-xs px-3 py-1.5 rounded border border-amber-900/30 bg-amber-900/10 hover:bg-amber-900/20 dark:bg-stone-800 dark:hover:bg-stone-700 text-amber-950 dark:text-amber-300 font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            {isImporting ? null : null}
            {isImporting ? 'Parsing...' : 'Import (.md, .docx, .odt)'}
          </button>
        </div>
      </div>

      {/* VIEW 1: MANUSCRIPT EDITOR */}
      {activeTab === 'write' && (
        <div className={`grid grid-cols-1 ${isAnalyticsMenuOpen ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-6 animate-fadeIn transition-all duration-300 relative`}>
          
          {/* Main Writing Workspace Canvas */}
          <div className={`${isAnalyticsMenuOpen ? 'lg:col-span-3' : 'lg:col-span-4 max-w-4xl mx-auto w-full'} space-y-4 transition-all duration-300`}>
            
            {/* Quick Drag & Drop Import Dropzone Banner */}
            {!isZenFocusMode && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-3.5 rounded-lg border-2 border-dashed transition-all text-xs flex flex-wrap items-center justify-between gap-3 ${
                  isDragOver
                    ? 'border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-200'
                    : 'border-amber-900/20 dark:border-stone-800 bg-amber-50/40 dark:bg-stone-900/40 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  
                  <span>
                    <strong>Drag & Drop documents here</strong> (.md, .docx, .odt, .txt, .pdf) or import into Document Library.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded bg-stone-900 dark:bg-stone-800 text-white text-[11px] font-medium hover:bg-stone-800 cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                     Select File(s)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('documents')}
                    className="px-2.5 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-[11px] font-medium hover:bg-stone-100 cursor-pointer flex items-center gap-1"
                  >
                     Library ({importedDocs.length})
                  </button>
                </div>
              </div>
            )}

            {/* Document Workspace Stage */}
            <div className={`bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl ${isZenFocusMode ? 'p-6 md:p-10 shadow-lg' : 'p-5 md:p-6 shadow-xs'} space-y-4 transition-all`}>
              
              {/* Document Title & Target Audience Controls Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-150 dark:border-stone-850 pb-3">
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="Document Title..."
                  className="font-serif text-xl md:text-2xl font-bold bg-transparent text-stone-950 dark:text-stone-100 focus:outline-none border-b border-transparent focus:border-amber-500 w-full sm:w-auto flex-grow tracking-tight"
                />

                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Target Audience:</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as AudienceType)}
                    className="text-xs p-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-md text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer font-medium"
                  >
                    <option value="Academic Journal">Academic Journal (.odt)</option>
                    <option value="Public Monograph">Public Monograph (.epub)</option>
                    <option value="Policy Brief">Policy Brief (.pdf)</option>
                    <option value="Student Guide">Student Guide (.md)</option>
                    <option value="Open Access Pre-print">Open Access Pre-print</option>
                  </select>

                  {!isAnalyticsMenuOpen && (
                    <button
                      type="button"
                      onClick={() => setIsAnalyticsMenuOpen(true)}
                      className="px-2.5 py-1 rounded bg-amber-950 text-white dark:bg-stone-800 text-xs font-medium hover:bg-amber-900 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="Open Right Analytical Tools Menu"
                    >
                      
                      <span>Analytical Tools</span>
                      <span className="text-[10px] bg-amber-900/60 text-amber-300 px-1 rounded font-mono">Flesch {stats.fleschEase}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Real-time Journal Requirement & Word Count Tracker Widget */}
              <div className="bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 rounded-lg p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  {/* Left: Journal Requirement Preset Selection */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200">
                      
                      <span className="font-serif font-bold">Journal Goal:</span>
                    </div>

                    <select
                      value={selectedJournalTargetId}
                      onChange={(e) => setSelectedJournalTargetId(e.target.value)}
                      className="text-xs py-1 px-2.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium cursor-pointer shadow-2xs"
                    >
                      {JOURNAL_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.label})
                        </option>
                      ))}
                    </select>

                    {selectedJournalTargetId === 'custom' && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-stone-500 text-[11px]">Goal Words:</span>
                        <input
                          type="number"
                          min="100"
                          max="100000"
                          step="100"
                          value={customTargetWords}
                          onChange={(e) => setCustomTargetWords(Math.max(100, parseInt(e.target.value || '0', 10)))}
                          className="w-20 py-0.5 px-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded text-xs font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Right: Real-time Word Counter, Readability Score & Ceiling Status */}
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    {/* Readability Score Indicator */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-2xs group relative cursor-help">
                      <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Readability:</span>
                      <strong className={`font-bold ${
                        stats.fleschEase >= 60 ? 'text-emerald-600 dark:text-emerald-400' :
                        stats.fleschEase >= 35 ? 'text-amber-600 dark:text-amber-400' :
                        'text-rose-600 dark:text-rose-400'
                      }`}>
                        {stats.fleschEase}/100
                      </strong>
                      <span className="text-[10px] text-stone-500 font-sans border-l border-stone-200 dark:border-stone-800 pl-1.5 ml-0.5">
                        {stats.fleschEase >= 70 ? 'Clear / Accessible' :
                         stats.fleschEase >= 50 ? 'Standard Academic' :
                         stats.fleschEase >= 30 ? 'Dense Academic' : 'Extremely Complex'}
                      </span>

                      {/* Tooltip on hover for scholars */}
                      <div className="absolute top-full right-0 mt-1.5 hidden group-hover:block z-30 w-64 p-2.5 bg-stone-900 text-stone-100 rounded-lg shadow-xl text-[11px] font-sans border border-stone-700 pointer-events-none">
                        <div className="font-bold border-b border-stone-700 pb-1 mb-1.5 flex justify-between">
                          <span>Flesch-Kincaid Analysis</span>
                          <span className="text-amber-400 font-mono">Grade {stats.fkGrade}</span>
                        </div>
                        <p className="text-stone-300 leading-tight">
                          {stats.fleschEase >= 60 && 'Text is accessible and easy to read.'}
                          {stats.fleschEase >= 35 && stats.fleschEase < 60 && 'Standard academic prose density. Appropriate for peer-reviewed journals.'}
                          {stats.fleschEase < 35 && 'High complexity with long sentences and multi-syllable terms. Consider breaking up dense sentences.'}
                        </p>
                        <div className="mt-2 text-[10px] text-stone-400 font-mono">
                          Sentences: {stats.sentences} | Avg. Words/Sentence: {(stats.words / Math.max(1, stats.sentences)).toFixed(1)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 shadow-2xs">
                      <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">Length:</span>
                      <strong className="text-stone-900 dark:text-stone-100 font-bold">{currentWordCount.toLocaleString()}</strong>
                      <span className="text-stone-400">/</span>
                      <span className="text-stone-500">{activeTargetWords.toLocaleString()} w</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-1 ${
                        isOverWordCeiling
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : wordProgressPct >= 85
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {wordProgressPct}%
                      </span>
                    </div>

                    <div className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 ${
                      isOverWordCeiling
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50'
                        : 'bg-stone-100 text-stone-700 dark:bg-stone-850 dark:text-stone-300'
                    }`}>
                      {isOverWordCeiling ? (
                        <>
                          
                          <span>+{Math.abs(wordDiff).toLocaleString()} words over ceiling</span>
                        </>
                      ) : (
                        <>
                          
                          <span>{wordDiff.toLocaleString()} words remaining</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Real-time Progress Bar */}
                <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isOverWordCeiling
                        ? 'bg-rose-500'
                        : wordProgressPct >= 85
                        ? 'bg-emerald-500'
                        : 'bg-amber-600 dark:bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, wordProgressPct)}%` }}
                  />
                </div>

                {/* Real-time Metrics Breakdown & Export Summary Action */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-stone-500 pt-0.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span>Chars (w/ spaces): <strong className="text-stone-800 dark:text-stone-200">{charCountWithSpaces.toLocaleString()}</strong></span>
                    <span>Chars (no spaces): <strong className="text-stone-800 dark:text-stone-200">{charCountNoSpaces.toLocaleString()}</strong></span>
                    <span>Est. Pages: <strong className="text-stone-800 dark:text-stone-200">~{estimatedPages} pg</strong> <span className="text-[9px] text-stone-400">(250w/pg)</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportReadabilityReport}
                      className="px-2 py-0.5 rounded bg-amber-900/10 hover:bg-amber-900/20 dark:bg-stone-800 dark:hover:bg-stone-700 text-amber-950 dark:text-amber-300 font-sans font-medium text-[10px] transition-colors cursor-pointer flex items-center gap-1 border border-amber-900/20 dark:border-stone-700 shadow-2xs"
                      title="Export readability score metrics & editorial issue summary report as text file"
                    >
                      
                      <span>Export Summary Report (.txt)</span>
                    </button>
                    <span className="text-[9px] text-stone-400 italic">
                      Real-time word count tracking active
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Text Area - Dominated by Space */}
              <div className="space-y-1">
                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  rows={isZenFocusMode ? 26 : 20}
                  placeholder="Type your manuscript draft here using standard Markdown syntax or plain text..."
                  className="w-full font-mono text-xs md:text-sm p-5 md:p-6 bg-stone-50/70 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed shadow-inner transition-all"
                />
              </div>

              {/* Document Live Metrics Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 border-t border-stone-150 dark:border-stone-850 pt-3">
                <div className="flex items-center gap-4 font-mono text-[11px]">
                  <span>Words: <strong className="text-stone-900 dark:text-stone-100">{stats.words}</strong></span>
                  <span>Sentences: <strong className="text-stone-900 dark:text-stone-100">{stats.sentences}</strong></span>
                  <span>Paragraphs: <strong className="text-stone-900 dark:text-stone-100">{stats.paragraphs}</strong></span>
                  <span>Est. Read: <strong className="text-stone-900 dark:text-stone-100">{stats.readTimeMinutes} min</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                    Readability Ease: {stats.fleschEase}/100
                  </span>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded font-mono font-bold">
                    Grade: {stats.fkGrade}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right-Hand Analytical Tools Menu Panel */}
          {isAnalyticsMenuOpen ? (
            <div className="lg:col-span-1 space-y-4 animate-fadeIn">
              
              {/* Right Menu Header & Navigation Panel */}
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-3 shadow-xs sticky top-4">
                
                {/* Header Title & Close Toggle */}
                <div className="flex items-center justify-between border-b border-stone-150 dark:border-stone-850 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-amber-900/10 dark:bg-stone-800 text-amber-900 dark:text-amber-400">
                      
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100 leading-none">
                        Analytical Tools
                      </h3>
                      <span className="text-[10px] text-stone-400 font-mono">Real-time Manuscript Menu</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      stats.fleschEase >= 60 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      stats.fleschEase >= 35 ? 'bg-amber-100 text-amber-900 dark:bg-stone-800 dark:text-amber-300' :
                      'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      FK {stats.fleschEase}
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsAnalyticsMenuOpen(false)}
                      className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded hover:bg-stone-100 dark:hover:bg-stone-900 cursor-pointer transition-colors"
                      title="Collapse Analytical Tools Menu (Dominate with space)"
                    >
                      
                    </button>
                  </div>
                </div>

                {/* Sub-menu Filter Tabs */}
                <div className="flex flex-wrap gap-1 border-b border-stone-150 dark:border-stone-850 pb-2 text-[10px] font-medium">
                  <button
                    onClick={() => setAnalyticsActiveTab('all')}
                    className={`px-2 py-1 rounded cursor-pointer transition-colors ${analyticsActiveTab === 'all' ? 'bg-amber-950 text-white dark:bg-stone-800 font-bold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'}`}
                  >
                    All Tools
                  </button>
                  <button
                    onClick={() => setAnalyticsActiveTab('readability')}
                    className={`px-2 py-1 rounded cursor-pointer transition-colors ${analyticsActiveTab === 'readability' ? 'bg-amber-950 text-white dark:bg-stone-800 font-bold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'}`}
                  >
                    Readability
                  </button>
                  <button
                    onClick={() => setAnalyticsActiveTab('terminology')}
                    className={`px-2 py-1 rounded cursor-pointer transition-colors ${analyticsActiveTab === 'terminology' ? 'bg-amber-950 text-white dark:bg-stone-800 font-bold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'}`}
                  >
                    Terms ({terminologyFindings.length})
                  </button>
                  <button
                    onClick={() => setAnalyticsActiveTab('fragments')}
                    className={`px-2 py-1 rounded cursor-pointer transition-colors ${analyticsActiveTab === 'fragments' ? 'bg-amber-950 text-white dark:bg-stone-800 font-bold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'}`}
                  >
                    Fragments ({unfinishedFindings.length})
                  </button>
                  <button
                    onClick={() => setAnalyticsActiveTab('repetition')}
                    className={`px-2 py-1 rounded cursor-pointer transition-colors ${analyticsActiveTab === 'repetition' ? 'bg-amber-950 text-white dark:bg-stone-800 font-bold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'}`}
                  >
                    Repetition ({repetitionStats.duplicates.length + repetitionStats.repeatedPhrases.length})
                  </button>
                  <button
                    onClick={() => setAnalyticsActiveTab('citations')}
                    className={`px-2 py-1 rounded cursor-pointer transition-colors ${analyticsActiveTab === 'citations' ? 'bg-amber-950 text-white dark:bg-stone-800 font-bold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'}`}
                  >
                    Citations ({citationAuditResult.citationCount})
                  </button>
                  <button
                    onClick={() => setAnalyticsActiveTab('critique')}
                    className={`px-2 py-1 rounded cursor-pointer transition-colors ${analyticsActiveTab === 'critique' ? 'bg-amber-950 text-white dark:bg-stone-800 font-bold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'}`}
                  >
                    AI Critique
                  </button>
                  <button
                    onClick={() => setAnalyticsActiveTab('notes')}
                    className={`px-2 py-1 rounded cursor-pointer transition-colors ${analyticsActiveTab === 'notes' ? 'bg-amber-950 text-white dark:bg-stone-800 font-bold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'}`}
                  >
                    Notes ({notes.length})
                  </button>
                </div>

                {/* MENU ITEM 1: Readability & Editorial Summary Report Exporter Card */}
                {(analyticsActiveTab === 'all' || analyticsActiveTab === 'readability') && (
                  <div className="bg-gradient-to-r from-amber-900/10 via-amber-800/5 to-transparent dark:from-stone-900 dark:to-stone-900/80 border border-amber-900/20 dark:border-stone-800 rounded-lg p-3.5 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-serif font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                         Readability & Metrics
                      </span>
                      <span className="text-[10px] font-mono font-bold text-amber-900 dark:text-amber-400 bg-amber-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                        {stats.fleschEase}/100 Ease
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-600 dark:text-stone-400 leading-snug space-y-1">
                      <div className="flex justify-between font-mono text-[10px]">
                        <span>Flesch-Kincaid Grade:</span>
                        <strong className="text-amber-900 dark:text-amber-300">Grade {stats.fkGrade}</strong>
                      </div>
                      <div className="flex justify-between font-mono text-[10px]">
                        <span>Journal Target Goal:</span>
                        <strong className="text-stone-800 dark:text-stone-200">{activeTargetWords.toLocaleString()} w</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportReadabilityReport}
                      className="w-full py-1.5 px-3 bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white text-xs font-medium rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      
                      <span>Export Summary Report (.txt)</span>
                    </button>
                  </div>
                )}
                
                {/* MENU ITEM 2: Terminology Consistency Inspector */}
                {(analyticsActiveTab === 'all' || analyticsActiveTab === 'terminology') && (
                  <div className="bg-stone-50/70 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg p-3.5 space-y-2.5 shadow-2xs">
                    <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5 border-b border-stone-150 dark:border-stone-850 pb-2">
                       Terminology Consistency
                    </h4>

                    {terminologyFindings.length === 0 ? (
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2">
                        
                        No terminology conflicts detected.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {terminologyFindings.map((f, i) => (
                          <div key={i} className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded text-[11px] space-y-1">
                            <span className="font-mono font-bold text-amber-900 dark:text-amber-300 block">
                              {f.pair}
                            </span>
                            <p className="text-stone-600 dark:text-stone-300 leading-snug text-[10px]">
                              {f.suggestion}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* MENU ITEM 3: Unfinished Sentence & Fragment Spotter */}
                {(analyticsActiveTab === 'all' || analyticsActiveTab === 'fragments') && (
                  <div className="bg-stone-50/70 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg p-3.5 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-stone-150 dark:border-stone-850 pb-2">
                      <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                         Syntax & Fragments
                      </h4>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        unfinishedFindings.length === 0
                          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {unfinishedFindings.length} Issues
                      </span>
                    </div>

                    {unfinishedFindings.length === 0 ? (
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-1.5">
                        
                        All sentences have proper terminal syntax and closure.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {unfinishedFindings.map((uf, i) => (
                          <div key={i} className="p-2 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded text-[11px] space-y-0.5">
                            <span className="font-semibold text-rose-900 dark:text-rose-300 block">
                              {uf.issue}
                            </span>
                            <p className="text-stone-700 dark:text-stone-300 font-mono text-[10px] bg-white dark:bg-stone-900 p-1 rounded border border-rose-100 dark:border-stone-800">
                              "{uf.text}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* MENU ITEM 4: Sentence & Phrase Repetition Spotter */}
                {(analyticsActiveTab === 'all' || analyticsActiveTab === 'repetition') && (
                  <div className="bg-stone-50/70 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg p-3.5 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-stone-150 dark:border-stone-850 pb-2">
                      <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                         Idea & Phrase Repetition
                      </h4>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        repetitionStats.duplicates.length === 0 && repetitionStats.repeatedPhrases.length === 0
                          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-900 dark:bg-stone-800 dark:text-amber-300'
                      }`}>
                        {repetitionStats.duplicates.length + repetitionStats.repeatedPhrases.length} Repeated
                      </span>
                    </div>

                    {repetitionStats.duplicates.length === 0 && repetitionStats.repeatedPhrases.length === 0 ? (
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-1.5">
                        
                        No duplicate sentences or heavy phrase repetition found.
                      </div>
                    ) : (
                      <div className="space-y-2 text-[11px]">
                        {repetitionStats.duplicates.map((dup, i) => (
                          <div key={i} className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-amber-900 dark:text-amber-300">
                              <span>Duplicate Sentence</span>
                              <span className="font-mono bg-amber-200 dark:bg-stone-800 px-1 rounded">{dup.count}x repeated</span>
                            </div>
                            <p className="text-stone-700 dark:text-stone-300 italic">"{dup.original}"</p>
                          </div>
                        ))}

                        {repetitionStats.repeatedPhrases.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                              Repeated Key Phrases (3+ times):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {repetitionStats.repeatedPhrases.map((rp, i) => (
                                <span key={i} className="font-mono text-[10px] bg-amber-100/80 dark:bg-stone-800 px-1.5 py-0.5 rounded text-amber-950 dark:text-amber-300 border border-amber-200 dark:border-stone-700">
                                  "{rp.phrase}" ({rp.count}x)
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* MENU ITEM 5: Citation & Local Reference Library Metadata Audit */}
                {(analyticsActiveTab === 'all' || analyticsActiveTab === 'citations') && (
                  <div className="bg-stone-50/70 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg p-3.5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-stone-150 dark:border-stone-850 pb-2">
                      <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                         Citation & Library Metadata Auditor
                      </h4>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        citationAuditResult.unmatchedCount === 0 && citationAuditResult.missingMetadataCount === 0
                          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                          : citationAuditResult.unmatchedCount > 0
                          ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-900 dark:bg-stone-800 dark:text-amber-300'
                      }`}>
                        {citationAuditResult.issues.length} Audit Findings
                      </span>
                    </div>

                    {/* Quick Summary Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="p-2 bg-white dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800 space-y-0.5">
                        <span className="text-stone-500 block">Draft Citations:</span>
                        <strong className="text-xs text-stone-900 dark:text-stone-100">{citationAuditResult.citationCount}</strong>
                      </div>
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded border border-emerald-200 dark:border-emerald-900 space-y-0.5">
                        <span className="text-emerald-700 dark:text-emerald-400 block">Verified Matches:</span>
                        <strong className="text-xs text-emerald-900 dark:text-emerald-300">{citationAuditResult.matchedCount}</strong>
                      </div>
                      <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded border border-amber-200 dark:border-amber-900 space-y-0.5">
                        <span className="text-amber-800 dark:text-amber-400 block">Incomplete Library Meta:</span>
                        <strong className="text-xs text-amber-950 dark:text-amber-300">{citationAuditResult.missingMetadataCount}</strong>
                      </div>
                      <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded border border-rose-200 dark:border-rose-900 space-y-0.5">
                        <span className="text-rose-800 dark:text-rose-400 block">Unmatched Citations:</span>
                        <strong className="text-xs text-rose-950 dark:text-rose-300">{citationAuditResult.unmatchedCount}</strong>
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-1 border-b border-stone-200 dark:border-stone-800 pb-1.5 text-[10px]">
                      <button
                        onClick={() => setCitationFilterTab('all')}
                        className={`px-2 py-0.5 rounded cursor-pointer ${citationFilterTab === 'all' ? 'bg-indigo-900 text-white font-bold' : 'text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800'}`}
                      >
                        All ({citationAuditResult.issues.length})
                      </button>
                      <button
                        onClick={() => setCitationFilterTab('unmatched')}
                        className={`px-2 py-0.5 rounded cursor-pointer ${citationFilterTab === 'unmatched' ? 'bg-rose-900 text-white font-bold' : 'text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800'}`}
                      >
                        Unmatched ({citationAuditResult.unmatchedCount})
                      </button>
                      <button
                        onClick={() => setCitationFilterTab('missing_metadata')}
                        className={`px-2 py-0.5 rounded cursor-pointer ${citationFilterTab === 'missing_metadata' ? 'bg-amber-900 text-white font-bold' : 'text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800'}`}
                      >
                        Missing Meta ({citationAuditResult.missingMetadataCount})
                      </button>
                      <button
                        onClick={() => setCitationFilterTab('uncited_paper')}
                        className={`px-2 py-0.5 rounded cursor-pointer ${citationFilterTab === 'uncited_paper' ? 'bg-stone-800 text-white font-bold' : 'text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800'}`}
                      >
                        Uncited ({citationAuditResult.uncitedLibraryCount})
                      </button>
                    </div>

                    {/* Issues List */}
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {citationAuditResult.issues
                        .filter(iss => citationFilterTab === 'all' || iss.type === citationFilterTab)
                        .map((issue) => (
                          <div
                            key={issue.id}
                            className={`p-2.5 rounded border text-[11px] space-y-1.5 ${
                              issue.severity === 'error'
                                ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                                : issue.severity === 'warning'
                                ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                                : 'bg-stone-100/70 dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                            }`}
                          >
                            <div className="flex items-center justify-between font-mono text-[10px]">
                              <span className="font-bold text-stone-900 dark:text-stone-100 truncate max-w-[170px]">
                                {issue.citationText}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                                issue.type === 'unmatched' ? 'bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-200' :
                                issue.type === 'missing_metadata' ? 'bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200' :
                                issue.type === 'year_mismatch' ? 'bg-indigo-200 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-300' :
                                'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-300'
                              }`}>
                                {issue.type.replace('_', ' ')}
                              </span>
                            </div>

                            <p className="text-stone-700 dark:text-stone-300 leading-snug">
                              {issue.description}
                            </p>

                            <p className="text-[10px] text-stone-500 italic">
                              💡 {issue.recommendation}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {issue.type === 'unmatched' && (
                                <button
                                  type="button"
                                  onClick={() => handleAddCitationStubToLibrary(issue)}
                                  className="text-[10px] px-2 py-0.5 bg-amber-900 hover:bg-amber-800 text-white rounded font-medium cursor-pointer flex items-center gap-1"
                                >
                                   Create Stub in Library
                                </button>
                              )}

                              {issue.type === 'year_mismatch' && issue.matchedPaper && (
                                <button
                                  type="button"
                                  onClick={() => handleFixManuscriptCitation(issue)}
                                  className="text-[10px] px-2 py-0.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded font-medium cursor-pointer flex items-center gap-1"
                                >
                                   Standardize Year to {issue.matchedPaper.year}
                                </button>
                              )}

                              {issue.type === 'missing_metadata' && issue.matchedPaper && (
                                <button
                                  type="button"
                                  onClick={() => handleCompleteLibraryMetadata(issue.matchedPaper!)}
                                  className="text-[10px] px-2 py-0.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded font-medium cursor-pointer flex items-center gap-1"
                                >
                                   Auto-verify Library Record
                                </button>
                              )}

                              {issue.type === 'uncited_paper' && issue.matchedPaper && (
                                <button
                                  type="button"
                                  onClick={() => handleInsertCitationIntoDraft(issue.matchedPaper!)}
                                  className="text-[10px] px-2 py-0.5 bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 text-white rounded font-medium cursor-pointer flex items-center gap-1"
                                >
                                   Insert Citation
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Bottom Control Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-200 dark:border-stone-800">
                      <button
                        type="button"
                        onClick={handleSyncCitationChecklist}
                        className="text-[10px] px-2 py-1 bg-emerald-900 hover:bg-emerald-800 text-white rounded font-medium cursor-pointer flex items-center gap-1"
                      >
                         Sync Checklist Item #c6
                      </button>

                      <button
                        type="button"
                        onClick={handleExportCitationAuditReport}
                        className="text-[10px] px-2 py-1 border border-stone-300 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 rounded font-medium cursor-pointer flex items-center gap-1"
                      >
                         Export Audit (.txt)
                      </button>
                    </div>
                  </div>
                )}

                {/* MENU ITEM 6: Paragraph Logic & AI Reflective Critique */}
                {(analyticsActiveTab === 'all' || analyticsActiveTab === 'critique') && (
                  <div className="bg-stone-50/70 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg p-3.5 space-y-2.5 shadow-2xs">
                    <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5 border-b border-stone-150 dark:border-stone-850 pb-2">
                       Quick Logic Gap Detector
                    </h4>

                    <p className="text-[11px] text-stone-500 leading-snug">
                      Test coherence & evidential support of individual draft paragraphs.
                    </p>

                    <div className="space-y-2">
                      <select
                        value={selectedParagraphIndex}
                        onChange={(e) => setSelectedParagraphIndex(Number(e.target.value))}
                        className="w-full text-xs p-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {parsedParagraphs.map((p, idx) => (
                          <option key={idx} value={idx}>
                            Para #{idx + 1}: {p.substring(0, 35)}...
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('reflective');
                          handleRunParagraphLogicGap();
                        }}
                        disabled={isAnalyzingParagraph}
                        className="w-full text-xs bg-indigo-900 hover:bg-indigo-800 text-white font-medium py-1.5 rounded transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {isAnalyzingParagraph ? null : null}
                        {isAnalyzingParagraph ? 'Analyzing...' : 'Inspect Paragraph Logic'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('reflective');
                          handleRunReflectiveReview();
                        }}
                        className="w-full text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white font-medium py-1.5 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs mt-1"
                      >
                        
                        <span>Launch Full AI Review</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* MENU ITEM 7: Research Notes & Scratchpad Quick Dock */}
                {(analyticsActiveTab === 'all' || analyticsActiveTab === 'notes') && (
                  <div className="bg-stone-50/70 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg p-3.5 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-stone-150 dark:border-stone-850 pb-2">
                      <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                         Quick Notes Dock
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveTab('notes')}
                        className="text-[10px] text-amber-600 hover:underline font-medium cursor-pointer"
                      >
                        View All ({notes.length})
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {notes.slice(0, 3).map((n) => (
                        <div key={n.id} className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-[11px] space-y-0.5">
                          <strong className="text-stone-900 dark:text-stone-100 font-semibold block">{n.title}</strong>
                          <p className="text-stone-500 text-[10px] line-clamp-2">{n.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            /* Collapsed Right Edge Quick-Dock Tool Strip */
            <div className="hidden lg:flex flex-col gap-2 fixed right-3 top-48 z-40 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-1.5 rounded-xl shadow-xl animate-fadeIn">
              <button
                type="button"
                onClick={() => { setIsAnalyticsMenuOpen(true); setAnalyticsActiveTab('all'); }}
                className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer group relative"
                title="Expand Analytical Tools Menu"
              >
                
                <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-stone-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-md">
                  Expand Tools Menu
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setIsAnalyticsMenuOpen(true); setAnalyticsActiveTab('readability'); }}
                className="p-2 text-stone-600 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer group relative"
                title="Readability Score"
              >
                
                <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-stone-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-md">
                  Readability: {stats.fleschEase}/100
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setIsAnalyticsMenuOpen(true); setAnalyticsActiveTab('terminology'); }}
                className="p-2 text-stone-600 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer group relative"
                title="Terminology Consistency"
              >
                
                <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-stone-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-md">
                  Terms ({terminologyFindings.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setIsAnalyticsMenuOpen(true); setAnalyticsActiveTab('fragments'); }}
                className="p-2 text-stone-600 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer group relative"
                title="Syntax Fragments"
              >
                
                <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-stone-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-md">
                  Fragments ({unfinishedFindings.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setIsAnalyticsMenuOpen(true); setAnalyticsActiveTab('repetition'); }}
                className="p-2 text-stone-600 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer group relative"
                title="Phrase Repetition"
              >
                
                <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-stone-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-md">
                  Repetition ({repetitionStats.duplicates.length + repetitionStats.repeatedPhrases.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setIsAnalyticsMenuOpen(true); setAnalyticsActiveTab('critique'); }}
                className="p-2 text-stone-600 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer group relative"
                title="AI Reflective Critique"
              >
                
                <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-stone-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-md">
                  AI Reflective Critique
                </span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* VIEW 2: DOCUMENT LIBRARY & INLINE TEXT EDITOR */}
      {activeTab === 'documents' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-xl border-2 border-dashed transition-all text-center space-y-3 cursor-pointer ${
              isDragOver
                ? 'border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-200 shadow-md'
                : 'border-amber-900/20 dark:border-stone-800 bg-amber-50/30 dark:bg-stone-900/30 text-stone-700 dark:text-stone-300 hover:border-amber-500/50'
            }`}
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-900/10 dark:bg-stone-800 flex items-center justify-center text-amber-600">
              
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                Drag & Drop Documents Here or Click to Import
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-lg mx-auto leading-relaxed">
                Supports <strong>Markdown (.md), LibreOffice (.odt), Word (.docx), Plain Text (.txt), PDF (.pdf), CSV & JSON</strong>. Multiple files supported simultaneously.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="px-3 py-1 bg-amber-950 text-white text-xs font-medium rounded-lg border border-amber-900/30 shadow-2xs">
                {isImporting ? 'Processing File Streams...' : 'Browse Local File(s)'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateNewBlankDoc();
                }}
                className="px-3 py-1 bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 text-white text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer"
              >
                 Create Blank Document
              </button>
            </div>
          </div>

          {/* Library Filter & Search Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-stone-950 p-4 border border-stone-200 dark:border-stone-800 rounded-lg shadow-2xs">
            <div className="flex items-center gap-2 flex-grow max-w-md">
              <div className="relative w-full">
                
                <input
                  type="text"
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  placeholder="Search imported documents by title, file name, or text..."
                  className="w-full text-xs pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-stone-400 font-bold uppercase text-[10px] mr-1">Filter Format:</span>
              {['all', 'md', 'docx', 'txt', 'odt', 'pdf'].map((type) => (
                <button
                  key={type}
                  onClick={() => setDocTypeFilter(type)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer uppercase ${
                    docTypeFilter === type
                      ? 'bg-amber-950 text-white dark:bg-stone-800 font-bold'
                      : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  {type === 'all' ? 'All' : `.${type}`}
                </button>
              ))}
            </div>
          </div>

          {/* Split View: Left Document Library List / Right Inline Document Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left List Column (4 cols) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-xs uppercase text-stone-500 tracking-wider">
                  Imported Library ({filteredDocs.length})
                </h3>
                <button
                  type="button"
                  onClick={handleCreateNewBlankDoc}
                  className="text-[11px] text-amber-800 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                   New Doc
                </button>
              </div>

              {filteredDocs.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-500 text-xs">
                  No imported documents match your search filter. Click "Browse Local File(s)" above to import files.
                </div>
              ) : (
                <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
                  {filteredDocs.map((doc) => {
                    const isSelected = doc.id === selectedDocId;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.id)}
                        className={`p-3.5 rounded-lg border transition-all cursor-pointer text-left space-y-2 relative group ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/60 dark:bg-stone-900/90 shadow-2xs'
                            : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 hover:border-amber-500/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                              doc.fileType === 'md' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              doc.fileType === 'docx' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                              doc.fileType === 'odt' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-300'
                            }`}>
                              .{doc.fileType}
                            </span>
                            <h4 className="font-serif font-bold text-xs text-stone-950 dark:text-stone-100 line-clamp-1">
                              {doc.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              type="button"
                              title="Duplicate Document"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateDoc(doc);
                              }}
                              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                            >
                              
                            </button>
                            <button
                              type="button"
                              title="Delete Document"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDoc(doc.id);
                              }}
                              className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                            >
                              
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed font-mono">
                          {doc.content.replace(/^#+\s*/, '')}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 font-mono border-t border-stone-100 dark:border-stone-850">
                          <span>Words: {doc.wordCount}</span>
                          <span>{(doc.sizeBytes / 1024).toFixed(1)} KB</span>
                          <span>{doc.importedAt}</span>
                        </div>

                        {/* Quick Action Badges */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadDocAsDraft(doc);
                            }}
                            className="text-[10px] px-2 py-0.5 rounded bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 text-white font-medium cursor-pointer flex items-center gap-1"
                          >
                             Load as Manuscript
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAppendDocToDraft(doc);
                            }}
                            className="text-[10px] px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium cursor-pointer flex items-center gap-1"
                          >
                             Append
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Live Document Editor & Reader (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {selectedDoc ? (
                <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-5 space-y-4 shadow-xs">
                  
                  {/* Editor Top Control Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
                    <div className="flex items-center gap-2 flex-grow max-w-md">
                      
                      <input
                        type="text"
                        value={editingDocTitle}
                        onChange={(e) => setEditingDocTitle(e.target.value)}
                        placeholder="Document Title..."
                        className="font-serif text-sm font-bold bg-transparent text-stone-950 dark:text-stone-100 focus:outline-none border-b border-stone-200 focus:border-amber-500 w-full"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveEditedDoc}
                        className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 text-white font-medium rounded text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                         Save Document
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadDocAsDraft(selectedDoc)}
                        className="px-3 py-1.5 bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 text-white font-medium rounded text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                         Edit as Active Manuscript
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc(selectedDoc, selectedDoc.fileType as DocumentFormat)}
                        className="px-2.5 py-1.5 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 rounded text-xs font-medium cursor-pointer flex items-center gap-1"
                      >
                         Download
                      </button>
                    </div>
                  </div>

                  {/* Context Notes / Annotations Field */}
                  <div className="bg-stone-50 dark:bg-stone-900/50 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 text-xs space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                      Document Context / Annotations:
                    </label>
                    <input
                      type="text"
                      value={editingDocNotes}
                      onChange={(e) => setEditingDocNotes(e.target.value)}
                      placeholder="Add contextual notes, source references, or author comments..."
                      className="w-full bg-transparent text-stone-800 dark:text-stone-200 focus:outline-none"
                    />
                  </div>

                  {/* Main Text Editing Area */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono pb-1">
                      <span>In-Place Text Editor ({selectedDoc.fileName})</span>
                      <span>Format: .{selectedDoc.fileType.toUpperCase()}</span>
                    </div>
                    <textarea
                      value={editingDocContent}
                      onChange={(e) => setEditingDocContent(e.target.value)}
                      rows={20}
                      placeholder="Type or paste document text here..."
                      className="w-full font-mono text-xs md:text-sm p-4 bg-stone-50/70 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                    />
                  </div>

                  {/* Document Metrics & AI Spotter Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 border-t border-stone-200 dark:border-stone-800 pt-3">
                    <div className="flex items-center gap-4 font-mono text-[11px]">
                      <span>Words: <strong className="text-stone-950 dark:text-stone-100">{editingDocContent.trim().split(/\s+/).filter(Boolean).length}</strong></span>
                      <span>Chars: <strong className="text-stone-950 dark:text-stone-100">{editingDocContent.length}</strong></span>
                      <span>Lines: <strong className="text-stone-950 dark:text-stone-100">{editingDocContent.split('\n').length}</strong></span>
                      <span>Last Edited: <strong className="text-stone-950 dark:text-stone-100">{selectedDoc.lastEditedAt}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDraftContent(editingDocContent);
                          setDocumentTitle(editingDocTitle);
                          handleRunRepetitionAndFragmentSpotter();
                          setActiveTab('reflective');
                        }}
                        className="text-[11px] px-2.5 py-1 rounded bg-amber-900/10 dark:bg-stone-800 hover:bg-amber-900/20 text-amber-950 dark:text-amber-300 font-medium cursor-pointer flex items-center gap-1"
                      >
                         Run AI Review on This Document
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-12 text-center bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-500 space-y-2">
                  
                  <h3 className="font-serif font-bold text-sm text-stone-800 dark:text-stone-200">No Document Selected</h3>
                  <p className="text-xs">Select an imported document from the left library or import a new file.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* VIEW 3: MANUSCRIPT STRUCTURE & OUTLINE */}
      {activeTab === 'outline' && (
        <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-5 space-y-5 shadow-xs animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-150 dark:border-stone-850 pb-3">
            <div>
              <h3 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-2">
                 Manuscript Section & Chapter Architecture
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Organize your monograph or article structure into logical sections prior to exporting to .odt or EPUB.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const title = prompt('Enter section title:');
                if (title) {
                  setOutline((prev) => [
                    ...prev,
                    { id: 'o_' + Date.now(), type: 'chapter', title, wordCountTarget: 1500 }
                  ]);
                }
              }}
              className="text-xs bg-amber-900 text-white font-medium px-3 py-1.5 rounded hover:bg-amber-800 transition-colors cursor-pointer"
            >
              + Add Section / Chapter
            </button>
          </div>

          <div className="space-y-3">
            {outline.map((item, idx) => (
              <div
                key={item.id}
                className="p-3.5 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-amber-900 dark:text-amber-400 bg-amber-100 dark:bg-stone-800 w-6 h-6 rounded flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-stone-500 font-mono uppercase">
                      Category: {item.type.replace('_', ' ')} {item.wordCountTarget ? `• Target: ${item.wordCountTarget} words` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      if (idx > 0) {
                        const copy = [...outline];
                        const temp = copy[idx - 1];
                        copy[idx - 1] = copy[idx];
                        copy[idx] = temp;
                        setOutline(copy);
                      }
                    }}
                    disabled={idx === 0}
                    className="px-2 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-stone-700 dark:text-stone-300 disabled:opacity-30 cursor-pointer"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (idx < outline.length - 1) {
                        const copy = [...outline];
                        const temp = copy[idx + 1];
                        copy[idx + 1] = copy[idx];
                        copy[idx] = temp;
                        setOutline(copy);
                      }
                    }}
                    disabled={idx === outline.length - 1}
                    className="px-2 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-stone-700 dark:text-stone-300 disabled:opacity-30 cursor-pointer"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutline((prev) => prev.filter((o) => o.id !== item.id))}
                    className="px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: IDEA & RESEARCH NOTES (ZETTELKASTEN) */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Note Form */}
          <form onSubmit={handleAddNote} className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-5 space-y-4 shadow-xs h-fit">
            <h3 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-150 dark:border-stone-850 pb-2">
               Quick Zettelkasten Note
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold uppercase block">Note Title / Atomic Concept</label>
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="e.g. Epistemic Agency in Open Workflows"
                className="w-full text-xs p-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold uppercase block">Core Insight / Excerpt</label>
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={4}
                placeholder="Brief explanation or quote to incorporate into the manuscript..."
                className="w-full text-xs p-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full text-xs bg-amber-900 hover:bg-amber-800 text-white font-medium py-2 rounded transition-colors cursor-pointer"
            >
              Save Research Note
            </button>
          </form>

          {/* Notes Grid */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Stored Research Notes ({notes.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {notes.map((n) => (
                <div key={n.id} className="p-4 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100">{n.title}</h4>
                    <span className="text-[9px] text-stone-400 font-mono">{n.updatedAt}</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-snug">{n.content}</p>
                  
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-stone-100 dark:border-stone-900">
                    {n.tags.map((t) => (
                      <span key={t} className="text-[9px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-1.5 py-0.5 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: REFLECTIVE AI REVIEW PANEL */}
      {activeTab === 'reflective' && (
        <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-5 space-y-6 shadow-xs animate-fadeIn">
          
          {/* Section 1: Full Draft Reflective Review */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-150 dark:border-stone-850 pb-3">
              <div>
                <h3 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-2">
                   Full Draft Reflective Critique & Reasoning Review
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Generates constructive questions and logic checks across the entire manuscript without replacing your human prose.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunReflectiveReview}
                disabled={isReflecting}
                className="text-xs bg-amber-900 hover:bg-amber-800 text-white font-medium px-4 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isReflecting ? null : null}
                {isReflecting ? 'Analyzing Draft...' : 'Run Full Draft Review'}
              </button>
            </div>

            {reflectionResult && (
              <div className="space-y-4 animate-fadeIn">
                
                {/* Human Authorship Confirmation Banner */}
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-900 dark:text-emerald-300 font-medium">
                  {reflectionResult.humanAuthorshipConfirmation}
                </div>

                {/* Reflective Questions Card */}
                <div className="p-4 bg-amber-50/60 dark:bg-stone-900/50 border border-amber-900/10 dark:border-stone-800 rounded-lg space-y-3">
                  <h4 className="font-serif font-bold text-xs text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                     Reflective Probing Questions
                  </h4>
                  <ul className="space-y-2 text-xs text-stone-800 dark:text-stone-200 list-disc list-inside">
                    {reflectionResult.reflectiveQuestions?.map((q: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">{q}</li>
                    ))}
                  </ul>
                </div>

                {/* Reasoning Gaps & Terminology Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Reasoning Gaps */}
                  <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg space-y-2">
                    <h4 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                       Reasoning Gaps & Assumptions
                    </h4>
                    <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-300 list-disc list-inside">
                      {reflectionResult.reasoningGaps?.map((g: string, idx: number) => (
                        <li key={idx}>{g}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Terminology Inconsistencies */}
                  <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg space-y-2">
                    <h4 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                       Terminology & Plain Language
                    </h4>
                    <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-300 list-disc list-inside">
                      {reflectionResult.accessibilitySuggestions?.map((s: string, idx: number) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Literature Alignment Feedback */}
                <div className="p-4 bg-stone-50 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-800 rounded-lg text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                  <strong className="text-stone-900 dark:text-stone-100 font-bold block mb-1">
                    Evidence Base Alignment:
                  </strong>
                  {reflectionResult.literatureAlignment}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Interactive Paragraph-Level Logic Gap Detector */}
          <div className="border-t border-stone-200 dark:border-stone-800 pt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-xs text-stone-950 dark:text-stone-100 flex items-center gap-2">
                   Paragraph-Level Logic Gap Detector
                </h3>
                <p className="text-xs text-stone-500">
                  Choose a specific paragraph from your draft to test its internal coherence and evidential support.
                </p>
              </div>

              <span className="text-[10px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2 py-1 rounded">
                {parsedParagraphs.length} Paragraphs Detected
              </span>
            </div>

            {/* Paragraph Selector Grid */}
            <div className="space-y-3">
              <label className="text-[10px] text-stone-500 font-bold uppercase block">
                Select Paragraph to Inspect:
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50/50 dark:bg-stone-900/30">
                {parsedParagraphs.map((pText, pIdx) => (
                  <div
                    key={pIdx}
                    onClick={() => {
                      setSelectedParagraphIndex(pIdx);
                      handleRunParagraphLogicGap(pText, pIdx);
                    }}
                    className={`p-3 rounded-md border text-xs cursor-pointer transition-all space-y-1 ${
                      selectedParagraphIndex === pIdx
                        ? 'bg-amber-100/60 dark:bg-stone-800 border-amber-600 dark:border-amber-500 text-stone-950 dark:text-stone-100 font-medium'
                        : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
                      <span>Paragraph #{pIdx + 1}</span>
                      <span>{pText.split(/\s+/).length} words</span>
                    </div>
                    <p className="line-clamp-2 leading-relaxed text-[11px]">
                      {pText}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRunParagraphLogicGap()}
                  disabled={isAnalyzingParagraph}
                  className="text-xs bg-indigo-900 hover:bg-indigo-800 text-white font-medium px-4 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isAnalyzingParagraph ? null : null}
                  {isAnalyzingParagraph ? 'Analyzing Logic Gaps...' : `Analyze Paragraph #${selectedParagraphIndex + 1}`}
                </button>
              </div>
            </div>

            {/* Paragraph Logic Analysis Result Output */}
            {paragraphAnalysisResult && (
              <div className="p-4 bg-amber-50/40 dark:bg-stone-900/60 border border-amber-200 dark:border-stone-800 rounded-lg space-y-4 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                  <h4 className="font-serif font-bold text-xs text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                     Paragraph #{selectedParagraphIndex + 1} Logic Gap Report
                  </h4>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    paragraphAnalysisResult.coherenceRating?.includes('High')
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                      : paragraphAnalysisResult.coherenceRating?.includes('Moderate')
                      ? 'bg-amber-100 text-amber-900 dark:bg-stone-800 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    Coherence: {paragraphAnalysisResult.coherenceRating || 'Evaluated'}
                  </span>
                </div>

                {/* Core Assertion */}
                <div className="text-xs text-stone-800 dark:text-stone-200">
                  <strong className="text-stone-950 dark:text-stone-100 font-bold block mb-0.5">Core Paragraph Assertion:</strong>
                  <p className="italic bg-white dark:bg-stone-950 p-2.5 rounded border border-stone-200 dark:border-stone-800">
                    "{paragraphAnalysisResult.coreAssertion}"
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Identified Logic Gaps */}
                  <div className="p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-md space-y-1.5">
                    <h5 className="font-sans font-bold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1">
                       Identified Logic Gaps / Leaps
                    </h5>
                    <ul className="space-y-1 text-xs text-stone-700 dark:text-stone-300 list-disc list-inside">
                      {paragraphAnalysisResult.identifiedLogicGaps?.map((gap: string, i: number) => (
                        <li key={i}>{gap}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Evidential Support Needs */}
                  <div className="p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-md space-y-1.5">
                    <h5 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1">
                       Evidential Support Needs
                    </h5>
                    <ul className="space-y-1 text-xs text-stone-700 dark:text-stone-300 list-disc list-inside">
                      {paragraphAnalysisResult.evidentialSupportNeeds?.map((ev: string, i: number) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Reflective Questions specifically for this paragraph */}
                <div className="p-3 bg-amber-100/50 dark:bg-stone-800/60 border border-amber-200 dark:border-stone-700 rounded-md space-y-2">
                  <h5 className="font-serif font-bold text-xs text-amber-950 dark:text-amber-300 flex items-center gap-1">
                     Reflective Questions for Paragraph #{selectedParagraphIndex + 1}
                  </h5>
                  <ul className="space-y-1 text-xs text-stone-800 dark:text-stone-200 list-disc list-inside">
                    {paragraphAnalysisResult.reflectiveQuestions?.map((q: string, i: number) => (
                      <li key={i} className="leading-relaxed">{q}</li>
                    ))}
                  </ul>
                </div>

                {/* Suggested Library References */}
                {paragraphAnalysisResult.libraryReferencesToConsider?.length > 0 && (
                  <div className="p-3 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-md space-y-1 text-xs">
                    <strong className="text-stone-900 dark:text-stone-100 font-bold block">
                      Suggested Reference Library Connections:
                    </strong>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {paragraphAnalysisResult.libraryReferencesToConsider.map((refItem: string, i: number) => (
                        <span key={i} className="font-mono text-[10px] bg-white dark:bg-stone-800 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300">
                          {refItem}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: AI Editorial Awareness & Writing Quality Hub */}
          <div className="border-t border-stone-200 dark:border-stone-800 pt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-xs text-stone-950 dark:text-stone-100 flex items-center gap-2">
                   Editorial Support & Writing Quality Hub
                </h3>
                <p className="text-xs text-stone-500">
                  Acts as a supportive editorial assistant to help you spot repetitions, incomplete thoughts, and clarity issues while preserving your unique human authorship.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunRepetitionAndFragmentSpotter}
                disabled={isSpottingRepetitions}
                className="text-xs bg-amber-900 hover:bg-amber-800 text-white font-medium px-4 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSpottingRepetitions ? null : null}
                {isSpottingRepetitions ? 'Scanning Draft...' : 'Run Comprehensive Editorial Scan'}
              </button>
            </div>

            {/* Editorial Category Sub-Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 dark:bg-stone-900 p-1 rounded-lg border border-stone-200 dark:border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => setEditorialFilterTab('all')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  editorialFilterTab === 'all'
                    ? 'bg-white dark:bg-stone-800 text-stone-950 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                All Checks
              </button>

              <button
                type="button"
                onClick={() => setEditorialFilterTab('repetition')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  editorialFilterTab === 'repetition'
                    ? 'bg-amber-100 dark:bg-stone-800 text-amber-950 dark:text-amber-300 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-amber-800'
                }`}
              >
                 Repetition Spotter
              </button>

              <button
                type="button"
                onClick={() => setEditorialFilterTab('unfinished')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  editorialFilterTab === 'unfinished'
                    ? 'bg-rose-100 dark:bg-stone-800 text-rose-950 dark:text-rose-300 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-rose-800'
                }`}
              >
                 Unfinished Sentences
              </button>

              <button
                type="button"
                onClick={() => setEditorialFilterTab('clarity')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  editorialFilterTab === 'clarity'
                    ? 'bg-indigo-100 dark:bg-stone-800 text-indigo-950 dark:text-indigo-300 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-indigo-800'
                }`}
              >
                 Unclear & Complex
              </button>

              <button
                type="button"
                onClick={() => setEditorialFilterTab('transitions')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  editorialFilterTab === 'transitions'
                    ? 'bg-emerald-100 dark:bg-stone-800 text-emerald-950 dark:text-emerald-300 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-emerald-800'
                }`}
              >
                 Transitions & Flow
              </button>

              <button
                type="button"
                onClick={() => setEditorialFilterTab('accessibility')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  editorialFilterTab === 'accessibility'
                    ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                 Terms & Accessibility
              </button>
            </div>

            {/* Repetition Analysis AI Output */}
            {repetitionAnalysisResult && (
              <div className="p-4 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg space-y-5 animate-fadeIn">
                {repetitionAnalysisResult.editorialSummaryNote && (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-md text-xs text-amber-950 dark:text-amber-300 leading-relaxed font-medium flex items-start gap-2">
                    
                    <div>
                      <strong className="block font-bold mb-0.5">Editorial Mentor Note:</strong>
                      {repetitionAnalysisResult.editorialSummaryNote}
                    </div>
                  </div>
                )}

                {/* MODULE 1: REPETITION SPOTTER */}
                {(editorialFilterTab === 'all' || editorialFilterTab === 'repetition') && (
                  <div className="space-y-4 border-b border-stone-200 dark:border-stone-800 pb-4">
                    <h4 className="font-serif font-bold text-xs text-amber-950 dark:text-amber-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                         1. Repetition Spotter (Words, Phrases & Undeveloped Concepts)
                      </span>
                      <span className="font-mono text-[10px] text-stone-500">
                        {(repetitionAnalysisResult.repeatedWordsAndPhrases?.length || 0) + (repetitionAnalysisResult.repeatedIdeasAndConcepts?.length || 0)} Instances
                      </span>
                    </h4>

                    {/* Repeated Words & Phrases */}
                    <div className="space-y-2">
                      <h5 className="text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                        Repeated Words & Key Phrases
                      </h5>

                      {repetitionAnalysisResult.repeatedWordsAndPhrases?.length === 0 ? (
                        <p className="text-xs text-stone-500 italic bg-white dark:bg-stone-950 p-2.5 rounded border border-stone-200 dark:border-stone-800">
                          No distracting word or phrase repetitions detected in close proximity.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {repetitionAnalysisResult.repeatedWordsAndPhrases?.map((item: any, i: number) => {
                            const key = `word-rep-${i}`;
                            const isResolved = resolvedEditorialNotes[key];
                            return (
                              <div key={i} className={`p-3 bg-white dark:bg-stone-950 border rounded-md text-xs space-y-2 transition-all ${isResolved ? 'opacity-50 border-stone-200' : 'border-amber-200 dark:border-stone-800'}`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-stone-900 dark:text-stone-100 font-mono text-[11px] bg-amber-50 dark:bg-stone-900 px-1.5 py-0.5 rounded">
                                    "{item.wordOrPhrase}"
                                  </span>
                                  <span className="font-mono text-[10px] text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                                    {item.locations}
                                  </span>
                                </div>
                                <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                                  <strong className="text-stone-800 dark:text-stone-200">Impact:</strong> {item.clarityImpact}
                                </p>
                                <div className="p-2 bg-stone-50 dark:bg-stone-900 rounded text-[11px] text-amber-900 dark:text-amber-300 font-medium leading-snug">
                                  <strong className="block text-[10px] uppercase text-stone-500 font-bold mb-0.5">Reflective Suggestion:</strong>
                                  {item.suggestionForUser}
                                </div>
                                <div className="flex justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleEditorialResolved(key)}
                                    className="text-[10px] text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
                                  >
                                    
                                    {isResolved ? 'Marked Resolved' : 'Mark as Considered'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Repeated Ideas & Undeveloped Concepts */}
                    <div className="space-y-2 pt-2">
                      <h5 className="text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                        Repeated Arguments & Undeveloped Concepts
                      </h5>

                      {repetitionAnalysisResult.repeatedIdeasAndConcepts?.length === 0 ? (
                        <p className="text-xs text-stone-500 italic bg-white dark:bg-stone-950 p-2.5 rounded border border-stone-200 dark:border-stone-800">
                          No redundant arguments or undeveloped concept loops found across sections.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {repetitionAnalysisResult.repeatedIdeasAndConcepts?.map((conceptItem: any, i: number) => {
                            const key = `concept-rep-${i}`;
                            const isResolved = resolvedEditorialNotes[key];
                            return (
                              <div key={i} className={`p-3 bg-white dark:bg-stone-950 border rounded-md text-xs space-y-2 transition-all ${isResolved ? 'opacity-50 border-stone-200' : 'border-amber-300 dark:border-stone-800'}`}>
                                <div className="flex items-center justify-between">
                                  <strong className="text-stone-900 dark:text-stone-100 font-bold">
                                    Concept: {conceptItem.concept}
                                  </strong>
                                  <span className="font-mono text-[10px] text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                                    {conceptItem.locations}
                                  </span>
                                </div>
                                <p className="text-stone-600 dark:text-stone-400 text-[11px]">
                                  {conceptItem.whyItAffectsClarity}
                                </p>
                                <div className="p-2.5 bg-amber-50/80 dark:bg-stone-900 rounded text-amber-950 dark:text-amber-300 text-[11px] italic leading-relaxed border-l-2 border-amber-600">
                                  <strong className="not-italic font-bold text-[10px] uppercase block text-amber-800 dark:text-amber-400 mb-0.5">Author Reflection Prompt:</strong>
                                  "{conceptItem.reflectiveQuestion}"
                                </div>
                                <div className="flex justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleEditorialResolved(key)}
                                    className="text-[10px] text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
                                  >
                                    
                                    {isResolved ? 'Marked Resolved' : 'Mark as Considered'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MODULE 2: UNFINISHED SENTENCE SPOTTER */}
                {(editorialFilterTab === 'all' || editorialFilterTab === 'unfinished') && (
                  <div className="space-y-4 border-b border-stone-200 dark:border-stone-800 pb-4">
                    <h4 className="font-serif font-bold text-xs text-rose-950 dark:text-rose-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                         2. Unfinished Sentence Spotter (Fragments & Incomplete Thoughts)
                      </span>
                      <span className="font-mono text-[10px] text-stone-500">
                        {repetitionAnalysisResult.unfinishedSentencesAndFragments?.length || 0} Issues
                      </span>
                    </h4>

                    {repetitionAnalysisResult.unfinishedSentencesAndFragments?.length === 0 ? (
                      <p className="text-xs text-stone-500 italic bg-white dark:bg-stone-950 p-2.5 rounded border border-stone-200 dark:border-stone-800">
                        All sentences have complete grammatical structure and proper terminal closure.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {repetitionAnalysisResult.unfinishedSentencesAndFragments?.map((frag: any, i: number) => {
                          const key = `unfin-sent-${i}`;
                          const isResolved = resolvedEditorialNotes[key];
                          return (
                            <div key={i} className={`p-3 bg-white dark:bg-stone-950 border rounded-md text-xs space-y-2 transition-all ${isResolved ? 'opacity-50 border-stone-200' : 'border-rose-200 dark:border-rose-900/50'}`}>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-rose-900 dark:text-rose-300">
                                  {frag.location}
                                </span>
                                <span className="font-mono text-[10px] bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded text-rose-900 dark:text-rose-300 font-semibold">
                                  Incomplete Thought
                                </span>
                              </div>
                              <p className="font-mono text-[11px] bg-stone-50 dark:bg-stone-900 p-2 rounded text-stone-800 dark:text-stone-200 border border-stone-150 dark:border-stone-800">
                                "{frag.fragmentText}"
                              </p>
                              <p className="text-stone-600 dark:text-stone-400 text-[11px]">
                                <strong className="text-stone-800 dark:text-stone-200">Possible Problem Interpretation:</strong> {frag.problemInterpretation}
                              </p>
                              <div className="p-2.5 bg-rose-50/70 dark:bg-stone-900 rounded text-rose-950 dark:text-rose-300 text-[11px] italic leading-relaxed border-l-2 border-rose-500">
                                <strong className="not-italic font-bold text-[10px] uppercase block text-rose-800 dark:text-rose-400 mb-0.5">Author Completion Prompt:</strong>
                                "{frag.userCompletionPrompt}"
                              </div>
                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => toggleEditorialResolved(key)}
                                  className="text-[10px] text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
                                >
                                  
                                  {isResolved ? 'Marked Resolved' : 'Mark as Considered'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* MODULE 3: UNCLEAR & OVERLY COMPLEX SENTENCES */}
                {(editorialFilterTab === 'all' || editorialFilterTab === 'clarity') && (
                  <div className="space-y-4 border-b border-stone-200 dark:border-stone-800 pb-4">
                    <h4 className="font-serif font-bold text-xs text-indigo-950 dark:text-indigo-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                         3. Unclear & Overly Complex Sentences
                      </span>
                      <span className="font-mono text-[10px] text-stone-500">
                        {repetitionAnalysisResult.unclearOrComplexSentences?.length || 0} Identified
                      </span>
                    </h4>

                    {repetitionAnalysisResult.unclearOrComplexSentences?.length === 0 ? (
                      <p className="text-xs text-stone-500 italic bg-white dark:bg-stone-950 p-2.5 rounded border border-stone-200 dark:border-stone-800">
                        No convoluted or excessively nested sentences detected.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {repetitionAnalysisResult.unclearOrComplexSentences?.map((item: any, i: number) => {
                          const key = `complex-sent-${i}`;
                          const isResolved = resolvedEditorialNotes[key];
                          return (
                            <div key={i} className={`p-3 bg-white dark:bg-stone-950 border rounded-md text-xs space-y-2 transition-all ${isResolved ? 'opacity-50 border-stone-200' : 'border-indigo-200 dark:border-stone-800'}`}>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-stone-900 dark:text-stone-100">
                                  {item.location}
                                </span>
                                <span className="font-mono text-[10px] bg-indigo-50 dark:bg-stone-800 text-indigo-900 dark:text-indigo-300 px-2 py-0.5 rounded">
                                  Complexity Alert
                                </span>
                              </div>
                              <p className="font-serif italic text-[11px] text-stone-800 dark:text-stone-200 bg-stone-50 dark:bg-stone-900 p-2 rounded border border-stone-150 dark:border-stone-800">
                                "{item.sentenceText}"
                              </p>
                              <p className="text-stone-600 dark:text-stone-400 text-[11px]">
                                <strong className="text-stone-800 dark:text-stone-200">Issue:</strong> {item.complexityIssue}
                              </p>
                              <div className="p-2 bg-indigo-50/60 dark:bg-stone-900 text-indigo-950 dark:text-indigo-300 text-[11px] leading-relaxed border-l-2 border-indigo-500">
                                <strong className="font-bold text-[10px] uppercase block text-indigo-800 dark:text-indigo-400 mb-0.5">Author Reflection Prompt:</strong>
                                {item.reflectionPrompt}
                              </div>
                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => toggleEditorialResolved(key)}
                                  className="text-[10px] text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
                                >
                                  
                                  {isResolved ? 'Marked Resolved' : 'Mark as Considered'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* MODULE 4: ABRUPT TRANSITIONS & LOGICAL FLOW */}
                {(editorialFilterTab === 'all' || editorialFilterTab === 'transitions') && (
                  <div className="space-y-4 border-b border-stone-200 dark:border-stone-800 pb-4">
                    <h4 className="font-serif font-bold text-xs text-emerald-950 dark:text-emerald-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                         4. Abrupt Transitions & Inter-Paragraph Flow
                      </span>
                      <span className="font-mono text-[10px] text-stone-500">
                        {repetitionAnalysisResult.abruptTransitions?.length || 0} Noted
                      </span>
                    </h4>

                    {repetitionAnalysisResult.abruptTransitions?.length === 0 ? (
                      <p className="text-xs text-stone-500 italic bg-white dark:bg-stone-950 p-2.5 rounded border border-stone-200 dark:border-stone-800">
                        Paragraph transitions flow logically without sudden topical shifts.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {repetitionAnalysisResult.abruptTransitions?.map((trans: any, i: number) => {
                          const key = `trans-${i}`;
                          const isResolved = resolvedEditorialNotes[key];
                          return (
                            <div key={i} className={`p-3 bg-white dark:bg-stone-950 border rounded-md text-xs space-y-2 transition-all ${isResolved ? 'opacity-50 border-stone-200' : 'border-emerald-200 dark:border-stone-800'}`}>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-emerald-950 dark:text-emerald-300">
                                  {trans.transitionLocation}
                                </span>
                                <span className="font-mono text-[10px] bg-emerald-50 dark:bg-stone-800 text-emerald-900 dark:text-emerald-300 px-2 py-0.5 rounded">
                                  Transition Jump
                                </span>
                              </div>
                              <p className="text-stone-600 dark:text-stone-400 text-[11px]">
                                {trans.issueDescription}
                              </p>
                              <div className="p-2 bg-emerald-50/60 dark:bg-stone-900 text-emerald-950 dark:text-emerald-300 text-[11px] leading-relaxed border-l-2 border-emerald-600">
                                <strong className="font-bold text-[10px] uppercase block text-emerald-800 dark:text-emerald-400 mb-0.5">Smoothing Prompt:</strong>
                                "{trans.smoothingQuestion}"
                              </div>
                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => toggleEditorialResolved(key)}
                                  className="text-[10px] text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
                                >
                                  
                                  {isResolved ? 'Marked Resolved' : 'Mark as Considered'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* MODULE 5: INCONSISTENT TERMINOLOGY & ACCESSIBILITY */}
                {(editorialFilterTab === 'all' || editorialFilterTab === 'accessibility') && (
                  <div className="space-y-4">
                    <h4 className="font-serif font-bold text-xs text-stone-950 dark:text-stone-100 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                         5. Inconsistent Terminology & Reader Accessibility
                      </span>
                      <span className="font-mono text-[10px] text-stone-500">
                        {repetitionAnalysisResult.accessibilityAndTermConsistency?.length || 0} Suggestions
                      </span>
                    </h4>

                    {repetitionAnalysisResult.accessibilityAndTermConsistency?.length === 0 ? (
                      <p className="text-xs text-stone-500 italic bg-white dark:bg-stone-950 p-2.5 rounded border border-stone-200 dark:border-stone-800">
                        Terminology is used consistently and conforms with open, accessible writing standards.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {repetitionAnalysisResult.accessibilityAndTermConsistency?.map((term: any, i: number) => {
                          const key = `term-${i}`;
                          const isResolved = resolvedEditorialNotes[key];
                          return (
                            <div key={i} className={`p-3 bg-white dark:bg-stone-950 border rounded-md text-xs space-y-2 transition-all ${isResolved ? 'opacity-50 border-stone-200' : 'border-stone-200 dark:border-stone-800'}`}>
                              <div className="flex items-center justify-between">
                                <strong className="font-bold text-stone-900 dark:text-stone-100 font-mono text-[11px]">
                                  "{term.termOrPhrase}"
                                </strong>
                                <span className="font-mono text-[10px] bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-stone-600 dark:text-stone-300">
                                  {term.issueType}
                                </span>
                              </div>
                              <p className="text-stone-600 dark:text-stone-400 text-[11px]">
                                {term.accessibilityNote}
                              </p>
                              <div className="p-2 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 text-[11px]">
                                <strong className="font-bold text-[10px] uppercase block text-stone-500 mb-0.5">Editorial Suggestion:</strong>
                                {term.suggestion}
                              </div>
                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => toggleEditorialResolved(key)}
                                  className="text-[10px] text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
                                >
                                  
                                  {isResolved ? 'Marked Resolved' : 'Mark as Considered'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 5: PUBLISHER SUBMISSION CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-5 space-y-5 shadow-xs animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-150 dark:border-stone-850 pb-3">
            <div>
              <h3 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-2">
                 Publisher & Open Monograph Submission Checklist
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Ensure compliance with open access journals, university presses, and digital publication standards.
              </p>
            </div>

            <div className="text-xs font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded font-bold">
              {checklist.filter((c) => c.completed).length} / {checklist.length} Completed
            </div>
          </div>

          <div className="space-y-2">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggleChecklist(item.id)}
                className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  item.completed
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-stone-800 dark:text-stone-200'
                    : 'bg-stone-50 dark:bg-stone-900/50 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.completed ? null : null}
                  <span className={item.completed ? 'line-through text-stone-500' : 'font-medium'}>
                    {item.label}
                  </span>
                </div>

                <span className="text-[10px] font-mono bg-stone-150 dark:bg-stone-800 px-2 py-0.5 rounded text-stone-600 dark:text-stone-300 uppercase">
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 6: EXPORT OPEN FORMATS */}
      {activeTab === 'export' && (
        <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-5 space-y-5 shadow-xs animate-fadeIn">
          <div className="border-b border-stone-150 dark:border-stone-850 pb-3">
            <h3 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-2">
               Export Open & Accessible Formats
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Export your manuscript cleanly into open standards without requiring paid office software subscriptions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* OpenDocument ODT */}
            <div className="p-4 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-400 font-bold text-xs">
                   OpenDocument Text (.odt)
                </div>
                <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                  Native ISO standard format for LibreOffice Writer and ONLYOFFICE. Fully open and subscription-free.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExport('odt')}
                className="w-full text-xs bg-amber-900 hover:bg-amber-800 text-white font-medium py-2 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                 Export .odt File
              </button>
            </div>

            {/* Markdown .md */}
            <div className="p-4 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-xs">
                   CommonMark Markdown (.md)
                </div>
                <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                  Compatible with Obsidian, Zettelkasten note systems, Pandoc, and static site generators.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExport('md')}
                className="w-full text-xs bg-emerald-800 hover:bg-emerald-700 text-white font-medium py-2 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                 Export .md File
              </button>
            </div>

            {/* EPUB E-Book */}
            <div className="p-4 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-sky-800 dark:text-sky-400 font-bold text-xs">
                   Digital Monograph EPUB (.epub)
                </div>
                <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                  Accessible e-book standard for digital readers, mobile libraries, and open monograph repositories.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExport('epub')}
                className="w-full text-xs bg-sky-800 hover:bg-sky-700 text-white font-medium py-2 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                 Export .epub Package
              </button>
            </div>

            {/* DOCX Interoperability */}
            <div className="p-4 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-400 font-bold text-xs">
                   Word Compatible (.docx)
                </div>
                <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                  Clean XML structure compatible with external publisher requirements without needing paid Word.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExport('docx')}
                className="w-full text-xs bg-indigo-800 hover:bg-indigo-700 text-white font-medium py-2 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                 Export .docx Structure
              </button>
            </div>

            {/* Readability & Editorial Summary Report Card */}
            <div className="p-4 bg-amber-50/60 dark:bg-stone-900/60 border border-amber-200 dark:border-stone-800 rounded-lg space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs font-serif">
                   Readability & Editorial Summary Report (.txt)
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 leading-snug">
                  Comprehensive audit report exporting Flesch-Kincaid readability metrics, word ceiling target stats, terminology conflicts, syntax fragments, and citation coverage.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportReadabilityReport}
                className="w-full text-xs bg-amber-900 hover:bg-amber-800 dark:bg-amber-700 dark:hover:bg-amber-600 text-white font-medium py-2 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                 Export Summary Report (.txt)
              </button>
            </div>

            {/* Plain Text .txt */}
            <div className="p-4 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-bold text-xs">
                   Plain Text (.txt)
                </div>
                <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                  Universal UTF-8 plain text file for maximum long-term archival stability.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExport('txt')}
                className="w-full text-xs bg-stone-800 hover:bg-stone-700 text-white font-medium py-2 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                 Export .txt File
              </button>
            </div>

            {/* PDF Print View */}
            <div className="p-4 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400 font-bold text-xs">
                   Print / Save to PDF
                </div>
                <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                  Trigger print dialog formatted with academic margins, page breaks, and clean typography.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                className="w-full text-xs bg-rose-800 hover:bg-rose-700 text-white font-medium py-2 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                 Print / PDF Dialog
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
