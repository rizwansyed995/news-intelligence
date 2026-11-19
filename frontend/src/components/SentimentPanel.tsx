"use client";

import { PieChart } from "lucide-react";
import { Pie } from "react-chartjs-2";
import type { AnalysisSuite } from "@/types";

interface SentimentPanelProps {
  data: AnalysisSuite;
}

export default function SentimentPanel({ data }: SentimentPanelProps) {
  const sentimentData = {
    labels: ["Positive", "Neutral", "Negative"],
    datasets: [
      {
        data: [
          data.articles.filter((a) => a.sentiment === "Positive").length,
          data.articles.filter((a) => a.sentiment === "Neutral").length,
          data.articles.filter((a) => a.sentiment === "Negative").length,
        ],
        backgroundColor: ["#22c55e", "#64748b", "#ef4444"],
        borderColor: ["transparent", "transparent", "transparent"],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  return (
    <div className="card p-6">
      <div className="section-header">
        <PieChart size={18} className="text-[var(--accent-blue)]" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Sentiment Profile
        </h3>
      </div>
      <div className="w-48 h-48 mx-auto mb-6">
        <Pie
          data={sentimentData}
          options={{
            plugins: {
              legend: {
                position: "bottom",
                labels: { color: "#9ca3b4", font: { weight: 600, size: 11 }, padding: 12 },
              },
            },
          }}
        />
      </div>
      <div className="border-t border-[var(--border-subtle)] pt-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 block">
          Core Entities
        </span>
        <div className="flex flex-wrap gap-2">
          {data.top_keywords.map((kw, i) => (
            <span key={i} className="badge badge-info">
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
