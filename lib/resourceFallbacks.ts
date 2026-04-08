// Resource fallbacks — the single source of truth for every URL
// that can ever appear in a generated roadmap.
//
// PHILOSOPHY
// ----------
// Deep article links break. Slugs change. Courses get renamed.
// So we only ship STABLE BASE URLs that have been verified by hand
// and that land on a real learning surface. Every URL in this file
// is a trusted landing page, not a specific article.
//
// Anything that doesn't match a verified URL is rejected at
// post-processing time and swapped for a trusted fallback.

export interface FallbackResource {
  title: string;
  url: string;
  platform: string;
}

// ---- Trusted domain allowlist -------------------------------------------------
// If a URL's host doesn't match one of these, we throw it away.
const TRUSTED_DOMAINS: ReadonlyArray<string> = [
  "react.dev",
  "developer.mozilla.org",
  "freecodecamp.org",
  "huggingface.co",
  "pytorch.org",
  "nextjs.org",
  "scikit-learn.org",
  "youtube.com",
];

// ---- Verified base URLs -------------------------------------------------------
// These are the ONLY URLs the system will ever ship. Hand-verified.
// Any LLM-provided URL must match one of these (prefix-match) or it is
// replaced with a fallback.
const VERIFIED_BASE_URLS: ReadonlyArray<string> = [
  "https://react.dev/learn",
  "https://react.dev/reference/react",
  "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
  "https://developer.mozilla.org/en-US/docs/Web/HTML",
  "https://developer.mozilla.org/en-US/docs/Web/CSS",
  "https://developer.mozilla.org/en-US/docs/Web/HTTP",
  "https://developer.mozilla.org/en-US/docs/Web/API",
  "https://developer.mozilla.org/en-US/docs/Web/Accessibility",
  "https://developer.mozilla.org/en-US/docs/Web/Performance",
  "https://developer.mozilla.org/en-US/docs/Web/Security",
  "https://developer.mozilla.org/en-US/docs/Learn",
  "https://www.freecodecamp.org/learn/",
  "https://www.freecodecamp.org/news/",
  "https://huggingface.co/learn",
  "https://pytorch.org/tutorials/",
  "https://nextjs.org/docs",
  "https://scikit-learn.org/stable/",
  "https://www.youtube.com/results?search_query=", // search pages never 404
];

// ---- Platform labels for pill buttons ----------------------------------------
const PLATFORM_LABELS: Array<{ host: string; label: string }> = [
  { host: "react.dev", label: "React Docs" },
  { host: "developer.mozilla.org", label: "MDN" },
  { host: "freecodecamp.org", label: "freeCodeCamp" },
  { host: "huggingface.co", label: "Hugging Face" },
  { host: "pytorch.org", label: "PyTorch" },
  { host: "nextjs.org", label: "Next.js" },
  { host: "scikit-learn.org", label: "scikit-learn" },
  { host: "youtube.com", label: "YouTube" },
];

export function platformFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    for (const entry of PLATFORM_LABELS) {
      if (host === entry.host || host.endsWith(`.${entry.host}`)) return entry.label;
    }
    return host;
  } catch {
    return "Web";
  }
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// A URL is only acceptable if it is in a trusted domain AND its prefix
// matches one of the verified base URLs. This rejects random LLM slugs
// like /news/docker-for-beginners-xyz/ which frequently 404.
export function isTrustedUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;

  let host: string;
  let normalized: string;
  try {
    const parsed = new URL(url);
    host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    normalized = parsed.toString();
  } catch {
    return false;
  }

  const domainOk = TRUSTED_DOMAINS.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
  if (!domainOk) return false;

  // Reject suspicious paths — long random slugs, hashes, trackers.
  const path = normalized.split("#")[0].split("?")[0];
  if (/[0-9a-f]{12,}/.test(path)) return false; // long hashes

  return VERIFIED_BASE_URLS.some((base) => normalized.startsWith(base));
}

// ---- Resource catalogue -------------------------------------------------------
// Keyed by topic keyword. Priority order inside each bucket:
//   1. Official docs (MDN, react.dev, pytorch, nextjs, scikit-learn, huggingface)
//   2. Course (freeCodeCamp /learn/)
//   3. YouTube (search URL — never 404)
//
// Keep each bucket small (<= 4) so the matcher stays deterministic.

const MDN_JAVASCRIPT: FallbackResource = {
  title: "MDN JavaScript Guide",
  url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
  platform: "MDN",
};
const MDN_HTML: FallbackResource = {
  title: "MDN HTML",
  url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
  platform: "MDN",
};
const MDN_CSS: FallbackResource = {
  title: "MDN CSS",
  url: "https://developer.mozilla.org/en-US/docs/Web/CSS",
  platform: "MDN",
};
const MDN_HTTP: FallbackResource = {
  title: "MDN HTTP Overview",
  url: "https://developer.mozilla.org/en-US/docs/Web/HTTP",
  platform: "MDN",
};
const MDN_API: FallbackResource = {
  title: "MDN Web APIs",
  url: "https://developer.mozilla.org/en-US/docs/Web/API",
  platform: "MDN",
};
const MDN_A11Y: FallbackResource = {
  title: "MDN Accessibility",
  url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility",
  platform: "MDN",
};
const MDN_PERF: FallbackResource = {
  title: "MDN Web Performance",
  url: "https://developer.mozilla.org/en-US/docs/Web/Performance",
  platform: "MDN",
};
const MDN_SECURITY: FallbackResource = {
  title: "MDN Web Security",
  url: "https://developer.mozilla.org/en-US/docs/Web/Security",
  platform: "MDN",
};
const MDN_LEARN: FallbackResource = {
  title: "MDN Learn Web Development",
  url: "https://developer.mozilla.org/en-US/docs/Learn",
  platform: "MDN",
};

const REACT_LEARN: FallbackResource = {
  title: "React Learn",
  url: "https://react.dev/learn",
  platform: "React Docs",
};
const REACT_REFERENCE: FallbackResource = {
  title: "React Reference",
  url: "https://react.dev/reference/react",
  platform: "React Docs",
};

const NEXTJS_DOCS: FallbackResource = {
  title: "Next.js Docs",
  url: "https://nextjs.org/docs",
  platform: "Next.js",
};

const FCC_LEARN: FallbackResource = {
  title: "freeCodeCamp Learn",
  url: "https://www.freecodecamp.org/learn/",
  platform: "freeCodeCamp",
};
const FCC_NEWS: FallbackResource = {
  title: "freeCodeCamp News",
  url: "https://www.freecodecamp.org/news/",
  platform: "freeCodeCamp",
};

const HF_LEARN: FallbackResource = {
  title: "Hugging Face Learn",
  url: "https://huggingface.co/learn",
  platform: "Hugging Face",
};

const PYTORCH_TUTORIALS: FallbackResource = {
  title: "PyTorch Tutorials",
  url: "https://pytorch.org/tutorials/",
  platform: "PyTorch",
};

const SKLEARN_DOCS: FallbackResource = {
  title: "scikit-learn User Guide",
  url: "https://scikit-learn.org/stable/",
  platform: "scikit-learn",
};

function youtubeSearch(query: string, title?: string): FallbackResource {
  return {
    title: title ?? `YouTube: ${query}`,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    platform: "YouTube",
  };
}

export const RESOURCES: Record<string, FallbackResource[]> = {
  react: [REACT_LEARN, FCC_LEARN, youtubeSearch("react tutorial", "YouTube: React Tutorial")],
  javascript: [MDN_JAVASCRIPT, FCC_LEARN, youtubeSearch("javascript tutorial", "YouTube: JavaScript Crash Course")],
  html: [MDN_HTML, FCC_LEARN],
  css: [MDN_CSS, FCC_LEARN],
  accessibility: [MDN_A11Y, FCC_LEARN],
  performance: [MDN_PERF, REACT_LEARN],
  api: [MDN_API, MDN_HTTP, FCC_LEARN],
  http: [MDN_HTTP, FCC_LEARN],
  testing: [MDN_LEARN, FCC_LEARN, youtubeSearch("software testing tutorial")],
  node: [FCC_LEARN, MDN_HTTP],
  express: [FCC_LEARN, MDN_HTTP],
  backend: [FCC_LEARN, MDN_HTTP],
  database: [FCC_LEARN, youtubeSearch("sql tutorial")],
  sql: [FCC_LEARN, youtubeSearch("sql tutorial")],
  python: [FCC_LEARN, youtubeSearch("python full course"), PYTORCH_TUTORIALS],
  algorithms: [FCC_LEARN, youtubeSearch("algorithms course")],
  "data structures": [FCC_LEARN, youtubeSearch("data structures course")],
  statistics: [FCC_LEARN, youtubeSearch("statistics for data science")],
  probability: [FCC_LEARN, youtubeSearch("probability crash course")],
  "machine learning": [SKLEARN_DOCS, HF_LEARN, youtubeSearch("machine learning course")],
  "deep learning": [HF_LEARN, PYTORCH_TUTORIALS, youtubeSearch("deep learning course")],
  nlp: [HF_LEARN, youtubeSearch("nlp tutorial")],
  transformer: [HF_LEARN, youtubeSearch("transformers explained")],
  llm: [HF_LEARN, youtubeSearch("llm tutorial")],
  "generative ai": [HF_LEARN, youtubeSearch("generative ai course")],
  "computer vision": [PYTORCH_TUTORIALS, HF_LEARN, youtubeSearch("computer vision course")],
  pytorch: [PYTORCH_TUTORIALS, HF_LEARN],
  tensorflow: [HF_LEARN, youtubeSearch("tensorflow tutorial")],
  mlops: [HF_LEARN, youtubeSearch("mlops tutorial")],
  "scikit-learn": [SKLEARN_DOCS, FCC_LEARN],
  "system design": [FCC_LEARN, youtubeSearch("system design primer")],
  docker: [FCC_LEARN, youtubeSearch("docker tutorial")],
  kubernetes: [FCC_LEARN, youtubeSearch("kubernetes tutorial")],
  devops: [FCC_LEARN, youtubeSearch("devops roadmap")],
  ui: [MDN_A11Y, FCC_LEARN],
  ux: [FCC_LEARN, MDN_A11Y],
  figma: [FCC_LEARN, youtubeSearch("figma tutorial")],
  capstone: [FCC_LEARN, FCC_NEWS],
  portfolio: [FCC_LEARN, MDN_A11Y],
  deployment: [NEXTJS_DOCS, FCC_LEARN],
  authentication: [MDN_HTTP, FCC_LEARN],
  security: [MDN_SECURITY, FCC_LEARN],
  git: [FCC_NEWS, youtubeSearch("git tutorial")],
  typescript: [MDN_JAVASCRIPT, FCC_LEARN, youtubeSearch("typescript course")],
  nextjs: [NEXTJS_DOCS, REACT_LEARN],
  ai: [HF_LEARN, PYTORCH_TUTORIALS, youtubeSearch("ai course")],
  rag: [HF_LEARN, youtubeSearch("rag tutorial")],
  agents: [HF_LEARN, youtubeSearch("ai agents tutorial")],
  "prompt engineering": [HF_LEARN, youtubeSearch("prompt engineering")],
  "data science": [SKLEARN_DOCS, FCC_LEARN, youtubeSearch("data science course")],
  pandas: [FCC_LEARN, youtubeSearch("pandas tutorial")],
  numpy: [FCC_LEARN, youtubeSearch("numpy tutorial")],
  visualization: [FCC_LEARN, youtubeSearch("data visualization")],
  mobile: [MDN_LEARN, youtubeSearch("mobile development tutorial")],
  fundamentals: [MDN_LEARN, FCC_LEARN],
  project: [FCC_LEARN, FCC_NEWS],
};

const SYNONYMS: Record<string, string[]> = {
  react: ["jsx", "hooks", "react hooks"],
  javascript: ["js", "frontend", "front end", "dom", "ecmascript"],
  html: ["markup"],
  css: ["styling", "layout", "responsive design", "flexbox", "grid"],
  accessibility: ["a11y", "aria"],
  performance: ["optimization", "web performance", "lighthouse"],
  api: ["rest", "fetch", "endpoint", "graphql"],
  http: ["requests", "headers", "cookies"],
  testing: ["unit test", "integration test", "qa", "vitest", "jest", "cypress"],
  node: ["nodejs", "node.js", "server side javascript"],
  express: ["backend api", "rest api"],
  backend: ["server", "server api"],
  database: ["db", "storage", "schema", "postgres", "mysql", "mongodb"],
  sql: ["queries", "joins", "indexes"],
  python: ["py", "python3"],
  algorithms: ["algorithm", "big o", "dsa"],
  "data structures": ["data structure", "arrays", "trees", "graphs", "linked list"],
  statistics: ["stats", "descriptive statistics"],
  probability: ["bayes", "random variables"],
  "machine learning": ["ml", "supervised learning", "unsupervised learning", "classification", "regression"],
  "deep learning": ["dl", "neural network", "neural nets", "cnn", "rnn"],
  nlp: ["natural language processing", "embeddings", "tokenization"],
  transformer: ["attention", "transformers", "self attention"],
  llm: ["large language model", "rag", "retrieval augmented generation"],
  "generative ai": ["genai", "text generation"],
  "computer vision": ["cv", "vision", "image models", "object detection"],
  pytorch: ["torch"],
  tensorflow: ["keras"],
  mlops: ["model deployment", "model monitoring"],
  "scikit-learn": ["sklearn"],
  "system design": ["distributed systems", "scalability", "architecture"],
  docker: ["containers", "containerization"],
  kubernetes: ["k8s", "orchestration"],
  devops: ["ci cd", "ci/cd", "pipeline", "infrastructure", "terraform"],
  ui: ["user interface", "design systems"],
  ux: ["user experience", "interaction design"],
  figma: ["wireframe", "prototype", "prototyping"],
  capstone: ["final project", "production project"],
  portfolio: ["showcase project", "portfolio project"],
  deployment: ["ship", "launch", "hosting", "vercel", "netlify"],
  authentication: ["auth", "login", "oauth", "jwt"],
  security: ["xss", "csrf", "owasp", "secure", "vulnerability", "encryption"],
  git: ["github", "version control", "branching", "pull request"],
  typescript: ["ts", "typed javascript", "type system"],
  nextjs: ["next js", "next.js", "app router", "server components"],
  ai: ["artificial intelligence", "ai mentor", "ai assistant", "ai system"],
  rag: ["vector store", "embeddings search"],
  agents: ["ai agent", "agentic", "tool use", "multi agent"],
  "prompt engineering": ["prompting", "system prompt", "few shot"],
  "data science": ["data scientist", "data wrangling", "exploratory analysis"],
  pandas: ["dataframe", "data frame"],
  numpy: ["numerical computing", "ndarray"],
  visualization: ["charts", "plotting", "matplotlib", "d3"],
  mobile: ["ios", "android", "react native", "flutter", "swift", "kotlin"],
  fundamentals: ["basics", "foundation", "introduction", "getting started"],
  project: ["build", "portfolio", "capstone"],
};

const GENERIC: FallbackResource[] = [MDN_LEARN, FCC_LEARN];

const RESOURCE_KEYS = Object.keys(RESOURCES).sort(
  (left, right) => right.length - left.length,
);

const SYNONYM_LOOKUPS: Array<{ key: string; synonym: string }> = Object.entries(
  SYNONYMS,
).flatMap(([key, values]) =>
  values.map((synonym) => ({ key, synonym: normalizeText(synonym) })),
);

function scoreResourceKey(text: string, key: string): number {
  const normalizedKey = normalizeText(key);
  if (!normalizedKey) return 0;
  if (text === normalizedKey) return 100;
  if (text.includes(normalizedKey)) return 80 + normalizedKey.length;

  const textTokens = new Set(text.split(" "));
  const keyTokens = normalizedKey.split(" ");
  const overlaps = keyTokens.filter((token) => textTokens.has(token)).length;
  return overlaps > 0 ? overlaps * 10 : 0;
}

// Attach platform labels to an LLM-provided resource if missing.
export function attachPlatform(resource: {
  title: string;
  url: string;
  platform?: string;
}): FallbackResource {
  return {
    title: resource.title,
    url: resource.url,
    platform: resource.platform || platformFromUrl(resource.url),
  };
}

// Order resources so official docs come first, then course, then YouTube.
function priorityRank(resource: FallbackResource): number {
  const host = (() => {
    try {
      return new URL(resource.url).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return "";
    }
  })();

  // 1. Official docs
  if (
    host === "react.dev" ||
    host === "developer.mozilla.org" ||
    host === "nextjs.org" ||
    host === "pytorch.org" ||
    host === "scikit-learn.org" ||
    host === "huggingface.co"
  ) {
    return 0;
  }
  // 2. Course / news
  if (host.endsWith("freecodecamp.org")) return 1;
  // 3. YouTube
  if (host.endsWith("youtube.com")) return 2;
  return 3;
}

export function getFallbackResources(topicContext: string): FallbackResource[] {
  const text = normalizeText(topicContext || "");
  if (!text) return GENERIC.slice(0, 2);

  const scoredKeys = new Map<string, number>();

  for (const key of RESOURCE_KEYS) {
    const score = scoreResourceKey(text, key);
    if (score > 0) scoredKeys.set(key, Math.max(score, scoredKeys.get(key) ?? 0));
  }

  for (const { key, synonym } of SYNONYM_LOOKUPS) {
    if (!synonym) continue;
    const score = scoreResourceKey(text, synonym);
    if (score > 0) {
      scoredKeys.set(key, Math.max(score - 5, scoredKeys.get(key) ?? 0));
    }
  }

  const matches = [...scoredKeys.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([key]) => key);

  const pool: FallbackResource[] = [];
  const seen = new Set<string>();

  const push = (resource: FallbackResource) => {
    if (!isTrustedUrl(resource.url) || seen.has(resource.url)) return;
    seen.add(resource.url);
    pool.push(resource);
  };

  for (const key of matches) {
    for (const resource of RESOURCES[key] ?? []) push(resource);
    if (pool.length >= 6) break;
  }
  for (const resource of GENERIC) push(resource);

  // Sort by official docs → course → YouTube, preserve ties.
  pool.sort((left, right) => priorityRank(left) - priorityRank(right));

  return pool.slice(0, 2);
}
