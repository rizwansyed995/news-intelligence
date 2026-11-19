"use client";

import { Zap, History, Clock, ChevronRight } from "lucide-react";
import type { AnalysisSuite, SearchHistoryItem } from "@/types";

interface HistorySidebarProps {
  searchHistory: SearchHistoryItem[];
  onHistoryClick: (topic: string) => void;
  data: AnalysisSuite | null;
}

export default function HistorySidebar({ searchHistory, onHistoryClick, data }: HistorySidebarProps) {
  return (
    <aside className="sidebar-left">
      <div className="p-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[var(--accent-blue)] rounded-lg flex items-center justify-center">
            <Zap size={18} className="text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white">
              NEXUS<span className="text-[var(--accent-blue)]">AI</span>
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
              Intelligence Platform
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-2 mb-4 text-[var(--text-muted)]">
          <History size={14} />
          <span className="text-xs font-bold uppercase tracking-widest">Search History</span>
        </div>

        {searchHistory.length === 0 ? (
          <div className="text-center py-8">
            <Clock size={24} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
            <p className="text-xs text-[var(--text-muted)]">Your searches will appear here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {searchHistory.map((h, i) => (
              <button
                key={i}
                onClick={() => onHistoryClick(h.topic)}
                className="w-full text-left p-3 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors truncate">
                    {h.topic}
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[var(--text-muted)]">{h.articles} articles</span>
                  <span className="text-[10px] text-[var(--text-muted)]">•</span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {new Date(h.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
          <span className="text-[11px] text-[var(--text-muted)] font-medium">
            System Online — {data ? `${data.total_articles} docs loaded` : "Ready"}
          </span>
        </div>
      </div>
    </aside>
  );
}
