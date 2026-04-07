"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import { Flag, Layers } from "lucide-react";

interface PhaseNodeData {
  title: string;
  duration: string;
  milestone: string;
  description: string;
  index: number;
  topicCount: number;
}

export function PhaseNode({ data }: NodeProps<PhaseNodeData>) {
  return (
    <div className="w-[260px] rounded-2xl border border-slate-200 bg-white p-4 shadow-md ring-1 ring-black/[0.02]">
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-0 !bg-brand-500"
      />
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 text-xs font-bold text-white shadow-sm">
          {data.index}
        </div>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-brand-600">
          Phase
        </span>
      </div>
      <h3 className="text-base font-bold leading-snug text-slate-900">
        {data.title.replace(/^Phase \d+:\s*/, "")}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">
        {data.description}
      </p>
      <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-1">
          <Layers className="h-3 w-3" />
          <span>{data.topicCount} topics</span>
        </div>
        <div className="text-slate-300">·</div>
        <div className="font-medium text-brand-700">{data.duration}</div>
      </div>
      <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800">
        <Flag className="mt-0.5 h-3 w-3 shrink-0" />
        <span className="line-clamp-2">{data.milestone}</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-0 !bg-brand-500"
      />
    </div>
  );
}
