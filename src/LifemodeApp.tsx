import React, { useMemo, useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { startSession, sendChatMessage, getClarity } from "./api";
import { saveSession, loadSessions, deleteSession as deleteSessionDb } from "./db";
import { crisisLines, detectCrisisKeywords } from "./crisis";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Brain,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Compass,
  Crown,
  Heart,
  HelpCircle,
  Home,
  Leaf,
  Lock,
  LogOut,
  Menu,
  Mic,
  MoreHorizontal,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  User,
  WalletCards,
  Zap,
  BookText,
  MessageCircleQuestion,
  BookOpenCheck,
  BellRing,
  CreditCard,
  Archive,
  ChartBarBig,
  Tag,
  Flame,
  Info,
} from "lucide-react";

const colors = {
  bg: "#FDF9F4",
  card: "#FEFCFA",
  orange: "#E9A23B",
  orange2: "#F4C15D",
  border: "#E8E0D7",
  text: "#1D1D1F",
  muted: "#6B6B6B",
  blue: "#DFEBF6",
  green: "#DAEBDC",
  pink: "#F8E1DD",
  purple: "#EEE4F6",
  dark: "#1F2329",
};

type EmotionFamily = "anger" | "fear" | "disgust" | "sadness" | "enjoyment" | "mixed" | "unclear";
type EmotionIntensity = "low" | "medium" | "high";

type EmotionAnalysis = {
  emotion_family: EmotionFamily;
  emotion_state: string;
  intensity: EmotionIntensity;
  likely_trigger: string;
  action_tendency: string;
  possible_unmet_need: string;
  user_story_or_assumption: string;
  fact_vs_interpretation: string;
  micro_decision: string;
  macro_decision: string;
  next_socratic_question: string;
};

type SavedSession = {
  id: string;
  intent: string;
  mode: string;
  thought: string;
  messages: { role: string; text: string }[];
  exchangeCount: number;
  status: "in_progress" | "completed";
  clarityData: { micro: string; macro: string; perspective: string } | null;
  createdAt: string;
};

type SessionState = {
  intent: string;
  mode: string;
  latest_user_message: string;
  emotion_analysis: EmotionAnalysis;
  emotion_check_response: "yes" | "not_quite" | "something_else" | null;
  emotion_closer_word: string;
  clarityData: { micro: string; macro: string; perspective: string } | null;
  currentSessionId: string | null;
  sessions: SavedSession[];
  returningUser: boolean;
};

type Screen =
  | "landing"
  | "intent"
  | "thought"
  | "mode"
  | "sessionSetup"
  | "home"
  | "sessionDetail"
  | "chat"
  | "quickClarity"
  | "clarity"
  | "account"
  | "sessions"
  | "sessionsEmpty"
  | "insights"
  | "pattern"
  | "wisdomArchive"
  | "wisdomDetail"
  | "premium"
  | "billing"
  | "notifications"
  | "profile"
  | "preferences"
  | "help";

const screens: { key: Screen; label: string }[] = [
  { key: "landing", label: "Landing" },
  { key: "intent", label: "Intent" },
  { key: "thought", label: "Thought" },
  { key: "mode", label: "Mode" },
  { key: "sessionSetup", label: "Session Setup" },
  { key: "home", label: "Home" },
  { key: "sessionDetail", label: "Session Detail" },
  { key: "chat", label: "Chat" },
  { key: "quickClarity", label: "Quick Clarity" },
  { key: "clarity", label: "Clarity" },
  { key: "account", label: "Account" },
  { key: "sessions", label: "Sessions" },
  { key: "sessionsEmpty", label: "Sessions Empty" },
  { key: "insights", label: "Insights" },
  { key: "pattern", label: "Pattern Detail" },
  { key: "wisdomArchive", label: "Wisdom Archive" },
  { key: "wisdomDetail", label: "Wisdom Detail" },
  { key: "premium", label: "Premium" },
  { key: "billing", label: "Billing" },
  { key: "notifications", label: "Notifications" },
  { key: "profile", label: "Profile" },
  { key: "preferences", label: "Preferences" },
  { key: "help", label: "Help" },
];

const hiddenFramework = ["Micro Lens", "Macro Lens", "Perspective Lens"] as const;

const EMOTION_KEYWORDS: Record<Exclude<EmotionFamily, "mixed" | "unclear">, string[]> = {
  anger: ["angry", "annoyed", "frustrated", "irritated", "resent", "unfair", "fed up", "blame", "pressure", "trapped"],
  fear: ["afraid", "fear", "worried", "anxious", "nervous", "uncertain", "scared", "risk", "lose", "losing", "change", "stuck"],
  disgust: ["disgust", "gross", "off", "wrong", "misaligned", "can't stand", "cannot stand", "repelled", "unsettling", "icky"],
  sadness: ["sad", "grief", "loss", "lonely", "empty", "drained", "heavy", "down", "hurt", "disappointed"],
  enjoyment: ["happy", "relieved", "hopeful", "excited", "energized", "curious", "motivated", "aligned", "grateful", "safe"],
};

const EMOTION_CONFIG: Record<
  Exclude<EmotionFamily, "mixed" | "unclear">,
  {
    emotion_state: string;
    likely_trigger: string;
    action_tendency: string;
    possible_unmet_need: string;
    user_story_or_assumption: string;
    fact_vs_interpretation: string;
    micro_decision: string;
    macro_decision: string;
    next_socratic_question: string;
  }
> = {
  anger: {
    emotion_state: "guarded frustration",
    likely_trigger: "Something feels blocked, unfair, or crossed.",
    action_tendency: "Push back, protect a boundary, or correct the situation.",
    possible_unmet_need: "Respect, agency, or a clearer boundary.",
    user_story_or_assumption: "Part of you may believe something important is being overlooked.",
    fact_vs_interpretation: "Fact: you feel tension here. Interpretation: the tension may be pointing to a boundary that needs attention.",
    micro_decision: "Name the boundary that feels most important right now.",
    macro_decision: "Decide whether this situation still deserves your energy.",
    next_socratic_question: "What feels most crossed or overlooked here?",
  },
  fear: {
    emotion_state: "protective uncertainty",
    likely_trigger: "Change, uncertainty, or the possibility of losing stability.",
    action_tendency: "Pause, scan for risk, and hold back until it feels safer.",
    possible_unmet_need: "Safety, clarity, and a more believable path forward.",
    user_story_or_assumption: "Part of you may be telling a story that moving forward could cost you something stable.",
    fact_vs_interpretation: "Fact: you described hesitation around change. Interpretation: the hesitation may be protecting you from a risk that feels too real.",
    micro_decision: "Ask what the smallest safe next step could be.",
    macro_decision: "Decide whether the current path still feels worth protecting.",
    next_socratic_question: "What feels most at risk if you move forward?",
  },
  disgust: {
    emotion_state: "quiet misalignment",
    likely_trigger: "Something feels off, forced, or not like you.",
    action_tendency: "Pull away, reject, or try to remove what feels wrong.",
    possible_unmet_need: "Alignment, integrity, or relief from what feels off.",
    user_story_or_assumption: "Part of you may be noticing that this no longer fits who you want to be.",
    fact_vs_interpretation: "Fact: something feels wrong or off. Interpretation: that signal may be asking for a cleaner fit, not more force.",
    micro_decision: "Identify the one detail that feels most misaligned.",
    macro_decision: "Decide whether this path still feels like yours.",
    next_socratic_question: "What feels off or misaligned about this?",
  },
  sadness: {
    emotion_state: "quiet heaviness",
    likely_trigger: "A loss, disappointment, or the feeling that something hasn’t become what you hoped.",
    action_tendency: "Withdraw, slow down, and conserve energy.",
    possible_unmet_need: "Comfort, acknowledgment, or space to grieve.",
    user_story_or_assumption: "Part of you may be grieving what you thought this would be.",
    fact_vs_interpretation: "Fact: there is heaviness in what you shared. Interpretation: some of that weight may come from loss or disappointment, not just indecision.",
    micro_decision: "Name what you may be needing to acknowledge first.",
    macro_decision: "Decide whether you are ready to keep investing in this direction.",
    next_socratic_question: "What feels like a loss underneath this?",
  },
  enjoyment: {
    emotion_state: "open momentum",
    likely_trigger: "Something feels energizing, clear, or worth moving toward.",
    action_tendency: "Lean in, explore, and keep going.",
    possible_unmet_need: "Room to grow, express yourself, or continue what works.",
    user_story_or_assumption: "Part of you may already know what feels alive here.",
    fact_vs_interpretation: "Fact: something in this feels energizing. Interpretation: that signal may be worth protecting and building on.",
    micro_decision: "Notice what feels worth doing next.",
    macro_decision: "Decide how to keep this momentum alive over time.",
    next_socratic_question: "What feels most worth keeping alive here?",
  },
};

function generateSocraticQuestion(emotionAnalysis: EmotionAnalysis) {
  if (emotionAnalysis.emotion_family === "mixed" || emotionAnalysis.emotion_family === "unclear") {
    return "What feels most at risk, and what feels most important to protect?";
  }

  if (emotionAnalysis.intensity === "high") {
    return emotionAnalysis.next_socratic_question;
  }

  return emotionAnalysis.next_socratic_question;
}

function analyzeEmotionSignal(userMessage: string): EmotionAnalysis {
  const text = userMessage.toLowerCase();
  const scores: Record<Exclude<EmotionFamily, "mixed" | "unclear">, number> = {
    anger: 0,
    fear: 0,
    disgust: 0,
    sadness: 0,
    enjoyment: 0,
  };

  (Object.keys(EMOTION_KEYWORDS) as Array<Exclude<EmotionFamily, "mixed" | "unclear">>).forEach((family) => {
    EMOTION_KEYWORDS[family].forEach((keyword) => {
      if (text.includes(keyword)) scores[family] += 1;
    });
  });

  if (/!/.test(userMessage)) scores.anger += 1;
  if (/(change|stuck|afraid|worried|uncertain|risk|maybe|not sure|don't know|dont know)/.test(text)) scores.fear += 1;
  if (/(loss|sad|heavy|drained|not growing|missing|grief|disappointed)/.test(text)) scores.sadness += 1;
  if (/(off|wrong|misaligned|can't stand|cannot stand|resent)/.test(text)) scores.disgust += 1;
  if (/(excited|hopeful|relieved|aligned|curious|energized|motivated)/.test(text)) scores.enjoyment += 1;

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]) as [Exclude<EmotionFamily, "mixed" | "unclear">, number][];
  const [topFamily, topScore] = ranked[0];
  const [, secondScore] = ranked[1];
  const totalSignals = ranked.reduce((sum, [, score]) => sum + score, 0);

  const emotion_family: EmotionFamily =
    totalSignals === 0 ? "unclear" : topScore === secondScore && topScore > 0 ? "mixed" : topFamily;

  const intensity: EmotionIntensity =
    totalSignals >= 5 || /really|deeply|very|afraid|terrified|overwhelmed|can’t|can't/i.test(userMessage)
      ? "high"
      : totalSignals >= 2
        ? "medium"
        : "low";

  const fallbackConfig = EMOTION_CONFIG.fear;
  const config = emotion_family === "mixed" || emotion_family === "unclear" ? fallbackConfig : EMOTION_CONFIG[emotion_family];
  const likely_trigger =
    text.includes("career") || text.includes("job")
      ? "Your work direction feels tied to the tension."
      : text.includes("relationship")
        ? "The tension seems connected to a close relationship."
        : config.likely_trigger;

  const emotion_state =
    emotion_family === "mixed"
      ? "pulled between caution and change"
      : emotion_family === "unclear"
        ? "not yet clear"
        : config.emotion_state;

  const analyzed: EmotionAnalysis = {
    emotion_family,
    emotion_state,
    intensity,
    likely_trigger,
    action_tendency:
      emotion_family === "mixed" || emotion_family === "unclear"
        ? "Hold back while you make sense of both sides."
        : config.action_tendency,
    possible_unmet_need:
      emotion_family === "mixed" || emotion_family === "unclear" ? "Clarity and safety." : config.possible_unmet_need,
    user_story_or_assumption:
      emotion_family === "mixed" || emotion_family === "unclear"
        ? "Part of you may be protecting stability while another part wants movement."
        : config.user_story_or_assumption,
    fact_vs_interpretation:
      emotion_family === "mixed" || emotion_family === "unclear"
        ? "Fact: you are unsure. Interpretation: uncertainty may be protecting something important."
        : config.fact_vs_interpretation,
    micro_decision:
      emotion_family === "mixed" || emotion_family === "unclear" ? "Identify the safest next step." : config.micro_decision,
    macro_decision:
      emotion_family === "mixed" || emotion_family === "unclear"
        ? "Decide what direction deserves more attention."
        : config.macro_decision,
    next_socratic_question: config.next_socratic_question,
  };

  analyzed.next_socratic_question = generateSocraticQuestion(analyzed);
  return analyzed;
}

function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-5 pt-3 text-[12px] font-semibold ${dark ? "text-white" : "text-[#1D1D1F]"}`}>
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <div className="flex items-end gap-0.5">
          <span className={`block h-1.5 w-1 rounded-sm ${dark ? "bg-white" : "bg-black"}`} />
          <span className={`block h-2 w-1 rounded-sm ${dark ? "bg-white" : "bg-black"}`} />
          <span className={`block h-2.5 w-1 rounded-sm ${dark ? "bg-white" : "bg-black"}`} />
        </div>
        <span className="text-[11px]">⌁</span>
        <div className={`h-2.5 w-5 rounded-[3px] border ${dark ? "border-white" : "border-black"}`}>
          <div className={`m-[1px] h-[6px] w-3.5 rounded-[2px] ${dark ? "bg-white" : "bg-black"}`} />
        </div>
      </div>
    </div>
  );
}

function PhoneFrame({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[390px]">
      <div
        className="min-h-[844px] overflow-hidden rounded-[28px] border shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
        style={{
          background: dark ? colors.dark : colors.bg,
          borderColor: dark ? "#2c3138" : colors.border,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="h-14 w-full rounded-2xl text-sm font-semibold text-white shadow-sm transition active:scale-[0.99]"
      style={{ background: `linear-gradient(135deg, ${colors.orange2}, ${colors.orange})` }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="h-14 w-full rounded-2xl border border-[#E8E0D7] bg-[#FEFCFA] text-sm font-semibold text-[#1D1D1F] transition active:scale-[0.99]"
    >
      {children}
    </button>
  );
}

function Header({
  title,
  subtitle,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <div className="px-5 pt-4">
      <div className="grid grid-cols-[36px_1fr_36px] items-center">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full active:bg-black/5">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold">{title}</div>
          {subtitle ? <div className="text-[11px] text-[#777]">{subtitle}</div> : null}
        </div>
        <div className="grid h-9 w-9 place-items-center">{right ?? <MoreHorizontal size={19} />}</div>
      </div>
    </div>
  );
}

function ProgressHeader({ step, total = 5 }: { step: number; total?: number }) {
  return (
    <div className="px-6 pt-5">
      <div className="flex items-center gap-4">
        <div className="h-1 flex-1 rounded-full bg-[#E8E0D7]">
          <div className="h-1 rounded-full bg-[#C88725]" style={{ width: `${(step / total) * 100}%` }} />
        </div>
        <span className="text-xs font-semibold text-[#6B6B6B]">
          {step} / {total}
        </span>
      </div>
    </div>
  );
}

function BottomNav({
  active,
  setScreen,
}: {
  active: Screen;
  setScreen: (screen: Screen) => void;
}) {
  const items = [
    ["home", Home, "Home"],
    ["sessions", WalletCards, "Sessions"],
    ["wisdomArchive", Archive, "Archive"],
    ["insights", BarChart3, "Insights"],
    ["profile", User, "Profile"],
  ] as const;

  return (
    <div className="absolute inset-x-0 bottom-0 h-[72px] border-t bg-[#FEFCFA]/95 px-3 pt-2 backdrop-blur-sm" style={{ borderColor: colors.border }}>
      <div className="grid grid-cols-5">
        {items.map(([key, Icon, label]) => {
          const isActive = active === key;
          return (
            <button key={key} onClick={() => setScreen(key)} className="flex flex-col items-center gap-1 text-[10px] font-semibold">
              <Icon size={19} color={isActive ? colors.orange : "#777"} />
              <span style={{ color: isActive ? colors.orange : "#777" }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScreenShell({
  children,
  nav,
  active,
  setScreen,
  dark = false,
}: {
  children: React.ReactNode;
  nav?: boolean;
  active?: Screen;
  setScreen: (screen: Screen) => void;
  dark?: boolean;
}) {
  return (
    <div className="relative min-h-[844px] pb-[86px]">
      <StatusBar dark={dark} />
      {children}
      {nav && active ? <BottomNav active={active} setScreen={setScreen} /> : null}
    </div>
  );
}

function MountainCard({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: dark
          ? "linear-gradient(180deg, rgba(30,34,42,0.65), rgba(18,21,27,0.96)), radial-gradient(circle at 75% 15%, rgba(255,218,150,0.45), transparent 18%), linear-gradient(145deg,#87918f,#222832 70%)"
          : "linear-gradient(180deg,#EAF1F2,#F4E8D3 44%,#4C6559 100%)",
      }}
    >
      <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(135deg,transparent_40%,rgba(0,0,0,.35)_41%),linear-gradient(45deg,rgba(0,0,0,.25)_35%,transparent_36%)] opacity-60" />
      <div className="absolute right-10 top-24 h-8 w-8 rounded-full bg-white/70" />
    </div>
  );
}

function HeroLandscape() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[360px] overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(244,193,93,0.08),rgba(77,101,89,0.05)),radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.65),transparent_22%),linear-gradient(180deg,#F7EEDD_0%,#F3E7D7_35%,#5F7866_100%)]" />
      <div className="absolute -left-10 bottom-10 h-44 w-[130%] rounded-t-[100%] bg-[linear-gradient(180deg,rgba(83,96,92,0.9),rgba(52,66,59,1))]" />
      <div className="absolute left-[18%] bottom-[96px] h-20 w-12 rounded-t-full bg-[#1E2427]" />
      <div className="absolute left-[20%] bottom-[150px] h-7 w-7 rounded-full bg-[#1E2427]" />
      <div className="absolute right-12 top-14 h-6 w-6 rounded-full bg-white/75 blur-[1px]" />
    </div>
  );
}

function Chip({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-9 rounded-full px-4 text-xs font-semibold transition active:scale-[0.99] ${
        active ? "bg-[#1F2329] text-white" : "border bg-[#FEFCFA] text-[#555]"
      }`}
      style={{ borderColor: colors.border }}
    >
      {children}
    </button>
  );
}

function OptionCard({
  icon: Icon,
  title,
  description,
  tone,
  selected,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  tone: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition active:scale-[0.99]"
      style={{ background: tone, borderColor: selected ? colors.orange : colors.border }}
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/60">
        <Icon size={22} color={selected ? "#9D6517" : "#6D7B68"} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs leading-4 text-[#555]">{description}</div>
      </div>
      <div
        className={`grid h-6 w-6 place-items-center rounded-full border ${
          selected ? "border-[#E9A23B] bg-[#E9A23B]" : "border-[#CFC7BE] bg-transparent"
        }`}
      >
        {selected ? <Check size={14} color="white" /> : null}
      </div>
    </button>
  );
}

function SessionCard({
  title,
  snippet,
  meta,
  progress,
  icon: Icon,
  tone,
  complete = false,
  onClick,
}: {
  title: string;
  snippet: string;
  meta: string;
  progress?: string;
  icon: React.ElementType;
  tone: string;
  complete?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full gap-3 rounded-2xl border bg-[#FEFCFA] p-3 text-left transition active:scale-[0.99]"
      style={{ borderColor: colors.border }}
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: tone }}>
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <div className="text-xs font-semibold">{title}</div>
          {complete ? <Check size={16} color={colors.orange} /> : <MoreHorizontal size={15} />}
        </div>
        <div className="mt-1 text-[11px] leading-4 text-[#555]">{snippet}</div>
        <div className="mt-1 text-[10px] text-[#777]">{meta}</div>
        {progress ? (
          <div className="mt-2 h-1.5 rounded-full bg-[#EFE7DC]">
            <div className="h-1.5 rounded-full bg-[#E9A23B]" style={{ width: progress }} />
          </div>
        ) : null}
      </div>
      {progress ? <div className="self-center text-xs font-semibold text-[#E9A23B]">{progress}</div> : null}
    </button>
  );
}

function PathCard({
  title,
  subtitle,
  meta,
  tone = "dark",
  onClick,
}: {
  title: string;
  subtitle: string;
  meta: string;
  tone?: "dark" | "pink";
  onClick?: () => void;
}) {
  const isDark = tone === "dark";
  return (
    <button onClick={onClick} className="relative mt-4 h-[124px] w-full overflow-hidden rounded-2xl text-left transition active:scale-[0.99]">
      {isDark ? (
        <MountainCard dark className="absolute inset-0" />
      ) : (
        <div className="absolute inset-0 bg-[#C98E86]">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(80,20,30,.5),rgba(255,231,220,.15))]" />
        </div>
      )}
      <div className="relative z-10 p-5 text-white">
        <div className="text-lg font-bold">{title}</div>
        <p className="mt-2 max-w-[230px] text-xs leading-4">{subtitle}</p>
        <div className="mt-4 text-xs font-semibold">{meta}</div>
      </div>
    </button>
  );
}

function InsightCard({
  title,
  subtitle,
  bars,
  onClick,
}: {
  title: string;
  subtitle: string;
  bars: number[];
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="mt-4 w-full rounded-2xl border bg-[#FEFCFA] p-5 text-left" style={{ borderColor: colors.border }}>
      <div className="flex justify-between">
        <h3 className="max-w-[250px] text-base font-semibold leading-5">{title}</h3>
        <HelpCircle size={16} />
      </div>
      <p className="mt-2 text-xs leading-4 text-[#777]">{subtitle}</p>
      <div className="mt-7 flex h-20 items-end gap-4">
        {bars.map((h, i) => (
          <div key={i} className="w-4 rounded-full bg-[#E9BA72]" style={{ height: h }} />
        ))}
      </div>
    </button>
  );
}

function ToggleRow({ label, on }: { label: string; on?: boolean }) {
  return (
    <div className="flex items-center justify-between py-4 text-sm">
      <span>{label}</span>
      <div className={`flex h-7 w-12 items-center rounded-full px-1 ${on ? "justify-end bg-[#43B66A]" : "justify-start bg-[#D9D9D9]"}`}>
        <div className="h-5 w-5 rounded-full bg-white shadow" />
      </div>
    </div>
  );
}

function ChatBubble({
  children,
  variant = "assistant",
}: {
  children: React.ReactNode;
  variant?: "assistant" | "user";
}) {
  if (variant === "user") {
    return <div className="ml-auto max-w-[255px] rounded-2xl bg-[#FFF4E5] px-4 py-3 text-xs leading-5">{children}</div>;
  }

  return (
    <div className="ml-10 max-w-[260px] rounded-2xl border bg-[#FEFCFA] px-4 py-3 text-xs leading-5" style={{ borderColor: colors.border }}>
      {children}
    </div>
  );
}

function EmptyStateCard({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
}) {
  return (
    <div className="rounded-2xl border bg-[#FEFCFA] p-5" style={{ borderColor: colors.border }}>
      <div className="grid h-11 w-11 place-items-center rounded-full bg-[#FFF4E5]">
        <Icon size={18} color={colors.orange} />
      </div>
      <div className="mt-4 text-sm font-semibold">{title}</div>
      <p className="mt-2 text-xs leading-5 text-[#555]">{description}</p>
      <div className="mt-4 text-xs font-semibold text-[#C88725]">{action}</div>
    </div>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm font-semibold">{title}</div>
      {action ? (
        <button onClick={onAction} className="text-xs text-[#777]">
          {action}
        </button>
      ) : null}
    </div>
  );
}

function Landing({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <div className="relative min-h-[844px] overflow-hidden">
        <StatusBar />
        <div className="px-7 pt-14">
          <div className="flex items-center gap-1 text-[28px] font-semibold tracking-[-0.04em]">
            lifemode <span className="mt-1 h-3 w-3 rounded-full bg-[#E9A23B]" />
          </div>
          <h1 className="mt-14 whitespace-pre-line text-[32px] font-semibold leading-[1.08] tracking-[-0.04em]">
            Think clearly{"\n"}about your life.
          </h1>
          <p className="mt-4 max-w-[250px] text-sm leading-6 text-[#555]">
            Guided conversations and proven frameworks to help you make better decisions.
          </p>
        </div>
        <HeroLandscape />
        <div className="absolute bottom-12 left-6 right-6">
          <PrimaryButton onClick={() => setScreen("intent")}>Claim Your Clarity</PrimaryButton>
          <button onClick={() => setScreen("account")} className="mt-4 text-center text-xs font-semibold text-[#6B6B6B]">Already have an account? Log in</button>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Intent({ setScreen, sessionState, setSessionState }: { setScreen: (screen: Screen) => void; sessionState: SessionState; setSessionState: React.Dispatch<React.SetStateAction<SessionState>> }) {
  const [selected, setSelected] = useState<string | null>("Career direction");
  const hasThought = !!(sessionState?.latest_user_message?.trim());
  const [isReturning, setIsReturning] = useState(sessionState?.returningUser || false);
  React.useEffect(() => {
    setIsReturning(sessionState?.returningUser || false);
  }, [sessionState?.returningUser]);
  const opts: Array<{
    icon: React.ElementType;
    title: string;
    desc: string;
    tone: string;
  }> = [
    { icon: BriefcaseBusiness, title: "Career direction", desc: "Find purpose and clarity in your career", tone: "#FFF4E5" },
    { icon: Heart, title: "Relationship clarity", desc: "Navigate relationships and emotions", tone: colors.pink },
    { icon: Leaf, title: "Life decisions", desc: "Make important life decisions", tone: colors.green },
    { icon: Brain, title: "Overthinking & anxiety", desc: "Understand your mind and reduce stress", tone: colors.purple },
  ];

  return (
    <PhoneFrame>
      <ScreenShell setScreen={setScreen}>
        <div className="px-5 pt-4">
          <button onClick={() => setScreen(isReturning ? "home" : "landing")} className="grid h-9 w-9 place-items-center rounded-full active:bg-black/5">
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="px-6 pt-6">
          <h2 className="text-[25px] font-bold tracking-[-0.03em]">What brings you here?</h2>
          <p className="mt-2 text-sm text-[#6B6B6B]">Select one.</p>
          <div className="mt-7 space-y-3">
            {opts.map((item) => (
              <OptionCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.desc}
                tone={item.tone}
                selected={selected === item.title}
                onClick={() => {
                  setSelected(item.title);
                  setSessionState((prev) => ({ ...prev, intent: item.title }));
                }}
              />
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-6 right-6">
          <PrimaryButton onClick={() => {
            setSessionState((prev) => ({ ...prev, currentSessionId: null }));
            setScreen(hasThought ? "chat" : "thought");
          }}>Continue</PrimaryButton>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Thought({ setScreen, setSessionState }: { setScreen: (screen: Screen) => void; setSessionState: React.Dispatch<React.SetStateAction<SessionState>> }) {
  const [thought, setThought] = useState("");

  const handleContinue = () => {
    const text = thought.trim() || "I feel stuck in my career. I'm not sure if I should keep going or make a change.";
    setSessionState((prev) => ({
      ...prev,
      latest_user_message: text,
      emotion_analysis: analyzeEmotionSignal(text),
    }));
    setScreen("chat");
  };

  return (
    <PhoneFrame>
      <ScreenShell setScreen={setScreen}>
        <div className="px-5 pt-4">
          <button onClick={() => setScreen("intent")} className="grid h-9 w-9 place-items-center rounded-full active:bg-black/5">
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="px-6 pt-6">
          <h2 className="whitespace-pre-line text-[28px] font-bold leading-tight tracking-[-0.04em]">
            What's on your{"\n"}mind right now?
          </h2>
          <p className="mt-3 max-w-[260px] text-sm leading-5 text-[#555]">Share anything. No rush, you are at the present.</p>
          <div className="mt-8 rounded-2xl border bg-[#FEFCFA] p-5" style={{ borderColor: colors.border }}>
            <textarea
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              placeholder="I feel stuck in my career. I'm not sure if I should keep going or make a change."
              className="min-h-[228px] w-full resize-none bg-transparent text-sm leading-7 text-[#1D1D1F] outline-none placeholder:text-[#bbb]"
            />
            <div className="text-right text-xs text-[#777]">{thought.length}/500</div>
          </div>
        </div>
        <div className="absolute bottom-8 left-6 right-6">
          <PrimaryButton onClick={handleContinue}>Continue</PrimaryButton>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Mode({ setScreen, setSessionState }: { setScreen: (screen: Screen) => void; setSessionState: React.Dispatch<React.SetStateAction<SessionState>> }) {
  const [selected, setSelected] = useState<"quick" | "deep">("quick");

  const handleContinue = () => {
    setSessionState((prev) => ({ ...prev, mode: selected }));
    setScreen("chat");
  };

  return (
    <PhoneFrame>
      <ScreenShell setScreen={setScreen}>
        <div className="px-5 pt-4">
          <button onClick={() => setScreen("thought")} className="grid h-9 w-9 place-items-center rounded-full active:bg-black/5">
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="px-6 pt-6">
          <h2 className="whitespace-pre-line text-[28px] font-bold leading-tight tracking-[-0.04em]">
            How do you want{"\n"}to begin?
          </h2>
          <p className="mt-3 text-sm text-[#555]">You can always switch later.</p>
          <div className="mt-10 space-y-4">
            <button onClick={() => setSelected("quick")} className="flex gap-4 rounded-2xl border bg-[#FFF4E5] p-5 text-left" style={{ borderColor: selected === "quick" ? colors.orange : colors.border }}>
              <Zap className="mt-1" size={25} color={colors.orange} fill={colors.orange} />
              <div className="flex-1">
                <div className="font-semibold">Quick clarity</div>
                <div className="text-xs font-semibold text-[#555]">5–10 min</div>
                <p className="mt-2 text-xs leading-5 text-[#555]">Get quick perspective on what's on your mind.</p>
              </div>
              <div className="grid h-6 w-6 place-items-center rounded-full" style={{ background: selected === "quick" ? colors.orange : "#CFC7BE" }}>
                <Check size={14} color="white" />
              </div>
            </button>
            <button onClick={() => setSelected("deep")} className="flex gap-4 rounded-2xl border bg-[#FEFCFA] p-5 text-left" style={{ borderColor: selected === "deep" ? colors.orange : colors.border }}>
              <Leaf className="mt-1" size={25} color="#5EA374" />
              <div className="flex-1">
                <div className="font-semibold">Deep session</div>
                <div className="text-xs font-semibold text-[#555]">20+ min</div>
                <p className="mt-2 text-xs leading-5 text-[#555]">Go deeper with guided reflection and frameworks.</p>
              </div>
              <div className="grid h-6 w-6 place-items-center rounded-full" style={{ background: selected === "deep" ? colors.orange : "#CFC7BE" }}>
                {selected === "deep" ? <Check size={14} color="white" /> : <Circle size={22} color="#CFC7BE" />}
              </div>
            </button>
          </div>
        </div>
        <div className="absolute bottom-8 left-6 right-6">
          <PrimaryButton onClick={handleContinue}>Continue</PrimaryButton>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function QuickClarity({ setScreen, sessionState, setSessionState }: { setScreen: (screen: Screen) => void; sessionState: SessionState; setSessionState: React.Dispatch<React.SetStateAction<SessionState>> }) {
  const clarity = sessionState.clarityData;
  const micro = clarity?.micro || sessionState.emotion_analysis.micro_decision;
  const macro = clarity?.macro || sessionState.emotion_analysis.macro_decision;
  const perspective = clarity?.perspective || "Small actions compound into real change. What you do today echoes beyond this moment.";
  const [title, setTitle] = useState(sessionState.intent || "My session");
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("Philippines");
  const allChatText = (sessionState.sessions?.find((s) => s.id === sessionState.currentSessionId)?.messages || []).map((m) => m.text).join(" ");
  React.useEffect(() => {
    if (!crisisDetected && detectCrisisKeywords(allChatText)) {
      setCrisisDetected(true);
    }
  }, []);

  return (
    <PhoneFrame>
      <ScreenShell setScreen={setScreen}>
        <div className="px-6 pt-10 pb-24">
          <h2 className="text-[25px] font-bold tracking-[-0.03em]">Here's your clarity</h2>
          <p className="mt-2 text-sm text-[#555]">Two lenses to help you see your situation clearly.</p>
          <div className="mt-6 rounded-2xl border bg-[#FEFCFA] p-4" style={{ borderColor: colors.border }}>
            <div className="text-xs font-semibold text-[#777]">Session name</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full bg-transparent text-sm font-semibold text-[#1D1D1F] outline-none"
              placeholder="Name your session"
            />
          </div>
          <div className="mt-6 space-y-4">
            <div className="overflow-hidden rounded-2xl border bg-[#FEFCFA]" style={{ borderColor: colors.border }}>
              <div className="flex items-center gap-4 p-5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ background: colors.orange + "30" }}>
                  <Zap size={22} color={colors.orange} />
                </div>
                <div>
                  <div className="text-sm font-semibold">Micro Lens</div>
                  <div className="mt-0.5 text-xs text-[#555]">How this affects your small actions</div>
                </div>
              </div>
              <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: colors.border }}>
                <p className="text-sm leading-6 text-[#555]">{micro}</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-[#FEFCFA]" style={{ borderColor: colors.border }}>
              <div className="flex items-center gap-4 p-5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ background: "#5EA374" + "30" }}>
                  <Compass size={22} color="#5EA374" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Macro Lens</div>
                  <div className="mt-0.5 text-xs text-[#555]">The bigger picture and ripple effect</div>
                </div>
              </div>
              <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: colors.border }}>
                <p className="text-sm leading-6 text-[#555]">{macro}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[#E9A23B] bg-[#FFF7E8] p-5 text-center">
              <div className="text-xs font-semibold text-[#9D6517]">Perspective</div>
              <p className="mt-2 text-sm leading-6 text-[#555]">{perspective}</p>
            </div>
          </div>
          <p className="mt-8 text-center text-xs leading-5 text-[#555]">This is enough for now. Clarity comes from enough thinking + letting go, not more thinking.</p>
          <div className="mt-8">
            <PrimaryButton onClick={() => {
              const saved: SavedSession = {
                id: sessionState.currentSessionId || crypto.randomUUID(),
                intent: sessionState.intent,
                mode: "quick",
                thought: sessionState.latest_user_message,
                messages: [],
                exchangeCount: 0,
                status: "archived",
                clarityData: clarity,
                createdAt: new Date().toISOString(),
              };
              setSessionState((prev) => ({
                ...prev,
                sessions: [saved, ...prev.sessions.filter((s) => s.id !== saved.id)],
              }));
              setScreen("home");
            }}>Save & continue</PrimaryButton>
            <SecondaryButton onClick={() => {
              setSessionState((prev) => ({ ...prev, currentSessionId: null, latest_user_message: "" }));
              setScreen("intent");
            }}>Start a new session</SecondaryButton>
            {crisisDetected && (
              <div className="mt-4 rounded-2xl border border-[#E9A23B] bg-[#FFF7E8] p-5">
                <div className="text-sm font-bold text-[#9D6517]">Talk to Someone</div>
                <div className="mt-2 text-xs text-[#7A5A2A]">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="mb-3 h-9 w-full rounded-xl border border-[#E8D5B0] bg-white px-3 text-xs outline-none"
                  >
                    {Object.keys(crisisLines).map((c) => (
                      <option key={c} value={c}>{crisisLines[c].name}</option>
                    ))}
                  </select>
                  {crisisLines[selectedCountry]?.numbers.map((num) => (
                    <div key={num} className="mt-1 font-semibold text-[#9D6517]">{num}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function ClarityScreen({ setScreen, sessionState, setSessionState }: { setScreen: (screen: Screen) => void; sessionState: SessionState; setSessionState: React.Dispatch<React.SetStateAction<SessionState>> }) {
  const clarity = sessionState.clarityData;
  const micro = clarity?.micro || sessionState.emotion_analysis.macro_decision;
  const macro = clarity?.macro || "Beyond this moment, the ripple effect matters.";
  const perspective = clarity?.perspective || "Small actions compound into real change. What you do today echoes beyond this moment.";
  const [title, setTitle] = useState(sessionState.intent || "My session");
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("Philippines");
  const allChatText = (sessionState.sessions?.find((s) => s.id === sessionState.currentSessionId)?.messages || []).map((m) => m.text).join(" ");
  React.useEffect(() => {
    if (!crisisDetected && detectCrisisKeywords(allChatText)) {
      setCrisisDetected(true);
    }
  }, []);

  return (
    <PhoneFrame>
      <ScreenShell setScreen={setScreen}>
        <div className="px-6 pt-10 pb-24">
          <h2 className="text-[25px] font-bold tracking-[-0.03em]">Here's your clarity</h2>
          <p className="mt-2 text-sm text-[#555]">Two lenses to help you see your situation clearly.</p>
          <div className="mt-6 rounded-2xl border bg-[#FEFCFA] p-4" style={{ borderColor: colors.border }}>
            <div className="text-xs font-semibold text-[#777]">Session name</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full bg-transparent text-sm font-semibold text-[#1D1D1F] outline-none"
              placeholder="Name your session"
            />
          </div>
          <div className="mt-6 space-y-4">
            <div className="overflow-hidden rounded-2xl border bg-[#FEFCFA]" style={{ borderColor: colors.border }}>
              <div className="flex items-center gap-4 p-5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ background: colors.orange + "30" }}>
                  <Zap size={22} color={colors.orange} />
                </div>
                <div>
                  <div className="text-sm font-semibold">Micro Lens</div>
                  <div className="mt-0.5 text-xs text-[#555]">How this affects your small actions</div>
                </div>
              </div>
              <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: colors.border }}>
                <p className="text-sm leading-6 text-[#555]">{micro}</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-[#FEFCFA]" style={{ borderColor: colors.border }}>
              <div className="flex items-center gap-4 p-5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ background: "#5EA374" + "30" }}>
                  <Compass size={22} color="#5EA374" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Macro Lens</div>
                  <div className="mt-0.5 text-xs text-[#555]">The bigger picture and ripple effect</div>
                </div>
              </div>
              <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: colors.border }}>
                <p className="text-sm leading-6 text-[#555]">{macro}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[#E9A23B] bg-[#FFF7E8] p-5 text-center">
              <div className="text-xs font-semibold text-[#9D6517]">Perspective</div>
              <p className="mt-2 text-sm leading-6 text-[#555]">{perspective}</p>
            </div>
          </div>
          <p className="mt-8 text-center text-xs leading-5 text-[#555]">This is enough for now. Clarity comes from enough thinking + letting go, not more thinking.</p>
          <div className="mt-8">
            <PrimaryButton onClick={() => {
              const saved: SavedSession = {
                id: sessionState.currentSessionId || crypto.randomUUID(),
                intent: sessionState.intent,
                mode: "deep",
                thought: sessionState.latest_user_message,
                messages: [],
                exchangeCount: 0,
                status: "archived",
                clarityData: clarity,
                createdAt: new Date().toISOString(),
              };
              setSessionState((prev) => ({
                ...prev,
                sessions: [saved, ...prev.sessions.filter((s) => s.id !== saved.id)],
              }));
              setScreen("home");
            }}>Save & continue</PrimaryButton>
            <SecondaryButton onClick={() => {
              setSessionState((prev) => ({ ...prev, currentSessionId: null, latest_user_message: "" }));
              setScreen("intent");
            }}>Start a new session</SecondaryButton>
          </div>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Account({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const [isSignIn, setIsSignIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSignUp = async () => {
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message);
    } else {
      setScreen("home");
    }
  };

  const handleSignIn = async () => {
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message);
    } else {
      setScreen("home");
    }
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) console.error("Google sign-in error:", error);
  };

  return (
    <PhoneFrame>
      <ScreenShell setScreen={setScreen}>
        <div className="px-6 pt-16">
          <h2 className="text-[26px] font-bold tracking-[-0.03em]">{isSignIn ? "Welcome back" : "Save your session"}</h2>
          <p className="mt-2 text-sm text-[#555]">{isSignIn ? "Log in to access your wisdom." : "Create an account to keep your clarity."}</p>
          {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
          <div className="mt-6 space-y-3">
            <SecondaryButton onClick={handleGoogle}>Continue with Google</SecondaryButton>
          </div>
          <div className="my-7 flex items-center gap-4 text-xs text-[#777]">
            <span className="h-px flex-1 bg-[#E8E0D7]" />
            or
            <span className="h-px flex-1 bg-[#E8E0D7]" />
          </div>
          <div className="space-y-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 w-full rounded-2xl border bg-white px-4 text-sm outline-none placeholder:text-[#999]"
              placeholder="Email address"
              type="email"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 w-full rounded-2xl border bg-white px-4 text-sm outline-none placeholder:text-[#999]"
              placeholder="Password"
              type="password"
            />
          </div>
        </div>
        <div className="absolute bottom-12 left-6 right-6">
          <PrimaryButton onClick={isSignIn ? handleSignIn : handleSignUp}>
            {busy ? "Please wait..." : isSignIn ? "Log in" : "Create account"}
          </PrimaryButton>
          <button onClick={() => { setIsSignIn(!isSignIn); setError(""); }} className="mt-3 h-12 w-full text-center text-xs font-semibold text-[#555]">
            {isSignIn ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
          <p className="mx-auto mt-5 max-w-[250px] text-center text-[11px] leading-4 text-[#777]">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function SessionSetup({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const topics = [
    { icon: BriefcaseBusiness, title: "Career clarity", desc: "Work, growth, direction" },
    { icon: Heart, title: "Relationship clarity", desc: "Connection, boundaries, honesty" },
    { icon: Leaf, title: "Life decisions", desc: "Moves, changes, tradeoffs" },
    { icon: Brain, title: "Overthinking & anxiety", desc: "Loops, pressure, uncertainty" },
  ];

  return (
    <PhoneFrame>
      <ScreenShell nav active="sessions" setScreen={setScreen}>
        <Header title="Start a session" subtitle="Pick the kind of clarity you want" onBack={() => setScreen("sessions")} />
        <div className="px-6 pt-6">
          <SectionHeader title="Choose a topic" />
          <div className="mt-3 space-y-3">
            {topics.map((topic, index) => {
              const Icon = topic.icon;
              return (
                <OptionCard
                  key={topic.title}
                  icon={Icon}
                  title={topic.title}
                  description={topic.desc}
                  tone={index === 0 ? "#FFF4E5" : index === 1 ? colors.pink : index === 2 ? colors.green : colors.purple}
                  selected={index === 0}
                  onClick={() => setScreen("chat")}
                />
              );
            })}
          </div>
        </div>
        <div className="absolute bottom-8 left-6 right-6">
          <PrimaryButton onClick={() => setScreen("chat")}>Start session</PrimaryButton>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function HomeScreen({ setScreen, sessionState, setSessionState }: { setScreen: (screen: Screen) => void; sessionState: SessionState; setSessionState: React.Dispatch<React.SetStateAction<SessionState>> }) {
  const [homeThought, setHomeThought] = useState("");

  const handleThoughtSubmit = () => {
    const thought = homeThought.trim();
    if (!thought) return;
    setSessionState((prev) => ({
      ...prev,
      latest_user_message: thought,
      emotion_analysis: analyzeEmotionSignal(thought),
    }));
    setScreen("intent");
  };

  const inProgress = (sessionState.sessions || []).filter((s) => s.status === "in_progress");
  const latest = inProgress[0];

  const quicks = [
    { icon: BriefcaseBusiness, label: "Career", bg: colors.blue },
    { icon: Heart, label: "Relationships", bg: colors.pink },
    { icon: Leaf, label: "Decision", bg: colors.green },
    { icon: Brain, label: "Anxiety", bg: colors.purple },
  ];

  return (
    <PhoneFrame>
      <ScreenShell nav active="home" setScreen={setScreen}>
        <div className="px-5 pt-5">
          <div className="flex justify-between">
            <button onClick={() => setScreen("profile")} className="grid h-9 w-9 place-items-center rounded-full">
              <Menu size={21} />
            </button>
            <button onClick={() => setScreen("notifications")} className="grid h-9 w-9 place-items-center rounded-full">
              <Bell size={19} />
            </button>
          </div>
          <h2 className="mt-7 text-[21px] font-bold">Good evening, John.</h2>

          <div className="relative mt-5 min-h-[140px] w-full overflow-hidden rounded-2xl border border-[#E8E0D7] bg-white shadow-sm">
            <div className="flex h-full flex-col justify-between gap-3 p-4">
              <textarea
                value={homeThought}
                onChange={(e) => setHomeThought(e.target.value)}
                placeholder="What's on your mind?"
                rows={3}
                className="w-full resize-none text-sm text-[#1D1D1F] outline-none placeholder:text-[#999]"
              />
              <div className="flex justify-end">
                <button onClick={handleThoughtSubmit} className="grid h-9 w-9 place-items-center rounded-full bg-[#1F2329]">
                  <ArrowRight size={17} color="white" />
                </button>
              </div>
            </div>
          </div>

          <SectionHeader title="Quick options" action="See all" onAction={() => {
            setSessionState((prev) => ({ ...prev, latest_user_message: "" }));
            setScreen("intent");
          }} />
          <div className="mt-3 grid grid-cols-4 gap-3">
            {quicks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setSessionState((prev) => ({ ...prev, latest_user_message: "" }));
                    setScreen("intent");
                  }}
                  className="h-[76px] rounded-2xl border bg-white text-[10px] font-semibold transition active:scale-[0.99]"
                  style={{ borderColor: colors.border }}
                >
                  <div className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-xl" style={{ background: item.bg }}>
                    <Icon size={16} />
                  </div>
                  {item.label}
                </button>
              );
            })}
          </div>

          {latest && (
            <>
              <div className="mt-6 text-sm font-semibold">Continue where you left off</div>
              <SessionCard
                title={latest.intent || "Session"}
                snippet={latest.thought?.slice(0, 60) || ""}
                meta={`In progress • ${latest.exchangeCount} exchanges`}
                progress={`${Math.min(latest.exchangeCount * 10, 90)}%`}
                icon={MountainCard as unknown as React.ElementType}
                tone={colors.blue}
                onClick={() => {
                  setSessionState((prev) => ({
                    ...prev,
                    currentSessionId: latest.id,
                    intent: latest.intent,
                    mode: latest.mode,
                    latest_user_message: latest.thought,
                  }));
                  setScreen("chat");
                }}
              />
            </>
          )}

        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function SessionDetail({ setScreen, sessionState, setSessionState }: { setScreen: (screen: Screen) => void; sessionState: SessionState; setSessionState: React.Dispatch<React.SetStateAction<SessionState>> }) {
  const sessions = sessionState.sessions || [];
  const currentSession = sessions.find((s) => s.id === sessionState.currentSessionId);
  const session = currentSession || sessions[0];

  const title = session?.intent || "Session";
  const snippet = session?.thought || "";
  const pct = session ? Math.min(session.exchangeCount * 10, 90) : 0;

  const handleResume = () => {
    if (session) {
      setSessionState((prev) => ({
        ...prev,
        currentSessionId: session.id,
        intent: session.intent,
        mode: session.mode,
        latest_user_message: session.thought,
      }));
    }
    setScreen("chat");
  };

  const handleArchive = async () => {
    if (session) {
      if (!session.clarityData && session.messages.length > 0) {
        try {
          const clarity = await getClarity({
            sessionId: session.id,
            fullConversation: session.messages,
            mode: session.mode || "quick",
          });
          let clarityData = clarity;
          if (typeof clarity?.output === "string") {
            try { clarityData = JSON.parse(clarity.output); } catch {}
          }
          setSessionState((prev) => ({
            ...prev,
            sessions: prev.sessions.map((s) =>
              s.id === session.id ? { ...s, status: "archived" as const, clarityData } : s
            ),
          }));
        } catch {
          setSessionState((prev) => ({
            ...prev,
            sessions: prev.sessions.map((s) =>
              s.id === session.id ? { ...s, status: "archived" as const } : s
            ),
          }));
        }
      } else {
        setSessionState((prev) => ({
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.id === session.id ? { ...s, status: "archived" as const } : s
          ),
        }));
      }
    }
    setScreen("sessions");
  };

  return (
    <PhoneFrame>
      <ScreenShell nav active="sessions" setScreen={setScreen}>
        <Header title={title} subtitle={session?.status === "archived" ? "Archived" : session?.status === "completed" ? "Completed" : `In progress • ${pct}%`} onBack={() => setScreen("sessions")} right={<MoreHorizontal size={19} />} />
        <div className="px-6 pt-6">
          <div className="rounded-2xl border bg-[#FEFCFA] p-4" style={{ borderColor: colors.border }}>
            <div className="text-xs font-semibold text-[#777]">Current focus</div>
            <div className="mt-2 text-sm leading-6 text-[#1D1D1F]">
              {snippet || "No thought recorded."}
            </div>
            {session?.status === "in_progress" && (
              <div className="mt-4 h-1.5 rounded-full bg-[#EFE7DC]">
                <div className="h-1.5 rounded-full bg-[#E9A23B]" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3">
            {session?.status === "in_progress" && (
              <button onClick={handleResume} className="flex w-full items-center gap-3 rounded-2xl border bg-[#FEFCFA] p-4 text-left transition active:scale-[0.99]" style={{ borderColor: colors.border }}>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF4E5]">
                  <BookText size={18} color={colors.orange} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">Resume session</div>
                  <div className="text-xs text-[#555]">Pick up where you left off</div>
                </div>
                <ChevronRight size={17} />
              </button>
            )}
            <button onClick={handleArchive} className="flex w-full items-center gap-3 rounded-2xl border bg-[#FEFCFA] p-4 text-left transition active:scale-[0.99]" style={{ borderColor: colors.border }}>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#F8E1DD]">
                <Archive size={18} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{session?.status === "archived" ? "Saved to archive" : "Archive session"}</div>
                <div className="text-xs text-[#555]">{session?.status === "archived" ? "Already saved" : "Keep it for later review"}</div>
              </div>
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="mt-8 space-y-3">
            {session?.status === "in_progress" && <PrimaryButton onClick={handleResume}>Resume chat</PrimaryButton>}
            {session?.status === "archived" && <PrimaryButton onClick={handleResume}>Continue session</PrimaryButton>}
            {session?.status === "archived" && (
              <SecondaryButton onClick={() => {
                setSessionState((prev) => ({
                  ...prev,
                  sessions: prev.sessions.map((s) =>
                    s.id === session.id ? { ...s, status: "in_progress" as const } : s
                  ),
                }));
                setScreen("sessions");
              }}>Move to active sessions</SecondaryButton>
            )}
            <SecondaryButton onClick={() => setScreen("wisdomArchive")}>View Archive</SecondaryButton>
          </div>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function ChatScreen({
  setScreen,
  sessionState,
  setSessionState,
}: {
  setScreen: (screen: Screen) => void;
  sessionState: SessionState;
  setSessionState: React.Dispatch<React.SetStateAction<SessionState>>;
}) {
  const savedSession = (sessionState.sessions || []).find(
    (s) => s.id === sessionState.currentSessionId && s.messages.length > 0
  );

  const [sessionId, setSessionId] = useState<string | null>(savedSession?.id || null);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(savedSession?.messages || []);
  const [exchangeCount, setExchangeCount] = useState(savedSession?.exchangeCount || 0);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [showChoice, setShowChoice] = useState(false);
  const [showFinalChoice, setShowFinalChoice] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("Philippines");

  const allText = messages.map((m) => m.text).join(" ");
  React.useEffect(() => {
    if (!crisisDetected && detectCrisisKeywords(allText)) {
      setCrisisDetected(true);
    }
  }, [allText]);

  const mode = (sessionState as any).mode || "deep";

  const initKey = React.useRef(Symbol());

  React.useEffect(() => {
    if (savedSession) return;
    if (!initKey.current) return;
    initKey.current = null;
    setWaiting(true);
    startSession({
      intent: sessionState.intent || "Career direction",
      thought: sessionState.latest_user_message,
      mode,
    }).then((data: any) => {
      let parsed = data;
      if (typeof data?.output === "string") {
        try { parsed = JSON.parse(data.output); } catch {}
      }
      const newId = crypto.randomUUID();
      const question = parsed?.question || data?.question || parsed?.output || "";
      setSessionId(newId);
      const userThought = sessionState.latest_user_message?.trim();
      setMessages(userThought
        ? [{ role: "user", text: userThought }, { role: "assistant", text: question || "Let's start. What's on your mind?" }]
        : [{ role: "assistant", text: question || "Let's start. What's on your mind?" }]
      );
      setExchangeCount(1);
      setSessionState((prev) => ({ ...prev, currentSessionId: newId }));
      setWaiting(false);
    }).catch((err) => {
      console.error("Session start failed:", err);
      setMessages([{ role: "assistant", text: "It sounds like something here matters a lot. Let's start by understanding what's been on your mind." }]);
      setExchangeCount(1);
      setWaiting(false);
    });
  }, []);

  const handleSend = async () => {
    if (!input.trim() || waiting) return;
    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setWaiting(true);

    try {
      const nextCount = exchangeCount + 1;
      const allMessages = [...messages, { role: "user" as const, text: userText }];
      let data: any = await sendChatMessage({
        sessionId: sessionId || "local",
        userMessage: userText,
        exchangeCount: nextCount,
        mode,
        conversationHistory: allMessages,
      });
      console.log("n8n raw response:", data);
      console.log("n8n output type:", typeof data?.output);
      if (typeof data?.output === "string") {
        try {
          const p = JSON.parse(data.output);
          console.log("parsed output:", p);
          data = p;
        } catch (e) {
          console.log("JSON parse failed:", e);
        }
      }
      console.log("final data.question:", data?.question);

      if (data?.type === "choice") {
        const msg = data?.message || "How would you like to continue?";
        setMessages((prev) => [...prev, { role: "assistant", text: msg }]);
        if (deepActive) {
          setShowChoice(true);
        } else {
          setExchangeCount(nextCount);
        }
      } else {
        const question = data?.question || data?.output || data?.text || "";
        setMessages((prev) => [...prev, { role: "assistant", text: question }]);
        setExchangeCount(nextCount);
        if (nextCount >= deepLimit) {
          setShowFinalChoice(true);
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setExchangeCount((c) => c + 1);
    }
    setWaiting(false);
  };

  const quickLimit = 4;
  const deepLimit = 9;
  const maxExchanges = mode === "quick" ? quickLimit : deepLimit;

  const handleChoice = async () => {
    setShowChoice(false);
    setShowFinalChoice(false);
    setSessionState((prev) => ({ ...prev, mode: "quick" as any }));
    setWaiting(true);
    try {
      let clarity: any = await getClarity({
        sessionId: sessionId || "local",
        fullConversation: messages,
        mode: "quick",
      });
      if (typeof clarity?.output === "string") {
        try { const p = JSON.parse(clarity.output); clarity = p; } catch {}
      }
      setSessionState((prev) => ({
        ...prev,
        mode: "quick" as any,
        currentSessionId: sessionId,
        clarityData: clarity,
      }));
    } catch {}
    setWaiting(false);
    setScreen("quickClarity");
  };

  let deepActive = true;

  const handleChoiceDeep = async () => {
    deepActive = false;
    setShowChoice(false);
    setWaiting(true);
    try {
      const nextCount = exchangeCount + 1;
      const allMessages = [...messages];
      let res: any = await sendChatMessage({
        sessionId: sessionId || "local",
        userMessage: "Let's go deeper.",
        exchangeCount: nextCount,
        mode: "deep",
        conversationHistory: allMessages,
      });
      if (typeof res?.output === "string") {
        try { const p = JSON.parse(res.output); res = p; } catch {}
      }
      const question = res?.question || res?.output || "What else is underneath this?";
      setMessages((prev) => [...prev, { role: "assistant", text: question }]);
      setExchangeCount(nextCount);
      if (nextCount >= 9) {
        finishDeepSession();
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "What else is underneath this?" }]);
      setExchangeCount((c) => c + 1);
    }
    setWaiting(false);
  };

  const finishDeepSession = async () => {
    setWaiting(true);
    try {
      let clarity: any = await getClarity({
        sessionId: sessionId || "local",
        fullConversation: messages,
        mode: "deep",
      });
      if (typeof clarity?.output === "string") {
        try { clarity = JSON.parse(clarity.output); } catch {}
      }
      setSessionState((prev) => ({
        ...prev,
        mode: "deep" as any,
        currentSessionId: sessionId,
        clarityData: clarity,
      }));
    } catch {}
    setWaiting(false);
    setScreen("clarity");
  };

    const doSave = React.useCallback(() => {
    if (!sessionId) return;
    setSessionState((prev) => {
      const existing = (prev.sessions || []).find((s) => s.id === sessionId);
      const updated: SavedSession = {
        id: sessionId,
        intent: sessionState.intent || existing?.intent || "",
        mode: existing?.mode || mode,
        thought: sessionState.latest_user_message || existing?.thought || "",
        messages,
        exchangeCount,
        status: showChoice ? "completed" : existing?.status || "in_progress",
        clarityData: existing?.clarityData || null,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      return {
        ...prev,
        currentSessionId: sessionId,
        sessions: [updated, ...(prev.sessions || []).filter((s) => s.id !== sessionId)],
      };
    });
  }, [sessionId, messages, exchangeCount, showChoice, mode, sessionState.intent, sessionState.latest_user_message, setSessionState]);

  React.useEffect(() => {
    if (sessionId && sessionId !== sessionState.currentSessionId) {
      setSessionState((prev) => ({ ...prev, currentSessionId: sessionId }));
    }
  }, [sessionId]);

  React.useEffect(() => {
    doSave();
  }, [messages, exchangeCount]);

  const handleBack = () => {
    doSave();
    setScreen("sessionDetail");
  };

  const subtitle = "";

  return (
    <PhoneFrame>
      <div className="relative min-h-[844px]">
        <StatusBar />
        <Header title={sessionState.intent || "Session"} subtitle={subtitle} onBack={handleBack} />
        <div className="px-5 pt-7 space-y-3 pb-28 overflow-y-auto max-h-[calc(844px-140px)]">
          {messages.map((m, i) => (
            <React.Fragment key={i}>
              {m.role === "assistant" && (
                <div className="relative">
                  <div className="absolute left-0 top-1 grid h-7 w-7 place-items-center rounded-full bg-[#16191E]">
                    <Sparkles size={14} color="#F4C15D" fill="#F4C15D" />
                  </div>
                  <ChatBubble>{m.text}</ChatBubble>
                </div>
              )}
              {m.role === "user" && <ChatBubble variant="user">{m.text}</ChatBubble>}
              <div className={`text-[10px] text-[#888] ${m.role === "user" ? "text-right" : "ml-10"}`}>
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </React.Fragment>
          ))}
          {waiting && (
            <div className="relative ml-10">
              <div className="absolute -left-10 top-1 grid h-7 w-7 place-items-center rounded-full bg-[#16191E]">
                <Sparkles size={14} color="#F4C15D" fill="#F4C15D" />
              </div>
              <div className="rounded-2xl border bg-[#FEFCFA] px-4 py-3" style={{ borderColor: colors.border }}>
                <div className="flex gap-1 text-xs text-[#888]">
                  <span className="animate-pulse">Thinking</span>
                  <span className="animate-pulse">.</span>
                  <span className="animate-pulse delay-100">.</span>
                  <span className="animate-pulse delay-200">.</span>
                </div>
              </div>
            </div>
          )}
          {crisisDetected && (
            <div className="mt-4 rounded-2xl border border-[#E9A23B] bg-[#FFF7E8] p-5">
              <div className="text-sm font-bold text-[#9D6517]">You're not alone. Help is available.</div>
              <div className="mt-3 text-xs text-[#7A5A2A]">
                <div className="mb-2 font-semibold">Select your country:</div>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="mb-3 h-9 w-full rounded-xl border border-[#E8D5B0] bg-white px-3 text-xs outline-none"
                >
                  {Object.keys(crisisLines).map((c) => (
                    <option key={c} value={c}>{crisisLines[c].name}</option>
                  ))}
                </select>
                {crisisLines[selectedCountry]?.numbers.map((num) => (
                  <div key={num} className="mt-1 font-semibold text-[#9D6517]">{num}</div>
                ))}
                <div className="mt-3 text-[11px] text-[#7A5A2A]">If you're in immediate danger, call 911 or your local emergency number.</div>
              </div>
            </div>
          )}
          {showChoice && (
            <div className="mt-4 flex flex-col gap-2">
              <button onClick={handleChoice} className="h-11 rounded-2xl bg-[#1F2329] text-xs font-semibold text-white">
                Get clarity
              </button>
              <button onClick={handleChoiceDeep} className="h-11 rounded-2xl border bg-[#FEFCFA] text-xs font-semibold" style={{ borderColor: colors.border }}>
                Continue deeper
              </button>
            </div>
          )}
          {showFinalChoice && (
            <div className="mt-4 flex flex-col gap-2">
              <button onClick={handleChoice} className="h-11 rounded-2xl bg-[#1F2329] text-xs font-semibold text-white">
                Get clarity
              </button>
            </div>
          )}
        </div>
        <div className="absolute bottom-6 left-5 right-5 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex h-12 flex-1 items-center rounded-2xl border bg-white px-4 text-xs outline-none placeholder:text-[#999]"
            style={{ borderColor: colors.border }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            disabled={waiting || showChoice || showFinalChoice}
          />
          <button onClick={handleSend} disabled={waiting || showChoice || showFinalChoice} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#1F2329]">
            <Send size={17} color="white" />
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

function SessionsScreen({ setScreen, sessionState, setSessionState }: { setScreen: (screen: Screen) => void; sessionState: SessionState; setSessionState: React.Dispatch<React.SetStateAction<SessionState>> }) {
  const [filter, setFilter] = useState<"all" | "in_progress" | "completed">("all");

  const filtered = (sessionState.sessions || []).filter((s) => {
    if (filter === "all") return true;
    return s.status === filter;
  });

  const iconMap: Record<string, React.ElementType> = {
    "Career direction": BriefcaseBusiness,
    "Relationship clarity": Heart,
    "Life decisions": Leaf,
    "Overthinking & anxiety": Brain,
  };

  const toneMap: Record<string, string> = {
    "Career direction": colors.pink,
    "Relationship clarity": colors.purple,
    "Life decisions": colors.green,
    "Overthinking & anxiety": colors.purple,
  };

  return (
    <PhoneFrame>
      <ScreenShell nav active="sessions" setScreen={setScreen}>
        <div className="px-5 pt-8">
          <h2 className="text-center text-sm font-semibold">Sessions</h2>
          <div className="mt-4 flex gap-2">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
            <Chip active={filter === "in_progress"} onClick={() => setFilter("in_progress")}>In progress</Chip>
            <Chip active={filter === "completed"} onClick={() => setFilter("completed")}>Completed</Chip>
          </div>
          <div className="mt-4">
            <PrimaryButton onClick={() => {
              setSessionState((prev) => ({ ...prev, currentSessionId: null, latest_user_message: "" }));
              setScreen("intent");
            }}>Start a Session</PrimaryButton>
          </div>
          <div className="mt-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="mt-8 text-center text-sm text-[#555]">No sessions yet.</div>
            ) : (
              filtered.map((s) => {
                const Icon = iconMap[s.intent] || BriefcaseBusiness;
                const tone = toneMap[s.intent] || colors.blue;
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <SessionCard
                        title={s.intent || "Session"}
                        snippet={s.thought?.slice(0, 60) || ""}
                        meta={`${s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ""} • ${s.status === "in_progress" ? "In progress" : "Completed"}`}
                        progress={s.status === "in_progress" ? `${Math.min(s.exchangeCount * 10, 90)}%` : undefined}
                        icon={Icon}
                        tone={tone}
                        complete={s.status === "archived" || s.status === "completed"}
                        onClick={() => {
                          setSessionState((prev) => ({ ...prev, currentSessionId: s.id }));
                          setScreen("sessionDetail");
                        }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm("Delete this session? This cannot be undone.")) {
                          deleteSessionDb(s.id);
                          setSessionState((prev) => ({
                            ...prev,
                            sessions: prev.sessions.filter((x) => x.id !== s.id),
                          }));
                        }
                      }}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F8E1DD] text-xs font-semibold text-[#B33]"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function SessionsEmpty({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <ScreenShell nav active="sessions" setScreen={setScreen}>
        <div className="px-6 pt-10">
          <h2 className="text-center text-sm font-semibold">Sessions</h2>
          <div className="mt-14 grid gap-3">
            <EmptyStateCard icon={BookOpenCheck} title="No sessions yet" description="Start your first reflection and turn it into a guided decision session." action="Start a session" />
            <EmptyStateCard icon={Archive} title="No saved wisdom" description="Saved reflections will appear here after you finish a session." action="View archive" />
            <EmptyStateCard icon={ChartBarBig} title="No insights yet" description="As you use the app, patterns will surface from your sessions." action="See insights" />
          </div>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function InsightsScreen({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <ScreenShell nav active="insights" setScreen={setScreen}>
        <div className="px-5 pt-8">
          <h2 className="text-center text-sm font-semibold">Insights</h2>
          <SectionHeader title="Your Patterns" action="See all" onAction={() => setScreen("pattern")} />
          <InsightCard
            title="You tend to avoid decisions involving risk."
            subtitle="This shows up in 60% of your recent sessions."
            bars={[22, 38, 52, 30, 64, 45, 72, 82]}
            onClick={() => setScreen("pattern")}
          />
          <SectionHeader title="Decision History" action="See all" onAction={() => setScreen("sessions")} />
          <button onClick={() => setScreen("sessions")} className="mt-4 rounded-2xl border bg-[#FEFCFA] p-4 text-left" style={{ borderColor: colors.border }}>
            <div className="flex gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#F8E1DD]">
                <Heart size={16} />
              </div>
              <div>
                <div className="text-xs font-semibold">Career Direction</div>
                <div className="mt-1 text-[11px] text-[#777]">May 15</div>
              </div>
              <div className="ml-auto text-xs text-[#C88725]">In progress</div>
            </div>
          </button>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function PatternDetail({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const [showCompare, setShowCompare] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<number | null>(null);

  const intents = [
    { icon: BriefcaseBusiness, title: "Career", tone: colors.blue, pct: "76%", pattern: "You tend to favor stability over risk in career decisions." },
    { icon: Heart, title: "Relationships", tone: colors.pink, pct: "54%", pattern: "You lean toward caution when emotions are involved." },
    { icon: Leaf, title: "Life Decisions", tone: colors.green, pct: "68%", pattern: "You delay when the outcome feels irreversible." },
    { icon: Brain, title: "Overthinking", tone: colors.purple, pct: "82%", pattern: "You loop on details before taking action." },
  ];

  const weekData = [
    { week: "Apr 27", pcts: ["72%", "48%", "62%", "78%"] },
    { week: "May 4", pcts: ["76%", "54%", "68%", "82%"] },
  ];

  return (
    <PhoneFrame>
      <ScreenShell nav active="insights" setScreen={setScreen}>
        <div className="px-6 pt-5">
          <button onClick={() => setScreen("insights")} className="grid h-10 w-10 place-items-center rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div className="mt-7 grid h-11 w-11 place-items-center rounded-full bg-[#FFF4E5]">
            <Sparkles size={18} color="#E9A23B" />
          </div>
          <div className="mt-7 text-xs font-semibold">Your Patterns</div>
          <p className="mt-2 text-sm text-[#555]">Patterns change over time. Tap a category to see the trend.</p>

          <div className="mt-6 space-y-3">
            {intents.map((item, i) => {
              const Icon = item.icon;
              const isSelected = selectedIntent === i;
              return (
                <button
                  key={item.title}
                  onClick={() => { setSelectedIntent(isSelected ? null : i); setShowCompare(false); }}
                  className="w-full rounded-2xl border bg-[#FEFCFA] p-4 text-left transition active:scale-[0.99]"
                  style={{ borderColor: isSelected ? colors.orange : colors.border }}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: item.tone }}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{item.title}</div>
                      <div className="mt-0.5 text-xs text-[#555]">Pattern frequency: {item.pct}</div>
                    </div>
                    <ChevronDown size={17} className={`transition ${isSelected ? "rotate-180" : ""}`} />
                  </div>
                  {isSelected && (
                    <div className="mt-4 border-t pt-4" style={{ borderColor: colors.border }}>
                      <p className="text-xs leading-5 text-[#555]">{item.pattern}</p>
                      <div className="mt-4 space-y-2">
                        <div className="text-xs font-semibold text-[#777]">Weekly change</div>
                        {weekData.map((w) => (
                          <div key={w.week} className="flex items-center gap-3 text-xs">
                            <span className="w-14 shrink-0 text-[#777]">{w.week}</span>
                            <div className="flex h-2 flex-1 rounded-full bg-[#EFE7DC]">
                              <div className="h-2 rounded-full bg-[#E9A23B]" style={{ width: w.pcts[i] }} />
                            </div>
                            <span className="w-10 text-right font-semibold">{w.pcts[i]}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowCompare(!showCompare)}
                        className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#C88725]"
                      >
                        <ChevronDown size={14} className={`transition ${showCompare ? "rotate-180" : ""}`} />
                        Compare across categories
                      </button>
                      {showCompare && (
                        <div className="mt-3 space-y-2 rounded-xl bg-[#F9F5EF] p-3">
                          {intents.filter((_, idx) => idx !== i).map((other) => {
                            const OIcon = other.icon;
                            return (
                              <div key={other.title} className="flex items-center gap-2 text-xs">
                                <OIcon size={14} />
                                <span className="flex-1">{other.title}</span>
                                <span className="font-semibold">{other.pct}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <button onClick={() => setScreen("wisdomDetail")} className="mt-4 h-9 w-full rounded-xl bg-[#1F2329] text-xs font-semibold text-white">
                        Save this pattern
                      </button>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function WisdomArchive({ setScreen, sessionState, setSessionState }: { setScreen: (screen: Screen) => void; sessionState: SessionState; setSessionState: React.Dispatch<React.SetStateAction<SessionState>> }) {
  const iconMap: Record<string, React.ElementType> = {
    "Career direction": BriefcaseBusiness,
    "Relationship clarity": Heart,
    "Life decisions": Leaf,
    "Overthinking & anxiety": Brain,
  };
  const completed = (sessionState.sessions || []).filter((s) => s.status === "archived");

  return (
    <PhoneFrame>
      <ScreenShell nav active="wisdomArchive" setScreen={setScreen}>
        <Header title="Wisdom" subtitle="Saved reflections" onBack={() => setScreen("wisdomArchive")} />
        <div className="px-6 pt-5">
          <div className="rounded-3xl border bg-[#FEFCFA] p-5" style={{ borderColor: colors.border }}>
            <div className="text-xs font-semibold text-[#777]">Archive</div>
            <p className="mt-3 text-sm leading-6 text-[#555]">
              Completed sessions appear here as saved wisdom.
            </p>
          </div>
          {completed.length === 0 ? (
            <div className="mt-14 text-center text-sm text-[#555]">No saved wisdom yet. Complete a session to see it here.</div>
          ) : (
            <div className="mt-5 space-y-3">
              {completed.map((s) => {
                const Icon = iconMap[s.intent] || BookText;
                return (
                  <div key={s.id} className="flex items-center gap-3 rounded-2xl border bg-[#FEFCFA] p-4" style={{ borderColor: colors.border }}>
                    <button onClick={() => {
                      setSessionState((prev) => ({ ...prev, currentSessionId: s.id }));
                      setScreen("wisdomDetail");
                    }} className="flex flex-1 items-center gap-3 text-left">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#FFF4E5]">
                        <Icon size={18} color={colors.orange} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold leading-5">{s.intent || "Session"}</div>
                        <div className="mt-1 text-[11px] text-[#777]">
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ""} • Completed
                        </div>
                      </div>
                      <ChevronRight size={16} className="self-center" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Delete this entry?")) {
                          deleteSessionDb(s.id);
                          setSessionState((prev) => ({
                            ...prev,
                            sessions: prev.sessions.filter((x) => x.id !== s.id),
                          }));
                        }
                      }}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F8E1DD] text-[11px] font-semibold text-[#B33] transition active:scale-[0.95]"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function WisdomDetail({ setScreen, sessionState }: { setScreen: (screen: Screen) => void; sessionState: SessionState }) {
  const session = (sessionState.sessions || []).find((s) => s.id === sessionState.currentSessionId);
  const clarity = session?.clarityData;

  return (
    <PhoneFrame>
      <ScreenShell nav active="wisdomArchive" setScreen={setScreen}>
        <Header title="Wisdom Detail" subtitle={session?.intent || "Saved session"} onBack={() => setScreen("wisdomArchive")} right={<MoreHorizontal size={19} />} />
        <div className="px-6 pt-5">
          <div className="rounded-3xl border bg-[#FEFCFA] p-5" style={{ borderColor: colors.border }}>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[#FFF4E5]">
                <BookText size={18} color={colors.orange} />
              </div>
              <div>
                <div className="text-sm font-semibold">Wisdom That Shaped You</div>
                <div className="text-xs text-[#555]">Perspective from your session</div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#1D1D1F]">
              {clarity?.perspective || "Small actions compound into real change. What you do today echoes beyond this moment."}
            </p>
          </div>
          <div className="mt-6 rounded-2xl border bg-[#FEFCFA] p-4" style={{ borderColor: colors.border }}>
            <div className="text-xs font-semibold text-[#777]">Micro Lens</div>
            <p className="mt-2 text-sm leading-6 text-[#555]">
              {clarity?.micro || "Your current situation affects your daily actions."}
            </p>
          </div>
          <div className="mt-4 rounded-2xl border bg-[#FEFCFA] p-4" style={{ borderColor: colors.border }}>
            <div className="text-xs font-semibold text-[#777]">Macro Lens</div>
            <p className="mt-2 text-sm leading-6 text-[#555]">
              {clarity?.macro || "Beyond this moment, the ripple effect matters."}
            </p>
          </div>
          <div className="mt-6 rounded-2xl border bg-[#FEFCFA] p-4" style={{ borderColor: colors.border }}>
            <div className="text-xs font-semibold text-[#777]">Source session</div>
            <p className="mt-2 text-sm leading-6 text-[#555]">
              {session?.intent || "Session"} • {session?.createdAt ? new Date(session.createdAt).toLocaleDateString() : ""}
            </p>
          </div>
          <div className="mt-8 space-y-3">
            <PrimaryButton onClick={() => setScreen("wisdomArchive")}>View Archive</PrimaryButton>
            <SecondaryButton onClick={() => setScreen("wisdomArchive")}>Back to archive</SecondaryButton>
            <button onClick={() => setScreen("wisdomArchive")} className="h-12 w-full rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-600 transition active:scale-[0.99]">
              Delete this entry
            </button>
          </div>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Premium({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame dark>
      <div className="min-h-[844px] text-white">
        <StatusBar dark />
        <div className="px-6 pt-14">
          <h2 className="text-[28px] font-bold">Upgrade to Premium</h2>
          <p className="mt-2 text-sm text-white/70">Unlock your full potential.</p>
          <div className="mt-10 space-y-4">
            {[
              "Unlimited sessions",
              "Deep frameworks & paths",
              "Personal memory & insights",
              "Voice mode (coming soon)",
              "Priority new features",
            ].map((x) => (
              <div key={x} className="flex gap-3 text-sm">
                <Crown size={17} color="#F4C15D" />
                {x}
              </div>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3">
            <PlanCard title="Monthly" price="$9.99 / month" />
            <PlanCard title="Yearly" price="$79.99 / year" selected sub="Save 33%" />
          </div>
          <div className="mt-8 space-y-3">
            <PrimaryButton onClick={() => setScreen("billing")}>Continue to payment</PrimaryButton>
            <SecondaryButton onClick={() => setScreen("profile")}>Not now</SecondaryButton>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function PlanCard({
  title,
  price,
  sub,
  selected,
}: {
  title: string;
  price: string;
  sub?: string;
  selected?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-white/5 p-4" style={{ borderColor: selected ? colors.orange : "rgba(255,255,255,.18)" }}>
      <div className="flex justify-between text-xs font-semibold">
        {title}
        {selected ? <Check size={15} color="#F4C15D" /> : null}
      </div>
      <div className="mt-3 text-sm font-semibold">{price}</div>
      {sub ? <div className="mt-1 text-xs text-[#F4C15D]">{sub}</div> : null}
    </div>
  );
}

function Billing({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <ScreenShell nav active="profile" setScreen={setScreen}>
        <Header title="Billing" subtitle="Manage your plan" onBack={() => setScreen("premium")} right={<CreditCard size={19} />} />
        <div className="px-6 pt-5">
          <div className="rounded-3xl border bg-[#FEFCFA] p-5" style={{ borderColor: colors.border }}>
            <div className="text-xs font-semibold text-[#777]">Current plan</div>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <div className="text-lg font-bold">Premium</div>
                <div className="text-xs text-[#555]">Billed yearly • Next renewal Jun 15</div>
              </div>
              <div className="rounded-full bg-[#FFF4E5] px-3 py-1 text-[11px] font-semibold text-[#9D6517]">Active</div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <PlanCard title="Monthly" price="$9.99 / month" />
            <PlanCard title="Yearly" price="$79.99 / year" selected sub="Save 33%" />
          </div>

          <div className="mt-6 space-y-3">
            <SecondaryButton onClick={() => setScreen("profile")}>Manage payment method</SecondaryButton>
            <PrimaryButton onClick={() => setScreen("premium")}>Upgrade plan</PrimaryButton>
          </div>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Notifications({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const items = [
    { title: "Session reminder", desc: "You left a thought unfinished from yesterday.", time: "10m ago", icon: BellRing },
    { title: "New insight available", desc: "A repeated pattern was identified in your last 3 sessions.", time: "2h ago", icon: Sparkles },
    { title: "Path progress", desc: "Your Career Clarity path is 35% complete.", time: "Today", icon: BookOpenCheck },
  ];

  return (
    <PhoneFrame>
      <ScreenShell nav active="home" setScreen={setScreen}>
        <Header title="Notifications" subtitle="Reminders and follow-ups" onBack={() => setScreen("home")} right={<Bell size={19} />} />
        <div className="px-6 pt-5 space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex gap-3 rounded-2xl border bg-[#FEFCFA] p-4" style={{ borderColor: colors.border }}>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#FFF4E5]">
                  <Icon size={18} color={colors.orange} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="mt-1 text-xs leading-5 text-[#555]">{item.desc}</div>
                  <div className="mt-1 text-[11px] text-[#777]">{item.time}</div>
                </div>
              </div>
            );
          })}
          <div className="mt-4">
            <PrimaryButton onClick={() => setScreen("intent")}>Begin reflection</PrimaryButton>
          </div>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Profile({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserEmail(data.user.email ?? "");
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setScreen("landing");
  };

  const rows = [
    { icon: User, label: "Account", onClick: () => setScreen("account") },
    { icon: Crown, label: "Subscription", onClick: () => setScreen("billing") },
    { icon: Settings, label: "Preferences", onClick: () => setScreen("preferences") },
    { icon: Archive, label: "Saved Insights", onClick: () => setScreen("wisdomArchive") },
    { icon: BellRing, label: "Notifications", onClick: () => setScreen("notifications") },
    { icon: HelpCircle, label: "Help & Support", onClick: () => setScreen("help") },
    { icon: LogOut, label: "Log out", onClick: handleLogout },
  ];

  return (
    <PhoneFrame>
      <ScreenShell nav active="profile" setScreen={setScreen}>
        <div className="px-6 pt-8">
          <h2 className="text-center text-sm font-semibold">Profile</h2>
          <div className="mt-9 flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[linear-gradient(135deg,#E9BA72,#C98E86)]" />
            <div>
              <div className="text-base font-bold">John Doe</div>
              <div className="text-xs text-[#777]">{userEmail || "user@email.com"}</div>
              <div className="mt-1 text-xs font-semibold text-[#C88725]">Premium Member</div>
            </div>
          </div>
          <div className="mt-9 space-y-1">
            {rows.map((row) => {
              const Icon = row.icon;
              return (
                <button key={row.label} onClick={row.onClick} className="flex h-[52px] w-full items-center gap-4 rounded-xl px-1 text-sm font-medium">
                  <Icon size={18} />
                  {row.label}
                  <ChevronRight className="ml-auto" size={17} />
                </button>
              );
            })}
          </div>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Preferences({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <ScreenShell nav active="profile" setScreen={setScreen}>
        <div className="px-6 pt-5">
          <div className="grid grid-cols-[40px_1fr_40px] items-center">
            <button onClick={() => setScreen("profile")} className="grid h-10 w-10 place-items-center">
              <ArrowLeft size={20} />
            </button>
            <div className="text-center text-sm font-semibold">Preferences</div>
            <div />
          </div>
          <div className="mt-8 rounded-2xl border bg-[#FEFCFA] p-4" style={{ borderColor: colors.border }}>
            <SectionHeader title="General" />
            <ToggleRow label="Notifications" on />
            <ToggleRow label="Session reminders" on />
            <ToggleRow label="Dark mode" />
            <SectionHeader title="Privacy" />
            <ToggleRow label="Session memory" on />
            <button onClick={() => setScreen("help")} className="flex items-center justify-between py-4 text-sm">
              <span>Data & privacy</span>
              <ChevronRight size={16} />
            </button>
            <SectionHeader title="About" />
            <button onClick={() => setScreen("help")} className="flex items-center justify-between py-4 text-sm">
              <span>About Lifemode</span>
              <ChevronRight size={16} />
            </button>
            <div className="flex py-4 text-sm">
              <span>Version 1.0.0</span>
            </div>
          </div>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Help({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <ScreenShell nav active="profile" setScreen={setScreen}>
        <Header title="Help & Support" subtitle="FAQ, guidance, and contact" onBack={() => setScreen("profile")} right={<MessageCircleQuestion size={19} />} />
        <div className="px-6 pt-5 space-y-3">
          <div className="rounded-2xl border bg-[#FEFCFA] p-4" style={{ borderColor: colors.border }}>
            <div className="text-sm font-semibold">How does LifeMode work?</div>
            <p className="mt-2 text-xs leading-5 text-[#555]">It guides you through structured reflection, then saves the output into a wisdom archive.</p>
          </div>
          <div className="rounded-2xl border bg-[#FEFCFA] p-4" style={{ borderColor: colors.border }}>
            <div className="text-sm font-semibold">Is my data private?</div>
            <p className="mt-2 text-xs leading-5 text-[#555]">Yes. This prototype shows the product logic only, with no backend or syncing yet.</p>
          </div>
          <div className="rounded-2xl border bg-[#FEFCFA] p-4" style={{ borderColor: colors.border }}>
            <div className="text-sm font-semibold">Need to contact us?</div>
            <p className="mt-2 text-xs leading-5 text-[#555]">Support@lifemode.io is where a real support flow would live.</p>
          </div>
          <div className="mt-6 space-y-3">
            <PrimaryButton onClick={() => setScreen("intent")}>Start a new reflection</PrimaryButton>
            <SecondaryButton onClick={() => setScreen("wisdomArchive")}>View Archive</SecondaryButton>
          </div>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Current({
  screen,
  setScreen,
  sessionState,
  setSessionState,
}: {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  sessionState: SessionState;
  setSessionState: React.Dispatch<React.SetStateAction<SessionState>>;
}) {
  const map: Record<Screen, React.ReactNode> = {
    landing: <Landing setScreen={setScreen} />,
    intent: <Intent setScreen={setScreen} sessionState={sessionState} setSessionState={setSessionState} />,
    thought: <Thought setScreen={setScreen} setSessionState={setSessionState} />,
    mode: <Mode setScreen={setScreen} setSessionState={setSessionState} />,
    sessionSetup: <SessionSetup setScreen={setScreen} />,
    home: <HomeScreen setScreen={setScreen} sessionState={sessionState} setSessionState={setSessionState} />,
    sessionDetail: <SessionDetail setScreen={setScreen} sessionState={sessionState} setSessionState={setSessionState} />,
    chat: <ChatScreen setScreen={setScreen} sessionState={sessionState} setSessionState={setSessionState} />,
    quickClarity: <QuickClarity setScreen={setScreen} sessionState={sessionState} setSessionState={setSessionState} />,
    clarity: <ClarityScreen setScreen={setScreen} sessionState={sessionState} setSessionState={setSessionState} />,
    account: <Account setScreen={setScreen} />,
    sessions: <SessionsScreen setScreen={setScreen} sessionState={sessionState} setSessionState={setSessionState} />,
    sessionsEmpty: <SessionsEmpty setScreen={setScreen} />,
    insights: <InsightsScreen setScreen={setScreen} />,
    pattern: <PatternDetail setScreen={setScreen} />,
    wisdomArchive: <WisdomArchive setScreen={setScreen} sessionState={sessionState} setSessionState={setSessionState} />,
    wisdomDetail: <WisdomDetail setScreen={setScreen} sessionState={sessionState} />,
    premium: <Premium setScreen={setScreen} />,
    billing: <Billing setScreen={setScreen} />,
    notifications: <Notifications setScreen={setScreen} />,
    profile: <Profile setScreen={setScreen} />,
    preferences: <Preferences setScreen={setScreen} />,
    help: <Help setScreen={setScreen} />,
  };
  return map[screen];
}

function ScreenGrid({
  setScreen,
  sessionState,
  setSessionState,
}: {
  setScreen: (screen: Screen) => void;
  sessionState: SessionState;
  setSessionState: React.Dispatch<React.SetStateAction<SessionState>>;
}) {
  const previewScreens = useMemo(() => screens.map((s) => s.key), []);

  return (
    <div className="min-h-screen bg-[#F5EFE7] p-6 text-[#1D1D1F]">
      <div className="mx-auto mb-6 flex max-w-[1800px] items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Lifemode UI Screens</h1>
          <p className="mt-1 text-sm text-[#6B6B6B]">Mobile-first prototype with expanded hidden framework flows</p>
        </div>
        <button onClick={() => setScreen("landing")} className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">
          Single view
        </button>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {previewScreens.map((s) => (
          <div key={s}>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold">{screens.find((x) => x.key === s)?.label}</div>
              <button onClick={() => setScreen(s)} className="rounded-full border border-[#E8E0D7] bg-white px-3 py-1 text-[11px] font-semibold text-[#1D1D1F]">
                Open
              </button>
            </div>
            <div className="h-[330px] overflow-hidden rounded-[24px]">
              <div className="origin-top-left scale-[0.39]">
                <Current screen={s} setScreen={setScreen} sessionState={sessionState} setSessionState={setSessionState} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LifemodeApp() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionState, setSessionState] = useState<SessionState>(() => {
    const latest_user_message = "";
    return {
      intent: "",
      mode: "quick",
      latest_user_message,
      emotion_analysis: analyzeEmotionSignal(""),
      emotion_check_response: null,
      emotion_closer_word: "",
      clarityData: null,
      currentSessionId: null,
      sessions: [],
      returningUser: false,
    };
  });

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        setScreen("home");
        setSessionState((prev) => ({ ...prev, returningUser: true }));
      }
      setLoading(false);
      if (session?.user) {
        loadSessions(session.user.id).then(({ data }) => {
          if (!cancelled && data && data.length > 0) {
            setSessionState((prev) => ({
              ...prev,
              sessions: data.map((s: any) => ({
                id: s.id,
                intent: s.intent || "",
                mode: s.mode || "quick",
                thought: s.thought || "",
                messages: s.messages || [],
                exchangeCount: s.exchange_count || 0,
                status: s.status || "in_progress",
                clarityData: s.clarity_data || null,
                createdAt: s.created_at || "",
              })),
            }));
          }
        }).catch(() => {});
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setScreen("home");
        setSessionState((prev) => ({ ...prev, returningUser: true }));
      }
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const prevSessionsRef = React.useRef<string>("");

  useEffect(() => {
    const serialized = JSON.stringify(sessionState.sessions);
    if (prevSessionsRef.current === serialized || !user) return;
    prevSessionsRef.current = serialized;

    const latest = sessionState.sessions[0];
    if (latest) {
      saveSession({
        id: latest.id,
        user_id: user.id,
        intent: latest.intent,
        mode: latest.mode,
        thought: latest.thought,
        messages: latest.messages,
        exchange_count: latest.exchangeCount,
        status: latest.status,
        clarity_data: latest.clarityData,
      });
    }
  }, [sessionState.sessions, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDF9F4]">
        <div className="text-sm text-[#555]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(233,162,59,0.08),transparent_28%),linear-gradient(180deg,#f6efe6_0%,#f5efe7_100%)]">
      <div className="mx-auto max-w-[390px]">
        <Current screen={screen} setScreen={setScreen} sessionState={sessionState} setSessionState={setSessionState} />
      </div>
    </div>
  );
}
