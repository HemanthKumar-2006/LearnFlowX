"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Nav() {
  return (
    <header className="relative z-20">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-violet-400 shadow-glow">
            <Sparkles className="h-4 w-4 text-ink-950" />
          </div>
          <span className="text-lg font-bold text-white">LearnFlow</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm text-slate-300 sm:flex">
          <Link href="#features" className="hover:text-white">
            Features
          </Link>
          <Link href="#how-it-works" className="hover:text-white">
            How it works
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-brand-400/40 bg-brand-400/10 px-4 py-2 font-medium text-brand-200 transition hover:bg-brand-400/20"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
