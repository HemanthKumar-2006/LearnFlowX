"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppHeader({
  variant = "light",
  right,
}: {
  variant?: "light" | "dark";
  right?: React.ReactNode;
}) {
  const isDark = variant === "dark";
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b backdrop-blur",
        isDark
          ? "border-white/10 bg-ink-950/70 text-white"
          : "border-slate-200 bg-white/80 text-slate-900",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-violet-400 shadow-glow">
            <Sparkles className="h-4 w-4 text-ink-950" />
          </div>
          <span className="text-base font-bold">LearnFlow</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/dashboard"
            className={cn(
              "transition",
              isDark ? "hover:text-brand-300" : "text-slate-600 hover:text-slate-900",
            )}
          >
            New roadmap
          </Link>
          <Link
            href="/roadmap"
            className={cn(
              "transition",
              isDark ? "hover:text-brand-300" : "text-slate-600 hover:text-slate-900",
            )}
          >
            My roadmap
          </Link>
          {right}
        </div>
      </div>
    </header>
  );
}
