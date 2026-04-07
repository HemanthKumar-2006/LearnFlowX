# LearnFlow

> Turn **"I want to learn X"** into a structured, visual, adaptive learning journey.

LearnFlow is a production-grade Next.js app that generates **personalized, time-optimized learning roadmaps** and renders them as an **interactive graph** you can actually follow. Built for the hackathon,designed to ship.

---

## ✨ What it does

1. You answer 5 questions: **domain · track · hours/week · level · optional goal**
2. A **deterministic engine** picks a structured base roadmap and scales it to fit your time and target level
3. **Claude** refines descriptions, projects, and resources for *your* level (optional — falls back gracefully if no API key)
4. The roadmap is rendered as an **interactive React Flow graph**
5. You **check off topics**, **adjust your pace** (everything recomputes), and **export to PDF** when you're done

---

## 🧠 Architecture — the hybrid AI pipeline

```
   User Input
       │
       ▼
┌─────────────────────────┐
│  1. Template Selector   │  ← lib/templates.ts
└─────────────────────────┘
       │
       ▼
┌─────────────────────────┐
│  2. Constraint Engine   │  ← lib/roadmapEngine.ts
│  scales depth + duration│     (level + hours/week)
└─────────────────────────┘
       │
       ▼
┌─────────────────────────┐
│  3. Claude Refinement   │  ← lib/claudeClient.ts
│  (optional)             │     refines content only;
└─────────────────────────┘     engine remains source of truth
       │
       ▼
┌─────────────────────────┐
│  4. Graph Builder       │  ← lib/graphBuilder.ts
│  JSON → nodes + edges   │
└─────────────────────────┘
       │
       ▼
┌─────────────────────────┐
│  5. React Flow UI       │  ← components/graph/*
│  + Zustand state        │  ← store/useRoadmapStore.ts
│  + LocalStorage persist │
└─────────────────────────┘
```

The split is deliberate: the **engine is fully deterministic**, so the app works *with or without* an API key. Claude's job is bounded — it refines content but cannot change structure, durations, or IDs.

---

## 🧱 Tech stack

| Layer        | Choice |
|--------------|--------|
| Framework    | Next.js 14 (App Router) + TypeScript |
| Styling      | Tailwind CSS |
| Animation    | Framer Motion |
| Graph        | React Flow |
| State        | Zustand + localStorage |
| AI           | Claude API (`@anthropic-ai/sdk`) |
| PDF export   | html2canvas + jsPDF |

---

## 🚀 Getting started

```bash
# 1. Install
npm install

# 2. (Optional) Add your Claude API key for AI personalization
cp .env.local.example .env.local
# then edit .env.local

# 3. Run
npm run dev
```

Open <http://localhost:3000>.

> **No API key?** No problem. The deterministic engine produces a complete, usable roadmap on its own. The "AI personalized" badge in the sidebar tells you when Claude was actually used.

---

## 📁 Project structure

```
app/
├── page.tsx                       # Futuristic landing page
├── dashboard/page.tsx             # Smart input form
├── roadmap/page.tsx               # Interactive graph view
├── api/generate-roadmap/route.ts  # The pipeline endpoint
├── layout.tsx
└── globals.css

components/
├── landing/      Hero · Features · HowItWorks · Nav · Footer · ParticlesBg
├── forms/        RoadmapForm
├── graph/        RoadmapGraph · PhaseNode · TopicNode · DetailPanel · Sidebar
└── ui/           AppHeader · Spinner

lib/
├── types.ts          Shared types
├── templates.ts      Predefined structured roadmaps + multipliers
├── roadmapEngine.ts  Deterministic pipeline + AI patch merger
├── graphBuilder.ts   JSON → React Flow nodes/edges
├── claudeClient.ts   Anthropic SDK wrapper
├── pdfExport.ts      html2canvas + jsPDF
└── utils.ts          cn() helper

store/
└── useRoadmapStore.ts  Zustand store w/ localStorage persistence
```

---

## 🎨 Design philosophy

- **Landing page → futuristic.** Dark, neon, glassmorphism, animated particle graph. The job is to hook judges in 3 seconds.
- **App interface → calm.** Light, Notion/Linear-inspired SaaS. Nothing should fight the user when they're trying to focus.

Two visual modes, one app, deliberate contrast..

---

## 🏆 Hackathon-winning features

- ✅ Hybrid AI architecture (deterministic + AI) — **works without API**
- ✅ Time-optimized: hours/week is a real input that drives real output
- ✅ Visual graph with phase swimlanes and animated edges
- ✅ Click any topic for a rich detail panel (description, project, resources)
- ✅ Per-topic progress tracking, persisted in localStorage
- ✅ Live pace adjustment — change your hours, watch durations recompute
- ✅ PDF export of your roadmap
- ✅ "High Priority" tags on every topic
- ✅ Project-based milestones at the end of every phase
