"use client";

import { FileText, Zap } from "lucide-react";

interface BriefingPanelProps {
  executiveSummary: string;
  marketConclusion: string;
}

export default function BriefingPanel({ executiveSummary, marketConclusion }: BriefingPanelProps) {
  return (
    <div className="xl:col-span-2 card p-6">
      <div className="section-header">
        <FileText size={18} className="text-[var(--accent-blue)]" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Briefing</h3>
      </div>
      <div
        className="text-sm text-[var(--text-primary)] leading-relaxed font-medium [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_li]:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: executiveSummary }}
      />
      <div className="mt-6 pt-5 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-[var(--accent-blue)]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Strategic Conclusion
          </span>
        </div>
        <div
          className="text-sm text-[var(--text-primary)] leading-relaxed font-medium [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_li]:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: marketConclusion }}
        />
      </div>
    </div>
  );
}
