/**
 * TaSched AI Engine
 * Implements the hybrid Cloud (Gemini SSE streaming + auto model routing + fallback)
 * and Offline Smart Assistant architecture inspired by b0urbonn/GabAI & ASI.
 */

export type AIMode = "cloud" | "offline";
export type ReplyLength = "short" | "detailed";

export interface GeminiImage {
  mimeType: string;
  data: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  body: string;
  createdAt: number;
  imagePreview?: string;
  model?: string;
  notice?: string;
}

export interface TaSchedContext {
  role: "student" | "instructor";
  userName: string;
  term: {
    academicYear: string;
    semester: string;
    startDate: string;
    endDate: string;
  };
  classes: {
    id: string;
    name: string;
    code: string;
    section: string;
    instructor: string;
    days: string[];
    start: string;
    end: string;
    room: string;
    type: string;
  }[];
  tasks: {
    id: string;
    title: string;
    subjectId: string;
    dueDate: string;
    done: boolean;
  }[];
}

export interface AISettings {
  aiMode: AIMode;
  geminiModel: string;
  replyLength: ReplyLength;
}

export const AUTO_MODEL = "auto";

export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", detail: "Balanced & fast", thinking: "low" as const, vision: true },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite", detail: "Fastest, lowest quota", thinking: "minimal" as const, vision: true },
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash", detail: "Best quality", thinking: "low" as const, vision: true },
  { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash", detail: "Balanced", thinking: "minimal" as const, vision: true },
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite", detail: "Fastest", thinking: "minimal" as const, vision: true },
] as const;

const MODEL_PREFERENCE = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.8-flash",
];

const MODELS_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000";
const TIMEOUT_MS = 60_000;
const MODELS_TIMEOUT_MS = 15_000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_OUTPUT_TOKENS = 2048;
const HISTORY_LIMIT = 10;

const NON_CHAT_MODEL = /(tts|image|imagen|veo|embedding|aqa|robotics|computer-use|native-audio)/i;
const NON_VISION_PATTERN = /embedding|aqa|tts|native-audio|imagen|veo|robotics|gemini-1\.0|text-/i;
const COMPLEX_REQUEST = /\b(prove|step[- ]by[- ]step|analy[sz]e|debug|refactor|algorithm|derive|essay|in[- ]depth|detailed|compare|explain why|study plan|schedule)\b/i;

type ListedModel = { name?: string; supportedGenerationMethods?: string[] };
let modelCache: { key: string; at: number; models: string[] } | null = null;
const cooldowns = new Map<string, Map<string, number>>();

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly kind: "auth" | "quota" | "network" | "timeout" | "other",
    readonly status?: number,
  ) {
    super(message);
  }
}

const modelBucket = (model: string) => model.replace(/^models\//, "").replace(/-\d{3}$/, "");

export function getModelInfo(id: string) {
  return GEMINI_MODELS.find((m) => m.id === id);
}

export function modelLabel(id: string): string {
  return getModelInfo(id)?.label ?? id.replace(/^models\//, "");
}

export function supportsVision(id: string): boolean {
  return getModelInfo(id)?.vision ?? !NON_VISION_PATTERN.test(id);
}

export function markGeminiModelUnavailable(apiKey: string, model: string, status: number) {
  const health = cooldowns.get(apiKey) ?? new Map<string, number>();
  cooldowns.set(apiKey, health);
  const duration = status === 404 ? CACHE_TTL_MS : status === 429 ? 60 * 1000 : 30 * 1000;
  health.set(modelBucket(model), Date.now() + duration);
  if (status === 404) modelCache = null;
}

function isOnCooldown(apiKey: string, model: string): boolean {
  const health = cooldowns.get(apiKey);
  if (!health) return false;
  const until = health.get(modelBucket(model));
  if (!until) return false;
  if (Date.now() >= until) {
    health.delete(modelBucket(model));
    return false;
  }
  return true;
}

export async function fetchAvailableModels(apiKey: string): Promise<string[] | null> {
  if (modelCache && modelCache.key === apiKey && Date.now() - modelCache.at < CACHE_TTL_MS) {
    return modelCache.models;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODELS_TIMEOUT_MS);
  try {
    const response = await fetch(MODELS_ENDPOINT, {
      headers: { "x-goog-api-key": apiKey },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { models?: ListedModel[] };
    const callable = (body.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name?.replace(/^models\//, ""))
      .filter((name): name is string => typeof name === "string" && !NON_CHAT_MODEL.test(name));
    const rest = callable.filter((id) => !MODEL_PREFERENCE.includes(id)).sort();
    const models = [...MODEL_PREFERENCE.filter((id) => callable.includes(id)), ...rest];
    modelCache = { key: apiKey, at: Date.now(), models };
    return models;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveModelCandidates(
  apiKey: string,
  configured: string,
  options: { needsVision?: boolean; question?: string; historyText?: string } = {},
): Promise<string[]> {
  const needsVision = options.needsVision ?? false;
  const available = await fetchAvailableModels(apiKey);
  const candidates = available?.length ? available : MODEL_PREFERENCE;
  const mediaSupported = (m: string) => !needsVision || supportsVision(m);
  const filtered = candidates.filter(mediaSupported);
  const pool = filtered.length ? filtered : candidates;

  let primary: string | undefined;
  if (configured === AUTO_MODEL) {
    const allText = `${options.question ?? ""} ${options.historyText ?? ""}`;
    const isComplex =
      (options.question?.length ?? 0) > 1500 ||
      (options.historyText?.length ?? 0) > 20_000 ||
      Boolean(options.question?.includes("```")) ||
      COMPLEX_REQUEST.test(allText);

    primary = isComplex
      ? pool.find((id) => /-pro(?:-|$)/i.test(id)) ?? pool.find((id) => /flash(?!-lite)/i.test(id))
      : needsVision
        ? pool.find((id) => /flash(?!-lite)/i.test(id))
        : (options.question?.trim().length ?? 0) < 60
          ? pool.find((id) => /flash-lite/i.test(id)) ?? pool.find((id) => /flash/i.test(id))
          : pool.find((id) => /flash(?!-lite)/i.test(id));
  } else {
    primary = pool.includes(configured) ? configured : pool[0];
  }

  const ordered = [
    ...(primary ? [primary] : []),
    ...pool.filter((id) => id !== primary),
  ];

  const healthy = ordered.filter((id) => !isOnCooldown(apiKey, id));
  return healthy.length ? healthy : ordered;
}

type GeminiErrorBody = { error?: { message?: string; status?: string; details?: { reason?: string }[] } };
type GeminiUsageBody = { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number } };

function trimApiMessage(message: string): string {
  return message.replace(/\s+/g, " ").slice(0, 160).trim();
}

function mapError(status: number, body: GeminiErrorBody): GeminiError {
  const apiMessage = body.error?.message;
  const keyInvalid =
    apiMessage?.includes("API_KEY_INVALID") ||
    body.error?.status === "API_KEY_INVALID" ||
    body.error?.details?.some((d) => d.reason === "API_KEY_INVALID");
  if ((status === 400 && keyInvalid) || status === 401 || status === 403) {
    return new GeminiError("This API key was rejected. Check that you copied it correctly.", "auth", status);
  }
  if (status === 429) {
    return new GeminiError("Gemini free-tier limit reached. Switching or try again shortly.", "quota", status);
  }
  if (status === 404 || (apiMessage && /not found|not supported|generateContent/i.test(apiMessage))) {
    return new GeminiError("That model cannot answer right now. Falling back.", "other", status);
  }
  return new GeminiError(
    apiMessage ? trimApiMessage(apiMessage) : `Gemini request failed (HTTP ${status}).`,
    "other",
    status,
  );
}

export async function generateGemini({
  apiKey,
  model,
  system,
  history,
  signal,
  onToken,
}: {
  apiKey: string;
  model: string;
  system: string;
  history: { role: "user" | "assistant"; text: string; image?: GeminiImage }[];
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}): Promise<{ text: string; usage: TokenUsage }> {
  if (signal?.aborted) return { text: "", usage: { promptTokens: 0, completionTokens: 0 } };
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);
  const abortRequest = () => controller.abort();
  signal?.addEventListener("abort", abortRequest, { once: true });

  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let full = "";
  const usage: TokenUsage = { promptTokens: 0, completionTokens: 0 };

  try {
    const contents = history.map((msg) => {
      const parts: ({ text: string } | { inlineData: GeminiImage })[] = [];
      if (msg.image) parts.push({ inlineData: msg.image });
      if (msg.text) parts.push({ text: msg.text });
      if (!parts.length) parts.push({ text: "" });
      return {
        role: msg.role === "assistant" ? "model" : "user",
        parts,
      };
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: {
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            temperature: 0.45,
          },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as GeminiErrorBody;
      throw mapError(response.status, body);
    }
    if (!response.body) throw new GeminiError("Gemini returned an empty response stream.", "other");

    reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let emptyReason: string | undefined;

    const handleLine = (line: string) => {
      if (!line.startsWith("data:")) return;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") return;
      let body: GeminiErrorBody &
        GeminiUsageBody & {
          promptFeedback?: { blockReason?: string };
          candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[];
        };
      try {
        body = JSON.parse(payload) as typeof body;
      } catch {
        return;
      }
      if (body.error) throw mapError(Number((body.error as { code?: number }).code) || 500, body);
      if (body.usageMetadata) {
        usage.promptTokens = body.usageMetadata.promptTokenCount ?? usage.promptTokens;
        usage.completionTokens =
          (body.usageMetadata.candidatesTokenCount ?? 0) + (body.usageMetadata.thoughtsTokenCount ?? 0);
      }
      const candidate = body.candidates?.[0];
      if (candidate?.finishReason || body.promptFeedback?.blockReason) {
        emptyReason = body.promptFeedback?.blockReason ?? candidate?.finishReason;
      }
      for (const part of candidate?.content?.parts ?? []) {
        if (typeof part.text !== "string" || !part.text || part.thought) continue;
        full += part.text;
        onToken?.(part.text);
      }
    };

    while (!signal?.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline).replace(/\r$/, "");
        buffer = buffer.slice(newline + 1);
        handleLine(line);
      }
    }
    buffer += decoder.decode();
    if (buffer) handleLine(buffer.replace(/\r$/, ""));
    if (signal?.aborted) return { text: full.trim(), usage };
    if (!full.trim()) {
      throw new GeminiError(
        emptyReason ? `Gemini returned no answer (${emptyReason}).` : "Gemini returned an empty reply.",
        "other",
      );
    }
    return { text: full.trim(), usage };
  } catch (error) {
    if (signal?.aborted) return { text: full.trim(), usage };
    if (timedOut) throw new GeminiError(`Gemini took longer than ${TIMEOUT_MS / 1000}s to answer.`, "timeout");
    if (error instanceof GeminiError) throw error;
    const detail = error instanceof Error && error.message ? ` (${error.message})` : "";
    throw new GeminiError(`Cannot reach Gemini. Check your internet connection.${detail}`, "network");
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortRequest);
    if (reader) {
      try {
        await reader.cancel();
      } catch {}
      reader.releaseLock();
    }
  }
}

export async function testGeminiKey(apiKey: string, model: string): Promise<string> {
  const candidates = await resolveModelCandidates(apiKey, model);
  const chosen = candidates[0] || "gemini-2.5-flash";
  await generateGemini({
    apiKey,
    model: chosen,
    system: "You are a connectivity test.",
    history: [{ role: "user", text: "Reply with OK." }],
  });
  return chosen;
}

/* ---------- Helper Formatters & Offline Deterministic Engine ---------- */

const DAY_NAMES: Record<string, string> = {
  Su: "Sunday",
  Mo: "Monday",
  Tu: "Tuesday",
  We: "Wednesday",
  Th: "Thursday",
  Fr: "Friday",
  Sa: "Saturday",
};

const DAY_NUMS: Record<string, number> = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };

function fmtTime(value: string): string {
  if (!value) return "";
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function fmtDate(value: string): string {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function findConflicts(classes: TaSchedContext["classes"]) {
  const conflicts: { a: TaSchedContext["classes"][0]; b: TaSchedContext["classes"][0]; sharedDays: string[] }[] = [];
  for (let i = 0; i < classes.length; i++) {
    for (let j = i + 1; j < classes.length; j++) {
      const a = classes[i];
      const b = classes[j];
      const sharedDays = a.days.filter((d) => b.days.includes(d));
      if (sharedDays.length && a.start < b.end && a.end > b.start) {
        conflicts.push({ a, b, sharedDays });
      }
    }
  }
  return conflicts;
}

function getNextClass(classes: TaSchedContext["classes"]) {
  const now = new Date();
  return classes
    .flatMap((item) =>
      item.days.map((day) => {
        const occ = new Date(now);
        const daysAhead = (DAY_NUMS[day] - now.getDay() + 7) % 7;
        const [hour, minute] = item.start.split(":").map(Number);
        occ.setDate(now.getDate() + daysAhead);
        occ.setHours(hour, minute, 0, 0);
        if (occ <= now) occ.setDate(occ.getDate() + 7);
        return { item, day, occurrence: occ };
      }),
    )
    .sort((a, b) => a.occurrence.getTime() - b.occurrence.getTime())[0];
}

function buildSystemPrompt(context: TaSchedContext, replyLength: ReplyLength, hasImage: boolean): string {
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const classLines = context.classes.length
    ? context.classes
        .map(
          (c) =>
            `- ${c.code ? `[${c.code}] ` : ""}${c.name} (${c.type || "Class"}) | Days: ${c.days.join(", ")} | Time: ${fmtTime(c.start)}–${fmtTime(c.end)} | Room: ${c.room || "TBA"} | Instructor: ${c.instructor || "TBA"}`,
        )
        .join("\n")
    : "No classes added yet.";

  const conflicts = findConflicts(context.classes);
  const conflictLines = conflicts.length
    ? conflicts.map((cf) => `- CONFLICT on ${cf.sharedDays.join("/")}: ${cf.a.name} (${fmtTime(cf.a.start)}-${fmtTime(cf.a.end)}) overlaps with ${cf.b.name} (${fmtTime(cf.b.start)}-${fmtTime(cf.b.end)})`).join("\n")
    : "No schedule conflicts detected.";

  const pendingTasks = context.tasks.filter((t) => !t.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const doneTasks = context.tasks.filter((t) => t.done);
  const taskLines = pendingTasks.length
    ? pendingTasks
        .map((t) => {
          const subj = context.classes.find((c) => c.id === t.subjectId)?.name || "General";
          return `- [Pending] ${t.title} | Subject: ${subj} | Due: ${t.dueDate || "None"}`;
        })
        .join("\n")
    : "No pending tasks.";

  const lengthRule =
    replyLength === "short"
      ? "Keep your response concise and under 120 words using clean bullet points."
      : "Provide a clear, structured, helpful response with actionable steps.";

  const imageNote = hasImage
    ? "The user attached an image (such as a class schedule, notes, syllabus, or assignment). Analyze what is visible and connect it to their TaSched schedule or study tasks."
    : "";

  return [
    `You are **TaSched AI**, a smart academic personal assistant inspired by ASI and GabAI, built directly inside the TaSched app.`,
    `User: ${context.userName || (context.role === "student" ? "Student" : "Instructor")} | Role: ${context.role} | Term: ${context.term.semester} (${context.term.academicYear})`,
    `Current Date & Time: ${todayStr}, ${timeStr}`,
    `\nUSER'S CLASSES:\n${classLines}`,
    `\nSCHEDULE CONFLICTS:\n${conflictLines}`,
    `\nPENDING TASKS (${pendingTasks.length} pending, ${doneTasks.length} completed):\n${taskLines}`,
    `\nGUIDELINES:`,
    `- Match the user's language naturally (English, Tagalog, or Taglish).`,
    `- Only quote classes, times, rooms, and tasks from the live TaSched data above — never invent fake classes or dates.`,
    `- Format answers cleanly with **bold** headings and bullet lists so they are easy to scan on mobile.`,
    `- ${lengthRule}`,
    imageNote,
  ]
    .filter(Boolean)
    .join("\n");
}

export function offlineTaSchedReply(question: string, context: TaSchedContext, replyLength: ReplyLength): string {
  const q = question.toLowerCase();
  const isTagalog = /\b(ano|anong|kelan|kailan|meron|mayroon|bukas|ngayon|ko|mga|klase|pasok|gawain|tapos|pwede|paano)\b/i.test(q);
  const now = new Date();
  const todayCode = Object.keys(DAY_NUMS).find((d) => DAY_NUMS[d] === now.getDay()) || "Mo";
  const pendingTasks = context.tasks.filter((t) => !t.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const conflicts = findConflicts(context.classes);
  const next = getNextClass(context.classes);

  // 1. Morning Briefing / Overview
  if (/\b(briefing|summary|overview|today|ngayon|plan my day|daily)\b/i.test(q)) {
    const todayClasses = context.classes
      .filter((c) => c.days.includes(todayCode))
      .sort((a, b) => a.start.localeCompare(b.start));

    const classBlock = todayClasses.length
      ? todayClasses.map((c) => `- **${c.name}** — ${fmtTime(c.start)}–${fmtTime(c.end)} (${c.room || "TBA"})`).join("\n")
      : isTagalog
        ? "- Walang nakatakdang klase ngayong araw."
        : "- No classes scheduled for today.";

    const taskBlock = pendingTasks.length
      ? pendingTasks
          .slice(0, replyLength === "short" ? 3 : 6)
          .map((t) => `- **${t.title}** — Due ${fmtDate(t.dueDate)}`)
          .join("\n")
      : isTagalog
        ? "- Walang pending na task. Maganda ito!"
        : "- No pending tasks right now.";

    return [
      `**${isTagalog ? "DAILY BRIEFING" : "MORNING BRIEFING"} (${DAY_NAMES[todayCode]})**`,
      `\n**${isTagalog ? "Mga Klase Ngayon" : "Today's Classes"} (${todayClasses.length})**`,
      classBlock,
      `\n**${isTagalog ? "Mga Pending Tasks" : "Upcoming Tasks"} (${pendingTasks.length})**`,
      taskBlock,
      conflicts.length
        ? `\n⚠️ **Conflict Alert:** ${conflicts.length} overlapping class pair(s) detected.`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  // 2. Next class
  if (/\b(next class|susunod na klase|next|coming up|susunod)\b/i.test(q)) {
    if (!next) {
      return isTagalog
        ? "Wala ka pang naka-save na klase sa TaSched. Pumunta sa **Schedule** tab at pindutin ang `+` para magdagdag."
        : "You don't have any classes saved yet. Open the **Schedule** tab and tap `+` to add one.";
    }
    const diffMs = next.occurrence.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.round((diffMs % 3600000) / 60000);
    const eta = diffHrs > 24 ? `${Math.floor(diffHrs / 24)}d ${diffHrs % 24}h` : diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins} min`;

    return [
      `**${isTagalog ? "SUSUNOD NA KLASE" : "NEXT CLASS"}**`,
      `- **${next.item.name}**${next.item.code ? ` (${next.item.code})` : ""}`,
      `- **Schedule:** ${DAY_NAMES[next.day]} • ${fmtTime(next.item.start)} – ${fmtTime(next.item.end)} (in ~${eta})`,
      `- **Room:** ${next.item.room || "TBA"} • **Instructor:** ${next.item.instructor || "TBA"}`,
    ].join("\n");
  }

  // 3. Conflicts check
  if (/\b(conflict|overlap|sabay|magkasabay|bangga)\b/i.test(q)) {
    if (!conflicts.length) {
      return isTagalog
        ? "✅ **Walang Schedule Conflict!** Malinis at walang magkasabay sa mga klase mo."
        : "✅ **No Schedule Conflicts!** All of your classes fit cleanly without overlaps.";
    }
    return [
      `⚠️ **${conflicts.length} Schedule Conflict(s) Found**`,
      ...conflicts.map(
        (cf) =>
          `- **${cf.a.name}** (${fmtTime(cf.a.start)}–${fmtTime(cf.a.end)}) overlaps with **${cf.b.name}** (${fmtTime(cf.b.start)}–${fmtTime(cf.b.end)}) on **${cf.sharedDays.join(", ")}**`,
      ),
    ].join("\n");
  }

  // 4. Tasks / Deadlines / Due this week
  if (/\b(task|tasks|deadline|due|homework|assignment|todo|to-do|gawain|tapusin)\b/i.test(q)) {
    if (!pendingTasks.length) {
      return isTagalog
        ? "🎉 **Walang pending tasks!** Maaari kang magdagdag ng bagong task mula sa Home o Tasks tab."
        : "🎉 **You're all caught up!** No pending tasks right now. Tap **+ Add a task** anytime to track a new deadline.";
    }
    const list = pendingTasks.slice(0, replyLength === "short" ? 4 : 10).map((t) => {
      const subj = context.classes.find((c) => c.id === t.subjectId)?.name || "General Task";
      return `- **${t.title}** (${subj}) — Due **${fmtDate(t.dueDate)}**`;
    });
    return [
      `**UPCOMING TASKS (${pendingTasks.length} pending)**`,
      ...list,
    ].join("\n");
  }

  // 5. Free slots / Study plan / Specific weekday
  const matchedDay = Object.entries(DAY_NAMES).find(
    ([code, full]) => q.includes(full.toLowerCase()) || new RegExp(`\\b${code.toLowerCase()}\\b`).test(q),
  );
  if (matchedDay || /\b(free|slot|gap|study|schedule|klase|pasok|classes)\b/i.test(q)) {
    const targetCode = matchedDay ? matchedDay[0] : todayCode;
    const dayClasses = context.classes
      .filter((c) => c.days.includes(targetCode))
      .sort((a, b) => a.start.localeCompare(b.start));

    if (!dayClasses.length) {
      return isTagalog
        ? `Walang klase sa **${DAY_NAMES[targetCode]}** — buong araw kang libre para mag-review o tapusin ang ${pendingTasks.length} pending task(s) mo.`
        : `You have no classes on **${DAY_NAMES[targetCode]}** — your schedule is completely open for study or catching up on your ${pendingTasks.length} pending task(s).`;
    }

    const lines = dayClasses.map(
      (c) => `- **${fmtTime(c.start)} – ${fmtTime(c.end)}**: ${c.name} (${c.room || "TBA"})`,
    );
    const gaps: string[] = [];
    for (let i = 0; i < dayClasses.length - 1; i++) {
      if (dayClasses[i].end < dayClasses[i + 1].start) {
        gaps.push(`- Free gap: **${fmtTime(dayClasses[i].end)} – ${fmtTime(dayClasses[i + 1].start)}**`);
      }
    }

    return [
      `**${DAY_NAMES[targetCode].toUpperCase()} SCHEDULE (${dayClasses.length} classes)**`,
      ...lines,
      ...(gaps.length ? ["\n**Free Study Slots**", ...gaps] : []),
    ].join("\n");
  }

  // 6. General helpful answer summarizing live context + Gemini setup tip
  return [
    `**TaSched AI (Offline Smart Mode)**`,
    `Hi **${context.userName || "there"}**! You currently have **${context.classes.length} class(es)** and **${pendingTasks.length} pending task(s)**.`,
    next
      ? `- **Next class:** ${next.item.name} (${DAY_NAMES[next.day]} • ${fmtTime(next.item.start)})`
      : `- Add classes in the **Schedule** tab to see your next class.`,
    pendingTasks[0]
      ? `- **Top deadline:** ${pendingTasks[0].title} (Due ${fmtDate(pendingTasks[0].dueDate)})`
      : `- Add deadlines using **+ Add a task**.`,
    `\nTry asking: *"Morning briefing"*, *"What's my next class?"*, *"Free slots"*, or add your **Gemini API Key** in the gear ⚙️ menu for full conversational AI & photo analysis.`,
  ].join("\n");
}

export async function generateTaSchedReply({
  question,
  history,
  context,
  settings,
  apiKey,
  image,
  signal,
  onToken,
}: {
  question: string;
  history: ChatMessage[];
  context: TaSchedContext;
  settings: AISettings;
  apiKey: string;
  image?: GeminiImage;
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}): Promise<{ text: string; model?: string; notice?: string; usage?: TokenUsage }> {
  let streamed = false;
  const emitToken = (token: string) => {
    if (!token) return;
    streamed = true;
    onToken?.(token);
  };

  if (signal?.aborted) return { text: "" };

  const system = buildSystemPrompt(context, settings.replyLength, Boolean(image));
  const modelHistory = history.slice(-HISTORY_LIMIT).map((m) => ({
    role: m.role,
    text: m.body,
  }));
  const questionText = question.trim() || (image ? "Please analyze this image and help me organize my schedule or tasks." : "");
  const current = { role: "user" as const, text: questionText, image };

  let notice: string | undefined;

  if (settings.aiMode === "cloud") {
    const cleanKey = apiKey.trim();
    if (!cleanKey) {
      notice = "No Gemini API key set — answered with Offline Smart Mode.";
    } else {
      try {
        const candidates = await resolveModelCandidates(cleanKey, settings.geminiModel, {
          needsVision: Boolean(image),
          question: questionText,
          historyText: modelHistory.map((m) => m.text).join("\n"),
        });
        let lastError: unknown;
        for (const [index, model] of candidates.entries()) {
          if (signal?.aborted) return { text: "" };
          try {
            const result = await generateGemini({
              apiKey: cleanKey,
              model,
              system,
              history: [...modelHistory, current],
              signal,
              onToken: emitToken,
            });
            if (index > 0) {
              notice = `Switched to ${modelLabel(model)} after primary model was unavailable.`;
            }
            return {
              text: result.text,
              model: modelLabel(model),
              notice,
              usage: result.usage,
            };
          } catch (candidateError) {
            lastError = candidateError;
            const retryable =
              candidateError instanceof GeminiError &&
              [404, 429, 500, 502, 503, 504].includes(candidateError.status ?? 0);
            if (retryable && candidateError instanceof GeminiError && candidateError.status) {
              markGeminiModelUnavailable(cleanKey, model, candidateError.status);
            }
            if (streamed || !retryable) throw candidateError;
          }
        }
        throw lastError ?? new GeminiError("No Gemini model is available right now.", "other");
      } catch (err) {
        if (signal?.aborted) return { text: "" };
        if (streamed) throw err;
        const msg = err instanceof GeminiError ? err.message : "Gemini is unavailable.";
        notice = `${msg} Answered offline.`;
      }
    }
  }

  // Offline / Fallback Smart Response
  if (image && !notice) {
    notice = "Image analysis requires Cloud AI with a Gemini API key. Answered from your saved schedule.";
  }
  const text = offlineTaSchedReply(questionText, context, settings.replyLength);
  emitToken(text);
  return { text, model: "Offline Smart", notice };
}
