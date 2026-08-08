/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LocalAIProvider = 'gemini' | 'ollama' | 'lmstudio' | 'gpt4all' | 'anythingllm' | 'custom';

export interface LocalAIConfig {
  enabled: boolean;
  provider: LocalAIProvider;
  baseUrl: string;
  model: string;
  apiKey?: string;
  strictOffline: boolean;
  autoFallback: boolean;
  customSystemPromptSuffix?: string;
}

export interface LocalHealthResult {
  status: 'connected' | 'offline' | 'testing';
  latencyMs?: number;
  detectedModels: string[];
  error?: string;
  details?: string;
}

export interface OpenWeightModelPreset {
  id: string;
  name: string;
  family: 'gpt-oss' | 'llama' | 'mistral' | 'qwen' | 'deepseek' | 'gemma' | 'other';
  recommendedFor: string;
  defaultOllamaName: string;
}

export const OPEN_WEIGHT_MODELS: OpenWeightModelPreset[] = [
  {
    id: 'gpt-oss',
    name: 'gpt-oss (Open-Weight GPT Architecture)',
    family: 'gpt-oss',
    recommendedFor: 'General reasoning, structured methodology, writing, and literature synthesis',
    defaultOllamaName: 'gpt-oss:latest',
  },
  {
    id: 'llama-3.2',
    name: 'Meta Llama 3.2 / 3.3',
    family: 'llama',
    recommendedFor: 'Fast reasoning, structured JSON extraction, and research drafting',
    defaultOllamaName: 'llama3.2:latest',
  },
  {
    id: 'mistral-small',
    name: 'Mistral / Mixtral (Mistral AI)',
    family: 'mistral',
    recommendedFor: 'High-precision literature analysis, logic checking, and evidence evaluation',
    defaultOllamaName: 'mistral:latest',
  },
  {
    id: 'qwen-2.5',
    name: 'Qwen 2.5 / Qwen Coder (Alibaba Cloud)',
    family: 'qwen',
    recommendedFor: 'Complex data pattern analysis, multi-lingual literature, and code execution',
    defaultOllamaName: 'qwen2.5:latest',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1 / V3',
    family: 'deepseek',
    recommendedFor: 'Deep step-by-step reasoning, critical partner debate, and hypothesis testing',
    defaultOllamaName: 'deepseek-r1:latest',
  },
  {
    id: 'gemma-2',
    name: 'Google Gemma 2',
    family: 'gemma',
    recommendedFor: 'Compact on-device execution with strong safety and research clarity',
    defaultOllamaName: 'gemma2:latest',
  },
];

export const PROVIDER_PRESETS: Record<Exclude<LocalAIProvider, 'gemini'>, { name: string; defaultUrl: string; defaultModel: string; description: string }> = {
  ollama: {
    name: 'Ollama Local Runtime',
    defaultUrl: 'http://localhost:11434',
    defaultModel: 'llama3.2:latest',
    description: 'Popular open-source command line and daemon runner for local open-weight models.',
  },
  lmstudio: {
    name: 'LM Studio Desktop',
    defaultUrl: 'http://localhost:1234/v1',
    defaultModel: 'qwen2.5:latest',
    description: 'Local model management & testing GUI with OpenAI-compatible local HTTP server.',
  },
  gpt4all: {
    name: 'GPT4All Local App',
    defaultUrl: 'http://localhost:4891/v1',
    defaultModel: 'gpt4all-lora-quantized',
    description: 'Ecosystem for desktop offline LLM inference with zero data telemetry.',
  },
  anythingllm: {
    name: 'AnythingLLM Local RAG Pipeline',
    defaultUrl: 'http://localhost:3001/api/v1',
    defaultModel: 'default',
    description: 'Local knowledge-base management and local retrieval augmented generation (RAG) agent.',
  },
  custom: {
    name: 'Custom OpenAI-Compatible API Endpoint',
    defaultUrl: 'http://localhost:8000/v1',
    defaultModel: 'custom-model',
    description: 'Connect to vLLM, Text-Generation-WebUI, LocalAI, Ollama Docker, or custom GPU server.',
  },
};

const STORAGE_KEY = 'scholar_local_ai_config';

export const DEFAULT_LOCAL_AI_CONFIG: LocalAIConfig = {
  enabled: false,
  provider: 'gemini',
  baseUrl: 'http://localhost:11434',
  model: 'llama3.2:latest',
  strictOffline: false,
  autoFallback: true,
};

export function getLocalAIConfig(): LocalAIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LOCAL_AI_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_LOCAL_AI_CONFIG, ...parsed };
  } catch (err) {
    console.error('Failed to parse local AI config:', err);
    return DEFAULT_LOCAL_AI_CONFIG;
  }
}

export function saveLocalAIConfig(config: LocalAIConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('local_ai_config_updated', { detail: config }));
  } catch (err) {
    console.error('Failed to save local AI config:', err);
  }
}

/**
 * Test connectivity and detect loaded models from the local AI runtime.
 */
export async function testLocalAIConnection(config: LocalAIConfig): Promise<LocalHealthResult> {
  if (config.provider === 'gemini') {
    return {
      status: 'connected',
      detectedModels: ['gemini-3.5-flash (Google Cloud Server Proxy)'],
      details: 'Using secure server-side Gemini Cloud API.',
    };
  }

  const startTime = Date.now();
  try {
    const response = await fetch('/api/local-ai/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: config.provider,
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
      }),
    });

    const latencyMs = Date.now() - startTime;
    const data = await response.json();

    if (!response.ok || !data.ok) {
      return {
        status: 'offline',
        latencyMs,
        detectedModels: [],
        error: data.error || 'Failed to reach local endpoint.',
        details: data.details || 'Check if your local AI app (Ollama/LM Studio/GPT4All/AnythingLLM) is running on your machine.',
      };
    }

    return {
      status: 'connected',
      latencyMs,
      detectedModels: data.models || [],
      details: data.details || `Successfully connected to ${config.provider.toUpperCase()} at ${config.baseUrl}`,
    };
  } catch (err: any) {
    return {
      status: 'offline',
      latencyMs: Date.now() - startTime,
      detectedModels: [],
      error: err.message || 'Network error connecting to local health proxy.',
      details: 'Ensure CORS/HTTP listening is enabled on your local AI runtime.',
    };
  }
}

/**
 * Standard fetch helper that attaches the user's Local AI configuration to API calls.
 */
export async function postWithAiRouting(url: string, payload: any): Promise<Response> {
  const localConfig = getLocalAIConfig();
  const enrichedPayload = {
    ...payload,
    localAiConfig: localConfig.enabled ? localConfig : undefined,
  };

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Local-AI-Enabled': localConfig.enabled ? 'true' : 'false',
      'X-Local-AI-Provider': localConfig.provider,
    },
    body: JSON.stringify(enrichedPayload),
  });
}
