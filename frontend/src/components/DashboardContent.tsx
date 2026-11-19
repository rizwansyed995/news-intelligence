"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { AnalysisSuite } from "@/types";
import { computeWordCloud } from "@/lib/wordcloud";
import ContextBanner from "@/components/ContextBanner";
import KpiStrip from "@/components/KpiStrip";
import MasterImpactChain from "@/components/MasterImpactChain";
import BriefingPanel from "@/components/BriefingPanel";
import SentimentPanel from "@/components/SentimentPanel";
import TopicCloud from "@/components/TopicCloud";
import SourceDistributionChart from "@/components/SourceDistributionChart";
import ArticleTimeline from "@/components/ArticleTimeline";
import OpinionDivergenceTable from "@/components/OpinionDivergenceTable";
import ArticlesTable from "@/components/ArticlesTable";

interface DashboardContentProps {
  data: AnalysisSuite | null;
}

export default function DashboardContent({ data }: DashboardContentProps) {
  const divergentCount = data ? data.articles.filter((a) => a.sentiment_divergence).length : 0;
  const wordCloudData = computeWordCloud(data);

  return (
    <AnimatePresence>
      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
          {data.user_context && <ContextBanner userContext={data.user_context} topic={data.topic} />}

          <KpiStrip data={data} divergentCount={divergentCount} />

          {data.master_impact_chain && data.master_impact_chain.length === 3 && (
            <MasterImpactChain chain={data.master_impact_chain} />
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <BriefingPanel executiveSummary={data.executive_summary} marketConclusion={data.market_conclusion} />
            <SentimentPanel data={data} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopicCloud wordCloudData={wordCloudData} />
            <SourceDistributionChart articles={data.articles} />
            <ArticleTimeline articles={data.articles} />
            <OpinionDivergenceTable articles={data.articles} />
          </div>

          <ArticlesTable articles={data.articles} totalArticles={data.total_articles} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
