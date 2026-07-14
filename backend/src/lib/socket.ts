import { Server } from "socket.io";
import jwt from "jsonwebtoken";

type TokenPayload = { sub: string; role: string };

let io: Server | null = null;
export const connectedUsers = new Map<string, string>(); // userId -> socket.id

export function initSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: "*",
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      let rawToken = token;
      if (rawToken.startsWith("Bearer ")) {
        rawToken = rawToken.slice(7);
      }
      const payload = jwt.verify(
        rawToken,
        process.env.JWT_SECRET ?? "development-secret-change-me"
      ) as TokenPayload;
      
      (socket as any).userId = payload.sub;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).userId;
    if (userId) {
      connectedUsers.set(userId, socket.id);
      socket.join(userId);
      console.log(`Socket client connected: ${socket.id} for user ${userId}`);
    }

    socket.on("disconnect", () => {
      if (userId && connectedUsers.get(userId) === socket.id) {
        connectedUsers.delete(userId);
      }
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function emitToUser(userId: string, event: string, data: any) {
  if (!io) {
    console.warn("Socket.io is not initialized. Cannot emit event:", event);
    return false;
  }
  io.to(userId).emit(event, data);
  console.log(`Emitted event "${event}" to user ${userId}`);
  return true;
}
