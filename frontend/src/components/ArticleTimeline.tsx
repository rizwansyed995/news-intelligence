"use client";

import { TrendingUp } from "lucide-react";
import type { Article } from "@/types";

interface ArticleTimelineProps {
  articles: Article[];
}

export default function ArticleTimeline({ articles }: ArticleTimelineProps) {
  const articlesWithDates = articles
    .map((a, idx) => {
      let d: Date | null = null;
      try {
        const parsed = new Date(a.date || "");
        if (!isNaN(parsed.getTime())) d = parsed;
      } catch {
        d = null;
      }
      return { ...a, parsedDate: d, idx };
    })
    .filter((a): a is Article & { parsedDate: Date; idx: number } => a.parsedDate !== null)
    .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());

  const now = new Date();

  return (
    <div className="card p-6">
      <div className="section-header">
        <TrendingUp size={18} className="text-[var(--accent-green)]" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Article Timeline
        </h3>
      </div>
      <div className="space-y-2.5">
        {articlesWithDates.length === 0 ? (
          <div className="text-center text-[var(--text-muted)] text-xs py-8">No parseable dates</div>
        ) : (
          articlesWithDates.slice(0, 8).map((a, i) => {
            const hoursAgo = Math.round((now.getTime() - a.parsedDate.getTime()) / (1000 * 60 * 60));
            const label = hoursAgo < 1 ? "Now" : hoursAgo < 24 ? `${hoursAgo}h` : `${Math.round(hoursAgo / 24)}d`;
            const barWidth = Math.max(10, 100 - (hoursAgo / 168) * 80);
            return (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold w-8 text-right text-[var(--text-muted)]">{label}</span>
                <div className="flex-1 bg-[var(--bg-elevated)] h-5 rounded overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent-blue)] rounded transition-all duration-500 opacity-70"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-[var(--text-muted)] w-28 truncate">
                  {a.title.substring(0, 25)}…
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
