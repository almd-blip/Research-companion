/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Zap,
  Sliders,
  Terminal,
  Database,
  HelpCircle,
  Globe,
  Lock,
} from 'lucide-react';
import {
  LocalAIConfig,
  LocalAIProvider,
  LocalHealthResult,
  OPEN_WEIGHT_MODELS,
  PROVIDER_PRESETS,
  getLocalAIConfig,
  saveLocalAIConfig,
  testLocalAIConnection,
} from '../lib/localAiService';

interface LocalAIRuntimeManagerProps {
  onConfigSaved?: (config: LocalAIConfig) => void;
  compact?: boolean;
}

export default function LocalAIRuntimeManager({
  onConfigSaved,
  compact = false,
}: LocalAIRuntimeManagerProps) {
  const [config, setConfig] = useState<LocalAIConfig>(getLocalAIConfig);
  const [health, setHealth] = useState<LocalHealthResult>({
    status: 'testing',
    detectedModels: [],
  });
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auto-run health check on load or provider change
  useEffect(() => {
    runHealthCheck(config);
  }, [config.provider, config.baseUrl]);

  const runHealthCheck = async (cfgToTest: LocalAIConfig) => {
    setIsTesting(true);
    const res = await testLocalAIConnection(cfgToTest);
    setHealth(res);
    setIsTesting(false);
  };

  const handleProviderSelect = (provider: LocalAIProvider) => {
    let newUrl = config.baseUrl;
    let newModel = config.model;

    if (provider !== 'gemini' && PROVIDER_PRESETS[provider]) {
      newUrl = PROVIDER_PRESETS[provider].defaultUrl;
      newModel = PROVIDER_PRESETS[provider].defaultModel;
    }

    const updated: LocalAIConfig = {
      ...config,
      provider,
      enabled: provider !== 'gemini',
      baseUrl: newUrl,
      model: newModel,
    };
    setConfig(updated);
  };

  const handleModelSelect = (modelName: string) => {
    setConfig((prev) => ({ ...prev, model: modelName }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveLocalAIConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    if (onConfigSaved) onConfigSaved(config);
  };

  return (
    <div className="space-y-5 font-sans text-left" id="local-ai-runtime-manager">
      {/* Infrastructure Mode Banner */}
      <div className="bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-900/10 dark:bg-stone-800 text-amber-900 dark:text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-xs flex items-center gap-2">
                <span>AI Infrastructure & Local Runtime Layer</span>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded font-mono font-bold uppercase">
                  Replaceable Engine
                </span>
              </h3>
              <p className="text-[11px] text-stone-500 leading-snug mt-0.5">
                Run open-weight models locally via Ollama, LM Studio, GPT4All, or AnythingLLM RAG without relying on cloud APIs.
              </p>
            </div>
          </div>

          {/* Quick Mode Toggle */}
          <div className="flex items-center bg-white dark:bg-stone-950 p-1 rounded-lg border border-stone-200 dark:border-stone-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => handleProviderSelect('gemini')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                config.provider === 'gemini'
                  ? 'bg-amber-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Gemini Cloud
            </button>
            <button
              type="button"
              onClick={() => handleProviderSelect('ollama')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                config.provider !== 'gemini'
                  ? 'bg-amber-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Offline Local Runtime
            </button>
          </div>
        </div>

        {/* Core Independent Value Layer Guarantee */}
        <div className="p-3 bg-amber-50/40 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 rounded-md text-[11px] text-stone-700 dark:text-stone-300 leading-relaxed space-y-1">
          <strong className="text-amber-950 dark:text-amber-300 font-semibold block">
            Independent Second Thought Architecture:
          </strong>
          The Research Companion treats local AI runtimes as <em>replaceable infrastructure</em>. The core Second Thought value layer — including <strong>methodology support, evidence mapping, pattern identification, critical thinking prompts, privacy architecture, and user-controlled knowledge management</strong> — remains 100% active regardless of which model or provider powers it.
        </div>
      </div>

      {/* Local AI Provider Configuration */}
      {config.provider !== 'gemini' && (
        <form onSubmit={handleSave} className="space-y-5 animate-fadeIn">
          {/* Provider Selection Cards */}
          <div className="space-y-2">
            <label className="font-sans text-[11px] text-stone-700 dark:text-stone-300 font-bold block">
              Select Local AI Runtime Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(Object.keys(PROVIDER_PRESETS) as Array<keyof typeof PROVIDER_PRESETS>).map((provKey) => {
                const preset = PROVIDER_PRESETS[provKey];
                const isSelected = config.provider === provKey;

                return (
                  <button
                    key={provKey}
                    type="button"
                    onClick={() => handleProviderSelect(provKey)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between h-full space-y-2 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isSelected
                        ? 'bg-amber-900/10 dark:bg-amber-950/40 border-amber-900 dark:border-amber-500 shadow-xs'
                        : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-950 dark:text-amber-300' : 'text-stone-800 dark:text-stone-200'}`}>
                          {preset.name}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-800 dark:text-amber-400 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 leading-snug">
                        {preset.description}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-stone-150 dark:border-stone-850 flex items-center justify-between text-[10px] font-mono text-stone-400">
                      <span>Default Port:</span>
                      <span className="text-stone-600 dark:text-stone-300">{preset.defaultUrl}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Endpoint Connection Settings & Health Badge */}
          <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-4 space-y-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-150 dark:border-stone-850 pb-2.5">
              <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-[#912A4A] dark:text-rose-400" /> Endpoint Connection & Ping
              </h4>

              {/* Live Status Badge */}
              <div className="flex items-center gap-2">
                {isTesting ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                    <RefreshCw className="w-3 h-3 animate-spin text-[#912A4A]" /> Pinging local server...
                  </span>
                ) : health.status === 'connected' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Connected ({health.latencyMs}ms)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 font-bold border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-3 h-3 text-red-600" /> Local Endpoint Offline
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => runHealthCheck(config)}
                  className="px-2.5 py-1 text-[11px] font-sans font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded border border-stone-200 dark:border-stone-800 transition-colors cursor-pointer"
                >
                  Ping Again
                </button>
              </div>
            </div>

            {/* Inputs: Base URL & API Key */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-sans text-[10px] text-stone-600 dark:text-stone-400 font-bold block">
                  Local Runtime Base URL
                </label>
                <input
                  type="text"
                  value={config.baseUrl}
                  onChange={(e) => setConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="e.g. http://localhost:11434"
                  className="w-full font-mono text-xs p-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:ring-2 focus:ring-[#912A4A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-sans text-[10px] text-stone-600 dark:text-stone-400 font-bold block">
                  Local API Key (Optional)
                </label>
                <input
                  type="password"
                  value={config.apiKey || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Leave empty for standard Ollama / LM Studio"
                  className="w-full font-mono text-xs p-2 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:ring-2 focus:ring-[#912A4A]"
                />
              </div>
            </div>

            {/* Diagnostic Message */}
            {health.details && (
              <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-900/50 p-2.5 rounded border border-stone-150 dark:border-stone-850">
                {health.details}
              </p>
            )}

            {/* Detected Local Models List */}
            {health.detectedModels.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-stone-150 dark:border-stone-850">
                <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 block">
                  Detected Models Loaded on Local Runtime ({health.detectedModels.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {health.detectedModels.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleModelSelect(m)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        config.model === m
                          ? 'bg-[#912A4A] text-white border-[#912A4A] font-bold'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Open-Weight Models Catalog */}
          <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-4 space-y-3 shadow-2xs">
            <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5 border-b border-stone-150 dark:border-stone-850 pb-2">
              <Zap className="w-4 h-4 text-[#912A4A] dark:text-rose-400" /> Open-Weight Model Profiles
            </h4>

            <p className="text-[11px] text-stone-500 leading-snug">
              Select or type the target open-weight model tag running on your local engine:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OPEN_WEIGHT_MODELS.map((m) => {
                const isSelected = config.model === m.defaultOllamaName;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleModelSelect(m.defaultOllamaName)}
                    className={`p-2.5 rounded border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-900/10 dark:bg-amber-950/40 border-amber-900 dark:border-amber-500'
                        : 'bg-stone-50/50 dark:bg-stone-900/30 border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-xs font-semibold text-stone-800 dark:text-stone-200">
                        {m.name}
                      </span>
                      <span className="font-mono text-[9px] bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-300">
                        {m.defaultOllamaName}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 mt-1">{m.recommendedFor}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 space-y-1">
              <label className="font-sans text-[10px] text-stone-600 dark:text-stone-400 font-bold block">
                Active Model Identifier String
              </label>
              <input
                type="text"
                value={config.model}
                onChange={(e) => setConfig((prev) => ({ ...prev, model: e.target.value }))}
                placeholder="e.g. gpt-oss:latest, llama3.2:latest, qwen2.5-coder:14b"
                className="w-full font-mono text-xs p-2 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Privacy & Governance Toggles */}
          <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-4 space-y-3 text-xs shadow-2xs">
            <h4 className="font-sans font-semibold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5 border-b border-stone-150 dark:border-stone-850 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Local Privacy & Fallback Policy
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-stone-900/40 rounded border border-stone-200 dark:border-stone-800">
                <div>
                  <span className="font-semibold text-stone-800 dark:text-stone-200 block text-xs">
                    Strict Offline Mode
                  </span>
                  <span className="text-[10px] text-stone-500 block">
                    Never issue cloud API calls if local runtime is unreachable. Block all outgoing requests.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.strictOffline}
                  onChange={(e) => setConfig((prev) => ({ ...prev, strictOffline: e.target.checked }))}
                  className="w-4 h-4 accent-amber-900 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-stone-900/40 rounded border border-stone-200 dark:border-stone-800">
                <div>
                  <span className="font-semibold text-stone-800 dark:text-stone-200 block text-xs">
                    Auto-Fallback to Cloud Gemini
                  </span>
                  <span className="text-[10px] text-stone-500 block">
                    If your local machine runs out of VRAM or local daemon crashes, temporarily fall back to Gemini.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoFallback}
                  onChange={(e) => setConfig((prev) => ({ ...prev, autoFallback: e.target.checked }))}
                  className="w-4 h-4 accent-amber-900 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Save Configuration Button */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="font-sans text-xs bg-amber-900 hover:bg-amber-800 text-white font-medium px-5 py-2.5 rounded transition-colors cursor-pointer shadow-xs"
            >
              Save Local AI Infrastructure Configuration
            </button>

            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Configuration stored to local offline cache.
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
