/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Bot, User, RefreshCw, HelpCircle, AlertCircle } from 'lucide-react';
import ResearchIntegrityBanner from './ResearchIntegrityBanner';
import { postWithAiRouting } from '../lib/localAiService';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const cached = localStorage.getItem('scholar_assistant_chat');
    return cached ? JSON.parse(cached) : [
      {
        id: 'initial',
        role: 'model',
        text: "Greetings, fellow scholar. I am your AI academic mentor and research companion. Whether you need to structure your methodology, reframe your thesis scope, overcome cognitive writer's block, or practice for your defense, I am here to assist with structured and supportive guidance. How can I support your inquiry today?",
        timestamp: new Date().toISOString()
      }
    ];
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick preset questions to guide scholars
  const starterPrompts = [
    "How do I narrow down my thesis scope?",
    "I'm feeling stuck on my methodology. What steps can I take?",
    "Help me draft an introductory outline for my project.",
    "How can I manage writing anxiety and perfectionism?",
  ];

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('scholar_assistant_chat', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom on message load/change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const customGuidance = localStorage.getItem('scholar_custom_guidance') || '';
      
      // We pass the history mapped to role and text
      const historyPayload = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await postWithAiRouting('/api/gemini/chat', {
        message: textToSend,
        history: historyPayload,
        customGuidance
      });

      if (response.ok) {
        const data = await response.json();
        const modelMsg: ChatMessage = {
          id: Math.random().toString(),
          role: 'model',
          text: data.text || "I was unable to synthesize a proper response. Please try again.",
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, modelMsg]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to communicate with AI Assistant');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connection lost. Please make sure your server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Permanently clear your conversation history?')) {
      const defaultInitial: ChatMessage[] = [
        {
          id: 'initial',
          role: 'model',
          text: "Greetings, fellow scholar. I am your AI academic mentor and research companion. Whether you need to structure your methodology, reframe your thesis scope, overcome cognitive writer's block, or practice for your defense, I am here to assist with structured and supportive guidance. How can I support your inquiry today?",
          timestamp: new Date().toISOString()
        }
      ];
      setMessages(defaultInitial);
      localStorage.setItem('scholar_assistant_chat', JSON.stringify(defaultInitial));
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)] font-sans" id="ai-assistant-module">
      
      {/* Header Panel */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4 mb-3 flex justify-between items-center shrink-0">
        <div className="text-left">
          <h1 className="font-sans font-medium text-2xl tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" /> AI Assistant
          </h1>
          <p className="font-sans text-xs text-stone-500 mt-1">
            Consult your dedicated academic guide for writing methods, structures, and mental clarity.
          </p>
        </div>
        
        <button
          onClick={handleClearHistory}
          className="text-[10px] font-mono text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer border border-stone-200 dark:border-stone-850 px-2.5 py-1 rounded hover:bg-stone-50 dark:hover:bg-stone-900"
          title="Clear active session"
        >
          Clear History
        </button>
      </div>

      <div className="mb-3">
        <ResearchIntegrityBanner compact />
      </div>

      {/* Main chat log */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 min-h-0">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3.5 max-w-3xl animate-fadeIn ${
              m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            {/* Avatar */}
            <div className={`p-2 rounded-full shrink-0 ${
              m.role === 'user' 
                ? 'bg-amber-900/10 text-amber-900 dark:bg-stone-800 dark:text-stone-300' 
                : 'bg-stone-100 text-stone-600 dark:bg-stone-900 dark:text-stone-400 border border-stone-200 dark:border-stone-800'
            }`}>
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-amber-600 dark:text-amber-500" />}
            </div>

            {/* Bubble */}
            <div className={`p-4 rounded-xl text-left ${
              m.role === 'user'
                ? 'bg-amber-900/15 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 rounded-tr-none border border-amber-900/5 dark:border-stone-750'
                : 'bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 rounded-tl-none border border-stone-200 dark:border-stone-850 shadow-sm'
            }`}>
              <p className="text-xs leading-relaxed whitespace-pre-line font-sans font-light">
                {m.text}
              </p>
              
              <div className="mt-2.5 pt-1.5 border-t border-stone-100 dark:border-stone-900 flex justify-end">
                <span className="text-[9px] font-mono text-stone-400">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3.5 mr-auto animate-fadeIn">
            <div className="p-2 rounded-full bg-stone-100 text-stone-600 dark:bg-stone-900 dark:text-stone-400 border border-stone-200 dark:border-stone-850 shrink-0">
              <Bot className="w-4 h-4 text-amber-600" />
            </div>
            <div className="p-4 rounded-xl rounded-tl-none bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-850 text-stone-500 dark:text-stone-400 italic text-xs shadow-xs flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
              Your advisor is drafting a reply, checking structured evidence...
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-50/10 dark:bg-red-950/10 border border-red-200 dark:border-red-900/40 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-start gap-2 max-w-xl animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to consult advisor</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset Starters & Inputs container */}
      <div className="shrink-0 space-y-3.5">
        {messages.length === 1 && !isLoading && (
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-stone-300" /> Need a starting point? Ask one of these:
            </span>
            <div className="flex flex-wrap gap-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  className="font-sans text-[11px] border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 hover:bg-amber-50/20 hover:border-amber-900/10 text-stone-600 dark:text-stone-300 px-3 py-1.5 rounded-full transition-all cursor-pointer text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text Area Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() && !isLoading) {
              handleSendMessage(input.trim());
            }
          }}
          className="relative flex items-center"
        >
          <label htmlFor="ai-chat-input" className="sr-only">Type a message to your mentor</label>
          <input
            id="ai-chat-input"
            type="text"
            placeholder="Ask your PhD mentor anything about your project, chapters, blockages..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="w-full font-sans text-xs p-3.5 pr-12 border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-60"
            required
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 rounded-lg bg-stone-900 dark:bg-stone-800 text-white hover:bg-stone-800 disabled:opacity-40 transition-colors cursor-pointer"
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
