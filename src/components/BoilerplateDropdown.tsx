/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  ChevronDown,
  Search,
  Check,
  Copy,
  Eye,
  Plus,
  Replace,
  Sparkles,
  Layers,
  Cpu,
  Building2,
  Database,
  ShieldCheck,
  Users,
  Globe,
  X
} from 'lucide-react';
import { INSTITUTIONAL_BOILERPLATES, InstitutionalBoilerplate } from '../data/institutionalBoilerplates';

interface BoilerplateDropdownProps {
  onInjectTemplate: (content: string, templateTitle: string, mode: 'append' | 'replace') => void;
  currentDraftText: string;
}

export default function BoilerplateDropdown({
  onInjectTemplate,
  currentDraftText,
}: BoilerplateDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Preview modal state
  const [previewTemplate, setPreviewTemplate] = useState<InstitutionalBoilerplate | null>(null);
  const [previewCustomText, setPreviewCustomText] = useState<string>('');
  const [institutionPlaceholder, setInstitutionPlaceholder] = useState('');
  const [piPlaceholder, setPiPlaceholder] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const categories = ['All', 'Facilities & Environment', 'Data Management (DMP)', 'Ethics & Governance', 'DEIA & Mentorship', 'Impact & Dissemination', 'Project Administration'];

  const filteredTemplates = INSTITUTIONAL_BOILERPLATES.filter((tpl) => {
    const matchesCategory = selectedCategory === 'All' || tpl.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      tpl.title.toLowerCase().includes(query) ||
      tpl.summary.toLowerCase().includes(query) ||
      tpl.category.toLowerCase().includes(query) ||
      tpl.tags.some((t) => t.toLowerCase().includes(query)) ||
      tpl.content.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Facilities & Environment':
        return <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />;
      case 'Data Management (DMP)':
        return <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'Ethics & Governance':
        return <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'DEIA & Mentorship':
        return <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />;
      case 'Impact & Dissemination':
        return <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />;
    }
  };

  const handleCopy = (e: React.MouseEvent, tpl: InstitutionalBoilerplate) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tpl.content);
    setCopiedId(tpl.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenPreview = (e: React.MouseEvent, tpl: InstitutionalBoilerplate) => {
    e.stopPropagation();
    setPreviewTemplate(tpl);
    setPreviewCustomText(tpl.content);
    setInstitutionPlaceholder('');
    setPiPlaceholder('');
    setIsOpen(false);
  };

  const applyPlaceholders = () => {
    if (!previewTemplate) return;
    let text = previewTemplate.content;
    if (institutionPlaceholder.trim()) {
      text = text.replace(/\[Institution Name\]/g, institutionPlaceholder.trim());
    }
    if (piPlaceholder.trim()) {
      text = text.replace(/\[Principal Investigator\]|\[PI Name\]/g, piPlaceholder.trim());
    }
    setPreviewCustomText(text);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Load Template Trigger Button */}
      <button
        type="button"
        id="load-template-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium font-sans transition-all cursor-pointer shadow-xs border ${
          isOpen
            ? 'bg-[#912A4A] text-white border-[#912A4A]'
            : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700 hover:border-[#912A4A] hover:text-[#912A4A] dark:hover:border-rose-400 dark:hover:text-rose-300'
        }`}
        title="Load standard institutional boilerplate text into proposal response"
      >
        <FileText className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
        <span>Load Template</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-0 mt-1.5 w-[330px] sm:w-[420px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl z-50 overflow-hidden animate-fadeIn text-left">
          
          {/* Header & Search */}
          <div className="p-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#912A4A] dark:text-rose-400" />
                <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                  Institutional Boilerplate Library
                </span>
              </div>
              <span className="text-[10px] text-stone-500 font-mono">
                {INSTITUTIONAL_BOILERPLATES.length} templates
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search templates (e.g. HPC, DMP, IRB, DEIA)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#912A4A]"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#912A4A] text-white font-medium'
                      : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
                  }`}
                >
                  {cat === 'All' ? 'All' : cat.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Template List */}
          <div className="max-h-[300px] overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/60 p-1">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-2.5 hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded transition-colors group space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {getCategoryIcon(tpl.category)}
                      <h4 className="font-sans font-medium text-xs text-stone-900 dark:text-stone-100 truncate">
                        {tpl.title}
                      </h4>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-150 dark:bg-stone-800 text-stone-600 dark:text-stone-300 shrink-0 font-medium">
                      {tpl.category.split(' ')[0]}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                    {tpl.summary}
                  </p>

                  {/* Actions for this template */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <button
                      type="button"
                      onClick={(e) => handleOpenPreview(e, tpl)}
                      className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer font-sans"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleCopy(e, tpl)}
                        className="p-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded hover:bg-stone-200/60 dark:hover:bg-stone-700 cursor-pointer"
                        title="Copy to clipboard"
                      >
                        {copiedId === tpl.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {currentDraftText.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            onInjectTemplate(tpl.content, tpl.title, 'replace');
                            setIsOpen(false);
                          }}
                          className="px-2 py-0.5 text-[10px] font-sans text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors cursor-pointer flex items-center gap-0.5"
                          title="Replace entire response with this template"
                        >
                          <Replace className="w-2.5 h-2.5" />
                          <span>Replace</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onInjectTemplate(tpl.content, tpl.title, 'append');
                          setIsOpen(false);
                        }}
                        className="px-2.5 py-0.5 text-[10px] font-sans bg-[#912A4A] hover:bg-[#78223d] text-white rounded font-medium transition-colors cursor-pointer flex items-center gap-1"
                        title={currentDraftText.trim() ? "Append template to response draft" : "Inject template into response draft"}
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{currentDraftText.trim() ? 'Append' : 'Inject'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-stone-400 italic">
                No institutional boilerplates matching "{searchQuery}".
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-2 bg-stone-50 dark:bg-stone-950/60 border-t border-stone-200 dark:border-stone-800 text-[10px] text-stone-500 flex items-center justify-between">
            <span>Includes standard [Institution] & [PI] placeholders.</span>
          </div>

        </div>
      )}

      {/* Full Preview & Placeholder Customization Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-left">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-start justify-between gap-3 bg-stone-50/70 dark:bg-stone-950/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(previewTemplate.category)}
                  <h3 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-sm">
                    {previewTemplate.title}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium">
                    {previewTemplate.category}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  {previewTemplate.summary}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Placeholder Customization Bar */}
            <div className="p-3 bg-stone-50/50 dark:bg-stone-950/20 border-b border-stone-200 dark:border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-stone-700 dark:text-stone-300">
                <span>Quick Placeholder Autofill:</span>
                <button
                  type="button"
                  onClick={applyPlaceholders}
                  className="text-[10px] text-[#912A4A] dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                >
                  Apply to Preview
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Replace [Institution Name] (e.g. University of Oxford)"
                  value={institutionPlaceholder}
                  onChange={(e) => setInstitutionPlaceholder(e.target.value)}
                  onBlur={applyPlaceholders}
                  className="text-xs p-1.5 bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#912A4A]"
                />
                <input
                  type="text"
                  placeholder="Replace [PI Name] (e.g. Dr. Jane Smith)"
                  value={piPlaceholder}
                  onChange={(e) => setPiPlaceholder(e.target.value)}
                  onBlur={applyPlaceholders}
                  className="text-xs p-1.5 bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-800 dark:text-stone-200 focus:outline-none focus:border-[#912A4A]"
                />
              </div>
            </div>

            {/* Preview Body Textarea */}
            <div className="p-4 flex-grow overflow-y-auto space-y-2">
              <div className="flex items-center justify-between text-[11px] text-stone-500">
                <span>Boilerplate Text ({previewCustomText.split(/\s+/).filter(Boolean).length} words):</span>
                <span>Editable before injection</span>
              </div>
              <textarea
                value={previewCustomText}
                onChange={(e) => setPreviewCustomText(e.target.value)}
                className="w-full font-mono text-xs p-3 bg-stone-50/70 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg h-64 focus:outline-none focus:border-[#912A4A] leading-relaxed text-stone-800 dark:text-stone-200"
              />
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(previewCustomText);
                  setCopiedId(previewTemplate.id);
                  setTimeout(() => setCopiedId(null), 2000);
                }}
                className="w-full sm:w-auto px-3 py-1.5 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-stone-300 dark:border-stone-700"
              >
                {copiedId === previewTemplate.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {currentDraftText.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      onInjectTemplate(previewCustomText, previewTemplate.title, 'replace');
                      setPreviewTemplate(null);
                    }}
                    className="w-full sm:w-auto px-3 py-1.5 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-md font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer border border-stone-300 dark:border-stone-700"
                  >
                    <Replace className="w-3.5 h-3.5" />
                    <span>Replace Entire Draft</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onInjectTemplate(previewCustomText, previewTemplate.title, 'append');
                    setPreviewTemplate(null);
                  }}
                  className="w-full sm:w-auto px-4 py-1.5 text-xs bg-[#912A4A] hover:bg-[#78223d] text-white rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{currentDraftText.trim() ? 'Append to Draft' : 'Inject into Response'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
