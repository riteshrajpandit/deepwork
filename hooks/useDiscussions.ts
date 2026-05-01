"use client";
// ── Integrated discussions and messages hook ─────────────────────────────────

import { useState, useCallback, useEffect } from "react";
import { discussionApi, ApiError } from "@/lib/api";
import type { Discussion, Message } from "@/lib/types";

export function useDiscussions(activeOrgId: string, projectId?: string) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiscussions = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    try {
      const data = await discussionApi.list(activeOrgId, projectId);
      // Map backend ApiDiscussion to frontend Discussion type if necessary
      const mapped: Discussion[] = data.map(d => ({
        id: d.id,
        projectId: d.project,
        title: d.title,
        updatedAt: d.last_message_at || d.created_at,
      }));
      setDiscussions(mapped);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load discussions");
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, projectId]);

  const fetchMessages = useCallback(async (discussionId: string) => {
    if (!activeOrgId) return;
    try {
      const data = await discussionApi.listMessages(activeOrgId, discussionId);
      const mapped: Message[] = data.map(m => ({
        id: m.id,
        discussionId: m.discussion,
        authorId: m.author,
        authorName: m.author_name,
        content: m.content,
        timestamp: m.created_at,
      }));
      setMessages(mapped);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load messages");
    }
  }, [activeOrgId]);

  const addDiscussion = useCallback(
    async (payload: { title: string; projectId?: string | null }) => {
      if (!activeOrgId) return;
      try {
        await discussionApi.create(activeOrgId, {
          title: payload.title,
          project: payload.projectId || projectId || null,
        });
        await fetchDiscussions();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to create discussion");
      }
    },
    [activeOrgId, projectId, fetchDiscussions],
  );

  const addMessage = useCallback(
    async (payload: { discussionId: string; content: string }) => {
      if (!activeOrgId) return;
      try {
        await discussionApi.sendMessage(activeOrgId, payload.discussionId, payload.content);
        await fetchMessages(payload.discussionId);
        // Refresh discussions to update last_message_at
        await fetchDiscussions();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to send message");
      }
    },
    [activeOrgId, fetchMessages, fetchDiscussions],
  );

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  return { discussions, messages, loading, error, addDiscussion, addMessage, fetchMessages };
}
