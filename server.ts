/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'MOCK_API_KEY', // Fallback for safety
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// ----------------- API ROUTES -----------------

// 1. Literature Intelligence API - Generate structured summary
app.post('/api/gemini/summarize', async (req, res) => {
  try {
    const { title, authors, abstract, notes } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Paper title is required' });
    }

    const ai = getGeminiClient();
    const prompt = `Perform a rigorous, objective academic analysis of the following paper:
Title: ${title}
Authors: ${authors || 'Unknown'}
Abstract/Text: ${abstract || 'No abstract provided.'}
Researcher Notes: ${notes || 'None'}

Please extract:
1. The primary research question or objective.
2. The methodologies used (empirical, quantitative, qualitative, theoretical, etc.).
3. The participants, dataset size, or subject of study.
4. The key findings and outcomes.
5. Limitations acknowledged by authors or apparent in the methodology.
6. A rating of the strength of evidence (integer from 1 to 5) with a rigorous academic justification of why this rating was given.
7. Crucial directions for future research.
8. Two key quotations from the text or abstract (or closely formulated if abstract is short).
9. Major concepts or keywords.

Strict academic integrity rule: DO NOT FABRICATE citations, references, or claims. If details are not in the text, write "Not explicitly detailed in text" instead of inventing them.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a highly rigorous, calm academic meta-researcher and librarian. Your goal is to analyze papers accurately, check evidence strength objectively, and prevent hallucination.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['researchQuestion', 'methods', 'participants', 'findings', 'limitations', 'evidenceStrength', 'evidenceExplanation', 'futureResearch', 'keyQuotations', 'majorConcepts'],
          properties: {
            researchQuestion: { type: Type.STRING },
            methods: { type: Type.STRING },
            participants: { type: Type.STRING },
            findings: { type: Type.STRING },
            limitations: { type: Type.STRING },
            evidenceStrength: { type: Type.INTEGER, description: 'Rating 1 to 5 representing strength of evidence' },
            evidenceExplanation: { type: Type.STRING },
            futureResearch: { type: Type.STRING },
            keyQuotations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            majorConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const summaryData = JSON.parse(response.text || '{}');
    res.json(summaryData);
  } catch (error: any) {
    console.error('Error in /api/gemini/summarize:', error);
    res.status(500).json({ error: error.message || 'Failed to generate structured summary' });
  }
});

// 2. Writing Companion API - Claim Checker & Supporter
app.post('/api/gemini/analyze-draft', async (req, res) => {
  try {
    const { draftText, papersInLibrary } = req.body;
    if (!draftText) {
      return res.status(400).json({ error: 'Draft text is required' });
    }

    const libraryContext = papersInLibrary && papersInLibrary.length > 0
      ? papersInLibrary.map((p: any) => `Paper ID: ${p.id}\nTitle: ${p.title}\nAuthors: ${p.authors}\nFindings: ${p.structuredSummary?.findings || 'Not analyzed yet.'}`).join('\n\n')
      : 'None available in the local library.';

    const ai = getGeminiClient();
    const prompt = `Analyze the following academic writing draft. 
Cross-reference it with the researcher's local Library Papers listed below.

Draft Text:
"""
${draftText}
"""

Local Library Papers Context:
${libraryContext}

Perform these precise, highly supportive tasks:
1. Highlight any claims in the draft that are unsupported by references or evidence.
2. Identify which papers in the researcher's local library support the claims made, referencing them by Title.
3. Identify if any papers in the researcher's local library contain contradictory or conflicting evidence compared to claims in the draft.
4. Suggest constructive outline or argumentative enhancements to make the research more cohesive.

IMPORTANT: Keep your analysis objective, deeply respectful, supportive, and trace everything back to the actual papers provided. Under no circumstances should you invent references that do not exist.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a warm, encouraging, but academically rigorous Writing Coach and supervisor. You help researchers organize their arguments, identify gaps in evidence, and cite from their existing library without pressuring them.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['unsupportedClaims', 'supportedByLibrary', 'contradictoryEvidence', 'outlineSuggestions'],
          properties: {
            unsupportedClaims: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['claimText', 'issue', 'recommendation'],
                properties: {
                  claimText: { type: Type.STRING, description: 'The exact or paraphrased claim text' },
                  issue: { type: Type.STRING, description: 'Why this claim is unsupported' },
                  recommendation: { type: Type.STRING, description: 'How the user can find or cite evidence' }
                }
              }
            },
            supportedByLibrary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['claimText', 'paperTitle', 'howItSupports'],
                properties: {
                  claimText: { type: Type.STRING },
                  paperTitle: { type: Type.STRING },
                  howItSupports: { type: Type.STRING }
                }
              }
            },
            contradictoryEvidence: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['draftClaim', 'paperTitle', 'conflictDetails'],
                properties: {
                  draftClaim: { type: Type.STRING },
                  paperTitle: { type: Type.STRING },
                  conflictDetails: { type: Type.STRING, description: 'Description of the contradictory evidence in this paper' }
                }
              }
            },
            outlineSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const analysisData = JSON.parse(response.text || '{}');
    res.json(analysisData);
  } catch (error: any) {
    console.error('Error in /api/gemini/analyze-draft:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze draft' });
  }
});

// 3. Research Advisor - Adapt to Mood & Journey State
app.post('/api/gemini/advisor', async (req, res) => {
  try {
    const { moodState, question, projectDetails } = req.body;
    if (!moodState) {
      return res.status(400).json({ error: 'Mood state is required' });
    }

    const ai = getGeminiClient();
    const prompt = `The researcher has checked in today feeling: "${moodState.toUpperCase()}".
Context of current project: ${projectDetails || 'General Academic Research'}.
Researcher's prompt/question: "${question || 'How should I tackle my work today?'}"

Provide an academic-advising style mentoring response that is:
1. Deeply supportive, reassuring, calm, and practical.
2. Adaptable to their mood (e.g., if "overwhelmed", break steps into micro-tasks; if "stuck", suggest alternative starting methods; if "doubting myself", provide gentle impostor syndrome reframing).
3. Highly scientific and evidence-informed (never therapeutic, never patronizing, always professional and humble).
4. Includes 3 specific, low-friction next actions.
5. Includes a comforting, academic reflection prompt.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an exceptional, warm, wise, and encouraging PhD Supervisor and research wellbeing companion. You help researchers handle uncertainty, reduce overwhelm, and find intellectual joy in their journeys.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['mentoringResponse', 'actionSteps', 'reflectionPrompt'],
          properties: {
            mentoringResponse: { type: Type.STRING, description: 'The paragraph of wise academic advice' },
            actionSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 small, low-pressure steps'
            },
            reflectionPrompt: { type: Type.STRING, description: 'A gentle prompt for reflection' }
          }
        }
      }
    });

    const advisorData = JSON.parse(response.text || '{}');
    res.json(advisorData);
  } catch (error: any) {
    console.error('Error in /api/gemini/advisor:', error);
    res.status(500).json({ error: error.message || 'Failed to consult advisor' });
  }
});

// 4. Metadata Verifier - Automatic DOI / Citation check
app.post('/api/gemini/metadata-verify', async (req, res) => {
  try {
    const { title, authors, doi } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required for metadata verification' });
    }

    const ai = getGeminiClient();
    const prompt = `Verify, correct, and complete the metadata for the following academic work:
Title: ${title}
Provided Authors: ${authors || 'Unknown'}
Provided DOI: ${doi || 'None'}

Please provide corrected and standardized metadata based on actual academic databases. 
If the DOI is missing, identify a probable DOI or provide standard formatting. 
Flag any missing fields that are required for citation styles (such as Volume, Issue, Pages, Publisher).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an incredibly accurate academic librarian database resolver. You complete missing details like DOI, standard journal names, authors, and flag missing metadata fields.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['correctedTitle', 'correctedAuthors', 'correctedJournal', 'correctedYear', 'correctedDoi', 'missingFields', 'verificationStatus'],
          properties: {
            correctedTitle: { type: Type.STRING },
            correctedAuthors: { type: Type.STRING },
            correctedJournal: { type: Type.STRING },
            correctedYear: { type: Type.INTEGER },
            correctedDoi: { type: Type.STRING },
            missingFields: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            verificationStatus: { type: Type.STRING, description: 'Must be "verified" if complete, or "missing_metadata" otherwise' }
          }
        }
      }
    });

    const verifiedData = JSON.parse(response.text || '{}');
    res.json(verifiedData);
  } catch (error: any) {
    console.error('Error in /api/gemini/metadata-verify:', error);
    res.status(500).json({ error: error.message || 'Failed to verify metadata' });
  }
});

// 5. Connect Literature - Explain Agreement/Disagreement
app.post('/api/gemini/connect-literature', async (req, res) => {
  try {
    const { papers } = req.body;
    if (!papers || papers.length < 2) {
      return res.status(400).json({ error: 'At least two papers are required to connect literature' });
    }

    const papersDescription = papers.map((p: any, index: number) => `Paper ${index + 1}:
Title: ${p.title}
Authors: ${p.authors}
Findings: ${p.structuredSummary?.findings || p.abstract || 'None'}`).join('\n\n');

    const ai = getGeminiClient();
    const prompt = `Synthesize and find connections between these academic works:
${papersDescription}

Explain where they agree, where they disagree or conflict (methodologically or conceptually), and cluster them under 2-3 common themes or schools of thought.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an advanced literature synthesizer. You find deep thematic overlap, clarify debates, and highlight conceptual consensus or divergence between papers.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['agreements', 'disagreements', 'thematicClusters'],
          properties: {
            agreements: { type: Type.STRING, description: 'Summary of agreement' },
            disagreements: { type: Type.STRING, description: 'Summary of disagreement, divergence, or conflicting evidence' },
            thematicClusters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['themeName', 'description', 'linkedPapers'],
                properties: {
                  themeName: { type: Type.STRING },
                  description: { type: Type.STRING },
                  linkedPapers: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      }
    });

    const connectionsData = JSON.parse(response.text || '{}');
    res.json(connectionsData);
  } catch (error: any) {
    console.error('Error in /api/gemini/connect-literature:', error);
    res.status(500).json({ error: error.message || 'Failed to synthesize literature' });
  }
});

// 6. AI Assistant General Chat Route
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, history, customGuidance } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGeminiClient();
    
    // Construct contents matching GoogleGenAI format
    const formattedHistory = (history || []).map((h: any) => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text || '' }]
    }));
    
    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: message }] }
    ];

    const systemInstruction = `You are an exceptional, wise, encouraging, and academically rigorous PhD supervisor and scholarly research companion. 
Your goal is to guide the researcher on their academic journey with clarity, compassion, and structured thinking.
Maintain academic integrity. Always remain supportive, practical, calming, and non-shaming. 
${customGuidance ? `\nAdditional researcher directives:\n${customGuidance}` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    res.status(500).json({ error: error.message || 'Failed to chat with AI companion' });
  }
});


// ----------------- VITE MIDDLEWARE SETUP -----------------

async function startServer() {
  // Map .png calls to high fidelity vector SVG logos with proper Content-Type
  app.get('/assets/logo_transparent.png', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(path.join(process.cwd(), 'assets/logo_transparent.svg'));
  });

  app.get('/assets/logo_cream.png', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(path.join(process.cwd(), 'assets/logo_cream.svg'));
  });

  // Serve assets folder statically
  app.use('/assets', express.static(path.join(process.cwd(), 'assets')));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
