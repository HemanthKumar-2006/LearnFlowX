"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  CalendarDays,
  Clock,
  Download,
  Flame,
  Gauge,
  GraduationCap,
  Layers,
  RefreshCcw,
  Sparkles,
  Target,
} from "lucide-react";
import type { Phase, Roadmap, Topic } from "@/lib/types";
import { deriveProgress, useRoadmapStore } from "@/store/useRoadmapStore";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

type Tab = "phases" | "weekly";

export function RoadmapSidebar({
  roadmap,
  onExport,
  isExporting,
}: {
  roadmap: Roadmap;
  onExport: () => void;
  isExporting: boolean;
}) {
  const recomputeWithPace = useRoadmapStore((s) => s.recomputeWithPace);
  const isRecomputing = useRoadmapStore((s) => s.isRecomputing);
  const error = useRoadmapStore((s) => s.error);
  const progress = deriveProgress(roadmap);
  const [hours, setHours] = useState(roadmap.hoursPerWeek);
  const [tab, setTab] = useState<Tab>("phases");

  const highPriorityCount = useMemo(
    () =>
      roadmap.phases.reduce(
        (sum, p) => sum + p.topics.filter((t) => t.priority === "high").length,
        0,
      ),
    [roadmap],
  );

  async function applyPace() {
    if (hours !== roadmap.hoursPerWeek) {
      await recomputeWithPace(hours);
    }
  }

  const weeks = useMemo(() => computeWeeklyPlan(roadmap), [roadmap]);

  return (
    <aside className="flex h-full w-96 shrink-0 flex-col gap-4 border-r border-slate-200 bg-white p-5">
      {/* Header */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
          {roadmap.domain}
        </div>
        <h1 className="text-xl font-bold text-slate-900">{roadmap.track}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            <GraduationCap className="h-3 w-3" />
            {roadmap.level}
          </span>
          {roadmap.smartLabel && (
            <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-brand-100 to-violet-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
              <Sparkles className="h-3 w-3" />
              {roadmap.smartLabel}
            </span>
          )}
          {roadmap.source === "gemini" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
              AI personalized
            </span>
          )}
        </div>
      </div>

      {/* Strategy */}
      {roadmap.strategy && (
        <div className="rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 to-violet-50 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
            <Sparkles className="h-3 w-3" />
            Learning Strategy
          </div>
          <p className="text-xs leading-relaxed text-slate-700">{roadmap.strategy}</p>
          {roadmap.goal && (
            <div className="mt-2 flex items-start gap-1.5 rounded-md bg-white/70 px-2 py-1.5 text-[11px] text-slate-700">
              <Target className="mt-0.5 h-3 w-3 shrink-0 text-brand-600" />
              <span className="italic">{roadmap.goal}</span>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Stat
          icon={Calendar}
          label="Duration"
          value={roadmap.totalDuration || `${roadmap.totalWeeks}w`}
        />
        <Stat icon={Clock} label="Hours" value={`${roadmap.totalHours}`} />
        <Stat icon={Layers} label="Phases" value={`${roadmap.phases.length}`} />
        <Stat icon={Flame} label="High-Prio" value={`${highPriorityCount}`} />
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Progress
          </span>
          <span className="font-mono text-sm font-bold text-brand-700">
            {progress.percent}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.percent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
          />
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          {progress.completed} of {progress.total} topics completed
        </div>
      </div>

      {/* Pace adjustment — triggers full LLM re-plan */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <Gauge className="h-3.5 w-3.5 text-brand-600" />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            Adjust pace
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-500">Hours / week</span>
          <span className="font-mono text-lg font-bold text-slate-900">{hours}h</span>
        </div>
        <input
          type="range"
          min={2}
          max={40}
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          disabled={isRecomputing}
          className="mt-2 w-full accent-brand-500"
        />
        <button
          type="button"
          onClick={applyPace}
          disabled={isRecomputing || hours === roadmap.hoursPerWeek}
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRecomputing ? (
            <>
              <Spinner className="h-3 w-3 text-white" />
              Re-planning…
            </>
          ) : (
            <>
              <RefreshCcw className="h-3 w-3" />
              Recompute roadmap
            </>
          )}
        </button>
        {error && (
          <p className="mt-2 text-[11px] text-red-600">{error}</p>
        )}
      </div>

      {/* Tabs: phases | weekly */}
      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
        <TabButton active={tab === "phases"} onClick={() => setTab("phases")} icon={Layers}>
          Phases
        </TabButton>
        <TabButton active={tab === "weekly"} onClick={() => setTab("weekly")} icon={CalendarDays}>
          Weekly
        </TabButton>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {tab === "phases" ? (
          <PhaseList phases={roadmap.phases} />
        ) : (
          <WeeklyList weeks={weeks} />
        )}
      </div>

      {/* Export */}
      <button
        type="button"
        onClick={onExport}
        disabled={isExporting}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
      >
        {isExporting ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        {isExporting ? "Exporting…" : "Export PDF"}
      </button>
    </aside>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Layers;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "bg-white text-brand-700 shadow-sm"
          : "text-slate-500 hover:text-slate-700",
      )}
    >
      <Icon className="h-3 w-3" />
      {children}
    </button>
  );
}

function PhaseList({ phases }: { phases: Phase[] }) {
  return (
    <ul className="space-y-2">
      {phases.map((p, i) => {
        const done = p.topics.filter((t) => t.completed).length;
        const pct = p.topics.length === 0 ? 0 : Math.round((done / p.topics.length) * 100);
        return (
          <li key={p.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold",
                  pct === 100
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-brand-100 text-brand-700",
                )}
              >
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-slate-900">
                  {p.title.replace(/^Phase \d+:\s*/, "")}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span>{p.duration}</span>
                  {p.weekRange && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span>{p.weekRange}</span>
                    </>
                  )}
                </div>
              </div>
              <span className="font-mono text-[10px] text-slate-500">{pct}%</span>
            </div>
            {p.difficulty && <DifficultyBadge level={p.difficulty} />}
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DifficultyBadge({ level }: { level: NonNullable<Phase["difficulty"]> }) {
  const styles: Record<string, string> = {
    beginner: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    intermediate: "bg-amber-50 text-amber-700 ring-amber-200",
    advanced: "bg-rose-50 text-rose-700 ring-rose-200",
    "job-ready": "bg-indigo-50 text-indigo-700 ring-indigo-200",
    expert: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  const cls = styles[level as string] ?? styles.intermediate;
  return (
    <span
      className={cn(
        "mt-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1",
        cls,
      )}
    >
      {level}
    </span>
  );
}

interface WeekSlot {
  week: number;
  phaseTitle: string;
  topics: Topic[];
}

function computeWeeklyPlan(roadmap: Roadmap): WeekSlot[] {
  const hoursPerWeek = Math.max(1, roadmap.hoursPerWeek);
  const weeks: WeekSlot[] = [];
  let currentWeek = 1;
  let remainingBudget = hoursPerWeek;
  let currentTopics: Topic[] = [];
  let currentPhase = "";

  const flush = () => {
    if (currentTopics.length > 0) {
      weeks.push({ week: currentWeek, phaseTitle: currentPhase, topics: currentTopics });
    }
  };

  for (const phase of roadmap.phases) {
    for (const topic of phase.topics) {
      if (topic.estimatedHours > remainingBudget && currentTopics.length > 0) {
        flush();
        currentWeek++;
        remainingBudget = hoursPerWeek;
        currentTopics = [];
      }
      if (currentTopics.length === 0) currentPhase = phase.title;
      currentTopics.push(topic);
      remainingBudget -= topic.estimatedHours;
    }
  }
  flush();
  return weeks;
}

function WeeklyList({ weeks }: { weeks: WeekSlot[] }) {
  if (weeks.length === 0) {
    return <div className="text-xs text-slate-500">No weeks to show.</div>;
  }
  return (
    <ul className="space-y-2">
      {weeks.map((w) => (
        <li key={w.week} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-900">Week {w.week}</div>
            <div className="text-[10px] text-slate-500">{w.topics.length} topics</div>
          </div>
          <div className="mt-1 truncate text-[10px] text-slate-500">{w.phaseTitle}</div>
          <ul className="mt-2 space-y-1">
            {w.topics.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-1.5 text-[11px] text-slate-700"
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    t.priority === "high"
                      ? "bg-rose-500"
                      : t.priority === "medium"
                      ? "bg-amber-400"
                      : "bg-slate-300",
                  )}
                />
                <span className="truncate">{t.title}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1 font-mono text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
