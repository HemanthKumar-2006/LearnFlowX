"use client";

// Client wrapper for the /roadmap page.
// We split this out so the page itself can stay a server component.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRoadmapStore } from "@/store/useRoadmapStore";
import { exportRoadmapToPdf } from "@/lib/pdfExport";
import { RoadmapGraph } from "./RoadmapGraph";
import { RoadmapSidebar } from "./RoadmapSidebar";
import { EmptyState } from "./EmptyState";

export function RoadmapClient() {
  const roadmap = useRoadmapStore((s) => s.roadmap);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const captureRef = useRef<HTMLDivElement | null>(null);

  // Wait for Zustand to rehydrate from localStorage so we don't flicker the empty state.
  useEffect(() => {
    setHydrated(true);
  }, []);

  async function handleExport() {
    if (!roadmap || !captureRef.current) return;
    setIsExporting(true);
    try {
      await exportRoadmapToPdf(captureRef.current, roadmap);
    } finally {
      setIsExporting(false);
    }
  }

  if (!hydrated) {
    return <SkeletonLoader />;
  }

  if (!roadmap) {
    return <EmptyState onCta={() => router.push("/dashboard")} />;
  }

  return (
    <div className="flex h-full overflow-hidden bg-slate-50">
      <RoadmapSidebar
        roadmap={roadmap}
        onExport={handleExport}
        isExporting={isExporting}
      />
      <div ref={captureRef} className="relative flex-1 overflow-hidden">
        <RoadmapGraph roadmap={roadmap} />
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="flex h-full">
      <div className="w-80 shrink-0 space-y-4 border-r border-slate-200 bg-white p-5">
        <div className="skeleton h-6 w-32 rounded" />
        <div className="skeleton h-10 w-full rounded" />
        <div className="grid grid-cols-2 gap-2">
          <div className="skeleton h-16 rounded-xl" />
          <div className="skeleton h-16 rounded-xl" />
          <div className="skeleton h-16 rounded-xl" />
          <div className="skeleton h-16 rounded-xl" />
        </div>
        <div className="skeleton h-20 rounded-xl" />
        <div className="skeleton h-20 rounded-xl" />
      </div>
      <div className="flex-1 bg-slate-100" />
    </div>
  );
}
