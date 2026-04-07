"use client";

// The smart input form. Lives on /dashboard.
//
// We keep this as a controlled component for clarity over slickness.
// On submit it calls the API, stores the roadmap in Zustand, and routes to /roadmap.

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Brain, Briefcase, Code2, Palette, Server, Sparkles } from "lucide-react";
import { useRoadmapStore } from "@/store/useRoadmapStore";
import type { Level, RoadmapInput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

const DOMAINS = [
  { id: "Web Development", label: "Web Development", icon: Code2 },
  { id: "AI/ML", label: "AI / ML", icon: Brain },
  { id: "Mobile Development", label: "Mobile", icon: BookOpen },
  { id: "Design", label: "Design", icon: Palette },
];

const TRACKS_BY_DOMAIN: Record<string, string[]> = {
  "Web Development": ["Frontend", "Backend", "Fullstack"],
  "AI/ML": ["NLP", "Computer Vision", "MLOps"],
  "Mobile Development": ["iOS", "Android", "React Native"],
  Design: ["UI/UX", "Product Design", "Motion"],
};

const LEVELS: { id: Level; label: string; desc: string; icon: typeof Briefcase }[] = [
  { id: "beginner", label: "Beginner", desc: "Brand new — start from zero", icon: Sparkles },
  { id: "intermediate", label: "Intermediate", desc: "Some experience, want structure", icon: BookOpen },
  { id: "job-ready", label: "Job-ready", desc: "Aim for a professional level", icon: Briefcase },
  { id: "expert", label: "Expert", desc: "Push into advanced territory", icon: Server },
];

export function RoadmapForm() {
  const router = useRouter();
  const setRoadmap = useRoadmapStore((s) => s.setRoadmap);
  const setLastInput = useRoadmapStore((s) => s.setLastInput);
  const setGenerating = useRoadmapStore((s) => s.setGenerating);
  const isGenerating = useRoadmapStore((s) => s.isGenerating);

  const [domain, setDomain] = useState("Web Development");
  const [track, setTrack] = useState("Frontend");
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [level, setLevel] = useState<Level>("intermediate");
  const [goal, setGoal] = useState("");
  const [error, setError] = useState<string | null>(null);

  const tracks = useMemo(() => TRACKS_BY_DOMAIN[domain] ?? [], [domain]);

  function selectDomain(d: string) {
    setDomain(d);
    const first = TRACKS_BY_DOMAIN[d]?.[0] ?? "";
    setTrack(first);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGenerating(true);

    const input: RoadmapInput = {
      domain,
      track,
      hoursPerWeek,
      level,
      goal: goal.trim() || undefined,
    };

    try {
      const res = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed with ${res.status}`);
      }
      const data = await res.json();
      setLastInput(input);
      setRoadmap(data.roadmap);
      router.push("/roadmap");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate roadmap";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Domain */}
      <Section
        index={1}
        title="What do you want to learn?"
        hint="Pick the broad area you'd like to focus on."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DOMAINS.map((d) => (
            <button
              type="button"
              key={d.id}
              onClick={() => selectDomain(d.id)}
              className={cn(
                "group flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                domain === d.id
                  ? "border-brand-500 bg-brand-50 shadow-sm ring-2 ring-brand-200"
                  : "border-slate-200 bg-white hover:border-slate-300",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  domain === d.id ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600",
                )}
              >
                <d.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{d.label}</div>
                <div className="text-xs text-slate-500">
                  {TRACKS_BY_DOMAIN[d.id]?.join(" · ")}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* Track */}
      <Section
        index={2}
        title="Which track?"
        hint="Pick a more specific path within your chosen area."
      >
        <div className="flex flex-wrap gap-2">
          {tracks.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setTrack(t)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                track === t
                  ? "border-brand-500 bg-brand-500 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </Section>

      {/* Time */}
      <Section
        index={3}
        title="How much time can you commit?"
        hint="We'll scale every phase to fit. Be honest — consistency beats heroics."
      >
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-slate-700">Hours per week</span>
            <span className="font-mono text-2xl font-bold text-brand-600">
              {hoursPerWeek}h
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={40}
            step={1}
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(Number(e.target.value))}
            className="mt-4 w-full accent-brand-500"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>2h · casual</span>
            <span>20h · serious</span>
            <span>40h · full-time</span>
          </div>
        </div>
      </Section>

      {/* Level */}
      <Section
        index={4}
        title="What's your target level?"
        hint="This determines depth and which advanced topics get included."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LEVELS.map((l) => (
            <button
              type="button"
              key={l.id}
              onClick={() => setLevel(l.id)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition",
                level === l.id
                  ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200"
                  : "border-slate-200 bg-white hover:border-slate-300",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  level === l.id ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600",
                )}
              >
                <l.icon className="h-4 w-4" />
              </div>
              <div className="text-sm font-semibold text-slate-900">{l.label}</div>
              <div className="text-xs text-slate-500">{l.desc}</div>
            </button>
          ))}
        </div>
      </Section>

      {/* Optional goal */}
      <Section
        index={5}
        title="Anything specific you're aiming at? (optional)"
        hint="A free-text goal that the AI can use to personalize project ideas."
      >
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={3}
          placeholder="e.g. I want to ship a SaaS side project by Q4 — bonus if I learn Postgres on the way."
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </Section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-end">
        <p className="text-xs text-slate-500">
          Generation usually takes 5–15 seconds.
        </p>
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isGenerating}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition",
            "hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {isGenerating ? (
            <>
              <Spinner className="h-4 w-4 text-white" />
              Building your roadmap…
            </>
          ) : (
            <>
              Generate roadmap
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
}

function Section({
  index,
  title,
  hint,
  children,
}: {
  index: number;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-xs font-bold text-brand-700">
          {index}
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{hint}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
