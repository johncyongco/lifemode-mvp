import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Brain,
  BriefcaseBusiness,
  Check,
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
} from "lucide-react";

const colors = {
  bg: "#E2FFF9",
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

type Screen =
  | "landing"
  | "intent"
  | "thought"
  | "mode"
  | "account"
  | "home"
  | "chat"
  | "reflection"
  | "decision"
  | "summary"
  | "sessions"
  | "paths"
  | "pathDetail"
  | "insights"
  | "pattern"
  | "premium"
  | "profile"
  | "preferences";

const screens: { key: Screen; label: string }[] = [
  { key: "landing", label: "Landing" },
  { key: "intent", label: "Intent" },
  { key: "thought", label: "Thought" },
  { key: "mode", label: "Mode" },
  { key: "account", label: "Account" },
  { key: "home", label: "Home" },
  { key: "chat", label: "Chat" },
  { key: "reflection", label: "Reflection" },
  { key: "decision", label: "Decision" },
  { key: "summary", label: "Summary" },
  { key: "sessions", label: "Sessions" },
  { key: "paths", label: "Paths" },
  { key: "pathDetail", label: "Path Detail" },
  { key: "insights", label: "Insights" },
  { key: "pattern", label: "Pattern" },
  { key: "premium", label: "Premium" },
  { key: "profile", label: "Profile" },
  { key: "preferences", label: "Preferences" },
];

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return <div className="w-full">{children}</div>;
}

function PrimaryButton({
  children,
  onClick,
  dark = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  dark?: boolean;
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

function ProgressHeader({ step }: { step: number }) {
  return (
    <div className="px-6 pt-5">
      <div className="flex items-center gap-4">
        <div className="h-1 flex-1 rounded-full bg-[#E8E0D7]">
          <div className="h-1 rounded-full bg-[#C88725]" style={{ width: `${step * 20}%` }} />
        </div>
        <span className="text-xs font-semibold text-[#6B6B6B]">{step} / 5</span>
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
    ["paths", Compass, "Paths"],
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
    <div className="relative min-h-[100dvh] pb-[86px]">
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

function WaveIllustration() {
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

function Landing({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <div className="relative min-h-[100dvh] overflow-hidden">
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
        <WaveIllustration />
        <div className="absolute bottom-12 left-6 right-6">
          <PrimaryButton onClick={() => setScreen("intent")}>Start</PrimaryButton>
          <button onClick={() => setScreen("account")} className="mt-4 text-center text-xs font-semibold text-[#6B6B6B]">Already have an account? Log in</button>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Intent({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const opts = [
    [BriefcaseBusiness, "Career direction", "Find purpose and clarity in your career", "#FFF4E5", true],
    [Heart, "Relationship clarity", "Navigate relationships and emotions", colors.pink, false],
    [Leaf, "Life decisions", "Make important life decisions", colors.green, false],
    [Brain, "Overthinking & anxiety", "Understand your mind and reduce stress", colors.purple, false],
  ] as const;

  return (
    <PhoneFrame>
      <ScreenShell setScreen={setScreen}>
        <ProgressHeader step={2} />
        <div className="px-6 pt-10">
          <h2 className="text-[25px] font-bold tracking-[-0.03em]">What brings you here?</h2>
          <p className="mt-2 text-sm text-[#6B6B6B]">Select all that apply.</p>
          <div className="mt-7 space-y-3">
            {opts.map(([Icon, title, desc, bg, selected]) => (
              <div
                key={title}
                className="flex items-center gap-4 rounded-2xl border p-4"
                style={{ background: bg, borderColor: selected ? colors.orange : colors.border }}
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/60">
                  <Icon size={22} color={selected ? "#9D6517" : "#6D7B68"} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="mt-1 text-xs leading-4 text-[#555]">{desc}</div>
                </div>
                <div
                  className={`grid h-6 w-6 place-items-center rounded-full border ${
                    selected ? "border-[#E9A23B] bg-[#E9A23B]" : "border-[#CFC7BE] bg-transparent"
                  }`}
                >
                  {selected ? <Check size={14} color="white" /> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-6 right-6">
          <PrimaryButton onClick={() => setScreen("thought")}>Continue</PrimaryButton>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Thought({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <ScreenShell setScreen={setScreen}>
        <ProgressHeader step={3} />
        <div className="px-6 pt-10">
          <h2 className="whitespace-pre-line text-[28px] font-bold leading-tight tracking-[-0.04em]">
            What’s on your{"\n"}mind right now?
          </h2>
          <p className="mt-3 max-w-[260px] text-sm leading-5 text-[#555]">Share anything. No judgment, just clarity.</p>
          <div className="mt-8 h-[300px] rounded-2xl border bg-[#FEFCFA] p-5" style={{ borderColor: colors.border }}>
            <p className="text-sm leading-7 text-[#1D1D1F]">
              I feel stuck in my career. I’m not sure if I should keep going or make a change.
            </p>
            <div className="mt-[170px] text-right text-xs text-[#777]">0/500</div>
          </div>
        </div>
        <div className="absolute bottom-8 left-6 right-6">
          <PrimaryButton onClick={() => setScreen("mode")}>Continue</PrimaryButton>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Mode({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <ScreenShell setScreen={setScreen}>
        <ProgressHeader step={4} />
        <div className="px-6 pt-10">
          <h2 className="whitespace-pre-line text-[28px] font-bold leading-tight tracking-[-0.04em]">
            How do you want{"\n"}to begin?
          </h2>
          <p className="mt-3 text-sm text-[#555]">You can always switch later.</p>
          <div className="mt-10 space-y-4">
            <div className="flex gap-4 rounded-2xl border bg-[#FFF4E5] p-5" style={{ borderColor: colors.orange }}>
              <Zap className="mt-1" size={25} color={colors.orange} fill={colors.orange} />
              <div className="flex-1">
                <div className="font-semibold">Quick clarity</div>
                <div className="text-xs font-semibold text-[#555]">5–10 min</div>
                <p className="mt-2 text-xs leading-5 text-[#555]">Get quick perspective on what’s on your mind.</p>
              </div>
              <div className="grid h-6 w-6 place-items-center rounded-full bg-[#E9A23B]">
                <Check size={14} color="white" />
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border bg-[#FEFCFA] p-5" style={{ borderColor: colors.border }}>
              <Leaf className="mt-1" size={25} color="#5EA374" />
              <div className="flex-1">
                <div className="font-semibold">Deep session</div>
                <div className="text-xs font-semibold text-[#555]">20+ min</div>
                <p className="mt-2 text-xs leading-5 text-[#555]">Go deeper with guided reflection and frameworks.</p>
              </div>
              <Circle size={22} color="#CFC7BE" />
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-6 right-6">
          <PrimaryButton onClick={() => setScreen("account")}>Continue</PrimaryButton>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Account({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <ScreenShell setScreen={setScreen}>
        <div className="px-6 pt-16">
          <h2 className="text-[26px] font-bold tracking-[-0.03em]">Create your account</h2>
          <p className="mt-2 text-sm text-[#555]">Start your clarity journey.</p>
          <div className="mt-10 space-y-3">
            <button className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border bg-white text-sm font-semibold" style={{ borderColor: colors.border }}>
              <span className="text-[15px]">G</span> Continue with Google
            </button>
            <button className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border bg-white text-sm font-semibold" style={{ borderColor: colors.border }}>
              <span className="text-[15px]"></span> Continue with Apple
            </button>
          </div>
          <div className="my-7 flex items-center gap-4 text-xs text-[#777]">
            <span className="h-px flex-1 bg-[#E8E0D7]" />
            or
            <span className="h-px flex-1 bg-[#E8E0D7]" />
          </div>
          <div className="space-y-3">
            <input className="h-14 w-full rounded-2xl border bg-white px-4 text-sm outline-none placeholder:text-[#999]" placeholder="Email address" />
            <input className="h-14 w-full rounded-2xl border bg-white px-4 text-sm outline-none placeholder:text-[#999]" placeholder="Password" />
          </div>
        </div>
        <div className="absolute bottom-12 left-6 right-6">
          <PrimaryButton onClick={() => setScreen("home")}>Create account</PrimaryButton>
          <p className="mx-auto mt-5 max-w-[250px] text-center text-[11px] leading-4 text-[#777]">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function HomeScreen({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const quicks = [
    [BriefcaseBusiness, "Career", colors.blue],
    [Heart, "Relationships", colors.pink],
    [Leaf, "Decision", colors.green],
    [Brain, "Anxiety", colors.purple],
  ] as const;

  return (
    <PhoneFrame>
      <ScreenShell nav active="home" setScreen={setScreen}>
        <div className="px-5 pt-5">
          <div className="flex justify-between">
            <Menu size={21} />
            <Bell size={19} />
          </div>
          <h2 className="mt-7 text-[21px] font-bold">Good evening, John.</h2>
          <p className="mt-2 text-xs text-[#555]">What do you need clarity on today?</p>

          <button
            onClick={() => setScreen("chat")}
            className="relative mt-5 h-[118px] w-full overflow-hidden rounded-2xl text-left shadow-sm"
          >
            <MountainCard dark className="absolute inset-0" />
            <div className="relative z-10 p-5 text-white">
              <div className="text-lg font-bold">Start a session</div>
              <div className="mt-2 text-xs">Talk it through clearly</div>
            </div>
            <div className="absolute bottom-5 right-5 grid h-11 w-11 place-items-center rounded-full bg-[#FFF7E8]">
              <ArrowRight size={19} color="#9D6517" />
            </div>
          </button>

          <div className="mt-5 flex items-center justify-between">
            <div className="text-sm font-semibold">Quick options</div>
            <button className="text-xs text-[#777]">See all</button>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {quicks.map(([Icon, label, bg]) => (
              <button key={label} className="h-[76px] rounded-2xl border bg-white text-[10px] font-semibold" style={{ borderColor: colors.border }}>
                <div className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-xl" style={{ background: bg }}>
                  <Icon size={16} />
                </div>
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 text-sm font-semibold">Continue where you left off</div>
          <button
            onClick={() => setScreen("summary")}
            className="mt-3 w-full rounded-2xl border bg-[#FEFCFA] p-4 text-left"
            style={{ borderColor: colors.border }}
          >
            <div className="flex gap-3">
              <MountainCard className="h-14 w-14 rounded-xl" />
              <div className="flex-1">
                <div className="flex justify-between">
                  <div className="text-sm font-semibold">Career Direction</div>
                  <MoreHorizontal size={17} />
                </div>
                <p className="mt-1 text-xs leading-4 text-[#555]">I’m not sure if I should keep pursuing this path.</p>
                <div className="mt-3 text-[11px] text-[#777]">In progress • 60%</div>
                <div className="mt-2 h-1.5 rounded-full bg-[#EFE7DC]">
                  <div className="h-1.5 w-[60%] rounded-full bg-[#E9A23B]" />
                </div>
              </div>
            </div>
          </button>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function ChatScreen({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const Assistant = ({ children }: { children: React.ReactNode }) => (
    <div className="ml-10 max-w-[260px] rounded-2xl border bg-[#FEFCFA] px-4 py-3 text-xs leading-5" style={{ borderColor: colors.border }}>
      {children}
    </div>
  );

  return (
    <PhoneFrame>
      <div className="flex h-[100dvh] flex-col">
        <Header title="Career Direction" subtitle="Quick clarity • 8:42" onBack={() => setScreen("home")} />
        <div className="flex-1 overflow-y-auto px-5 pt-7 space-y-3 pb-4">
          <div className="relative">
            <div className="absolute left-0 top-1 grid h-7 w-7 place-items-center rounded-full bg-[#16191E]">
              <Sparkles size={14} color="#F4C15D" fill="#F4C15D" />
            </div>
            <Assistant>Let’s start by understanding what’s been on your mind.</Assistant>
          </div>
          <Assistant>What’s the main challenge you’re facing right now?</Assistant>
          <div className="ml-10 text-[10px] text-[#888]">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          <div className="ml-auto max-w-[245px] rounded-2xl bg-[#FFF4E5] px-4 py-3 text-xs leading-5">
            I feel like I’m not growing in my current job, but I’m afraid to make a change.
          </div>
          <div className="text-right text-[10px] text-[#888]">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          <div className="relative pt-3">
            <div className="absolute left-0 top-4 grid h-7 w-7 place-items-center rounded-full bg-[#16191E]">
              <Sparkles size={14} color="#F4C15D" fill="#F4C15D" />
            </div>
            <Assistant>That’s important. Let’s explore that deeper.</Assistant>
          </div>
          <Assistant>What part of staying feels safest right now?</Assistant>
          <div className="ml-10 text-[10px] text-[#888]">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2 px-5 pb-6 pt-2">
          <div className="flex h-12 flex-1 items-center rounded-2xl border bg-white px-4 text-[16px] text-[#999]" style={{ borderColor: colors.border }}>
            Type your message...
            <Mic className="ml-auto" size={16} />
          </div>
          <button onClick={() => setScreen("reflection")} className="grid h-12 w-12 place-items-center rounded-full bg-[#1F2329]">
            <Send size={17} color="white" />
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

function ReflectionScreen({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <div className="relative min-h-[100dvh]">
        <Header title="Career Direction" subtitle="Quick clarity • 12:15" onBack={() => setScreen("chat")} />
        <div className="px-6 pt-16">
          <div className="rounded-3xl border bg-[#FEFCFA] p-7 shadow-[0_12px_35px_rgba(70,45,20,0.08)]" style={{ borderColor: colors.border }}>
            <div className="text-xs text-[#777]">Reflection</div>
            <h2 className="mt-5 text-[24px] font-bold leading-tight tracking-[-0.03em]">What outcome are you afraid of?</h2>
            <p className="mt-3 text-sm font-semibold">Be honest. This is for you.</p>
            <div className="mt-6 h-[190px] rounded-2xl border bg-white p-4 text-xs text-[#999]" style={{ borderColor: colors.border }}>
              Type your answer...
              <div className="mt-[132px] text-right text-[#777]">0/300</div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-9 left-6 right-6">
          <PrimaryButton onClick={() => setScreen("decision")}>Next</PrimaryButton>
        </div>
      </div>
    </PhoneFrame>
  );
}

function DecisionScreen({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <div className="relative min-h-[100dvh]">
        <Header title="Career Direction" subtitle="Deep session • 18:20" onBack={() => setScreen("reflection")} />
        <div className="px-6 pt-12">
          <h2 className="text-[24px] font-bold tracking-[-0.03em]">Let’s look at both sides.</h2>
          <p className="mt-3 text-sm text-[#555]">There’s no right or wrong answer.</p>
          <div className="mt-9 grid grid-cols-2 gap-4">
            <ChoiceCard title="Stay in Current Path" q="What are the pros of staying?" icon="plant" />
            <ChoiceCard title="Make a Change" q="What are the pros of changing?" icon="mountain" />
          </div>
          <button
            onClick={() => setScreen("summary")}
            className="mx-auto mt-12 flex h-12 items-center gap-2 rounded-2xl border bg-[#FEFCFA] px-8 text-xs font-semibold"
            style={{ borderColor: colors.border }}
          >
            I’m not sure yet <HelpCircle size={14} />
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

function ChoiceCard({
  title,
  q,
  icon,
}: {
  title: string;
  q: string;
  icon: "plant" | "mountain";
}) {
  return (
    <div className="h-[250px] rounded-2xl border bg-[#FEFCFA] p-4 text-center" style={{ borderColor: colors.border }}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF4E5] text-2xl">
        {icon === "plant" ? "🌿" : "⛰️"}
      </div>
      <div className="mt-8 text-sm font-semibold leading-5">{title}</div>
      <p className="mt-8 text-xs leading-4 text-[#555]">{q}</p>
      <div className="mt-6 text-xs font-semibold text-[#C88725]">Explore →</div>
    </div>
  );
}

function SummaryScreen({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <ScreenShell setScreen={setScreen}>
        <div className="px-6 pt-8 text-center">
          <div className="text-sm font-semibold">Session Summary</div>
          <div className="mx-auto mt-10 grid h-20 w-20 place-items-center rounded-full border bg-[#FFF7E8]" style={{ borderColor: colors.border }}>
            <Check size={34} color="#A66A19" />
          </div>
          <h2 className="mt-8 text-xl font-bold">Great session, John!</h2>
          <p className="mt-2 text-xs text-[#555]">Here’s what you discovered.</p>
          <div className="mt-7 rounded-2xl border bg-[#FEFCFA] p-4 text-left" style={{ borderColor: colors.border }}>
            <div className="text-xs font-semibold">Key Insights</div>
            {[
              "You value growth and impact.",
              "You fear stability more than failure.",
              "You’re ready for change, but want more clarity on direction.",
            ].map((x) => (
              <div key={x} className="mt-3 flex gap-2 text-xs leading-4">
                <Check size={15} color="#40A45B" />
                {x}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border bg-[#FEFCFA] p-4 text-left" style={{ borderColor: colors.border }}>
            <div className="text-xs font-semibold">Suggested Next Step</div>
            <div className="mt-3 flex gap-3 text-xs leading-4 text-[#555]">
              <ArrowRight size={16} />
              Explore roles aligned with your strengths and values.
            </div>
          </div>
          <button onClick={() => setScreen("sessions")} className="mt-7 h-12 w-full rounded-xl bg-[#1F2329] text-sm font-semibold text-white">
            Save summary
          </button>
          <button onClick={() => setScreen("chat")} className="mt-3 h-12 w-full rounded-xl border bg-[#FEFCFA] text-sm font-semibold" style={{ borderColor: colors.border }}>
            Continue this session
          </button>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function SessionsList({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const data = [
    ["Career Direction", "I’m not sure if I should keep pursuing this path.", "Today • In progress", "60%", BriefcaseBusiness, colors.pink],
    ["Relationship Doubt", "Should I stay or end this relationship?", "May 10 • In progress", "40%", Heart, colors.purple],
    ["Life Decision", "I’m thinking about moving to another city.", "May 5 • Completed", "✓", Leaf, colors.green],
    ["Anxiety & Overthinking", "I keep overthinking everything.", "Apr 28 • Completed", "✓", Brain, colors.green],
  ] as const;

  return (
    <PhoneFrame>
      <ScreenShell nav active="sessions" setScreen={setScreen}>
        <div className="px-5 pt-8">
          <h2 className="text-center text-sm font-semibold">Sessions</h2>
          <div className="mt-6 flex h-11 items-center gap-2 rounded-xl border bg-white px-4 text-xs text-[#999]" style={{ borderColor: colors.border }}>
            <Search size={15} />
            Search sessions
          </div>
          <div className="mt-4 flex gap-2">
            <Pill active>All active</Pill>
            <Pill>In progress</Pill>
            <Pill>Completed</Pill>
          </div>
          <div className="mt-4 space-y-3">
            {data.map(([t, s, d, p, Icon, bg]) => (
              <button key={t} onClick={() => setScreen("chat")} className="flex w-full gap-3 rounded-2xl border bg-[#FEFCFA] p-3 text-left" style={{ borderColor: colors.border }}>
                <div className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: bg }}>
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div className="text-xs font-semibold">{t}</div>
                    <MoreHorizontal size={15} />
                  </div>
                  <div className="mt-1 text-[11px] leading-4 text-[#555]">{s}</div>
                  <div className="mt-1 text-[10px] text-[#777]">{d}</div>
                </div>
                <div className="self-center text-xs font-semibold text-[#E9A23B]">{p}</div>
              </button>
            ))}
          </div>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Pill({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={`h-9 rounded-full px-5 text-xs font-semibold ${
        active ? "bg-[#1F2329] text-white" : "border bg-[#FEFCFA] text-[#555]"
      }`}
      style={{ borderColor: colors.border }}
    >
      {children}
    </button>
  );
}

function PathsScreen({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <ScreenShell nav active="paths" setScreen={setScreen}>
        <div className="px-5 pt-8">
          <h2 className="text-center text-sm font-semibold">Paths</h2>
          <div className="mt-9 flex justify-between">
            <div className="text-sm font-semibold">Featured Paths</div>
            <button className="text-xs text-[#777]">See all</button>
          </div>
          <button onClick={() => setScreen("pathDetail")} className="relative mt-4 h-[124px] w-full overflow-hidden rounded-2xl text-left">
            <MountainCard dark className="absolute inset-0" />
            <div className="relative z-10 p-5 text-white">
              <div className="text-xl font-bold">Career Clarity</div>
              <p className="mt-2 max-w-[230px] text-xs leading-4">Find direction and purpose in your career</p>
              <div className="mt-4 text-xs font-semibold">8 steps • 20–30 min</div>
            </div>
          </button>
          <button className="relative mt-4 h-[112px] w-full overflow-hidden rounded-2xl bg-[#C98E86] text-left">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(80,20,30,.5),rgba(255,231,220,.15))]" />
            <div className="relative z-10 p-5 text-white">
              <div className="text-lg font-bold">Should I Stay or Leave?</div>
              <p className="mt-2 max-w-[230px] text-xs leading-4">Make the best decision for your relationship</p>
              <div className="mt-3 text-xs font-semibold">7 steps • 20–25 min</div>
            </div>
          </button>
          <div className="mt-8 text-sm font-semibold">All Categories</div>
          <button className="mt-3 flex h-16 w-full items-center rounded-2xl border bg-[#FEFCFA] px-4" style={{ borderColor: colors.border }}>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#FFF4E5]">
              <BriefcaseBusiness size={17} color="#C88725" />
            </div>
            <span className="ml-3 text-sm font-semibold">Career</span>
            <ChevronRight className="ml-auto" size={18} />
          </button>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function PathDetail({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <ScreenShell nav active="paths" setScreen={setScreen}>
        <button onClick={() => setScreen("paths")} className="absolute left-5 top-14 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/70">
          <ArrowLeft size={18} />
        </button>
        <MountainCard className="h-[185px] w-full" />
        <div className="px-6 pt-6">
          <h2 className="text-center text-xl font-bold">Career Clarity</h2>
          <div className="mt-5 flex items-center gap-2 text-xs text-[#777]">
            <Sparkles size={14} />
            8 steps • 20–30 min
          </div>
          <p className="mt-4 text-sm leading-6 text-[#555]">
            A guided path to help you gain clarity about your career direction and the next steps forward.
          </p>
          <div className="mt-6 text-sm font-semibold">You’ll explore:</div>
          <div className="mt-4 space-y-3">
            {[
              "Identify the real problem",
              "Understand what matters to you",
              "Explore your options",
              "Make a clear decision",
            ].map((x) => (
              <div key={x} className="flex gap-3 text-sm">
                <Check size={16} color="#B87820" />
                {x}
              </div>
            ))}
          </div>
          <div className="mt-14">
            <PrimaryButton onClick={() => setScreen("chat")}>Start this path</PrimaryButton>
          </div>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Insights({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <ScreenShell nav active="insights" setScreen={setScreen}>
        <div className="px-5 pt-8">
          <h2 className="text-center text-sm font-semibold">Insights</h2>
          <div className="mt-9 flex justify-between">
            <div className="text-sm font-semibold">Your Patterns</div>
            <button className="text-xs text-[#777]">See all</button>
          </div>
          <button
            onClick={() => setScreen("pattern")}
            className="mt-4 w-full rounded-2xl border bg-[#FEFCFA] p-5 text-left"
            style={{ borderColor: colors.border }}
          >
            <div className="flex justify-between">
              <h3 className="max-w-[250px] text-base font-semibold leading-5">You tend to avoid decisions involving risk.</h3>
              <HelpCircle size={16} />
            </div>
            <p className="mt-2 text-xs leading-4 text-[#777]">This shows up in 60% of your recent sessions.</p>
            <div className="mt-7 flex h-20 items-end gap-4">
              {[22, 38, 52, 30, 64, 45, 72, 82].map((h, i) => (
                <div key={i} className="w-4 rounded-full bg-[#E9BA72]" style={{ height: h }} />
              ))}
            </div>
          </button>
          <div className="mt-7 flex justify-between">
            <div className="text-sm font-semibold">Decision History</div>
            <button className="text-xs text-[#777]">See all</button>
          </div>
          <div className="mt-4 rounded-2xl border bg-[#FEFCFA] p-4" style={{ borderColor: colors.border }}>
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
          </div>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Pattern({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <ScreenShell setScreen={setScreen}>
        <div className="px-6 pt-5">
          <button onClick={() => setScreen("insights")} className="grid h-10 w-10 place-items-center rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div className="mt-7 grid h-11 w-11 place-items-center rounded-full bg-[#FFF4E5]">
            <Sparkles size={18} color="#E9A23B" />
          </div>
          <div className="mt-7 text-xs font-semibold">Your Pattern</div>
          <h2 className="mt-3 text-[24px] font-bold leading-tight tracking-[-0.03em]">You prioritize stability over growth.</h2>
          <p className="mt-4 text-sm leading-5 text-[#555]">This was identified in 7 of your last 10 sessions.</p>
          <div className="my-8 h-px bg-[#E8E0D7]" />
          <h3 className="text-sm font-semibold">What this means</h3>
          <p className="mt-3 text-sm leading-6 text-[#555]">
            You value security and predictability, which helps you make thoughtful decisions, but may also hold you back from opportunities.
          </p>
          <h3 className="mt-8 text-sm font-semibold">How to balance</h3>
          <p className="mt-3 text-sm leading-6 text-[#555]">Practice taking small calculated risks to build confidence.</p>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Premium({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <div className="min-h-[100dvh] text-white">
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
            <Price title="Monthly" price="$9.99 / month" />
            <Price title="Yearly" price="$79.99 / year" selected sub="Save 33%" />
          </div>
          <div className="mt-8">
            <PrimaryButton dark onClick={() => setScreen("profile")}>
              Continue to payment
            </PrimaryButton>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Price({
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

function Profile({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const rows = [
    [User, "Account", null],
    [Crown, "Subscription", () => setScreen("premium")],
    [Settings, "Preferences", () => setScreen("preferences")],
    [Lock, "Saved Insights", null],
    [HelpCircle, "Help & Support", null],
    [LogOut, "Log out", null],
  ] as const;

  return (
    <PhoneFrame>
      <ScreenShell nav active="profile" setScreen={setScreen}>
        <div className="px-6 pt-8">
          <h2 className="text-center text-sm font-semibold">Profile</h2>
          <div className="mt-9 flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[linear-gradient(135deg,#E9BA72,#C98E86)]" />
            <div>
              <div className="text-base font-bold">John Doe</div>
              <div className="text-xs text-[#777]">john.doe@email.com</div>
              <div className="mt-1 text-xs font-semibold text-[#C88725]">Premium Member</div>
            </div>
          </div>
          <div className="mt-9 space-y-1">
            {rows.map(([Icon, label, action]) => (
              <button key={label} onClick={action ?? undefined} className="flex h-[52px] w-full items-center gap-4 rounded-xl px-1 text-sm font-medium">
                <Icon size={18} />
                {label}
                <ChevronRight className="ml-auto" size={17} />
              </button>
            ))}
          </div>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Preferences({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <PhoneFrame>
      <ScreenShell setScreen={setScreen}>
        <div className="px-6 pt-5">
          <div className="grid grid-cols-[40px_1fr_40px] items-center">
            <button onClick={() => setScreen("profile")} className="grid h-10 w-10 place-items-center">
              <ArrowLeft size={20} />
            </button>
            <div className="text-center text-sm font-semibold">Preferences</div>
            <div />
          </div>
          <div className="mt-8 rounded-2xl border bg-[#FEFCFA] p-4" style={{ borderColor: colors.border }}>
            <Section title="General" />
            <Toggle label="Notifications" on />
            <Toggle label="Session reminders" on />
            <Toggle label="Dark mode" />
            <Section title="Privacy" />
            <Toggle label="Session memory" on />
            <Row label="Data & privacy" />
            <Section title="About" />
            <Row label="About Lifemode" />
            <div className="flex py-4 text-sm">
              <span>Version 1.0.0</span>
            </div>
          </div>
        </div>
      </ScreenShell>
    </PhoneFrame>
  );
}

function Section({ title }: { title: string }) {
  return <div className="pt-2 text-xs font-semibold text-[#555] first:pt-0">{title}</div>;
}

function Toggle({ label, on }: { label: string; on?: boolean }) {
  return (
    <div className="flex items-center justify-between py-4 text-sm">
      <span>{label}</span>
      <div className={`flex h-7 w-12 items-center rounded-full px-1 ${on ? "justify-end bg-[#43B66A]" : "justify-start bg-[#D9D9D9]"}`}>
        <div className="h-5 w-5 rounded-full bg-white shadow" />
      </div>
    </div>
  );
}

function Row({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between py-4 text-sm">
      <span>{label}</span>
      <ChevronRight size={16} />
    </div>
  );
}

function Current({ screen, setScreen }: { screen: Screen; setScreen: (screen: Screen) => void }) {
  const map: Record<Screen, React.ReactNode> = {
    landing: <Landing setScreen={setScreen} />,
    intent: <Intent setScreen={setScreen} />,
    thought: <Thought setScreen={setScreen} />,
    mode: <Mode setScreen={setScreen} />,
    account: <Account setScreen={setScreen} />,
    home: <HomeScreen setScreen={setScreen} />,
    chat: <ChatScreen setScreen={setScreen} />,
    reflection: <ReflectionScreen setScreen={setScreen} />,
    decision: <DecisionScreen setScreen={setScreen} />,
    summary: <SummaryScreen setScreen={setScreen} />,
    sessions: <SessionsList setScreen={setScreen} />,
    paths: <PathsScreen setScreen={setScreen} />,
    pathDetail: <PathDetail setScreen={setScreen} />,
    insights: <Insights setScreen={setScreen} />,
    pattern: <Pattern setScreen={setScreen} />,
    premium: <Premium setScreen={setScreen} />,
    profile: <Profile setScreen={setScreen} />,
    preferences: <Preferences setScreen={setScreen} />,
  };
  return map[screen];
}

function ScreenGrid({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const previewScreens = useMemo(() => screens.map((s) => s.key), []);

  return (
    <div className="min-h-screen bg-[#F5EFE7] p-6 text-[#1D1D1F]">
      <div className="mx-auto mb-6 flex max-w-[1800px] items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Lifemode UI Screens</h1>
          <p className="mt-1 text-sm text-[#6B6B6B]">Mobile-first prototype with all 18 screens</p>
        </div>
        <button
          onClick={() => setScreen("landing")}
          className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
        >
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
            <Current screen={s} setScreen={setScreen} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LifemodeMobileAppUI() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [grid, setGrid] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(233,162,59,0.08),transparent_28%),linear-gradient(180deg,#e2fff9_0%,#e2fff9_100%)] p-4">
      <div className="mx-auto max-w-[390px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <select
            value={screen}
            onChange={(e) => {
              setScreen(e.target.value as Screen);
              setGrid(false);
            }}
            className="h-11 rounded-xl border border-[#E8E0D7] bg-white px-3 text-sm outline-none"
          >
            {screens.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setGrid((v) => !v)}
            className="h-11 rounded-xl bg-black px-4 text-sm font-semibold text-white"
          >
            {grid ? "Single view" : "View all"}
          </button>
        </div>
      </div>
      {grid ? (
        <ScreenGrid setScreen={(next) => {
          setScreen(next);
          setGrid(false);
        }} />
      ) : (
        <Current screen={screen} setScreen={setScreen} />
      )}
    </div>
  );
}
