import { Router } from "express";
import multer from "multer";
import { extractText, getDocumentProxy } from "unpdf";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { audit } from "../lib/audit.js";
import { authenticate } from "../middleware/auth.js";
import { analyzeResumeTextSmart, generateInterviewQuestionsSmart, evaluateInterviewAnswerSmart } from "../services/ai.js";
import { predictReadiness } from "../services/readiness.js";

export const aiRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

aiRouter.use(authenticate);

// 1. Text Paste Analyzer Route
aiRouter.post("/resume/text", async (request, response) => {
  const { text } = z.object({ text: z.string().min(20).max(100_000) }).parse(request.body);
  const result = await analyzeResumeTextSmart(text);
  await prisma.resumeAnalysis.create({
    data: { userId: request.auth!.userId, score: result.score, skills: result.skills, sections: result.sectionHits, suggestions: result.suggestions }
  });
  await audit(request.auth!.userId, "ANALYZE", "resume", { score: result.score });
  response.json(result);
});

// 2. NEW/UPDATED: Native PDF and TXT File Upload Analyzer Route
aiRouter.post("/resume/upload", upload.single("resume"), async (request, response) => {
  if (!request.file) return response.status(400).json({ error: "No file uploaded" });

  const isPdf = request.file.mimetype === "application/pdf" || request.file.originalname.toLowerCase().endsWith(".pdf");
  const isTxt = request.file.mimetype === "text/plain" || request.file.originalname.toLowerCase().endsWith(".txt");

  if (!isPdf && !isTxt) {
    return response.status(400).json({ error: "Only PDF or TXT files are allowed" });
  }

  let text = "";
  try {
    if (isPdf) {
      console.log(`[ResumeUpload] Loading PDF document: ${request.file.originalname} (${request.file.size} bytes)`);
      const pdfProxy = await getDocumentProxy(new Uint8Array(request.file.buffer));
      console.log(`[ResumeUpload] PDF loaded successfully. Total pages: ${pdfProxy.numPages}`);
      
      let extractedText = "";
      for (let i = 1; i <= pdfProxy.numPages; i++) {
        const page = await pdfProxy.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || "")
          .join(" ");
        extractedText += pageText + "\n";
      }
      text = extractedText;
      console.log(`[ResumeUpload] Text extraction complete. Extracted characters: ${text.length}`);
      console.log(`[ResumeUpload] Text preview: "${text.substring(0, 150).replace(/\s+/g, " ")}"`);
    } else {
      text = request.file.buffer.toString("utf8");
      console.log(`[ResumeUpload] Loaded TXT document. Characters: ${text.length}`);
    }
  } catch (pdfError: any) {
    console.error("[ResumeUpload] PDF parsing failed. Error details:", pdfError);
    return response.status(422).json({ 
      error: `Failed to parse PDF resume. Details: ${pdfError?.message || "Invalid PDF structure"}` 
    });
  }

  if (text.trim().length < 20) {
    console.warn(`[ResumeUpload] Extracted text is too short: ${text.trim().length} chars.`);
    return response.status(422).json({ 
      error: `Could not extract enough text from the resume (extracted ${text.trim().length} characters). If it is a scanned image or has custom font curves, please export it with a standard Unicode text layer.` 
    });
  }
  
  const result = await analyzeResumeTextSmart(text);
  await prisma.resumeAnalysis.create({
    data: {
      userId: request.auth!.userId, 
      fileName: request.file.originalname, 
      score: result.score,
      skills: result.skills, 
      sections: result.sectionHits, 
      suggestions: result.suggestions
    }
  });
  
  response.json({ ...result, fileName: request.file.originalname, extractedCharacters: text.length });
});

// 3. History Retrieval Route
aiRouter.get("/resume/history", async (request, response) => {
  response.json(await prisma.resumeAnalysis.findMany({
    where: { userId: request.auth!.userId }, orderBy: { createdAt: "desc" }, take: 20
  }));
});

// 4. Interview Prep Generation Route
aiRouter.post("/interview", async (request, response) => {
  const { role, count } = z.object({ role: z.string().default("software engineer"), count: z.number().int().min(1).max(12).default(6) }).parse(request.body);
  response.json(await generateInterviewQuestionsSmart(role, count));
});

// 5. Interview Answer Feedback Route
aiRouter.post("/interview/feedback", async (request, response) => {
  const { question, answer, role } = z.object({
    question: z.string().min(5),
    answer: z.string().min(1),
    role: z.string().default("software engineer")
  }).parse(request.body);
  const result = await evaluateInterviewAnswerSmart(question, answer, role);
  response.json(result);
});

// 6. Readiness Evaluation Route
aiRouter.post("/readiness", (request, response) => response.json(predictReadiness(request.body)));