// Graph Builder — converts a Roadmap (JSON) into React Flow nodes & edges.
//
// Layout strategy:
//   - Each phase is a horizontal "swimlane" stacked vertically
//   - Phase header node at the top of each lane
//   - Topic nodes laid out in a row beneath their phase header
//   - Edges connect phase → its topics, and chain phase headers vertically

import type { Edge, Node } from "reactflow";
import type { Roadmap } from "./types";

export interface BuiltGraph {
  nodes: Node[];
  edges: Edge[];
}

const PHASE_X = 80;
const PHASE_GAP_Y = 280;
const TOPIC_START_X = 380;
const TOPIC_GAP_X = 280;
const TOPIC_OFFSET_Y = 70;

export function buildGraph(roadmap: Roadmap): BuiltGraph {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  roadmap.phases.forEach((phase, phaseIdx) => {
    const phaseY = phaseIdx * PHASE_GAP_Y + 40;

    // Phase header node
    nodes.push({
      id: phase.id,
      type: "phaseNode",
      position: { x: PHASE_X, y: phaseY },
      data: {
        title: phase.title,
        duration: phase.duration,
        milestone: phase.milestone,
        description: phase.description,
        index: phaseIdx + 1,
        topicCount: phase.topics.length,
      },
    });

    // Topic nodes laid out horizontally
    phase.topics.forEach((topic, topicIdx) => {
      const x = TOPIC_START_X + topicIdx * TOPIC_GAP_X;
      const y = phaseY + TOPIC_OFFSET_Y;

      nodes.push({
        id: topic.id,
        type: "topicNode",
        position: { x, y },
        data: {
          ...topic,
          phaseId: phase.id,
          phaseTitle: phase.title,
        },
      });

      // Edge from the phase to its first topic, then chain topics
      if (topicIdx === 0) {
        edges.push({
          id: `${phase.id}->${topic.id}`,
          source: phase.id,
          target: topic.id,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#22d3ee", strokeWidth: 2 },
        });
      } else {
        const prev = phase.topics[topicIdx - 1];
        edges.push({
          id: `${prev.id}->${topic.id}`,
          source: prev.id,
          target: topic.id,
          type: "smoothstep",
          style: { stroke: "#475569", strokeWidth: 1.5 },
        });
      }
    });

    // Edge from this phase header to the next phase header
    if (phaseIdx < roadmap.phases.length - 1) {
      const nextPhase = roadmap.phases[phaseIdx + 1];
      edges.push({
        id: `${phase.id}->${nextPhase.id}`,
        source: phase.id,
        target: nextPhase.id,
        type: "smoothstep",
        style: { stroke: "#06b6d4", strokeWidth: 2, strokeDasharray: "6 4" },
      });
    }
  });

  return { nodes, edges };
}
