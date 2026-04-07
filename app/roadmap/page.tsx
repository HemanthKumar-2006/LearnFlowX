// Roadmap visualization page — sidebar + interactive React Flow graph.
// The actual interactive bits live in RoadmapClient (client component).

import { AppHeader } from "@/components/ui/AppHeader";
import { RoadmapClient } from "@/components/graph/RoadmapClient";

export default function RoadmapPage() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      <AppHeader variant="light" />
      <div className="flex-1 overflow-hidden">
        <RoadmapClient />
      </div>
    </main>
  );
}
