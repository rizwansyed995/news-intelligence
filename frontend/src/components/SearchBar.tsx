"use client";

import { Search, Loader2, PanelRightOpen, PanelRightClose } from "lucide-react";

interface SearchBarProps {
  query: string;
  setQuery: (v: string) => void;
  loading: boolean;
  onSearch: (e: React.FormEvent) => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
}

export default function SearchBar({ query, setQuery, loading, onSearch, isChatOpen, onToggleChat }: SearchBarProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <form onSubmit={onSearch} className="flex-1 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics... e.g., Semiconductors, AI Regulation, Oil Markets"
            className="w-full input-dark pl-11 pr-4 py-3 text-sm font-medium"
          />
        </div>
        <button disabled={loading} className="btn-primary px-6 py-3 text-sm flex items-center gap-2">
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <>
              <Search size={16} /> Analyze
            </>
          )}
        </button>
      </form>

      <button
        onClick={onToggleChat}
        className="p-3 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-secondary)]"
        title={isChatOpen ? "Hide Chat" : "Show Chat"}
      >
        {isChatOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
      </button>
    </div>
  );
}
