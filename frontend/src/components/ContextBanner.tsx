"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";

interface ContextBannerProps {
  userContext: string;
  topic: string;
}

export default function ContextBanner({ userContext, topic }: ContextBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4 bg-[var(--accent-purple)]/5 border-[var(--accent-purple)]/20"
    >
      <div className="flex items-center gap-2">
        <Search size={14} className="text-[var(--accent-purple)]" />
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-purple)]">
          Context-Focused Analysis
        </span>
      </div>
      <p className="text-sm text-[var(--text-primary)] mt-1.5 font-medium">&ldquo;{userContext}&rdquo;</p>
      <p className="text-[10px] text-[var(--text-muted)] mt-1">
        Searched: <span className="text-[var(--accent-blue)]">{topic}</span> • Executive briefing and
        conclusions are focused on your specific question.
      </p>
    </motion.div>
  );
}
