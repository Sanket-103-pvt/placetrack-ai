import { useCallback, useEffect, useState } from "react";
import { getSocket } from "../lib/socket";
import { api } from "../lib/api";

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications(token: string | null, initialNotifications: Notification[] = []) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  // Sync initial notifications if they are loaded from auth/me
  useEffect(() => {
    if (initialNotifications && initialNotifications.length > 0) {
      setNotifications(initialNotifications);
    }
  }, [initialNotifications]);

  // Fetch full notifications list from API
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api<Notification[]>("/api/notifications", token);
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    fetchNotifications();

    const socket = getSocket(token);

    if (!socket.connected) {
      socket.connect();
    }

    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
    };

    socket.on("application:status_changed", handleNewNotification);
    socket.on("interview:scheduled", handleNewNotification);
    socket.on("drive:new", handleNewNotification);

    return () => {
      socket.off("application:status_changed", handleNewNotification);
      socket.off("interview:scheduled", handleNewNotification);
      socket.off("drive:new", handleNewNotification);
    };
  }, [token, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    if (!token) return;
    try {
      await api(`/api/notifications/${id}/read`, token, {
        method: "PATCH"
      });
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, [token]);

  const markAllAsRead = useCallback(async () => {
    if (!token) return;
    try {
      await api("/api/notifications/all/read", token, {
        method: "PATCH"
      });
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, [token]);

  return {
    notifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications
  };
}
