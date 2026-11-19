"use client";

import { Globe, Activity, Shield, Layers } from "lucide-react";
import type { AnalysisSuite } from "@/types";

interface KpiStripProps {
  data: AnalysisSuite;
  divergentCount: number;
}

export default function KpiStrip({ data, divergentCount }: KpiStripProps) {
  const sentimentColor =
    data.dominant_sentiment === "Positive"
      ? "text-[var(--accent-green)]"
      : data.dominant_sentiment === "Negative"
      ? "text-[var(--accent-red)]"
      : "text-[var(--text-secondary)]";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="card p-5">
        <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
          <Globe size={14} />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Articles</span>
        </div>
        <div className="text-3xl font-extrabold text-white">{data.total_articles}</div>
      </div>
      <div className="card p-5">
        <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
          <Activity size={14} />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Sentiment</span>
        </div>
        <div className={`text-3xl font-extrabold ${sentimentColor}`}>{data.dominant_sentiment}</div>
      </div>
      <div className="card p-5">
        <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
          <Shield size={14} />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Divergences</span>
        </div>
        <div className="text-3xl font-extrabold text-[var(--accent-amber)]">{divergentCount}</div>
      </div>
      <div className="card p-5">
        <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
          <Layers size={14} />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Impact Chains</span>
        </div>
        <div className="text-3xl font-extrabold text-[var(--accent-purple)]">
          {data.articles.filter((a) => a.impact_chain?.length === 3).length}
        </div>
      </div>
    </div>
  );
}
