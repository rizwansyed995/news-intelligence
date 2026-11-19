import axios from "axios";
import type { AnalysisSuite, ChatMessage } from "@/types";

export const API_BASE = "http://localhost:8000";

export interface SubmitAnalysisResponse {
  task_id: string;
  status: string;
  poll_url: string;
  search_query?: string;
  is_contextual?: boolean;
}

export interface TaskStatusResponse {
  status: "pending" | "scraped" | "analyzing" | "complete" | "failed" | string;
  progress?: string;
  result?: AnalysisSuite;
  error?: string;
}

export interface ChatApiResponse {
  answer: string;
  citations?: unknown[];
  fallback_used?: boolean;
}

export async function submitAnalysis(query: string, limit = 10) {
  const res = await axios.get<SubmitAnalysisResponse>(
    `${API_BASE}/api/analyze/async?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  return res.data;
}

export async function pollTask(taskId: string) {
  const res = await axios.get<TaskStatusResponse>(`${API_BASE}/api/task/${taskId}`);
  return res.data;
}

export async function sendChatMessage(payload: {
  query: string;
  suite_id: string;
  search_query: string;
}) {
  const res = await axios.post<ChatApiResponse>(`${API_BASE}/api/chat`, payload);
  return res.data;
}

export type { AnalysisSuite, ChatMessage };
