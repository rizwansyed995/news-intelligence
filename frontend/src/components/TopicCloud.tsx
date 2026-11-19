"use client";

import { Globe } from "lucide-react";

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

interface TopicCloudProps {
  wordCloudData: [string, number][];
}

export default function TopicCloud({ wordCloudData }: TopicCloudProps) {
  const maxFreq = wordCloudData[0]?.[1] || 1;

  return (
    <div className="card p-6">
      <div className="section-header">
        <Globe size={18} className="text-[var(--accent-cyan)]" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Topic Cloud</h3>
      </div>
      <div className="min-h-[220px] flex flex-wrap items-center justify-center gap-2 p-4">
        {wordCloudData.map(([word, count], i) => {
          const size = Math.max(12, Math.min(36, (count / maxFreq) * 36));
          return (
            <span
              key={i}
              className="font-bold uppercase inline-block cursor-default transition-all hover:scale-110 hover:opacity-100"
              style={{ fontSize: `${size}px`, color: COLORS[i % COLORS.length], opacity: 0.5 + (count / maxFreq) * 0.5 }}
              title={`${word}: ${count}`}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}
