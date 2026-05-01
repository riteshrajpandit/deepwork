"use client";
// ── Integrated notifications hook ────────────────────────────────────────────

import { useState, useCallback, useEffect } from "react";
import { notificationApi, ApiError } from "@/lib/api";
import type { AppNotification } from "@/lib/types";

export function useNotifications(activeOrgId: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    try {
      const data = await notificationApi.list(activeOrgId);
      const mapped: AppNotification[] = data.map(n => ({
        id: n.id,
        userId: n.recipient,
        message: n.message,
        read: n.is_read,
        timestamp: n.created_at,
      }));
      setNotifications(mapped);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  const markNotificationRead = useCallback(async (id: string) => {
    if (!activeOrgId) return;
    try {
      await notificationApi.markRead(activeOrgId, id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to mark read");
    }
  }, [activeOrgId]);

  const clearNotifications = useCallback(async () => {
    if (!activeOrgId) return;
    try {
      await notificationApi.clearAll(activeOrgId);
      setNotifications([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to clear notifications");
    }
  }, [activeOrgId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, loading, error, markNotificationRead, clearNotifications, fetchNotifications };
}
