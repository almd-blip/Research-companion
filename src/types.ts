/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Paper {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi: string;
  tags: string[];
  collectionId?: string;
  notes: string;
  abstract?: string;
  verificationStatus: 'verified' | 'missing_metadata' | 'unverified';
  missingFields: string[];
  annotations: Annotation[];
  structuredSummary?: StructuredSummary;
  traceabilityNotes?: string;
}

export interface Annotation {
  id: string;
  text: string;
  comment?: string;
  color: string;
  createdAt: string;
  page?: number;
}

export interface StructuredSummary {
  researchQuestion: string;
  methods: string;
  participants: string;
  findings: string;
  limitations: string;
  evidenceStrength: number; // 1 to 5
  evidenceExplanation: string;
  futureResearch: string;
  keyQuotations: string[];
  majorConcepts: string[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface ResearchJourney {
  id: string;
  title: string;
  type: 'undergrad' | 'masters' | 'phd' | 'postdoc' | 'journal' | 'book' | 'funding' | 'public_engagement' | 'policy';
  description: string;
  questions: string[];
  chapters: Chapter[];
  tasks: Task[];
  timeline: TimelineEvent[];
  linkedPaperIds: string[];
  targetDeadline?: string;
  reusableSnippets?: string[];
  fundingDetails?: FundingDetails;
}

export interface Chapter {
  id: string;
  title: string;
  status: 'not_started' | 'drafting' | 'review' | 'completed';
  content: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'milestone' | 'meeting' | 'submission' | 'draft';
}

export interface FundingDetails {
  funderName: string;
  priorityCriteria: string[];
  impactStatement: string;
  collaborators: string;
  budgetSummary?: string;
}

export interface MoodCheckIn {
  id: string;
  timestamp: string;
  state: 'focused' | 'curious' | 'overwhelmed' | 'stuck' | 'doubting' | 'tired' | 'avoiding_writing' | 'anxious';
  note?: string;
}

export interface DailyGoal {
  text: string;
  completed: boolean;
}

export interface SoundScape {
  id: string;
  name: string;
  type: 'nature' | 'museum' | 'library' | 'white_noise';
  src: string;
}

export type CitationStyle = 'APA7' | 'Harvard' | 'Chicago' | 'IEEE' | 'MLA9';

export interface GraphNode {
  id: string;
  label: string;
  type: 'journey' | 'paper' | 'concept' | 'theme' | 'quote';
  color?: string;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  relation: string;
}
