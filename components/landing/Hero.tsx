"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { ParticlesBg } from "./ParticlesBg";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-grid" />
      <ParticlesBg />
      <div
        className="glow-orb"
        style={{
          width: 520,
          height: 520,
          background: "rgba(34, 211, 238, 0.45)",
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
      <div
        className="glow-orb"
        style={{
          width: 360,
          height: 360,
          background: "rgba(167, 139, 250, 0.35)",
          top: 120,
          right: -80,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pb-28 pt-20 sm:pt-28 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-4 py-1.5 text-xs font-medium text-brand-200 backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Powered by Claude · React Flow · Adaptive engine
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mx-auto max-w-4xl text-center text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl"
        >
          From <span className="text-gradient">"I want to learn X"</span>
          <br className="hidden sm:block" /> to a visual learning journey.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-slate-300/90"
        >
          LearnFlow generates a personalized, time-optimized roadmap and turns
          it into an interactive graph you can actually follow — phases,
          milestones, and projects, all adapted to your pace.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link href="/dashboard" className="btn-primary group">
            Generate my roadmap
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="#how-it-works" className="btn-ghost">
            How it works
          </Link>
        </motion.div>

        {/* Floating preview card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35 }}
          className="relative mx-auto mt-20 max-w-5xl"
        >
          <div className="glass-strong relative rounded-2xl p-2 shadow-glow-lg">
            <div className="rounded-xl border border-white/10 bg-ink-900/80 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                </div>
                <div className="font-mono text-xs text-slate-400">
                  learnflow.app/roadmap
                </div>
                <div className="text-xs text-brand-300">● live</div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                {[
                  { t: "Phase 1", d: "Foundations", c: "from-brand-400 to-cyan-300" },
                  { t: "Phase 2", d: "JS Mastery", c: "from-violet-400 to-fuchsia-300" },
                  { t: "Phase 3", d: "React + State", c: "from-emerald-400 to-teal-300" },
                  { t: "Phase 4", d: "Production", c: "from-amber-400 to-orange-300" },
                ].map((p, i) => (
                  <motion.div
                    key={p.t}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div
                      className={`inline-block bg-gradient-to-r ${p.c} bg-clip-text text-xs font-semibold uppercase tracking-wider text-transparent`}
                    >
                      {p.t}
                    </div>
                    <div className="mt-1 text-sm font-medium text-white">
                      {p.d}
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-brand-400"
                        style={{ width: `${25 * (i + 1)}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
