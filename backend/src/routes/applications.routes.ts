import { Router } from "express";
import { ApplicationStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { audit } from "../lib/audit.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { checkEligibility } from "../services/eligibility.js";
import { emitToUser } from "../lib/socket.js";
import { sendEmail, getEmailTemplate } from "../services/mailer.js";

export const applicationsRouter = Router();
applicationsRouter.use(authenticate);

applicationsRouter.get("/", async (request, response) => {
  if (request.auth!.role === UserRole.STUDENT) {
    const student = await prisma.student.findUnique({ where: { userId: request.auth!.userId } });
    if (!student) return response.status(404).json({ error: "Student profile not found" });
    return response.json(await prisma.application.findMany({
      where: { studentId: student.id },
      include: { drive: { include: { company: true } }, interview: true },
      orderBy: { updatedAt: "desc" }
    }));
  }
  response.json(await prisma.application.findMany({
    include: { student: { include: { user: { select: { email: true } } } }, drive: { include: { company: true } }, interview: true },
    orderBy: { updatedAt: "desc" }
  }));
});

applicationsRouter.post("/", authorize(UserRole.STUDENT), async (request, response) => {
  const { driveId } = z.object({ driveId: z.string() }).parse(request.body);
  const student = await prisma.student.findUnique({ where: { userId: request.auth!.userId } });
  const drive = await prisma.placementDrive.findUnique({ where: { id: driveId } });
  if (!student || !drive) return response.status(404).json({ error: "Student or drive not found" });
  const eligibility = checkEligibility(student, drive);
  if (!eligibility.eligible) return response.status(422).json({ error: "Not eligible", reasons: eligibility.reasons });
  const timeline = [{ status: ApplicationStatus.APPLIED, at: new Date().toISOString(), note: "Application submitted" }];
  const application = await prisma.application.create({
    data: { studentId: student.id, driveId, timeline },
    include: { drive: { include: { company: true } } }
  });
  await Promise.all([
    prisma.notification.create({ data: { userId: request.auth!.userId, title: "Application submitted", message: `${application.drive.company.name} · ${application.drive.role}` } }),
    audit(request.auth!.userId, "CREATE", "application", { applicationId: application.id, driveId })
  ]);
  response.status(201).json(application);
});

applicationsRouter.patch("/:id/status", authorize(UserRole.COORDINATOR, UserRole.ADMIN), async (request, response) => {
  const input = z.object({ status: z.nativeEnum(ApplicationStatus), note: z.string().max(500).optional() }).parse(request.body);
  const current = await prisma.application.findUnique({
    where: { id: String(request.params.id) },
    include: { student: { include: { user: { select: { email: true } } } }, drive: { include: { company: true } } }
  });
  if (!current) return response.status(404).json({ error: "Application not found" });
  const timeline = Array.isArray(current.timeline) ? current.timeline : [];
  const application = await prisma.application.update({
    where: { id: current.id },
    data: { status: input.status, timeline: [...timeline, { status: input.status, at: new Date().toISOString(), note: input.note ?? "Status updated" }] }
  });
  
  const notification = await prisma.notification.create({
    data: { userId: current.student.userId, title: "Application status updated", message: `${current.drive.company.name}: ${input.status.replaceAll("_", " ")}` }
  });
  
  await audit(request.auth!.userId, "UPDATE_STATUS", "application", { applicationId: current.id, status: input.status });
  emitToUser(current.student.userId, "application:status_changed", notification);

  // Send status update email if SELECTED or REJECTED
  if (current.student.emailEnabled && (input.status === ApplicationStatus.SELECTED || input.status === ApplicationStatus.REJECTED)) {
    const isSelected = input.status === ApplicationStatus.SELECTED;
    const title = isSelected ? "Congratulations! You are Selected" : "Application Update";
    const bodyContent = isSelected
      ? `<p>Dear ${current.student.name},</p>
         <p>We are thrilled to inform you that you have been <b>selected</b> for the role of <b>${current.drive.role}</b> at <b>${current.drive.company.name}</b>!</p>
         <p>Congratulations on your placement! The coordinator will get in touch with you regarding the next steps.</p>`
      : `<p>Dear ${current.student.name},</p>
         <p>Thank you for your interest in the <b>${current.drive.role}</b> position at <b>${current.drive.company.name}</b>.</p>
         <p>Unfortunately, you were not selected for this role. We appreciate the time and effort you put into the application process. Keep preparing and best of luck for future opportunities!</p>`;

    const emailHtml = getEmailTemplate(title, bodyContent);
    sendEmail({
      to: current.student.user.email,
      subject: `[PlaceTrack] ${title} - ${current.drive.company.name}`,
      html: emailHtml
    }).catch((err) => console.error("Failed to send status update email:", err));
  }
  
  response.json(application);
});

applicationsRouter.post("/:id/interview", authorize(UserRole.COORDINATOR, UserRole.ADMIN), async (request, response) => {
  const input = z.object({
    dateTime: z.coerce.date(), mode: z.enum(["ONLINE", "OFFLINE"]), locationOrLink: z.string().min(3)
  }).parse(request.body);
  const application = await prisma.application.findUnique({
    where: { id: String(request.params.id) },
    include: { student: { include: { user: { select: { email: true } } } }, drive: { include: { company: true } } }
  });
  if (!application) return response.status(404).json({ error: "Application not found" });
  const interview = await prisma.interview.upsert({
    where: { applicationId: application.id },
    create: { applicationId: application.id, ...input, status: "SCHEDULED" },
    update: { ...input, status: "SCHEDULED" }
  });
  
  const notification = await prisma.notification.create({
    data: { userId: application.student.userId, title: "Interview scheduled", message: `${application.drive.company.name} on ${input.dateTime.toLocaleString()}` }
  });
  
  await audit(request.auth!.userId, "SCHEDULE", "interview", { interviewId: interview.id });
  emitToUser(application.student.userId, "interview:scheduled", notification);

  // Send interview scheduled email
  if (application.student.emailEnabled) {
    const emailHtml = getEmailTemplate(
      "Interview Scheduled",
      `<p>Dear ${application.student.name},</p>
       <p>An interview has been scheduled for your application at <b>${application.drive.company.name}</b> for the role of <b>${application.drive.role}</b>.</p>
       <p><b>Details:</b></p>
       <ul style="padding-left: 20px; line-height: 1.8;">
         <li><b>Date & Time:</b> ${input.dateTime.toLocaleString()}</li>
         <li><b>Mode:</b> ${input.mode}</li>
         <li><b>Location / Link:</b> <a href="${input.locationOrLink.startsWith("http") ? input.locationOrLink : "#"}">${input.locationOrLink}</a></li>
       </ul>
       <p>Please prepare well and join on time.</p>`
    );
    sendEmail({
      to: application.student.user.email,
      subject: `[PlaceTrack] Interview Scheduled - ${application.drive.company.name}`,
      html: emailHtml
    }).catch((err) => console.error("Failed to send interview email:", err));
  }
  
  response.status(201).json(interview);
});
