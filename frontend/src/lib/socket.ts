import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

export function getSocket(token?: string | null): Socket {
  const activeToken = token ?? (typeof window !== "undefined" ? localStorage.getItem("placetrack-token") : null);

  if (socket) {
    // If the socket exists, ensure the auth token is updated
    if (activeToken) {
      socket.auth = { token: activeToken };
    }
    return socket;
  }

  socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: activeToken ? { token: activeToken } : undefined
  });

  return socket;
}
