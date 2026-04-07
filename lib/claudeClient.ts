// Claude API client for the AI Personalization Layer.
//
// We deliberately keep the AI's job *small*: it only refines the content
// (descriptions, projects, resources) of the deterministic roadmap. The
// roadmap engine remains the source of truth for structure, durations,
// and IDs. This makes the system robust even when the API is unavailable.

import Anthropic from "@anthropic-ai/sdk";
import type { Roadmap } from "./types";
import type { AiRoadmapPatch } from "./roadmapEngine";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export function isAiAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

const SYSTEM_PROMPT = `You are LearnFlow's AI Personalization Layer. Your job is to refine a learning roadmap that has already been structured by a deterministic engine.

You will receive:
- The user's domain, track, level, and hours/week
- A base roadmap with phases and topics

Your task: rewrite the description, project, and resources of each topic to be more specific, motivating, and concretely useful for someone at this level. Keep the SAME number of phases and topics in the SAME order. Do not invent new phases or topics. Do not change titles. Do not change durations or IDs.

Return STRICTLY a JSON object matching this TypeScript type, and nothing else:

interface AiRoadmapPatch {
  phases: {
    title: string;             // must match the input phase title exactly
    description?: string;      // 1-2 sentences, motivating
    milestone?: string;        // optional refined milestone
    topics: {
      title: string;           // must match exactly
      description: string;     // 1-2 sentences, concrete and specific
      project?: string;        // a small concrete project they can build
      resources: { title: string; url: string }[]; // 2-4 high-quality real resources
    }[];
  }[];
}

Output only the JSON object. No prose. No markdown. No code fences.`;

function buildUserMessage(roadmap: Roadmap): string {
  const compact = {
    domain: roadmap.domain,
    track: roadmap.track,
    level: roadmap.level,
    hoursPerWeek: roadmap.hoursPerWeek,
    phases: roadmap.phases.map((p) => ({
      title: p.title,
      milestone: p.milestone,
      topics: p.topics.map((t) => ({
        title: t.title,
        priority: t.priority,
        time: t.time,
      })),
    })),
  };
  return `Refine this roadmap for the user. Return ONLY the JSON patch.\n\n${JSON.stringify(compact, null, 2)}`;
}

function extractJson(raw: string): unknown {
  // Be defensive — strip code fences if the model added them despite instructions.
  let txt = raw.trim();
  if (txt.startsWith("```")) {
    txt = txt.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  // Find the first { and the last } to be extra safe.
  const first = txt.indexOf("{");
  const last = txt.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("No JSON object found in model output");
  return JSON.parse(txt.slice(first, last + 1));
}

/**
 * Ask Claude to refine the roadmap.
 * Returns null if the API key is missing or anything goes wrong; the caller
 * should fall back to the deterministic roadmap.
 */
export async function refineRoadmapWithAi(
  roadmap: Roadmap,
): Promise<AiRoadmapPatch | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(roadmap) }],
    });

    // Concatenate any text blocks in the response.
    const text = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n");

    const parsed = extractJson(text) as AiRoadmapPatch;
    if (!parsed || !Array.isArray(parsed.phases)) return null;
    return parsed;
  } catch (err) {
    console.error("[claudeClient] AI refinement failed:", err);
    return null;
  }
}
