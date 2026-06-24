import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, signToken } from "../middleware/auth.js";
import { audit } from "../lib/audit.js";

export const authRouter = Router();

authRouter.post("/login", async (request, response) => {
  const input = z.object({ email: z.string().email(), password: z.string().min(6) }).parse(request.body);
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    include: { student: true, coordinator: true }
  });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    return response.status(401).json({ error: "Invalid email or password" });
  }
  await audit(user.id, "LOGIN", "auth");
  const { passwordHash: _, ...safeUser } = user;
  response.json({ token: signToken(user.id, user.role), user: safeUser });
});

authRouter.post("/signup", async (request, response) => {
  const input = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["STUDENT", "COORDINATOR"]).default("STUDENT"),
    branch: z.string().min(2).default("Computer Engineering"),
    cgpa: z.number().min(0).max(10).default(7),
    graduationYear: z.number().int().min(2024).max(2035).default(2027),
    skills: z.array(z.string()).default(["Java", "SQL", "Communication"]),
    backlogs: z.number().int().min(0).max(10).default(0)
  }).parse(request.body);

  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) return response.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(input.password, 10);

  let userData: Parameters<typeof prisma.user.create>[0]["data"];

  if (input.role === "COORDINATOR") {
    userData = {
      email: input.email.toLowerCase(),
      passwordHash,
      role: "COORDINATOR",
      coordinator: { create: { department: input.branch } }
    };
  } else {
    const readinessScore = Math.min(95, Math.max(35, Math.round(input.cgpa * 8 + input.skills.length * 3 - input.backlogs * 8)));
    userData = {
      email: input.email.toLowerCase(),
      passwordHash,
      role: "STUDENT",
      student: {
        create: {
          name: input.name,
          branch: input.branch,
          cgpa: input.cgpa,
          graduationYear: input.graduationYear,
          skills: input.skills,
          backlogs: input.backlogs,
          readinessScore,
          mockTestCount: 0
        }
      }
    };
  }

  const user = await prisma.user.create({ data: userData, include: { student: true, coordinator: true } });
  await audit(user.id, "SIGNUP", "auth");
  const { passwordHash: _, ...safeUser } = user;
  response.status(201).json({ token: signToken(user.id, user.role), user: safeUser });
});

authRouter.get("/me", authenticate, async (request, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.auth!.userId },
    select: {
      id: true, email: true, role: true, createdAt: true,
      student: true, coordinator: true,
      notifications: { where: { isRead: false }, orderBy: { createdAt: "desc" }, take: 10 }
    }
  });
  if (!user) return response.status(404).json({ error: "User not found" });
  response.json(user);
});

authRouter.patch("/me/student", authenticate, async (request, response) => {
  const input = z.object({
    name: z.string().min(2).optional(),
    branch: z.string().min(2).optional(),
    cgpa: z.number().min(0).max(10).optional(),
    graduationYear: z.number().int().min(2024).max(2035).optional(),
    skills: z.array(z.string().min(1)).optional(),
    backlogs: z.number().int().min(0).max(10).optional()
  }).parse(request.body);

  const student = await prisma.student.findUnique({ where: { userId: request.auth!.userId } });
  if (!student) return response.status(404).json({ error: "Student profile not found" });

  const nextCgpa = input.cgpa ?? student.cgpa;
  const nextSkills = input.skills ?? student.skills;
  const nextBacklogs = input.backlogs ?? student.backlogs;
  const readinessScore = Math.min(100, Math.max(25, Math.round(nextCgpa * 8 + nextSkills.length * 3 - nextBacklogs * 8)));

  const updated = await prisma.student.update({
    where: { id: student.id },
    data: { ...input, readinessScore },
    include: { user: { select: { id: true, email: true, role: true } } }
  });
  await audit(request.auth!.userId, "UPDATE", "student-profile", { studentId: student.id });
  response.json(updated);
});
