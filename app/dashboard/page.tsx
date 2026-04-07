// Dashboard / Input form page.
// Clean, light SaaS UI inspired by Notion / Linear — usability first.

import { AppHeader } from "@/components/ui/AppHeader";
import { RoadmapForm } from "@/components/forms/RoadmapForm";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader variant="light" />
      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="mb-10">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Step 1 of 1 — design your roadmap
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Tell us what you want to learn.
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Five quick questions. The engine handles the rest.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <RoadmapForm />
        </div>
      </div>
    </main>
  );
}
