"use client";

import { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Node,
  type NodeMouseHandler,
} from "reactflow";
import type { Roadmap, Topic } from "@/lib/types";
import { buildGraph } from "@/lib/graphBuilder";
import { PhaseNode } from "./PhaseNode";
import { TopicNode } from "./TopicNode";
import { DetailPanel } from "./DetailPanel";

const NODE_TYPES = {
  phaseNode: PhaseNode,
  topicNode: TopicNode,
};

function findTopicById(roadmap: Roadmap, id: string): Topic | null {
  for (const phase of roadmap.phases) {
    const t = phase.topics.find((t) => t.id === id);
    if (t) return t;
  }
  return null;
}

export function RoadmapGraph({ roadmap }: { roadmap: Roadmap }) {
  const initial = useMemo(() => buildGraph(roadmap), [roadmap]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, , onEdgesChange] = useEdgesState(initial.edges);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Sync graph when roadmap changes (e.g. progress toggle, pace update).
  useEffect(() => {
    const next = buildGraph(roadmap);
    setNodes(next.nodes);
    // Edges are stable enough that we don't need to reset them every time,
    // but if the topic count changes we should.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmap]);

  const selectedTopic = selectedTopicId ? findTopicById(roadmap, selectedTopicId) : null;

  const handleNodeClick: NodeMouseHandler = (_e, node: Node) => {
    if (node.type === "topicNode") {
      setSelectedTopicId(node.id);
    } else {
      setSelectedTopicId(null);
    }
  };

  return (
    <ReactFlowProvider>
      <div className="relative h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onPaneClick={() => setSelectedTopicId(null)}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.25}
          maxZoom={1.5}
          proOptions={{ hideAttribution: false }}
          defaultEdgeOptions={{ type: "smoothstep" }}
        >
          <Background gap={20} size={1} color="#e2e8f0" />
          <Controls position="bottom-right" />
          <MiniMap
            position="bottom-left"
            pannable
            zoomable
            nodeColor={(n) => (n.type === "phaseNode" ? "#06b6d4" : "#cbd5e1")}
            nodeStrokeWidth={2}
            maskColor="rgba(241, 245, 249, 0.7)"
          />
        </ReactFlow>

        <DetailPanel topic={selectedTopic} onClose={() => setSelectedTopicId(null)} />
      </div>
    </ReactFlowProvider>
  );
}
