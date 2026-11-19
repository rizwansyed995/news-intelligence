"use client";

import { MessageSquare, X, Globe, Loader2, Send } from "lucide-react";
import type { RefObject } from "react";
import type { AnalysisSuite, ChatMessage } from "@/types";

const SUGGESTED_QUESTIONS = [
  "What are the key risks?",
  "Which companies are affected?",
  "Summarize the sentiment trends",
];

interface ChatSidebarProps {
  data: AnalysisSuite | null;
  isChatOpen: boolean;
  onClose: () => void;
  chatHistory: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  isChatLoading: boolean;
  chatEndRef: RefObject<HTMLDivElement | null>;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ChatSidebar({
  data,
  isChatOpen,
  onClose,
  chatHistory,
  chatInput,
  setChatInput,
  isChatLoading,
  chatEndRef,
  onSubmit,
}: ChatSidebarProps) {
  return (
    <aside className={`sidebar-right ${isChatOpen ? "" : "collapsed"}`}>
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-3">
        <MessageSquare size={18} className="text-[var(--accent-blue)]" />
        <div>
          <h3 className="text-sm font-bold text-white">Nexus RAG Agent</h3>
          <p className="text-[10px] text-[var(--text-muted)]">Ask questions about the analysis</p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!data && (
          <div className="text-center py-12">
            <MessageSquare size={28} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
            <p className="text-xs text-[var(--text-muted)]">Run a search to start chatting</p>
          </div>
        )}
        {data && chatHistory.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-[var(--text-muted)] mb-4">Ask me anything about the analysis results</p>
            <div className="space-y-2 text-left">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setChatInput(q)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] p-3 rounded-lg text-xs font-medium leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--accent-blue)] text-white"
                  : msg.role === "error"
                  ? "bg-[var(--accent-red)]/15 text-[var(--accent-red)] border border-[var(--accent-red)]/20"
                  : msg.fallback
                  ? "bg-[var(--accent-cyan)]/10 text-[var(--text-primary)] border border-[var(--accent-cyan)]/20"
                  : "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
              }`}
            >
              {msg.fallback && (
                <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-[var(--border-subtle)]/50">
                  <Globe size={10} className="text-[var(--accent-cyan)]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
                    Live Web Search
                  </span>
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {isChatLoading && (
          <div className="flex justify-start">
            <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Loader2 size={12} className="animate-spin" /> Thinking...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={onSubmit} className="p-3 border-t border-[var(--border-subtle)] flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={data ? "Ask about the analysis..." : "Run a search first..."}
          disabled={!data}
          className="flex-1 input-dark px-3 py-2.5 text-xs font-medium"
        />
        <button type="submit" disabled={isChatLoading || !chatInput.trim() || !data} className="btn-primary p-2.5">
          <Send size={14} />
        </button>
      </form>
    </aside>
  );
}
