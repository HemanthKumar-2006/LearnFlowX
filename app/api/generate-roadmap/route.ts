// API route — POST /api/generate-roadmap
//
// Pipeline (new):
//   1. Validate input
//   2. Build personalized context
//   3. Call Gemini with a strict prompt
//   4. Post-process (validate, dedupe, inject fallback resources)
//   5. Fall back to the deterministic engine if anything fails
//
// This is the fix for the "everyone gets the same roadmap" bug: the
// LLM is now the *primary* source of roadmap structure, and level/time/
// goal are baked directly into its prompt via the Context Builder.

import { NextResponse } from "next/server";
import { generateBaseRoadmap } from "@/lib/roadmapEngine";
import { generateWithGemini, isGeminiAvailable } from "@/lib/geminiClient";
import { postProcessRoadmap } from "@/lib/postProcessor";
import { buildContext } from "@/lib/contextBuilder";
import type { Level, Roadmap, RoadmapInput } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const VALID_LEVELS: Level[] = ["beginner", "intermediate", "job-ready", "expert"];

function validate(body: unknown): RoadmapInput | { error: string } {
  if (!body || typeof body !== "object") return { error: "Invalid request body" };
  const b = body as Record<string, unknown>;

  const domain = typeof b.domain === "string" ? b.domain.trim() : "";
  const track = typeof b.track === "string" ? b.track.trim() : "";
  const level = typeof b.level === "string" ? (b.level as Level) : "intermediate";
  const hoursPerWeek = Number(b.hoursPerWeek);
  const goal = typeof b.goal === "string" && b.goal.trim() ? b.goal.trim() : undefined;

  if (!domain) return { error: "Domain is required" };
  if (!track) return { error: "Track is required" };
  if (!VALID_LEVELS.includes(level)) return { error: "Invalid level" };
  if (!Number.isFinite(hoursPerWeek) || hoursPerWeek < 1 || hoursPerWeek > 80) {
    return { error: "Hours/week must be between 1 and 80" };
  }

  return { domain, track, level, hoursPerWeek, goal };
}

function enrichFallback(roadmap: Roadmap, input: RoadmapInput): Roadmap {
  const ctx = buildContext(input.level, input.hoursPerWeek, input.goal);
  // Give the template engine the same strategy/label so the UI stays consistent.
  let weekCursor = 1;
  const phases = roadmap.phases.map((p) => {
    const weeks = Math.max(
      1,
      Math.ceil(
        p.topics.reduce((s, t) => s + t.estimatedHours, 0) /
          Math.max(1, input.hoursPerWeek),
      ),
    );
    const start = weekCursor;
    const end = weekCursor + weeks - 1;
    weekCursor = end + 1;
    return {
      ...p,
      difficulty: p.difficulty ?? (input.level === "beginner" ? "beginner" : input.level === "intermediate" ? "intermediate" : "advanced"),
      weekRange: p.weekRange ?? (start === end ? `Week ${start}` : `Week ${start}-${end}`),
    };
  });
  return {
    ...roadmap,
    phases,
    goal: input.goal,
    strategy:
      roadmap.strategy ||
      `${ctx.paceContext}. ${ctx.goalContext}`,
    totalDuration:
      roadmap.totalDuration ||
      (roadmap.totalWeeks === 1 ? "1 week" : `${roadmap.totalWeeks} weeks`),
    smartLabel: roadmap.smartLabel || ctx.smartLabel,
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 });
  }

  const result = validate(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const input = result;

  // 1. Try Gemini first — this is where real personalization happens.
  if (isGeminiAvailable()) {
    const raw = await generateWithGemini(input);
    if (raw) {
      const processed = postProcessRoadmap(raw, input);
      if (processed) {
        return NextResponse.json({ roadmap: processed, source: "gemini" });
      }
    }
  }

  // 2. Deterministic fallback — still personalized per level/time, just from templates.
  const base = generateBaseRoadmap(input);
  const enriched = enrichFallback(base, input);
  return NextResponse.json({ roadmap: enriched, source: enriched.source });
}
