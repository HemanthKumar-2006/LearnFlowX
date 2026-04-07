"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import { Check, Clock, Flame, Sparkles } from "lucide-react";
import type { Topic } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TopicNodeData extends Topic {
  phaseId: string;
  phaseTitle: string;
}

const PRIORITY_STYLES = {
  high: { dot: "bg-red-500", label: "text-red-600 bg-red-50", icon: Flame },
  medium: { dot: "bg-amber-500", label: "text-amber-700 bg-amber-50", icon: Sparkles },
  low: { dot: "bg-slate-400", label: "text-slate-600 bg-slate-100", icon: Sparkles },
} as const;

export function TopicNode({ data, selected }: NodeProps<TopicNodeData>) {
  const ps = PRIORITY_STYLES[data.priority];
  const PriorityIcon = ps.icon;

  return (
    <div
      className={cn(
        "w-[230px] rounded-xl border bg-white p-3.5 shadow-sm transition-all",
        selected
          ? "border-brand-500 ring-2 ring-brand-200"
          : "border-slate-200 hover:border-brand-300 hover:shadow-md",
        data.completed && "bg-emerald-50/60",
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-slate-400" />

      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            ps.label,
          )}
        >
          <PriorityIcon className="h-2.5 w-2.5" />
          {data.priority}
        </span>
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
      </div>

      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-slate-400" />
    </div>
  );
}
