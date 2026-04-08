import type {
  Level,
  Phase,
  Priority,
  Resource,
  Roadmap,
  RoadmapInput,
  Topic,
  TopicDifficulty,
  WeeklyPlanItem,
} from "./types";
import type { RawLlmPhase, RawLlmRoadmap, RawLlmTopic } from "./geminiClient";
import { buildContext } from "./contextBuilder";
import {
  getFallbackResources,
  isTrustedUrl,
  platformFromUrl,
} from "./resourceFallbacks";

type Difficulty = "beginner" | "intermediate" | "advanced";
type TopicWithMeta = Topic & Record<string, unknown>;
type PhaseWithMeta = Phase & Record<string, unknown>;

// Map a phase-level difficulty to the card-friendly easy/medium/hard tag
// shown on topic cards, nudged by the topic's own priority.
function phaseDifficultyToTopicTag(
  phaseDifficulty: Difficulty,
  priority: Priority,
): TopicDifficulty {
  if (phaseDifficulty === "beginner") {
    return priority === "high" ? "medium" : "easy";
  }
  if (phaseDifficulty === "intermediate") {
    return priority === "low" ? "easy" : priority === "high" ? "hard" : "medium";
  }
  return priority === "low" ? "medium" : "hard";
}

interface NextBestActionData {
  title: string;
  reason: string;
  estimatedTime: string;
  phase: string;
  topicId?: string;
}

interface RecommendedFocusData {
  phase: string;
  reason: string;
}

interface MomentumData {
  stage: "starting" | "building" | "mastery";
  message: string;
  progressPercent: number;
}

let counter = 0;
const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${(counter++).toString(36)}`;

const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

const GOAL_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "app",
  "application",
  "build",
  "by",
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseHours(value: string | undefined, fallback: number): number {
  if (!value) return fallback;

  const matches = [...value.matchAll(/(\d+(?:\.\d+)?)/g)].map((match) =>
    parseFloat(match[1]),
  );
  if (matches.length === 0) return fallback;

  let amount = matches[0];
  const lower = value.toLowerCase();
  if (matches.length >= 2 && /-|to/.test(lower)) {
    amount = (matches[0] + matches[1]) / 2;
  }

  if (lower.includes("day")) return Math.max(1, Math.round(amount * 4));
  if (lower.includes("week")) return Math.max(1, Math.round(amount * 10));
  if (lower.includes("month")) return Math.max(1, Math.round(amount * 40));
  if (lower.includes("min")) return Math.max(1, Math.round(amount / 60));
  return Math.max(1, Math.round(amount));
}

function formatHours(hours: number): string {
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

function formatWeeks(weeks: number): string {
  return weeks === 1 ? "1 week" : `${weeks} weeks`;
}

function normalizePriority(value: string | undefined): Priority {
  const normalized = (value ?? "").toLowerCase().trim();
  if (
    normalized.startsWith("high") ||
    normalized === "h" ||
    normalized.includes("critical") ||
    normalized.includes("must") ||
    normalized.includes("important")
  ) {
    return "high";
  }
  if (
    normalized.startsWith("low") ||
    normalized === "l" ||
    normalized.includes("optional") ||
    normalized.includes("nice")
  ) {
    return "low";
  }
  return "medium";
}

function normalizeDifficulty(value: string | undefined): Difficulty | null {
  const normalized = (value ?? "").toLowerCase().trim();
  if (!normalized) return null;
  if (
    normalized.includes("begin") ||
    normalized.includes("intro") ||
    normalized.includes("basic") ||
    normalized.includes("foundation")
  ) {
    return "beginner";
  }
  if (
    normalized.includes("inter") ||
    normalized.includes("applied") ||
    normalized.includes("practical")
  ) {
    return "intermediate";
  }
  if (
    normalized.includes("adv") ||
    normalized.includes("expert") ||
    normalized.includes("deep") ||
    normalized.includes("system")
  ) {
    return "advanced";
  }
  return null;
}

function defaultDifficultyForLevel(level: Level): Difficulty {
  if (level === "beginner") return "beginner";
  if (level === "intermediate") return "intermediate";
  return "advanced";
}

function targetDifficultyForPhase(
  level: Level,
  phaseIndex: number,
  totalPhases: number,
): Difficulty {
  const isLast = phaseIndex === totalPhases - 1;
  if (level === "beginner") {
    return phaseIndex <= 1 ? "beginner" : isLast ? "intermediate" : "intermediate";
  }
  if (level === "intermediate") {
    return isLast ? "advanced" : "intermediate";
  }
  return phaseIndex === 0 ? "intermediate" : "advanced";
}

function alignPhaseDifficulty(
  current: Difficulty | null,
  level: Level,
  phaseIndex: number,
  totalPhases: number,
): Difficulty {
  const minimum = targetDifficultyForPhase(level, phaseIndex, totalPhases);
  if (!current) return minimum;
  return DIFFICULTY_ORDER[current] < DIFFICULTY_ORDER[minimum] ? minimum : current;
}

function dedupeKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeTitle(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

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
    if (unique.length >= 8) break;
  }
  return unique;
}

function scoreGoalRelevance(text: string, signals: string[]): number {
  if (signals.length === 0) return 0;

  const normalized = text.toLowerCase();
  let score = 0;
  for (const signal of signals) {
    if (normalized.includes(signal)) {
      score += signal.length >= 6 ? 22 : 14;
    }
  }
  return clamp(score, 0, 100);
}

function createTopicDescription(
  title: string,
  input: RoadmapInput,
  phaseTitle: string,
  rawDescription?: string,
): string {
  const description = (rawDescription ?? "").trim();
  if (description) return description;

  if (input.goal) {
    return `Use ${title} inside ${phaseTitle} to move directly toward ${input.goal}.`;
  }

  return `Build real confidence with ${title} as part of your ${input.track} path.`;
}

function createImportanceScore(
  priority: Priority,
  goalRelevanceScore: number,
  phaseIndex: number,
  totalPhases: number,
  hasProject: boolean,
): number {
  const base = priority === "high" ? 68 : priority === "medium" ? 48 : 32;
  const phaseBonus = phaseIndex === 0 ? 14 : phaseIndex === totalPhases - 1 ? 12 : 7;
  const projectBonus = hasProject ? 8 : 0;
  const score = base + Math.round(goalRelevanceScore * 0.22) + phaseBonus + projectBonus;
  return clamp(score, 1, 100);
}

function buildTopic(
  raw: RawLlmTopic,
  input: RoadmapInput,
  phaseTitle: string,
  phaseIndex: number,
  totalPhases: number,
  goalSignals: string[],
  seen: Set<string>,
): TopicWithMeta | null {
  if (!raw || typeof raw !== "object") return null;

  const title = normalizeTitle(raw.title ?? "");
  if (!title) return null;

  const key = dedupeKey(title);
  if (!key || seen.has(key)) return null;
  seen.add(key);

  const estimatedHours = parseHours(raw.time, 4);
  const priority = normalizePriority(raw.priority ?? raw.importance);
  const description = createTopicDescription(title, input, phaseTitle, raw.description);
  const project = raw.project?.trim() || undefined;

  const llmResources: Resource[] = Array.isArray(raw.resources)
    ? raw.resources
        .filter(
          (resource) =>
            resource &&
            typeof resource.title === "string" &&
            typeof resource.url === "string" &&
            resource.title.trim().length > 0 &&
            isTrustedUrl(resource.url.trim()),
        )
        .map((resource) => {
          const url = resource.url.trim();
          return {
            title: resource.title.trim(),
            url,
            platform: platformFromUrl(url),
          };
        })
        .slice(0, 2)
    : [];

  const fallbackContext = [
    title,
    description,
    project,
    phaseTitle,
    input.track,
    input.domain,
    input.goal,
  ]
    .filter(Boolean)
    .join(" ");

  const goalRelevanceScore = scoreGoalRelevance(
    [title, description, project ?? "", phaseTitle].join(" "),
    goalSignals,
  );

  const topic = {
    id: uid("topic"),
    title,
    estimatedHours,
    time: formatHours(estimatedHours),
    priority,
    description,
    resources:
      llmResources.length > 0 ? llmResources : getFallbackResources(fallbackContext),
    project,
    completed: false,
  } as TopicWithMeta;

  topic.goalRelevanceScore = goalRelevanceScore;
  topic.goalAligned = goalRelevanceScore >= 20;
  topic.importanceScore = createImportanceScore(
    priority,
    goalRelevanceScore,
    phaseIndex,
    totalPhases,
    Boolean(project),
  );
  topic.importance_score = topic.importanceScore;

  return topic;
}

function buildPhase(
  raw: RawLlmPhase,
  input: RoadmapInput,
  phaseIndex: number,
  totalPhases: number,
  goalSignals: string[],
  seen: Set<string>,
): PhaseWithMeta | null {
  if (!raw || typeof raw !== "object") return null;

  const title = normalizeTitle(raw.title ?? "");
  if (!title) return null;

  const rawTopics = Array.isArray(raw.topics) ? raw.topics : [];
  const topics = rawTopics
    .map((topic) =>
      buildTopic(topic, input, title, phaseIndex, totalPhases, goalSignals, seen),
    )
    .filter((topic): topic is TopicWithMeta => topic !== null);

  if (topics.length === 0) return null;

  return {
    id: uid("phase"),
    title,
    duration: "1 week",
    milestone: (raw.milestone ?? "").trim() || `Complete ${title}`,
    description: "",
    topics,
    difficulty: alignPhaseDifficulty(
      normalizeDifficulty(raw.difficulty),
      input.level,
      phaseIndex,
      totalPhases,
    ),
    weekRange: "Week 1",
    estimatedHours: topics.reduce((sum, topic) => sum + topic.estimatedHours, 0),
    completionPercentage: 0,
  } as PhaseWithMeta;
}

function splitPhaseTitle(title: string, secondPart: boolean): string {
  const suffix = secondPart ? "Applied Build" : "Core Skills";
  if (title.toLowerCase().includes("phase")) {
    return `${title} ${secondPart ? "Part 2" : "Part 1"}`;
  }
  return `${title} - ${suffix}`;
}

function splitPhaseForStructure(phase: PhaseWithMeta): [PhaseWithMeta, PhaseWithMeta] | null {
  if (phase.topics.length < 4) return null;

  const splitIndex = clamp(Math.ceil(phase.topics.length / 2), 2, phase.topics.length - 2);
  const firstTopics = phase.topics.slice(0, splitIndex) as TopicWithMeta[];
  const secondTopics = phase.topics.slice(splitIndex) as TopicWithMeta[];
  if (firstTopics.length < 2 || secondTopics.length < 2) return null;

  const firstPhase = {
    ...phase,
    id: uid("phase"),
    title: splitPhaseTitle(phase.title, false),
    milestone: phase.milestone,
    topics: firstTopics,
  } as PhaseWithMeta;

  const secondPhase = {
    ...phase,
    id: uid("phase"),
    title: splitPhaseTitle(phase.title, true),
    milestone: `Apply ${phase.title.toLowerCase()} in a more realistic build`,
    topics: secondTopics,
  } as PhaseWithMeta;

  return [firstPhase, secondPhase];
}

function repairSmallPhases(phases: PhaseWithMeta[]): PhaseWithMeta[] | null {
  const working = [...phases];

  for (let index = 0; index < working.length; index += 1) {
    if (working[index].topics.length >= 2) continue;

    const candidates = [index - 1, index + 1]
      .filter((candidate) => candidate >= 0 && candidate < working.length)
      .map((candidate) => ({
        index: candidate,
        count: working[candidate].topics.length,
      }))
      .filter((candidate) => candidate.count > 2)
      .sort((left, right) => right.count - left.count);

    const donor = candidates[0];
    if (!donor) return null;

    const donorTopics = [...working[donor.index].topics] as TopicWithMeta[];
    const donated =
      donor.index < index ? donorTopics.pop() : donorTopics.shift();
    if (!donated) return null;

    working[donor.index] = {
      ...working[donor.index],
      topics: donorTopics,
    } as PhaseWithMeta;

    working[index] = {
      ...working[index],
      topics:
        donor.index < index
          ? ([donated, ...working[index].topics] as TopicWithMeta[])
          : ([...working[index].topics, donated] as TopicWithMeta[]),
    } as PhaseWithMeta;
  }

  return working.every((phase) => phase.topics.length >= 2) ? working : null;
}

function ensureMinimumStructure(
  phases: PhaseWithMeta[],
): PhaseWithMeta[] | null {
  let working = [...phases];
  const totalTopics = working.reduce((sum, phase) => sum + phase.topics.length, 0);
  if (totalTopics < 6) return null;

  while (working.length < 3) {
    const candidateIndex = working.reduce(
      (best, phase, index, items) =>
        phase.topics.length > items[best].topics.length ? index : best,
      0,
    );
    const split = splitPhaseForStructure(working[candidateIndex]);
    if (!split) break;
    working.splice(candidateIndex, 1, split[0], split[1]);
  }

  if (working.length < 3) return null;
  return repairSmallPhases(working);
}

function alignDifficultyCurve(phases: PhaseWithMeta[], level: Level): PhaseWithMeta[] {
  return phases.map((phase, index, items) => {
    const minimum = alignPhaseDifficulty(
      normalizeDifficulty(typeof phase.difficulty === "string" ? phase.difficulty : undefined),
      level,
      index,
      items.length,
    );
    if (index === 0) {
      return { ...phase, difficulty: minimum } as PhaseWithMeta;
    }

    const previous = items[index - 1].difficulty as Difficulty | undefined;
    const previousDifficulty = previous ?? defaultDifficultyForLevel(level);
    const currentDifficulty = phase.difficulty as Difficulty | undefined;
    const aligned =
      currentDifficulty && DIFFICULTY_ORDER[currentDifficulty] >= DIFFICULTY_ORDER[previousDifficulty]
        ? currentDifficulty
        : previousDifficulty;

    return {
      ...phase,
      difficulty: DIFFICULTY_ORDER[aligned] < DIFFICULTY_ORDER[minimum] ? minimum : aligned,
    } as PhaseWithMeta;
  });
}

function ensureGoalDominance(
  phases: PhaseWithMeta[],
  input: RoadmapInput,
  goalSignals: string[],
): PhaseWithMeta[] {
  if (!input.goal || goalSignals.length === 0) return phases;

  const topics = phases.flatMap((phase) => phase.topics as TopicWithMeta[]);
  const minimumGoalTopics = Math.ceil(topics.length * 0.4);
  let goalAlignedCount = topics.filter((topic) => Boolean(topic.goalAligned)).length;

  if (goalAlignedCount < minimumGoalTopics) {
    const candidates = phases
      .flatMap((phase, phaseIndex) =>
        (phase.topics as TopicWithMeta[]).map((topic, topicIndex) => ({
          phaseIndex,
          topicIndex,
          topic,
          boost:
            (topic.priority === "high" ? 30 : topic.priority === "medium" ? 18 : 8) +
            (phaseIndex === phases.length - 1 ? 20 : 0),
        })),
      )
      .filter(({ topic }) => !topic.goalAligned)
      .sort((left, right) => right.boost - left.boost);

    for (const candidate of candidates) {
      if (goalAlignedCount >= minimumGoalTopics) break;

      const topic = phases[candidate.phaseIndex].topics[candidate.topicIndex] as TopicWithMeta;
      const goalClause = `Tie this topic directly to ${input.goal}.`;
      if (!topic.description.includes(goalClause)) {
        topic.description = `${topic.description} ${goalClause}`.trim();
      }
      if (!topic.project) {
        topic.project = `Apply ${topic.title} in a build that moves toward ${input.goal}.`;
      }
      topic.goalRelevanceScore = clamp(
        Math.max(Number(topic.goalRelevanceScore ?? 0), 72),
        0,
        100,
      );
      topic.goalAligned = true;
      topic.importanceScore = clamp(
        Math.max(Number(topic.importanceScore ?? 0), 78),
        1,
        100,
      );
      topic.importance_score = topic.importanceScore;
      goalAlignedCount += 1;
    }
  }

  const finalPhase = phases[phases.length - 1];
  if (finalPhase) {
    finalPhase.milestone = input.goal
      ? `Ship a portfolio-ready project aligned to ${input.goal}`
      : finalPhase.milestone;

    const lastTopic = finalPhase.topics[finalPhase.topics.length - 1] as TopicWithMeta | undefined;
    if (lastTopic) {
      if (!lastTopic.project) {
        lastTopic.project = input.goal
          ? `Build and polish a capstone that directly serves ${input.goal}.`
          : `Build and polish a portfolio-ready capstone using ${lastTopic.title}.`;
      }
      lastTopic.goalAligned = true;
      lastTopic.goalRelevanceScore = clamp(
        Math.max(Number(lastTopic.goalRelevanceScore ?? 0), input.goal ? 90 : 40),
        0,
        100,
      );
      lastTopic.importanceScore = clamp(
        Math.max(Number(lastTopic.importanceScore ?? 0), 88),
        1,
        100,
      );
      lastTopic.importance_score = lastTopic.importanceScore;
    }
  }

  return phases;
}

const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function orderTopicsLogically(topics: TopicWithMeta[]): TopicWithMeta[] {
  // Stable sort: foundational/high-priority topics surface first inside a phase
  // while preserving the LLM's original sequencing for ties.
  return topics
    .map((topic, index) => ({ topic, index }))
    .sort((left, right) => {
      const priorityDelta =
        PRIORITY_ORDER[left.topic.priority] - PRIORITY_ORDER[right.topic.priority];
      if (priorityDelta !== 0) return priorityDelta;
      return left.index - right.index;
    })
    .map(({ topic }) => topic);
}

function finalizePhases(phases: PhaseWithMeta[], hoursPerWeek: number): PhaseWithMeta[] {
  let weekCursor = 1;

  return phases.map((phase) => {
    const phaseDifficulty =
      (phase.difficulty as Difficulty | undefined) ?? "intermediate";
    const orderedTopics = orderTopicsLogically(phase.topics as TopicWithMeta[]).map(
      (topic) => {
        const tagged = topic;
        tagged.difficulty = phaseDifficultyToTopicTag(phaseDifficulty, topic.priority);
        return tagged;
      },
    );

    const phaseHours = orderedTopics.reduce(
      (sum, topic) => sum + topic.estimatedHours,
      0,
    );
    const phaseWeeks = Math.max(1, Math.ceil(phaseHours / Math.max(1, hoursPerWeek)));
    const weekStart = weekCursor;
    const weekEnd = weekStart + phaseWeeks - 1;
    weekCursor = weekEnd + 1;

    return {
      ...phase,
      topics: orderedTopics,
      estimatedHours: phaseHours,
      duration: formatWeeks(phaseWeeks),
      weekRange: weekStart === weekEnd ? `Week ${weekStart}` : `Week ${weekStart}-${weekEnd}`,
      completionPercentage:
        orderedTopics.length === 0
          ? 0
          : Math.round(
              (orderedTopics.filter((topic) => topic.completed).length /
                orderedTopics.length) *
                100,
            ),
    } as PhaseWithMeta;
  });
}

const MAX_TOPICS_PER_WEEK = 3;

function buildWeeklyPlan(phases: PhaseWithMeta[], hoursPerWeek: number): WeeklyPlanItem[] {
  const weeklyPlan: WeeklyPlanItem[] = [];
  const weeklyBudget = Math.max(1, hoursPerWeek);
  let globalWeek = 1;

  for (const phase of phases) {
    const topics = phase.topics;
    const phaseHours =
      phase.estimatedHours ??
      topics.reduce((sum, topic) => sum + topic.estimatedHours, 0);

    // Number of weeks must be large enough to honor BOTH the hour budget
    // AND the "max 3 topics per week" cap so no week gets overloaded.
    const weeksByHours = Math.ceil(phaseHours / weeklyBudget);
    const weeksByTopics = Math.ceil(topics.length / MAX_TOPICS_PER_WEEK);
    const phaseWeeks = Math.max(1, weeksByHours, weeksByTopics);

    const idealLoad = Math.max(1, Math.round(phaseHours / phaseWeeks));
    const bins = Array.from({ length: phaseWeeks }, () => ({
      topics: [] as string[],
      hours: 0,
    }));

    let binIndex = 0;
    for (let topicIndex = 0; topicIndex < topics.length; topicIndex += 1) {
      const topic = topics[topicIndex];
      const remainingTopics = topics.length - topicIndex;
      const remainingBins = phaseWeeks - binIndex;

      // Advance to next week if: this week is full on topics, OR the hour
      // budget would overflow, OR we need to spread topics across remaining bins.
      const topicCountFull = bins[binIndex].topics.length >= MAX_TOPICS_PER_WEEK;
      const hoursOverflow =
        bins[binIndex].topics.length > 0 &&
        bins[binIndex].hours + topic.estimatedHours > idealLoad * 1.2;
      const mustSpread =
        bins[binIndex].topics.length > 0 && remainingTopics <= remainingBins;

      if (binIndex < phaseWeeks - 1 && (topicCountFull || hoursOverflow || mustSpread)) {
        binIndex += 1;
      }

      bins[binIndex].topics.push(topic.title);
      bins[binIndex].hours += topic.estimatedHours;
    }

    for (const bin of bins) {
      weeklyPlan.push({
        week: globalWeek,
        phaseTitle: phase.title,
        focus: phase.milestone || phase.title,
        topics:
          bin.topics.length > 0
            ? bin.topics
            : ["Practice, review, and milestone consolidation"],
        estimatedHours: bin.hours > 0 ? bin.hours : idealLoad,
      });
      globalWeek += 1;
    }
  }

  return weeklyPlan;
}

function computePhaseImportanceScore(phase: PhaseWithMeta): number {
  const topics = phase.topics as TopicWithMeta[];
  const highPriorityTopics = topics.filter((topic) => topic.priority === "high").length;
  const goalAlignedTopics = topics.filter((topic) => Boolean(topic.goalAligned)).length;
  const averageImportance =
    topics.length === 0
      ? 0
      : topics.reduce((sum, topic) => sum + Number(topic.importanceScore ?? 0), 0) /
        topics.length;

  return clamp(
    Math.round(highPriorityTopics * 22 + goalAlignedTopics * 16 + averageImportance * 0.35),
    1,
    100,
  );
}

function computePhaseDifficultyScore(phase: PhaseWithMeta): number {
  const difficulty = (phase.difficulty as Difficulty | undefined) ?? "intermediate";
  const hours = phase.estimatedHours ?? 0;
  return clamp(
    Math.round(DIFFICULTY_ORDER[difficulty] * 28 + hours * 1.4 + computePhaseImportanceScore(phase) * 0.18),
    1,
    100,
  );
}

function enrichPhaseHighlights(phases: PhaseWithMeta[]): {
  phases: PhaseWithMeta[];
  mostImportantPhase: PhaseWithMeta;
  mostDifficultPhase: PhaseWithMeta;
} {
  const scored = phases.map((phase) => {
    const enriched = { ...phase } as PhaseWithMeta;
    enriched.phaseImportanceScore = computePhaseImportanceScore(phase);
    enriched.phase_importance_score = enriched.phaseImportanceScore;
    enriched.goalRelevanceScore = clamp(
      Math.round(
        (phase.topics as TopicWithMeta[]).reduce(
          (sum, topic) => sum + Number(topic.goalRelevanceScore ?? 0),
          0,
        ) / Math.max(1, phase.topics.length),
      ),
      0,
      100,
    );
    enriched.phaseDifficultyScore = computePhaseDifficultyScore(phase);
    enriched.phase_difficulty = enriched.difficulty;
    return enriched;
  });

  const mostImportantPhase = scored.reduce((best, phase) =>
    Number(phase.phaseImportanceScore ?? 0) > Number(best.phaseImportanceScore ?? 0)
      ? phase
      : best,
  );
  const mostDifficultPhase = scored.reduce((best, phase) =>
    Number(phase.phaseDifficultyScore ?? 0) > Number(best.phaseDifficultyScore ?? 0)
      ? phase
      : best,
  );

  const enrichedPhases = scored.map((phase) => {
    phase.isMostImportantPhase = phase.id === mostImportantPhase.id;
    phase.isMostDifficultPhase = phase.id === mostDifficultPhase.id;
    phase.isImportant = phase.id === mostImportantPhase.id;
    phase.isDifficult = phase.id === mostDifficultPhase.id;
    phase.importanceScore = Number(phase.phaseImportanceScore ?? 0);
    phase.phaseHighlight = phase.id === mostImportantPhase.id
      ? "most-important"
      : phase.id === mostDifficultPhase.id
        ? "most-difficult"
        : undefined;
    phase.phase_completion_percentage = phase.completionPercentage ?? 0;
    return phase;
  });

  return { phases: enrichedPhases, mostImportantPhase, mostDifficultPhase };
}

function deriveLearningStrategy(
  input: RoadmapInput,
  raw: RawLlmRoadmap,
): "Fast Track" | "Balanced Path" | "Deep Mastery" {
  const value = (raw.learning_strategy ?? "").toLowerCase();
  if (value.includes("fast")) return "Fast Track";
  if (value.includes("deep") || value.includes("master")) return "Deep Mastery";
  if (value.includes("balance")) return "Balanced Path";

  if (input.hoursPerWeek >= 20 && (input.level === "job-ready" || input.level === "expert")) {
    return "Fast Track";
  }
  if (input.hoursPerWeek <= 10 || input.level === "expert") return "Deep Mastery";
  return "Balanced Path";
}

function deriveSmartLabel(
  input: RoadmapInput,
  raw: RawLlmRoadmap,
  fallback: string,
): string {
  const value = (raw.smart_label ?? "").trim();
  if (value && value.length <= 40) return value;
  if (input.goal) return "Goal-Driven";
  if (input.level === "beginner") return "Beginner Friendly";
  if (input.hoursPerWeek >= 20) return "Intensive";
  return fallback;
}

function deriveWarnings(
  input: RoadmapInput,
  totalWeeks: number,
  raw: RawLlmRoadmap,
): string[] {
  const warnings = Array.isArray(raw.warnings)
    ? raw.warnings
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  if (
    input.hoursPerWeek >= 20 &&
    (input.level === "job-ready" || input.level === "expert")
  ) {
    warnings.push(
      "This is an intensive roadmap — consider slowing down if overwhelmed.",
    );
  }
  if (input.hoursPerWeek <= 5 && totalWeeks >= 16) {
    warnings.push("Focus on consistency over speed because the timeline is long at this pace.");
  }
  if ((input.level === "job-ready" || input.level === "expert") && input.hoursPerWeek < 8) {
    warnings.push("The target level is ambitious for this time budget, so keep scope tight and project-focused.");
  }

  const unique: string[] = [];
  for (const warning of warnings) {
    if (!unique.includes(warning)) unique.push(warning);
    if (unique.length >= 3) break;
  }
  return unique;
}

function createNextBestAction(
  phases: PhaseWithMeta[],
): NextBestActionData {
  const orderedTopics = phases.flatMap((phase) =>
    (phase.topics as TopicWithMeta[]).map((topic) => ({ phase, topic })),
  );

  const highPriorityCandidate = orderedTopics.find(
    ({ topic }) => !topic.completed && topic.priority === "high",
  );
  const sequentialCandidate = orderedTopics.find(({ topic }) => !topic.completed);
  const chosen = highPriorityCandidate ?? sequentialCandidate;

  if (!chosen) {
    return {
      title: "Review your capstone and reflect",
      reason: "You have completed the roadmap, so the best next move is to polish what you built and capture what you learned.",
      estimatedTime: "1 hour",
      phase: phases[phases.length - 1]?.title ?? "Roadmap complete",
    };
  }

  const importance = Number(chosen.topic.importanceScore ?? 0);
  const reason = highPriorityCandidate
    ? `This is the first incomplete high-priority topic and it unlocks more of ${chosen.phase.title}. Its impact score is ${importance}/100, so it deserves your next focused session.`
    : `This is the next unfinished topic in sequence, which keeps your momentum intact and prevents gaps before you move deeper into ${chosen.phase.title}.`;

  return {
    title: chosen.topic.title,
    reason,
    estimatedTime: chosen.topic.time || formatHours(chosen.topic.estimatedHours),
    phase: chosen.phase.title,
    topicId: chosen.topic.id,
  };
}

function createRecommendedFocus(
  phases: PhaseWithMeta[],
  input: RoadmapInput,
): RecommendedFocusData {
  const mostImportant = phases.reduce((best, phase) =>
    Number(phase.phaseImportanceScore ?? 0) > Number(best.phaseImportanceScore ?? 0)
      ? phase
      : best,
  );

  const highPriorityTopics = (mostImportant.topics as TopicWithMeta[]).filter(
    (topic) => topic.priority === "high",
  ).length;
  const goalAlignedTopics = (mostImportant.topics as TopicWithMeta[]).filter(
    (topic) => Boolean(topic.goalAligned),
  ).length;

  const reason = input.goal
    ? `${mostImportant.title} carries the strongest mix of high-priority work and direct goal relevance, with ${goalAlignedTopics} goal-linked topics pushing you toward ${input.goal}.`
    : `${mostImportant.title} holds the highest concentration of high-priority work, making it the phase with the biggest leverage right now.`;

  return {
    phase: mostImportant.title,
    reason: highPriorityTopics > 0 ? reason : `${reason} Use it as your anchor phase for the next stretch.`,
  };
}

function createCompletionInsight(phases: PhaseWithMeta[]): string {
  const currentPhaseIndex = phases.findIndex(
    (phase) =>
      (phase.topics as TopicWithMeta[]).some((topic) => !topic.completed),
  );

  if (currentPhaseIndex === -1) {
    return "Roadmap complete — use the capstone phase to polish, document, and showcase your work.";
  }

  const currentPhase = phases[currentPhaseIndex];
  const remainingTopics = (currentPhase.topics as TopicWithMeta[]).filter(
    (topic) => !topic.completed,
  ).length;
  const nextPhase = phases[currentPhaseIndex + 1];

  if (!nextPhase) {
    return remainingTopics <= 1
      ? "Finish the final topic to complete the roadmap."
      : `Complete ${remainingTopics} more topics to finish the roadmap.`;
  }

  return remainingTopics <= 1
    ? `Complete 1 more topic to unlock ${nextPhase.title}.`
    : `Complete ${remainingTopics} more topics to unlock ${nextPhase.title}.`;
}

function createMomentum(progressPercent: number): MomentumData {
  if (progressPercent < 15) {
    return {
      stage: "starting",
      message:
        "You're at the starting phase — consistency matters more than speed.",
      progressPercent,
    };
  }
  if (progressPercent < 70) {
    return {
      stage: "building",
      message:
        "You're building strong momentum — avoid skipping projects.",
      progressPercent,
    };
  }
  return {
    stage: "mastery",
    message:
      "You're close to mastery — focus on depth and real-world application.",
    progressPercent,
  };
}

function deriveInsights(
  input: RoadmapInput,
  totalHours: number,
  totalWeeks: number,
  learningStrategy: "Fast Track" | "Balanced Path" | "Deep Mastery",
  recommendedFocus: RecommendedFocusData,
  nextBestAction: NextBestActionData,
  mostDifficultPhase: PhaseWithMeta,
  mostImportantPhase: PhaseWithMeta,
  warnings: string[],
  raw: RawLlmRoadmap,
): string[] {
  // We intentionally do NOT blindly trust LLM insights — we only keep the
  // first one if it is specific enough (mentions the goal or a phase title).
  const rawInsights = Array.isArray(raw.insights)
    ? raw.insights
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const looksSpecific = (text: string) => {
    if (text.length < 40) return false;
    const lower = text.toLowerCase();
    if (input.goal && lower.includes(input.goal.toLowerCase())) return true;
    return lower.includes(mostImportantPhase.title.toLowerCase().slice(0, 12));
  };

  const insights: string[] = [];
  for (const candidate of rawInsights) {
    if (looksSpecific(candidate) && insights.length < 1) insights.push(candidate);
  }

  // 1. Goal-aware — direct phase/goal linkage.
  if (input.goal) {
    insights.push(
      `${mostImportantPhase.title} is critical for your goal of ${input.goal} — spend extra time here before moving on.`,
    );
  } else {
    insights.push(
      `${mostImportantPhase.title} is where this roadmap earns its weight — give it more hours than the other phases.`,
    );
  }

  // 2. Phase-aware next action.
  insights.push(
    `Start with "${nextBestAction.title}" — it unlocks the rest of ${nextBestAction.phase} and keeps your sequence clean.`,
  );

  // 3. Difficulty-aware warning.
  if (mostDifficultPhase && mostDifficultPhase.id !== mostImportantPhase.id) {
    insights.push(
      `${mostDifficultPhase.title} is the hardest stretch — slow down there, pair every concept with a small build, and do not skip the project.`,
    );
  } else {
    insights.push(
      `Pair every concept in ${mostDifficultPhase.title} with a tiny build — that's how hard material actually sticks.`,
    );
  }

  // 4. Strategy + budget framing.
  insights.push(
    `${learningStrategy}: ~${totalHours} hours across ${totalWeeks} weeks at ${input.hoursPerWeek}h/week — protect that calendar slot like a standing meeting.`,
  );

  // 5. Optional density warning.
  if (warnings.length > 0) {
    insights.push(
      `This plan is intensive — if any week feels crushing, slide low-priority topics forward instead of cramming.`,
    );
  }

  const unique: string[] = [];
  for (const insight of insights) {
    if (!unique.includes(insight)) unique.push(insight);
    if (unique.length >= 5) break;
  }
  return unique.slice(0, Math.max(3, unique.length));
}

function deriveStrategySummary(
  input: RoadmapInput,
  learningStrategy: "Fast Track" | "Balanced Path" | "Deep Mastery",
  phases: PhaseWithMeta[],
  recommendedFocus: RecommendedFocusData,
  raw: RawLlmRoadmap,
): string {
  const value = (raw.strategy ?? "").trim();
  if (value) return value;

  const finalPhase = phases[phases.length - 1]?.title ?? "your capstone";
  const goalClause = input.goal ? ` while steering toward ${input.goal}` : "";
  return `${learningStrategy} strategy: move through ${phases.length} phases${goalClause}, put extra weight on ${recommendedFocus.phase}, and finish by shipping work in ${finalPhase}.`;
}

function applyRoadmapMentorFields(
  roadmap: Roadmap & Record<string, unknown>,
  phases: PhaseWithMeta[],
  recommendedFocus: RecommendedFocusData,
  nextBestAction: NextBestActionData,
  weeklyPlan: WeeklyPlanItem[],
): Roadmap & Record<string, unknown> {
  const totalTopics = phases.reduce((sum, phase) => sum + phase.topics.length, 0);
  const completedTopics = phases.reduce(
    (sum, phase) => sum + phase.topics.filter((topic) => topic.completed).length,
    0,
  );
  const progressPercent = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);
  const momentum = createMomentum(progressPercent);
  const completionInsight = createCompletionInsight(phases);

  roadmap.phases = phases;
  roadmap.recommendedFocus = `${recommendedFocus.phase}: ${recommendedFocus.reason}`;
  roadmap.nextBestAction = `${nextBestAction.title}: ${nextBestAction.reason}`;
  roadmap.weeklyPlan = weeklyPlan;
  roadmap.progressPercent = progressPercent;
  roadmap.completedTopics = completedTopics;
  roadmap.totalTopics = totalTopics;
  roadmap.learningMomentum = momentum;
  roadmap.learning_momentum = momentum;
  roadmap.momentum = momentum;
  roadmap.completionInsight = completionInsight;
  roadmap.completion_insight = completionInsight;
  roadmap.recommendedFocusCard = recommendedFocus;
  roadmap.recommended_focus = recommendedFocus;
  roadmap.nextBestActionCard = nextBestAction;
  roadmap.next_best_action = nextBestAction;
  roadmap.weekly_plan = weeklyPlan;
  roadmap.phaseHighlights = {
    mostImportantPhase: phases.find((phase) => Boolean(phase.isMostImportantPhase))?.title,
    mostDifficultPhase: phases.find((phase) => Boolean(phase.isMostDifficultPhase))?.title,
  };
  roadmap.phase_highlights = roadmap.phaseHighlights;

  return roadmap;
}

export function postProcessRoadmap(
  raw: RawLlmRoadmap,
  input: RoadmapInput,
): Roadmap | null {
  try {
    if (!raw || !Array.isArray(raw.phases) || raw.phases.length === 0) return null;

    const goalSignals = extractGoalSignals(input.goal);
    const seen = new Set<string>();

    const initialPhases = raw.phases
      .map((phase, phaseIndex, items) =>
        buildPhase(phase, input, phaseIndex, items.length, goalSignals, seen),
      )
      .filter((phase): phase is PhaseWithMeta => phase !== null);

    if (initialPhases.length === 0) return null;

    const structuredPhases = ensureMinimumStructure(initialPhases);
    if (!structuredPhases) return null;

    let phases = alignDifficultyCurve(structuredPhases, input.level);
    phases = ensureGoalDominance(phases, input, goalSignals);
    phases = finalizePhases(phases, input.hoursPerWeek);

    const highlighted = enrichPhaseHighlights(phases);
    phases = highlighted.phases;

    const totalHours = phases.reduce((sum, phase) => sum + (phase.estimatedHours ?? 0), 0);
    const totalWeeks = Math.max(1, Math.ceil(totalHours / Math.max(1, input.hoursPerWeek)));
    const highPriorityCount = phases.reduce(
      (sum, phase) => sum + phase.topics.filter((topic) => topic.priority === "high").length,
      0,
    );

    const weeklyPlan = buildWeeklyPlan(phases, input.hoursPerWeek);
    const recommendedFocus = createRecommendedFocus(phases, input);
    const nextBestAction = createNextBestAction(phases);
    const learningStrategy = deriveLearningStrategy(input, raw);
    const ctx = buildContext(input.level, input.hoursPerWeek, input.goal);
    const smartLabel = deriveSmartLabel(input, raw, ctx.smartLabel);
    const warnings = deriveWarnings(input, totalWeeks, raw);
    const insights = deriveInsights(
      input,
      totalHours,
      totalWeeks,
      learningStrategy,
      recommendedFocus,
      nextBestAction,
      highlighted.mostDifficultPhase,
      highlighted.mostImportantPhase,
      warnings,
      raw,
    );
    const difficultyProgression = phases.map(
      (phase) => (phase.difficulty as Difficulty | undefined) ?? defaultDifficultyForLevel(input.level),
    ) as Difficulty[];

    const roadmap = {
      id: uid("roadmap"),
      domain: input.domain,
      track: input.track,
      level: input.level,
      hoursPerWeek: input.hoursPerWeek,
      totalHours,
      totalWeeks,
      generatedAt: Date.now(),
      source: "gemini",
      phases,
      goal: input.goal,
      strategy: deriveStrategySummary(
        input,
        learningStrategy,
        phases,
        recommendedFocus,
        raw,
      ),
      totalDuration: formatWeeks(totalWeeks),
      smartLabel,
      learningStrategy,
      insights,
      warnings,
      difficultyProgression,
      highPriorityCount,
      weeklyPlan,
      recommendedFocus: `${recommendedFocus.phase}: ${recommendedFocus.reason}`,
      nextBestAction: `${nextBestAction.title}: ${nextBestAction.reason}`,
    } as Roadmap & Record<string, unknown>;

    roadmap.total_duration = roadmap.totalDuration;
    roadmap.total_hours = roadmap.totalHours;
    roadmap.total_duration_weeks = roadmap.totalWeeks;
    roadmap.high_priority_count = highPriorityCount;
    roadmap.difficulty_progression = difficultyProgression;

    return applyRoadmapMentorFields(
      roadmap,
      phases,
      recommendedFocus,
      nextBestAction,
      weeklyPlan,
    );
  } catch (error) {
    console.error("[postProcessor] postProcessRoadmap failed:", error);
    return null;
  }
}
