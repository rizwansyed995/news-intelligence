"use client";

import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";

interface MasterImpactChainProps {
  chain: string[];
}

export default function MasterImpactChain({ chain }: MasterImpactChainProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 bg-gradient-to-r from-[#1a1d28] via-[#1e2235] to-[#1a1d28] border-[var(--accent-amber)]/20"
    >
      <div className="section-header border-b-0 mb-4 pb-0">
        <Zap size={18} className="text-[var(--accent-amber)]" fill="currentColor" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--accent-amber)]">
          Master Impact Chain
        </h3>
        <span className="ml-auto badge badge-warning">Macro Synthesis</span>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center gap-3 py-2">
        <div className="impact-step bg-[var(--accent-red)]/15 text-[#f87171] border border-[var(--accent-red)]/20 flex-1 min-w-[180px]">
          {chain[0]}
        </div>
        <ArrowRight size={18} className="text-[var(--accent-amber)] rotate-90 md:rotate-0 shrink-0" />
        <div className="impact-step bg-[var(--accent-amber)]/15 text-[#fbbf24] border border-[var(--accent-amber)]/20 flex-1 min-w-[180px]">
          {chain[1]}
        </div>
        <ArrowRight size={18} className="text-[var(--accent-amber)] rotate-90 md:rotate-0 shrink-0" />
        <div className="impact-step bg-[var(--accent-purple)]/15 text-[#a78bfa] border border-[var(--accent-purple)]/20 flex-1 min-w-[180px]">
          ⚠ {chain[2]}
        </div>
      </div>
    </motion.div>
  );
}
