"use client";

import { motion } from "framer-motion";
import {
  Brain,
  GitBranch,
  Gauge,
  Target,
  Trophy,
  Workflow,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Hybrid AI Engine",
    desc: "A deterministic template engine handles structure and timing; Claude refines descriptions, projects and resources for your level.",
  },
  {
    icon: Workflow,
    title: "Visual Learning Graph",
    desc: "Your roadmap is rendered as an interactive React Flow graph — click any topic to dive in.",
  },
  {
    icon: Gauge,
    title: "Time-Optimized",
    desc: "Tell us how many hours per week you have. The constraint engine scales depth and duration to fit your life.",
  },
  {
    icon: Target,
    title: "Project-Based Milestones",
    desc: "Every phase ends with a concrete project — because building is the only way to actually learn.",
  },
  {
    icon: GitBranch,
    title: "Adaptive Pace",
    desc: "Slip behind? Bump your hours up or down and the entire roadmap recomputes instantly.",
  },
  {
    icon: Trophy,
    title: "Progress That Sticks",
    desc: "Check off topics as you go. Progress is saved locally so your journey survives every refresh.",
  },
];

export function Features() {
  return (
    <section className="relative px-6 py-24 lg:px-8" id="features">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Built for people who actually <span className="text-gradient">finish</span>.
          </h2>
          <p className="mt-4 text-lg text-slate-300/90">
            Most learning tools dump 200 links on you and call it a day.
            LearnFlow treats your time as a constraint and your goal as the
            target.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="glass group relative overflow-hidden rounded-2xl p-6 transition-all hover:border-brand-400/40 hover:shadow-glow"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400/20 to-violet-400/10 ring-1 ring-brand-400/30">
                <f.icon className="h-5 w-5 text-brand-300" />
              </div>
              <h3 className="text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300/85">
                {f.desc}
              </p>
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-400/0 transition-all duration-500 group-hover:bg-brand-400/10 group-hover:blur-2xl" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
