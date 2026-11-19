"use client";

import "@/lib/chartSetup";
import { useAnalysisSearch } from "@/hooks/useAnalysisSearch";
import { useChat } from "@/hooks/useChat";
import HistorySidebar from "@/components/HistorySidebar";
import SearchBar from "@/components/SearchBar";
import StatusBanners from "@/components/StatusBanners";
import WelcomeScreen from "@/components/WelcomeScreen";
import DashboardContent from "@/components/DashboardContent";
import ChatSidebar from "@/components/ChatSidebar";

export default function Home() {
  const {
    query,
    setQuery,
    loading,
    data,
    error,
    progressMsg,
    searchHistory,
    handleSearch: runSearch,
    handleHistoryClick: runHistorySearch,
  } = useAnalysisSearch();

  const {
    chatInput,
    setChatInput,
    chatHistory,
    isChatLoading,
    isChatOpen,
    setIsChatOpen,
    chatEndRef,
    resetChat,
    handleChatSubmit,
  } = useChat(data);

  const handleSearch = (e?: React.FormEvent | string) => {
    resetChat();
    runSearch(e);
  };

  const handleHistoryClick = (topic: string) => {
    resetChat();
    runHistorySearch(topic);
  };

  return (
    <div className="app-shell">
      <HistorySidebar searchHistory={searchHistory} onHistoryClick={handleHistoryClick} data={data} />

      <main className="main-canvas">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <SearchBar
            query={query}
            setQuery={setQuery}
            loading={loading}
            onSearch={handleSearch}
            isChatOpen={isChatOpen}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
          />

          <StatusBanners loading={loading} progressMsg={progressMsg} error={error} />

          {!data && !loading && <WelcomeScreen onQuickTopic={(t) => setQuery(t)} />}

          <DashboardContent data={data} />
        </div>
      </main>

      <ChatSidebar
        data={data}
        isChatOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        chatHistory={chatHistory}
        chatInput={chatInput}
        setChatInput={setChatInput}
        isChatLoading={isChatLoading}
        chatEndRef={chatEndRef}
        onSubmit={handleChatSubmit}
      />
    </div>
  );
}
