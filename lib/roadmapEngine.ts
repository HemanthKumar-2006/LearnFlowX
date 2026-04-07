// Roadmap Engine — the deterministic core of LearnFlow.
//
// It runs the hybrid pipeline:
//   1. Template Selection      → pick a structured base roadmap
//   2. Constraint Processing   → scale duration & depth to time + level
//   3. (optional) AI Refinement → handled in the API route via claudeClient
//
// The engine is intentionally synchronous and side-effect-free so it can be
// run on the server (API route) OR the client (instant fallback if AI fails).

import {
  selectTemplate,
  LEVEL_DEPTH_MULTIPLIER,
  LEVEL_TOPIC_KEEP_RATIO,
  type RoadmapTemplate,
  type TemplateTopic,
  type TemplatePhase,
} from "./templates";
import type { Phase, Roadmap, RoadmapInput, Topic } from "./types";

let counter = 0;
const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${(counter++).toString(36)}`;

function humanizeHours(hours: number): string {
  if (hours <= 0) return "—";
  if (hours < 1) return "< 1 hour";
  if (hours < 8) return `${Math.round(hours)} hours`;
  const days = hours / 4; // assume ~4 productive hours per study day
  if (days < 7) return `${Math.max(1, Math.round(days))} day${Math.round(days) === 1 ? "" : "s"}`;
  const weeks = days / 5;
  return `${Math.max(1, Math.round(weeks))} week${Math.round(weeks) === 1 ? "" : "s"}`;
}

function humanizeWeeks(weeks: number): string {
  if (weeks < 1) return "< 1 week";
  if (weeks < 8) return `${Math.round(weeks)} weeks`;
  const months = weeks / 4.34;
  return `${Math.max(1, Math.round(months))} month${Math.round(months) === 1 ? "" : "s"}`;
}

function scaleTopic(t: TemplateTopic, depthMult: number): Topic {
  const estimatedHours = Math.max(1, Math.round(t.baseHours * depthMult));
  return {
    id: uid("topic"),
    title: t.title,
    estimatedHours,
    time: humanizeHours(estimatedHours),
    priority: t.priority,
    description: t.description,
    resources: t.resources ?? [],
    project: t.project,
    completed: false,
  };
}

function buildPhase(
  tp: TemplatePhase,
  hoursPerWeek: number,
  depthMult: number,
  keepRatio: number,
): Phase {
  // Sort by priority (high first) and only keep the top `keepRatio` slice for lower levels.
  const priorityRank = { high: 0, medium: 1, low: 2 } as const;
  const sorted = [...tp.topics].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
  const keepCount = Math.max(1, Math.ceil(sorted.length * keepRatio));
  const kept = sorted.slice(0, keepCount);

  const topics = kept.map((t) => scaleTopic(t, depthMult));
  const phaseHours = topics.reduce((sum, t) => sum + t.estimatedHours, 0);
  const phaseWeeks = Math.max(1, Math.ceil(phaseHours / Math.max(1, hoursPerWeek)));

  return {
    id: uid("phase"),
    title: tp.title,
    milestone: tp.milestone,
    description: tp.description,
    duration: humanizeWeeks(phaseWeeks),
    topics,
  };
}

/**
 * Run the deterministic part of the pipeline (template + constraints).
 * Returns a fully usable Roadmap; AI refinement is layered on top in the API route.
 */
export function generateBaseRoadmap(input: RoadmapInput): Roadmap {
  const template: RoadmapTemplate = selectTemplate(input.domain, input.track);
  const depthMult = LEVEL_DEPTH_MULTIPLIER[input.level];
  const keepRatio = LEVEL_TOPIC_KEEP_RATIO[input.level];

  const phases = template.phases.map((p) =>
    buildPhase(p, input.hoursPerWeek, depthMult, keepRatio),
  );

  const totalHours = phases.reduce(
    (sum, p) => sum + p.topics.reduce((s, t) => s + t.estimatedHours, 0),
    0,
  );
  const totalWeeks = Math.max(1, Math.ceil(totalHours / Math.max(1, input.hoursPerWeek)));

  return {
    id: uid("roadmap"),
    domain: template.domain,
    track: template.track || input.track,
    level: input.level,
    hoursPerWeek: input.hoursPerWeek,
    totalHours,
    totalWeeks,
    generatedAt: Date.now(),
    source: "template",
    phases,
  };
}

/**
 * Recompute durations after the user changes their available time.
 * Topic content stays the same — only durations and the total time line shift.
 */
export function recomputePace(roadmap: Roadmap, newHoursPerWeek: number): Roadmap {
  const phases = roadmap.phases.map((p) => {
    const phaseHours = p.topics.reduce((sum, t) => sum + t.estimatedHours, 0);
    const phaseWeeks = Math.max(1, Math.ceil(phaseHours / Math.max(1, newHoursPerWeek)));
    return { ...p, duration: humanizeWeeks(phaseWeeks) };
  });
  const totalHours = phases.reduce(
    (sum, p) => sum + p.topics.reduce((s, t) => s + t.estimatedHours, 0),
    0,
  );
  const totalWeeks = Math.max(1, Math.ceil(totalHours / Math.max(1, newHoursPerWeek)));
  return { ...roadmap, hoursPerWeek: newHoursPerWeek, totalHours, totalWeeks, phases };
}

/**
 * Merge AI-refined content (descriptions, projects, resources) into the
 * deterministic roadmap. We keep the engine's IDs and durations as ground
 * truth and only let the AI improve the *content* of each topic.
 */
export interface AiTopicPatch {
  title: string;
  description?: string;
  project?: string;
  resources?: { title: string; url: string }[];
}

export interface AiPhasePatch {
  title: string;
  description?: string;
  milestone?: string;
  topics?: AiTopicPatch[];
}

export interface AiRoadmapPatch {
  phases: AiPhasePatch[];
}

export function mergeAiPatch(base: Roadmap, patch: AiRoadmapPatch): Roadmap {
  const phases = base.phases.map((phase, i) => {
    const pPatch = patch.phases?.[i];
    if (!pPatch) return phase;
    const topics = phase.topics.map((topic, j) => {
      const tPatch = pPatch.topics?.[j];
      if (!tPatch) return topic;
      return {
        ...topic,
        description: tPatch.description?.trim() || topic.description,
        project: tPatch.project?.trim() || topic.project,
        resources:
          Array.isArray(tPatch.resources) && tPatch.resources.length > 0
            ? tPatch.resources.filter((r) => r && r.title && r.url)
            : topic.resources,
      };
    });
    return {
      ...phase,
      description: pPatch.description?.trim() || phase.description,
      milestone: pPatch.milestone?.trim() || phase.milestone,
      topics,
    };
  });
  return { ...base, phases, source: "hybrid" };
}
