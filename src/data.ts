/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Paper, ResearchJourney, Collection, SoundScape } from './types';

export const INITIAL_COLLECTIONS: Collection[] = [
  { id: 'col-1', name: 'Critical AI & Society', description: 'Papers examining sociotechnical aspects of AI systems', color: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200' },
  { id: 'col-2', name: 'Methodology & Design', description: 'HCI and qualitative methods in software development', color: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200' },
  { id: 'col-3', name: 'Academic Mental Health', description: 'Literature on sustainable scholarship and wellbeing', color: 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200' }
];

export const INITIAL_PAPERS: Paper[] = [
  {
    id: 'paper-1',
    title: 'Attention Is All You Need',
    authors: 'Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin',
    journal: 'Advances in Neural Information Processing Systems',
    year: 2017,
    doi: '10.48550/arXiv.1706.03762',
    tags: ['Transformer', 'Deep Learning', 'NLP'],
    collectionId: 'col-1',
    notes: 'The foundational paper for modern LLMs. Outlines the self-attention mechanism, replacing RNN/LSTM entirely.',
    abstract: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.',
    verificationStatus: 'verified',
    missingFields: [],
    annotations: [
      { id: 'ann-1', text: 'dispensing with recurrence and convolutions entirely', comment: 'Radical simplification of architectures', color: '#FEF08A', createdAt: '2026-06-25T10:00:00Z', page: 1 },
      { id: 'ann-2', text: 'self-attention mechanism, relating different positions of a single sequence', comment: 'Allows parallel training and long-range dependencies', color: '#BCF0DA', createdAt: '2026-06-25T10:15:00Z', page: 2 }
    ],
    structuredSummary: {
      researchQuestion: 'Can neural sequence transduction models be built purely on attention mechanisms, eliminating recurrence and convolutions entirely?',
      methods: 'Design of the Transformer architecture with Multi-Head Self-Attention. Trained on WMT translation datasets and evaluated BLEU scores.',
      participants: 'N/A (Trained on standard corpora: WMT 2014 English-to-German and English-to-French).',
      findings: 'The Transformer achieves state-of-the-art translation quality (28.4 BLEU on English-to-German) while training in a fraction of the time of recurrent models.',
      limitations: 'High quadratic memory complexity regarding sequence length, making long document synthesis computationally expensive without modification.',
      evidenceStrength: 5,
      evidenceExplanation: 'Outstanding evidence backed by standardized benchmarks, massive statistical improvements, and universal industry replication.',
      futureResearch: 'Applying attention-based models to other modalities like images, audio, video, and scaling to extremely long inputs.',
      keyQuotations: [
        'The Transformer is the first sequence transduction model relying entirely on self-attention to compute representations of its input and output.',
        'We show that the self-attention mechanism allows the model to capture dependencies regardless of their distance.'
      ],
      majorConcepts: ['Transformer', 'Self-Attention', 'Multi-Head Attention', 'Parallel training', 'Sequence-to-sequence']
    }
  },
  {
    id: 'paper-2',
    title: 'Designing for Deep Thinking: Cognitive Overload and Calm AI Systems',
    authors: 'Elena S. Rostova, Kenji Takahashi',
    journal: 'Journal of Human-Computer Interaction Studies',
    year: 2024,
    doi: '10.1016/j.jhcis.2024.10425',
    tags: ['Calm Tech', 'Cognitive Load', 'Productivity Bias'],
    collectionId: 'col-2',
    notes: 'Critically evaluates how modern "productivity-boosting" tools actually induce cognitive overload and imposter syndrome by displaying constant metrics.',
    abstract: 'This paper examines the cognitive impact of metric-centric productivity dashboards on researchers. We show that continuous telemetry, streaks, and gamification induce anxiety and disrupt deep focus states (flow). We propose a "Calm Tech" framework for research software that prioritizes asynchronous engagement and organic reflection.',
    verificationStatus: 'verified',
    missingFields: [],
    annotations: [
      { id: 'ann-3', text: 'gamification induce anxiety and disrupt deep focus states', comment: 'Direct critique of Zotero/Mendeley progress counters', color: '#FCA5A5', createdAt: '2026-06-26T08:30:00Z', page: 4 }
    ],
    structuredSummary: {
      researchQuestion: 'How do gamified progress metrics in research software affect cognitive load and focus among graduate researchers?',
      methods: 'Mixed-methods study: qualitative diary study (N=45) over 6 weeks and quantitative electroencephalography (EEG) focus tracking in a controlled laboratory setting.',
      participants: '45 PhD candidates and postdoctoral scholars in humanities and physical sciences.',
      findings: 'Software featuring gamification and metric progress bars increased cognitive load scores by 34% on average and triggered imposter syndrome thoughts in 72% of participants.',
      limitations: 'The laboratory EEG sample size was relatively small (N=15) and conducted over a short duration.',
      evidenceStrength: 4,
      evidenceExplanation: 'Strong mixed-methods triangulation combining direct neurophysiological EEG data with qualitative diary studies, though a larger participant pool would solidify generalizability.',
      futureResearch: 'Investigating quiet, slow-tech digital environments that foster reflective pacing and cognitive decompression.',
      keyQuotations: [
        'Research is an organic, non-linear cognitive journey; forcing linear metrics onto intellectual inquiry creates a false sense of inadequacy.',
        'Calm software design rejects constant notifications, replacing urgency with spaciousness.'
      ],
      majorConcepts: ['Calm Technology', 'Cognitive Load', 'Productivity Bias', 'Deep Focus', 'Slow Tech']
    }
  },
  {
    id: 'paper-3',
    title: 'The Impostor Phenomenon in Academic Environments: Prevalence and Prevention',
    authors: 'Pauline Rose Clance, Suzanne Ament Imes',
    journal: 'Psychotherapy: Theory, Research & Practice',
    year: 1978,
    doi: '10.1037/h0086033',
    tags: ['Wellbeing', 'Impostor Phenomenon', 'Higher Education'],
    collectionId: 'col-3',
    notes: 'The classic paper defining the Impostor Phenomenon. Highly relevant for research wellbeing modules.',
    abstract: 'The term "impostor phenomenon" is used to designate an internal experience of intellectual phoniness which appears to be particularly prevalent and intense among high-achieving women. Despite outstanding academic credentials, these individuals live in constant fear of being exposed as intellectual frauds.',
    verificationStatus: 'verified',
    missingFields: [],
    annotations: [],
    structuredSummary: {
      researchQuestion: 'Why do highly successful, credentialed women experience intense feelings of intellectual fraudulence, and what psychological dynamics maintain this cycle?',
      methods: 'Clinical case study and qualitative interviews over 5 years with high-achieving women.',
      participants: 'Over 150 high-achieving women including PhD students, faculty members, and clinical clients.',
      findings: 'The phenomenon is rooted in early family dynamics and societal gender expectations. Individuals utilize grueling defense mechanisms (overwork, intellectual charm) which temporarily ward off exposure but ultimately reinforce the cycle.',
      limitations: 'The original sample lacked diversity in socioeconomic status and gender representation, focusing heavily on clinical therapy clients.',
      evidenceStrength: 3,
      evidenceExplanation: 'A seminal foundational work that established a vital paradigm, but relies on clinical qualitative interpretation and case studies rather than statistically representative quantitative controls.',
      futureResearch: 'Analyzing the prevalence of this phenomenon among minoritized scholars and developing institutional intervention programs.',
      keyQuotations: [
        'Despite outstanding academic and professional accomplishments, these women persist in believing that they are really not bright and have fooled anyone.',
        'The impostor cycle is reinforced when success is attributed to luck, timing, or charming others, rather than actual capability.'
      ],
      majorConcepts: ['Impostor Phenomenon', 'Intellectual Fraudulence', 'Attribution Theory', 'Sustainable Self-Evaluation']
    }
  },
  {
    id: 'paper-4',
    title: 'Sustaining Scientific Inquiry: A Study of Researcher Burnout',
    authors: 'Marcus Vance, Sarah L. Jenkins',
    journal: 'Studies in Graduate and Higher Education',
    year: 2025,
    doi: '',
    tags: ['Burnout', 'Mental Health', 'Supervisor Dynamics'],
    collectionId: 'col-3',
    notes: 'Incomplete DOI! Good for showing our DOI metadata repair capabilities.',
    abstract: 'We survey graduate researchers to identify predictors of clinical burnout. We locate supervisor relationships, publication pressure, and isolation as the three primary axes of risk. We outline individual and system-level mitigations.',
    verificationStatus: 'missing_metadata',
    missingFields: ['doi', 'volume', 'issue', 'pages'],
    annotations: []
  }
];

export const INITIAL_JOURNEYS: ResearchJourney[] = [];

export const WELLBEING_RESOURCES = {
  impostorSyndrome: {
    title: 'Deconstructing the Impostor Phenomenon',
    subtitle: 'Evidence-informed strategies for scholarly confidence',
    sections: [
      {
        heading: '1. Recognize the Base Rate Error',
        content: 'Graduate school and academic environments select the top fraction of achievers. When everyone around you has been selected for excellence, the environment naturally filters out visible struggle. Experiencing self-doubt in a room of high-performers is not evidence of fraudulence; it is a predictable statistical selection effect.'
      },
      {
        heading: '2. The Attribution Realignment',
        content: 'Scholars experiencing the impostor phenomenon systematically attribute success to external causes (luck, charm, timing, ease) and failure to internal causes (incapability, lack of intellect). Document your specific contributions. Write down: "What action did I take that led to this breakthrough?" Force your brain to associate effort and design with positive outcomes.'
      },
      {
        heading: '3. Redefine "The Scholar"',
        content: 'You do not need to be an infallible oracle to be a researcher. A researcher is simply someone who asks systematic questions, gathers rigorous evidence, and reports transparently. Acknowledging limits is a sign of academic strength, not weakness.'
      }
    ],
    reflectionPrompt: 'Recall a specific academic challenge you faced a year ago. What methods did you use to overcome it? What does this tell you about your ability to handle today\'s ambiguity?'
  },
  supervisorMeetings: {
    title: 'Supervisor Meeting Preparation Strategy',
    subtitle: 'Structuring communications to maintain agency and clarity',
    sections: [
      {
        heading: '1. Drive the Agenda (Do not let it drive you)',
        content: 'Send a bulleted agenda 24 hours prior to the meeting. Include: (a) Specific progress made, (b) The exact blocking questions you need resolved, and (c) Immediate next steps. This frames the supervisor as a consultant, rather than a judge, preserving your intellectual ownership.'
      },
      {
        heading: '2. The "Structured Dilemma" Technique',
        content: 'Never present a blank problem. Instead, outline alternative paths. For example: "I have encountered a bottleneck in the database schema. I can either: (A) Use a relational model which guarantees transactional safety, or (B) Use an offline Key-Value structure which ensures privacy and performance. I lean toward B because... What are your thoughts?" This proves critical synthesis.'
      },
      {
        heading: '3. Close the Loop with Minutes',
        content: 'After the meeting, send a 3-sentence summary of agreed actions. Written records prevent moving goalposts and clarify expectations, neutralizing academic gaslighting or memory issues.'
      }
    ],
    reflectionPrompt: 'What is the single most critical decision you need input on during your next meeting? How can you present it as a choice between two logical pathways?'
  },
  rejectionRecovery: {
    title: 'Rejection Recovery and Reviewer Response',
    subtitle: 'Processing feedback objectively without internalizing failure',
    sections: [
      {
        heading: '1. The 48-Hour Cooling Rule',
        content: 'When a paper, grant, or application is rejected, read the decision once, then close the document and do not touch it for 48 hours. Your emotional response is neurophysiologically valid; do not force yourself to draft revisions or argue with reviewers during this high-cortisol period.'
      },
      {
        heading: '2. De-Personalize the Text',
        content: 'Reviewer criticism is a commentary on the current state of a drafted text, not a verdict on your intellect. Translate emotional reviewer comments into cold, actionable logic. For example, if a reviewer writes: "The author fails to grasp the complexity of X," translate this to: "Make explanation of X more explicit in Section 2.2."'
      },
      {
        heading: '3. Re-Submission is the Default',
        content: 'Academic publishing is a game of matching and persistence. A rejection often indicates a poor fit for a particular journal issue rather than flawed research. Instantly identify the secondary target journal, format the citations, and send it out.'
      }
    ],
    reflectionPrompt: 'Look at the last critical piece of feedback you received. If you stripped away all emotional, defensive, or harsh vocabulary, what is the core structural improvement they are asking for?'
  }
};

export const SOUNDSCAPES: SoundScape[] = [
  { id: 'sound-1', name: 'Muted Library Rain', type: 'library', src: 'gentle_rain' },
  { id: 'sound-2', name: 'Museum Reading Room', type: 'museum', src: 'distant_footsteps' },
  { id: 'sound-3', name: 'Coastal Forest Breeze', type: 'nature', src: 'procedural_wind' }
];


// ----------------- COMPLETE 13-POINT PLATFORM SPECIFICATION -----------------
// Rendered beautifully as an academic paper inside the specifications reading mode.
export const SYSTEM_SPECIFICATION = {
  title: "The Research Companion Platform: Architecture and Technical Foundations",
  subtitle: "A Decadal Paradigm for Sustainable, Privacy-First Academic Inquiry",
  authors: "UX Research, Accessibility, Software Architecture, HCI & PhD Advisory Board",
  date: "June 2026",
  abstract: "This document delineates the comprehensive system architecture, database design, AI synthesis protocol, accessibility strategy, and development roadmap for the Research Companion. Operating under offline-first, privacy-by-default, and calm-computing design philosophies, the platform represents a fundamental departure from citation management systems toward a sustainable digital ecosystem for academic scholars.",
  
  sections: [
    {
      id: "spec-1",
      title: "1. Product Vision",
      content: `The Research Companion is built on the fundamental premise that researchers are human beings, not data-processing engines. Zotero and Mendeley operate as static storage cabinets, while EndNote serves as a mechanical formatter. None of these systems support the highly non-linear, emotionally demanding, and cognitively exhausting lifecycles of scholarly research.

Our vision is a digital workspace that actively nurtures intellectual agency. Rather than stressing researchers with productivity metrics, daily writing streaks, and constant notification loops, the Research Companion provides a quiet, offline-first library atmosphere. It respects the cognitive flow state, ensures absolute data privacy, maintains traceable evidence lines, and integrates advanced generative AI as a humble dialogue partner rather than an authoritative writer. The platform acts as an intellectual anchor, sustaining scholars through the journeys of undergrad papers, Masters, PhDs, books, and complex funding applications while keeping academic integrity pristine.`
    },
    {
      id: "spec-2",
      title: "2. System Architecture",
      content: `The platform is structured using a client-server full-stack topology, but designed to operate perfectly in a sandboxed, low-latency, offline-first client node:

• Client Layer (React 19 + Tailwind CSS + motion): Handles highly dense information hierarchies, D3 graph canvas, and local state management. Built on fluid container queries to support split-screen writing.
• Offline Local Sync Engine: Intercepts client-side writes, saving drafts, annotations, and metadata into localStorage or local indexedDB. It provides JSON import/export (Research Companion Archive) for zero-cloud reliance.
• Application Server Layer (Express + Node.js): Serves as a local API gateway in dev mode or container node. Proxies AI requests to Gemini API, keeping credentials securely hidden from the browser.
• AI Engine Interface: Communicates with Google's @google/genai SDK on the server, applying rigorous academic system instructions to force factual traceability and structured JSON outputs.`
    },
    {
      id: "spec-3",
      title: "3. Screen Architecture",
      content: `The user interface is laid out in a responsive dual-pane structure, optimizing for cognitive ease and split-screen deep focus:

• Navigation Panel (Aesthetic Rail): Left-aligned, high-contrast, keyboard-navigable menu bar that expands on demand. Avoids distracting badges.
• Modular Workspace: Adaptable main viewport. For example, the Writing Companion divides the screen into a minimalist, distraction-free typing layout on the left, and a slide-out 'AI Scholar & Reference' shelf on the right.
• Wellbeing Sentry: A quiet footer that houses the calm audio player and Pomodoro timer, accessible via hotkeys, displaying no flashing tickers or anxiety-inducing timers.
• Readable Columns: All reading panes limit text lines to 70–80 characters (optimal for reading speed and eye tracking) using left alignment and beautiful serif font options.`
    },
    {
      id: "spec-4",
      title: "4. Navigation Map",
      content: `The navigation map is direct, flat, and intuitive to reduce decision fatigue:

• [Research Home]: Current single-focus goal, overview of active projects, and the "How are you arriving?" mood check.
• [Literature Library]: Grid/List view of papers with direct search, metadata status check, and interactive annotation workbench.
• [Literature Intelligence]: Cross-paper synthesis console, agreement/disagreement matrix, and theme clustering workspace.
• [Research Workspace]: Journey boards mapping chapters, tasks, questions, and timelines.
• [Writing Companion]: Distraction-free draft editor with side-by-side local citation recommending panel.
• [Citation Engine]: Style formatter (APA7, IEEE, etc.) and metadata repair tools.
• [Research Wellbeing]: Soundscape mixer, Impostor Syndrome reframing guides, and meeting checklists.
• [Funding Workspace]: Grant bid preparations, funder criteria compliance checklists, and bios.
• [Knowledge Graph]: D3 interactive visualization of interconnected themes, papers, and quotes.`
    },
    {
      id: "spec-5",
      title: "5. Database Structure",
      content: `The data schema utilizes a relational graph mapped to a document model:

• Papers Table: Schema includes Title, Authors, Journal, Year, DOI (unique), Tags, notes, VerificationStatus, and Annotations [array of {id, text, comment, color}].
• Journeys Table: Maps JourneyID to Title, JourneyType, Description, Questions [string array], Chapters [array of {id, title, status, content}], Tasks [array of {id, text, completed}], and Timeline [array of {id, date, title, type}].
• Connections (Graph Edge) Table: Tracks relationship arrays linking [SourceID, TargetID, RelationType, Notes].
• MoodCheck Table: Timestamps of user's state check-ins to adapt UI themes and reflection prompts.

In our client implementation, this is completely mirrored in a local database file to support offline reading and writing.`
    },
    {
      id: "spec-6",
      title: "6. AI Architecture",
      content: `The AI architecture is built on the core principle: "AI assists, Humans decide." 

• Primary Model: 'gemini-3.5-flash' handles text synthesis, claims-checking, and metadata parsing due to its exceptional speed, low latency, and advanced reasoning capabilities.
• Strict Grounding Protocol: We utilize structured JSON schemas (via responseSchema) to enforce deterministic outputs.
• Anti-Hallucination Framework: AI prompts are injected with negative constraints, forbidding the model from writing text with references not found in the user's provided local library. When suggesting supports, the AI must explicitly link the paper ID and Title, producing a 100% traceable, non-fabricated citations network.
• Confidence Leveling: Every summary or claims report generates a 1-5 strength-of-evidence index based on the source's methodology.`
    },
    {
      id: "spec-7",
      title: "7. Offline-First Strategy",
      content: `Academic research is done in quiet libraries, on trains, in remote archives, and during travel. Relying on continuous cloud connections disrupts flow and compromises security:

• Local Cache First: All writes (notes, highlights, chapters, tasks) are committed synchronously to LocalStorage.
• File-Based Portability: Users can export their entire platform database as a '.rcp' (Research Companion Project) JSON file. They can import this archive on any browser node. This guarantees absolute data ownership and prevents software lock-in.
• Deferred Server Processing: Heavy analytical tasks (like running Gemini on a new paper) are queued. If offline, the interface states "Queued for processing when online" and operates locally. All static features remain fully active.`
    },
    {
      id: "spec-8",
      title: "8. Accessibility Strategy",
      content: `Accessibility is treated as a foundational element of academic rigor:

• Responsive Typography: Switcher supporting 'Sans-Serif' (Inter for UI layout) and 'Academic Serif' (Georgia/Playfair for reading) with adjustable font scales (S, M, L, XL).
• Visual Contrast: Color blind-safe palettes and high-contrast, eye-friendly light/dark themes utilizing off-white warm paper surfaces and deep charcoal inks.
• Cognitive Safety: Left-aligned, readable text-columns limiting character-widths. Zero intrusive notifications or flashing timers.
• Screen Reader Support: Use of semantic HTML5 nodes (aside, main, article, section) with strict ARIA tags on interactive elements, and hidden assistive labels.`
    },
    {
      id: "spec-9",
      title: "9. Technical Stack Recommendations",
      content: `Our recommended stack represents a lightweight, dependable, long-term choice:

• Language: TypeScript (strict mode) for compile-time safety and type contract enforcement.
• Frontend Framework: React 19 (for modular, reactive interface layout) combined with Vite (ultra-fast bundler).
• Styling: Tailwind CSS (for modular, maintainable, responsive utility styling) + @tailwindcss/vite.
• Graph Visualization: D3.js (the industry gold-standard for fast, high-performance interactive physics simulations).
• Back-End Host: Express (NodeJS) to act as a secure CORS proxy and Gemini client.
• Compilers: Esbuild for bundling backend code into a self-contained production-ready CJS script.`
    },
    {
      id: "spec-10",
      title: "10. MVP Roadmap",
      content: `The Minimum Viable Product focuses on delivering immediate, high-fidelity core utility:

• Milestone 1: Deliver beautiful 'Warm Paper' UI theme, accessibility typography switcher, and flat dashboard navigation.
• Milestone 2: Build the Literature Library & local state managers with DOI check-ups and JSON Import/Export.
• Milestone 3: Integrate Express server + @google/genai, implementing structured summaries, claim checking, and advisor check-ins.
• Milestone 4: Add the Wellbeing Soundscapes & Pomodoro timers, and render the D3 Interactive Knowledge Graph.
• Milestone 5: Compile, verify, and launch the unified specifications workspace.`
    },
    {
      id: "spec-11",
      title: "11. Future Roadmap",
      content: `The decadal vision extends beyond the MVP to enrich intellectual autonomy:

• Year 1-2: Support local PDF processing using client-side WebAssembly parsing (pdf.js) to extract abstracts directly offline.
• Year 3-5: Add fully localized offline LLM execution (via WebGPU or Chrome's local AI API) to perform basic summarization without any external network calls.
• Year 6-10: Establish a decentralized, cryptographic peer-to-peer sync protocol (such as CRDTs over WebRTC) allowing collaborative lab groups to synchronize libraries without a central cloud server, preserving 100% researcher privacy.`
    },
    {
      id: "spec-12",
      title: "12. Risks and Mitigation",
      content: `We actively mitigate technical and human risks:

• Risk: Browser storage clearing (caches cleared by browser updates).
  Mitigation: Highly prominent, low-friction, automatic backup prompts to download local .rcp JSON backups upon exiting the app or completing milestones.
• Risk: LLM hallucinations creating false citations.
  Mitigation: Enforcing a rigid local-only cross-referencing prompt, preventing the model from sourcing references from its pre-training weights, and assigning evidence strength flags.
• Risk: Screen-reader friction on complex graphs.
  Mitigation: Providing an alternative high-contrast accessible list-view table for all relationships depicted on the Knowledge Graph canvas.`
    },
    {
      id: "spec-13",
      title: "13. Platform Differentiation",
      content: `The Research Companion completely outpaces classical citation managers and modern 'productivity wrappers':

• Mendeley / EndNote: Designed as static indexing containers. They are rigid, bloated, and present no features supporting intellectual synthesis, writing drafts, or cognitive wellbeing.
• Zotero: Open source and highly commendable, but remains a library list manager with no native intelligent draft-cross referencing, argument modeling, or mental health safeguards.
• AI Writing Assistants: Wrappers that write the text *for* you, inducing guilt, encouraging academic laziness, and risking severe citation fabrication.
• Research Companion Difference: Focuses on the *journey* and *health* of the researcher. It does not write the paper; it helps you organize your thoughts. It does not display speed charts; it reminds you to breathe. It connects local literature traceably, checks your claims with cold evidence, and helps you trust your own voice.`
    }
  ]
};
