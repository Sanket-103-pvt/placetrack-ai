import { Router } from "express";
import { DriveStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { checkEligibility } from "../services/eligibility.js";
import { audit } from "../lib/audit.js";
import { emitToUser } from "../lib/socket.js";

export const drivesRouter = Router();

drivesRouter.use(authenticate);

// ─── Advanced Multi-Condition Filter Search ───────────────────────────────────
// Supports: branch, cgpa, minPkg, maxPkg, gradYear, company, status
// Skills filtering is client-side (no requiredSkills column on PlacementDrive)
drivesRouter.get("/search", async (request, response) => {
  const { branch, cgpa, minPkg, maxPkg, gradYear, company, status } = request.query;

  // Build Prisma WHERE clause dynamically — only include defined filters
  const where: Record<string, unknown> = {};

  if (branch && typeof branch === "string") {
    where.allowedBranches = { has: branch };
  }
  if (cgpa && !isNaN(Number(cgpa))) {
    // student CGPA must meet drive's minCgpa: student.cgpa >= drive.minCgpa ↔ drive.minCgpa <= student.cgpa
    where.minCgpa = { lte: Number(cgpa) };
  }
  if (minPkg && !isNaN(Number(minPkg))) {
    where.package = { ...((where.package as object) ?? {}), gte: Number(minPkg) };
  }
  if (maxPkg && !isNaN(Number(maxPkg))) {
    where.package = { ...((where.package as object) ?? {}), lte: Number(maxPkg) };
  }
  if (gradYear && !isNaN(Number(gradYear))) {
    where.graduationYear = { equals: Number(gradYear) };
  }
  if (company && typeof company === "string") {
    where.company = { name: { contains: company, mode: "insensitive" } };
  }
  if (status && typeof status === "string") {
    where.status = status;
  } else if (request.auth!.role === "STUDENT") {
    // Students only see open drives by default
    where.status = "OPEN";
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: request.auth!.userId },
      include: { student: true }
    });
    const appliedDriveIds = user?.student
      ? new Set(
          (await prisma.application.findMany({
            where: { studentId: user.student.id },
            select: { driveId: true }
          })).map((item) => item.driveId)
        )
      : new Set<string>();

    const drives = await prisma.placementDrive.findMany({
      where,
      include: { company: true, _count: { select: { applications: true } } },
      orderBy: { package: "desc" }
    });

    const data = drives.map((drive) => ({
      ...drive,
      eligibility: user?.student ? checkEligibility(user.student, drive) : null,
      alreadyApplied: appliedDriveIds.has(drive.id)
    }));

    response.json(data);
  } catch (error) {
    response.status(500).json({ error: "Filter query failed", detail: String(error) });
  }
});

drivesRouter.get("/", async (request, response) => {
  const user = await prisma.user.findUnique({ where: { id: request.auth!.userId }, include: { student: true } });
  const appliedDriveIds = user?.student
    ? new Set((await prisma.application.findMany({ where: { studentId: user.student.id }, select: { driveId: true } })).map((item) => item.driveId))
    : new Set<string>();
  const drives = await prisma.placementDrive.findMany({
    where: request.auth!.role === UserRole.STUDENT ? { status: DriveStatus.OPEN } : undefined,
    include: { company: true, _count: { select: { applications: true } } },
    orderBy: { deadline: "asc" }
  });
  const data = drives.map((drive) => ({
    ...drive,
    eligibility: user?.student ? checkEligibility(user.student, drive) : null,
    alreadyApplied: appliedDriveIds.has(drive.id)
  }));
  response.json(data);
});

drivesRouter.get("/:id", async (request, response) => {
  const drive = await prisma.placementDrive.findUnique({
    where: { id: String(request.params.id) },
    include: { company: true, applications: { include: { student: { include: { user: { select: { email: true } } } } } } }
  });
  if (!drive) return response.status(404).json({ error: "Drive not found" });
  response.json(drive);
});

const driveSchema = z.object({
  company: z.object({ name: z.string().min(2), website: z.string().url().optional(), description: z.string().optional() }),
  role: z.string().min(2),
  package: z.number().positive(),
  location: z.string().min(2),
  jobType: z.string().default("Full-time"),
  description: z.string().min(10),
  minCgpa: z.number().min(0).max(10),
  allowedBranches: z.array(z.string()).min(1),
  maxBacklogs: z.number().int().min(0),
  graduationYear: z.number().int(),
  deadline: z.coerce.date(),
  testDate: z.coerce.date().optional(),
  interviewDate: z.coerce.date().optional(),
  status: z.nativeEnum(DriveStatus).default(DriveStatus.OPEN)
});

drivesRouter.post("/", authorize(UserRole.COORDINATOR, UserRole.ADMIN), async (request, response) => {
  const input = driveSchema.parse(request.body);
  const { company, ...driveInput } = input;
  const drive = await prisma.placementDrive.create({
    data: {
      ...driveInput,
      company: {
        connectOrCreate: {
          where: { name: company.name },
          create: company
        }
      }
    },
    include: { company: true }
  });
  await audit(request.auth!.userId, "CREATE", "placement-drive", { driveId: drive.id });

  // Find all eligible students and send notifications
  try {
    const students = await prisma.student.findMany();
    for (const student of students) {
      const eligibility = checkEligibility(student, drive);
      if (eligibility.eligible) {
        const notification = await prisma.notification.create({
          data: {
            userId: student.userId,
            title: "New Eligible Drive",
            message: `${drive.company.name} is hiring for ${drive.role}`
          }
        });
        emitToUser(student.userId, "drive:new", notification);
      }
    }
  } catch (error) {
    console.error("Failed to notify eligible students for new drive:", error);
  }

  response.status(201).json(drive);
});
