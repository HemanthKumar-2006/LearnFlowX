"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-12 border-t border-white/5 px-6 py-10 text-sm text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-400" />
          <span className="font-semibold text-white">LearnFlow</span>
          <span className="text-slate-500">— learn smarter, not longer</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="#features" className="hover:text-white">
            Features
          </Link>
          <Link href="#how-it-works" className="hover:text-white">
            How it works
          </Link>
          <Link href="/dashboard" className="hover:text-white">
            Get started
          </Link>
        </div>
      </div>
    </footer>
  );
}
