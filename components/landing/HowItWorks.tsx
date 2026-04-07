"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    title: "Tell us your goal",
    desc: "Domain, track, time available, target level — the only inputs we need.",
  },
  {
    n: "02",
    title: "Engine + Claude",
    desc: "A deterministic template engine builds the skeleton, then Claude refines content for your level.",
  },
  {
    n: "03",
    title: "Visual roadmap",
    desc: "Rendered as an interactive graph. Click topics, mark progress, adjust pace.",
  },
  {
    n: "04",
    title: "Ship & repeat",
    desc: "Each phase ends with a concrete project. Export to PDF when you're done.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative px-6 py-24 lg:px-8" id="how-it-works">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Four steps, one clear path.
          </h2>
        </motion.div>

        <div className="relative mt-16">
          {/* Connecting line */}
          <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-brand-400/40 to-transparent lg:block" />

          <div className="grid gap-6 lg:grid-cols-2">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className={`glass relative rounded-2xl p-6 ${i % 2 === 1 ? "lg:translate-y-12" : ""}`}
              >
                <div className="mb-3 font-mono text-xs font-semibold tracking-widest text-brand-300">
                  STEP {s.n}
                </div>
                <h3 className="text-xl font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300/85">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
