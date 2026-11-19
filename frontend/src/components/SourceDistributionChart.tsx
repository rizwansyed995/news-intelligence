"use client";

import { BarChart3 } from "lucide-react";
import { Bar } from "react-chartjs-2";
import type { Article } from "@/types";

interface SourceDistributionChartProps {
  articles: Article[];
}

export default function SourceDistributionChart({ articles }: SourceDistributionChartProps) {
  const sources = [...new Set(articles.map((a) => a.source))];

  return (
    <div className="card p-6">
      <div className="section-header">
        <BarChart3 size={18} className="text-[var(--accent-blue)]" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Source Distribution
        </h3>
      </div>
      <div className="p-2">
        <Bar
          data={{
            labels: sources,
            datasets: [
              {
                label: "Articles",
                data: sources.map((src) => articles.filter((a) => a.source === src).length),
                backgroundColor: ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444"],
                borderColor: "transparent",
                borderWidth: 0,
                borderRadius: 4,
              },
            ],
          }}
          options={{
            indexAxis: "y",
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { font: { weight: 600 } }, grid: { color: "#2a2e3d" } },
              y: { ticks: { font: { weight: 700, size: 12 } }, grid: { display: false } },
            },
          }}
        />
      </div>
    </div>
  );
}
