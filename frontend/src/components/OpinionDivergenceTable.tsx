"use client";

import { AlertCircle } from "lucide-react";
import type { Article } from "@/types";

interface OpinionDivergenceTableProps {
  articles: Article[];
}

function sentimentBadgeClass(sentiment?: string) {
  return sentiment === "Positive" ? "badge-positive" : sentiment === "Negative" ? "badge-negative" : "badge-neutral";
}

export default function OpinionDivergenceTable({ articles }: OpinionDivergenceTableProps) {
  return (
    <div className="card p-6">
      <div className="section-header">
        <AlertCircle size={18} className="text-[var(--accent-amber)]" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Opinion Divergence
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="pb-2 text-left font-bold uppercase tracking-wider text-[var(--text-muted)]">Article</th>
              <th className="pb-2 text-center font-bold uppercase tracking-wider text-[var(--text-muted)]">AI</th>
              <th className="pb-2 text-center font-bold uppercase tracking-wider text-[var(--text-muted)]">VADER</th>
              <th className="pb-2 text-center font-bold uppercase tracking-wider text-[var(--text-muted)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a, i) => (
              <tr
                key={i}
                className={`border-b border-[var(--border-subtle)]/50 ${
                  a.sentiment_divergence ? "bg-[var(--accent-amber)]/5" : ""
                }`}
              >
                <td className="py-2.5 pr-2 font-medium text-[var(--text-primary)] max-w-[160px] truncate">
                  {a.title.substring(0, 30)}
                  {a.title.length > 30 ? "…" : ""}
                </td>
                <td className="py-2.5 text-center">
                  <span className={`badge ${sentimentBadgeClass(a.sentiment)}`}>{a.sentiment}</span>
                </td>
                <td className="py-2.5 text-center">
                  <span className={`badge ${sentimentBadgeClass(a.heuristic_sentiment)}`}>
                    {a.heuristic_sentiment || "N/A"}
                  </span>
                </td>
                <td className="py-2.5 text-center">
                  {a.sentiment_divergence ? (
                    <span className="badge badge-warning">⚠ Split</span>
                  ) : (
                    <span className="badge badge-positive">✓ Aligned</span>
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
