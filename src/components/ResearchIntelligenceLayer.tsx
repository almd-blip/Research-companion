/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  ChevronsUpDown, 
  FileText, 
  Sparkles, 
  Copy, 
  Plus, 
  Quote, 
  BookOpen, 
  Upload, 
  Check, 
  SlidersHorizontal,
  Info,
  Scale,
  HelpCircle,
  BarChart3,
  TrendingUp,
  GitCompare,
  Layers,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Target,
  Compass,
  FileSpreadsheet,
  Search,
  Share2,
  Database
} from 'lucide-react';
import { Paper, EvidenceMap, ResearchQuestionAnalysis, PatternAndDataAnalysis, CriticalPartnerFeedback, LiteratureSynthesisResult } from '../types';
import { postWithAiRouting } from '../lib/localAiService';
import { 
  DEFAULT_SYNTHESIS_DATA, 
  DEFAULT_EVIDENCE_MAP, 
  DEFAULT_QUESTION_DEV, 
  DEFAULT_DATA_ANALYSIS, 
  DEFAULT_CRITICAL_FEEDBACK 
} from '../data';

const SAMPLE_DATASETS = [
  {
    name: 'Research Methodology & Effect Size Sample',
    data: `Year,PublicationCategory,SampleCount,EffectSize,Methodology,Region
2020,Qualitative Study,45,0.42,Semi-structured Interviews,Europe
2021,Quantitative Trial,320,0.68,Randomized Control,North America
2022,Mixed Methods,112,0.55,Survey & Ethnography,Asia-Pacific
2023,Meta-Analysis,1400,0.71,Systematic Review,Global
2024,Qualitative Study,60,0.38,Focus Groups,Latin America`
  },
  {
    name: 'Doctoral Wellbeing & Telemetry Metrics',
    data: `CohortYear,SupervisionModel,AutonomyScore,StressIndex,CompletionRate,AvgWeeklyDeskHours
2020,Autonomous/Supportive,8.6,3.4,91%,32
2021,Directives/Surveillance,4.2,8.1,58%,48
2022,Autonomous/Supportive,8.9,3.1,94%,30
2023,Mixed/Standard,6.5,5.9,76%,40
2024,Autonomous/Supportive,9.2,2.8,96%,29`
  },
  {
    name: 'Publication Citation Half-Life & Open Access',
    data: `Field,AccessType,Avg5YrCitations,APCFeeUSD,InterdisciplinaryRatio,DataSharingRate
Cognitive Science,Open Access,38.4,1800,0.62,84%
Cognitive Science,Closed Subscription,24.1,0,0.38,42%
Computational Linguistics,Open Access,64.2,1200,0.78,92%
Social Anthropology,Open Access,21.8,900,0.49,61%
Social Anthropology,Closed Subscription,18.5,0,0.31,28%`
  }
];

const RELATIONSHIP_TYPES = [
  { id: 'all', label: 'All' },
  { id: 'supports', label: 'Supports' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'extends', label: 'Extends' },
  { id: 'applies', label: 'Applies' },
  { id: 'contrasts', label: 'Contrasts' },
] as const;

const normalizeRelType = (t: string): 'supports' | 'challenges' | 'extends' | 'applies' | 'contrasts' | 'other' => {
  const low = (t || '').toLowerCase().trim();
  if (low.includes('support')) return 'supports';
  if (low.includes('challenge') || low.includes('critic') || low.includes('oppose') || low.includes('contradict')) return 'challenges';
  if (low.includes('extend') || low.includes('build') || low.includes('expand')) return 'extends';
  if (low.includes('appl') || low.includes('adopt') || low.includes('use') || low.includes('employ')) return 'applies';
  if (low.includes('contrast') || low.includes('differ') || low.includes('diverg') || low.includes('vs')) return 'contrasts';
  return 'other';
};

const formatRelTypeSentenceCase = (t: string): string => {
  const norm = normalizeRelType(t);
  switch (norm) {
    case 'supports': return 'Supports';
    case 'challenges': return 'Challenges';
    case 'extends': return 'Extends';
    case 'applies': return 'Applies';
    case 'contrasts': return 'Contrasts';
    default:
      if (!t) return 'Related';
      return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  }
};


interface ResearchIntelligenceLayerProps {
  papers: Paper[];
  onUpdatePaper?: (updated: Paper) => void;
  onAddPaper?: (paper: Paper) => void;
  onInsertIntoDraft?: (text: string) => void;
}

export default function ResearchIntelligenceLayer({
  papers,
  onUpdatePaper,
  onAddPaper,
  onInsertIntoDraft,
}: ResearchIntelligenceLayerProps) {
  const [activeTab, setActiveTab] = useState<'synthesis' | 'evidence_map' | 'question_dev' | 'pattern_data' | 'critical_partner'>('synthesis');

  // 1. Literature Synthesis & Upload Collection state
  const [customUploadedPapers, setCustomUploadedPapers] = useState<Paper[]>([]);
  const allCorpusPapers = [...papers, ...customUploadedPapers];
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>(allCorpusPapers.map(p => p.id));
  const [expandedCorpusIds, setExpandedCorpusIds] = useState<Record<string, boolean>>({});
  const [loadingSynthesis, setLoadingSynthesis] = useState(false);
  const [synthesisOutput, setSynthesisOutput] = useState<LiteratureSynthesisResult | null>(DEFAULT_SYNTHESIS_DATA);
  const [synthesisSubTab, setSynthesisSubTab] = useState<'overview' | 'themes_concepts' | 'theories_methods' | 'relationships' | 'schools_of_thought'>('overview');

  const toggleCorpusExpand = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setExpandedCorpusIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAllCorpusExpand = () => {
    const allExpanded = allCorpusPapers.length > 0 && allCorpusPapers.every(p => expandedCorpusIds[p.id]);
    const newState: Record<string, boolean> = {};
    allCorpusPapers.forEach(p => {
      newState[p.id] = !allExpanded;
    });
    setExpandedCorpusIds(newState);
  };

  // Collection Upload Modal/Box state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploadMode, setUploadMode] = useState<'json' | 'bibtex' | 'raw_text'>('json');
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');

  // Relationship Map state
  const [relationshipFilter, setRelationshipFilter] = useState<string>('all');
  const [selectedRelationshipNode, setSelectedRelationshipNode] = useState<string | null>(null);

  // 2. Evidence Map state
  const [evidenceQuestion, setEvidenceQuestion] = useState('How does cognitive load impact research decision-making under time pressure?');
  const [evidenceQueryFilter, setEvidenceQueryFilter] = useState('');
  const [loadingEvidenceMap, setLoadingEvidenceMap] = useState(false);
  const [evidenceMapResult, setEvidenceMapResult] = useState<EvidenceMap | null>(DEFAULT_EVIDENCE_MAP);
  const [evidenceSubTab, setEvidenceSubTab] = useState<'overview' | 'supporting_opposing' | 'consensus_disagreement' | 'gaps_questions'>('overview');

  // 3. Research Question Dev state
  const [topicInput, setTopicInput] = useState('Interdisciplinary research collaboration in academic institutions');
  const [contextInput, setContextInput] = useState('Focusing on early-career researchers and non-traditional publication incentives');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionDevResult, setQuestionDevResult] = useState<ResearchQuestionAnalysis | null>(DEFAULT_QUESTION_DEV);
  const [questionSubTab, setQuestionSubTab] = useState<'refined_questions' | 'feasibility_scope' | 'overlooked_perspectives' | 'alternative_angles'>('refined_questions');

  // 4. Pattern & Data Analysis state
  const [dataInputType, setDataInputType] = useState<'csv' | 'corpus'>('csv');
  const [csvText, setCsvText] = useState(`Year,PublicationCategory,SampleCount,EffectSize,Methodology,Region
2020,Qualitative Study,45,0.42,Semi-structured Interviews,Europe
2021,Quantitative Trial,320,0.68,Randomized Control,North America
2022,Mixed Methods,112,0.55,Survey & Ethnography,Asia-Pacific
2023,Meta-Analysis,1400,0.71,Systematic Review,Global
2024,Qualitative Study,60,0.38,Focus Groups,Latin America`);
  const [datasetName, setDatasetName] = useState('Research Methodology & Effect Size Sample');
  const [loadingDataAnalysis, setLoadingDataAnalysis] = useState(false);
  const [dataAnalysisResult, setDataAnalysisResult] = useState<PatternAndDataAnalysis | null>(DEFAULT_DATA_ANALYSIS);
  const [dataSubTab, setDataSubTab] = useState<'overview' | 'charts_distributions' | 'correlations' | 'anomalies'>('overview');

  // 5. Critical Partner Mode state
  const [hypothesisInput, setHypothesisInput] = useState('Open-access publication policies directly cause higher citation rates regardless of institutional reputation.');
  const [criticalContext, setCriticalContext] = useState('Analysing European funding council mandates from 2018-2024.');
  const [loadingCriticalPartner, setLoadingCriticalPartner] = useState(false);
  const [criticalResult, setCriticalResult] = useState<CriticalPartnerFeedback | null>(DEFAULT_CRITICAL_FEEDBACK);
  const [criticalSubTab, setCriticalSubTab] = useState<'overview' | 'second_thought' | 'assumptions_counter' | 'reframing'>('overview');

  // --- Handlers ---

  const handleTogglePaper = (id: string) => {
    setSelectedPaperIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAllPapers = () => {
    if (selectedPaperIds.length === allCorpusPapers.length) {
      setSelectedPaperIds([]);
    } else {
      setSelectedPaperIds(allCorpusPapers.map(p => p.id));
    }
  };

  const handleRunLiteratureSynthesis = async () => {
    if (selectedPaperIds.length === 0) return;
    setLoadingSynthesis(true);
    try {
      const selectedPapers = allCorpusPapers.filter(p => selectedPaperIds.includes(p.id));
      const res = await fetch('/api/gemini/connect-literature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ papers: selectedPapers }),
      });
      if (res.ok) {
        const data = await res.json();
        setSynthesisOutput(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSynthesis(false);
    }
  };

  // Parsing uploaded collections
  const handleParseAndAddCollection = (content: string, fileName?: string) => {
    try {
      let parsedPapers: Paper[] = [];

      if (uploadMode === 'json' || content.trim().startsWith('[') || content.trim().startsWith('{')) {
        let rawObj = JSON.parse(content);
        let itemsArr = Array.isArray(rawObj) ? rawObj : (rawObj.papers || rawObj.collection || [rawObj]);
        parsedPapers = itemsArr.map((item: any, idx: number) => ({
          id: `uploaded-${Date.now()}-${idx}`,
          title: item.title || item.name || `Uploaded Document ${idx + 1}`,
          authors: item.authors || item.author || 'Uploaded Author',
          journal: item.journal || item.publisher || 'Uploaded Collection',
          year: Number(item.year || item.publicationYear || new Date().getFullYear()),
          doi: item.doi || `10.1000/uploaded-${Date.now()}-${idx}`,
          notes: item.notes || item.summary || 'Uploaded document from collection.',
          abstract: item.abstract || item.notes || item.summary || item.content || 'Uploaded corpus document item',
          verificationStatus: 'verified' as const,
          missingFields: [],
          annotations: [],
          tags: item.tags || ['uploaded_collection'],
          structuredSummary: item.structuredSummary || {
            researchQuestion: item.researchQuestion || item.problem || '',
            methods: item.methods || item.methodology || '',
            participants: item.participants || '',
            findings: item.findings || item.results || '',
            limitations: item.limitations || '',
            evidenceStrength: 4,
            evidenceExplanation: 'Extracted from uploaded collection'
          }
        }));
      } else if (uploadMode === 'bibtex' || content.includes('@article') || content.includes('@book') || content.includes('@inproceedings')) {
        // Parse BibTeX entries
        const entries = content.split(/@/g).filter(Boolean);
        parsedPapers = entries.map((entry, idx) => {
          const titleMatch = entry.match(/title\s*=\s*[\"{](.*?)[\"}],?/i);
          const authorMatch = entry.match(/author\s*=\s*[\"{](.*?)[\"}],?/i);
          const yearMatch = entry.match(/year\s*=\s*[\"{]?(\d{4})[\"}],?/i);
          const journalMatch = entry.match(/journal\s*=\s*[\"{](.*?)[\"}],?/i);
          const abstractMatch = entry.match(/abstract\s*=\s*[\"{](.*?)[\"}],?/i);

          return {
            id: `bibtex-${Date.now()}-${idx}`,
            title: titleMatch ? titleMatch[1] : `BibTeX Reference ${idx + 1}`,
            authors: authorMatch ? authorMatch[1] : 'Unknown Author',
            journal: journalMatch ? journalMatch[1] : 'BibTeX Import',
            year: yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear(),
            doi: `10.1000/bibtex-${Date.now()}-${idx}`,
            notes: 'Imported from BibTeX file.',
            abstract: abstractMatch ? abstractMatch[1] : 'BibTeX entry uploaded from reference library.',
            verificationStatus: 'verified' as const,
            missingFields: [],
            annotations: [],
            tags: ['bibtex_import']
          };
        });
      } else {
        // Raw text line / paragraph chunks
        const chunks = content.split(/\n\s*\n/).filter(c => c.trim().length > 10);
        parsedPapers = chunks.map((chunk, idx) => {
          const lines = chunk.trim().split('\n');
          const firstLine = lines[0].replace(/^#+|\*+/g, '').trim();
          return {
            id: `rawtext-${Date.now()}-${idx}`,
            title: firstLine.slice(0, 100) || `Uploaded Text Segment ${idx + 1}`,
            authors: 'Uploaded Corpus Source',
            journal: 'Document Dump',
            year: new Date().getFullYear(),
            doi: `10.1000/rawtext-${Date.now()}-${idx}`,
            notes: 'Raw text document chunk.',
            abstract: chunk.trim(),
            verificationStatus: 'verified' as const,
            missingFields: [],
            annotations: [],
            tags: ['text_upload']
          };
        });
      }

      if (parsedPapers.length > 0) {
        setCustomUploadedPapers(prev => [...prev, ...parsedPapers]);
        setSelectedPaperIds(prev => [...prev, ...parsedPapers.map(p => p.id)]);
        setUploadStatusMsg(`Successfully added ${parsedPapers.length} paper(s) to local collection!`);
        setUploadText('');

        // If onAddPaper callback is available, offer to persist
        if (onAddPaper) {
          parsedPapers.forEach(p => onAddPaper(p));
        }

        setTimeout(() => {
          setShowUploadModal(false);
          setUploadStatusMsg('');
        }, 1200);
      } else {
        setUploadStatusMsg('Could not detect valid paper items. Please check format.');
      }
    } catch (err: any) {
      console.error(err);
      setUploadStatusMsg(`Parsing error: ${err.message || 'Invalid format'}`);
    }
  };

  const handleFileUploadCollection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          handleParseAndAddCollection(text, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleGenerateEvidenceMap = async (customQuery?: string) => {
    if (!evidenceQuestion.trim()) return;
    setLoadingEvidenceMap(true);
    try {
      const res = await postWithAiRouting('/api/gemini/research-intelligence/evidence-map', {
        researchQuestion: evidenceQuestion,
        papers,
        query: customQuery || evidenceQueryFilter,
      });
      if (res.ok) {
        const data = await res.json();
        setEvidenceMapResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEvidenceMap(false);
    }
  };

  const handleRunQuestionDevelopment = async () => {
    if (!topicInput.trim()) return;
    setLoadingQuestions(true);
    try {
      const res = await postWithAiRouting('/api/gemini/research-intelligence/question-development', {
        topic: topicInput,
        contextNote: contextInput,
      });
      if (res.ok) {
        const data = await res.json();
        setQuestionDevResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleRunDataAnalysis = async () => {
    setLoadingDataAnalysis(true);
    try {
      const corpusText = papers.map(p => `${p.title}: ${p.abstract || p.notes || ''}`).join('\n');
      const res = await postWithAiRouting('/api/gemini/research-intelligence/data-pattern-analysis', {
        rawData: dataInputType === 'csv' ? csvText : undefined,
        datasetName,
        literatureSummary: dataInputType === 'corpus' ? corpusText : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        setDataAnalysisResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDataAnalysis(false);
    }
  };

  const handleRunCriticalPartner = async () => {
    if (!hypothesisInput.trim()) return;
    setLoadingCriticalPartner(true);
    try {
      const res = await postWithAiRouting('/api/gemini/research-intelligence/critical-partner', {
        statementOrClaim: hypothesisInput,
        researchContext: criticalContext,
      });
      if (res.ok) {
        const data = await res.json();
        setCriticalResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCriticalPartner(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setCsvText(text);
          setDatasetName(file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6" id="research-intelligence-layer">
      {/* Main Mode Navigation Tabs */}
      <div className="border-b border-stone-200/80 dark:border-stone-800 flex flex-wrap gap-1 pb-px" role="tablist">
        {[
          { id: 'synthesis', label: 'Find Main Themes', title: 'Summarize major themes and topics across all your saved articles' },
          { id: 'evidence_map', label: 'Map Your Evidence', title: 'Compare supporting facts and opposing viewpoints for any question' },
          { id: 'question_dev', label: 'Build Good Questions', title: 'Turn broad topics into clear, specific research questions' },
          { id: 'pattern_data', label: 'Spot Data Patterns', title: 'Analyze numbers and data tables to find trends' },
          { id: 'critical_partner', label: 'Test Your Ideas', title: 'Check your assumptions and claims against potential weak points' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            title={tab.title}
            className={`px-4 py-2.5 text-xs font-sans transition-all cursor-pointer border-b-2 ${
              activeTab === tab.id
                ? 'border-[#912A4A] text-[#912A4A] dark:text-rose-300 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 font-medium'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ----------------- TAB 1: LITERATURE ANALYSIS & SYNTHESIS ----------------- */}
      {activeTab === 'synthesis' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Upload Collection Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-6 max-w-xl w-full shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-900 pb-3">
                  <div className="flex items-center gap-2">
                    
                    <h3 className="font-sans font-bold text-sm text-stone-900 dark:text-stone-100">
                      Upload Paper Collection
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-stone-400 hover:text-stone-600 text-xs px-2 py-1 rounded"
                  >
                    ✕ Close
                  </button>
                </div>

                <p className="font-sans text-xs text-stone-500 leading-relaxed">
                  Upload or paste a collection of academic papers, book chapters, or references in JSON, BibTeX, CSV, or raw text abstracts format.
                </p>

                {/* Format selection */}
                <div className="flex gap-2 text-xs font-sans">
                  <button
                    onClick={() => setUploadMode('json')}
                    className={`px-3 py-1.5 rounded transition-colors ${
                      uploadMode === 'json'
                        ? 'bg-amber-900 text-white font-semibold'
                        : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    JSON / Array
                  </button>
                  <button
                    onClick={() => setUploadMode('bibtex')}
                    className={`px-3 py-1.5 rounded transition-colors ${
                      uploadMode === 'bibtex'
                        ? 'bg-amber-900 text-white font-semibold'
                        : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    BibTeX (.bib)
                  </button>
                  <button
                    onClick={() => setUploadMode('raw_text')}
                    className={`px-3 py-1.5 rounded transition-colors ${
                      uploadMode === 'raw_text'
                        ? 'bg-amber-900 text-white font-semibold'
                        : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Raw Abstracts / Text
                  </button>
                </div>

                {/* Drag and Drop File Input */}
                <div className="border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-lg p-4 text-center hover:bg-stone-50/50 dark:hover:bg-stone-900/30 transition-colors">
                  <input
                    type="file"
                    accept=".json,.bib,.csv,.txt"
                    onChange={handleFileUploadCollection}
                    className="hidden"
                    id="paper-collection-file"
                  />
                  <label htmlFor="paper-collection-file" className="cursor-pointer block space-y-1">
                    
                    <span className="font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                      Click to choose collection file
                    </span>
                    <span className="font-sans text-[11px] text-stone-400 block">
                      Supports .json, .bib, .csv, or .txt files
                    </span>
                  </label>
                </div>

                {/* Paste Area */}
                <div className="space-y-1">
                  <label className="font-sans text-xs font-medium text-stone-700 dark:text-stone-300">
                    Or paste collection content directly:
                  </label>
                  <textarea
                    value={uploadText}
                    onChange={(e) => setUploadText(e.target.value)}
                    rows={5}
                    placeholder={
                      uploadMode === 'json'
                        ? '[{"title": "Paper Title", "authors": "Smith et al.", "year": 2023, "abstract": "Study on..."}]'
                        : uploadMode === 'bibtex'
                        ? '@article{smith2023, title={Paper Title}, author={Smith, J.}, year={2023}, abstract={...}}'
                        : 'Paste paper titles, abstracts, or notes separated by double linebreaks...'
                    }
                    className="w-full font-mono text-[11px] p-3 border border-stone-200 dark:border-stone-800 rounded bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {uploadStatusMsg && (
                  <p className="font-sans text-xs font-medium text-amber-900 dark:text-amber-400">
                    {uploadStatusMsg}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-900">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="font-sans text-xs px-4 py-2 rounded bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleParseAndAddCollection(uploadText)}
                    disabled={!uploadText.trim()}
                    className="font-sans text-xs px-4 py-2 rounded bg-amber-900 text-white hover:bg-amber-800 disabled:opacity-50"
                  >
                    Parse & Add to Collection
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Top Section: Selected Articles & Collection Setup */}
            <div className="bg-stone-50/70 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 rounded-2xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/70 dark:border-stone-800/80 pb-4">
                <div>
                  <h3 className="font-sans font-semibold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#912A4A] dark:text-rose-400" />
                    <span>Selected Articles ({selectedPaperIds.length}/{allCorpusPapers.length})</span>
                  </h3>
                  <p className="font-sans text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                    Choose articles to discover common topics, main ideas, key terms, and how they connect.
                  </p>
                </div>

                {/* Primary Action Button */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRunLiteratureSynthesis}
                    disabled={loadingSynthesis || selectedPaperIds.length === 0}
                    className="font-sans text-xs font-semibold bg-[#912A4A] text-white px-5 py-2.5 rounded-xl hover:bg-[#78223d] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                    <span>{loadingSynthesis ? 'Finding Themes...' : 'Find Big Themes'}</span>
                  </button>
                </div>
              </div>

              {/* Action Toolbar & Expand/Collapse Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="font-sans text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-medium"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
                    <span>Upload Collection</span>
                  </button>

                  <button
                    onClick={handleSelectAllPapers}
                    className="font-sans text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:underline px-2.5 py-1.5 cursor-pointer font-medium"
                  >
                    {selectedPaperIds.length === allCorpusPapers.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="flex items-center gap-3 text-stone-500">
                  <span className="text-xs">{selectedPaperIds.length} of {allCorpusPapers.length} selected</span>
                  {allCorpusPapers.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllCorpusExpand}
                      className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <ChevronsUpDown className="w-3.5 h-3.5" />
                      <span>
                        {allCorpusPapers.every(p => expandedCorpusIds[p.id]) ? 'Collapse all summaries' : 'Expand all summaries'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Papers Checklist in a Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {allCorpusPapers.map((p) => {
                  const isCustom = customUploadedPapers.some(cp => cp.id === p.id);
                  const isExpanded = !!expandedCorpusIds[p.id];
                  const isSelected = selectedPaperIds.includes(p.id);

                  return (
                    <div
                      key={p.id}
                      className={`p-3 bg-white dark:bg-stone-950 border rounded-xl text-xs font-sans transition-all flex flex-col justify-between ${
                        isExpanded ? 'ring-1 ring-[#912A4A]/30 shadow-xs md:col-span-2 lg:col-span-3' : ''
                      } ${
                        isCustom ? 'border-rose-900/30 dark:border-rose-500/30' : 'border-stone-200/80 dark:border-stone-800'
                      }`}
                    >
                      {/* Top Row: Checkbox, Title, Badges & Chevron Toggle */}
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTogglePaper(p.id)}
                          className="mt-1 rounded text-[#912A4A] focus:ring-[#912A4A] cursor-pointer"
                          id={`select-corpus-paper-${p.id}`}
                        />
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-1.5">
                            <label
                              htmlFor={`select-corpus-paper-${p.id}`}
                              className="font-medium text-stone-900 dark:text-stone-100 leading-snug cursor-pointer block hover:text-[#912A4A] dark:hover:text-rose-400 transition-colors"
                            >
                              {p.title}
                            </label>
                            
                            <button
                              type="button"
                              onClick={(e) => toggleCorpusExpand(p.id, e)}
                              className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-850 shrink-0 cursor-pointer transition-colors"
                              title={isExpanded ? 'Hide paper summary' : 'Read paper summary'}
                              aria-label={isExpanded ? 'Hide paper summary' : 'Read paper summary'}
                            >
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-normal">
                              {p.authors || 'Unknown'} ({p.year || 'n.d.'})
                              {p.journal && ` · ${p.journal}`}
                            </p>
                            {isCustom && (
                              <span className="text-[10px] bg-rose-50 dark:bg-rose-950 text-[#912A4A] dark:text-rose-300 font-semibold px-1.5 py-0.2 rounded">
                                Uploaded
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progressive Disclosure Section: Full Summary & Analytical Takeaways */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-stone-150 dark:border-stone-800 space-y-2.5 animate-fadeIn text-xs">
                          {p.abstract ? (
                            <div className="bg-stone-50/80 dark:bg-stone-900/70 p-3 rounded-lg border border-stone-200/60 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                              <span className="font-semibold text-stone-900 dark:text-stone-100 block mb-1">Summary / Abstract:</span>
                              "{p.abstract}"
                            </div>
                          ) : (
                            <p className="text-xs text-stone-400 italic">No summary text available for this item.</p>
                          )}

                          {p.structuredSummary && (
                            <div className="space-y-1.5 pt-1 text-xs">
                              {p.structuredSummary.researchQuestion && (
                                <div className="p-2.5 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200/50 dark:border-stone-800">
                                  <strong className="text-stone-800 dark:text-stone-200 block text-[11px] uppercase font-mono">Aim:</strong>
                                  <span className="text-stone-700 dark:text-stone-300">{p.structuredSummary.researchQuestion}</span>
                                </div>
                              )}
                              {p.structuredSummary.findings && (
                                <div className="p-2.5 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-lg border border-emerald-200/40 dark:border-emerald-900/30">
                                  <strong className="text-emerald-800 dark:text-emerald-300 block text-[11px] uppercase font-mono">Core Findings:</strong>
                                  <span className="text-stone-700 dark:text-stone-300">{p.structuredSummary.findings}</span>
                                </div>
                              )}
                              {p.structuredSummary.limitations && (
                                <div className="p-2.5 bg-amber-50/40 dark:bg-amber-950/20 rounded-lg border border-amber-200/40 dark:border-amber-900/30">
                                  <strong className="text-amber-800 dark:text-amber-300 block text-[11px] uppercase font-mono">Limitations:</strong>
                                  <span className="text-stone-700 dark:text-stone-300">{p.structuredSummary.limitations}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Quick Actions in expanded card */}
                          <div className="flex items-center justify-between gap-2 pt-2 text-xs">
                            {onInsertIntoDraft && (
                              <button
                                type="button"
                                onClick={() => {
                                  const authorFirst = (p.authors || 'Author').split(',')[0].trim();
                                  onInsertIntoDraft(`(${authorFirst} et al., ${p.year})`);
                                }}
                                className="text-[#912A4A] dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Insert in Draft</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const citation = `${p.authors || 'Author'} (${p.year || 'n.d.'}). "${p.title}". ${p.journal || ''}`;
                                navigator.clipboard.writeText(citation);
                              }}
                              className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 ml-auto cursor-pointer"
                              title="Copy citation"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Citation</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Section: Themes Generated & Synthesis Output */}
            <div className="space-y-6">
              {loadingSynthesis ? (
                <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-6 h-6 border-2 border-[#912A4A] border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-sans text-xs text-stone-500 italic">
                    Looking for main themes, key ideas, and connections across your articles...
                  </p>
                </div>
              ) : synthesisOutput ? (
                <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-6 shadow-xs">
                  {/* Synthesis Sub-tabs navigation */}
                  <div className="border-b border-stone-200/80 dark:border-stone-800 flex flex-wrap gap-1 pb-2">
                    {[
                      { id: 'overview', label: 'Overview' },
                      { id: 'themes_concepts', label: `Themes & Concepts (${synthesisOutput.majorThemes?.length || 0})` },
                      { id: 'theories_methods', label: 'Theories & Methods' },
                      { id: 'relationships', label: `Mapped Relationships (${synthesisOutput.mappedRelationships?.length || 0})` },
                      { id: 'schools_of_thought', label: 'Schools of Thought' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setSynthesisSubTab(st.id as any)}
                        className={`px-3 py-1.5 rounded-md text-xs font-sans font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                          synthesisSubTab === st.id
                            ? 'bg-[#912A4A] text-white dark:bg-[#912A4A]'
                            : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* 1. OVERVIEW SUB-TAB */}
                  {synthesisSubTab === 'overview' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-stone-50 dark:bg-stone-900/50 p-4 rounded-lg border border-stone-200/60 dark:border-stone-800 space-y-2">
                          <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                             Established Findings & Consensus
                          </h4>
                          <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                            {synthesisOutput.agreements || 'Identified consensus across methodology and underlying theoretical framework.'}
                          </p>
                          {synthesisOutput.establishedFindings && synthesisOutput.establishedFindings.length > 0 && (
                            <ul className="space-y-1 pt-2 border-t border-stone-200/40 dark:border-stone-800">
                              {synthesisOutput.establishedFindings.map((finding, idx) => (
                                <li key={idx} className="font-sans text-[11px] text-stone-700 dark:text-stone-300 flex items-start gap-1.5">
                                  <span className="text-emerald-700 font-bold">•</span> {finding}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="bg-amber-50/30 dark:bg-stone-900/50 p-4 rounded-lg border border-amber-900/10 dark:border-stone-800 space-y-2">
                          <h4 className="font-sans font-semibold text-xs text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
                             Emerging Debates & Divergences
                          </h4>
                          <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                            {synthesisOutput.disagreements || 'Divergences exist regarding measurement metrics, context, and sample populations.'}
                          </p>
                          {synthesisOutput.emergingDebates && synthesisOutput.emergingDebates.length > 0 && (
                            <ul className="space-y-1 pt-2 border-t border-amber-900/10 dark:border-stone-800">
                              {synthesisOutput.emergingDebates.map((debate, idx) => (
                                <li key={idx} className="font-sans text-[11px] text-stone-700 dark:text-stone-300 flex items-start gap-1.5">
                                  <span className="text-amber-700 font-bold">•</span> {debate}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {synthesisOutput.unresolvedQuestions && synthesisOutput.unresolvedQuestions.length > 0 && (
                        <div className="p-4 bg-sky-50/30 dark:bg-stone-900/50 rounded-lg border border-sky-900/10 dark:border-stone-800 space-y-2">
                          <h4 className="font-sans font-semibold text-xs text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                             Key Unresolved Questions
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {synthesisOutput.unresolvedQuestions.map((q, idx) => (
                              <div key={idx} className="p-2.5 bg-white dark:bg-stone-950 border border-stone-200/60 dark:border-stone-800 rounded font-sans text-xs text-stone-700 dark:text-stone-300">
                                {q}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. MAJOR THEMES & CORE CONCEPTS SUB-TAB */}
                  {synthesisSubTab === 'themes_concepts' && (
                    <div className="space-y-6">
                      {/* Themes Section */}
                      <div className="space-y-3">
                        <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 uppercase tracking-wide flex items-center gap-1.5">
                           Identified Major Themes
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {synthesisOutput.majorThemes?.map((theme, idx) => (
                            <div key={idx} className="p-4 bg-stone-50 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800 rounded-lg space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded font-bold">
                                  Theme {idx + 1}
                                </span>
                                {theme.linkedPapers && (
                                  <span className="text-[10px] text-stone-400 font-sans">
                                    {theme.linkedPapers.length} paper(s) linked
                                  </span>
                                )}
                              </div>
                              <h5 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100">{theme.name}</h5>
                              <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{theme.description}</p>

                              {theme.keyConcepts && theme.keyConcepts.length > 0 && (
                                <div className="pt-2 flex flex-wrap gap-1">
                                  {theme.keyConcepts.map((concept, cIdx) => (
                                    <span key={cIdx} className="text-[10px] font-sans bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded">
                                      #{concept}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Concepts Dictionary Section */}
                      <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-900">
                        <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 uppercase tracking-wide flex items-center gap-1.5">
                           Core Concepts & Definitions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {synthesisOutput.coreConcepts?.map((c, idx) => (
                            <div key={idx} className="p-3.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg space-y-1.5">
                              <h5 className="font-sans font-bold text-xs text-amber-950 dark:text-amber-300 flex items-center justify-between">
                                <span>{c.concept}</span>
                              </h5>
                              <p className="font-sans text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                                {c.definition}
                              </p>
                              <p className="font-sans text-[11px] text-stone-500 leading-snug">
                                <strong className="text-stone-600 dark:text-stone-400">Usage:</strong> {c.usageInLiterature}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. THEORIES & METHODOLOGIES SUB-TAB */}
                  {synthesisSubTab === 'theories_methods' && (
                    <div className="space-y-6">
                      {/* Underlying Theories */}
                      <div className="space-y-3">
                        <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 uppercase tracking-wide flex items-center gap-1.5">
                           Underlying Theoretical Frameworks
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {synthesisOutput.underlyingTheories?.map((t, idx) => (
                            <div key={idx} className="p-4 bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 rounded-lg space-y-2">
                              <h5 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100">{t.theoryName}</h5>
                              <p className="font-sans text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                                <strong>Core Premise:</strong> {t.corePremise}
                              </p>
                              <p className="font-sans text-[11px] text-stone-500">
                                <strong>Proponents:</strong> {t.keyProponents}
                              </p>
                              <p className="font-sans text-[11px] text-stone-500">
                                <strong>Context:</strong> {t.applicationContext}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Methodologies */}
                      <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-900">
                        <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 uppercase tracking-wide flex items-center gap-1.5">
                           Methodologies Employed
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {synthesisOutput.methodologiesUsed?.map((m, idx) => (
                            <div key={idx} className="p-4 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <h5 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100">{m.methodologyName}</h5>
                                <span className="text-[10px] font-mono uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 font-bold px-2 py-0.5 rounded">
                                  {m.type}
                                </span>
                              </div>
                              <p className="font-sans text-xs text-stone-600 dark:text-stone-400">{m.description}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                                <div className="p-2 bg-emerald-50/50 dark:bg-stone-900 rounded text-emerald-900 dark:text-emerald-300">
                                  <strong>Strengths:</strong> {m.strengths}
                                </div>
                                <div className="p-2 bg-amber-50/50 dark:bg-stone-900 rounded text-amber-900 dark:text-amber-300">
                                  <strong>Limitations:</strong> {m.limitations}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. MAPPED RELATIONSHIPS SUB-TAB */}
                  {synthesisSubTab === 'relationships' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 dark:bg-stone-900 p-3.5 rounded-lg border border-stone-200/60 dark:border-stone-800">
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-semibold text-xs text-stone-800 dark:text-stone-200">
                            Local Relationship Mapping Engine
                          </span>
                        </div>

                        {/* Filter buttons - Sentence Case */}
                        <div className="flex flex-wrap gap-1.5 text-[11px] font-sans">
                          {RELATIONSHIP_TYPES.map((type) => {
                            const count = type.id === 'all'
                              ? (synthesisOutput.mappedRelationships?.length || 0)
                              : (synthesisOutput.mappedRelationships?.filter(
                                  (rel) => normalizeRelType(rel.relationshipType) === type.id
                                ).length || 0);

                            const isActive = relationshipFilter === type.id;

                            return (
                              <button
                                key={type.id}
                                onClick={() => setRelationshipFilter(type.id)}
                                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                                  isActive
                                    ? 'bg-[#912A4A] text-white font-medium shadow-xs'
                                    : 'bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
                                }`}
                              >
                                <span>{type.label}</span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                                }`}>
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Interactive Visual Graph Nodes Grid */}
                      <div className="space-y-3">
                        {(() => {
                          const filtered = synthesisOutput.mappedRelationships?.filter((rel) => {
                            if (relationshipFilter === 'all') return true;
                            return normalizeRelType(rel.relationshipType) === relationshipFilter;
                          }) || [];

                          if (filtered.length === 0) {
                            const activeLabel = RELATIONSHIP_TYPES.find(r => r.id === relationshipFilter)?.label || 'Selected';
                            return (
                              <div className="p-8 text-center bg-stone-50/50 dark:bg-stone-900/40 border border-dashed border-stone-200 dark:border-stone-800 rounded-lg space-y-2">
                                <p className="text-xs font-medium text-stone-600 dark:text-stone-300">
                                  No relationships categorized under "{activeLabel}" found in this synthesis.
                                </p>
                                <button
                                  onClick={() => setRelationshipFilter('all')}
                                  className="text-xs text-[#912A4A] dark:text-rose-400 hover:underline font-medium cursor-pointer"
                                >
                                  View All ({synthesisOutput.mappedRelationships?.length || 0} mapped connections)
                                </button>
                              </div>
                            );
                          }

                          return filtered.map((rel, idx) => {
                            const normType = normalizeRelType(rel.relationshipType);
                            const typeColors: Record<string, string> = {
                              supports: 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300',
                              challenges: 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300',
                              extends: 'bg-sky-50 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300',
                              applies: 'bg-purple-50 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300',
                              contrasts: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
                              other: 'bg-stone-100 text-stone-800 border-stone-300 dark:bg-stone-800 dark:text-stone-300'
                            };

                            const badgeStyle = typeColors[normType] || typeColors.other;
                            const sentenceLabel = formatRelTypeSentenceCase(rel.relationshipType);

                            return (
                              <div
                                key={idx}
                                className="p-4 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg space-y-2 hover:shadow-xs transition-shadow"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-900 px-2.5 py-1 rounded border border-stone-200/60 dark:border-stone-800">
                                    {rel.source}
                                  </span>
                                  
                                  <span className={`text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                                    {sentenceLabel}
                                  </span>
                                  
                                  <span className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-900 px-2.5 py-1 rounded border border-stone-200/60 dark:border-stone-800">
                                    {rel.target}
                                  </span>
                                </div>
                                <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed pt-1">
                                  {rel.explanation}
                                </p>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  {/* 5. SCHOOLS OF THOUGHT SUB-TAB */}
                  {synthesisSubTab === 'schools_of_thought' && (
                    <div className="space-y-4">
                      <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 uppercase tracking-wide flex items-center gap-1.5">
                         Main Schools of Thought & Perspectives
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {synthesisOutput.schoolsOfThought?.map((school, idx) => (
                          <div key={idx} className="p-4 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg space-y-2">
                            <span className="text-[9px] font-mono bg-amber-900 text-white px-2 py-0.5 rounded font-bold uppercase">
                              Perspective {idx + 1}
                            </span>
                            <h5 className="font-sans font-bold text-xs text-stone-900 dark:text-stone-100">{school.schoolName}</h5>
                            <p className="font-sans text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                              <strong>Core Idea:</strong> {school.coreTenet}
                            </p>
                            <p className="font-sans text-[11px] text-stone-500">
                              <strong>Key Authors:</strong> {school.keyAuthors}
                            </p>
                            <p className="font-sans text-[11px] text-stone-500">
                              <strong>Key Assumptions:</strong> {school.distinguishingAssumptions}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-12 text-stone-400 font-sans text-xs text-center space-y-3">
                  
                  <p className="font-medium text-stone-600 dark:text-stone-300">
                    No themes generated yet
                  </p>
                  <p className="max-w-md mx-auto text-stone-400">
                    Select articles from the left panel or click "Upload Collection" to import articles, then click "Find Big Themes" to identify main themes and connections.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: EVIDENCE MAPPING ----------------- */}
      {activeTab === 'evidence_map' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Question & Query Bar */}
          <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-5 rounded-lg space-y-4">
            <div className="space-y-1.5">
              <label className="font-sans font-medium text-xs text-stone-700 dark:text-stone-300">
                Main Question to Map Evidence
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={evidenceQuestion}
                  onChange={(e) => setEvidenceQuestion(e.target.value)}
                  placeholder="e.g., Does physical exercise help students improve test scores?"
                  className="flex-1 font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50/50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#912A4A]"
                />
                <button
                  onClick={() => handleGenerateEvidenceMap()}
                  disabled={loadingEvidenceMap}
                  className="font-sans text-xs bg-[#1B0A3B] text-white px-4 py-2.5 rounded-lg hover:bg-[#2A1254] transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                >
                   Create Evidence Map
                </button>
              </div>
            </div>

            {/* Quick Answer Questions */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-900 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-sans text-stone-400 font-medium">Quick Query Prompts:</span>
              <button
                onClick={() => {
                  setEvidenceQueryFilter('What evidence supports this argument?');
                  handleGenerateEvidenceMap('What evidence supports this argument?');
                }}
                className="text-[11px] font-sans bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 px-2.5 py-1 rounded transition-colors"
              >
                "What evidence supports this argument?"
              </button>
              <button
                onClick={() => {
                  setEvidenceQueryFilter('What evidence challenges this interpretation?');
                  handleGenerateEvidenceMap('What evidence challenges this interpretation?');
                }}
                className="text-[11px] font-sans bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 px-2.5 py-1 rounded transition-colors"
              >
                "What evidence challenges this interpretation?"
              </button>
              <button
                onClick={() => {
                  setEvidenceQueryFilter('Which perspectives are missing?');
                  handleGenerateEvidenceMap('Which perspectives are missing?');
                }}
                className="text-[11px] font-sans bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 px-2.5 py-1 rounded transition-colors"
              >
                "Which perspectives are missing?"
              </button>
            </div>
          </div>

          {/* Evidence Map Visualization Grid */}
          {loadingEvidenceMap ? (
            <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-6 h-6 border-2 border-amber-900 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-sans text-xs text-stone-500 italic">Synthesizing local library evidence for supporting vs opposing arguments...</p>
            </div>
          ) : evidenceMapResult ? (
            <div className="space-y-6">
              {/* Supporting vs Opposing Column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supporting Literature */}
                <div className="bg-emerald-50/30 dark:bg-stone-950 border border-emerald-900/15 dark:border-emerald-900/30 rounded-lg p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-emerald-900/10 pb-3">
                    
                    <h3 className="font-sans font-semibold text-xs text-emerald-950 dark:text-emerald-300">
                      Supporting Literature ({evidenceMapResult.supportingLiterature?.length || 0})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {evidenceMapResult.supportingLiterature?.map((item, idx) => (
                      <div key={idx} className="bg-white dark:bg-stone-900 p-3.5 rounded border border-emerald-200/50 dark:border-emerald-900/30 space-y-1.5">
                        <p className="font-sans font-medium text-xs text-stone-900 dark:text-stone-100">{item.paperTitle}</p>
                        <p className="font-sans text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">{item.keyPoints}</p>
                        <span className="inline-block text-[9px] font-sans font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">
                          Strength: {item.strength}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opposing Literature */}
                <div className="bg-rose-50/30 dark:bg-stone-950 border border-rose-900/15 dark:border-rose-900/30 rounded-lg p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-rose-900/10 pb-3">
                    
                    <h3 className="font-sans font-semibold text-xs text-rose-950 dark:text-rose-300">
                      Opposing / Challenging Literature ({evidenceMapResult.opposingLiterature?.length || 0})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {evidenceMapResult.opposingLiterature?.map((item, idx) => (
                      <div key={idx} className="bg-white dark:bg-stone-900 p-3.5 rounded border border-rose-200/50 dark:border-rose-900/30 space-y-1.5">
                        <p className="font-sans font-medium text-xs text-stone-900 dark:text-stone-100">{item.paperTitle}</p>
                        <p className="font-sans text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">{item.keyPoints}</p>
                        <p className="text-[10px] text-rose-800 dark:text-rose-300 italic">Limitation: {item.limitation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Consensus, Disagreement, Strengths & Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-4 rounded-lg space-y-2">
                  <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 uppercase tracking-wider">What Authors Agree On</h4>
                  <ul className="space-y-1.5">
                    {evidenceMapResult.areasOfConsensus?.map((c, i) => (
                      <li key={i} className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">•</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-4 rounded-lg space-y-2">
                  <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 uppercase tracking-wider">What Authors Disagree On</h4>
                  <ul className="space-y-1.5">
                    {evidenceMapResult.areasOfDisagreement?.map((d, i) => (
                      <li key={i} className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span> {d}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50/40 dark:bg-stone-950 border border-amber-900/20 dark:border-stone-800 p-4 rounded-lg space-y-2">
                  <h4 className="font-sans font-semibold text-xs text-amber-900 dark:text-amber-400 uppercase tracking-wider">Missing Facts & Open Questions</h4>
                  <ul className="space-y-1.5">
                    {evidenceMapResult.evidenceGaps?.map((g, i) => (
                      <li key={i} className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed flex items-start gap-1.5">
                        <span className="text-amber-800 font-bold">•</span> {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-12 text-stone-400 font-sans text-xs text-center space-y-2">
              
              <p>Type your question above and click "Create Evidence Map" to see supporting and opposing facts.</p>
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB 3: RESEARCH QUESTION DEVELOPMENT ----------------- */}
      {activeTab === 'question_dev' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Form Controls */}
          <div className="lg:col-span-1 bg-stone-50/60 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 p-5 rounded-xl space-y-4">
            <div>
              <h3 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                 Question Builder
              </h3>
              <p className="font-sans text-[11px] text-stone-500 mt-1 leading-relaxed">
                Turn broad topics into clear, answerable questions while highlighting why each matters and what gap it fills.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-sans font-medium text-[11px] text-stone-700 dark:text-stone-300">What topic are you studying?</label>
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="e.g. How plastic pollution affects ocean wildlife"
                  className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#912A4A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-sans font-medium text-[11px] text-stone-700 dark:text-stone-300">Any extra details or focus area?</label>
                <textarea
                  value={contextInput}
                  onChange={(e) => setContextInput(e.target.value)}
                  rows={3}
                  placeholder="e.g. Focus on sea turtles in coastal regions"
                  className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#912A4A]"
                />
              </div>

              <button
                onClick={handleRunQuestionDevelopment}
                disabled={loadingQuestions || !topicInput.trim()}
                className="w-full font-sans text-xs bg-[#1B0A3B] text-white py-2.5 rounded-lg hover:bg-[#2A1254] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                
                {loadingQuestions ? 'Building Questions...' : 'Make Research Questions'}
              </button>
            </div>
          </div>

          {/* Result view */}
          <div className="lg:col-span-2 space-y-6">
            {loadingQuestions ? (
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-6 h-6 border-2 border-amber-900 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-sans text-xs text-stone-500 italic">Finding clear questions, key factors, and missing information...</p>
              </div>
            ) : questionDevResult ? (
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 space-y-6 shadow-sm">
                <div className="border-b border-stone-100 dark:border-stone-900 pb-3">
                  <span className="font-sans text-[9px] uppercase tracking-wider text-amber-800 font-semibold">Question Development Engine</span>
                  <h3 className="font-sans font-bold text-stone-900 dark:text-stone-100 text-base mt-0.5">Refined Research Questions</h3>
                </div>

                {/* Refined Questions Cards */}
                <div className="space-y-4">
                  {questionDevResult.refinedQuestions?.map((q, idx) => (
                    <div key={idx} className="p-4 bg-stone-50/70 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800 rounded-lg space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-900 text-white text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          {q.questionText}
                        </h4>
                        <span className={`text-[9px] font-sans font-semibold px-2 py-0.5 rounded shrink-0 ${
                          q.isAnswerable
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {q.isAnswerable ? 'Answerable Research Question' : 'High-Level Theoretical Probe'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-sans">
                        <div className="bg-white dark:bg-stone-950 p-2.5 rounded border border-stone-200/60 dark:border-stone-800">
                          <span className="font-semibold text-amber-900 dark:text-amber-400 block text-[10px] uppercase">Why It Matters</span>
                          <p className="text-stone-600 dark:text-stone-400 text-[11px] mt-0.5 leading-relaxed">{q.whyItMatters}</p>
                        </div>
                        <div className="bg-white dark:bg-stone-950 p-2.5 rounded border border-stone-200/60 dark:border-stone-800">
                          <span className="font-semibold text-emerald-800 dark:text-emerald-400 block text-[10px] uppercase">Gap Addressed</span>
                          <p className="text-stone-600 dark:text-stone-400 text-[11px] mt-0.5 leading-relaxed">{q.gapAddressed}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overlooked Contexts & Alternative Perspectives */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-amber-50/30 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 rounded-lg space-y-2">
                    <h5 className="font-sans font-semibold text-xs text-amber-900 dark:text-amber-400">Overlooked Communities, Contexts & Variables</h5>
                    <ul className="space-y-1">
                      {questionDevResult.overlookedContextsOrVariables?.map((item, i) => (
                        <li key={i} className="text-xs text-stone-700 dark:text-stone-300 flex items-start gap-1.5">
                          <span className="text-amber-700">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-lg space-y-2">
                    <h5 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100">Suggested Alternative Perspectives</h5>
                    <ul className="space-y-1">
                      {questionDevResult.suggestedAlternativePerspectives?.map((item, i) => (
                        <li key={i} className="text-xs text-stone-700 dark:text-stone-300 flex items-start gap-1.5">
                          <span className="text-amber-700">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-12 text-stone-400 font-sans text-xs text-center space-y-2">
                
                <p>Provide a broad research topic on the left to refine it into clear, answerable questions with gap justifications.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 4: PATTERN & DATA ANALYTICS ----------------- */}
      {activeTab === 'pattern_data' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Dataset / Corpus Input */}
          <div className="lg:col-span-1 bg-stone-50/60 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 p-5 rounded-xl space-y-4">
            <div>
              <h3 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                 Data Input & Corpus
              </h3>
              <p className="font-sans text-[11px] text-stone-500 mt-1 leading-relaxed">
                Import CSV spreadsheets or use your local literature collection to identify recurring patterns, variable correlations, and anomalies.
              </p>
            </div>

            <div className="flex gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
              <button
                onClick={() => setDataInputType('csv')}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  dataInputType === 'csv'
                    ? 'bg-[#912A4A] text-white font-medium'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                }`}
              >
                CSV / Dataset
              </button>
              <button
                onClick={() => setDataInputType('corpus')}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  dataInputType === 'corpus'
                    ? 'bg-[#912A4A] text-white font-medium'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                }`}
              >
                Literature Corpus ({papers.length})
              </button>
            </div>

            {dataInputType === 'csv' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-sans font-medium text-[11px] text-stone-700 dark:text-stone-300">Dataset Name</label>
                  <input
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    className="w-full font-sans text-xs p-2 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-sans font-medium text-[11px] text-stone-700 dark:text-stone-300">CSV Text Data</label>
                    <label className="text-[10px] text-amber-900 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1">
                       Upload File
                      <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                  <textarea
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    rows={6}
                    className="w-full font-mono text-[11px] p-2.5 border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>
            )}

            {dataInputType === 'corpus' && (
              <div className="p-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded text-xs font-sans text-stone-600 dark:text-stone-400">
                Will analyze all {papers.length} papers in your local library for cross-variable patterns and underexplored areas.
              </div>
            )}

            <button
              onClick={handleRunDataAnalysis}
              disabled={loadingDataAnalysis}
              className="w-full font-sans text-xs bg-[#1B0A3B] text-white py-2.5 rounded-lg hover:bg-[#2A1254] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              
              {loadingDataAnalysis ? 'Finding Patterns...' : 'Find Patterns in Data'}
            </button>
          </div>

          {/* Results View */}
          <div className="lg:col-span-2 space-y-6">
            {loadingDataAnalysis ? (
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-6 h-6 border-2 border-amber-900 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-sans text-xs text-stone-500 italic">Looking for patterns, links between items, and key numbers...</p>
              </div>
            ) : dataAnalysisResult ? (
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 space-y-6 shadow-sm">
                <div className="border-b border-stone-100 dark:border-stone-900 pb-3">
                  <span className="font-sans text-[9px] uppercase tracking-wider text-amber-800 font-semibold">Data & Pattern Intelligence</span>
                  <h3 className="font-sans font-bold text-stone-900 dark:text-stone-100 text-base mt-0.5">Data Report & Visual Charts</h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-stone-50 dark:bg-stone-900/40 rounded-lg border border-stone-200/80 dark:border-stone-800 space-y-1.5">
                    <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100">Summary Overview</h4>
                    <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{dataAnalysisResult.summary}</p>
                  </div>

                  {/* Chart Distributions Visualizer */}
                  {dataAnalysisResult.chartData && dataAnalysisResult.chartData.length > 0 && (
                    <div className="p-4 bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg space-y-3">
                      <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                         Data Chart & Counts
                      </h4>
                      <div className="space-y-2 pt-1">
                        {dataAnalysisResult.chartData.map((cd, i) => {
                          const maxVal = Math.max(...dataAnalysisResult.chartData!.map(c => c.value), 1);
                          const pct = Math.round((cd.value / maxVal) * 100);
                          return (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-xs font-sans">
                                <span className="font-medium text-stone-800 dark:text-stone-200">{cd.label}</span>
                                <span className="text-stone-500 font-mono">{cd.value}</span>
                              </div>
                              <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-800 dark:bg-amber-600 rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Variable Relationships */}
                  {dataAnalysisResult.variableRelationships && dataAnalysisResult.variableRelationships.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 uppercase tracking-wide">How Factors & Numbers Connect</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dataAnalysisResult.variableRelationships.map((vr, i) => (
                          <div key={i} className="p-3 bg-amber-50/20 dark:bg-stone-900/30 border border-amber-900/10 dark:border-stone-800 rounded space-y-1">
                            <div className="flex justify-between items-center text-xs font-sans font-semibold text-amber-900 dark:text-amber-400">
                              <span>{vr.varA} ↔ {vr.varB}</span>
                              <span className="text-[10px] bg-amber-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">{vr.relationshipType}</span>
                            </div>
                            <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-normal">{vr.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recurring themes & anomalies */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 bg-white dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-lg space-y-2">
                      <h5 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100">Recurring Themes & Connections</h5>
                      <ul className="space-y-1">
                        {dataAnalysisResult.recurringThemes?.map((t, i) => (
                          <li key={i} className="text-xs text-stone-600 dark:text-stone-400 flex items-start gap-1.5">
                            <span className="text-emerald-600">•</span> {t}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-white dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-lg space-y-2">
                      <h5 className="font-sans font-semibold text-xs text-rose-900 dark:text-rose-400">Anomalies & Contradictions</h5>
                      <ul className="space-y-1">
                        {dataAnalysisResult.contradictions?.map((c, i) => (
                          <li key={i} className="text-xs text-stone-600 dark:text-stone-400 flex items-start gap-1.5">
                            <span className="text-rose-600">•</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-12 text-stone-400 font-sans text-xs text-center space-y-2">
                
                <p>Paste table data or choose articles on the left, then click "Find Patterns in Data".</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 5: CRITICAL RESEARCH PARTNER MODE ----------------- */}
      {activeTab === 'critical_partner' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Statement Input Form */}
          <div className="lg:col-span-1 bg-stone-50/60 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800 p-5 rounded-xl space-y-4">
            <div>
              <h3 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                 Idea Assessor
              </h3>
              <p className="font-sans text-[11px] text-stone-500 mt-1 leading-relaxed">
                Acts as a helpful reviewer to test underlying assumptions and claims before reaching conclusions.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-sans font-medium text-[11px] text-stone-700 dark:text-stone-300">What claim or guess do you want to check?</label>
                <textarea
                  value={hypothesisInput}
                  onChange={(e) => setHypothesisInput(e.target.value)}
                  rows={4}
                  placeholder="e.g. Eating a good breakfast helps students concentrate better in school."
                  className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#912A4A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-sans font-medium text-[11px] text-stone-700 dark:text-stone-300">What situation or background is this for?</label>
                <input
                  type="text"
                  value={criticalContext}
                  onChange={(e) => setCriticalContext(e.target.value)}
                  placeholder="e.g. Middle school students during morning classes."
                  className="w-full font-sans text-xs p-2.5 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#912A4A]"
                />
              </div>

              <button
                onClick={handleRunCriticalPartner}
                disabled={loadingCriticalPartner || !hypothesisInput.trim()}
                className="w-full font-sans text-xs bg-[#1B0A3B] text-white py-2.5 rounded-lg hover:bg-[#2A1254] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                
                {loadingCriticalPartner ? 'Checking Assumptions...' : 'Check My Assumptions'}
              </button>
            </div>
          </div>

          {/* Critical Feedback Panel */}
          <div className="lg:col-span-2 space-y-6">
            {loadingCriticalPartner ? (
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-6 h-6 border-2 border-amber-900 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-sans text-xs text-stone-500 italic">"What assumptions are behind this idea?" Checking hidden premises...</p>
              </div>
            ) : criticalResult ? (
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 space-y-6 shadow-sm">
                <div className="border-b border-stone-100 dark:border-stone-900 pb-3">
                  <span className="font-sans text-[9px] uppercase tracking-wider text-amber-800 font-semibold">Constructive Peer Review Output</span>
                  <h3 className="font-sans font-bold text-stone-900 dark:text-stone-100 text-base mt-0.5">Assumption & Boundary Evaluation</h3>
                </div>

                {/* Second Thought Step Walkthrough */}
                {criticalResult.secondThoughtSteps && (
                  <div className="bg-amber-50/40 dark:bg-stone-900/50 p-4 rounded-lg border border-amber-900/15 dark:border-stone-800 space-y-3">
                    <h4 className="font-sans font-semibold text-xs text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
                       Second Thought Framework Application
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-sans">
                      <div className="bg-white dark:bg-stone-950 p-2 rounded border border-stone-200/60 dark:border-stone-800">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">1. Notice</span>
                        <p className="text-[11px] text-stone-700 dark:text-stone-300 mt-0.5">{criticalResult.secondThoughtSteps.notice}</p>
                      </div>
                      <div className="bg-white dark:bg-stone-950 p-2 rounded border border-stone-200/60 dark:border-stone-800">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">2. Pause</span>
                        <p className="text-[11px] text-stone-700 dark:text-stone-300 mt-0.5">{criticalResult.secondThoughtSteps.pause}</p>
                      </div>
                      <div className="bg-white dark:bg-stone-950 p-2 rounded border border-stone-200/60 dark:border-stone-800">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">3. Question</span>
                        <p className="text-[11px] text-stone-700 dark:text-stone-300 mt-0.5">{criticalResult.secondThoughtSteps.question}</p>
                      </div>
                      <div className="bg-white dark:bg-stone-950 p-2 rounded border border-stone-200/60 dark:border-stone-800">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">4. Listen</span>
                        <p className="text-[11px] text-stone-700 dark:text-stone-300 mt-0.5">{criticalResult.secondThoughtSteps.listen}</p>
                      </div>
                      <div className="bg-white dark:bg-stone-950 p-2 rounded border border-stone-200/60 dark:border-stone-800">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">5. Reconsider</span>
                        <p className="text-[11px] text-stone-700 dark:text-stone-300 mt-0.5">{criticalResult.secondThoughtSteps.reconsider}</p>
                      </div>
                      <div className="bg-white dark:bg-stone-950 p-2 rounded border border-stone-200/60 dark:border-stone-800">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">6. Choose</span>
                        <p className="text-[11px] text-stone-700 dark:text-stone-300 mt-0.5">{criticalResult.secondThoughtSteps.choose}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Underpinning Assumptions & Counter Arguments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg space-y-2">
                    <h5 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                       Underpinning Assumptions & Unstated Premises
                    </h5>
                    <ul className="space-y-1.5">
                      {criticalResult.underpinningAssumptions?.map((item, i) => (
                        <li key={i} className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed flex items-start gap-1.5">
                          <span className="text-amber-800">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg space-y-2">
                    <h5 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                       Alternative Explanations & Counter-Arguments
                    </h5>
                    <ul className="space-y-1.5">
                      {criticalResult.counterArgumentsToConsider?.map((item, i) => (
                        <li key={i} className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed flex items-start gap-1.5">
                          <span className="text-sky-600">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Constructive Reframing */}
                <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-900/20 dark:border-emerald-900/40 rounded-lg space-y-1.5">
                  <h5 className="font-sans font-semibold text-xs text-emerald-950 dark:text-emerald-300">Constructive Reframing Suggestion</h5>
                  <p className="font-sans text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                    {criticalResult.constructiveReframing}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-12 text-stone-400 font-sans text-xs text-center space-y-2">
                
                <p>Enter a research claim or conclusion on the left to evaluate its underpinning assumptions and test its boundary limits with your critical partner.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
