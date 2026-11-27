import React, { useEffect, useMemo, useRef, useState } from "react";
import Mascot from "./Mascot";
import {
  AUTO_MODEL,
  GEMINI_MODELS,
  generateTaSchedReply,
  testGeminiKey,
  type AISettings,
  type ChatMessage,
  type GeminiImage,
  type TaSchedContext,
} from "../services/taschedAI";

const STORAGE_MESSAGES = "tasched.ai.messages";
const STORAGE_SETTINGS = "tasched.ai.settings";
const STORAGE_API_KEY = "tasched.ai.geminiKey";
const STORAGE_TOKENS = "tasched.ai.tokens";
const STORAGE_POS = "tasched.ai.position";

const THINKING_PHRASES = [
  "Checking your schedule...",
  "Reviewing upcoming tasks...",
  "Analyzing time slots...",
  "Thinking...",
];

const SUGGESTIONS = [
  { label: "Morning briefing", prompt: "Give me my morning briefing for today." },
  { label: "Next class", prompt: "What's my next class and when does it start?" },
  { label: "Upcoming tasks", prompt: "List my upcoming tasks and deadlines." },
  { label: "Check conflicts", prompt: "Do I have any schedule conflicts?" },
];

const QUICK_ACTIONS = [
  { label: "What's next?", prompt: "What's my next class?" },
  { label: "Free slots", prompt: "What are my free study slots today?" },
  { label: "Due tasks", prompt: "What tasks are due soon?" },
  { label: "Daily briefing", prompt: "Give me a summary of my day." },
];

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/* ---------- Lightweight Markdown Renderer (mirroring GabAI MarkdownText) ---------- */
function inlineRuns(line: string): React.ReactNode[] {
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(_[^_\n]+_)/g;
  const result: React.ReactNode[] = [];
  let offset = 0;
  let index = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(line))) {
    if (match.index > offset) result.push(line.slice(offset, match.index));
    const value = match[0];
    const key = `${match.index}-${index++}`;
    if (value.startsWith("`")) {
      result.push(
        <code key={key} className="fai-inline-code">
          {value.slice(1, -1)}
        </code>,
      );
    } else if (value.startsWith("**")) {
      result.push(<strong key={key}>{value.slice(2, -2)}</strong>);
    } else {
      result.push(<em key={key}>{value.slice(1, -1)}</em>);
    }
    offset = match.index + value.length;
  }
  if (offset < line.length) result.push(line.slice(offset));
  return result;
}

function MarkdownText({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (!paragraph.length) return;
    nodes.push(
      <p key={`p-${nodes.length}`} className="fai-md-p">
        {paragraph.map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {inlineRuns(line)}
          </React.Fragment>
        ))}
      </p>,
    );
    paragraph = [];
  };

  text.split("```").forEach((chunk, chunkIdx) => {
    if (chunkIdx % 2 === 1) {
      flush();
      const nl = chunk.indexOf("\n");
      const content = nl < 0 ? chunk : chunk.slice(nl + 1);
      nodes.push(
        <pre key={`code-${chunkIdx}`} className="fai-code-block">
          <code>{content}</code>
        </pre>,
      );
      return;
    }
    for (const line of chunk.split("\n")) {
      const heading = line.match(/^#{1,3}\s+(.*)/);
      const bullet = line.match(/^\s*[-*]\s+(.*)/);
      const numbered = line.match(/^\s*(\d+)\.\s+(.*)/);
      if (heading) {
        flush();
        nodes.push(
          <div key={`h-${nodes.length}`} className="fai-md-h">
            {inlineRuns(heading[1])}
          </div>,
        );
      } else if (bullet) {
        flush();
        nodes.push(
          <div key={`b-${nodes.length}`} className="fai-md-li">
            <span>•</span>
            <div>{inlineRuns(bullet[1])}</div>
          </div>,
        );
      } else if (numbered) {
        flush();
        nodes.push(
          <div key={`n-${nodes.length}`} className="fai-md-li">
            <span>{numbered[1]}.</span>
            <div>{inlineRuns(numbered[2])}</div>
          </div>,
        );
      } else if (!line.trim()) {
        flush();
      } else {
        paragraph.push(line);
      }
    }
  });
  flush();
  return <div className="fai-md">{nodes}</div>;
}

/* ---------- Animated Thinking Indicator ---------- */
function ThinkingIndicator() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setPhraseIndex((i) => (i + 1) % THINKING_PHRASES.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="fai-thinking" role="status" aria-label="TaSched AI is thinking">
      <div className="fai-dots">
        <span />
        <span />
        <span />
      </div>
      <small>{THINKING_PHRASES[phraseIndex]}</small>
    </div>
  );
}

/* ---------- Draggable Floating AI Chatbot Component ---------- */
export default function FloatingAIChat({
  context,
  darkMode = false,
  onAddTask,
}: {
  context: TaSchedContext;
  darkMode?: boolean;
  onAddTask?: (task: { id: string; title: string; subjectId: string; dueDate: string; done: boolean }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    readJSON<ChatMessage[]>(STORAGE_MESSAGES, []),
  );
  const [settings, setSettings] = useState<AISettings>(() =>
    readJSON<AISettings>(STORAGE_SETTINGS, {
      aiMode: "cloud",
      geminiModel: AUTO_MODEL,
      replyLength: "short",
    }),
  );
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return window.localStorage.getItem(STORAGE_API_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [tokensUsed, setTokensUsed] = useState<number>(() =>
    readJSON<number>(STORAGE_TOKENS, 0),
  );
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<{ image: GeminiImage; preview: string } | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [keyTestStatus, setKeyTestStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testingKey, setTestingKey] = useState(false);
  const [showHint, setShowHint] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem("tasched.ai.hintDismissed") !== "1";
    } catch {
      return true;
    }
  });

  const dismissHint = () => {
    setShowHint(false);
    try {
      window.localStorage.setItem("tasched.ai.hintDismissed", "1");
    } catch {}
  };

  const abortRef = useRef<AbortController | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* --- Full-Screen Draggable Positioning --- */
  const FAB_SIZE = 66;
  const getWinDims = () => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 400;
    const vh = typeof window !== "undefined" ? window.innerHeight : 700;
    return {
      w: Math.min(360, Math.max(280, vw - 20)),
      h: Math.min(520, Math.max(320, vh - 96)),
    };
  };

  const clampPos = (x: number, y: number, isOpen: boolean) => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 400;
    const vh = typeof window !== "undefined" ? window.innerHeight : 700;
    const { w, h } = isOpen ? getWinDims() : { w: FAB_SIZE, h: FAB_SIZE };
    const pad = 10;
    return {
      x: Math.max(pad, Math.min(vw - w - pad, x)),
      y: Math.max(pad, Math.min(vh - h - pad, y)),
    };
  };

  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    const saved = readJSON<{ x: number; y: number } | null>(STORAGE_POS, null);
    if (saved) return clampPos(saved.x, saved.y, false);
    const vw = typeof window !== "undefined" ? window.innerWidth : 400;
    const vh = typeof window !== "undefined" ? window.innerHeight : 700;
    return { x: Math.max(12, vw - 76), y: Math.max(12, vh - 154) };
  });

  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
    isOpen: boolean;
  }>({ active: false, startX: 0, startY: 0, origX: 0, origY: 0, moved: false, isOpen: false });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_POS, JSON.stringify(pos));
    } catch {}
  }, [pos]);

  useEffect(() => {
    const onResize = () => setPos((prev) => clampPos(prev.x, prev.y, open));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d.active) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.hypot(dx, dy) > 5) d.moved = true;
      setPos(clampPos(d.origX + dx, d.origY + dy, d.isOpen));
    };
    const onUp = () => {
      dragRef.current.active = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const startDrag = (e: React.PointerEvent, isOpenDrag: boolean) => {
    if ((e.target as HTMLElement).closest("button, input, select, textarea")) {
      if (isOpenDrag) return;
    }
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
      isOpen: isOpenDrag,
    };
  };

  const toggleOpen = () => {
    if (dragRef.current.moved) {
      dismissHint();
      return;
    }
    dismissHint();
    const nextOpen = !open;
    setPos((prev) => clampPos(prev.x, prev.y, nextOpen));
    setOpen(nextOpen);
  };

  /* --- Persist Chat State --- */
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages.slice(-40)));
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_API_KEY, apiKey);
    } catch {}
  }, [apiKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_TOKENS, JSON.stringify(tokensUsed));
    } catch {}
  }, [tokensUsed]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, streaming, open]);

  const cloudReady = settings.aiMode === "cloud" && apiKey.trim().length > 0;
  const statusKind = streaming ? "busy" : cloudReady ? "ready" : "offline";

  /* --- Send & Stream Message --- */
  const sendMessage = async (overridePrompt?: string) => {
    const raw = (overridePrompt ?? input).trim();
    if ((!raw && !attachedImage) || streaming) return;

    // Quick task capture command (ASI-style quick capture): "add task: <title>"
    const quickTaskMatch = raw.match(/^add task:\s*(.+)$/i);
    if (quickTaskMatch && onAddTask) {
      const taskTitle = quickTaskMatch[1].trim();
      const todayISO = new Date().toISOString().slice(0, 10);
      onAddTask({
        id: `t-${Date.now()}`,
        title: taskTitle,
        subjectId: "",
        dueDate: todayISO,
        done: false,
      });
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      body: raw || "Analyze this attached image.",
      createdAt: Date.now(),
      imagePreview: attachedImage?.preview,
    };
    const assistantId = `a-${Date.now() + 1}`;
    const placeholder: ChatMessage = {
      id: assistantId,
      role: "assistant",
      body: "",
      createdAt: Date.now(),
    };

    const currentHistory = [...messages];
    const imagePayload = attachedImage?.image;
    setMessages((prev) => [...prev, userMsg, placeholder]);
    if (!overridePrompt) setInput("");
    setAttachedImage(null);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let accumulated = "";
      const result = await generateTaSchedReply({
        question: raw,
        history: currentHistory,
        context,
        settings,
        apiKey,
        image: imagePayload,
        signal: controller.signal,
        onToken: (token) => {
          accumulated += token;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, body: accumulated } : m)),
          );
        },
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                body: result.text || accumulated || "Stopped.",
                model: result.model,
                notice: result.notice,
              }
            : m,
        ),
      );
      if (result.usage) {
        setTokensUsed((t) => t + result.usage!.promptTokens + result.usage!.completionTokens);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not generate reply.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, body: m.body || msg, notice: "Error during generation." }
            : m,
        ),
      );
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stopGenerating = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  /* --- Image Attachment --- */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
      if (match) {
        setAttachedImage({
          image: { mimeType: match[1], data: match[2] },
          preview: dataUrl,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  /* --- Voice Dictation & Speech Output --- */
  const toggleDictation = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SpeechRec || listening) return;

    type RecInstance = {
      lang: string;
      interimResults: boolean;
      onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onerror: () => void;
      onend: () => void;
      start: () => void;
    };
    const rec = new (SpeechRec as new () => RecInstance)();
    rec.lang = "en-US";
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (ev) => {
      const transcript = ev.results?.[0]?.[0]?.transcript || "";
      if (transcript) setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  const toggleSpeak = (msg: ChatMessage) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = msg.body.replace(/[*_`#]/g, "");
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    setSpeakingId(msg.id);
    window.speechSynthesis.speak(utter);
  };

  const handleTestKey = async () => {
    if (!apiKey.trim() || testingKey) return;
    setTestingKey(true);
    setKeyTestStatus(null);
    try {
      const usedModel = await testGeminiKey(apiKey.trim(), settings.geminiModel);
      setKeyTestStatus({ ok: true, msg: `Connected (${usedModel})` });
    } catch (e) {
      setKeyTestStatus({ ok: false, msg: e instanceof Error ? e.message : "Test failed" });
    } finally {
      setTestingKey(false);
    }
  };

  const windowDims = useMemo(() => getWinDims(), [open]);

  if (!open) {
    return (
      <div
        className="floating-ai-anchor"
        style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      >
        {showHint && (
          <button
            type="button"
            className={`fai-drag-hint ${darkMode ? "is-dark" : ""}`}
            onClick={dismissHint}
          >
            💬 Drag me anywhere!
          </button>
        )}
        <button
          type="button"
          className={`floating-ai-fab ${darkMode ? "is-dark" : ""}`}
          onPointerDown={(e) => startDrag(e, false)}
          onClick={toggleOpen}
          aria-label="Open TaSched AI Assistant (drag to move)"
          title="TaSched AI • Drag to move anywhere"
        >
          <span className={`fai-status-dot status-${statusKind}`} />
          <Mascot pose="peeking-top" size={50} interactive={false} animated={false} />
        </button>
      </div>
    );
  }

  return (
    <section
      className={`floating-ai-window ${darkMode ? "is-dark" : ""}`}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${windowDims.w}px`,
        height: `${windowDims.h}px`,
      }}
      aria-label="TaSched AI Assistant"
    >
      {/* Draggable Header */}
      <header
        className="fai-header"
        onPointerDown={(e) => startDrag(e, true)}
        title="Drag to move anywhere on screen"
      >
        <div className="fai-header-left">
          <span className="fai-grip" aria-hidden="true">⋮⋮</span>
          <div className="fai-avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3 1.9 4.9L19 10l-4.1 2.1L13 17l-1.9-4.9L7 10l4.1-2.1L12 3Z" />
            </svg>
          </div>
          <div className="fai-title-wrap">
            <strong>TaSched AI</strong>
            <small>
              <i className={`fai-dot status-${statusKind}`} />
              {cloudReady ? "Gemini Cloud" : "Offline Smart"}
            </small>
          </div>
        </div>
        <div className="fai-header-actions">
          <button
            type="button"
            className={`fai-icon-btn ${showSettings ? "active" : ""}`}
            onClick={() => setShowSettings((s) => !s)}
            title="AI Settings & Gemini Key"
            aria-label="AI Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.83 2.83-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-4v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06-2.83-2.83.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3v-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06 2.83-2.83.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3h4v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 2.83 2.83-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21v4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              className="fai-icon-btn"
              onClick={() => setMessages([])}
              title="Clear chat"
              aria-label="Clear chat"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          )}
          <button
            type="button"
            className="fai-icon-btn"
            onClick={() => setOpen(false)}
            title="Minimize"
            aria-label="Minimize chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
      </header>

      {/* Settings Panel (Hybrid Cloud / Offline + Model Selector + API Key) */}
      {showSettings ? (
        <div className="fai-settings">
          <div className="fai-setting-group">
            <label>AI Mode</label>
            <div className="fai-seg">
              <button
                type="button"
                className={settings.aiMode === "cloud" ? "active" : ""}
                onClick={() => setSettings((s) => ({ ...s, aiMode: "cloud" }))}
              >
                Cloud (Gemini)
              </button>
              <button
                type="button"
                className={settings.aiMode === "offline" ? "active" : ""}
                onClick={() => setSettings((s) => ({ ...s, aiMode: "offline" }))}
              >
                Offline Smart
              </button>
            </div>
          </div>

          <div className="fai-setting-group">
            <label htmlFor="fai-api-key">Gemini API Key (saved locally)</label>
            <div className="fai-key-row">
              <input
                id="fai-api-key"
                type="password"
                placeholder="Paste AIza... key"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setKeyTestStatus(null);
                }}
              />
              <button type="button" onClick={handleTestKey} disabled={!apiKey.trim() || testingKey}>
                {testingKey ? "..." : "Test"}
              </button>
            </div>
            {keyTestStatus && (
              <small className={keyTestStatus.ok ? "fai-test-ok" : "fai-test-err"}>
                {keyTestStatus.msg}
              </small>
            )}
          </div>

          <div className="fai-setting-group">
            <label htmlFor="fai-model">Gemini Model</label>
            <select
              id="fai-model"
              value={settings.geminiModel}
              onChange={(e) => setSettings((s) => ({ ...s, geminiModel: e.target.value }))}
            >
              <option value={AUTO_MODEL}>Auto (Recommended routing)</option>
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} — {m.detail}
                </option>
              ))}
            </select>
          </div>

          <div className="fai-setting-group">
            <label>Reply Length</label>
            <div className="fai-seg">
              <button
                type="button"
                className={settings.replyLength === "short" ? "active" : ""}
                onClick={() => setSettings((s) => ({ ...s, replyLength: "short" }))}
              >
                Short
              </button>
              <button
                type="button"
                className={settings.replyLength === "detailed" ? "active" : ""}
                onClick={() => setSettings((s) => ({ ...s, replyLength: "detailed" }))}
              >
                Detailed
              </button>
            </div>
          </div>

          <div className="fai-token-footer">
            <span>Tokens used: <strong>{tokensUsed.toLocaleString()}</strong></span>
            <button type="button" onClick={() => setTokensUsed(0)}>Reset</button>
          </div>

          <button type="button" className="fai-back-chat" onClick={() => setShowSettings(false)}>
            Back to Chat
          </button>
        </div>
      ) : (
        <>
          {/* Chat Feed */}
          <div className="fai-feed" ref={feedRef}>
            {messages.length === 0 ? (
              <div className="fai-empty">
                <div className="fai-empty-badge">✦</div>
                <h4>Ask TaSched AI</h4>
                <p>
                  {cloudReady
                    ? "Connected to Gemini with auto model routing & your live schedule context."
                    : "Smart offline mode active — ask about your schedule, next class, conflicts, or add a Gemini key in ⚙️."}
                </p>
                <div className="fai-suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button key={s.label} type="button" onClick={() => sendMessage(s.prompt)}>
                      <span>{s.label}</span>
                      <span>→</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isLast = idx === messages.length - 1;
                const isThinking = msg.role === "assistant" && streaming && isLast && !msg.body;
                return (
                  <div key={msg.id} className={`fai-msg-row ${msg.role === "user" ? "is-user" : "is-ai"}`}>
                    <div className="fai-bubble">
                      {msg.imagePreview && (
                        <img src={msg.imagePreview} alt="Attached" className="fai-msg-img" />
                      )}
                      {isThinking ? (
                        <ThinkingIndicator />
                      ) : msg.role === "assistant" ? (
                        <MarkdownText text={msg.body} />
                      ) : (
                        <p className="fai-user-text">{msg.body}</p>
                      )}
                      {msg.role === "assistant" && msg.body && (
                        <div className="fai-msg-meta">
                          <span>{msg.model || "TaSched AI"}</span>
                          <button
                            type="button"
                            onClick={() => toggleSpeak(msg)}
                            title={speakingId === msg.id ? "Stop speaking" : "Read aloud"}
                            aria-label="Read aloud"
                          >
                            {speakingId === msg.id ? "⏹ Stop" : "🔊 Listen"}
                          </button>
                        </div>
                      )}
                      {msg.notice && <div className="fai-notice">{msg.notice}</div>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Follow-up Chips */}
          <div className="fai-quick-strip">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.label}
                type="button"
                disabled={streaming}
                onClick={() => sendMessage(qa.prompt)}
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* Attached Image Preview */}
          {attachedImage && (
            <div className="fai-attach-preview">
              <img src={attachedImage.preview} alt="Preview" />
              <span>Image attached</span>
              <button type="button" onClick={() => setAttachedImage(null)} aria-label="Remove image">
                ×
              </button>
            </div>
          )}

          {/* Input Composer */}
          <div className="fai-composer">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="fai-comp-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image (notes/schedule)"
              aria-label="Attach image"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </button>
            <button
              type="button"
              className={`fai-comp-btn ${listening ? "is-listening" : ""}`}
              onClick={toggleDictation}
              title="Voice input"
              aria-label="Voice input"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
              </svg>
            </button>
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={listening ? "Listening..." : "Ask schedule, tasks, or study help..."}
            />
            {streaming ? (
              <button
                type="button"
                className="fai-send-btn is-stop"
                onClick={stopGenerating}
                title="Stop generating"
                aria-label="Stop"
              >
                ■
              </button>
            ) : (
              <button
                type="button"
                className="fai-send-btn"
                disabled={!input.trim() && !attachedImage}
                onClick={() => sendMessage()}
                title="Send"
                aria-label="Send message"
              >
                ↑
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
