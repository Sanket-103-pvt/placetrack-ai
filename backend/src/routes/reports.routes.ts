import { Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { audit } from "../lib/audit.js";

export const reportsRouter = Router();
reportsRouter.use(authenticate, authorize(UserRole.COORDINATOR, UserRole.ADMIN));

const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

reportsRouter.get("/applications.csv", async (request, response) => {
  const applications = await prisma.application.findMany({
    include: { student: { include: { user: true } }, drive: { include: { company: true } }, interview: true },
    orderBy: { appliedAt: "desc" }
  });
  const rows = [
    ["Student", "Email", "Branch", "CGPA", "Company", "Role", "Package LPA", "Status", "Applied At", "Interview At"],
    ...applications.map((item) => [
      item.student.name, item.student.user.email, item.student.branch, item.student.cgpa,
      item.drive.company.name, item.drive.role, item.drive.package, item.status,
      item.appliedAt.toISOString(), item.interview?.dateTime.toISOString() ?? ""
    ])
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  await audit(request.auth!.userId, "EXPORT", "applications-report", { rows: applications.length });
  response.setHeader("Content-Type", "text/csv; charset=utf-8");
  response.setHeader("Content-Disposition", `attachment; filename="placetrack-applications-${new Date().toISOString().slice(0, 10)}.csv"`);
  response.send(csv);
});

reportsRouter.get("/students.csv", async (request, response) => {
  const students = await prisma.student.findMany({ include: { user: true, _count: { select: { applications: true, testResults: true } } }, orderBy: { name: "asc" } });
  const rows = [
    ["Student", "Email", "Branch", "CGPA", "Backlogs", "Batch", "Readiness", "Applications", "Tests", "Skills"],
    ...students.map((item) => [
      item.name, item.user.email, item.branch, item.cgpa, item.backlogs, item.graduationYear,
      item.readinessScore, item._count.applications, item._count.testResults, item.skills.join("; ")
    ])
  ];
  response.setHeader("Content-Type", "text/csv; charset=utf-8");
  response.setHeader("Content-Disposition", `attachment; filename="placetrack-students-${new Date().toISOString().slice(0, 10)}.csv"`);
  response.send(rows.map((row) => row.map(csvCell).join(",")).join("\r\n"));
});
