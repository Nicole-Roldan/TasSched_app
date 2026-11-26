import { useEffect, useMemo, useRef, useState } from "react";
import Mascot from "./components/Mascot";
import { UserAvatar, AvatarPickerModal } from "./components/AvatarPicker";
import FloatingAIChat from "./components/FloatingAIChat";

type Role = "student" | "instructor";
type Screen =
  | "welcome"
  | "role"
  | "term"
  | "setup"
  | "manual"
  | "import"
  | "loading"
  | "review"
  | "success"
  | "app";
type Tab = "home" | "schedule" | "tasks" | "share" | "profile";
type AcademicTerm = {
  academicYear: string;
  semester: string;
  startDate: string;
  endDate: string;
};
type ClassItem = {
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
  color: string;
};
type TaskItem = {
  id: string;
  title: string;
  subjectId: string;
  dueDate: string;
  done: boolean;
};
type ThemeMode = "light" | "dark" | "system";
type Reminder = {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  upcoming?: boolean;
};
type SettingsState = {
  themeMode: ThemeMode;
  accent: string;
  accentName: string;
  notificationsEnabled: boolean;
  permissionAsked: boolean;
  classReminders: boolean;
  classOffset: string;
  remindFor: "all" | "selected";
  selectedSubjects: string[];
  taskReminders: boolean;
  taskOffset: string;
  overdueAlerts: boolean;
  teachingReminders: boolean;
  attendanceReminders: boolean;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
  dailySummary: boolean;
  dailyTime: string;
  vibration: boolean;
  ringtone: string;
  classTone: string;
  taskTone: string;
  volume: number;
  deviceDefault: boolean;
};

const defaultSettings: SettingsState = {
  themeMode: "light",
  accent: "#4ADE9A",
  accentName: "Mint Green",
  notificationsEnabled: false,
  permissionAsked: false,
  classReminders: true,
  classOffset: "15 min",
  remindFor: "all",
  selectedSubjects: [],
  taskReminders: true,
  taskOffset: "1 day",
  overdueAlerts: true,
  teachingReminders: true,
  attendanceReminders: true,
  quietHours: false,
  quietStart: "22:00",
  quietEnd: "06:00",
  dailySummary: false,
  dailyTime: "06:00",
  vibration: true,
  ringtone: "Chime",
  classTone: "Chime",
  taskTone: "Soft Pop",
  volume: 70,
  deviceDefault: false,
};

const paths: Record<string, React.ReactNode> = {
  arrow: <path d="m15 18-6-6 6-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
  scan: <><path d="M3 9V5a2 2 0 0 1 2-2h4M15 3h4a2 2 0 0 1 2 2v4M21 15v4a2 2 0 0 1-2 2h-4M9 21H5a2 2 0 0 1-2-2v-4" /><path d="M7 12h10" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></>,
  camera: <><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3Z" /><circle cx="12" cy="13" r="3" /></>,
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10M9 21v-7h6v7" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  tasks: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  qr: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 18v3" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V21h-4v-.08a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3v-4h.08a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3h4v.08a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21v4h-.08a1.7 1.7 0 0 0-1.52 1Z" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />,
  alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  sparkles: <path d="m12 3 1.9 4.9L19 10l-4.1 2.1L13 17l-1.9-4.9L7 10l4.1-2.1L12 3Z" />,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
};

function Icon({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Brand({ dark = false }: { dark?: boolean }) {
  return <div className={`brand ${dark ? "brand-dark" : ""}`}><span>Ta</span><strong>Sched</strong></div>;
}

function PrimaryButton({ children, onClick, disabled = false }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return <button className="primary-button" onClick={onClick} disabled={disabled}>{children}<span className="button-arrow">→</span></button>;
}

function ProgressHeader({ step, back }: { step: number; back: () => void }) {
  return (
    <div className="progress-header">
      <button className="icon-button" onClick={back} aria-label="Go back"><Icon name="arrow" /></button>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${step * 20}%` }} /></div>
      <span>{step}/5</span>
    </div>
  );
}

const emptyTerm: AcademicTerm = { academicYear: "", semester: "", startDate: "", endDate: "" };
function readStored<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch (error) {
    console.error(`Could not load TaSched data for "${key}".`, error);
    return fallback;
  }
}

const validAcademicYear = (value: string) => {
  const match = /^(\d{4})-(\d{4})$/.exec(value);
  return Boolean(match && Number(match[2]) === Number(match[1]) + 1);
};
const validTerm = (term: AcademicTerm) =>
  validAcademicYear(term.academicYear) &&
  Boolean(term.semester && term.startDate && term.endDate) &&
  term.endDate > term.startDate;
const formatDate = (value: string) =>
  value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "";
const formatTime = (value: string) => {
  if (!value) return "";
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

const checkTimeOverlap = (startA: string, endA: string, startB: string, endB: string): boolean => {
  if (!startA || !endA || !startB || !endB) return false;
  return startA < endB && endA > startB;
};

const findClassConflicts = (
  target: { id?: string; days: string[]; start: string; end: string },
  list: ClassItem[]
): ClassItem[] => {
  if (!target.days?.length || !target.start || !target.end) return [];
  return list.filter((item) => {
    if (target.id && item.id === target.id) return false;
    const shareDay = item.days.some((day) => target.days.includes(day));
    if (!shareDay) return false;
    return checkTimeOverlap(target.start, target.end, item.start, item.end);
  });
};

const TIME_SLOT_PRESETS = [
  { label: "7:00 AM – 8:30 AM", start: "07:00", end: "08:30" },
  { label: "8:30 AM – 10:00 AM", start: "08:30", end: "10:00" },
  { label: "10:00 AM – 11:30 AM", start: "10:00", end: "11:30" },
  { label: "11:30 AM – 1:00 PM", start: "11:30", end: "13:00" },
  { label: "1:00 PM – 2:30 PM", start: "13:00", end: "14:30" },
  { label: "2:30 PM – 4:00 PM", start: "14:30", end: "16:00" },
  { label: "4:00 PM – 5:30 PM", start: "16:00", end: "17:30" },
  { label: "5:30 PM – 7:00 PM", start: "17:30", end: "19:00" },
  { label: "7:00 PM – 8:30 PM", start: "19:00", end: "20:30" },
];
const semesterShort = (value: string) => value === "1st Sem" ? "1st Sem" : value;
const mixColor = (hex: string, target: string, amount: number) => {
  const clean = hex.replace("#", "");
  const end = target.replace("#", "");
  const values = [0, 2, 4].map((index) =>
    Math.round(parseInt(clean.slice(index, index + 2), 16) * (1 - amount) + parseInt(end.slice(index, index + 2), 16) * amount),
  );
  return `#${values.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
};
const readableText = (hex: string) => {
  const clean = hex.replace("#", "");
  const [red, green, blue] = [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16));
  return (red * 299 + green * 587 + blue * 114) / 1000 > 145 ? "#1F2129" : "#FFFFFF";
};
const offsetMinutes = (value: string) => {
  const amount = Number(value.match(/\d+/)?.[0] || 0);
  if (value.includes("day")) return amount * 1440;
  if (value.includes("hour")) return amount * 60;
  return amount;
};
const isQuietNow = (settings: SettingsState) => {
  if (!settings.quietHours) return false;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMinute] = settings.quietStart.split(":").map(Number);
  const [endHour, endMinute] = settings.quietEnd.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  return start <= end ? current >= start && current < end : current >= start || current < end;
};
const playTone = (tone: string, volume: number) => {
  if (tone === "Silent" || typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const frequencies: Record<string, number[]> = {
    Chime: [660, 880],
    Bell: [740, 740, 980],
    Marimba: [523, 659, 784],
    Pulse: [440, 660, 440],
    "Soft Pop": [520],
    Alarm: [880, 660, 880, 660],
  };
  (frequencies[tone] || frequencies.Chime).forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + index * 0.13;
    oscillator.frequency.value = frequency;
    oscillator.type = tone === "Alarm" ? "square" : "sine";
    gain.gain.setValueAtTime(Math.max(0.02, volume / 300), start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.2);
  });
};

function Welcome({ next, skip }: { next: () => void; skip: () => void }) {
  return (
    <main className="screen welcome">
      <div className="welcome-glow" />
      
      {/* Orange Mascot prominently displayed in the center, peeking from behind yellow folder */}
      <div className="welcome-mascot-container">
        <Mascot
          pose="peeking-folder"
          size={230}
          className="welcome-mascot-size"
        />
      </div>

      <section className="welcome-copy">
        <div className="welcome-tagline-pill">
          <Icon name="check" size={14} /> PLAN LESS • LEARN MORE
        </div>
        <h1>Hey there! Welcome to TaSched!</h1>
        <p>Your academic journey starts here.</p>
      </section>

      <div className="bottom-actions">
        <PrimaryButton onClick={next}>Get Started</PrimaryButton>
        <button className="welcome-skip-btn" onClick={skip}>Skip</button>
      </div>
    </main>
  );
}

function RoleScreen({
  role,
  setRole,
  userName,
  setUserName,
  next,
  back,
}: {
  role: Role | null;
  setRole: (r: Role) => void;
  userName: string;
  setUserName: (name: string) => void;
  next: () => void;
  back: () => void;
}) {
  const [touched, setTouched] = useState(false);
  const isNameValid = userName.trim().length > 0;

  const handleContinue = () => {
    setTouched(true);
    if (!role || !isNameValid) return;
    next();
  };

  return (
    <main className="screen light">
      <ProgressHeader step={1} back={back} />

      {/* Orange mascot near the top of the screen, peeking from behind the role selection card */}
      <div className="role-mascot-peeking">
        <Mascot
          pose="peeking-top"
          size={140}
          className="role-mascot-size"
        />
      </div>

      <section className="screen-heading role-header-wrap">
        <p className="eyebrow green">LET'S GET TO KNOW YOU</p>
        <h1>Who are you today?</h1>
        <p>Choose your role to tailor TaSched for you.</p>
      </section>

      <div className="role-list">
        <button
          type="button"
          className={`role-card ${role === "student" ? "selected" : ""}`}
          onClick={() => setRole("student")}
        >
          <span className="role-icon student"><Icon name="user" size={30} /></span>
          <span>
            <strong>Student</strong>
            <small>Let's organize your academic life!</small>
          </span>
          <span className="radio">{role === "student" && <Icon name="check" size={15} />}</span>
        </button>

        <button
          type="button"
          className={`role-card ${role === "instructor" ? "selected" : ""}`}
          onClick={() => setRole("instructor")}
        >
          <span className="role-icon instructor"><Icon name="users" size={30} /></span>
          <span>
            <strong>Teacher</strong>
            <small>Let's make your teaching schedule easier!</small>
          </span>
          <span className="radio">{role === "instructor" && <Icon name="check" size={15} />}</span>
        </button>
      </div>

      {role && (
        <div className="name-prompt-card">
          <div className="name-prompt-header">
            <span className="name-prompt-badge">
              {role === "student" ? "STUDENT PROFILE" : "TEACHER PROFILE"}
            </span>
            <span className="name-prompt-required">* Required</span>
          </div>
          <label htmlFor="user-nickname-input" className="name-prompt-label">
            {role === "student"
              ? "What is your nickname or name?"
              : "What is your title and name?"}
          </label>
          <div className={`name-input-wrapper ${touched && !isNameValid ? "has-error" : ""}`}>
            <span className="name-input-icon">
              <Icon name="user" size={18} />
            </span>
            <input
              id="user-nickname-input"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={
                role === "student"
                  ? "e.g., Alex, Juan, or Maria"
                  : "e.g., Prof. Santos, Sir John, Ma'am Diaz"
              }
              maxLength={36}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && role && isNameValid) {
                  next();
                }
              }}
            />
            {userName && (
              <button
                type="button"
                className="name-input-clear"
                onClick={() => setUserName("")}
                aria-label="Clear name"
              >
                ×
              </button>
            )}
          </div>
          {touched && !isNameValid ? (
            <p className="inline-error">Please enter your nickname or name to proceed.</p>
          ) : (
            <p className="name-prompt-hint">
              {isNameValid ? (
                <span>
                  👋 Hello preview: <strong>Hi, {userName.trim()}.</strong>
                </span>
              ) : (
                <span>This will automatically appear on your dashboard.</span>
              )}
            </p>
          )}
        </div>
      )}

      <div className="tip-card">
        <span>i</span>
        <p>You can update your name and role anytime in Profile settings.</p>
      </div>

      <div className="sticky-action">
        <PrimaryButton disabled={!role || !isNameValid} onClick={handleContinue}>Continue</PrimaryButton>
      </div>
    </main>
  );
}

function TermFields({ term, setTerm }: { term: AcademicTerm; setTerm: (term: AcademicTerm) => void }) {
  const currentYear = new Date().getFullYear();
  const suggestions = Array.from({ length: 3 }, (_, index) => `${currentYear + index}-${currentYear + index + 1}`);
  const yearError = Boolean(term.academicYear) && !validAcademicYear(term.academicYear);
  const dateError = Boolean(term.startDate && term.endDate && term.endDate <= term.startDate);
  const updateStart = (startDate: string) => {
    setTerm({
      ...term,
      startDate,
      endDate: term.endDate && startDate >= term.endDate ? "" : term.endDate,
    });
  };

  return (
    <>
      <div className="field-group">
        <label>Academic year</label>
        <div className={`editable-field ${yearError ? "has-error" : ""}`}>
          <input
            value={term.academicYear}
            onChange={(event) => setTerm({ ...term, academicYear: event.target.value.trim() })}
            placeholder="e.g., 2026-2027"
            inputMode="numeric"
            aria-label="Academic year"
          />
          <select
            value={suggestions.includes(term.academicYear) ? term.academicYear : ""}
            onChange={(event) => setTerm({ ...term, academicYear: event.target.value })}
            aria-label="Suggested academic years"
          >
            <option value="">Custom</option>
            {suggestions.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        {yearError && <p className="inline-error">Enter a valid academic year, e.g., 2026-2027</p>}
      </div>
      <div className="field-group">
        <label>Semester</label>
        <div className="select-wrapper">
          <select className="field-select" value={term.semester} onChange={(event) => setTerm({ ...term, semester: event.target.value })} aria-label="Semester">
            <option value="">Choose a semester</option>
            {["1st Sem", "2nd Sem", "Summer"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>
      <div className="date-grid">
        <div className="field-group"><label>Starts</label><div className="date-field"><Icon name="calendar" size={18} /><input required type="date" value={term.startDate} onChange={(event) => updateStart(event.target.value)} aria-label="Semester start date" /><span className={term.startDate ? "hidden-placeholder" : ""}>Select date</span></div></div>
        <div className="field-group"><label>Ends</label><div className={`date-field ${dateError ? "has-error" : ""}`}><Icon name="calendar" size={18} /><input required type="date" min={term.startDate || undefined} value={term.endDate} onChange={(event) => setTerm({ ...term, endDate: event.target.value })} aria-label="Semester end date" /><span className={term.endDate ? "hidden-placeholder" : ""}>Select date</span></div></div>
      </div>
      {dateError && <p className="inline-error date-error">End date must be after the start date</p>}
    </>
  );
}

function TermScreen({
  role,
  userName = "",
  term,
  setTerm,
  next,
  back,
}: {
  role: Role;
  userName?: string;
  term: AcademicTerm;
  setTerm: (term: AcademicTerm) => void;
  next: () => void;
  back: () => void;
}) {
  const isStudent = role === "student";
  const displayName = userName.trim();

  return (
    <main className="screen light">
      <ProgressHeader step={2} back={back} />

      {/* Mascot Waving: Welcome message for Student / Teacher */}
      <div className="onboarding-mascot-banner">
        <Mascot pose="waving" size={74} />
        <div className="onboarding-mascot-banner-text">
          <strong>{displayName ? `Hey, ${displayName}! 👋` : (isStudent ? "Hey, Student! 👋" : "Welcome, Teacher! 👋")}</strong>
          <p>
            {isStudent
              ? "Let's set up your academic calendar so your subjects and reminders stay organized."
              : "Let's configure your academic term to keep your teaching sections effortless."}
          </p>
        </div>
      </div>

      <section className="screen-heading">
        <p className="eyebrow green">{isStudent ? "STUDENT CALENDAR" : "TEACHING CALENDAR"}</p>
        <h1>{isStudent ? "Set your academic term" : "Set your teaching term"}</h1>
        <p>We'll keep your schedule within these dates.</p>
      </section>

      {/* Mascot Interaction with Form:
          Peeking symmetrically from the top of the term card so it is never clipped on mobile */}
      <div className="form-with-mascot-container">
        <div className="form-mascot-top-peek">
          <Mascot pose="peeking-top" size={96} />
        </div>
        <TermFields term={term} setTerm={setTerm} />
      </div>

      <div className="calendar-note">
        <Icon name="calendar" />
        <p>
          <strong>One term, everything aligned</strong>
          <small>Reminders, classes, and weekly views will follow these dates.</small>
        </p>
      </div>

      <div className="sticky-action">
        <PrimaryButton disabled={!validTerm(term)} onClick={next}>Continue</PrimaryButton>
      </div>
    </main>
  );
}

function SetupScreen({
  role,
  userName = "",
  next,
  skip,
  back,
}: {
  role: Role;
  userName?: string;
  next: (method: string) => void;
  skip: () => void;
  back: () => void;
}) {
  const [method, setMethod] = useState("");
  const isStudent = role === "student";
  const displayName = userName.trim();
  const options = [
    {
      id: "scan",
      icon: "scan",
      title: "Add from a photo",
      desc: isStudent ? "Upload your study load photo or screenshot" : "Upload your teaching load or syllabus photo",
      badge: "PHOTO IMPORT",
    },
    {
      id: "manual",
      icon: "edit",
      title: "Add manually",
      desc: isStudent ? "Build your schedule class by class" : "Build your schedule section by section",
    },
  ];

  return (
    <main className="screen light">
      <ProgressHeader step={3} back={back} />

      {/* Mascot Pointing: Academic / Teaching Preferences */}
      <div className="setup-guide-mascot">
        <Mascot pose="pointing" size={84} />
        <div className="setup-guide-bubble">
          <strong>{displayName ? `${displayName}'s Schedule` : (isStudent ? "Academic Preferences" : "Teaching Preferences")}</strong>
          <p>
            {isStudent
              ? "Pick how you'd like to load your classes below. I'm right here to guide you!"
              : "Choose how to load your teaching schedule. You can snap a photo or add each block."}
          </p>
        </div>
      </div>

      <section className="screen-heading compact">
        <p className="eyebrow green">ALMOST THERE</p>
        <h1>{isStudent ? "Add your classes" : "Add your teaching load"}</h1>
        <p>Choose how you want to start.</p>
      </section>

      <div className="option-list">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => setMethod(o.id)}
            className={`option-card ${method === o.id ? "selected" : ""}`}
          >
            <span className="option-icon"><Icon name={o.icon} /></span>
            <span>
              <strong>{o.title}</strong>
              <small>{o.desc}</small>
              {o.badge && <em>{o.badge}</em>}
            </span>
            <span className="radio">{method === o.id && <Icon name="check" size={15} />}</span>
          </button>
        ))}
      </div>

      <button className="skip-link" onClick={skip}>Skip for now</button>
      <div className="sticky-action">
        <PrimaryButton disabled={!method} onClick={() => next(method)}>Continue</PrimaryButton>
      </div>
    </main>
  );
}

function ImportScreen({ files, setFiles, load, back }: { files: File[]; setFiles: (files: File[]) => void; load: (files: File[]) => void; back: () => void }) {
  const galleryInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const selectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (selected.some((file) => !file.type.startsWith("image/"))) {
      setError("Choose image files only.");
      return;
    }
    if (selected.length > 5) {
      setError("Choose up to 5 photos at a time.");
      return;
    }
    setError("");
    setFiles(selected);
  };
  return (
    <main className="screen light">
      <ProgressHeader step={4} back={back} />
      <section className="screen-heading compact"><p className="eyebrow green">PHOTO IMPORT</p><h1>Add a schedule photo</h1><p>Choose a clear photo or screenshot. Add up to five images.</p></section>
      <input ref={galleryInput} className="visually-hidden" type="file" accept="image/*" multiple onChange={selectFiles} />
      <input ref={cameraInput} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={selectFiles} />
      <button className="upload-zone" onClick={() => galleryInput.current?.click()}>
        <span className="upload-visual"><Icon name="upload" size={30} /></span>
        <strong>Upload from gallery</strong><small>PNG, JPG or HEIC • Up to 5 images</small>
        <span className="browse-pill">Choose photos</span>
      </button>
      <div className="or"><span />OR<span /></div>
      <button className="camera-button" onClick={() => cameraInput.current?.click()}><Icon name="camera" /><span><strong>Take a photo</strong><small>Use your device camera</small></span><b>→</b></button>
      {error && <p className="inline-error">{error}</p>}
      {files.length > 0 && <div className="selected-files"><strong>{files.length} {files.length === 1 ? "photo" : "photos"} selected</strong>{files.map((file) => <span key={`${file.name}-${file.lastModified}`}>{file.name}</span>)}</div>}
      <div className="privacy-note"><span>✓</span><p><strong>Your photos stay on this device</strong><small>Automatic text reading is not available yet. You can enter the class details after choosing a photo.</small></p></div>
      <div className="sticky-action"><PrimaryButton disabled={!files.length} onClick={() => load(files)}>Continue</PrimaryButton></div>
    </main>
  );
}

function LoadingScreen({ done }: { done: () => void }) {
  useEffect(() => { const timer = window.setTimeout(done, 1800); return () => window.clearTimeout(timer); }, [done]);
  return (
    <main className="screen light loading-screen">
      <Brand />
      <div className="loader-art"><div className="loader-ring" /><div className="loader-calendar"><Icon name="calendar" size={44} /><span /></div></div>
      <section><h1>Preparing your photos...</h1><p>Next, add the class details you want to save.</p></section>
      <div className="reading-steps"><span className="done">✓</span><p><strong>Photos selected</strong><small>Your files stay on this device</small></p><i /></div>
      <p className="loading-caption">This usually takes a few seconds</p>
    </main>
  );
}

function ReviewScreen({
  role,
  fileNames,
  classes,
  addClass,
  deleteClass,
  updateClass,
  next,
  back,
}: {
  role: Role;
  fileNames: string[];
  classes: ClassItem[];
  addClass: (item: ClassItem) => void;
  deleteClass?: (id: string) => void;
  updateClass?: (item: ClassItem) => void;
  next: () => void;
  back: () => void;
}) {
  const [sheet, setSheet] = useState(false);
  const [editingItem, setEditingItem] = useState<ClassItem | null>(null);

  return (
    <main className="screen light review-screen">
      <ProgressHeader step={5} back={back} />
      <section className="screen-heading compact">
        <p className="eyebrow green">REVIEW SCHEDULE</p>
        <h1>Add your class details</h1>
        <p>{fileNames.length} {fileNames.length === 1 ? "photo is" : "photos are"} ready. Add or edit each class below.</p>
      </section>
      <div className="selected-files">{fileNames.map((name) => <span key={name}>{name}</span>)}</div>
      <div className="detected-list">
        {classes.map((item) => {
          const conflicts = findClassConflicts(item, classes.filter((c) => c.id !== item.id));
          return (
            <ClassCard
              item={item}
              key={item.id}
              conflicts={conflicts}
              onEdit={() => {
                setEditingItem(item);
                setSheet(true);
              }}
              onDelete={deleteClass ? () => deleteClass(item.id) : undefined}
            />
          );
        })}
      </div>
      {classes.length === 0 && (
        <div className="empty-schedule">
          <span><Icon name="edit" /></span>
          <h2>No class details yet</h2>
          <p>Add the classes shown in your photo to continue.</p>
        </div>
      )}
      <button
        className="outline-button"
        onClick={() => {
          setEditingItem(null);
          setSheet(true);
        }}
      >
        <Icon name="plus" size={19} /> Add class details
      </button>
      <div className="sticky-action review-action">
        <PrimaryButton disabled={!classes.length} onClick={next}>Save schedule</PrimaryButton>
      </div>
      {sheet && (
        <NewClassSheet
          role={role}
          existingClasses={classes}
          editingClass={editingItem}
          close={() => {
            setSheet(false);
            setEditingItem(null);
          }}
          onSave={(item) => {
            if (editingItem && updateClass) {
              updateClass(item);
            } else {
              addClass(item);
            }
            setSheet(false);
            setEditingItem(null);
          }}
          onDelete={deleteClass}
        />
      )}
    </main>
  );
}

function SuccessScreen({
  role,
  userName = "",
  term,
  classCount,
  next,
}: {
  role: Role;
  userName?: string;
  term: AcademicTerm;
  classCount: number;
  next: () => void;
}) {
  const isStudent = role === "student";
  const displayName = userName.trim();

  return (
    <main className="screen light success-screen">
      <div className="confetti"><i /><i /><i /><i /><i /><i /><i /></div>

      {/* Completion screen: Mascot celebrating with happy expression */}
      <div className="success-mascot-celebration">
        <Mascot
          pose="celebrating"
          size={165}
          className="success-mascot-size"
          speech={displayName ? `Woohoo, ${displayName}! Your schedule is all set!` : (isStudent ? "Woohoo! Your student schedule is all set!" : "Hooray! Teaching schedule is ready!")}
          badge="ALL SET"
        />
      </div>

      <section>
        <p className="eyebrow green">ALL SET</p>
        <h1>{displayName ? `You're all set, ${displayName}!` : "Your schedule is ready!"}</h1>
        <p>
          We added {classCount} {classCount === 1 ? "class" : "classes"} to your{" "}
          {isStudent ? "weekly schedule" : "teaching load"}. You can edit them anytime.
        </p>
      </section>

      <div className="success-summary">
        <span><Icon name="calendar" /></span>
        <div>
          <strong>{term.semester} • {term.academicYear}</strong>
          <small>{formatDate(term.startDate)} – {formatDate(term.endDate)}</small>
        </div>
        <b>{classCount} {classCount === 1 ? "class" : "classes"}</b>
      </div>

      <div className="bottom-actions light-bottom">
        <PrimaryButton onClick={next}>Go to Home</PrimaryButton>
      </div>
    </main>
  );
}

function ClassCard({
  item,
  conflicts = [],
  onClick,
  onDelete,
  onEdit,
}: {
  item: ClassItem;
  conflicts?: ClassItem[];
  onClick?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}) {
  const hasConflict = conflicts.length > 0;
  return (
    <article
      className={`class-card stripe-${item.color || "mint"} ${hasConflict ? "has-conflict" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="time-column">
        <strong>{formatTime(item.start).split(" ")[0]}</strong>
        <small>{formatTime(item.start).split(" ")[1]}</small>
        <span className="end-time-micro">to {formatTime(item.end)}</span>
      </div>
      <div className="class-info">
        <div>
          <span className={`subject-tag ${item.color || "mint"}`}>{item.type || "Class"}</span>
          <small>{item.days.join(" • ")}</small>
        </div>
        <h3>{item.name}</h3>
        <p>
          {item.instructor}
          {item.room ? ` • ${item.room}` : ""}
          {item.section ? ` • ${item.section}` : ""}
        </p>
        {hasConflict && (
          <div className="class-card-conflict-badge">
            <Icon name="alert" size={13} />
            <span>Conflict with {conflicts[0].name} ({formatTime(conflicts[0].start)}–{formatTime(conflicts[0].end)})</span>
          </div>
        )}
      </div>
      {(onEdit || onDelete) && (
        <div className="class-card-actions" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <button className="card-micro-btn" onClick={onEdit} aria-label="Edit class" title="Edit class">
              <Icon name="edit" size={16} />
            </button>
          )}
          {onDelete && (
            <button className="card-micro-btn danger" onClick={onDelete} aria-label="Delete class" title="Delete class">
              <Icon name="trash" size={16} />
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function ClassDetailModal({
  item,
  conflicts = [],
  close,
  onEdit,
  onDelete,
}: {
  item: ClassItem;
  conflicts: ClassItem[];
  close: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const dayNames: Record<string, string> = {
    Mo: "Monday",
    Tu: "Tuesday",
    We: "Wednesday",
    Th: "Thursday",
    Fr: "Friday",
    Sa: "Saturday",
    Su: "Sunday",
  };
  return (
    <div className="sheet-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="class-detail-modal">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <button className="icon-button" onClick={close} aria-label="Close">
            <Icon name="close" />
          </button>
          <div>
            <p>CLASS DETAILS</p>
            <h2>{item.name}</h2>
          </div>
          <span />
        </div>

        {conflicts.length > 0 && (
          <div className="conflict-alert-box" style={{ marginTop: 8 }}>
            <div className="conflict-alert-header">
              <Icon name="alert" size={20} />
              <div>
                <strong>Schedule Conflict Notice</strong>
                <p>
                  This class overlaps with <b>{conflicts.map((c) => c.name).join(", ")}</b> on{" "}
                  {item.days.map((d) => dayNames[d] || d).join(", ")}.
                </p>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          {item.code && (
            <div className="detail-row">
              <span>Subject Code</span>
              <strong>{item.code}</strong>
            </div>
          )}
          {item.section && (
            <div className="detail-row">
              <span>Section</span>
              <strong>{item.section}</strong>
            </div>
          )}
          <div className="detail-row">
            <span>Type</span>
            <span className={`subject-tag ${item.color || "mint"}`}>{item.type || "Class"}</span>
          </div>
          <div className="detail-row">
            <span>Instructor</span>
            <strong>{item.instructor}</strong>
          </div>
          <div className="detail-row">
            <span>Schedule</span>
            <strong>
              {formatTime(item.start)} – {formatTime(item.end)}
            </strong>
          </div>
          <div className="detail-row">
            <span>Meets on</span>
            <strong>{item.days.map((d) => dayNames[d] || d).join(", ")}</strong>
          </div>
          {item.room && (
            <div className="detail-row">
              <span>Room / Venue</span>
              <strong>{item.room}</strong>
            </div>
          )}
        </div>

        <div className="detail-actions">
          <button className="detail-btn-danger" onClick={onDelete}>
            <Icon name="trash" size={18} /> Delete Class
          </button>
          <button className="detail-btn-edit" onClick={onEdit}>
            <Icon name="edit" size={18} /> Edit Class
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptySchedule({
  role,
  openSheet,
  restart,
}: {
  role: Role;
  openSheet: () => void;
  restart?: () => void;
}) {
  return (
    <div className="empty-schedule">
      {/* Peeking Mascot on the empty schedule card */}
      <div style={{ margin: "-8px auto 12px", display: "flex", justifyContent: "center" }}>
        <Mascot pose="peeking-folder" size={120} />
      </div>
      <h2>No classes yet</h2>
      <p>Add your first {role === "student" ? "class" : "teaching block"} to build your schedule.</p>
      <button onClick={openSheet}><Icon name="plus" size={18} /> Add class</button>
      {restart && (
        <button
          className="text-button"
          onClick={restart}
          style={{
            marginTop: "12px",
            fontSize: "0.8125rem",
            color: "var(--emerald)",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span>👋 Replay Mascot Onboarding</span>
        </button>
      )}
    </div>
  );
}

function HomeTab({
  role,
  userName = "",
  term,
  classes,
  tasks,
  setTasks,
  openSheet,
  openNotifications,
  openSchedule,
  openTasks,
  restart,
  avatar,
  openAvatarModal,
}: {
  role: Role;
  userName?: string;
  term: AcademicTerm;
  classes: ClassItem[];
  tasks: TaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  openSheet: () => void;
  openNotifications: () => void;
  openSchedule: () => void;
  openTasks: () => void;
  onEditClass?: (item: ClassItem) => void;
  onDeleteClass?: (id: string) => void;
  restart?: () => void;
  avatar?: string;
  openAvatarModal?: () => void;
}) {
  const [taskSheet, setTaskSheet] = useState(false);
  const dayMap: Record<string, number> = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
  const today = new Date();

  const nextClass = classes.flatMap((item) => item.days.map((day) => {
    const occurrence = new Date(today);
    const daysAhead = (dayMap[day] - today.getDay() + 7) % 7;
    const [hour, minute] = item.start.split(":").map(Number);
    occurrence.setDate(today.getDate() + daysAhead);
    occurrence.setHours(hour, minute, 0, 0);
    if (occurrence <= today) occurrence.setDate(occurrence.getDate() + 7);
    return { item, day, occurrence };
  })).sort((a, b) => a.occurrence.getTime() - b.occurrence.getTime())[0];

  const upcomingTasks = useMemo(
    () => tasks.filter((task) => !task.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [tasks],
  );
  const subjectName = (id: string) => classes.find((item) => item.id === id)?.name || "General Task";

  return (
    <>
      <header className="app-header">
        <Brand />
        <div>
          <button className="notification" onClick={openNotifications} aria-label="Open notifications">
            <Icon name="bell" size={20} />
            <i />
          </button>
          <UserAvatar
            avatar={avatar}
            role={role}
            userName={userName}
            size={40}
            onClick={openAvatarModal}
          />
        </div>
      </header>
      <main className="app-content home-content">
        <section className="hello"><p>{term.semester} • {term.academicYear}</p><h1>Hi, {userName?.trim() || (role === "student" ? "Student" : "Instructor")}.</h1><span>You have {classes.length} {role === "student" ? "classes" : "teaching blocks"} in this term</span></section>
        {nextClass ? <article className="next-class">
          <div className="next-class-decor" aria-hidden="true">
            <svg viewBox="0 0 160 160" fill="none">
              <circle cx="120" cy="40" r="64" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" opacity="0.28" />
              <circle cx="120" cy="40" r="42" stroke="currentColor" strokeWidth="1.2" opacity="0.2" />
              <circle cx="120" cy="40" r="20" fill="currentColor" opacity="0.08" />
              <rect x="86" y="74" width="52" height="52" rx="14" stroke="currentColor" strokeWidth="1.2" opacity="0.16" />
              <path d="M98 92h28M98 102h20M98 112h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.22" />
            </svg>
          </div>
          <div className="next-top">
            <span className="next-live-pill"><i />NEXT CLASS</span>
            <strong className="next-status-pill">Coming up</strong>
          </div>
          <h2>{nextClass.item.name}{role === "instructor" && nextClass.item.section ? ` • ${nextClass.item.section}` : ""}</h2>
          <p>{role === "student" ? nextClass.item.instructor : nextClass.item.room || "Room not set"} • {nextClass.day} • {formatTime(nextClass.item.start)} – {formatTime(nextClass.item.end)}</p>
          <div className="next-meta">
            <span className="next-room-chip"><Icon name="clock" size={15} /> {nextClass.item.room || nextClass.item.days.join(" & ")}</span>
            <button onClick={openSchedule}>{role === "student" ? "View class" : "Open class"} →</button>
          </div>
        </article> : <EmptySchedule role={role} openSheet={openSheet} restart={restart} />}

        <div className="section-title">
          <div>
            <h2>Upcoming tasks</h2>
            <p>{upcomingTasks.length} pending</p>
          </div>
          <button onClick={openTasks}>See tasks</button>
        </div>

        {upcomingTasks.length ? (
          <div className="home-tasks-list">
            {upcomingTasks.map((task) => (
              <article className={`task-card ${task.done ? "is-done" : ""}`} key={task.id}>
                <button
                  className="task-check"
                  aria-label={task.done ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
                  onClick={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))}
                >
                  <Icon name={task.done ? "check" : "clock"} size={18} />
                </button>
                <div>
                  <h3>{task.title}</h3>
                  <p>{subjectName(task.subjectId)} • Due {formatDate(task.dueDate)}</p>
                </div>
                <button
                  className="task-delete"
                  aria-label={`Delete ${task.title}`}
                  onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}
                >
                  <Icon name="trash" size={17} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-list">
            <p>{tasks.length > 0 ? "All tasks completed! Great job staying on track." : "No upcoming tasks yet. Add one to keep track of due dates."}</p>
          </div>
        )}

        <button className="quick-add" onClick={() => setTaskSheet(true)}><Icon name="plus" /> Add a task</button>
      </main>

      {taskSheet && (
        <NewTaskSheet
          classes={classes}
          close={() => setTaskSheet(false)}
          save={(task) => {
            setTasks((current) => [...current, task]);
            setTaskSheet(false);
          }}
        />
      )}
    </>
  );
}

function ScheduleTab({
  role,
  term,
  classes,
  openSheet,
  onEditClass,
  onDeleteClass,
}: {
  role: Role;
  term: AcademicTerm;
  classes: ClassItem[];
  openSheet: () => void;
  onEditClass?: (item: ClassItem) => void;
  onDeleteClass?: (id: string) => void;
}) {
  const weekdays = ["Mo", "Tu", "We", "Th", "Fr"];
  const dayNames: Record<string, string> = { Mo: "Monday", Tu: "Tuesday", We: "Wednesday", Th: "Thursday", Fr: "Friday" };
  const dayOfWeek = new Date().getDay();
  const todayCode = (dayOfWeek >= 1 && dayOfWeek <= 5) ? weekdays[dayOfWeek - 1] : "Mo";
  const [day, setDay] = useState(todayCode);
  const [view, setView] = useState<"day" | "week">("day");
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

  const dayClasses = classes.filter((item) => item.days.includes(day)).sort((a, b) => a.start.localeCompare(b.start));

  const dayConflictsCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < dayClasses.length; i++) {
      for (let j = i + 1; j < dayClasses.length; j++) {
        if (checkTimeOverlap(dayClasses[i].start, dayClasses[i].end, dayClasses[j].start, dayClasses[j].end)) {
          count++;
        }
      }
    }
    return count;
  }, [dayClasses]);

  return (
    <>
      <header className="simple-header"><div><p>{term.semester} • {term.academicYear}</p><h1>My schedule</h1></div></header>
      <main className="app-content schedule-content">
        <div className="view-switch"><button className={view === "day" ? "active" : ""} onClick={() => setView("day")}>Day</button><button className={view === "week" ? "active" : ""} onClick={() => setView("week")}>Week</button></div>
        {view === "day" ? <>
          <label className="field-label" htmlFor="schedule-day">Choose a day (Dropdown)</label>
          <div className={`select-wrapper ${dayConflictsCount > 0 ? "select-has-conflict" : ""}`}>
            <select
              id="schedule-day"
              className={`field-select schedule-day-select ${dayConflictsCount > 0 ? "has-conflict" : ""}`}
              value={day}
              onChange={(event) => setDay(event.target.value)}
            >
              {weekdays.map((item) => {
                const itemsOnDay = classes.filter((c) => c.days.includes(item));
                let hasConflictOnThisDay = false;
                for (let i = 0; i < itemsOnDay.length; i++) {
                  for (let j = i + 1; j < itemsOnDay.length; j++) {
                    if (checkTimeOverlap(itemsOnDay[i].start, itemsOnDay[i].end, itemsOnDay[j].start, itemsOnDay[j].end)) {
                      hasConflictOnThisDay = true;
                      break;
                    }
                  }
                  if (hasConflictOnThisDay) break;
                }
                return (
                  <option value={item} key={item}>
                    {dayNames[item]} ({itemsOnDay.length} {itemsOnDay.length === 1 ? "class" : "classes"}
                    {hasConflictOnThisDay ? " • ⚠️ CONFLICT" : ""})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Interactive Day Chip Bar */}
          <div className="schedule-day-chips">
            {weekdays.map((item) => {
              const count = classes.filter((c) => c.days.includes(item)).length;
              const itemsOnDay = classes.filter((c) => c.days.includes(item));
              const hasConflictOnThisDay = itemsOnDay.some((c, idx) =>
                itemsOnDay.slice(idx + 1).some((other) => checkTimeOverlap(c.start, c.end, other.start, other.end))
              );
              return (
                <button
                  key={item}
                  type="button"
                  className={`schedule-day-chip ${day === item ? "active" : ""}`}
                  onClick={() => setDay(item)}
                >
                  <strong>{item}</strong>
                  <small>{count} cls</small>
                  {hasConflictOnThisDay && <span className="conflict-pip" title="Conflict on this day" />}
                </button>
              );
            })}
          </div>

          {/* Conflict banner on active day */}
          {dayConflictsCount > 0 && (
            <div className="schedule-conflict-banner">
              <Icon name="alert" size={18} />
              <span>⚠️ {dayConflictsCount} schedule overlap on {dayNames[day]}. Tap class to view details.</span>
            </div>
          )}

          <div className="schedule-date">
            <div>
              <h2>{dayNames[day]}</h2>
              <p>{dayClasses.length} {role === "student" ? "classes" : "sections"}</p>
            </div>
            <span>{formatDate(term.startDate)} – {formatDate(term.endDate)}</span>
          </div>

          {dayClasses.length ? (
            <div className="timeline">
              {dayClasses.map((item) => {
                const classConflicts = findClassConflicts(item, classes.filter((c) => c.id !== item.id && c.days.includes(day)));
                return (
                  <ClassCard
                    item={item}
                    key={item.id}
                    conflicts={classConflicts}
                    onClick={() => setSelectedClass(item)}
                    onEdit={onEditClass ? () => onEditClass(item) : undefined}
                    onDelete={onDeleteClass ? () => onDeleteClass(item.id) : undefined}
                  />
                );
              })}
            </div>
          ) : (
            <EmptySchedule role={role} openSheet={openSheet} />
          )}
        </> : weekdays.map((item) => {
          const items = classes.filter((entry) => entry.days.includes(item)).sort((a, b) => a.start.localeCompare(b.start));
          return (
            <section className="week-day" key={item}>
              <div className="week-day-heading">
                <h2>{dayNames[item]}</h2>
                <span>{items.length}</span>
              </div>
              {items.length ? items.map((entry) => {
                const classConflicts = findClassConflicts(entry, classes.filter((c) => c.id !== entry.id && c.days.includes(item)));
                return (
                  <ClassCard
                    item={entry}
                    key={entry.id}
                    conflicts={classConflicts}
                    onClick={() => setSelectedClass(entry)}
                    onEdit={onEditClass ? () => onEditClass(entry) : undefined}
                    onDelete={onDeleteClass ? () => onDeleteClass(entry.id) : undefined}
                  />
                );
              }) : <p className="week-day-empty">No classes</p>}
            </section>
          );
        })}
      </main>
      <button className="fab" onClick={openSheet} aria-label="Add class"><Icon name="plus" size={28} /></button>

      {selectedClass && (
        <ClassDetailModal
          item={selectedClass}
          conflicts={findClassConflicts(selectedClass, classes.filter((c) => c.id !== selectedClass.id))}
          close={() => setSelectedClass(null)}
          onEdit={() => {
            const cls = selectedClass;
            setSelectedClass(null);
            onEditClass?.(cls);
          }}
          onDelete={() => {
            const id = selectedClass.id;
            setSelectedClass(null);
            onDeleteClass?.(id);
          }}
        />
      )}
    </>
  );
}

function NewTaskSheet({ classes, close, save }: { classes: ClassItem[]; close: () => void; save: (task: TaskItem) => void }) {
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const valid = title.trim().length > 0 && Boolean(dueDate);
  return (
    <div className="sheet-overlay" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div className="bottom-sheet task-sheet">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <button className="icon-button" onClick={close} aria-label="Close">
            <Icon name="close" />
          </button>
          <div>
            <p>NEW TASK</p>
            <h2>Add a task</h2>
          </div>
          <span />
        </div>
        <div className="sheet-body">
          <div className="input-row">
            <label htmlFor="task-title">Task name *</label>
            <input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Submit project milestone" />
          </div>
          <div className="input-row">
            <label htmlFor="task-subject">Class (optional)</label>
            <div className="select-wrapper">
              <select id="task-subject" className="field-select" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
                <option value="">-- General Task (No class linked) --</option>
                {classes.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.code ? `[${item.code}] ` : ""}{item.name} ({item.days.join("/")} • {formatTime(item.start)})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="input-row">
            <label htmlFor="task-due">Due date *</label>
            <input id="task-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </div>
          <PrimaryButton disabled={!valid} onClick={() => save({ id: `${Date.now()}`, title: title.trim(), subjectId, dueDate, done: false })}>Save task</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function TasksTab({ role, classes, tasks, setTasks, openClassSheet }: { role: Role; classes: ClassItem[]; tasks: TaskItem[]; setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>; openClassSheet: () => void }) {
  const [taskSheet, setTaskSheet] = useState(false);
  const openCount = tasks.filter((task) => !task.done).length;
  const dueThisWeek = tasks.filter((task) => {
    if (task.done || !task.dueDate) return false;
    const due = new Date(`${task.dueDate}T00:00:00`);
    const daysUntil = (due.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000;
    return daysUntil >= 0 && daysUntil < 7;
  }).length;
  const subjectName = (id: string) => classes.find((item) => item.id === id)?.name || "No class selected";
  return (
    <>
      <header className="simple-header"><div><p>{role === "student" ? "STAY ON TRACK" : "COURSE MANAGEMENT"}</p><h1>{role === "student" ? "Tasks" : "My classes"}</h1></div><button className="icon-button" onClick={role === "student" ? () => setTaskSheet(true) : openClassSheet} aria-label={role === "student" ? "Add task" : "Add class"}><Icon name="plus" /></button></header>
      <main className="app-content">
        <div className="stat-grid"><article><strong>{role === "student" ? openCount : classes.length}</strong><span>{role === "student" ? "To do" : "Sections"}</span></article><article><strong>{role === "student" ? dueThisWeek : 0}</strong><span>{role === "student" ? "Due this week" : "Announcements"}</span></article><article><strong>{role === "student" ? tasks.filter((task) => task.done).length : "—"}</strong><span>{role === "student" ? "Completed" : "Attendance"}</span></article></div>
        <div className="section-title"><div><h2>{role === "student" ? "Coming up" : "Active sections"}</h2><p>{role === "student" ? "Sorted by deadline" : "Manage attendance and announcements"}</p></div></div>
        {role === "student" ? tasks.length ? [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((task) => <article className={`task-card ${task.done ? "is-done" : ""}`} key={task.id}>
          <button className="task-check" aria-label={task.done ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`} onClick={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))}><Icon name={task.done ? "check" : "clock"} size={18} /></button>
          <div><h3>{task.title}</h3><p>{subjectName(task.subjectId)} • Due {formatDate(task.dueDate)}</p></div>
          <button className="task-delete" aria-label={`Delete ${task.title}`} onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}><Icon name="trash" size={17} /></button>
        </article>) : <div className="empty-list"><p>No tasks yet. Add one to keep track of due dates.</p><button className="outline-button" onClick={() => setTaskSheet(true)}><Icon name="plus" /> Add a task</button></div> : classes.length ? classes.map((item) =>
          <article className="task-card" key={item.id}><span className="task-check"><Icon name="users" size={18} /></span><div><h3>{item.name}{item.section ? ` • ${item.section}` : ""}</h3><p>{item.room || "Room not set"} • {item.days.join(", ")}</p></div></article>
        ) : <div className="empty-list"><p>Create a class to manage sections and attendance.</p></div>}
      </main>
      {taskSheet && <NewTaskSheet classes={classes} close={() => setTaskSheet(false)} save={(task) => { setTasks((current) => [...current, task]); setTaskSheet(false); }} />}
    </>
  );
}

function QRTab({
  role,
  userName = "",
  term,
  classes,
}: {
  role: Role;
  userName?: string;
  term: AcademicTerm;
  classes: ClassItem[];
}) {
  const [message, setMessage] = useState("");
  const displayName = userName.trim();
  const shareText = useMemo(() => {
    const header = `${displayName ? `${displayName}'s` : (role === "student" ? "My" : "Teaching")} TaSched schedule — ${term.semester} ${term.academicYear}`;
    const details = classes.map((item) => `${item.name}: ${item.days.join(", ")} ${formatTime(item.start)}–${formatTime(item.end)}${item.room ? `, ${item.room}` : ""}`);
    return [header, ...details].join("\n");
  }, [classes, role, term.academicYear, term.semester, displayName]);
  const shareSchedule = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "TaSched schedule", text: shareText });
        setMessage("Schedule shared.");
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") setMessage("Could not share right now. Try copying the schedule instead.");
      }
      return;
    }
    await copySchedule();
  };
  const copySchedule = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setMessage("Schedule copied to clipboard.");
    } catch {
      setMessage("Clipboard access is unavailable in this browser.");
    }
  };
  return (
    <>
      <header className="simple-header share-header"><div><p>SHARE & CONNECT</p><h1>Share schedule</h1></div></header>
      <main className="app-content share-content">
        <div className="share-card"><span className="share-icon"><Icon name="calendar" size={30} /></span><h2>{displayName ? `${displayName}'s schedule` : (role === "student" ? "Your weekly schedule" : "Your teaching schedule")}</h2><p>{classes.length ? `${classes.length} ${classes.length === 1 ? "class" : "classes"} • ${term.semester} ${term.academicYear}` : "Add classes first to share your schedule."}</p>
          {classes.length > 0 && <ul>{classes.map((item) => <li key={item.id}><strong>{item.name}</strong><span>{item.days.join(", ")} • {formatTime(item.start)}–{formatTime(item.end)}</span></li>)}</ul>}
        </div>
        <PrimaryButton disabled={!classes.length} onClick={shareSchedule}>Share schedule</PrimaryButton>
        <button className="outline-button" disabled={!classes.length} onClick={copySchedule}>Copy schedule details</button>
        {message && <p className="share-status" role="status">{message}</p>}
      </main>
    </>
  );
}

function TermEditSheet({ current, save, close }: { current: AcademicTerm; save: (term: AcademicTerm) => void; close: () => void }) {
  const [draft, setDraft] = useState(current);
  return <div className="sheet-overlay"><div className="bottom-sheet term-sheet"><div className="sheet-handle" /><div className="sheet-header"><button className="icon-button" onClick={close}><Icon name="close" /></button><div><p>ACADEMIC TERM</p><h2>Edit term</h2></div><span /></div><div className="sheet-body"><TermFields term={draft} setTerm={setDraft} /><div className="term-save"><PrimaryButton disabled={!validTerm(draft)} onClick={() => save(draft)}>Save changes</PrimaryButton></div></div></div></div>;
}

function ProfileTab({
  role,
  userName = "",
  setUserName,
  term,
  setTerm,
  dark,
  toggleDark,
  openSettings,
  openNotifications,
  openAbout,
  switchRole,
  restart,
  avatar,
  openAvatarModal,
}: {
  role: Role;
  userName: string;
  setUserName: (name: string) => void;
  term: AcademicTerm;
  setTerm: (term: AcademicTerm) => void;
  dark: boolean;
  toggleDark: () => void;
  openSettings: () => void;
  openNotifications: () => void;
  openAbout?: () => void;
  switchRole: () => void;
  restart: () => void;
  avatar?: string;
  openAvatarModal?: () => void;
}) {
  const [editingTerm, setEditingTerm] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  return (
    <>
      <header className="simple-header profile-header">
        <div>
          <p>YOUR ACCOUNT</p>
          <h1>Profile</h1>
        </div>
        <button className="icon-button" onClick={openSettings} aria-label="Open Settings">
          <Icon name="settings" />
        </button>
      </header>
      <main className="app-content profile-content">
        <div className="profile-card">
          <div
            className="profile-avatar-wrap"
            onClick={openAvatarModal}
            role="button"
            tabIndex={0}
            title="Change Avatar"
          >
            <UserAvatar
              avatar={avatar}
              role={role}
              userName={userName}
              size={64}
              showEditBadge
            />
          </div>
          <div className="profile-card-info">
            <h2 className="profile-card-name">
              {userName.trim() || (role === "student" ? "Student profile" : "Instructor profile")}
            </h2>
            <div className="profile-meta-row">
              <span className={`profile-badge-pill ${role === "student" ? "pill-student" : "pill-instructor"}`}>
                {role === "student" ? "Student" : "Instructor"}
              </span>
              {term.academicYear && (
                <span className="profile-ay-text">A.Y. {term.academicYear}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="profile-edit-action-btn"
            onClick={() => {
              setTempName(userName);
              setEditingName(true);
            }}
            aria-label="Edit Nickname"
            title="Edit Nickname"
          >
            <Icon name="edit" size={17} />
          </button>
        </div>

        <h3 className="settings-label">ACADEMIC & ACCOUNT</h3>
        <div className="settings-card">
          <button
            type="button"
            className="setting-item"
            onClick={() => {
              setTempName(userName);
              setEditingName(true);
            }}
          >
            <div className="setting-item-left">
              <div className="setting-icon-box icon-box-emerald">
                <Icon name="user" size={18} />
              </div>
              <div className="setting-text-wrap">
                <span className="setting-title">Nickname / Name</span>
              </div>
            </div>
            <div className="setting-item-right">
              <span className="setting-value">{userName || "Set nickname"}</span>
              <Icon name="chevronRight" size={16} />
            </div>
          </button>

          <button
            type="button"
            className="setting-item"
            onClick={switchRole}
          >
            <div className="setting-item-left">
              <div className="setting-icon-box icon-box-blue">
                <Icon name="users" size={18} />
              </div>
              <div className="setting-text-wrap">
                <span className="setting-title">Switch role</span>
              </div>
            </div>
            <div className="setting-item-right">
              <span className="setting-value">{role === "student" ? "Student" : "Instructor"}</span>
              <Icon name="chevronRight" size={16} />
            </div>
          </button>

          <button
            type="button"
            className="setting-item setting-item-term"
            onClick={() => setEditingTerm(true)}
          >
            <div className="setting-item-left">
              <div className="setting-icon-box icon-box-amber">
                <Icon name="calendar" size={18} />
              </div>
              <div className="setting-text-wrap">
                <span className="setting-title">Academic term</span>
                {term.startDate && term.endDate && (
                  <span className="setting-subtext">
                    {formatDate(term.startDate)} – {formatDate(term.endDate)}
                  </span>
                )}
              </div>
            </div>
            <div className="setting-item-right">
              <span className="setting-value">{semesterShort(term.semester)}</span>
              <Icon name="chevronRight" size={16} />
            </div>
          </button>
        </div>

        <h3 className="settings-label">PREFERENCES</h3>
        <div className="settings-card">
          <button
            type="button"
            className="setting-item"
            onClick={openAvatarModal}
          >
            <div className="setting-item-left">
              <div className="setting-icon-box icon-box-purple">
                <Icon name="sparkles" size={18} />
              </div>
              <div className="setting-text-wrap">
                <span className="setting-title">Change Avatar</span>
              </div>
            </div>
            <div className="setting-item-right">
              <span className="setting-value">Edit</span>
              <Icon name="chevronRight" size={16} />
            </div>
          </button>

          <button
            type="button"
            className="setting-item"
            onClick={openNotifications}
          >
            <div className="setting-item-left">
              <div className="setting-icon-box icon-box-rose">
                <Icon name="bell" size={18} />
              </div>
              <div className="setting-text-wrap">
                <span className="setting-title">Notifications</span>
              </div>
            </div>
            <div className="setting-item-right">
              <span className="setting-value">Open</span>
              <Icon name="chevronRight" size={16} />
            </div>
          </button>

          {openAbout && (
            <button
              type="button"
              className="setting-item"
              onClick={openAbout}
            >
              <div className="setting-item-left">
                <div className="setting-icon-box icon-box-cyan">
                  <Icon name="info" size={18} />
                </div>
                <div className="setting-text-wrap">
                  <span className="setting-title">About & Terms</span>
                </div>
              </div>
              <div className="setting-item-right">
                <span className="setting-value">View</span>
                <Icon name="chevronRight" size={16} />
              </div>
            </button>
          )}

          <div className="setting-item setting-toggle-item">
            <div className="setting-item-left">
              <div className="setting-icon-box icon-box-slate">
                <Icon name="moon" size={18} />
              </div>
              <div className="setting-text-wrap">
                <span className="setting-title">Dark mode</span>
              </div>
            </div>
            <div className="setting-item-right">
              <Toggle checked={dark} onChange={toggleDark} />
            </div>
          </div>
        </div>

        <button className="logout-btn" onClick={restart}>
          <Icon name="trash" size={16} />
          <span>Log out</span>
        </button>
      </main>
      {editingTerm && <TermEditSheet current={term} save={(nextTerm) => { setTerm(nextTerm); setEditingTerm(false); }} close={() => setEditingTerm(false)} />}
      {editingName && (
        <div className="sheet-overlay" onMouseDown={(e) => e.target === e.currentTarget && setEditingName(false)}>
          <div className="bottom-sheet" style={{ maxHeight: "380px" }}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <button className="icon-button" onClick={() => setEditingName(false)} aria-label="Close">
                <Icon name="close" />
              </button>
              <div>
                <p>USER PROFILE</p>
                <h2>Edit Nickname</h2>
              </div>
              <span />
            </div>
            <div className="sheet-body" style={{ padding: "0 20px 24px" }}>
              <div className="field-group" style={{ marginTop: "10px" }}>
                <label>Your Nickname or Name</label>
                <div className="input-row" style={{ marginTop: "6px" }}>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder={role === "student" ? "e.g. Alex" : "e.g. Prof. Cruz"}
                    maxLength={36}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tempName.trim()) {
                        setUserName(tempName.trim());
                        setEditingName(false);
                      }
                    }}
                  />
                </div>
              </div>
              <div style={{ marginTop: "18px" }}>
                <PrimaryButton
                  disabled={!tempName.trim()}
                  onClick={() => {
                    if (tempName.trim()) {
                      setUserName(tempName.trim());
                      setEditingName(false);
                    }
                  }}
                >
                  Save Nickname
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NewClassSheet({
  role,
  existingClasses,
  editingClass,
  close,
  onSave,
  onDelete,
}: {
  role: Role;
  existingClasses: ClassItem[];
  editingClass?: ClassItem | null;
  close: () => void;
  onSave: (item: ClassItem) => void;
  onDelete?: (id: string) => void;
}) {
  const [form, setForm] = useState({
    name: editingClass?.name || "",
    code: editingClass?.code || "",
    section: editingClass?.section || "",
    instructor: editingClass?.instructor || "",
    start: editingClass?.start || "08:30",
    end: editingClass?.end || "10:00",
    room: editingClass?.room || "",
    type: editingClass?.type || "Lecture",
    color: editingClass?.color || "mint",
  });
  const [days, setDays] = useState<string[]>(editingClass?.days || ["Mo", "We", "Fr"]);
  const [selectedSlot, setSelectedSlot] = useState(() => {
    if (!editingClass?.start || !editingClass?.end) return "08:30-10:00";
    const match = TIME_SLOT_PRESETS.find(
      (p) => p.start === editingClass.start && p.end === editingClass.end
    );
    return match ? `${match.start}-${match.end}` : "custom";
  });
  const [allowConflict, setAllowConflict] = useState(false);

  // Real-time conflict checking
  const conflicts = useMemo(() => {
    if (!days.length || !form.start || !form.end) return [];
    return findClassConflicts(
      { id: editingClass?.id, days, start: form.start, end: form.end },
      existingClasses
    );
  }, [days, form.start, form.end, existingClasses, editingClass?.id]);

  const hasConflict = conflicts.length > 0;
  const timeError = Boolean(form.start && form.end && form.end <= form.start);
  const canSave = Boolean(
    form.name.trim() &&
    form.instructor.trim() &&
    days.length > 0 &&
    form.start &&
    form.end &&
    form.type &&
    !timeError
  );

  const handleSlotChange = (slotVal: string) => {
    setSelectedSlot(slotVal);
    setAllowConflict(false);
    if (!slotVal || slotVal === "custom") return;
    const [start, end] = slotVal.split("-");
    setForm((prev) => ({ ...prev, start, end }));
  };

  // Find next available free slot for these days
  const suggestedSlot = useMemo(() => {
    if (!days.length) return null;
    return TIME_SLOT_PRESETS.find((slot) => {
      const slotConflicts = findClassConflicts(
        { id: editingClass?.id, days, start: slot.start, end: slot.end },
        existingClasses
      );
      return slotConflicts.length === 0;
    });
  }, [days, existingClasses, editingClass?.id]);

  const applySuggestedSlot = () => {
    if (!suggestedSlot) return;
    setSelectedSlot(`${suggestedSlot.start}-${suggestedSlot.end}`);
    setForm((prev) => ({ ...prev, start: suggestedSlot.start, end: suggestedSlot.end }));
    setAllowConflict(false);
  };

  // Quick preset days
  const applyDayPreset = (presetDays: string[]) => {
    setDays(presetDays);
    setAllowConflict(false);
  };

  const isPresetActive = (presetDays: string[]) => {
    if (days.length !== presetDays.length) return false;
    return presetDays.every((d) => days.includes(d));
  };

  const save = () => {
    if (!canSave) return;
    onSave({
      ...form,
      name: form.name.trim(),
      instructor: form.instructor.trim(),
      days,
      id: editingClass?.id || `${Date.now()}`,
    });
  };

  return (
    <div className="sheet-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="bottom-sheet">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <button className="icon-button" onClick={close} aria-label="Close">
            <Icon name="close" />
          </button>
          <div>
            <p>{editingClass ? "EDIT CLASS" : "NEW CLASS"}</p>
            <h2>{editingClass ? "Edit class details" : "Add class details"}</h2>
          </div>
          <span />
        </div>
        <div className="sheet-body">
          <div className="input-row">
            <label>Course / Subject name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Data Structures & Algorithms"
            />
          </div>

          <div className="two-fields">
            <div className="input-row">
              <label>Subject code</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. CS 201"
              />
            </div>
            <div className="input-row">
              <label>Section</label>
              <input
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                placeholder="e.g. BSCS 2A"
              />
            </div>
          </div>

          <div className="input-row">
            <label>{role === "student" ? "Instructor name *" : "Instructor / Faculty name *"}</label>
            <input
              value={form.instructor}
              onChange={(e) => setForm({ ...form, instructor: e.target.value })}
              placeholder="e.g. Prof. Maria Santos"
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label className="group-label" style={{ margin: 0 }}>Meets on *</label>
              <div className="preset-chips-row" style={{ margin: 0 }}>
                <button
                  type="button"
                  className={`preset-chip ${isPresetActive(["Mo", "We", "Fr"]) ? "active" : ""}`}
                  onClick={() => applyDayPreset(["Mo", "We", "Fr"])}
                >
                  MWF
                </button>
                <button
                  type="button"
                  className={`preset-chip ${isPresetActive(["Tu", "Th"]) ? "active" : ""}`}
                  onClick={() => applyDayPreset(["Tu", "Th"])}
                >
                  TTH
                </button>
                <button
                  type="button"
                  className={`preset-chip ${isPresetActive(["Mo", "Tu", "We", "Th", "Fr"]) ? "active" : ""}`}
                  onClick={() => applyDayPreset(["Mo", "Tu", "We", "Th", "Fr"])}
                >
                  Mon–Fri
                </button>
              </div>
            </div>

            <div className="multi-days">
              {["Mo", "Tu", "We", "Th", "Fr"].map((d) => {
                const isSelected = days.includes(d);
                const dayHasConflict =
                  form.start &&
                  form.end &&
                  existingClasses.some(
                    (c) =>
                      c.id !== editingClass?.id &&
                      c.days.includes(d) &&
                      checkTimeOverlap(form.start, form.end, c.start, c.end)
                  );
                return (
                  <div key={d} className="day-btn-wrapper">
                    <button
                      type="button"
                      onClick={() =>
                        setDays(isSelected ? days.filter((x) => x !== d) : [...days, d])
                      }
                      className={`${isSelected ? "active" : ""} ${dayHasConflict ? "has-conflict-day" : ""}`}
                      title={dayHasConflict ? "Time overlap exists on this day" : undefined}
                    >
                      {d}
                    </button>
                    {dayHasConflict && <span className="day-btn-conflict-dot" title="Time conflict" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Inputs */}
          <div className="two-fields">
            <div className="input-row">
              <label>Starts *</label>
              <input
                type="time"
                value={form.start}
                onChange={(e) => {
                  setForm({ ...form, start: e.target.value });
                  setSelectedSlot("custom");
                  setAllowConflict(false);
                }}
              />
            </div>
            <div className="input-row">
              <label>Ends *</label>
              <input
                type="time"
                value={form.end}
                onChange={(e) => {
                  setForm({ ...form, end: e.target.value });
                  setSelectedSlot("custom");
                  setAllowConflict(false);
                }}
              />
            </div>
          </div>
          {timeError && <p className="inline-error sheet-error">End time must be after the start time</p>}

          {/* Conflict Alert Box */}
          {hasConflict && (
            <div className="conflict-alert-box">
              <div className="conflict-alert-header">
                <Icon name="alert" size={20} />
                <div>
                  <strong>Schedule Conflict Detected!</strong>
                  <p>
                    This time overlaps with <b>{conflicts[0].name}</b> (
                    {conflicts[0].days.join(", ")} • {formatTime(conflicts[0].start)} –{" "}
                    {formatTime(conflicts[0].end)}
                    {conflicts[0].room ? ` in ${conflicts[0].room}` : ""}).
                  </p>
                </div>
              </div>
              <div className="conflict-actions">
                {suggestedSlot && (
                  <button
                    type="button"
                    className="conflict-btn-suggest"
                    onClick={applySuggestedSlot}
                  >
                    <Icon name="sparkles" size={16} /> Auto-pick Free Slot ({suggestedSlot.label})
                  </button>
                )}
                <button
                  type="button"
                  className="conflict-btn-override"
                  onClick={() => setAllowConflict(!allowConflict)}
                >
                  {allowConflict ? "✓ Overlap Allowed" : "Allow Overlap & Save Anyway"}
                </button>
              </div>
            </div>
          )}

          <div className="two-fields">
            <div className="input-row">
              <label>Room / Venue</label>
              <input
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="e.g. Rm 304 / Lab 2"
              />
            </div>
            <div className="input-row">
              <label>Type</label>
              <div className="select-wrapper">
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="Lecture">Lecture</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Online">Online</option>
                </select>
              </div>
            </div>
          </div>

          {/* Class Card Color Picker */}
          <div>
            <label className="group-label">Card Color Theme</label>
            <div className="color-picker-row">
              {[
                { id: "mint", bg: "#10b981", name: "Mint" },
                { id: "blue", bg: "#38bdf8", name: "Blue" },
                { id: "purple", bg: "#a78bfa", name: "Purple" },
                { id: "orange", bg: "#fb923c", name: "Orange" },
                { id: "rose", bg: "#f472b6", name: "Rose" },
                { id: "emerald", bg: "#059669", name: "Emerald" },
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={`color-circle ${form.color === c.id ? "selected" : ""}`}
                  style={{ background: c.bg }}
                  onClick={() => setForm({ ...form, color: c.id })}
                  aria-label={c.name}
                  title={c.name}
                >
                  {form.color === c.id && <Icon name="check" size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Card */}
          {form.name && form.start && form.end && (
            <div className="preview-box">
              <span className="preview-box-label">Live Preview</span>
              <ClassCard
                item={{
                  id: "preview",
                  name: form.name,
                  code: form.code,
                  section: form.section,
                  instructor: form.instructor || "Instructor",
                  days,
                  start: form.start,
                  end: form.end,
                  room: form.room,
                  type: form.type,
                  color: form.color,
                }}
                conflicts={hasConflict ? conflicts : []}
              />
            </div>
          )}

          <div style={{ marginTop: 18 }}>
            <PrimaryButton
              disabled={!canSave || (hasConflict && !allowConflict)}
              onClick={save}
            >
              {editingClass ? "Save Changes" : "Add to Schedule"}
            </PrimaryButton>
          </div>

          {editingClass && onDelete && (
            <button
              type="button"
              className="danger-button"
              style={{ marginTop: 10 }}
              onClick={() => {
                onDelete(editingClass.id);
                close();
              }}
            >
              <Icon name="trash" size={16} /> Delete this class
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return <button className={`toggle ${checked ? "on" : ""}`} disabled={disabled} onClick={onChange} role="switch" aria-checked={checked} aria-label={checked ? "On" : "Off"} />;
}

function SubpageHeader({ title, back, action }: { title: string; back: () => void; action?: React.ReactNode }) {
  return <header className="subpage-header"><button className="icon-button" onClick={back}><Icon name="arrow" /></button><h1>{title}</h1><div>{action}</div></header>;
}

function PermissionPrompt({ allow, decline }: { allow: () => void; decline: () => void }) {
  return <div className="permission-overlay"><div className="permission-card"><span><Icon name="bell" size={30} /></span><h2>Allow TaSched to send you reminders?</h2><p>Get timely alerts for classes, deadlines, and schedule changes.</p><PrimaryButton onClick={allow}>Allow</PrimaryButton><button className="text-button permission-later" onClick={decline}>Not now</button></div></div>;
}

function PalettePreview() {
  return <div className="palette-preview"><div><span className="preview-chip">Tu</span><article><i /><div><strong>Programming 1</strong><small>8:00 – 9:30 AM</small></div></article></div><span className="palette-preview-button">Sample button</span><nav><Icon name="home" size={17} /><Icon name="calendar" size={17} /><Icon name="user" size={17} /></nav></div>;
}

function SettingsPage({
  role,
  term,
  setTerm,
  classes,
  settings,
  update,
  back,
  openRingtones,
  openAbout,
  openTerms,
  simulate,
  switchRole,
  clearSchedules,
  logout,
}: {
  role: Role;
  term: AcademicTerm;
  setTerm: (term: AcademicTerm) => void;
  classes: ClassItem[];
  settings: SettingsState;
  update: (changes: Partial<SettingsState>) => void;
  back: () => void;
  openRingtones: () => void;
  openAbout?: () => void;
  openTerms?: () => void;
  simulate: () => void;
  switchRole: () => void;
  clearSchedules: () => void;
  logout: () => void;
}) {
  const [permission, setPermission] = useState(false);
  const [editingTerm, setEditingTerm] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const palettes = [
    ["Mint Green", "#4ADE9A"],
    ["Ocean Blue", "#0066FF"],
    ["Violet", "#8B5CF6"],
    ["Sunset Orange", "#FF8A00"],
    ["Rose Pink", "#EC4899"],
    ["Maroon", "#8B1E3F"],
  ];
  const notificationsDisabled = !settings.notificationsEnabled;
  const enableNotifications = () => {
    if (!settings.notificationsEnabled && !settings.permissionAsked) setPermission(true);
    else update({ notificationsEnabled: !settings.notificationsEnabled });
  };
  const customClass = settings.classOffset.startsWith("Custom:");
  const customTask = settings.taskOffset.startsWith("Custom:");
  const updateCustom = (key: "classOffset" | "taskOffset", current: string, part: "amount" | "unit", value: string) => {
    const [, oldAmount = "15", oldUnit = "min"] = current.split(":");
    update({ [key]: `Custom:${part === "amount" ? value : oldAmount}:${part === "unit" ? value : oldUnit}` });
  };

  return (
    <div className="settings-page">
      <SubpageHeader title="Settings" back={back} />
      <main className="settings-content">
        <section className="settings-section">
          <div className="settings-section-title"><span>Appearance</span><button onClick={() => update({ themeMode: "light", accent: "#4ADE9A", accentName: "Mint Green" })}>Reset to default</button></div>
          <div className="settings-panel appearance-panel">
            <PalettePreview />
            <label className="control-label">Theme mode</label>
            <div className="segmented theme-segmented">{(["light", "dark", "system"] as ThemeMode[]).map((mode) => <button className={settings.themeMode === mode ? "active" : ""} onClick={() => update({ themeMode: mode })} key={mode}>{mode[0].toUpperCase() + mode.slice(1)}</button>)}</div>
            <label className="control-label">Color palette</label>
            <div className="swatch-row">{palettes.map(([name, color]) => <button key={color} aria-label={name} className={`color-swatch ${settings.accent.toUpperCase() === color ? "selected" : ""}`} style={{ background: color }} onClick={() => update({ accent: color, accentName: name })}>{settings.accent.toUpperCase() === color && <Icon name="check" size={15} />}</button>)}<button className={`color-swatch custom-swatch ${settings.accentName === "Custom" ? "selected" : ""}`} onClick={() => update({ accentName: "Custom" })}>+</button></div>
            {settings.accentName === "Custom" && <div className="custom-color"><input type="color" value={settings.accent} onChange={(event) => update({ accent: event.target.value.toUpperCase() })} /><input key={settings.accent} defaultValue={settings.accent} onBlur={(event) => /^#[0-9A-Fa-f]{6}$/.test(event.target.value) && update({ accent: event.target.value.toUpperCase() })} aria-label="Custom hex color" /></div>}
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-title"><span>Notifications</span></div>
          <div className="settings-panel">
            <div className="setting-row"><span className="setting-icon"><Icon name="bell" /></span><div><strong>Enable notifications</strong><small>Class and schedule alerts</small></div><Toggle checked={settings.notificationsEnabled} onChange={enableNotifications} /></div>
            <div className={`notification-options ${notificationsDisabled ? "disabled" : ""}`}>
              <div className="setting-row"><span className="setting-icon"><Icon name="clock" /></span><div><strong>Class reminders</strong><small>Before each class starts</small></div><Toggle disabled={notificationsDisabled} checked={settings.classReminders} onChange={() => update({ classReminders: !settings.classReminders })} /></div>
              <div className="setting-control"><label>Remind me</label><select disabled={notificationsDisabled || !settings.classReminders} value={customClass ? "Custom" : settings.classOffset} onChange={(event) => update({ classOffset: event.target.value === "Custom" ? "Custom:15:min" : event.target.value })}>{["5 min", "10 min", "15 min", "30 min", "1 hour", "Custom"].map((item) => <option key={item}>{item}</option>)}</select></div>
              {customClass && <div className="custom-offset"><input disabled={notificationsDisabled} type="number" min="1" value={settings.classOffset.split(":")[1]} onChange={(event) => updateCustom("classOffset", settings.classOffset, "amount", event.target.value)} /><select disabled={notificationsDisabled} value={settings.classOffset.split(":")[2]} onChange={(event) => updateCustom("classOffset", settings.classOffset, "unit", event.target.value)}><option value="min">minutes</option><option value="hour">hours</option></select></div>}
              <div className="setting-control"><label>Remind me for</label><select disabled={notificationsDisabled} value={settings.remindFor} onChange={(event) => update({ remindFor: event.target.value as "all" | "selected" })}><option value="all">All classes</option><option value="selected">Selected subjects</option></select></div>
              {settings.remindFor === "selected" && <div className="subject-select">{classes.map((item) => <button className={settings.selectedSubjects.includes(item.id) ? "active" : ""} onClick={() => update({ selectedSubjects: settings.selectedSubjects.includes(item.id) ? settings.selectedSubjects.filter((id) => id !== item.id) : [...settings.selectedSubjects, item.id] })} key={item.id}>{item.name}{settings.selectedSubjects.includes(item.id) && <Icon name="check" size={13} />}</button>)}</div>}
              {role === "student" ? <>
                <div className="setting-row"><span className="setting-icon"><Icon name="tasks" /></span><div><strong>Task and deadline reminders</strong><small>Upcoming course work</small></div><Toggle disabled={notificationsDisabled} checked={settings.taskReminders} onChange={() => update({ taskReminders: !settings.taskReminders })} /></div>
                <div className="setting-control"><label>Task reminder</label><select disabled={notificationsDisabled || !settings.taskReminders} value={customTask ? "Custom" : settings.taskOffset} onChange={(event) => update({ taskOffset: event.target.value === "Custom" ? "Custom:1:hour" : event.target.value })}>{["1 hour", "3 hours", "1 day", "2 days", "Custom"].map((item) => <option key={item}>{item}</option>)}</select></div>
                {customTask && <div className="custom-offset"><input disabled={notificationsDisabled} type="number" min="1" value={settings.taskOffset.split(":")[1]} onChange={(event) => updateCustom("taskOffset", settings.taskOffset, "amount", event.target.value)} /><select disabled={notificationsDisabled} value={settings.taskOffset.split(":")[2]} onChange={(event) => updateCustom("taskOffset", settings.taskOffset, "unit", event.target.value)}><option value="hour">hours</option><option value="day">days</option></select></div>}
                <div className="setting-row compact-row"><span className="setting-icon"><Icon name="bell" /></span><div><strong>Overdue task alerts</strong></div><Toggle disabled={notificationsDisabled} checked={settings.overdueAlerts} onChange={() => update({ overdueAlerts: !settings.overdueAlerts })} /></div>
              </> : <>
                <div className="setting-row"><span className="setting-icon"><Icon name="calendar" /></span><div><strong>Teaching schedule reminders</strong><small>Before every section</small></div><Toggle disabled={notificationsDisabled} checked={settings.teachingReminders} onChange={() => update({ teachingReminders: !settings.teachingReminders })} /></div>
                <div className="setting-row"><span className="setting-icon"><Icon name="users" /></span><div><strong>Attendance reminder</strong><small>After each class</small></div><Toggle disabled={notificationsDisabled} checked={settings.attendanceReminders} onChange={() => update({ attendanceReminders: !settings.attendanceReminders })} /></div>
              </>}
              <div className="setting-row"><span className="setting-icon"><Icon name="moon" /></span><div><strong>Quiet hours</strong><small>Silence notification sounds</small></div><Toggle disabled={notificationsDisabled} checked={settings.quietHours} onChange={() => update({ quietHours: !settings.quietHours })} /></div>
              {settings.quietHours && <div className="time-pair"><label>From<input disabled={notificationsDisabled} type="time" value={settings.quietStart} onChange={(event) => update({ quietStart: event.target.value })} /></label><label>Until<input disabled={notificationsDisabled} type="time" value={settings.quietEnd} onChange={(event) => update({ quietEnd: event.target.value })} /></label></div>}
              <div className="setting-row"><span className="setting-icon"><Icon name="calendar" /></span><div><strong>Daily summary</strong><small>Your schedule for today</small></div><Toggle disabled={notificationsDisabled} checked={settings.dailySummary} onChange={() => update({ dailySummary: !settings.dailySummary })} /></div>
              {settings.dailySummary && <div className="setting-control"><label>Send at</label><input disabled={notificationsDisabled} type="time" value={settings.dailyTime} onChange={(event) => update({ dailyTime: event.target.value })} /></div>}
              <div className="setting-row compact-row"><span className="setting-icon"><Icon name="bell" /></span><div><strong>Vibration</strong></div><Toggle disabled={notificationsDisabled} checked={settings.vibration} onChange={() => update({ vibration: !settings.vibration })} /></div>
              <button className="settings-action" disabled={notificationsDisabled} onClick={simulate}>Send test notification</button>
              <button className="settings-action outline" disabled={notificationsDisabled} onClick={simulate}>Simulate reminder</button>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-title"><span>Sounds</span></div>
          <div className="settings-panel">
            <button className="setting-row button-row" onClick={openRingtones}><span className="setting-icon"><Icon name="bell" /></span><div><strong>Notification ringtone</strong><small>{settings.ringtone}</small></div><b>›</b></button>
            <div className="volume-row"><label>Volume</label><input type="range" min="0" max="100" value={settings.volume} style={{ "--volume-progress": `${settings.volume}%` } as React.CSSProperties} onChange={(event) => update({ volume: Number(event.target.value) })} /><span>{settings.volume}%</span></div>
            <div className="setting-row compact-row"><span className="setting-icon"><Icon name="settings" /></span><div><strong>Use device default</strong></div><Toggle checked={settings.deviceDefault} onChange={() => update({ deviceDefault: !settings.deviceDefault })} /></div>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-title"><span>About & Legal</span></div>
          <div className="settings-panel">
            {openAbout && (
              <button className="setting-row button-row" onClick={openAbout}>
                <span className="setting-icon"><Icon name="info" /></span>
                <div>
                  <strong>About TaSched</strong>
                  <small>Version 1.0.0 • Academic companion & mascot</small>
                </div>
                <b>›</b>
              </button>
            )}
            {openTerms && (
              <button className="setting-row button-row" onClick={openTerms}>
                <span className="setting-icon"><Icon name="sparkles" /></span>
                <div>
                  <strong>Terms & Conditions</strong>
                  <small>Academic guidelines, privacy & policies</small>
                </div>
                <b>›</b>
              </button>
            )}
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-title"><span>Account</span></div>
          <div className="settings-panel">
            <button className="setting-row button-row" onClick={() => setEditingTerm(true)}><span className="setting-icon"><Icon name="calendar" /></span><div><strong>Academic term</strong><small>{term.semester} • {term.academicYear}</small></div><b>›</b></button>
            <button className="setting-row button-row" onClick={switchRole}><span className="setting-icon"><Icon name="users" /></span><div><strong>Switch role</strong><small>{role === "student" ? "Student" : "Instructor"}</small></div><b>›</b></button>
            <button className="setting-row button-row danger-row" onClick={() => setConfirmClear(true)}><span className="setting-icon"><Icon name="trash" /></span><div><strong>Clear all schedules</strong><small>Remove every saved class</small></div><b>›</b></button>
            <button className="setting-row button-row danger-row" onClick={logout}><span className="setting-icon"><Icon name="arrow" /></span><div><strong>Log out</strong></div><b>›</b></button>
          </div>
        </section>
        <p className="developer-note">Production note: use Firebase Cloud Messaging, offline local scheduled notifications, and Android notification channels for device delivery and custom ringtones.</p>
      </main>
      {permission && <PermissionPrompt allow={() => { update({ notificationsEnabled: true, permissionAsked: true }); setPermission(false); }} decline={() => { update({ notificationsEnabled: false, permissionAsked: true }); setPermission(false); }} />}
      {editingTerm && <TermEditSheet current={term} save={(nextTerm) => { setTerm(nextTerm); setEditingTerm(false); }} close={() => setEditingTerm(false)} />}
      {confirmClear && <div className="permission-overlay"><div className="permission-card compact-confirm"><span><Icon name="trash" /></span><h2>Clear all schedules?</h2><p>This removes every saved class from this session.</p><button className="danger-button" onClick={() => { clearSchedules(); setConfirmClear(false); }}>Clear schedules</button><button className="text-button permission-later" onClick={() => setConfirmClear(false)}>Cancel</button></div></div>}
    </div>
  );
}

function RingtonePage({ settings, update, back }: { settings: SettingsState; update: (changes: Partial<SettingsState>) => void; back: () => void }) {
  const tones = ["Chime", "Bell", "Marimba", "Pulse", "Soft Pop", "Alarm", "Silent"];
  return <div className="settings-page"><SubpageHeader title="Notification ringtone" back={back} /><main className="settings-content"><section className="settings-section"><div className="settings-panel tone-list">{tones.map((tone) => <div className="tone-row" key={tone}><button className="play-tone" onClick={() => playTone(tone, settings.volume)}>{tone === "Silent" ? "—" : "▶"}</button><button className="tone-choice" onClick={() => update({ ringtone: tone })}><span><strong>{tone}</strong>{tone === "Chime" && <small>Default</small>}</span><i className={`radio ${settings.ringtone === tone ? "selected" : ""}`}>{settings.ringtone === tone && <Icon name="check" size={13} />}</i></button></div>)}</div></section><section className="settings-section"><div className="settings-section-title"><span>Per reminder type</span></div><div className="settings-panel"><div className="setting-control"><label>Class reminder tone</label><select value={settings.classTone} onChange={(event) => update({ classTone: event.target.value })}>{tones.map((tone) => <option key={tone}>{tone}</option>)}</select></div><div className="setting-control"><label>Task reminder tone</label><select value={settings.taskTone} onChange={(event) => update({ taskTone: event.target.value })}>{tones.map((tone) => <option key={tone}>{tone}</option>)}</select></div></div></section></main></div>;
}

function NotificationCenter({ reminders, back, markAll }: { reminders: Reminder[]; back: () => void; markAll: () => void }) {
  return <div className="settings-page"><SubpageHeader title="Notifications" back={back} action={<button className="header-action" onClick={markAll}>Mark all read</button>} /><main className="settings-content"><div className="notification-list">{reminders.length ? reminders.map((item) => <article className="notification-item" key={item.id}><span className="notification-app-icon"><Icon name="calendar" size={19} /></span><div><div><strong>{item.title}</strong>{item.unread && <i />}</div><p>{item.message}</p><small>{item.time}{item.upcoming ? " • Upcoming" : ""}</small></div></article>) : <div className="empty-schedule"><span><Icon name="bell" /></span><h2>No notifications yet</h2><p>Scheduled and past reminders will appear here.</p></div>}</div></main></div>;
}

function NotificationBanner({ reminder, view, snooze, dismiss }: { reminder: Reminder; view: () => void; snooze: () => void; dismiss: () => void }) {
  return <div className="notification-banner"><span className="notification-app-icon"><Icon name="calendar" size={20} /></span><div><strong>{reminder.title}</strong><p>{reminder.message}</p><div><button onClick={view}>View</button><button onClick={snooze}>Snooze 5 min</button><button onClick={dismiss}>Dismiss</button></div></div></div>;
}

function AboutPage({ back, openTerms }: { back: () => void; openTerms: () => void }) {
  return (
    <div className="settings-page about-page">
      <SubpageHeader title="About TaSched" back={back} />
      <main className="settings-content about-content">
        <div className="about-hero-card">
          <div className="about-mascot-wrap">
            <Mascot pose="peeking-folder" size={135} interactive />
          </div>
          <h2>TaSched</h2>
          <span className="about-version-badge">Version 1.0.0 • Academic Edition</span>
          <p className="about-tagline">
            Your friendly academic companion designed to make class schedules and study loads effortless, organized, and stress-free.
          </p>
        </div>

        <section className="settings-section">
          <div className="settings-section-title"><span>Key Features</span></div>
          <div className="settings-panel about-features-list">
            <div className="about-feature-item">
              <span className="about-feature-icon"><Icon name="calendar" size={19} /></span>
              <div>
                <strong>Smart Timetable & Load Tracking</strong>
                <small>Manage subjects, lecture rooms, and instructor schedules with quick weekly views.</small>
              </div>
            </div>
            <div className="about-feature-item">
              <span className="about-feature-icon"><Icon name="alert" size={19} /></span>
              <div>
                <strong>Instant Conflict Detection</strong>
                <small>Real-time notifications detect and highlight overlapping class hours immediately.</small>
              </div>
            </div>
            <div className="about-feature-item">
              <span className="about-feature-icon"><Icon name="bell" size={19} /></span>
              <div>
                <strong>Intelligent Reminders</strong>
                <small>Get notified before your classes start, plus task due-date alerts and quiet hours.</small>
              </div>
            </div>
            <div className="about-feature-item">
              <span className="about-feature-icon"><Icon name="sparkles" size={19} /></span>
              <div>
                <strong>Official Mascot Companion</strong>
                <small>Interactive orange buddy that greets, guides, and celebrates your academic progress.</small>
              </div>
            </div>
            <div className="about-feature-item">
              <span className="about-feature-icon"><Icon name="moon" size={19} /></span>
              <div>
                <strong>Eye-Care Dark Mode</strong>
                <small>High-contrast, soothing mint palette built specifically to prevent screen eye strain.</small>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-title"><span>Legal & Transparency</span></div>
          <div className="settings-panel">
            <button className="setting-row button-row" onClick={openTerms}>
              <span className="setting-icon"><Icon name="info" /></span>
              <div>
                <strong>Terms & Conditions</strong>
                <small>Read our academic usage guidelines & privacy notice</small>
              </div>
              <b>›</b>
            </button>
          </div>
        </section>

        <div className="about-footer-info">
          <p>Created with care for students and educators 🎓</p>
          <small>© 2026 TaSched Project. All rights reserved.</small>
        </div>
      </main>
    </div>
  );
}

function TermsPage({ back }: { back: () => void }) {
  return (
    <div className="settings-page terms-page">
      <SubpageHeader title="Terms & Conditions" back={back} />
      <main className="settings-content terms-content">
        <div className="terms-header-card">
          <span className="terms-badge">LEGAL AGREEMENT & GUIDELINES</span>
          <h2>Terms of Use</h2>
          <p>Last updated: November 2026</p>
          <small>
            Please read these Terms and Conditions carefully before using TaSched.
            By using this application, you agree to comply with and be bound by the terms outlined below.
          </small>
        </div>

        <section className="terms-section-card">
          <div className="terms-sec-title">
            <span className="terms-num">1</span>
            <h3>Acceptance of Terms</h3>
          </div>
          <p>
            By accessing or using TaSched ("the Application") on any device or browser, you signify your agreement
            to these Terms and Conditions. If you do not agree with any part of these terms, please discontinue using the service.
          </p>
        </section>

        <section className="terms-section-card">
          <div className="terms-sec-title">
            <span className="terms-num">2</span>
            <h3>Academic & Personal Use</h3>
          </div>
          <p>
            TaSched is provided solely as a personal academic organizer for students and educators. You agree to use the application in good faith to track educational schedules, class times, tasks, and instructional commitments in compliance with your school or university policies.
          </p>
        </section>

        <section className="terms-section-card">
          <div className="terms-sec-title">
            <span className="terms-num">3</span>
            <h3>Privacy & Offline Local Storage</h3>
          </div>
          <p>
            TaSched prioritizes your data privacy through a <strong>Local-First Architecture</strong>:
          </p>
          <ul className="terms-list">
            <li>Your entered classes, timetable, task deadlines, nickname, and custom avatar are stored strictly within your browser's local storage (<code>localStorage</code>).</li>
            <li>No personal academic records, timetable information, or study loads are sold or transferred to external third parties.</li>
            <li>Clearing your browser cache or selecting "Clear all schedules" in settings will permanently delete your stored data from that browser.</li>
          </ul>
        </section>

        <section className="terms-section-card">
          <div className="terms-sec-title">
            <span className="terms-num">4</span>
            <h3>Schedule Accuracy & Verification</h3>
          </div>
          <p>
            While TaSched features automated time conflict detection and class alarm presets, users remain responsible for cross-referencing their official institutional enrollment documents (e.g., Certificate of Registration / University Load Form). TaSched does not hold liability for missed classes, rescheduled sessions, or room revisions enacted by your institution.
          </p>
        </section>

        <section className="terms-section-card">
          <div className="terms-sec-title">
            <span className="terms-num">5</span>
            <h3>Intellectual Property & Mascot Rights</h3>
          </div>
          <p>
            The TaSched application design, typography, logos, brand elements, and the <strong>Official Orange Mascot</strong> illustrations and animations are protected by intellectual property rights. You may not copy, reverse engineer, or redistribute these proprietary assets for commercial purposes without explicit permission.
          </p>
        </section>

        <section className="terms-section-card">
          <div className="terms-sec-title">
            <span className="terms-num">6</span>
            <h3>Notifications & Audio Reminders</h3>
          </div>
          <p>
            Alarm audio tones and reminder pop-ups operate through standard browser Web Audio and Notification APIs. Receipt of alerts depends on keeping the browser or tab active and permitting notification permissions. System power-saving settings or Do Not Disturb modes may affect notification delivery.
          </p>
        </section>

        <section className="terms-section-card">
          <div className="terms-sec-title">
            <span className="terms-num">7</span>
            <h3>Updates & Revisions to Terms</h3>
          </div>
          <p>
            We reserve the right to amend or update these terms periodically to reflect new features and security enhancements. Continued use of TaSched following any modifications indicates your acceptance of the updated terms.
          </p>
        </section>

        <div className="terms-footer-card">
          <p>Questions about these terms? Contact the TaSched team.</p>
          <small>© 2026 TaSched Academic Software. All rights reserved.</small>
        </div>
      </main>
    </div>
  );
}

function ManualEntryScreen({
  role,
  classes,
  addClass,
  deleteClass,
  updateClass,
  skip,
  next,
  back,
}: {
  role: Role;
  classes: ClassItem[];
  addClass: (item: ClassItem) => void;
  deleteClass?: (id: string) => void;
  updateClass?: (item: ClassItem) => void;
  skip: () => void;
  next: () => void;
  back: () => void;
}) {
  const [sheet, setSheet] = useState(classes.length === 0);
  const [editingItem, setEditingItem] = useState<ClassItem | null>(null);

  return (
    <main className="screen light manual-entry">
      <ProgressHeader step={4} back={back} />
      <section className="screen-heading compact">
        <p className="eyebrow green">MANUAL SETUP</p>
        <h1>Add your first class</h1>
        <p>One class is enough to get started. You can add the rest later.</p>
      </section>
      {classes.length ? (
        <div className="manual-saved">
          <div className="success-mark small"><Icon name="check" size={40} /></div>
          <h2>{classes.length === 1 ? "Your class is saved" : `${classes.length} classes saved`}</h2>
          <p>Continue now or add another class.</p>
          <div className="timeline">
            {classes.map((item) => {
              const conflicts = findClassConflicts(item, classes.filter((c) => c.id !== item.id));
              return (
                <ClassCard
                  item={item}
                  key={item.id}
                  conflicts={conflicts}
                  onEdit={() => {
                    setEditingItem(item);
                    setSheet(true);
                  }}
                  onDelete={deleteClass ? () => deleteClass(item.id) : undefined}
                />
              );
            })}
          </div>
          <button
            className="outline-button"
            onClick={() => {
              setEditingItem(null);
              setSheet(true);
            }}
          >
            <Icon name="plus" /> Add another class
          </button>
        </div>
      ) : (
        <EmptySchedule role={role} openSheet={() => { setEditingItem(null); setSheet(true); }} />
      )}
      <button className="skip-link manual-skip" onClick={skip}>Skip for now</button>
      <div className="sticky-action">
        <PrimaryButton disabled={classes.length < 1} onClick={next}>Continue</PrimaryButton>
      </div>
      {sheet && (
        <NewClassSheet
          role={role}
          existingClasses={classes}
          editingClass={editingItem}
          close={() => {
            setSheet(false);
            setEditingItem(null);
          }}
          onSave={(item) => {
            if (editingItem && updateClass) {
              updateClass(item);
            } else {
              addClass(item);
            }
            setSheet(false);
            setEditingItem(null);
          }}
          onDelete={deleteClass}
        />
      )}
    </main>
  );
}

function AppShell({
  role,
  userName = "",
  setUserName,
  term,
  setTerm,
  avatar,
  setAvatar,
  classes,
  addClass,
  deleteClass,
  updateClass,
  clearSchedules,
  tasks,
  setTasks,
  settings: providedSettings,
  setSettings,
  reminders: providedReminders,
  setReminders,
  effectiveDark,
  switchRole,
  restart,
}: {
  role: Role;
  userName: string;
  setUserName: (name: string) => void;
  term: AcademicTerm;
  setTerm: (term: AcademicTerm) => void;
  avatar: string;
  setAvatar: (a: string) => void;
  classes: ClassItem[];
  addClass: (item: ClassItem) => void;
  deleteClass: (id: string) => void;
  updateClass: (item: ClassItem) => void;
  clearSchedules: () => void;
  tasks: TaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  settings?: Partial<SettingsState> | null;
  setSettings?: React.Dispatch<React.SetStateAction<SettingsState>>;
  reminders?: Reminder[] | null;
  setReminders?: React.Dispatch<React.SetStateAction<Reminder[]>>;
  effectiveDark: boolean;
  switchRole: () => void;
  restart: () => void;
}) {
  const settings: SettingsState = { ...defaultSettings, ...(providedSettings && typeof providedSettings === "object" ? providedSettings : {}) };
  const reminders = Array.isArray(providedReminders) ? providedReminders : [];
  const [tab, setTab] = useState<Tab>("home");
  const [sheet, setSheet] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [page, setPage] = useState<"settings" | "ringtones" | "notifications" | "about" | "terms" | null>(null);
  const [activeReminder, setActiveReminder] = useState<Reminder | null>(null);
  const updateSettings = (changes: Partial<SettingsState>) => setSettings?.((current) => ({ ...defaultSettings, ...(current && typeof current === "object" ? current : {}), ...changes }));
  const fireReminder = (reminder?: Reminder, tone = settings.ringtone) => {
    if (!settings.notificationsEnabled) return;
    const firstClass = classes[0];
    const nextReminder = reminder || {
      id: `${Date.now()}`,
      title: firstClass ? `${firstClass.name} starts in ${settings.classOffset.startsWith("Custom:") ? `${settings.classOffset.split(":")[1]} ${settings.classOffset.split(":")[2]}` : settings.classOffset}` : "TaSched test reminder",
      message: firstClass ? `${firstClass.room || "Room not set"}, ${firstClass.instructor}` : "Notifications are working and ready for your schedule.",
      time: "Just now",
      unread: true,
    };
    setActiveReminder(nextReminder);
    setReminders?.((current) => [nextReminder, ...(Array.isArray(current) ? current : []).filter((item) => item.id !== nextReminder.id)]);
    if (!isQuietNow(settings)) playTone(settings.deviceDefault ? "Chime" : tone, settings.volume);
    if (settings.vibration && navigator.vibrate) navigator.vibrate(120);
  };
  const reminderClasses = useMemo(
    () => settings.remindFor === "selected" ? classes.filter((item) => settings.selectedSubjects.includes(item.id)) : classes,
    [classes, settings.remindFor, settings.selectedSubjects],
  );
  const upcoming = useMemo<Reminder[]>(() => {
    const classEnabled = role === "student" ? settings.classReminders : settings.teachingReminders;
    const classItems = classEnabled ? reminderClasses.map((item) => ({
    id: `upcoming-${item.id}`,
    title: `${item.name} reminder`,
    message: `${formatTime(item.start)} • ${item.days.join(", ")} • ${offsetMinutes(settings.classOffset)} minutes before`,
    time: `${settings.classOffset.startsWith("Custom:") ? settings.classOffset.split(":").slice(1).join(" ") : settings.classOffset} before`,
    unread: false,
    upcoming: true,
    })) : [];
    const taskItems: Reminder[] = role === "student" && settings.taskReminders ? tasks.filter((task) => !task.done).map((task) => ({
    id: `upcoming-${task.id}`,
    title: `${task.title} due soon`,
    message: `${formatDate(task.dueDate)} • ${classes.find((item) => item.id === task.subjectId)?.name || "Course task"}`,
    time: `${settings.taskOffset.startsWith("Custom:") ? settings.taskOffset.split(":").slice(1).join(" ") : settings.taskOffset} before`,
    unread: false,
    upcoming: true,
    })) : [];
    return [...classItems, ...taskItems];
  }, [reminderClasses, tasks, classes, role, settings.classOffset, settings.taskOffset, settings.taskReminders, settings.classReminders, settings.teachingReminders]);
  const nav = [
    { id: "home" as Tab, icon: "home", label: "Home" },
    { id: "schedule" as Tab, icon: "calendar", label: "Schedule" },
    { id: "tasks" as Tab, icon: role === "student" ? "tasks" : "users", label: role === "student" ? "Tasks" : "Classes" },
    { id: "share" as Tab, icon: "qr", label: "Share" },
    { id: "profile" as Tab, icon: "user", label: "Profile" },
  ];
  useEffect(() => {
    const enabled = role === "student" ? settings.classReminders : settings.teachingReminders;
    if (!settings.notificationsEnabled || !enabled || reminderClasses.length === 0) return;
    const now = new Date();
    const dayMap: Record<string, number> = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
    const timers = reminderClasses.flatMap((item) => item.days.map((day) => {
      const target = new Date(now);
      const daysAhead = (dayMap[day] - now.getDay() + 7) % 7;
      const [hour, minute] = item.start.split(":").map(Number);
      target.setDate(now.getDate() + daysAhead);
      target.setHours(hour, minute, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 7);
      const trigger = target.getTime() - offsetMinutes(settings.classOffset) * 60000;
      const delay = trigger - now.getTime();
      if (delay <= 0 || delay > 86400000) return null;
      return window.setTimeout(() => fireReminder({
        id: `scheduled-${item.id}-${target.getTime()}`,
        title: `${item.name} starts soon`,
        message: `${item.room || "Room not set"}, ${item.instructor}`,
        time: "Just now",
        unread: true,
      }, settings.classTone), delay);
    })).filter((timer): timer is number => timer !== null);
    return () => timers.forEach(window.clearTimeout);
  }, [reminderClasses, role, settings.notificationsEnabled, settings.classReminders, settings.teachingReminders, settings.classOffset, settings.classTone, settings.ringtone, settings.volume, settings.quietHours, settings.quietStart, settings.quietEnd, settings.deviceDefault, settings.vibration]);
  useEffect(() => {
    if (role !== "student" || !settings.notificationsEnabled || !settings.taskReminders) return;
    const now = new Date();
    const timers = tasks.filter((task) => !task.done && task.dueDate).map((task) => {
      const due = new Date(`${task.dueDate}T09:00:00`);
      const delay = due.getTime() - offsetMinutes(settings.taskOffset) * 60000 - now.getTime();
      if (delay <= 0 || delay > 86400000) return null;
      return window.setTimeout(() => fireReminder({
        id: `scheduled-task-${task.id}-${task.dueDate}`,
        title: `${task.title} is due soon`,
        message: `${formatDate(task.dueDate)} • ${classes.find((item) => item.id === task.subjectId)?.name || "Course task"}`,
        time: "Just now",
        unread: true,
      }, settings.taskTone), delay);
    }).filter((timer): timer is number => timer !== null);
    return () => timers.forEach(window.clearTimeout);
  }, [tasks, classes, role, settings.notificationsEnabled, settings.taskReminders, settings.taskOffset, settings.taskTone, settings.ringtone, settings.volume, settings.quietHours, settings.quietStart, settings.quietEnd, settings.deviceDefault, settings.vibration]);

  if (page === "settings") return <div className={`screen app-shell ${effectiveDark ? "dark-mode" : ""}`}><SettingsPage role={role} term={term} setTerm={setTerm} classes={classes} settings={settings} update={updateSettings} back={() => setPage(null)} openRingtones={() => setPage("ringtones")} openAbout={() => setPage("about")} openTerms={() => setPage("terms")} simulate={() => fireReminder()} switchRole={switchRole} clearSchedules={clearSchedules} logout={restart} />{activeReminder && <NotificationBanner reminder={activeReminder} view={() => setPage("notifications")} snooze={() => { const snoozed = { ...activeReminder, id: `${Date.now()}`, time: "Snoozed for 5 min", unread: true, upcoming: true }; setReminders?.((current) => [snoozed, ...(Array.isArray(current) ? current : [])]); setActiveReminder(null); window.setTimeout(() => fireReminder({ ...snoozed, time: "Just now", upcoming: false }), 300000); }} dismiss={() => setActiveReminder(null)} />}</div>;
  if (page === "ringtones") return <div className={`screen app-shell ${effectiveDark ? "dark-mode" : ""}`}><RingtonePage settings={settings} update={updateSettings} back={() => setPage("settings")} /></div>;
  if (page === "notifications") return <div className={`screen app-shell ${effectiveDark ? "dark-mode" : ""}`}><NotificationCenter reminders={[...reminders, ...upcoming.filter((item) => !reminders.some((saved) => saved.id === item.id))]} back={() => setPage(null)} markAll={() => setReminders?.((current) => (Array.isArray(current) ? current : []).map((item) => ({ ...item, unread: false })))} /></div>;
  if (page === "about") return <div className={`screen app-shell ${effectiveDark ? "dark-mode" : ""}`}><AboutPage back={() => setPage("settings")} openTerms={() => setPage("terms")} /></div>;
  if (page === "terms") return <div className={`screen app-shell ${effectiveDark ? "dark-mode" : ""}`}><TermsPage back={() => setPage("settings")} /></div>;
  return (
    <div className={`screen app-shell ${effectiveDark ? "dark-mode" : ""}`}>
      {tab === "home" && (
        <HomeTab
          role={role}
          userName={userName}
          term={term}
          classes={classes}
          tasks={tasks}
          setTasks={setTasks}
          openSheet={() => {
            setEditingClass(null);
            setSheet(true);
          }}
          openNotifications={() => setPage("notifications")}
          openSchedule={() => setTab("schedule")}
          openTasks={() => setTab("tasks")}
          onEditClass={(item) => {
            setEditingClass(item);
            setSheet(true);
          }}
          onDeleteClass={deleteClass}
          restart={restart}
          avatar={avatar}
          openAvatarModal={() => setAvatarModalOpen(true)}
        />
      )}
      {tab === "schedule" && (
        <ScheduleTab
          role={role}
          term={term}
          classes={classes}
          openSheet={() => {
            setEditingClass(null);
            setSheet(true);
          }}
          onEditClass={(item) => {
            setEditingClass(item);
            setSheet(true);
          }}
          onDeleteClass={deleteClass}
        />
      )}
      {tab === "tasks" && (
        <TasksTab
          role={role}
          classes={classes}
          tasks={tasks}
          setTasks={setTasks}
          openClassSheet={() => {
            setEditingClass(null);
            setSheet(true);
          }}
        />
      )}
      {tab === "share" && <QRTab role={role} userName={userName} term={term} classes={classes} />}
      {tab === "profile" && (
        <ProfileTab
          role={role}
          userName={userName}
          setUserName={setUserName}
          term={term}
          setTerm={setTerm}
          dark={effectiveDark}
          toggleDark={() => updateSettings({ themeMode: effectiveDark ? "light" : "dark" })}
          openSettings={() => setPage("settings")}
          openNotifications={() => setPage("notifications")}
          openAbout={() => setPage("about")}
          switchRole={switchRole}
          restart={restart}
          avatar={avatar}
          openAvatarModal={() => setAvatarModalOpen(true)}
        />
      )}
      <nav className="bottom-nav">{nav.map(n => <button className={tab === n.id ? "active" : ""} onClick={() => setTab(n.id)} key={n.id}><Icon name={n.icon} size={21} /><span>{n.label}</span></button>)}</nav>
      {sheet && (
        <NewClassSheet
          role={role}
          existingClasses={classes}
          editingClass={editingClass}
          close={() => {
            setSheet(false);
            setEditingClass(null);
          }}
          onSave={(item) => {
            if (editingClass) {
              updateClass(item);
            } else {
              addClass(item);
            }
            setSheet(false);
            setEditingClass(null);
          }}
          onDelete={deleteClass}
        />
      )}
      {avatarModalOpen && (
        <AvatarPickerModal
          currentAvatar={avatar}
          role={role}
          userName={userName}
          onSave={(newAvatar) => setAvatar(newAvatar)}
          onClose={() => setAvatarModalOpen(false)}
        />
      )}
      {activeReminder && <NotificationBanner reminder={activeReminder} view={() => setPage("notifications")} snooze={() => { const snoozed = { ...activeReminder, id: `${Date.now()}`, time: "Snoozed for 5 min", unread: true, upcoming: true }; setReminders?.((current) => [snoozed, ...(Array.isArray(current) ? current : [])]); setActiveReminder(null); window.setTimeout(() => fireReminder({ ...snoozed, time: "Just now", upcoming: false }), 300000); }} dismiss={() => setActiveReminder(null)} />}
      <FloatingAIChat
        context={{ role, userName, term, classes, tasks }}
        darkMode={effectiveDark}
        onAddTask={(task) => setTasks((current) => [...current, task])}
      />
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState<Role | null>(() => readStored<Role | null>("tasched.role", null));
  const [userName, setUserName] = useState<string>(() => readStored<string>("tasched.userName", ""));
  const [term, setTerm] = useState<AcademicTerm>(() => readStored<AcademicTerm>("tasched.term", emptyTerm));
  const [avatar, setAvatar] = useState<string>(() => readStored<string>("tasched.avatar", "mascot-orange"));
  const [screen, setScreen] = useState<Screen>("welcome");
  const [classes, setClasses] = useState<ClassItem[]>(() => readStored<ClassItem[]>("tasched.classes", []));
  const [tasks, setTasks] = useState<TaskItem[]>(() => readStored<TaskItem[]>("tasched.tasks", []));
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [storedSettings, setSettings] = useState<SettingsState>(() => readStored<SettingsState>("tasched.settings", defaultSettings));
  const [storedReminders, setReminders] = useState<Reminder[]>(() => readStored<Reminder[]>("tasched.reminders", []));
  const [systemDark, setSystemDark] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [switchingRole, setSwitchingRole] = useState(false);
  const settings: SettingsState = { ...defaultSettings, ...(storedSettings && typeof storedSettings === "object" ? storedSettings : {}) };
  const reminders = Array.isArray(storedReminders) ? storedReminders : [];
  const effectiveDark = settings.themeMode === "dark" || (settings.themeMode === "system" && systemDark);
  const restart = () => { setScreen("welcome"); setRole(null); setUserName(""); setTerm(emptyTerm); setClasses([]); setTasks([]); setSelectedFiles([]); setSwitchingRole(false); };
  const addClass = (item: ClassItem) => setClasses((current) => [...current, item]);
  const deleteClass = (id: string) => setClasses((current) => current.filter((c) => c.id !== id));
  const updateClass = (item: ClassItem) => setClasses((current) => current.map((c) => c.id === item.id ? item : c));
  const chooseSetup = (method: string) => {
    if (method === "scan") setScreen("import");
    else if (method === "manual") setScreen("manual");
    else setScreen("app");
  };
  const confirmImport = () => {
    setScreen("success");
  };
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateMode = () => setSystemDark(media.matches);
    media.addEventListener("change", updateMode);
    return () => media.removeEventListener("change", updateMode);
  }, []);
  useEffect(() => {
    const values: [string, unknown][] = [
      ["tasched.role", role],
      ["tasched.userName", userName],
      ["tasched.term", term],
      ["tasched.avatar", avatar],
      ["tasched.classes", classes],
      ["tasched.tasks", tasks],
      ["tasched.settings", storedSettings],
      ["tasched.reminders", storedReminders],
    ];
    for (const [key, value] of values) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Could not save TaSched data for "${key}".`, error);
      }
    }
  }, [role, userName, term, avatar, classes, tasks, storedSettings, storedReminders]);
  const themeStyle = {
    "--mint": settings.accent,
    "--soft-mint": effectiveDark ? "rgba(16, 185, 129, 0.18)" : mixColor(settings.accent, "#FFFFFF", 0.8),
    "--emerald": effectiveDark ? "#6ee7b7" : mixColor(settings.accent, "#000000", 0.48),
    "--accent-text": readableText(settings.accent),
  } as React.CSSProperties;
  return (
    <div className="prototype-stage">
      <div className={`device-frame ${effectiveDark ? "dark-mode" : ""}`} style={themeStyle}>
        {screen === "welcome" && <Welcome next={() => setScreen("role")} skip={() => { if (!role) setRole("student"); setScreen("app"); }} />}
        {screen === "role" && <RoleScreen role={role} setRole={setRole} userName={userName} setUserName={setUserName} next={() => { setScreen(switchingRole ? "app" : "term"); setSwitchingRole(false); }} back={() => setScreen(switchingRole ? "app" : "welcome")} />}
        {screen === "term" && <TermScreen role={role || "student"} userName={userName} term={term} setTerm={setTerm} next={() => setScreen("setup")} back={() => setScreen("role")} />}
        {screen === "setup" && <SetupScreen role={role || "student"} userName={userName} next={chooseSetup} skip={() => setScreen("app")} back={() => setScreen("term")} />}
        {screen === "manual" && <ManualEntryScreen role={role || "student"} classes={classes} addClass={addClass} deleteClass={deleteClass} updateClass={updateClass} skip={() => setScreen("app")} next={() => setScreen("success")} back={() => setScreen("setup")} />}
        {screen === "import" && <ImportScreen files={selectedFiles} setFiles={setSelectedFiles} load={(files) => { setSelectedFiles(files); setScreen("loading"); }} back={() => setScreen("setup")} />}
        {screen === "loading" && <LoadingScreen done={() => setScreen("review")} />}
        {screen === "review" && <ReviewScreen role={role || "student"} fileNames={selectedFiles.map((file) => file.name)} classes={classes} addClass={addClass} deleteClass={deleteClass} updateClass={updateClass} next={confirmImport} back={() => setScreen("import")} />}
        {screen === "success" && <SuccessScreen role={role || "student"} userName={userName} term={term} classCount={classes.length} next={() => setScreen("app")} />}
        {screen === "app" && <AppShell role={role || "student"} userName={userName} setUserName={setUserName} term={term} setTerm={setTerm} avatar={avatar} setAvatar={setAvatar} classes={classes} addClass={addClass} deleteClass={deleteClass} updateClass={updateClass} clearSchedules={() => setClasses([])} tasks={tasks} setTasks={setTasks} settings={settings} setSettings={setSettings} reminders={reminders} setReminders={setReminders} effectiveDark={effectiveDark} switchRole={() => { setSwitchingRole(true); setScreen("role"); }} restart={restart} />}
      </div>
    </div>
  );
}
