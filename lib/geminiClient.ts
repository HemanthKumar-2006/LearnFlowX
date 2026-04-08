import type { RoadmapInput } from "./types";
import { buildContext } from "./contextBuilder";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function isGeminiAvailable(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export interface RawLlmTopic {
  title: string;
  time?: string;
  priority?: string;
  description?: string;
  resources?: { title: string; url: string }[];
  project?: string;
  importance?: string;
}

export interface RawLlmPhase {
  title: string;
  duration?: string;
  milestone?: string;
  difficulty?: string;
  week_range?: string;
  topics: RawLlmTopic[];
}

export interface RawLlmRoadmap {
  total_duration?: string;
  strategy?: string;
  learning_strategy?: string;
  smart_label?: string;
  difficulty_progression?: string[];
  insights?: string[];
  warnings?: string[];
  recommended_focus?: string;
  next_best_action?: string;
  phases: RawLlmPhase[];
}

function profileSignature(input: RoadmapInput): number {
  const value = `${input.domain}|${input.track}|${input.level}|${input.hoursPerWeek}|${input.goal ?? ""}`;
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 10007;
  }
  return hash;
}

function variationStyle(signature: number): string {
  const variants = ["build-first", "systems-first", "concept-first"];
  return variants[signature % variants.length];
}

const GOAL_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "app",
  "application",
  "build",
  "for",
  "from",
  "get",
  "i",
  "in",
  "into",
  "learn",
  "make",
  "my",
  "of",
  "on",
  "platform",
  "project",
  "ship",
  "that",
  "the",
  "this",
  "to",
  "use",
  "using",
  "want",
  "with",
]);

function extractGoalSignals(goal?: string): string[] {
  if (!goal) return [];

  const tokens = goal
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(
      (token) =>
        token.length >= 3 &&
        !GOAL_STOP_WORDS.has(token) &&
        !/^\d+$/.test(token),
    );

  const unique: string[] = [];
  for (const token of tokens) {
    if (!unique.includes(token)) unique.push(token);
    if (unique.length >= 6) break;
  }

  return unique;
}

function structuralConstraints(input: RoadmapInput): {
  exactPhases: number;
  minPhases: number;
  maxPhases: number;
  targetTopicsPerPhase: number;
  minTopicsPerPhase: number;
  maxTopicsPerPhase: number;
  densityHint: string;
  progression: string;
  styleBias: string;
  temperature: number;
  strategy: "Fast Track" | "Balanced Path" | "Deep Mastery";
} {
  const { level, hoursPerWeek } = input;
  const signature = profileSignature(input);
  const phaseNudge = signature % 2;
  const topicNudge = signature % 3;

  let minPhases: number;
  let maxPhases: number;
  let progression: string;
  if (level === "beginner") {
    minPhases = 4;
    maxPhases = 6;
    progression =
      "Phase 1 and 2 must cover absolute fundamentals with gentle scaffolding and many small wins.";
  } else if (level === "intermediate") {
    minPhases = 3;
    maxPhases = 5;
    progression =
      "Skip true beginner material. Start with applied concepts, then move into integration work and real projects.";
  } else {
    minPhases = 3;
    maxPhases = 4;
    progression =
      "Assume the learner knows the basics. Focus on production-grade patterns, trade-offs, architecture, and real systems.";
  }

  const exactPhases =
    clampPhaseCount(
      level === "beginner"
      ? hoursPerWeek <= 10
        ? 6
        : hoursPerWeek <= 20
          ? 5
          : 4
      : level === "intermediate"
        ? hoursPerWeek <= 10
          ? 5
          : hoursPerWeek <= 20
            ? 4
            : 3
        : hoursPerWeek <= 10
          ? 4
          : hoursPerWeek <= 20
            ? 3
            : 3,
      minPhases,
      maxPhases,
      phaseNudge,
    );

  let minTopicsPerPhase: number;
  let maxTopicsPerPhase: number;
  let targetTopicsPerPhase: number;
  let densityHint: string;
  let strategy: "Fast Track" | "Balanced Path" | "Deep Mastery";

  if (hoursPerWeek <= 10) {
    minTopicsPerPhase = 2;
    maxTopicsPerPhase = 4;
    targetTopicsPerPhase = Math.min(
      4,
      Math.max(2, (level === "beginner" ? 3 : 2) + (topicNudge === 0 ? 0 : 1)),
    );
    densityHint =
      "Low time budget: keep phases compact, reduce concurrent topics, and stretch the timeline for retention.";
    strategy =
      level === "job-ready" || level === "expert"
        ? "Deep Mastery"
        : "Balanced Path";
  } else if (hoursPerWeek <= 20) {
    minTopicsPerPhase = 3;
    maxTopicsPerPhase = 5;
    targetTopicsPerPhase = Math.min(
      5,
      Math.max(3, (level === "beginner" ? 4 : 3) + (topicNudge === 2 ? 1 : 0)),
    );
    densityHint =
      "Balanced time budget: keep a steady pace with room for applied work in each phase.";
    strategy = "Balanced Path";
  } else {
    minTopicsPerPhase = 4;
    maxTopicsPerPhase = 7;
    targetTopicsPerPhase = Math.min(
      7,
      Math.max(4, (level === "beginner" ? 5 : 6) - (topicNudge === 0 ? 1 : 0)),
    );
    densityHint =
      "High time budget: use dense phases, faster progression, and a capstone-heavy plan.";
    strategy = level === "beginner" ? "Balanced Path" : "Fast Track";
  }

  return {
    exactPhases,
    minPhases,
    maxPhases,
    targetTopicsPerPhase,
    minTopicsPerPhase,
    maxTopicsPerPhase,
    densityHint,
    progression,
    styleBias: variationStyle(signature),
    temperature: 0.72 + (signature % 4) * 0.04,
    strategy,
  };
}

function clampPhaseCount(
  value: number,
  min: number,
  max: number,
  nudge: number,
): number {
  return Math.max(min, Math.min(max, value - nudge));
}

function buildPrompt(input: RoadmapInput): string {
  const ctx = buildContext(input.level, input.hoursPerWeek, input.goal);
  const c = structuralConstraints(input);
  const goalSignals = extractGoalSignals(input.goal);

  const goalLine = input.goal
    ? `User goal: "${input.goal}". Every phase must visibly align to this goal through topic choice, priorities, milestones, and projects. At least one project must be a working version of this goal.`
    : "No explicit goal. Produce a well-rounded path for this track.";

  const goalSignalLine =
    goalSignals.length > 0
      ? `Goal signals to inject when relevant: ${goalSignals.join(", ")}. At least 2 topics, milestones, or projects must clearly reflect these signals.`
      : "No extra goal signals were provided.";

  const openingDifficulty =
    input.level === "beginner"
      ? "beginner"
      : input.level === "intermediate"
        ? "beginner or intermediate"
        : "intermediate";
  const finalDifficulty =
    input.level === "beginner" ? "intermediate" : "advanced";

  return `You are LearnFlow, an expert AI learning-path architect and mentor.

Your job is to generate a deeply personalized roadmap. Two users with different level, hours per week, or goal must receive visibly different plans with different structure, density, priorities, and projects.

USER INPUT
- Domain: ${input.domain}
- Track: ${input.track}
- Target level: ${input.level}
- Time available: ${input.hoursPerWeek} hours per week
- Goal: ${input.goal ? `"${input.goal}"` : "none"}

PERSONALIZATION CONTEXT
${ctx.composed}

HARD STRUCTURAL CONSTRAINTS
- Produce EXACTLY ${c.exactPhases} phases.
- Phase count must remain between ${c.minPhases} and ${c.maxPhases}.
- Always return at least 3 phases total.
- Most phases should contain about ${c.targetTopicsPerPhase} topics.
- Topics per phase must remain between ${c.minTopicsPerPhase} and ${c.maxTopicsPerPhase}.
- Every phase must contain at least 2 topics.
- Density rule: ${c.densityHint}
- Progression rule: ${c.progression}
- ${goalLine}
- ${goalSignalLine}
- Goal dominance rule: if a goal exists, at least 40% of all topics must directly support that goal.
- Difficulty curve must increase across phases.
- Phase 1 difficulty should be ${openingDifficulty}.
- Final phase difficulty should be ${finalDifficulty}.
- Phase 1 must start with fundamentals and prerequisites before tools or frameworks.
- Middle phases must build directly on previous phases instead of restarting from generic basics.
- Final phase must be a real-world, portfolio-worthy capstone.
- Final phase must include a goal-based project when a goal exists.
- Include at least 1 concrete project milestone in every phase.
- No duplicate topics across phases.
- Topics must be ordered logically with prerequisites first.
- Visible variation rule: similar users should still get noticeably different phase shapes, topic mixes, and project emphasis based on this plan style: ${c.styleBias}.
- Each phase must include title, duration, week_range, difficulty, milestone, and topics.
- Each topic must include title, time, priority, description, and resources.
- Priority must only be high, medium, or low.
- Use high priority for foundational or goal-critical topics.

RESOURCE RULES (STRICT)
- Use ONLY these STABLE BASE URLs. Never deep-link to a specific article or slug.
  Allowed URLs:
    https://react.dev/learn
    https://react.dev/reference/react
    https://developer.mozilla.org/en-US/docs/Web/JavaScript
    https://developer.mozilla.org/en-US/docs/Web/HTML
    https://developer.mozilla.org/en-US/docs/Web/CSS
    https://developer.mozilla.org/en-US/docs/Web/HTTP
    https://developer.mozilla.org/en-US/docs/Web/API
    https://developer.mozilla.org/en-US/docs/Web/Accessibility
    https://developer.mozilla.org/en-US/docs/Web/Performance
    https://developer.mozilla.org/en-US/docs/Web/Security
    https://developer.mozilla.org/en-US/docs/Learn
    https://www.freecodecamp.org/learn/
    https://www.freecodecamp.org/news/
    https://huggingface.co/learn
    https://pytorch.org/tutorials/
    https://nextjs.org/docs
    https://scikit-learn.org/stable/
- NEVER invent URLs. NEVER use article slugs like "/news/docker-for-beginners/".
- If the exact URL you would pick is not in the list above, OMIT the resource. The post-processor will inject a verified fallback.
- Do not use Medium, YouTube article links, GitHub repos, Coursera, Udemy, blogs, or any source outside the list.
- Maximum 2 resources per topic. Prefer official docs first, then freeCodeCamp.

INTELLIGENCE LAYER
- "learning_strategy" must be exactly one of "Fast Track", "Balanced Path", or "Deep Mastery". Suggested value: "${c.strategy}".
- "smart_label" must be a short 1 to 3 word tag such as "Goal-Driven", "Beginner Friendly", or "Intensive".
- "insights" must contain 3 to 5 short, specific, actionable tips for this exact learner.
- "warnings" must contain 0 to 2 honest warnings when the plan is dense or long.
- "recommended_focus" must be 1 sentence describing what to prioritize early.
- "next_best_action" must be 1 sentence describing the first concrete action to take today.

OUTPUT FORMAT
Return ONLY valid JSON. No markdown. No explanation. No prose outside the JSON object.

{
  "total_duration": "e.g. 10 weeks",
  "strategy": "1 to 2 sentences describing the personalized strategy",
  "learning_strategy": "Fast Track | Balanced Path | Deep Mastery",
  "smart_label": "short tag",
  "difficulty_progression": ["beginner", "intermediate", "advanced"],
  "insights": ["tip 1", "tip 2", "tip 3"],
  "warnings": ["warning if applicable"],
  "recommended_focus": "one sentence",
  "next_best_action": "one sentence",
  "phases": [
    {
      "title": "Phase title",
      "duration": "e.g. 2 weeks",
      "week_range": "Week 1-2",
      "difficulty": "beginner | intermediate | advanced",
      "milestone": "What the learner can do at the end of this phase",
      "topics": [
        {
          "title": "Topic title",
          "time": "e.g. 6 hours",
          "priority": "high | medium | low",
          "description": "1 to 2 sentences, concrete and specific to this user",
          "resources": [
            { "title": "Resource title", "url": "https://..." }
          ],
          "project": "Optional small concrete project for this topic"
        }
      ]
    }
  ]
}

Return ONLY valid JSON. No explanations.`;
}

function stripJsonFences(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return text;
  }
  return text.slice(firstBrace, lastBrace + 1);
}

function safeParseJSON<T>(text: string): T | null {
  if (!text || typeof text !== "string") return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    try {
      return JSON.parse(stripJsonFences(text)) as T;
    } catch {
      console.error("Invalid JSON from Gemini:", text);
      return null;
    }
  }
}

export async function generateWithGemini(
  input: RoadmapInput,
): Promise<RawLlmRoadmap | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  let prompt: string;
  let constraints: ReturnType<typeof structuralConstraints>;
  try {
    constraints = structuralConstraints(input);
    prompt = buildPrompt(input);
  } catch (error) {
    console.error("[geminiClient] Failed to build prompt:", error);
    return null;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: constraints.temperature,
          topP: 0.95,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        "[geminiClient] HTTP error",
        response.status,
        errorText.slice(0, 400),
      );
      return null;
    }

    const data = (await response.json().catch(() => null)) as
      | {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
        }
      | null;

    if (!data) return null;

    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("\n") ?? "";

    if (!text) return null;

    const parsed = safeParseJSON<RawLlmRoadmap>(text);
    if (!parsed || !Array.isArray(parsed.phases) || parsed.phases.length === 0) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("[geminiClient] generateWithGemini failed:", error);
    return null;
  }
}

export { buildPrompt, safeParseJSON, structuralConstraints };
