export interface FallbackResource {
  title: string;
  url: string;
}

const TRUSTED_DOMAINS: ReadonlyArray<string> = [
  "developer.mozilla.org",
  "react.dev",
  "freecodecamp.org",
  "huggingface.co",
  "stanford.edu",
  "mit.edu",
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isTrustedUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return TRUSTED_DOMAINS.some(
      (domain) => host === domain || host.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

export const RESOURCES: Record<string, FallbackResource[]> = {
  react: [
    { title: "React Learn", url: "https://react.dev/learn" },
    {
      title: "freeCodeCamp Front End Libraries",
      url: "https://www.freecodecamp.org/learn/front-end-development-libraries/",
    },
  ],
  javascript: [
    {
      title: "MDN JavaScript Guide",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    },
    {
      title: "freeCodeCamp JavaScript Algorithms and Data Structures",
      url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/",
    },
  ],
  html: [
    {
      title: "MDN HTML Learning Path",
      url: "https://developer.mozilla.org/en-US/docs/Learn/HTML",
    },
    {
      title: "freeCodeCamp Responsive Web Design",
      url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
    },
  ],
  css: [
    {
      title: "MDN CSS Learning Path",
      url: "https://developer.mozilla.org/en-US/docs/Learn/CSS",
    },
    {
      title: "freeCodeCamp Responsive Web Design",
      url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
    },
  ],
  accessibility: [
    {
      title: "MDN Accessibility Guide",
      url: "https://developer.mozilla.org/en-US/docs/Learn/Accessibility",
    },
    {
      title: "freeCodeCamp Responsive Web Design",
      url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
    },
  ],
  performance: [
    {
      title: "MDN Web Performance",
      url: "https://developer.mozilla.org/en-US/docs/Learn/Performance",
    },
    {
      title: "React Learn",
      url: "https://react.dev/learn",
    },
  ],
  api: [
    {
      title: "MDN Fetch API",
      url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API",
    },
    {
      title: "MDN HTTP Overview",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
    },
  ],
  testing: [
    {
      title: "freeCodeCamp Quality Assurance",
      url: "https://www.freecodecamp.org/learn/quality-assurance/",
    },
    {
      title: "MDN Testing Guide",
      url: "https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing",
    },
  ],
  node: [
    {
      title: "freeCodeCamp Back End Development and APIs",
      url: "https://www.freecodecamp.org/learn/back-end-development-and-apis/",
    },
    {
      title: "MDN HTTP Overview",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
    },
  ],
  express: [
    {
      title: "freeCodeCamp Back End Development and APIs",
      url: "https://www.freecodecamp.org/learn/back-end-development-and-apis/",
    },
    {
      title: "MDN HTTP Overview",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
    },
  ],
  backend: [
    {
      title: "freeCodeCamp Back End Development and APIs",
      url: "https://www.freecodecamp.org/learn/back-end-development-and-apis/",
    },
    {
      title: "MDN HTTP Overview",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
    },
  ],
  database: [
    {
      title: "freeCodeCamp Relational Database",
      url: "https://www.freecodecamp.org/learn/relational-database/",
    },
    {
      title: "MIT Mathematics for Computer Science",
      url: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/",
    },
  ],
  sql: [
    {
      title: "freeCodeCamp Relational Database",
      url: "https://www.freecodecamp.org/learn/relational-database/",
    },
    {
      title: "MIT Mathematics for Computer Science",
      url: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/",
    },
  ],
  python: [
    {
      title: "freeCodeCamp Scientific Computing with Python",
      url: "https://www.freecodecamp.org/learn/scientific-computing-with-python/",
    },
    {
      title: "freeCodeCamp Data Analysis with Python",
      url: "https://www.freecodecamp.org/learn/data-analysis-with-python/",
    },
  ],
  algorithms: [
    {
      title: "MIT Introduction to Algorithms",
      url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
    },
    {
      title: "MIT Mathematics for Computer Science",
      url: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/",
    },
  ],
  "data structures": [
    {
      title: "MIT Introduction to Algorithms",
      url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
    },
    {
      title: "freeCodeCamp JavaScript Algorithms and Data Structures",
      url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/",
    },
  ],
  statistics: [
    {
      title: "MIT Probability",
      url: "https://ocw.mit.edu/courses/6-041-probabilistic-systems-analysis-and-applied-probability-fall-2010/",
    },
    {
      title: "MIT Mathematics for Computer Science",
      url: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/",
    },
  ],
  probability: [
    {
      title: "MIT Probability",
      url: "https://ocw.mit.edu/courses/6-041-probabilistic-systems-analysis-and-applied-probability-fall-2010/",
    },
    {
      title: "MIT Mathematics for Computer Science",
      url: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/",
    },
  ],
  "machine learning": [
    {
      title: "freeCodeCamp Machine Learning with Python",
      url: "https://www.freecodecamp.org/learn/machine-learning-with-python/",
    },
    {
      title: "MIT Artificial Intelligence",
      url: "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/",
    },
  ],
  "deep learning": [
    {
      title: "Hugging Face Learn",
      url: "https://huggingface.co/learn",
    },
    {
      title: "Stanford CS25",
      url: "https://web.stanford.edu/class/cs25/",
    },
  ],
  nlp: [
    {
      title: "Hugging Face NLP Course",
      url: "https://huggingface.co/learn/nlp-course/chapter1/1",
    },
    {
      title: "Stanford CS224N",
      url: "https://web.stanford.edu/class/cs224n/",
    },
  ],
  transformer: [
    {
      title: "Hugging Face NLP Course",
      url: "https://huggingface.co/learn/nlp-course/chapter1/1",
    },
    {
      title: "Stanford CS224N",
      url: "https://web.stanford.edu/class/cs224n/",
    },
  ],
  llm: [
    {
      title: "Hugging Face Learn",
      url: "https://huggingface.co/learn",
    },
    {
      title: "Stanford CS25",
      url: "https://web.stanford.edu/class/cs25/",
    },
  ],
  "generative ai": [
    {
      title: "Hugging Face Learn",
      url: "https://huggingface.co/learn",
    },
    {
      title: "MIT Artificial Intelligence",
      url: "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/",
    },
  ],
  "computer vision": [
    {
      title: "Stanford CS231N",
      url: "https://cs231n.stanford.edu/",
    },
    {
      title: "Hugging Face Learn",
      url: "https://huggingface.co/learn",
    },
  ],
  pytorch: [
    {
      title: "Hugging Face Learn",
      url: "https://huggingface.co/learn",
    },
    {
      title: "freeCodeCamp Machine Learning with Python",
      url: "https://www.freecodecamp.org/learn/machine-learning-with-python/",
    },
  ],
  tensorflow: [
    {
      title: "freeCodeCamp Machine Learning with Python",
      url: "https://www.freecodecamp.org/learn/machine-learning-with-python/",
    },
    {
      title: "MIT Artificial Intelligence",
      url: "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/",
    },
  ],
  mlops: [
    {
      title: "MIT Distributed Systems",
      url: "https://pdos.csail.mit.edu/6.824/",
    },
    {
      title: "Hugging Face Learn",
      url: "https://huggingface.co/learn",
    },
  ],
  "system design": [
    {
      title: "MIT Distributed Systems",
      url: "https://pdos.csail.mit.edu/6.824/",
    },
    {
      title: "MIT Introduction to Algorithms",
      url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
    },
  ],
  docker: [
    {
      title: "MIT Distributed Systems",
      url: "https://pdos.csail.mit.edu/6.824/",
    },
    {
      title: "freeCodeCamp Back End Development and APIs",
      url: "https://www.freecodecamp.org/learn/back-end-development-and-apis/",
    },
  ],
  kubernetes: [
    {
      title: "MIT Distributed Systems",
      url: "https://pdos.csail.mit.edu/6.824/",
    },
    {
      title: "freeCodeCamp Back End Development and APIs",
      url: "https://www.freecodecamp.org/learn/back-end-development-and-apis/",
    },
  ],
  ui: [
    {
      title: "freeCodeCamp Responsive Web Design",
      url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
    },
    {
      title: "MDN Accessibility Guide",
      url: "https://developer.mozilla.org/en-US/docs/Learn/Accessibility",
    },
  ],
  ux: [
    {
      title: "freeCodeCamp Responsive Web Design",
      url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
    },
    {
      title: "MDN Accessibility Guide",
      url: "https://developer.mozilla.org/en-US/docs/Learn/Accessibility",
    },
  ],
  figma: [
    {
      title: "freeCodeCamp Responsive Web Design",
      url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
    },
    {
      title: "MDN Accessibility Guide",
      url: "https://developer.mozilla.org/en-US/docs/Learn/Accessibility",
    },
  ],
  capstone: [
    {
      title: "freeCodeCamp Project-Based Curriculum",
      url: "https://www.freecodecamp.org/learn/",
    },
    {
      title: "MDN Web Performance",
      url: "https://developer.mozilla.org/en-US/docs/Learn/Performance",
    },
  ],
  portfolio: [
    {
      title: "freeCodeCamp Responsive Web Design",
      url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
    },
    {
      title: "MDN Accessibility Guide",
      url: "https://developer.mozilla.org/en-US/docs/Learn/Accessibility",
    },
  ],
  deployment: [
    {
      title: "freeCodeCamp Back End Development and APIs",
      url: "https://www.freecodecamp.org/learn/back-end-development-and-apis/",
    },
    {
      title: "MDN HTTP Overview",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
    },
  ],
  authentication: [
    {
      title: "MDN HTTP Authentication",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication",
    },
    {
      title: "freeCodeCamp Back End Development and APIs",
      url: "https://www.freecodecamp.org/learn/back-end-development-and-apis/",
    },
  ],
};

const SYNONYMS: Record<string, string[]> = {
  react: ["jsx", "hooks", "react hooks"],
  javascript: ["js", "frontend", "front end", "dom"],
  html: ["markup"],
  css: ["styling", "layout", "responsive design"],
  accessibility: ["a11y"],
  performance: ["optimization", "web performance"],
  api: ["rest", "http", "fetch", "endpoint"],
  testing: ["unit test", "integration test", "qa", "vitest", "jest"],
  node: ["nodejs", "server side javascript"],
  express: ["backend api", "rest api"],
  backend: ["server", "server api"],
  database: ["db", "storage", "schema"],
  sql: ["queries", "joins", "indexes"],
  python: ["py", "python3"],
  algorithms: ["algorithm", "big o", "dsa"],
  "data structures": ["data structure", "arrays", "trees", "graphs"],
  statistics: ["stats"],
  probability: ["bayes", "random variables"],
  "machine learning": ["ml", "supervised learning", "unsupervised learning"],
  "deep learning": ["dl", "neural network", "neural nets"],
  nlp: ["natural language processing", "embeddings", "tokenization"],
  transformer: ["attention", "transformers"],
  llm: ["large language model", "prompt engineering", "rag"],
  "generative ai": ["genai", "text generation"],
  "computer vision": ["cv", "vision", "image models"],
  pytorch: ["torch"],
  tensorflow: ["keras"],
  mlops: ["model deployment", "model monitoring"],
  "system design": ["distributed systems", "scalability", "architecture"],
  docker: ["containers", "containerization"],
  kubernetes: ["k8s", "orchestration"],
  ui: ["user interface", "design systems"],
  ux: ["user experience", "interaction design"],
  figma: ["wireframe", "prototype", "prototyping"],
  capstone: ["final project", "production project"],
  portfolio: ["showcase project", "portfolio project"],
  deployment: ["ship", "launch", "hosting"],
  authentication: ["auth", "login", "oauth"],
};

const GENERIC: FallbackResource[] = [
  { title: "MDN Web Docs", url: "https://developer.mozilla.org/" },
  { title: "freeCodeCamp Learn", url: "https://www.freecodecamp.org/learn/" },
];

const RESOURCE_KEYS = Object.keys(RESOURCES).sort((left, right) => right.length - left.length);

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

  const resources: FallbackResource[] = [];
  const seen = new Set<string>();

  const push = (resource: FallbackResource) => {
    if (!isTrustedUrl(resource.url) || seen.has(resource.url)) return;
    seen.add(resource.url);
    resources.push(resource);
  };

  for (const key of matches) {
    for (const resource of RESOURCES[key] ?? []) {
      push(resource);
      if (resources.length >= 2) return resources;
    }
  }

  for (const resource of GENERIC) {
    push(resource);
    if (resources.length >= 2) break;
  }

  return resources.slice(0, 2);
}
