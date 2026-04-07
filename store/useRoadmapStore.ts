"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Phase, Roadmap, RoadmapInput, Topic } from "@/lib/types";

interface RoadmapState {
  roadmap: Roadmap | null;
  lastInput: RoadmapInput | null;
  isGenerating: boolean;
  isRecomputing: boolean;
  error: string | null;

  setRoadmap: (roadmap: Roadmap) => void;
  setLastInput: (input: RoadmapInput) => void;
  setGenerating: (value: boolean) => void;
  setError: (value: string | null) => void;

  toggleTopic: (topicId: string) => void;
  recomputeWithPace: (hoursPerWeek: number) => Promise<void>;
  regenerate: () => Promise<void>;
  reset: () => void;
}

let recomputeAbortController: AbortController | null = null;
let recomputeRequestId = 0;

type MentorRoadmap = Roadmap & Record<string, unknown>;
type MentorPhase = Phase & Record<string, unknown>;
type MentorTopic = Topic & Record<string, unknown>;

function normalizeTopicKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function formatTopicTime(topic: Topic): string {
  return topic.time || `${topic.estimatedHours} hours`;
}

function enrichRoadmapMentorState(roadmap: Roadmap): Roadmap {
  const mentorRoadmap = { ...roadmap } as MentorRoadmap;
  const phases = mentorRoadmap.phases.map((phase) => {
    const completionPercentage =
      phase.topics.length === 0
        ? 0
        : Math.round(
            (phase.topics.filter((topic) => topic.completed).length / phase.topics.length) *
              100,
          );

    const mentorPhase = {
      ...phase,
      completionPercentage,
    } as MentorPhase;
    mentorPhase.phase_completion_percentage = completionPercentage;
    return mentorPhase;
  });

  mentorRoadmap.phases = phases;

  const progress = deriveProgress(mentorRoadmap);
  const orderedTopics = phases.flatMap((phase) =>
    phase.topics.map((topic) => ({ phase, topic: topic as MentorTopic })),
  );
  const highPriorityCandidate = orderedTopics.find(
    ({ topic }) => !topic.completed && topic.priority === "high",
  );
  const nextCandidate = orderedTopics.find(({ topic }) => !topic.completed);
  const chosen = highPriorityCandidate ?? nextCandidate;

  const nextBestAction = chosen
    ? {
        title: chosen.topic.title,
        reason: highPriorityCandidate
          ? `This is the first incomplete high-priority topic and it unlocks more of ${chosen.phase.title}.`
          : `This is the next unfinished topic in sequence, so it keeps your progress smooth inside ${chosen.phase.title}.`,
        estimatedTime: formatTopicTime(chosen.topic),
        phase: chosen.phase.title,
        topicId: chosen.topic.id,
      }
    : {
        title: "Review your capstone and reflect",
        reason: "You have completed the roadmap, so the next step is to polish, document, and showcase what you built.",
        estimatedTime: "1 hour",
        phase: phases[phases.length - 1]?.title ?? "Roadmap complete",
      };

  const mostImportantPhase =
    phases.find((phase) => Boolean(phase.isMostImportantPhase)) ??
    phases.reduce((best, phase) => {
      const bestScore = Number((best as MentorPhase).phaseImportanceScore ?? 0);
      const phaseScore = Number((phase as MentorPhase).phaseImportanceScore ?? 0);
      return phaseScore > bestScore ? phase : best;
    }, phases[0]);

  const recommendedFocus = {
    phase: mostImportantPhase?.title ?? "Current roadmap",
    reason:
      typeof (mostImportantPhase as MentorPhase | undefined)?.phaseImportanceScore === "number"
        ? `${mostImportantPhase.title} carries the strongest concentration of high-impact work right now.`
        : "This phase has the strongest leverage for your next stretch of progress.",
  };

  const currentPhaseIndex = phases.findIndex((phase) =>
    phase.topics.some((topic) => !topic.completed),
  );
  let completionInsight = "Roadmap complete — use the capstone phase to polish, document, and showcase your work.";
  if (currentPhaseIndex !== -1) {
    const currentPhase = phases[currentPhaseIndex];
    const remainingTopics = currentPhase.topics.filter((topic) => !topic.completed).length;
    const nextPhase = phases[currentPhaseIndex + 1];
    completionInsight = nextPhase
      ? `Complete ${remainingTopics} more ${remainingTopics === 1 ? "topic" : "topics"} to unlock ${nextPhase.title}.`
      : `Complete ${remainingTopics} more ${remainingTopics === 1 ? "topic" : "topics"} to finish the roadmap.`;
  }

  const learningMomentum =
    progress.percent < 10
      ? {
          stage: "starting",
          message: "You're at the starting phase — consistency matters most.",
          progressPercent: progress.percent,
        }
      : progress.percent <= 50
        ? {
            stage: "building",
            message: "You're building momentum — stay consistent.",
            progressPercent: progress.percent,
          }
        : {
            stage: "mastery",
            message: "You're in the final stretch — focus on mastery.",
            progressPercent: progress.percent,
          };

  mentorRoadmap.nextBestAction = `${nextBestAction.title}: ${nextBestAction.reason}`;
  mentorRoadmap.nextBestActionCard = nextBestAction;
  mentorRoadmap.next_best_action = nextBestAction;
  mentorRoadmap.recommendedFocus = `${recommendedFocus.phase}: ${recommendedFocus.reason}`;
  mentorRoadmap.recommendedFocusCard = recommendedFocus;
  mentorRoadmap.recommended_focus = recommendedFocus;
  mentorRoadmap.completionInsight = completionInsight;
  mentorRoadmap.completion_insight = completionInsight;
  mentorRoadmap.learningMomentum = learningMomentum;
  mentorRoadmap.learning_momentum = learningMomentum;
  mentorRoadmap.progressPercent = progress.percent;
  mentorRoadmap.completedTopics = progress.completed;
  mentorRoadmap.totalTopics = progress.total;

  return mentorRoadmap;
}

function mergeTopicCompletion(previous: Roadmap | null, next: Roadmap): Roadmap {
  if (!previous) return enrichRoadmapMentorState(next);

  const completedTopics = new Set(
    previous.phases
      .flatMap((phase) => phase.topics)
      .filter((topic) => topic.completed)
      .map((topic) => normalizeTopicKey(topic.title)),
  );

  const phases = next.phases.map((phase) => {
    const topics = phase.topics.map((topic) => ({
      ...topic,
      completed: completedTopics.has(normalizeTopicKey(topic.title)),
    }));
    const completionPercentage =
      topics.length === 0
        ? 0
        : Math.round(
            (topics.filter((topic) => topic.completed).length / topics.length) * 100,
          );

    const enrichedPhase = {
      ...phase,
      topics,
      completionPercentage,
    } as typeof phase & Record<string, unknown>;

    enrichedPhase.phase_completion_percentage = completionPercentage;
    return enrichedPhase;
  });

  return enrichRoadmapMentorState({ ...next, phases });
}

function isRoadmapResponse(value: unknown): value is { roadmap: Roadmap } {
  if (!value || typeof value !== "object") return false;
  const maybeRoadmap = (value as { roadmap?: unknown }).roadmap;
  if (!maybeRoadmap || typeof maybeRoadmap !== "object") return false;

  const roadmap = maybeRoadmap as Partial<Roadmap>;
  return (
    typeof roadmap.domain === "string" &&
    typeof roadmap.track === "string" &&
    typeof roadmap.hoursPerWeek === "number" &&
    Array.isArray(roadmap.phases)
  );
}

export function deriveProgress(roadmap: Roadmap | null) {
  if (!roadmap) return { completed: 0, total: 0, percent: 0 };

  let completed = 0;
  let total = 0;

  for (const phase of roadmap.phases) {
    for (const topic of phase.topics) {
      total += 1;
      if (topic.completed) completed += 1;
    }
  }

  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

export const useRoadmapStore = create<RoadmapState>()(
  persist(
    (set, get) => ({
      roadmap: null,
      lastInput: null,
      isGenerating: false,
      isRecomputing: false,
      error: null,

      setRoadmap: (roadmap) =>
        set({
          roadmap: enrichRoadmapMentorState(roadmap),
          error: null,
          isGenerating: false,
          isRecomputing: false,
        }),

      setLastInput: (lastInput) => set({ lastInput }),
      setGenerating: (isGenerating) => set({ isGenerating }),
      setError: (error) => set({ error }),

      toggleTopic: (topicId) => {
        const roadmap = get().roadmap;
        if (!roadmap) return;

        const phases = roadmap.phases.map((phase) => {
          const topics = phase.topics.map((topic) =>
            topic.id === topicId
              ? { ...topic, completed: !topic.completed }
              : topic,
          );
          const completionPercentage =
            topics.length === 0
              ? 0
              : Math.round(
                  (topics.filter((topic) => topic.completed).length / topics.length) *
                    100,
                );

          const enrichedPhase = {
            ...phase,
            topics,
            completionPercentage,
          } as typeof phase & Record<string, unknown>;

          enrichedPhase.phase_completion_percentage = completionPercentage;
          return enrichedPhase;
        });

        set({ roadmap: enrichRoadmapMentorState({ ...roadmap, phases }) });
      },

      recomputeWithPace: async (hoursPerWeek) => {
        const input = get().lastInput;
        if (!input) return;

        const nextInput: RoadmapInput = { ...input, hoursPerWeek };
        const requestId = ++recomputeRequestId;

        recomputeAbortController?.abort();
        const controller = new AbortController();
        recomputeAbortController = controller;

        set({ isRecomputing: true, error: null });

        try {
          const response = await fetch("/api/generate-roadmap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify(nextInput),
            signal: controller.signal,
          });

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(
              typeof data.error === "string"
                ? data.error
                : `Request failed with ${response.status}`,
            );
          }

          const data = await response.json();
          if (!isRoadmapResponse(data)) {
            throw new Error("Roadmap response was malformed");
          }

          if (requestId !== recomputeRequestId) return;

          const roadmap = mergeTopicCompletion(get().roadmap, data.roadmap);
          set({
            roadmap,
            lastInput: nextInput,
            error: null,
          });
        } catch (error) {
          if (controller.signal.aborted) return;
          if (requestId !== recomputeRequestId) return;

          const message =
            error instanceof Error
              ? error.message
              : "Failed to recompute roadmap";

          set({ error: message });
        } finally {
          if (requestId === recomputeRequestId) {
            if (recomputeAbortController === controller) {
              recomputeAbortController = null;
            }
            set({ isRecomputing: false });
          }
        }
      },

      regenerate: async () => {
        const input = get().lastInput;
        if (!input) return;
        await get().recomputeWithPace(input.hoursPerWeek);
      },

      reset: () =>
        set({
          roadmap: null,
          lastInput: null,
          error: null,
          isGenerating: false,
          isRecomputing: false,
        }),
    }),
    {
      name: "learnflow-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        roadmap: state.roadmap,
        lastInput: state.lastInput,
      }),
    },
  ),
);
