import { useState } from "react";
import { submitAnalysis, pollTask } from "@/lib/api";
import type { AnalysisSuite, SearchHistoryItem } from "@/types";

const MAX_POLL_ATTEMPTS = 45;
const POLL_INTERVAL_MS = 2000;

export function useAnalysisSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisSuite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState("");
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  const runSearch = async (searchTerm: string) => {
    if (!searchTerm) return;

    setLoading(true);
    setError(null);
    setProgressMsg("Submitting analysis task...");

    try {
      const submitRes = await submitAnalysis(searchTerm, 10);
      const taskId = submitRes.task_id;
      const isContextual = submitRes.is_contextual;
      const actualSearchQuery = submitRes.search_query || searchTerm;
      setProgressMsg(
        isContextual
          ? `Context detected → Searching "${actualSearchQuery}"...`
          : `Task ${taskId} queued. Crawling sources...`
      );

      let attempts = 0;
      while (attempts < MAX_POLL_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        attempts++;

        const task = await pollTask(taskId);
        setProgressMsg(task.progress || `Analyzing intelligence... (${attempts * 2}s)`);

        if (task.status === "complete" && task.result) {
          setData(task.result);
          setSearchHistory((prev) => {
            const exists = prev.find((h) => h.topic.toLowerCase() === searchTerm.toLowerCase());
            if (exists) return prev;
            return [
              {
                topic: searchTerm,
                timestamp: new Date().toISOString(),
                articles: task.result!.total_articles,
              },
              ...prev,
            ].slice(0, 15);
          });
          setProgressMsg("");
          setLoading(false);
          return;
        }

        if (task.status === "failed") {
          setError(task.error || "Analysis task failed.");
          setProgressMsg("");
          setLoading(false);
          return;
        }
      }

      setError("Analysis timed out. Please try again.");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to connect to backend.");
      console.error(err);
    } finally {
      setLoading(false);
      setProgressMsg("");
    }
  };

  const handleSearch = (e?: React.FormEvent | string) => {
    if (e && typeof e !== "string") e.preventDefault();
    const searchTerm = typeof e === "string" ? e : query;
    runSearch(searchTerm);
  };

  const handleHistoryClick = (topic: string) => {
    setQuery(topic);
    runSearch(topic);
  };

  return {
    query,
    setQuery,
    loading,
    data,
    error,
    progressMsg,
    searchHistory,
    handleSearch,
    handleHistoryClick,
  };
}
