"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function EmptyState({ onCta }: { onCta: () => void }) {
  return (
    <div className="flex h-full items-center justify-center bg-slate-50 px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 shadow-glow">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No roadmap yet</h2>
        <p className="mt-2 text-sm text-slate-600">
          Create one in under a minute — pick a domain, tell us your time, and
          we'll build the rest.
        </p>
        <button
          type="button"
          onClick={onCta}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          Generate my roadmap
        </button>
      </motion.div>
    </div>
  );
}
