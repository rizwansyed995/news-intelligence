"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const QUICK_TOPICS = ["Semiconductors", "AI Regulation", "Oil Markets", "Federal Reserve"];

interface WelcomeScreenProps {
  onQuickTopic: (topic: string) => void;
}

export default function WelcomeScreen({ onQuickTopic }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <div className="w-16 h-16 bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 rounded-2xl flex items-center justify-center mb-6">
        <Zap size={28} className="text-[var(--accent-blue)]" />
      </div>
      <h2 className="text-3xl font-extrabold tracking-tight mb-3 text-white">Nexus Intelligence Platform</h2>
      <p className="text-[var(--text-secondary)] max-w-lg text-sm leading-relaxed mb-8">
        Enter a topic above to initiate a deep intelligence crawl. Nexus scrapes live news, runs Groq AI
        analysis, generates impact chains via LangGraph, and cross-validates with VADER sentiment — all in
        under 30 seconds.
      </p>
      <div className="flex gap-3 text-xs">
        {QUICK_TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => onQuickTopic(t)}
            className="px-4 py-2 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors font-semibold"
          >
            {t}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
