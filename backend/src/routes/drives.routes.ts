import { Router } from "express";
import { DriveStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { checkEligibility } from "../services/eligibility.js";
import { audit } from "../lib/audit.js";

export const drivesRouter = Router();

drivesRouter.use(authenticate);

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
  response.status(201).json(drive);
});
