import type {
  Level,
  Phase,
  Priority,
  Roadmap,
  RoadmapInput,
  Topic,
  WeeklyPlanItem,
} from "./types";
import type { RawLlmPhase, RawLlmRoadmap, RawLlmTopic } from "./geminiClient";
import { buildContext } from "./contextBuilder";
import { getFallbackResources, isTrustedUrl } from "./resourceFallbacks";

type Difficulty = "beginner" | "intermediate" | "advanced";
type TopicWithMeta = Topic & Record<string, unknown>;
type PhaseWithMeta = Phase & Record<string, unknown>;

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

  const llmResources = Array.isArray(raw.resources)
    ? raw.resources
        .filter(
          (resource) =>
            resource &&
            typeof resource.title === "string" &&
            typeof resource.url === "string" &&
            resource.title.trim().length > 0 &&
            isTrustedUrl(resource.url.trim()),
        )
        .map((resource) => ({
          title: resource.title.trim(),
          url: resource.url.trim(),
        }))
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
  if (!title || !Array.isArray(raw.topics)) return null;

  const topics = raw.topics
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

function finalizePhases(phases: PhaseWithMeta[], hoursPerWeek: number): PhaseWithMeta[] {
  let weekCursor = 1;

  return phases.map((phase) => {
    const phaseHours = phase.topics.reduce((sum, topic) => sum + topic.estimatedHours, 0);
    const phaseWeeks = Math.max(1, Math.ceil(phaseHours / Math.max(1, hoursPerWeek)));
    const weekStart = weekCursor;
    const weekEnd = weekStart + phaseWeeks - 1;
    weekCursor = weekEnd + 1;

    return {
      ...phase,
      estimatedHours: phaseHours,
      duration: formatWeeks(phaseWeeks),
      weekRange: weekStart === weekEnd ? `Week ${weekStart}` : `Week ${weekStart}-${weekEnd}`,
      completionPercentage:
        phase.topics.length === 0
          ? 0
          : Math.round(
              (phase.topics.filter((topic) => topic.completed).length /
                phase.topics.length) *
                100,
            ),
    } as PhaseWithMeta;
  });
}

function buildWeeklyPlan(phases: PhaseWithMeta[], hoursPerWeek: number): WeeklyPlanItem[] {
  const weeklyPlan: WeeklyPlanItem[] = [];
  const weeklyBudget = Math.max(1, hoursPerWeek);
  let globalWeek = 1;

  for (const phase of phases) {
    const phaseHours = phase.estimatedHours ?? phase.topics.reduce((sum, topic) => sum + topic.estimatedHours, 0);
    const phaseWeeks = Math.max(1, Math.ceil(phaseHours / weeklyBudget));
    const idealLoad = Math.max(1, Math.round(phaseHours / phaseWeeks));
    const bins = Array.from({ length: phaseWeeks }, () => ({
      topics: [] as string[],
      hours: 0,
    }));

    let binIndex = 0;
    for (let topicIndex = 0; topicIndex < phase.topics.length; topicIndex += 1) {
      const topic = phase.topics[topicIndex];
      const remainingTopics = phase.topics.length - topicIndex;
      const remainingBins = phaseWeeks - binIndex;

      if (
        binIndex < phaseWeeks - 1 &&
        bins[binIndex].topics.length > 0 &&
        (bins[binIndex].hours + topic.estimatedHours > idealLoad * 1.2 ||
          remainingTopics <= remainingBins)
      ) {
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
  if (progressPercent < 10) {
    return {
      stage: "starting",
      message: "You're at the starting phase — consistency matters most.",
      progressPercent,
    };
  }
  if (progressPercent <= 50) {
    return {
      stage: "building",
      message: "You're building momentum — stay consistent.",
      progressPercent,
    };
  }
  return {
    stage: "mastery",
    message: "You're in the final stretch — focus on mastery.",
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
  warnings: string[],
  raw: RawLlmRoadmap,
): string[] {
  const insights = Array.isArray(raw.insights)
    ? raw.insights
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 2)
    : [];

  insights.push(
    `${recommendedFocus.phase} is your leverage phase, so protect extra attention for it early instead of spreading effort evenly.`,
  );
  insights.push(
    `${nextBestAction.title} is the right move now because it keeps the roadmap logically sequenced and cuts down future friction.`,
  );

  if (input.goal) {
    insights.push(
      `A large chunk of this roadmap is goal-linked, so keep every project artifact tied back to ${input.goal}.`,
    );
  }

  insights.push(
    `${learningStrategy} fits this plan because it asks for about ${totalHours} hours across ${totalWeeks} weeks, with the hardest stretch in ${mostDifficultPhase.title}.`,
  );

  if (warnings.length > 0) {
    insights.push(`Watch the roadmap density around ${mostDifficultPhase.title} so challenge does not turn into stall-out.`);
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
