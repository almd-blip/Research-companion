/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [stage, setStage] = useState<'welcome' | 'choice'>('welcome');

  useEffect(() => {
    // After 3 seconds, the initial text fades out and the next stage fades in
    const timer = setTimeout(() => {
      setStage('choice');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-stone-950 z-50 flex items-center justify-center p-8 select-none font-sans overflow-hidden">
      {/* Subtle warm glow background accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,26,0.06),transparent_70%)] pointer-events-none" />

      {/* Top Left Logo */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-50">
        <img 
          src="/assets/logo_transparent.png" 
          alt="Second Thought Publishing Logo" 
          className="h-10 md:h-12 w-auto object-contain max-w-[180px] md:max-w-[220px]"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Centered on the page but text aligned to the left */}
      <div className="w-full max-w-xl md:max-w-2xl relative z-10 text-left">
        <AnimatePresence mode="wait">
          {stage === 'welcome' ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="space-y-4"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-loose tracking-tight select-text">
                You have arrived.
              </h1>
              <h2 className="text-4xl md:text-6xl font-bold text-white leading-loose tracking-tight select-text">
                You belong here.
              </h2>
            </motion.div>
          ) : (
            <motion.div
              key="choice"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="space-y-6"
            >
              <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-relaxed select-text">
                Where would you like to begin?
              </h1>

              {/* Aligned to the left links */}
              <div className="mt-8 flex flex-col items-start gap-5 pl-0.5">
                <motion.button
                  onClick={() => onNavigate('wellbeing')}
                  className="group text-white hover:text-amber-400 transition-colors duration-300 flex items-center cursor-pointer text-xl md:text-2xl font-bold py-1 text-left focus:outline-none focus:ring-1 focus:ring-amber-500 rounded"
                  whileHover={{ x: 8 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                >
                  <span className="border-b border-transparent group-hover:border-amber-400 pb-0.5 transition-all">
                    Pause and breathe
                  </span>
                </motion.button>

                <motion.button
                  onClick={() => onNavigate('about')}
                  className="group text-white hover:text-sky-400 transition-colors duration-300 flex items-center cursor-pointer text-xl md:text-2xl font-bold py-1 text-left focus:outline-none focus:ring-1 focus:ring-sky-500 rounded"
                  whileHover={{ x: 8 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                >
                  <span className="border-b border-transparent group-hover:border-sky-400 pb-0.5 transition-all">
                    Explore
                  </span>
                </motion.button>

                <motion.button
                  onClick={() => onNavigate('dashboard')}
                  className="group text-white hover:text-emerald-400 transition-colors duration-300 flex items-center cursor-pointer text-xl md:text-2xl font-bold py-1 text-left focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded"
                  whileHover={{ x: 8 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                >
                  <span className="border-b border-transparent group-hover:border-emerald-400 pb-0.5 transition-all">
                    I'm ready
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
