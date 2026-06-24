import { Router } from "express";
import multer from "multer";
import pdf from "pdf-parse";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { audit } from "../lib/audit.js";
import { authenticate } from "../middleware/auth.js";
import { analyzeResumeTextSmart, generateInterviewQuestionsSmart } from "../services/ai.js";
import { predictReadiness } from "../services/readiness.js";

export const aiRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => callback(null, file.mimetype === "application/pdf" || file.mimetype === "text/plain")
});

aiRouter.use(authenticate);

aiRouter.post("/resume/text", async (request, response) => {
  const { text } = z.object({ text: z.string().min(20).max(100_000) }).parse(request.body);
  const result = await analyzeResumeTextSmart(text);
  await prisma.resumeAnalysis.create({
    data: { userId: request.auth!.userId, score: result.score, skills: result.skills, sections: result.sectionHits, suggestions: result.suggestions }
  });
  await audit(request.auth!.userId, "ANALYZE", "resume", { score: result.score });
  response.json(result);
});

aiRouter.post("/resume/upload", upload.single("resume"), async (request, response) => {
  if (!request.file) return response.status(400).json({ error: "PDF or text resume is required" });
  const text = request.file.mimetype === "application/pdf"
    ? (await pdf(request.file.buffer)).text
    : request.file.buffer.toString("utf8");
  if (text.trim().length < 20) return response.status(422).json({ error: "Could not extract enough text from the resume" });
  const result = await analyzeResumeTextSmart(text);
  await prisma.resumeAnalysis.create({
    data: {
      userId: request.auth!.userId, fileName: request.file.originalname, score: result.score,
      skills: result.skills, sections: result.sectionHits, suggestions: result.suggestions
    }
  });
  response.json({ ...result, fileName: request.file.originalname, extractedCharacters: text.length });
});

aiRouter.get("/resume/history", async (request, response) => {
  response.json(await prisma.resumeAnalysis.findMany({
    where: { userId: request.auth!.userId }, orderBy: { createdAt: "desc" }, take: 20
  }));
});

aiRouter.post("/interview", async (request, response) => {
  const { role, count } = z.object({ role: z.string().default("software engineer"), count: z.number().int().min(1).max(12).default(6) }).parse(request.body);
  response.json(await generateInterviewQuestionsSmart(role, count));
});

aiRouter.post("/readiness", (request, response) => response.json(predictReadiness(request.body)));
