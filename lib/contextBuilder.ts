// Context Builder — translates user inputs into a high-signal
// natural-language context string the LLM can use for personalization.
//
// The mapping is intentionally explicit: the same (level, time, goal)
// triple should always produce the same context so generations are
// reproducible and easy to debug.

import type { Level } from "./types";

const LEVEL_MAP: Record<Level, string> = {
  beginner:
    "Start from absolute fundamentals, assume no prior knowledge, prefer gentle pacing with many examples",
  intermediate:
    "Skip basics, focus on applied concepts and practical building blocks, assume comfort with syntax",
  "job-ready":
    "Focus on production patterns, interview-grade topics, system design, and real-world projects",
  expert:
    "Focus on advanced real-world systems, performance, optimization, architecture, and non-trivial projects",
};

export interface BuiltContext {
  levelContext: string;
  pace: "slow" | "balanced" | "intensive";
  paceContext: string;
  goalContext: string;
  smartLabel: string;
  composed: string;
}

export function buildContext(
  level: Level,
  hoursPerWeek: number,
  goal?: string,
): BuiltContext {
  const levelContext = LEVEL_MAP[level] ?? LEVEL_MAP.intermediate;

  let pace: BuiltContext["pace"];
  let paceContext: string;
  if (hoursPerWeek <= 10) {
    pace = "slow";
    paceContext =
      "Slow-paced roadmap with fewer topics per phase, longer total duration, emphasize retention over breadth";
  } else if (hoursPerWeek <= 20) {
    pace = "balanced";
    paceContext =
      "Balanced roadmap with moderate number of topics per phase and reasonable total duration";
  } else {
    pace = "intensive";
    paceContext =
      "Fast, intensive roadmap with more topics per phase, shorter total duration, bootcamp-style depth";
  }

  const trimmedGoal = goal?.trim();
  const goalContext = trimmedGoal
    ? `User's explicit goal: "${trimmedGoal}". Bias every phase, project, and priority toward achieving this goal.`
    : "No specific goal provided — produce a well-rounded path.";

  // Smart label — a single short phrase summarising the shape of this plan.
  let smartLabel: string;
  if (pace === "intensive" && (level === "job-ready" || level === "expert")) {
    smartLabel = "Fast Track";
  } else if (level === "expert") {
    smartLabel = "Deep Specialization";
  } else if (level === "beginner" && pace === "slow") {
    smartLabel = "Gentle On-Ramp";
  } else if (pace === "intensive") {
    smartLabel = "Bootcamp";
  } else if (trimmedGoal) {
    smartLabel = "Goal-Driven Path";
  } else {
    smartLabel = "Balanced Path";
  }

  const composed = `${levelContext}. ${paceContext}. ${goalContext}`;
  return { levelContext, pace, paceContext, goalContext, smartLabel, composed };
}
