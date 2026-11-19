"use client";

import { FileText, ArrowRight, Zap } from "lucide-react";
import type { Article } from "@/types";

interface ArticlesTableProps {
  articles: Article[];
  totalArticles: number;
}

function sentimentBadgeClass(sentiment?: string) {
  return sentiment === "Positive" ? "badge-positive" : sentiment === "Negative" ? "badge-negative" : "badge-neutral";
}

export default function ArticlesTable({ articles, totalArticles }: ArticlesTableProps) {
  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-[var(--border-subtle)] flex items-center gap-3">
        <FileText size={18} className="text-[var(--accent-blue)]" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Source Intelligence Data
        </h3>
        <span className="ml-auto badge badge-info">{totalArticles} sources</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Source Article
              </th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] w-24">
                Vector
              </th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                AI Analysis
              </th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a, i) => (
              <tr
                key={i}
                className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-elevated)]/50 transition-colors"
              >
                <td className="px-5 py-4 w-1/3">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-sm text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition-colors block mb-2 leading-snug"
                  >
                    {a.title}
                  </a>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                      {a.source}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
                      {a.category}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 align-top">
                  <span className={`badge ${sentimentBadgeClass(a.sentiment)}`}>{a.sentiment}</span>
                  {a.sentiment_divergence && <span className="badge badge-warning mt-1 block w-fit">⚠ Divergent</span>}
                </td>
                <td className="px-5 py-4 align-top">
                  <div className="text-xs font-bold text-[var(--accent-blue)] mb-1.5 uppercase tracking-wide">
                    {a.insight_headline}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                    {a.ai_summary}
                  </div>
                  {a.impact_chain && a.impact_chain.length === 3 && (
                    <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]/50">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-purple)] mb-1.5 flex items-center gap-1">
                        <Zap size={10} /> Impact Chain
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                        <span className="px-2 py-1 rounded bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
                          {a.impact_chain[0]}
                        </span>
                        <ArrowRight size={12} className="text-[var(--text-muted)]" />
                        <span className="px-2 py-1 rounded bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
                          {a.impact_chain[1]}
                        </span>
                        <ArrowRight size={12} className="text-[var(--text-muted)]" />
                        <span className="px-2 py-1 rounded bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] border border-[var(--accent-amber)]/20">
                          ⚠ {a.impact_chain[2]}
                        </span>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
