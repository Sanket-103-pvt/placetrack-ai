import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get("/", async (request, response) => {
  response.json(await prisma.notification.findMany({
    where: { userId: request.auth!.userId },
    orderBy: { createdAt: "desc" },
    take: 50
  }));
});

notificationsRouter.patch("/:id/read", async (request, response) => {
  const isAll = request.params.id === "all";
  const result = await prisma.notification.updateMany({
    where: isAll 
      ? { userId: request.auth!.userId, isRead: false }
      : { id: String(request.params.id), userId: request.auth!.userId },
    data: { isRead: true }
  });
  if (!isAll && !result.count) return response.status(404).json({ error: "Notification not found" });
  response.json({ success: true });
});
