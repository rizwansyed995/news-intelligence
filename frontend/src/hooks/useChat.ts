import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "@/lib/api";
import type { AnalysisSuite, ChatMessage } from "@/types";

export function useChat(data: AnalysisSuite | null) {
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const resetChat = () => setChatHistory([]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !data?.id) return;

    const newMsg: ChatMessage = { role: "user", content: chatInput };
    setChatHistory((prev) => [...prev, newMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await sendChatMessage({
        query: newMsg.content,
        suite_id: data.id,
        search_query: data.topic,
      });

      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          content: res.answer,
          citations: res.citations,
          fallback: res.fallback_used,
        },
      ]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: "error", content: "Failed to connect to Nexus LangChain Engine." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return {
    chatInput,
    setChatInput,
    chatHistory,
    isChatLoading,
    isChatOpen,
    setIsChatOpen,
    chatEndRef,
    resetChat,
    handleChatSubmit,
  };
}
