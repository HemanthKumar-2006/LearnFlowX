"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import { Check, Clock, Flame, Sparkles, Target } from "lucide-react";
import type { Topic, TopicDifficulty } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TopicNodeData extends Topic {
  phaseId: string;
  phaseTitle: string;
}

const PRIORITY_STYLES = {
  high: {
    dot: "bg-red-500",
    label: "text-red-600 bg-red-50 ring-red-100",
    icon: Flame,
  },
  medium: {
    dot: "bg-amber-500",
    label: "text-amber-700 bg-amber-50 ring-amber-100",
    icon: Sparkles,
  },
  low: {
    dot: "bg-slate-400",
    label: "text-slate-600 bg-slate-100 ring-slate-200",
    icon: Sparkles,
  },
} as const;

const DIFFICULTY_DOT: Record<TopicDifficulty, string> = {
  easy: "bg-emerald-400",
  medium: "bg-amber-400",
  hard: "bg-rose-500",
};

export function TopicNode({ data, selected }: NodeProps<TopicNodeData>) {
  const ps = PRIORITY_STYLES[data.priority];
  const PriorityIcon = ps.icon;

  return (
    <div
      className={cn(
        "group relative w-[240px] rounded-xl border bg-white p-3.5 shadow-sm transition-all duration-200",
        selected
          ? "border-brand-500 shadow-[0_0_0_4px_rgba(99,102,241,0.22),0_8px_24px_-8px_rgba(99,102,241,0.45)]"
          : "border-slate-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_8px_24px_-10px_rgba(99,102,241,0.35)]",
        data.completed && "bg-emerald-50/70",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-slate-400"
      />

      {/* Top row: priority badge + difficulty dot + done tag */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
              ps.label,
            )}
          >
            <PriorityIcon className="h-2.5 w-2.5" />
            {data.priority}
          </span>
          {data.difficulty && (
            <span
              className="inline-flex h-2 w-2 rounded-full ring-2 ring-white"
              title={`Difficulty: ${data.difficulty}`}
            >
              <span
                className={cn(
                  "h-full w-full rounded-full",
                  DIFFICULTY_DOT[data.difficulty],
                )}
              />
            </span>
          )}
          {data.goalAligned && (
            <Target
              className="h-3 w-3 text-violet-500"
              aria-label="Goal-aligned"
            />
          )}
        </div>
        {data.completed && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
            <Check className="h-2.5 w-2.5" />
            Done
          </span>
        )}
      </div>

      <h4
        className={cn(
          "text-sm font-semibold leading-snug text-slate-900",
          data.completed && "text-slate-500 line-through",
        )}
      >
        {data.title}
      </h4>

      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
        <Clock className="h-3 w-3" />
        <span>{data.time}</span>
        <span className="text-slate-300">·</span>
        <span>{data.estimatedHours}h</span>
        {typeof data.importanceScore === "number" && (
          <>
            <span className="text-slate-300">·</span>
            <span className="font-mono font-semibold text-slate-600">
              {Math.round(data.importanceScore)}
            </span>
          </>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-slate-400"
      />
    </div>
  );
}
