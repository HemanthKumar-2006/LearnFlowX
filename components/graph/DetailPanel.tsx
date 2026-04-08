"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Clock,
  ExternalLink,
  Flame,
  Gauge,
  Lightbulb,
  Sparkles,
  X,
} from "lucide-react";
import type { Topic, TopicDifficulty } from "@/lib/types";
import { useRoadmapStore } from "@/store/useRoadmapStore";
import { cn } from "@/lib/utils";

const DIFFICULTY_TAG: Record<
  TopicDifficulty,
  { label: string; dot: string; text: string }
> = {
  easy: { label: "Easy", dot: "bg-emerald-500", text: "text-emerald-700" },
  medium: { label: "Medium", dot: "bg-amber-500", text: "text-amber-700" },
  hard: { label: "Hard", dot: "bg-rose-500", text: "text-rose-700" },
};

export function DetailPanel({
  topic,
  onClose,
}: {
  topic: Topic | null;
  onClose: () => void;
}) {
  const toggleTopic = useRoadmapStore((s) => s.toggleTopic);

  return (
    <AnimatePresence>
      {topic && (
        <motion.aside
          key={topic.id}
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="absolute right-4 top-4 z-20 h-[calc(100%-2rem)] w-[380px] rounded-2xl bg-gradient-to-br from-brand-500 via-violet-500 to-fuchsia-500 p-[1.5px] shadow-2xl"
        >
          <div className="flex h-full flex-col overflow-hidden rounded-[14px] bg-white">
            {/* Header */}
            <header className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      topic.priority === "high"
                        ? "bg-red-50 text-red-600"
                        : topic.priority === "medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600",
                    )}
                  >
                    <Flame className="h-2.5 w-2.5" />
                    {topic.priority}
                  </span>
                  {topic.difficulty && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold",
                        DIFFICULTY_TAG[topic.difficulty].text,
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          DIFFICULTY_TAG[topic.difficulty].dot,
                        )}
                      />
                      {DIFFICULTY_TAG[topic.difficulty].label}
                    </span>
                  )}
                  {topic.goalAligned && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                      <Sparkles className="h-2.5 w-2.5" />
                      Goal
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold leading-tight text-slate-900">
                  {topic.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close detail panel"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 pb-28 pt-5">
              <div className="mb-4 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-slate-700">{topic.time}</span>
                <span className="text-slate-300">·</span>
                <span className="font-semibold text-brand-700">
                  {topic.estimatedHours}h
                </span>
                {typeof topic.importanceScore === "number" && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <Gauge className="h-3.5 w-3.5" />
                      <span className="font-mono text-xs font-semibold">
                        {Math.round(topic.importanceScore)}/100
                      </span>
                    </span>
                  </>
                )}
              </div>

              <p className="mb-5 text-sm leading-relaxed text-slate-700">
                {topic.description}
              </p>

              {topic.project && (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
                    <Lightbulb className="h-3 w-3" />
                    Project
                  </div>
                  <p className="text-sm text-amber-900">{topic.project}</p>
                </div>
              )}

              {topic.resources && topic.resources.length > 0 && (
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Resources
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {topic.resources.map((r) => (
                      <a
                        key={r.url}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 hover:shadow"
                      >
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500 group-hover:bg-brand-600" />
                        {r.platform ?? r.title}
                        <ExternalLink className="h-3 w-3 opacity-60 transition group-hover:opacity-100" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky full-width CTA */}
            <footer className="absolute inset-x-0 bottom-0 rounded-b-[14px] border-t border-slate-100 bg-white/95 p-4 backdrop-blur">
              <button
                type="button"
                onClick={() => toggleTopic(topic.id)}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition",
                  topic.completed
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-md hover:shadow-lg",
                )}
              >
                <Check className="h-4 w-4" />
                {topic.completed ? "Mark as not done" : "Mark as completed"}
              </button>
            </footer>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
