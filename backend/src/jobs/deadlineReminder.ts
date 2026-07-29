import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { emitToUser } from "../lib/socket.js";

export function initDeadlineReminderJob() {
  // Cron schedule running once per day at 08:00
  cron.schedule("0 8 * * *", async () => {
    console.log("[Cron Job] Running automated drive deadline and date reminders...");
    await runDeadlineReminders();
  });
}

export async function runDeadlineReminders() {
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    // 1. Deadline reminders
    const deadlineApps = await prisma.application.findMany({
      where: {
        drive: {
          deadline: {
            gte: now,
            lte: next24h
          }
        }
      },
      include: {
        student: true,
        drive: { include: { company: true } }
      }
    });

    for (const app of deadlineApps) {
      const notification = await prisma.notification.create({
        data: {
          userId: app.student.userId,
          title: "Deadline Reminder",
          message: `Reminder: Application deadline for ${app.drive.company.name} is tomorrow.`
        }
      });
      emitToUser(app.student.userId, "application:status_changed", notification);
    }

    // 2. Test date reminders
    const testApps = await prisma.application.findMany({
      where: {
        drive: {
          testDate: {
            gte: now,
            lte: next24h
          }
        }
      },
      include: {
        student: true,
        drive: { include: { company: true } }
      }
    });

    for (const app of testApps) {
      const notification = await prisma.notification.create({
        data: {
          userId: app.student.userId,
          title: "Test Reminder",
          message: `Reminder: Test for ${app.drive.company.name} is scheduled for tomorrow.`
        }
      });
      emitToUser(app.student.userId, "application:status_changed", notification);
    }

    // 3. Interview date reminders
    const interviewApps = await prisma.application.findMany({
      where: {
        drive: {
          interviewDate: {
            gte: now,
            lte: next24h
          }
        }
      },
      include: {
        student: true,
        drive: { include: { company: true } }
      }
    });

    for (const app of interviewApps) {
      const notification = await prisma.notification.create({
        data: {
          userId: app.student.userId,
          title: "Interview Reminder",
          message: `Reminder: Interview for ${app.drive.company.name} is scheduled for tomorrow.`
        }
      });
      emitToUser(app.student.userId, "interview:scheduled", notification);
    }

    console.log(
      `[Cron Job] Sent ${deadlineApps.length} deadline, ${testApps.length} test, and ${interviewApps.length} interview reminders.`
    );
  } catch (error) {
    console.error("[Cron Job] Failed to run deadline reminders:", error);
  }
}
