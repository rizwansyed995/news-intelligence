import type { AnalysisSuite } from "@/types";

const STOP_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our",
  "out", "has", "with", "that", "this", "from", "they", "been", "have", "were", "said", "each",
  "which", "their", "will", "other", "about", "many", "then", "them", "some", "could", "when",
  "more", "also", "than", "what", "would", "into", "after", "over", "such", "like", "most", "only",
  "just", "very", "these", "those", "does", "being", "both", "same", "much", "make", "even", "take",
  "come", "know", "well", "still", "back", "here", "last", "long", "made", "before", "between",
  "first", "news", "says", "report", "reports", "market", "markets", "according", "amid", "analysis",
  "article", "articles",
]);

export function computeWordCloud(data: AnalysisSuite | null): [string, number][] {
  if (!data) return [];

  const allText = data.articles
    .map((a) => `${a.title} ${a.ai_summary || ""}`)
    .join(" ")
    .toLowerCase();
  const words = allText.match(/\b[a-z]{4,}\b/g) || [];
  const freq: Record<string, number> = {};
  words.forEach((w) => {
    if (!STOP_WORDS.has(w)) freq[w] = (freq[w] || 0) + 1;
  });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25);
}
