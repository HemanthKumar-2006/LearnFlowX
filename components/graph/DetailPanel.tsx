"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, ExternalLink, Flame, Lightbulb, X } from "lucide-react";
import type { Topic } from "@/lib/types";
import { useRoadmapStore } from "@/store/useRoadmapStore";
import { cn } from "@/lib/utils";

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
          className="absolute right-4 top-4 z-20 flex h-[calc(100%-2rem)] w-[360px] flex-col rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          <header className="flex items-start justify-between gap-2 border-b border-slate-100 p-5">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase",
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
                <span className="text-[11px] text-slate-500">Topic</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{topic.title}</h2>
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

          <div className="flex-1 overflow-y-auto p-5">
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <Clock className="h-4 w-4 text-slate-500" />
              <span className="text-slate-700">{topic.time}</span>
              <span className="text-slate-300">·</span>
              <span className="font-medium text-brand-700">
                {topic.estimatedHours} hours
              </span>
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
                <ul className="space-y-2">
                  {topic.resources.map((r) => (
                    <li key={r.url}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-brand-300 hover:bg-brand-50"
                      >
                        <span className="truncate">{r.title}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <footer className="border-t border-slate-100 p-4">
            <button
              type="button"
              onClick={() => toggleTopic(topic.id)}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                topic.completed
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-brand-600 text-white shadow-sm hover:bg-brand-700",
              )}
            >
              <Check className="h-4 w-4" />
              {topic.completed ? "Mark as not done" : "Mark as completed"}
            </button>
          </footer>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
