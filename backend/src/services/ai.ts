const skillLibrary = [
  "javascript", "typescript", "react", "next.js", "node.js", "express", "python",
  "java", "c++", "sql", "postgresql", "mongodb", "aws", "docker", "git",
  "machine learning", "data structures", "algorithms", "communication"
];

export function analyzeResumeText(text: string) {
  const normalized = text.toLowerCase();
  const skills = skillLibrary.filter((skill) => normalized.includes(skill));
  const hasEmail = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text);
  const hasPhone = /(?:\+?\d[\d\s-]{8,}\d)/.test(text);
  const sectionHits = ["education", "experience", "projects", "skills", "achievements"]
    .filter((section) => normalized.includes(section));
  const quantified = (text.match(/\b\d+(?:\.\d+)?%|\b\d+\+?\s+(?:users|projects|clients|students|requests)/gi) ?? []).length;
  const score = Math.min(100,
    25 + sectionHits.length * 8 + skills.length * 2 + (hasEmail ? 5 : 0) +
    (hasPhone ? 5 : 0) + Math.min(quantified, 4) * 4
  );

  const suggestions: string[] = [];
  if (sectionHits.length < 4) suggestions.push("Add clear Education, Experience, Projects, and Skills sections.");
  if (quantified < 2) suggestions.push("Quantify impact with metrics, scale, accuracy, or performance improvements.");
  if (skills.length < 5) suggestions.push("Mirror the most relevant technical keywords from the target job description.");
  if (!hasEmail || !hasPhone) suggestions.push("Add complete contact details at the top.");

  return { score, skills, sectionHits, suggestions, contactComplete: hasEmail && hasPhone };
}

type GeminiResumeResponse = {
  score: number;
  skills: string[];
  sectionHits: string[];
  suggestions: string[];
  contactComplete: boolean;
  source: "gemini" | "heuristic";
};

function normalizeResumeResponse(value: unknown, fallback: ReturnType<typeof analyzeResumeText>): GeminiResumeResponse {
  if (!value || typeof value !== "object") return { ...fallback, source: "heuristic" };
  const data = value as Partial<GeminiResumeResponse>;
  return {
    score: typeof data.score === "number" ? Math.max(0, Math.min(100, Math.round(data.score))) : fallback.score,
    skills: Array.isArray(data.skills) ? data.skills.map(String).slice(0, 20) : fallback.skills,
    sectionHits: Array.isArray(data.sectionHits) ? data.sectionHits.map(String).slice(0, 10) : fallback.sectionHits,
    suggestions: Array.isArray(data.suggestions) ? data.suggestions.map(String).slice(0, 8) : fallback.suggestions,
    contactComplete: typeof data.contactComplete === "boolean" ? data.contactComplete : fallback.contactComplete,
    source: "gemini"
  };
}

async function callGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
    })
  });
  if (!response.ok) throw new Error(`Gemini failed with ${response.status}`);
  const body = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? JSON.parse(text) : null;
}

export async function analyzeResumeTextSmart(text: string) {
  const fallback = analyzeResumeText(text);
  try {
    const result = await callGemini(`Analyze this student resume for campus placements. Return strict JSON only with keys: score number 0-100, skills string[], sectionHits string[], suggestions string[], contactComplete boolean. Resume:\n\n${text.slice(0, 18000)}`);
    return normalizeResumeResponse(result, fallback);
  } catch {
    return { ...fallback, source: "heuristic" as const };
  }
}

const questionBank: Record<string, string[]> = {
  frontend: [
    "How does React reconciliation work, and when can keys cause subtle bugs?",
    "Design an accessible autocomplete component that handles slow networks.",
    "When would you choose server components over client components?"
  ],
  backend: [
    "How would you make an API endpoint idempotent?",
    "Explain a production issue caused by database transaction isolation.",
    "Design rate limiting for a distributed Node.js service."
  ],
  data: [
    "How would you detect and handle data leakage in a prediction pipeline?",
    "Explain precision versus recall using a placement-screening example.",
    "How would you validate a model when classes are imbalanced?"
  ],
  behavioral: [
    "Tell me about a technical disagreement and how you resolved it.",
    "Describe a project setback and what changed in your approach.",
    "How do you prioritize when several deadlines collide?"
  ]
};

export function generateInterviewQuestions(role = "software engineer", count = 6) {
  const key = /front|react|ui/i.test(role) ? "frontend" : /data|ml|analyst/i.test(role) ? "data" : "backend";
  const pool = [...questionBank[key], ...questionBank.behavioral];
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    question: pool[index % pool.length],
    difficulty: index < 2 ? "Warm-up" : index < 4 ? "Core" : "Stretch",
    focus: index % 2 === 0 ? "Technical depth" : "Communication"
  }));
}

export async function generateInterviewQuestionsSmart(role = "software engineer", count = 6) {
  const fallback = generateInterviewQuestions(role, count);
  try {
    const result = await callGemini(`Generate ${count} campus placement interview questions for role "${role}". Return JSON array only. Each item needs question, difficulty, focus.`);
    if (!Array.isArray(result)) return fallback;
    return result.slice(0, count).map((item, index) => ({
      id: index + 1,
      question: String(item.question ?? fallback[index % fallback.length].question),
      difficulty: String(item.difficulty ?? fallback[index % fallback.length].difficulty),
      focus: String(item.focus ?? fallback[index % fallback.length].focus)
    }));
  } catch {
    return fallback;
  }
}
