/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LocalAIConfig,
  LocalAIProvider,
  LocalHealthResult,
  OPEN_WEIGHT_MODELS,
  PROVIDER_PRESETS,
  PROVIDER_INSTRUCTIONS,
  getLocalAIConfig,
  saveLocalAIConfig,
  testLocalAIConnection,
} from '../lib/localAiService';
import { WEBL_MODELS, checkWebGPUSupport, WebLLMModelOption } from '../lib/webLlmService';

interface LocalAIRuntimeManagerProps {
  onConfigSaved?: (config: LocalAIConfig) => void;
  compact?: boolean;
}

type KnowledgeEffortTab = 'zero_setup' | 'desktop_apps' | 'advanced_cloud' | 'guidance_privacy';
type DeviceTierFilter = 'all' | 'mobile_light' | 'standard_laptop' | 'workstation_gpu';

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
  const [activeTab, setActiveTab] = useState<KnowledgeEffortTab>('zero_setup');
  const [deviceFilter, setDeviceFilter] = useState<DeviceTierFilter>('all');
  const [webGpuStatus, setWebGpuStatus] = useState<{ supported: boolean; adapterName?: string; reason?: string } | null>(null);

  // Progressive disclosure states for horizontal rows
  const [expandedHardwareGuide, setExpandedHardwareGuide] = useState<string | null>(null);
  const [expandedProviderGuide, setExpandedProviderGuide] = useState<string | null>(null);
  const [expandedModelDetails, setExpandedModelDetails] = useState<string | null>(null);

  // Guidance and prompt instructions state
  const [groundingLevel, setGroundingLevel] = useState<string>(() => localStorage.getItem('scholar_grounding_level') || 'strict');
  const [customPromptGuidance, setCustomPromptGuidance] = useState<string>(() => localStorage.getItem('scholar_custom_guidance') || '');

  useEffect(() => {
    checkWebGPUSupport().then(setWebGpuStatus);
  }, []);

  // Run health check on provider or url change
  useEffect(() => {
    if (config.provider !== 'webllm' && config.provider !== 'gemini') {
      runHealthCheck(config);
    }
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
    localStorage.setItem('scholar_grounding_level', groundingLevel);
    localStorage.setItem('scholar_custom_guidance', customPromptGuidance);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    if (onConfigSaved) onConfigSaved(config);
  };

  // Device-categorized WebGPU models
  const getWebGpuDeviceCategory = (model: WebLLMModelOption): 'mobile_light' | 'standard_laptop' | 'workstation_gpu' => {
    if (model.id.includes('1.7B') || model.id.includes('2B') || model.id.includes('3B')) {
      return 'mobile_light';
    }
    return 'standard_laptop';
  };

  // Device-categorized Open Weight models
  const getOpenWeightDeviceCategory = (id: string): 'mobile_light' | 'standard_laptop' | 'workstation_gpu' => {
    if (id.includes('llama-3.2') || id.includes('gemma-2')) return 'mobile_light';
    if (id.includes('gpt-oss-20b') || id.includes('deepseek-r1')) return 'workstation_gpu';
    return 'standard_laptop';
  };

  const getDeviceLabel = (category: 'mobile_light' | 'standard_laptop' | 'workstation_gpu'): string => {
    switch (category) {
      case 'mobile_light':
        return 'Mobile & Light Laptops (2 to 4 GB RAM)';
      case 'standard_laptop':
        return 'Standard Laptops & Desktops (8 GB RAM)';
      case 'workstation_gpu':
        return 'Workstations & GPUs (16+ GB RAM)';
    }
  };

  const selectedMeta = PROVIDER_INSTRUCTIONS[config.provider] || PROVIDER_INSTRUCTIONS.webllm;

  return (
    <div className="w-full space-y-6 font-sans text-left" id="local-ai-runtime-manager">
      
      {/* SECTION HEADER: UNBOXED DIRECTLY TO BACKGROUND */}
      <div className="space-y-1 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-sans font-semibold text-stone-950 dark:text-stone-100 text-sm tracking-tight">
            AI Runtime & Privacy Settings
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Local Execution Architecture
          </span>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-3xl leading-relaxed">
          Configure model execution, hardware compatibility, and privacy boundaries. All research notes, literature citations, and synthesis drafts remain strictly on your local machine.
        </p>
      </div>

      {/* HORIZONTAL ROW: CURRENT ACTIVE RUNTIME STATUS & ACTION */}
      <div className="py-3 border-b border-stone-200 dark:border-stone-800 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="text-stone-500 dark:text-stone-400">Active engine:</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              {config.provider === 'webllm'
                ? 'In-Browser WebGPU'
                : config.provider === 'gemini'
                ? 'Gemini Cloud Proxy'
                : PROVIDER_PRESETS[config.provider]?.name || config.provider}
            </span>
            <span className="text-stone-300 dark:text-stone-700">|</span>
            <span className="text-stone-500 dark:text-stone-400">Selected model:</span>
            <span className="font-mono text-[11px] font-medium text-[#912A4A] dark:text-rose-400">
              {config.model}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {config.provider === 'webllm' ? (
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                webGpuStatus?.supported
                  ? 'bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700'
                  : 'bg-stone-100 dark:bg-stone-900 text-stone-500 border-stone-200 dark:border-stone-700'
              }`}>
                {webGpuStatus?.supported ? `WebGPU: ${webGpuStatus.adapterName || 'Ready'}` : 'WebGPU Unavailable'}
              </span>
            ) : config.provider !== 'gemini' ? (
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                  health.status === 'connected'
                    ? 'bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700 font-medium'
                    : health.status === 'testing'
                    ? 'bg-stone-100 dark:bg-stone-900 text-stone-500 border-stone-200 dark:border-stone-800'
                    : 'bg-stone-100 dark:bg-stone-900 text-stone-500 border-stone-200 dark:border-stone-800'
                }`}>
                  {isTesting ? 'Testing connection...' : health.status === 'connected' ? `Connected (${health.latencyMs}ms)` : 'Server offline'}
                </span>
                <button
                  type="button"
                  onClick={() => runHealthCheck(config)}
                  className="text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 underline cursor-pointer"
                >
                  Test connection
                </button>
              </div>
            ) : (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800">
                Cloud Managed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* HORIZONTAL NAVIGATION: ORGANISED BY KNOWLEDGE & EFFORT LEVEL */}
      <div className="space-y-1">
        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 dark:text-stone-500 block">
          Knowledge & Effort Level
        </span>
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 dark:border-stone-850 pb-2">
          {[
            { id: 'zero_setup', label: '1. Beginner — Zero Setup', level: 'Beginner', effort: 'Zero Setup · Instant (WebGPU)' },
            { id: 'desktop_apps', label: '2. Intermediate or A Little Confident — Basic Setup', level: 'Intermediate', effort: 'Basic Setup (Ollama / LM Studio)' },
            { id: 'advanced_cloud', label: '3. Advanced or Very Confident — Cloud Setup', level: 'Advanced', effort: 'Cloud & Custom Server' },
            { id: 'guidance_privacy', label: '4. Guidance & Privacy', level: 'General', effort: 'Policy Rules' },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as KnowledgeEffortTab)}
                className={`py-1.5 px-3 rounded text-xs transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[#912A4A] text-white font-medium shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <div className="font-semibold leading-tight">{tab.label}</div>
                <div className={`text-[10px] ${isSelected ? 'text-rose-100' : 'text-stone-400 dark:text-stone-500'}`}>
                  {tab.level} · {tab.effort}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* PROGRESSIVE DISCLOSURE: HARDWARE & DEVICE COMPATIBILITY GUIDE */}
      <div className="py-2 border-b border-stone-200 dark:border-stone-800 space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExpandedHardwareGuide(expandedHardwareGuide ? null : 'guide')}
            className="text-xs font-semibold text-stone-800 dark:text-stone-200 hover:text-[#912A4A] dark:hover:text-rose-400 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>Device Hardware & Memory Guide</span>
            <span className="text-[10px] font-mono text-stone-400">
              {expandedHardwareGuide ? '[Hide details]' : '[Show details]'}
            </span>
          </button>
          <span className="text-[11px] text-stone-500">
            Categorized by memory footprint
          </span>
        </div>

        {expandedHardwareGuide && (
          <div className="space-y-3 pt-2 text-xs animate-fadeIn">
            {/* Row 1: Mobile & Light */}
            <div className="py-2 border-b border-stone-150 dark:border-stone-850 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="space-y-0.5 sm:max-w-xs">
                <span className="font-semibold text-stone-900 dark:text-stone-100 block">
                  Mobile & Portable Laptops
                </span>
                <span className="font-mono text-[10px] text-stone-500 block">
                  Memory requirement: 2 to 4 GB RAM
                </span>
              </div>
              <div className="flex-1 space-y-1 text-stone-600 dark:text-stone-400">
                <p>Recommended: Qwen 2.5 (3B), Llama 3.2 (3B), SmolLM2 (1.7B).</p>
                <p className="text-[11px] text-stone-500">Runs directly in browser WebGPU memory with zero installation and fast latency.</p>
              </div>
            </div>

            {/* Row 2: Standard Laptops */}
            <div className="py-2 border-b border-stone-150 dark:border-stone-850 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="space-y-0.5 sm:max-w-xs">
                <span className="font-semibold text-stone-900 dark:text-stone-100 block">
                  Standard Laptops & Desktops
                </span>
                <span className="font-mono text-[10px] text-stone-500 block">
                  Memory requirement: 8 GB RAM
                </span>
              </div>
              <div className="flex-1 space-y-1 text-stone-600 dark:text-stone-400">
                <p>Recommended: Qwen 2.5 (7B), Qwen 3 (8B), Llama 3.1 (8B), Mistral (7B).</p>
                <p className="text-[11px] text-stone-500">Optimal balance between deep scholarly nuance, multi-paper thematic clustering, and reasoning speed.</p>
              </div>
            </div>

            {/* Row 3: Workstations */}
            <div className="py-2 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="space-y-0.5 sm:max-w-xs">
                <span className="font-semibold text-stone-900 dark:text-stone-100 block">
                  Workstations & Dedicated GPUs
                </span>
                <span className="font-mono text-[10px] text-stone-500 block">
                  Memory requirement: 16+ GB RAM / Dedicated VRAM
                </span>
              </div>
              <div className="flex-1 space-y-1 text-stone-600 dark:text-stone-400">
                <p>Recommended: gpt-oss (20B), DeepSeek R1 (14B / 32B), Qwen 2.5 (14B / 32B).</p>
                <p className="text-[11px] text-stone-500">Deep academic synthesis, complex methodological logic evaluation, and extended multi-step debate.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: ZERO SETUP (IN-BROWSER WEBGPU) */}
      {activeTab === 'zero_setup' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header & Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200 dark:border-stone-800">
            <div>
              <h4 className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                1. Beginner — Zero Setup (In-Browser WebGPU)
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Zero setup required. No terminal commands, installs, or background servers. Weights download once and run locally in your browser.
              </p>
            </div>

            {/* Device Type Sub-Filter */}
            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-stone-400 mr-1">Filter by device:</span>
              {[
                { id: 'all', label: 'All Devices' },
                { id: 'mobile_light', label: 'Mobile & Light (2-4GB)' },
                { id: 'standard_laptop', label: 'Standard (8GB+)' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setDeviceFilter(f.id as DeviceTierFilter)}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    deviceFilter === f.id
                      ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 font-medium'
                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Horizontal Rows of WebGPU Models */}
          <div className="divide-y divide-stone-200 dark:divide-stone-850">
            {WEBL_MODELS
              .filter((m) => deviceFilter === 'all' || getWebGpuDeviceCategory(m) === deviceFilter)
              .map((m) => {
                const isSelected = config.provider === 'webllm' && config.model === m.id;
                const isExpanded = expandedModelDetails === m.id;
                const deviceCat = getWebGpuDeviceCategory(m);

                return (
                  <div
                    key={m.id}
                    className={`py-3 transition-colors ${
                      isSelected ? 'bg-stone-50/70 dark:bg-stone-900/30 pl-2 -ml-2 pr-2 rounded' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                            {m.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                            {m.size}
                          </span>
                          <span className="text-[10px] font-mono text-stone-500">
                            {m.memoryReq}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-150 dark:bg-stone-850 text-stone-600 dark:text-stone-400">
                            {getDeviceLabel(deviceCat).split('(')[0].trim()}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                          {m.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpandedModelDetails(isExpanded ? null : m.id)}
                          className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                        >
                          {isExpanded ? 'Hide specs' : 'View specs'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleProviderSelect('webllm');
                            handleModelSelect(m.id);
                          }}
                          className={`px-3 py-1 text-xs rounded transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#912A4A] text-white font-semibold shadow-xs'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                          }`}
                        >
                          {isSelected ? 'Active Model' : 'Select'}
                        </button>
                      </div>
                    </div>

                    {/* Progressive Disclosure: Technical Specs */}
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-stone-150 dark:border-stone-850 text-[11px] text-stone-500 space-y-1 animate-fadeIn">
                        <div className="flex flex-wrap gap-4">
                          <span><strong>Recommended use:</strong> {m.recommendedFor}</span>
                          <span><strong>Execution Sandbox:</strong> WebGPU Tensor Core</span>
                          <span><strong>Offline Persistence:</strong> IndexedDB Cache</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 2: DESKTOP APPLICATIONS (OLLAMA, LM STUDIO, GPT4ALL, ANYTHINGLLM) */}
      {activeTab === 'desktop_apps' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Subheader */}
          <div className="pb-2 border-b border-stone-200 dark:border-stone-800">
            <h4 className="font-semibold text-xs text-stone-900 dark:text-stone-100">
              2. Intermediate or A Little Confident — Basic Setup (Desktop Applications)
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Basic 1-click setup. Connect to open-source desktop apps (Ollama, LM Studio, GPT4All, AnythingLLM) running on your local machine with zero external telemetry.
            </p>
          </div>

          {/* Provider Selection in Horizontal Rows */}
          <div className="divide-y divide-stone-200 dark:divide-stone-850">
            {(['ollama', 'lmstudio', 'gpt4all', 'anythingllm'] as LocalAIProvider[]).map((provKey) => {
              const preset = PROVIDER_PRESETS[provKey as Exclude<LocalAIProvider, 'gemini'>];
              const meta = PROVIDER_INSTRUCTIONS[provKey];
              const isSelected = config.provider === provKey;
              const isExpanded = expandedProviderGuide === provKey;

              return (
                <div
                  key={provKey}
                  className={`py-3 transition-colors ${
                    isSelected ? 'bg-stone-50/70 dark:bg-stone-900/30 pl-2 -ml-2 pr-2 rounded' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                          {preset.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {meta.effortLevel}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          Knowledge: {meta.knowledgeLevel.split('(')[0].trim()}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedProviderGuide(isExpanded ? null : provKey)}
                        className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                      >
                        {isExpanded ? 'Hide guide' : 'Setup guide'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleProviderSelect(provKey)}
                        className={`px-3 py-1 text-xs rounded transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#912A4A] text-white font-semibold shadow-xs'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                        }`}
                      >
                        {isSelected ? 'Active Provider' : 'Select'}
                      </button>
                    </div>
                  </div>

                  {/* Progressive Disclosure: Setup Steps */}
                  {isExpanded && (
                    <div className="mt-2.5 pt-2.5 border-t border-stone-150 dark:border-stone-850 space-y-2 text-xs text-stone-600 dark:text-stone-300 animate-fadeIn">
                      <span className="font-semibold text-[11px] text-stone-900 dark:text-stone-100 block">
                        Step-by-Step Installation:
                      </span>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        {meta.installationSteps.map((step, idx) => (
                          <li key={idx} className="leading-relaxed">{step}</li>
                        ))}
                      </ol>
                      <div className="pt-1 text-[11px] text-stone-500 flex flex-wrap gap-4">
                        <span><strong>Prerequisite:</strong> {meta.prerequisites.join(', ')}</span>
                        <span><strong>Privacy:</strong> {meta.offlineSecurity}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Connection Endpoint Configuration (Horizontal Rows) */}
          {config.provider !== 'gemini' && config.provider !== 'webllm' && (
            <div className="pt-3 space-y-3 border-t border-stone-200 dark:border-stone-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 dark:text-stone-500 block">
                Connection Parameters
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                    Server URL
                  </label>
                  <input
                    type="text"
                    value={config.baseUrl}
                    onChange={(e) => setConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="e.g. http://localhost:11434"
                    className="w-full font-mono text-xs p-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:border-[#912A4A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                    API Key (Optional)
                  </label>
                  <input
                    type="password"
                    value={config.apiKey || ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Leave blank if not required"
                    className="w-full font-mono text-xs p-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:border-[#912A4A]"
                  />
                </div>
              </div>

              {/* Detected local models row */}
              {health.detectedModels.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  <span className="text-xs text-stone-600 dark:text-stone-400 block">
                    Auto-detected models on your local machine ({health.detectedModels.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {health.detectedModels.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleModelSelect(m)}
                        className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          config.model === m
                            ? 'bg-[#912A4A] text-white border-[#912A4A] font-semibold'
                            : 'bg-stone-100 dark:bg-stone-850 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Open Weight Models Catalog Organized by Device Tier */}
              <div className="pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    Open-Weight Model Library Presets
                  </span>
                  <span className="text-[11px] text-stone-500">Organized by device requirement</span>
                </div>

                <div className="divide-y divide-stone-200 dark:divide-stone-850">
                  {OPEN_WEIGHT_MODELS.map((m) => {
                    const isSelected = config.model === m.defaultOllamaName;
                    const deviceCat = getOpenWeightDeviceCategory(m.id);

                    return (
                      <div
                        key={m.id}
                        className={`py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          isSelected ? 'bg-stone-50/70 dark:bg-stone-900/30 pl-2 -ml-2 pr-2 rounded' : ''
                        }`}
                      >
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                              {m.name}
                            </span>
                            <span className="text-[10px] font-mono text-stone-500">
                              {m.defaultOllamaName}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-150 dark:bg-stone-850 text-stone-600 dark:text-stone-400">
                              {getDeviceLabel(deviceCat).split('(')[0].trim()}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            {m.recommendedFor}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleModelSelect(m.defaultOllamaName)}
                          className={`px-3 py-1 text-xs rounded transition-all cursor-pointer shrink-0 ${
                            isSelected
                              ? 'bg-[#912A4A] text-white font-semibold shadow-xs'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                          }`}
                        >
                          {isSelected ? 'Active' : 'Apply'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 space-y-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                    Custom Model Name / Tag
                  </label>
                  <input
                    type="text"
                    value={config.model}
                    onChange={(e) => setConfig((prev) => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g. llama3.2, qwen2.5, mistral"
                    className="w-full font-mono text-xs p-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:border-[#912A4A]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADVANCED & CLOUD (CUSTOM SERVER & GEMINI CLOUD PROXY) */}
      {activeTab === 'advanced_cloud' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="pb-2 border-b border-stone-200 dark:border-stone-800">
            <h4 className="font-semibold text-xs text-stone-900 dark:text-stone-100">
              3. Advanced or Very Confident — Cloud & Custom Server Setup
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Connect to custom private inference servers (vLLM, LocalAI, Text-Gen, private cluster endpoints) or Google Gemini Cloud API.
            </p>
          </div>

          <div className="divide-y divide-stone-200 dark:divide-stone-850">
            {/* Custom OpenAI-compatible Server Row */}
            <div className={`py-3 ${config.provider === 'custom' ? 'bg-stone-50/70 dark:bg-stone-900/30 pl-2 -ml-2 pr-2 rounded' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                      Custom OpenAI-Compatible Server
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      Moderate Effort · Technical
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Connect to vLLM, Text-Generation-WebUI, LocalAI, or custom private Kubernetes GPU clusters supporting the /v1/chat/completions endpoint.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleProviderSelect('custom')}
                  className={`px-3 py-1 text-xs rounded transition-all cursor-pointer shrink-0 ${
                    config.provider === 'custom'
                      ? 'bg-[#912A4A] text-white font-semibold shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {config.provider === 'custom' ? 'Active' : 'Configure'}
                </button>
              </div>

              {config.provider === 'custom' && (
                <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">Base URL</label>
                    <input
                      type="text"
                      value={config.baseUrl}
                      onChange={(e) => setConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
                      placeholder="e.g. http://localhost:8000/v1"
                      className="w-full font-mono text-xs p-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:border-[#912A4A]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">Model Tag</label>
                    <input
                      type="text"
                      value={config.model}
                      onChange={(e) => setConfig((prev) => ({ ...prev, model: e.target.value }))}
                      placeholder="e.g. meta-llama/Llama-3.3-70B-Instruct"
                      className="w-full font-mono text-xs p-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:border-[#912A4A]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Google Gemini Cloud Server Proxy Row */}
            <div className={`py-3 ${config.provider === 'gemini' ? 'bg-stone-50/70 dark:bg-stone-900/30 pl-2 -ml-2 pr-2 rounded' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                      Google Gemini Cloud Server Proxy
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      Zero Setup · Managed Cloud
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Direct server-proxied intelligence with deep multi-document context and high-speed scholarly synthesis.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleProviderSelect('gemini')}
                  className={`px-3 py-1 text-xs rounded transition-all cursor-pointer shrink-0 ${
                    config.provider === 'gemini'
                      ? 'bg-[#912A4A] text-white font-semibold shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {config.provider === 'gemini' ? 'Active' : 'Select'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GUIDANCE, PROMPT INSTRUCTIONS & AIR-GAP PRIVACY CONTROLS */}
      {activeTab === 'guidance_privacy' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="pb-2 border-b border-stone-200 dark:border-stone-800">
            <h4 className="font-semibold text-xs text-stone-900 dark:text-stone-100">
              Scholarly Guidance & Privacy Boundaries
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Customize reasoning tone, information source boundaries, and air-gap network isolation rules.
            </p>
          </div>

          <div className="space-y-4 divide-y divide-stone-200 dark:divide-stone-850">
            {/* Information Sources Horizontal Row */}
            <div className="pt-2 space-y-2">
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">
                Information Sources & Grounding Boundary
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setGroundingLevel('strict')}
                  className={`flex-1 py-2 px-3 rounded text-left border transition-all cursor-pointer ${
                    groundingLevel === 'strict'
                      ? 'border-[#912A4A] bg-[#912A4A]/5 text-[#912A4A] dark:text-rose-400 font-semibold'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900'
                  }`}
                >
                  <div className="text-xs font-semibold">Strict (Only my library)</div>
                  <div className="text-[11px] text-stone-500 font-normal mt-0.5">
                    Restrict citations and claims strictly to papers in your personal library.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setGroundingLevel('balanced')}
                  className={`flex-1 py-2 px-3 rounded text-left border transition-all cursor-pointer ${
                    groundingLevel === 'balanced'
                      ? 'border-[#912A4A] bg-[#912A4A]/5 text-[#912A4A] dark:text-rose-400 font-semibold'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900'
                  }`}
                >
                  <div className="text-xs font-semibold">Balanced (Include broader literature)</div>
                  <div className="text-[11px] text-stone-500 font-normal mt-0.5">
                    Blend library evidence with general scholarly knowledge and background context.
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Prompt Instructions Horizontal Row */}
            <div className="pt-3 space-y-1.5">
              <label htmlFor="custom-ai-guidance" className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">
                Custom Research Companion Instructions
              </label>
              <textarea
                id="custom-ai-guidance"
                value={customPromptGuidance}
                onChange={(e) => setCustomPromptGuidance(e.target.value)}
                placeholder="Specify writing voice, critique strictness, methodology preferences, or domain constraints..."
                rows={3}
                className="w-full font-sans text-xs p-2.5 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 rounded focus:outline-none focus:border-[#912A4A] leading-relaxed"
              />
            </div>

            {/* Privacy & Air-Gap Network Toggles */}
            <div className="pt-3 space-y-2">
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">
                Air-Gap Isolation & Fallback Safeguards
              </span>

              <div className="divide-y divide-stone-150 dark:divide-stone-850">
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium text-stone-900 dark:text-stone-100 block">
                      Strict Offline Isolation (Air-Gapped Mode)
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      Block all outbound internet network traffic. AI requests fail gracefully if local runtime is unreachable.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.strictOffline}
                    onChange={(e) => setConfig((prev) => ({ ...prev, strictOffline: e.target.checked }))}
                    className="w-4 h-4 accent-[#912A4A] rounded cursor-pointer"
                  />
                </div>

                <div className="py-2.5 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium text-stone-900 dark:text-stone-100 block">
                      Auto-Fallback to Managed Cloud AI
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      Temporarily route requests through server proxy if local GPU or daemon memory is occupied.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoFallback}
                    onChange={(e) => setConfig((prev) => ({ ...prev, autoFallback: e.target.checked }))}
                    className="w-4 h-4 accent-[#912A4A] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HORIZONTAL ACTION ROW: SAVE AND STATUS FEEDBACK */}
      <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="font-sans text-xs bg-[#912A4A] hover:bg-[#78223d] text-white font-semibold px-5 py-2 rounded transition-all cursor-pointer shadow-xs"
          >
            Apply & Save AI Configuration
          </button>

          {saveSuccess && (
            <span className="text-xs font-medium text-stone-700 dark:text-stone-300 animate-fadeIn">
              AI configuration saved.
            </span>
          )}
        </div>

        <span className="text-[11px] text-stone-400 font-mono">
          Changes take effect immediately across all workspaces.
        </span>
      </div>

    </div>
  );
}
