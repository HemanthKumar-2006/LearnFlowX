// Predefined structured base roadmaps used by the Template Selector.
// Each template defines phases and topics with *base* hour estimates that
// the constraint engine then scales according to the user's level + time.

import type { Level, Priority } from "./types";

export interface TemplateTopic {
  title: string;
  baseHours: number;
  priority: Priority;
  description: string;
  resources: { title: string; url: string }[];
  project?: string;
}

export interface TemplatePhase {
  title: string;
  milestone: string;
  description: string;
  topics: TemplateTopic[];
}

export interface RoadmapTemplate {
  domain: string;
  track: string;
  phases: TemplatePhase[];
}

// ---------------------------------------------------------------------------
// Web Development → Frontend
// ---------------------------------------------------------------------------
const webFrontend: RoadmapTemplate = {
  domain: "Web Development",
  track: "Frontend",
  phases: [
    {
      title: "Phase 1: Foundations",
      milestone: "Build a static personal website",
      description:
        "Master the building blocks of the web: how browsers render content, how to structure pages, and how to style them.",
      topics: [
        {
          title: "How the Web Works",
          baseHours: 4,
          priority: "high",
          description:
            "Understand HTTP, DNS, browsers, the request/response cycle, and how websites are served.",
          resources: [
            { title: "MDN: How the Web Works", url: "https://developer.mozilla.org/docs/Learn/Common_questions/Web_mechanics/How_the_Web_works" },
          ],
        },
        {
          title: "HTML Essentials",
          baseHours: 8,
          priority: "high",
          description:
            "Semantic markup, forms, accessibility basics, and document structure.",
          resources: [
            { title: "MDN HTML", url: "https://developer.mozilla.org/docs/Web/HTML" },
          ],
          project: "Recreate a simple blog post layout",
        },
        {
          title: "CSS Fundamentals",
          baseHours: 12,
          priority: "high",
          description:
            "The box model, selectors, specificity, flexbox, and grid.",
          resources: [
            { title: "CSS Tricks Flexbox Guide", url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/" },
          ],
          project: "Build a responsive landing page from a Figma mock",
        },
        {
          title: "Modern Layout: Flexbox & Grid",
          baseHours: 8,
          priority: "medium",
          description:
            "Compose complex layouts that adapt to any viewport.",
          resources: [
            { title: "Grid by Example", url: "https://gridbyexample.com/" },
          ],
        },
      ],
    },
    {
      title: "Phase 2: JavaScript Mastery",
      milestone: "Build a dynamic, interactive web app with vanilla JS",
      description:
        "Become fluent in modern JavaScript before touching frameworks.",
      topics: [
        {
          title: "JavaScript Syntax & Types",
          baseHours: 10,
          priority: "high",
          description: "Variables, types, control flow, functions, scope.",
          resources: [
            { title: "Eloquent JavaScript", url: "https://eloquentjavascript.net/" },
          ],
        },
        {
          title: "DOM & Events",
          baseHours: 8,
          priority: "high",
          description:
            "Manipulate the DOM, handle events, and build interactivity without a framework.",
          resources: [
            { title: "MDN DOM", url: "https://developer.mozilla.org/docs/Web/API/Document_Object_Model" },
          ],
          project: "Build a To-Do app in vanilla JS",
        },
        {
          title: "Async JavaScript",
          baseHours: 8,
          priority: "high",
          description: "Promises, async/await, fetch, and error handling.",
          resources: [
            { title: "JavaScript.info Async", url: "https://javascript.info/async" },
          ],
          project: "Build a weather dashboard using a public API",
        },
        {
          title: "ES Modules & Tooling",
          baseHours: 6,
          priority: "medium",
          description:
            "Imports/exports, bundlers (Vite), package managers (npm).",
          resources: [
            { title: "Vite Guide", url: "https://vitejs.dev/guide/" },
          ],
        },
      ],
    },
    {
      title: "Phase 3: React & Component Thinking",
      milestone: "Ship a multi-page React app with routing and state",
      description:
        "Learn the most popular UI library and how to think in components.",
      topics: [
        {
          title: "React Fundamentals",
          baseHours: 12,
          priority: "high",
          description: "Components, JSX, props, state, and effects.",
          resources: [
            { title: "React Docs", url: "https://react.dev/learn" },
          ],
          project: "Rebuild your To-Do app in React",
        },
        {
          title: "Hooks & Patterns",
          baseHours: 8,
          priority: "high",
          description: "useState, useEffect, useMemo, custom hooks, lifting state up.",
          resources: [
            { title: "useHooks", url: "https://usehooks.com/" },
          ],
        },
        {
          title: "Routing & Data Fetching",
          baseHours: 8,
          priority: "high",
          description: "React Router or Next.js, loaders, and SWR/React Query basics.",
          resources: [
            { title: "Next.js Docs", url: "https://nextjs.org/docs" },
          ],
        },
        {
          title: "Forms & Validation",
          baseHours: 6,
          priority: "medium",
          description: "Controlled inputs, react-hook-form, schema validation with Zod.",
          resources: [
            { title: "React Hook Form", url: "https://react-hook-form.com/" },
          ],
        },
      ],
    },
    {
      title: "Phase 4: Production-Ready Frontend",
      milestone: "Deploy a polished, performant portfolio project",
      description:
        "Performance, accessibility, testing, and deployment — what separates a hobbyist from a professional.",
      topics: [
        {
          title: "Performance & Lighthouse",
          baseHours: 6,
          priority: "medium",
          description: "Bundle analysis, lazy loading, Core Web Vitals.",
          resources: [
            { title: "web.dev Performance", url: "https://web.dev/performance/" },
          ],
        },
        {
          title: "Accessibility (a11y)",
          baseHours: 6,
          priority: "high",
          description: "ARIA, semantic HTML, keyboard navigation, screen readers.",
          resources: [
            { title: "A11Y Project", url: "https://www.a11yproject.com/" },
          ],
        },
        {
          title: "Testing (Jest + RTL)",
          baseHours: 8,
          priority: "medium",
          description: "Unit, integration, and component tests with React Testing Library.",
          resources: [
            { title: "Testing Library", url: "https://testing-library.com/" },
          ],
        },
        {
          title: "Deployment & CI",
          baseHours: 4,
          priority: "high",
          description: "Vercel, Netlify, GitHub Actions, environment variables.",
          resources: [
            { title: "Vercel Docs", url: "https://vercel.com/docs" },
          ],
          project: "Deploy your portfolio to Vercel with a custom domain",
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Web Development → Backend
// ---------------------------------------------------------------------------
const webBackend: RoadmapTemplate = {
  domain: "Web Development",
  track: "Backend",
  phases: [
    {
      title: "Phase 1: Server Foundations",
      milestone: "Build and serve a basic REST API",
      description: "Understand how servers, requests, and APIs work.",
      topics: [
        {
          title: "How HTTP & APIs Work",
          baseHours: 6,
          priority: "high",
          description: "HTTP verbs, status codes, headers, JSON.",
          resources: [{ title: "MDN HTTP", url: "https://developer.mozilla.org/docs/Web/HTTP" }],
        },
        {
          title: "Node.js & npm",
          baseHours: 8,
          priority: "high",
          description: "The Node runtime, modules, packaging.",
          resources: [{ title: "Node Docs", url: "https://nodejs.org/en/docs" }],
        },
        {
          title: "Express / Fastify Basics",
          baseHours: 10,
          priority: "high",
          description: "Routes, middleware, controllers, error handling.",
          resources: [{ title: "Express", url: "https://expressjs.com/" }],
          project: "Build a CRUD API for a notes app",
        },
      ],
    },
    {
      title: "Phase 2: Data & Persistence",
      milestone: "Persist data with a real database",
      description: "Model data, query it efficiently, and avoid common pitfalls.",
      topics: [
        {
          title: "Relational DBs & SQL",
          baseHours: 12,
          priority: "high",
          description: "Schemas, joins, indexes, transactions.",
          resources: [{ title: "SQLBolt", url: "https://sqlbolt.com/" }],
        },
        {
          title: "ORMs (Prisma)",
          baseHours: 8,
          priority: "high",
          description: "Type-safe queries, migrations, relations.",
          resources: [{ title: "Prisma Docs", url: "https://www.prisma.io/docs" }],
          project: "Add Postgres + Prisma to your notes API",
        },
        {
          title: "NoSQL (MongoDB / Redis)",
          baseHours: 6,
          priority: "medium",
          description: "When and why to use document and KV stores.",
          resources: [{ title: "MongoDB University", url: "https://learn.mongodb.com/" }],
        },
      ],
    },
    {
      title: "Phase 3: Authentication & Security",
      milestone: "Ship a secure, auth-protected API",
      description: "Real-world systems need real-world security.",
      topics: [
        {
          title: "Auth (JWT & Sessions)",
          baseHours: 10,
          priority: "high",
          description: "Token vs session auth, refresh tokens, OAuth basics.",
          resources: [{ title: "OAuth.com", url: "https://www.oauth.com/" }],
          project: "Add user auth to your notes API",
        },
        {
          title: "Security Essentials",
          baseHours: 8,
          priority: "high",
          description: "OWASP top 10, input validation, rate limiting, CORS.",
          resources: [{ title: "OWASP", url: "https://owasp.org/www-project-top-ten/" }],
        },
      ],
    },
    {
      title: "Phase 4: Production & Scale",
      milestone: "Deploy and operate a real backend",
      description: "Containers, observability, and the cloud.",
      topics: [
        {
          title: "Docker Basics",
          baseHours: 8,
          priority: "high",
          description: "Images, containers, compose for local dev.",
          resources: [{ title: "Docker Docs", url: "https://docs.docker.com/" }],
        },
        {
          title: "Cloud Deployment",
          baseHours: 8,
          priority: "high",
          description: "Deploy to Render, Fly.io, or AWS.",
          resources: [{ title: "Fly.io Docs", url: "https://fly.io/docs/" }],
          project: "Containerize and deploy your API",
        },
        {
          title: "Logging & Monitoring",
          baseHours: 6,
          priority: "medium",
          description: "Structured logs, metrics, error tracking.",
          resources: [{ title: "Sentry", url: "https://docs.sentry.io/" }],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// AI / ML → NLP
// ---------------------------------------------------------------------------
const aiNlp: RoadmapTemplate = {
  domain: "AI/ML",
  track: "NLP",
  phases: [
    {
      title: "Phase 1: Math & Python Foundations",
      milestone: "Implement core ML utilities from scratch in Python",
      description: "The math and programming you need before touching models.",
      topics: [
        {
          title: "Python for Data",
          baseHours: 10,
          priority: "high",
          description: "NumPy, Pandas, Matplotlib, Jupyter.",
          resources: [{ title: "Python Data Science Handbook", url: "https://jakevdp.github.io/PythonDataScienceHandbook/" }],
        },
        {
          title: "Linear Algebra Essentials",
          baseHours: 8,
          priority: "high",
          description: "Vectors, matrices, dot products, eigenvalues.",
          resources: [{ title: "3Blue1Brown LinAlg", url: "https://www.3blue1brown.com/topics/linear-algebra" }],
        },
        {
          title: "Probability & Statistics",
          baseHours: 8,
          priority: "medium",
          description: "Distributions, expectation, Bayes' theorem.",
          resources: [{ title: "Seeing Theory", url: "https://seeing-theory.brown.edu/" }],
        },
      ],
    },
    {
      title: "Phase 2: Classical ML",
      milestone: "Train and evaluate a text classifier",
      description: "Old-school ML still wins on small data.",
      topics: [
        {
          title: "Scikit-learn Basics",
          baseHours: 10,
          priority: "high",
          description: "Pipelines, train/test split, cross-validation.",
          resources: [{ title: "scikit-learn docs", url: "https://scikit-learn.org/stable/" }],
        },
        {
          title: "Text Preprocessing",
          baseHours: 6,
          priority: "high",
          description: "Tokenization, stopwords, stemming, lemmatization.",
          resources: [{ title: "NLTK Book", url: "https://www.nltk.org/book/" }],
        },
        {
          title: "TF-IDF & Bag-of-Words",
          baseHours: 6,
          priority: "high",
          description: "Classic features for text classification.",
          resources: [{ title: "sklearn TF-IDF", url: "https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction" }],
          project: "Build a spam classifier with TF-IDF + LogisticRegression",
        },
      ],
    },
    {
      title: "Phase 3: Deep Learning & Transformers",
      milestone: "Fine-tune a transformer for a custom NLP task",
      description: "Modern NLP is transformer-shaped.",
      topics: [
        {
          title: "PyTorch Fundamentals",
          baseHours: 12,
          priority: "high",
          description: "Tensors, autograd, training loops.",
          resources: [{ title: "PyTorch Tutorials", url: "https://pytorch.org/tutorials/" }],
        },
        {
          title: "Word Embeddings",
          baseHours: 6,
          priority: "medium",
          description: "Word2Vec, GloVe, contextual embeddings.",
          resources: [{ title: "Stanford CS224n", url: "https://web.stanford.edu/class/cs224n/" }],
        },
        {
          title: "Transformers & Attention",
          baseHours: 12,
          priority: "high",
          description: "Self-attention, encoder/decoder, BERT, GPT.",
          resources: [{ title: "The Illustrated Transformer", url: "https://jalammar.github.io/illustrated-transformer/" }],
        },
        {
          title: "HuggingFace 🤗",
          baseHours: 10,
          priority: "high",
          description: "Datasets, Tokenizers, Trainer, and the Hub.",
          resources: [{ title: "HF Course", url: "https://huggingface.co/learn/nlp-course" }],
          project: "Fine-tune DistilBERT for sentiment classification",
        },
      ],
    },
    {
      title: "Phase 4: LLMs & Production",
      milestone: "Build and deploy a RAG-powered LLM app",
      description: "Where the field actually is in 2026.",
      topics: [
        {
          title: "Prompt Engineering",
          baseHours: 6,
          priority: "high",
          description: "Few-shot, chain-of-thought, structured outputs.",
          resources: [{ title: "Anthropic Prompt Engineering", url: "https://docs.anthropic.com/en/docs/prompt-engineering" }],
        },
        {
          title: "RAG (Retrieval-Augmented Generation)",
          baseHours: 10,
          priority: "high",
          description: "Embeddings, vector DBs, chunking strategies.",
          resources: [{ title: "LangChain RAG", url: "https://python.langchain.com/docs/tutorials/rag/" }],
          project: "Build a RAG chatbot over your own documents",
        },
        {
          title: "Evaluation & Safety",
          baseHours: 6,
          priority: "medium",
          description: "Automated evals, hallucination detection, guardrails.",
          resources: [{ title: "Anthropic Safety", url: "https://www.anthropic.com/safety" }],
        },
        {
          title: "Deployment",
          baseHours: 6,
          priority: "high",
          description: "FastAPI, Docker, Modal, Vercel for AI apps.",
          resources: [{ title: "FastAPI", url: "https://fastapi.tiangolo.com/" }],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Generic fallback for any unknown (domain, track) combo.
// ---------------------------------------------------------------------------
const genericTemplate = (domain: string, track: string): RoadmapTemplate => ({
  domain,
  track,
  phases: [
    {
      title: "Phase 1: Foundations",
      milestone: `Build a small starter project in ${track || domain}`,
      description: `Get oriented in ${track || domain}: vocabulary, mental models, and tooling.`,
      topics: [
        {
          title: `${track || domain}: Core Concepts`,
          baseHours: 10,
          priority: "high",
          description: `Learn the fundamental vocabulary and ideas of ${track || domain}.`,
          resources: [],
          project: `Sketch a one-page overview of ${track || domain}`,
        },
        {
          title: "Tooling & Environment",
          baseHours: 6,
          priority: "high",
          description: "Install the tools you'll be using day to day and run a hello-world.",
          resources: [],
        },
      ],
    },
    {
      title: "Phase 2: Hands-on Practice",
      milestone: "Complete 3 small guided projects",
      description: "Move from tutorials to building things on your own.",
      topics: [
        {
          title: "Guided Project 1",
          baseHours: 12,
          priority: "high",
          description: `Follow a structured tutorial covering core ${track || domain} concepts end-to-end.`,
          resources: [],
          project: "Reproduce a tutorial project from scratch",
        },
        {
          title: "Guided Project 2",
          baseHours: 12,
          priority: "medium",
          description: "Pick a slightly harder tutorial that introduces new concepts.",
          resources: [],
        },
      ],
    },
    {
      title: "Phase 3: Intermediate Topics",
      milestone: "Build something original",
      description: "Stretch beyond tutorials and design your own thing.",
      topics: [
        {
          title: "Intermediate Concepts",
          baseHours: 14,
          priority: "high",
          description: `Dig into intermediate topics in ${track || domain}.`,
          resources: [],
        },
        {
          title: "Original Project",
          baseHours: 18,
          priority: "high",
          description: "Design, build, and ship a small original project.",
          resources: [],
          project: "Define and ship your own mini project",
        },
      ],
    },
    {
      title: "Phase 4: Polish & Specialize",
      milestone: "Pick a specialization and go deeper",
      description: "Choose what to be great at, and build mastery there.",
      topics: [
        {
          title: "Choose a Specialization",
          baseHours: 8,
          priority: "medium",
          description: "Survey advanced subfields and pick one.",
          resources: [],
        },
        {
          title: "Capstone Project",
          baseHours: 24,
          priority: "high",
          description: "A portfolio-quality project demonstrating your specialization.",
          resources: [],
          project: "Ship a capstone project to a public repo",
        },
      ],
    },
  ],
});

const TEMPLATES: RoadmapTemplate[] = [webFrontend, webBackend, aiNlp];

const norm = (s: string) => s.trim().toLowerCase();

export function selectTemplate(domain: string, track: string): RoadmapTemplate {
  const d = norm(domain);
  const t = norm(track);
  const exact = TEMPLATES.find(
    (tpl) => norm(tpl.domain) === d && norm(tpl.track) === t,
  );
  if (exact) return exact;
  const sameDomain = TEMPLATES.find((tpl) => norm(tpl.domain) === d);
  if (sameDomain) return { ...sameDomain, track: track || sameDomain.track };
  return genericTemplate(domain, track);
}

// Multipliers used by the constraint engine.
export const LEVEL_DEPTH_MULTIPLIER: Record<Level, number> = {
  beginner: 0.6,
  intermediate: 1.0,
  "job-ready": 1.35,
  expert: 1.8,
};

// At higher levels we keep more advanced topics; at beginner we drop the deep ones.
export const LEVEL_TOPIC_KEEP_RATIO: Record<Level, number> = {
  beginner: 0.7,
  intermediate: 0.9,
  "job-ready": 1.0,
  expert: 1.0,
};
