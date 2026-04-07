// Shared types for the entire LearnFlow app.
// Keep these stable — both the engine and the UI depend on them.

export type Level = "beginner" | "intermediate" | "job-ready" | "expert";

export type Priority = "high" | "medium" | "low";

export interface RoadmapInput {
  domain: string;
  track: string;
  hoursPerWeek: number;
  level: Level;
  goal?: string;
}

export interface Topic {
  id: string;
  title: string;
  time: string; // human readable, e.g. "2 days"
  estimatedHours: number;
  priority: Priority;
  description: string;
  resources: { title: string; url: string }[];
  project?: string;
  completed?: boolean;
}

export interface Phase {
  id: string;
  title: string;
  duration: string;
  milestone: string;
  description: string;
  topics: Topic[];
  difficulty?: Level | "beginner" | "intermediate" | "advanced";
  weekRange?: string; // e.g. "Week 1-3"
  estimatedHours?: number;
  completionPercentage?: number;
}

export interface WeeklyPlanItem {
  week: number;
  phaseTitle: string;
  focus: string;
  topics: string[];
  estimatedHours: number;
}

export interface Roadmap {
  id: string;
  domain: string;
  track: string;
  level: Level;
  hoursPerWeek: number;
  totalWeeks: number;
  totalHours: number;
  generatedAt: number;
  source: "template" | "ai" | "hybrid" | "gemini";
  phases: Phase[];
  goal?: string;
  strategy?: string;
  totalDuration?: string;
  smartLabel?: string; // e.g. "Fast Track", "Deep Learning Path"

  // Intelligence layer (new)
  learningStrategy?: "Fast Track" | "Balanced Path" | "Deep Mastery";
  insights?: string[];
  warnings?: string[];
  difficultyProgression?: Array<"beginner" | "intermediate" | "advanced">;
  highPriorityCount?: number;
  weeklyPlan?: WeeklyPlanItem[];
  recommendedFocus?: string;
  nextBestAction?: string;
}

export interface GenerateRoadmapResponse {
  roadmap: Roadmap;
  source: Roadmap["source"];
}
