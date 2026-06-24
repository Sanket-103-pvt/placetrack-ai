import { prisma } from "./prisma.js";

export async function audit(userId: string | undefined, action: string, resource: string, details?: object) {
  await prisma.activityLog.create({
    data: { userId, action, resource, details: details ?? undefined }
  });
}
