"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Search,
  TrendingUp,
  BarChart3,
  PieChart,
  FileText,
  AlertCircle,
  Loader2,
  ArrowRight,
  Globe,
  Zap,
  MessageSquare,
  Send,
  X,
  Clock,
  History,
  ChevronRight,
  PanelRightOpen,
  PanelRightClose,
  Activity,
  Shield,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// ── Dark theme chart defaults ───────────────────────────
ChartJS.defaults.color = '#9ca3b4';
ChartJS.defaults.borderColor = '#2a2e3d';

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [progressMsg, setProgressMsg] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);

  // Chat
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    const searchTerm = typeof e === 'string' ? e : query;
    if (!searchTerm) return;

    setLoading(true);
    setError(null);
    setChatHistory([]);
    setProgressMsg("Submitting analysis task...");

    try {
      const submitRes = await axios.get(`http://localhost:8000/api/analyze/async?q=${encodeURIComponent(searchTerm)}&limit=10`);
      const taskId = submitRes.data.task_id;
      const isContextual = submitRes.data.is_contextual;
      const actualSearchQuery = submitRes.data.search_query || searchTerm;
      setProgressMsg(isContextual ? `Context detected → Searching "${actualSearchQuery}"...` : `Task ${taskId} queued. Crawling sources...`);

      let attempts = 0;
      const maxAttempts = 45;

      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000));
        attempts++;

        const pollRes = await axios.get(`http://localhost:8000/api/task/${taskId}`);
        const task = pollRes.data;

        setProgressMsg(task.progress || `Analyzing intelligence... (${attempts * 2}s)`);

        if (task.status === "complete") {
          setData(task.result);
          // Add to search history
          setSearchHistory(prev => {
            const exists = prev.find(h => h.topic.toLowerCase() === searchTerm.toLowerCase());
            if (exists) return prev;
            return [{ topic: searchTerm, timestamp: new Date().toISOString(), articles: task.result.total_articles }, ...prev].slice(0, 15);
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
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to connect to backend.");
      console.error(err);
    } finally {
      setLoading(false);
      setProgressMsg("");
    }
  };

  const handleHistoryClick = (topic) => {
    setQuery(topic);
    handleSearch(topic);
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !data?.id) return;

    const newMsg = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, newMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await axios.post('http://localhost:8000/api/chat', {
        query: newMsg.content,
        suite_id: data.id,
        search_query: data.topic
      });

      setChatHistory(prev => [...prev, {
        role: 'ai',
        content: res.data.answer,
        citations: res.data.citations,
        fallback: res.data.fallback_used
      }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'error', content: "Failed to connect to Nexus LangChain Engine." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const sentimentData = data ? {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [{
      data: [
        data.articles.filter(a => a.sentiment === 'Positive').length,
        data.articles.filter(a => a.sentiment === 'Neutral').length,
        data.articles.filter(a => a.sentiment === 'Negative').length,
      ],
      backgroundColor: ['#22c55e', '#64748b', '#ef4444'],
      borderColor: ['transparent', 'transparent', 'transparent'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  } : null;

  // ── Computed data helpers ───────────────────────────────
  const divergentCount = data ? data.articles.filter(a => a.sentiment_divergence).length : 0;

  const wordCloudData = data ? (() => {
    const stopWords = new Set(['the','and','for','are','but','not','you','all','can','had','her','was','one','our','out','has','with','that','this','from','they','been','have','were','said','each','which','their','will','other','about','many','then','them','some','could','when','more','also','than','what','would','into','after','over','such','like','most','only','just','very','these','those','does','being','both','same','much','make','even','take','come','know','well','still','back','here','last','long','made','before','between','first','news','says','report','reports','could','market','markets','according','amid','analysis','article','articles']);
    const allText = data.articles.map(a => `${a.title} ${a.ai_summary || ''}`).join(' ').toLowerCase();
    const words = allText.match(/\b[a-z]{4,}\b/g) || [];
    const freq = {};
    words.forEach(w => { if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 25);
  })() : [];

  return (
    <div className="app-shell">
      {/* ═══════════════════════════════════════════════════════
          LEFT SIDEBAR — Branding + Search History
          ═══════════════════════════════════════════════════════ */}
      <aside className="sidebar-left">
        {/* Logo */}
        <div className="p-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--accent-blue)] rounded-lg flex items-center justify-center">
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white">NEXUS<span className="text-[var(--accent-blue)]">AI</span></h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">Intelligence Platform</p>
            </div>
          </div>
        </div>

        {/* Search History */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center gap-2 mb-4 text-[var(--text-muted)]">
            <History size={14} />
            <span className="text-xs font-bold uppercase tracking-widest">Search History</span>
          </div>

          {searchHistory.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={24} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
              <p className="text-xs text-[var(--text-muted)]">Your searches will appear here</p>
            </div>
          ) : (
            <div className="space-y-1">
              {searchHistory.map((h, i) => (
                <button
                  key={i}
                  onClick={() => handleHistoryClick(h.topic)}
                  className="w-full text-left p-3 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors truncate">
                      {h.topic}
                    </span>
                    <ChevronRight size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[var(--text-muted)]">{h.articles} articles</span>
                    <span className="text-[10px] text-[var(--text-muted)]">•</span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="p-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
            <span className="text-[11px] text-[var(--text-muted)] font-medium">System Online — {data ? `${data.total_articles} docs loaded` : 'Ready'}</span>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════
          MAIN CANVAS — Dashboard Content
          ═══════════════════════════════════════════════════════ */}
      <main className={`main-canvas ${isChatOpen ? '' : ''}`}>
        <div className="max-w-[1400px] mx-auto px-6 py-6">

          {/* ── Top Bar: Search + Chat Toggle ─────────────── */}
          <div className="flex items-center gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search topics... e.g., Semiconductors, AI Regulation, Oil Markets"
                  className="w-full input-dark pl-11 pr-4 py-3 text-sm font-medium"
                />
              </div>
              <button disabled={loading} className="btn-primary px-6 py-3 text-sm flex items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <><Search size={16} /> Analyze</>}
              </button>
            </form>

            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="p-3 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-secondary)]"
              title={isChatOpen ? "Hide Chat" : "Show Chat"}
            >
              {isChatOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            </button>
          </div>

          {/* ── Loading / Error ────────────────────────────── */}
          {loading && progressMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-3 p-4 rounded-lg bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 text-[var(--accent-blue)]"
            >
              <Loader2 className="animate-spin" size={16} />
              <span className="text-sm font-semibold">{progressMsg}</span>
            </motion.div>
          )}

          {error && (
            <div className="mb-6 flex items-center gap-2 p-4 rounded-lg bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 text-[var(--accent-red)]">
              <AlertCircle size={16} />
              <span className="text-sm font-semibold">{error}</span>
            </div>
          )}

          {/* ── Welcome State ─────────────────────────────── */}
          {!data && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <div className="w-16 h-16 bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 rounded-2xl flex items-center justify-center mb-6">
                <Zap size={28} className="text-[var(--accent-blue)]" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-3 text-white">Nexus Intelligence Platform</h2>
              <p className="text-[var(--text-secondary)] max-w-lg text-sm leading-relaxed mb-8">
                Enter a topic above to initiate a deep intelligence crawl. Nexus scrapes live news, runs Groq AI analysis, generates impact chains via LangGraph, and cross-validates with VADER sentiment — all in under 30 seconds.
              </p>
              <div className="flex gap-3 text-xs">
                {['Semiconductors', 'AI Regulation', 'Oil Markets', 'Federal Reserve'].map(t => (
                  <button key={t} onClick={() => { setQuery(t); }} className="px-4 py-2 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors font-semibold">
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════
              DASHBOARD CONTENT (when data is loaded)
              ═══════════════════════════════════════════════════ */}
          <AnimatePresence>
            {data && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* ── Context Banner (Phase 10) ─────────────── */}
                {data.user_context && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-4 bg-[var(--accent-purple)]/5 border-[var(--accent-purple)]/20"
                  >
                    <div className="flex items-center gap-2">
                      <Search size={14} className="text-[var(--accent-purple)]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-purple)]">Context-Focused Analysis</span>
                    </div>
                    <p className="text-sm text-[var(--text-primary)] mt-1.5 font-medium">
                      &ldquo;{data.user_context}&rdquo;
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      Searched: <span className="text-[var(--accent-blue)]">{data.topic}</span> • Executive briefing and conclusions are focused on your specific question.
                    </p>
                  </motion.div>
                )}

                {/* ── KPI Strip ─────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="card p-5">
                    <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                      <Globe size={14} />
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Articles</span>
                    </div>
                    <div className="text-3xl font-extrabold text-white">{data.total_articles}</div>
                  </div>
                  <div className="card p-5">
                    <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                      <Activity size={14} />
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Sentiment</span>
                    </div>
                    <div className={`text-3xl font-extrabold ${
                      data.dominant_sentiment === 'Positive' ? 'text-[var(--accent-green)]' :
                      data.dominant_sentiment === 'Negative' ? 'text-[var(--accent-red)]' :
                      'text-[var(--text-secondary)]'
                    }`}>
                      {data.dominant_sentiment}
                    </div>
                  </div>
                  <div className="card p-5">
                    <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                      <Shield size={14} />
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Divergences</span>
                    </div>
                    <div className="text-3xl font-extrabold text-[var(--accent-amber)]">{divergentCount}</div>
                  </div>
                  <div className="card p-5">
                    <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                      <Layers size={14} />
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Impact Chains</span>
                    </div>
                    <div className="text-3xl font-extrabold text-[var(--accent-purple)]">
                      {data.articles.filter(a => a.impact_chain?.length === 3).length}
                    </div>
                  </div>
                </div>

                {/* ── Master Impact Chain ────────────────────── */}
                {data.master_impact_chain && data.master_impact_chain.length === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6 bg-gradient-to-r from-[#1a1d28] via-[#1e2235] to-[#1a1d28] border-[var(--accent-amber)]/20"
                  >
                    <div className="section-header border-b-0 mb-4 pb-0">
                      <Zap size={18} className="text-[var(--accent-amber)]" fill="currentColor" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--accent-amber)]">Master Impact Chain</h3>
                      <span className="ml-auto badge badge-warning">Macro Synthesis</span>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-3 py-2">
                      <div className="impact-step bg-[var(--accent-red)]/15 text-[#f87171] border border-[var(--accent-red)]/20 flex-1 min-w-[180px]">
                        {data.master_impact_chain[0]}
                      </div>
                      <ArrowRight size={18} className="text-[var(--accent-amber)] rotate-90 md:rotate-0 shrink-0" />
                      <div className="impact-step bg-[var(--accent-amber)]/15 text-[#fbbf24] border border-[var(--accent-amber)]/20 flex-1 min-w-[180px]">
                        {data.master_impact_chain[1]}
                      </div>
                      <ArrowRight size={18} className="text-[var(--accent-amber)] rotate-90 md:rotate-0 shrink-0" />
                      <div className="impact-step bg-[var(--accent-purple)]/15 text-[#a78bfa] border border-[var(--accent-purple)]/20 flex-1 min-w-[180px]">
                        ⚠ {data.master_impact_chain[2]}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Executive Briefing + Sentiment ─────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 card p-6">
                    <div className="section-header">
                      <FileText size={18} className="text-[var(--accent-blue)]" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Briefing</h3>
                    </div>
                    <div
                      className="text-sm text-[var(--text-primary)] leading-relaxed font-medium [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_li]:leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: data.executive_summary }}
                    />
                    <div className="mt-6 pt-5 border-t border-[var(--border-subtle)]">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap size={14} className="text-[var(--accent-blue)]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Strategic Conclusion</span>
                      </div>
                      <div
                        className="text-sm text-[var(--text-primary)] leading-relaxed font-medium [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_li]:leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: data.market_conclusion }}
                      />
                    </div>
                  </div>

                  {/* Sentiment + Keywords */}
                  <div className="card p-6">
                    <div className="section-header">
                      <PieChart size={18} className="text-[var(--accent-blue)]" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Sentiment Profile</h3>
                    </div>
                    <div className="w-48 h-48 mx-auto mb-6">
                      <Pie
                        data={sentimentData}
                        options={{ plugins: { legend: { position: 'bottom', labels: { color: '#9ca3b4', font: { weight: '600', size: 11 }, padding: 12 } } } }}
                      />
                    </div>
                    <div className="border-t border-[var(--border-subtle)] pt-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 block">Core Entities</span>
                      <div className="flex flex-wrap gap-2">
                        {data.top_keywords.map((kw, i) => (
                          <span key={i} className="badge badge-info">{kw}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Analytics Grid ────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Word Cloud */}
                  <div className="card p-6">
                    <div className="section-header">
                      <Globe size={18} className="text-[var(--accent-cyan)]" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Topic Cloud</h3>
                    </div>
                    <div className="min-h-[220px] flex flex-wrap items-center justify-center gap-2 p-4">
                      {wordCloudData.map(([word, count], i) => {
                        const maxFreq = wordCloudData[0]?.[1] || 1;
                        const size = Math.max(12, Math.min(36, (count / maxFreq) * 36));
                        const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
                        return (
                          <span
                            key={i}
                            className="font-bold uppercase inline-block cursor-default transition-all hover:scale-110 hover:opacity-100"
                            style={{ fontSize: `${size}px`, color: colors[i % colors.length], opacity: 0.5 + (count / maxFreq) * 0.5 }}
                            title={`${word}: ${count}`}
                          >
                            {word}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Source Distribution */}
                  <div className="card p-6">
                    <div className="section-header">
                      <BarChart3 size={18} className="text-[var(--accent-blue)]" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Source Distribution</h3>
                    </div>
                    <div className="p-2">
                      <Bar
                        data={{
                          labels: [...new Set(data.articles.map(a => a.source))],
                          datasets: [{
                            label: 'Articles',
                            data: [...new Set(data.articles.map(a => a.source))].map(
                              src => data.articles.filter(a => a.source === src).length
                            ),
                            backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444'],
                            borderColor: 'transparent',
                            borderWidth: 0,
                            borderRadius: 4,
                          }]
                        }}
                        options={{
                          indexAxis: 'y',
                          plugins: { legend: { display: false } },
                          scales: {
                            x: { ticks: { font: { weight: '600' } }, grid: { color: '#2a2e3d' } },
                            y: { ticks: { font: { weight: '700', size: 12 } }, grid: { display: false } }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Article Timeline */}
                  <div className="card p-6">
                    <div className="section-header">
                      <TrendingUp size={18} className="text-[var(--accent-green)]" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Article Timeline</h3>
                    </div>
                    <div className="space-y-2.5">
                      {(() => {
                        const articlesWithDates = data.articles
                          .map((a, idx) => {
                            let d = null;
                            try { d = new Date(a.date); if (isNaN(d)) d = null; } catch { d = null; }
                            return { ...a, parsedDate: d, idx };
                          })
                          .filter(a => a.parsedDate)
                          .sort((a, b) => b.parsedDate - a.parsedDate);

                        if (articlesWithDates.length === 0) {
                          return <div className="text-center text-[var(--text-muted)] text-xs py-8">No parseable dates</div>;
                        }

                        const now = new Date();
                        return articlesWithDates.slice(0, 8).map((a, i) => {
                          const hoursAgo = Math.round((now - a.parsedDate) / (1000 * 60 * 60));
                          const label = hoursAgo < 1 ? 'Now' : hoursAgo < 24 ? `${hoursAgo}h` : `${Math.round(hoursAgo / 24)}d`;
                          const barWidth = Math.max(10, 100 - (hoursAgo / 168) * 80);
                          return (
                            <div key={i} className="flex items-center gap-2.5">
                              <span className="text-[10px] font-bold w-8 text-right text-[var(--text-muted)]">{label}</span>
                              <div className="flex-1 bg-[var(--bg-elevated)] h-5 rounded overflow-hidden">
                                <div className="h-full bg-[var(--accent-blue)] rounded transition-all duration-500 opacity-70" style={{ width: `${barWidth}%` }} />
                              </div>
                              <span className="text-[10px] font-medium text-[var(--text-muted)] w-28 truncate">{a.title.substring(0, 25)}…</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Opinion Divergence */}
                  <div className="card p-6">
                    <div className="section-header">
                      <AlertCircle size={18} className="text-[var(--accent-amber)]" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Opinion Divergence</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border-subtle)]">
                            <th className="pb-2 text-left font-bold uppercase tracking-wider text-[var(--text-muted)]">Article</th>
                            <th className="pb-2 text-center font-bold uppercase tracking-wider text-[var(--text-muted)]">AI</th>
                            <th className="pb-2 text-center font-bold uppercase tracking-wider text-[var(--text-muted)]">VADER</th>
                            <th className="pb-2 text-center font-bold uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.articles.map((a, i) => (
                            <tr key={i} className={`border-b border-[var(--border-subtle)]/50 ${a.sentiment_divergence ? 'bg-[var(--accent-amber)]/5' : ''}`}>
                              <td className="py-2.5 pr-2 font-medium text-[var(--text-primary)] max-w-[160px] truncate">{a.title.substring(0, 30)}{a.title.length > 30 ? '…' : ''}</td>
                              <td className="py-2.5 text-center">
                                <span className={`badge ${a.sentiment === 'Positive' ? 'badge-positive' : a.sentiment === 'Negative' ? 'badge-negative' : 'badge-neutral'}`}>{a.sentiment}</span>
                              </td>
                              <td className="py-2.5 text-center">
                                <span className={`badge ${a.heuristic_sentiment === 'Positive' ? 'badge-positive' : a.heuristic_sentiment === 'Negative' ? 'badge-negative' : 'badge-neutral'}`}>{a.heuristic_sentiment || 'N/A'}</span>
                              </td>
                              <td className="py-2.5 text-center">
                                {a.sentiment_divergence ? (
                                  <span className="badge badge-warning">⚠ Split</span>
                                ) : (
                                  <span className="badge badge-positive">✓ Aligned</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* ── Articles Table ────────────────────────── */}
                <div className="card overflow-hidden">
                  <div className="p-5 border-b border-[var(--border-subtle)] flex items-center gap-3">
                    <FileText size={18} className="text-[var(--accent-blue)]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Source Intelligence Data</h3>
                    <span className="ml-auto badge badge-info">{data.total_articles} sources</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                          <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Source Article</th>
                          <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] w-24">Vector</th>
                          <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">AI Analysis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.articles.map((a, i) => (
                          <tr key={i} className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-elevated)]/50 transition-colors">
                            <td className="px-5 py-4 w-1/3">
                              <a href={a.url} target="_blank" className="font-semibold text-sm text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition-colors block mb-2 leading-snug">
                                {a.title}
                              </a>
                              <div className="flex gap-2">
                                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)]">{a.source}</span>
                                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">{a.category}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <span className={`badge ${a.sentiment === 'Positive' ? 'badge-positive' : a.sentiment === 'Negative' ? 'badge-negative' : 'badge-neutral'}`}>{a.sentiment}</span>
                              {a.sentiment_divergence && (
                                <span className="badge badge-warning mt-1 block w-fit">⚠ Divergent</span>
                              )}
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="text-xs font-bold text-[var(--accent-blue)] mb-1.5 uppercase tracking-wide">
                                {a.insight_headline}
                              </div>
                              <div className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                                {a.ai_summary}
                              </div>
                              {a.impact_chain && a.impact_chain.length === 3 && (
                                <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]/50">
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-purple)] mb-1.5 flex items-center gap-1">
                                    <Zap size={10} /> Impact Chain
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                                    <span className="px-2 py-1 rounded bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]">{a.impact_chain[0]}</span>
                                    <ArrowRight size={12} className="text-[var(--text-muted)]" />
                                    <span className="px-2 py-1 rounded bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]">{a.impact_chain[1]}</span>
                                    <ArrowRight size={12} className="text-[var(--text-muted)]" />
                                    <span className="px-2 py-1 rounded bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] border border-[var(--accent-amber)]/20">⚠ {a.impact_chain[2]}</span>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════
          RIGHT SIDEBAR — RAG Chat
          ═══════════════════════════════════════════════════════ */}
      <aside className={`sidebar-right ${isChatOpen ? '' : 'collapsed'}`}>
        {/* Chat Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-3">
          <MessageSquare size={18} className="text-[var(--accent-blue)]" />
          <div>
            <h3 className="text-sm font-bold text-white">Nexus RAG Agent</h3>
            <p className="text-[10px] text-[var(--text-muted)]">Ask questions about the analysis</p>
          </div>
          <button onClick={() => setIsChatOpen(false)} className="ml-auto p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!data && (
            <div className="text-center py-12">
              <MessageSquare size={28} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
              <p className="text-xs text-[var(--text-muted)]">Run a search to start chatting</p>
            </div>
          )}
          {data && chatHistory.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-[var(--text-muted)] mb-4">Ask me anything about the analysis results</p>
              <div className="space-y-2 text-left">
                {['What are the key risks?', 'Which companies are affected?', 'Summarize the sentiment trends'].map(q => (
                  <button
                    key={q}
                    onClick={() => { setChatInput(q); }}
                    className="w-full text-left px-3 py-2 rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] p-3 rounded-lg text-xs font-medium leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[var(--accent-blue)] text-white'
                  : msg.role === 'error'
                  ? 'bg-[var(--accent-red)]/15 text-[var(--accent-red)] border border-[var(--accent-red)]/20'
                  : msg.fallback
                  ? 'bg-[var(--accent-cyan)]/10 text-[var(--text-primary)] border border-[var(--accent-cyan)]/20'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}>
                {msg.fallback && (
                  <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-[var(--border-subtle)]/50">
                    <Globe size={10} className="text-[var(--accent-cyan)]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-cyan)]">Live Web Search</span>
                  </div>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex justify-start">
              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Loader2 size={12} className="animate-spin" /> Thinking...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <form onSubmit={handleChatSubmit} className="p-3 border-t border-[var(--border-subtle)] flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder={data ? "Ask about the analysis..." : "Run a search first..."}
            disabled={!data}
            className="flex-1 input-dark px-3 py-2.5 text-xs font-medium"
          />
          <button
            type="submit"
            disabled={isChatLoading || !chatInput.trim() || !data}
            className="btn-primary p-2.5"
          >
            <Send size={14} />
          </button>
        </form>
      </aside>
    </div>
  );
}
