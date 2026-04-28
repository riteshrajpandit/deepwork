"use client";
// ── Local-only discussions and messages state (no backend API yet) ───────────

import { useState, useCallback } from "react";
import type { Discussion, Message } from "@/lib/types";

const initialDiscussions: Discussion[] = [
  { id: "d1", projectId: null, title: "Platform Redesign - Design Sync", updatedAt: "2026-04-23T10:30:00" },
  { id: "d2", projectId: null, title: "General Announcements", updatedAt: "2026-04-22T08:15:00" },
];

const initialMessages: Message[] = [
  { id: "m1", discussionId: "d1", authorId: "", content: "Hey everyone, I uploaded the new wireframes. Could we review them today?", timestamp: "2026-04-23T09:00:00" },
  { id: "m2", discussionId: "d2", authorId: "", content: "Welcome to the new Trust & Peace workspace!", timestamp: "2026-04-22T08:15:00" },
];

export function useDiscussions() {
  const [discussions, setDiscussions] = useState<Discussion[]>(initialDiscussions);
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const addDiscussion = useCallback(
    (discussion: Pick<Discussion, "title" | "projectId">) => {
      setDiscussions((prev) => [
        { ...discussion, id: `d${Date.now()}`, updatedAt: new Date().toISOString() },
        ...prev,
      ]);
    },
    [],
  );

  const addMessage = useCallback(
    (message: Pick<Message, "discussionId" | "content" | "authorId">) => {
      const timestamp = new Date().toISOString();
      setMessages((prev) => [
        ...prev,
        { ...message, id: `m${Date.now()}`, timestamp },
      ]);
      setDiscussions((prev) =>
        prev
          .map((d) =>
            d.id === message.discussionId ? { ...d, updatedAt: timestamp } : d,
          )
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
      );
    },
    [],
  );

  return { discussions, messages, addDiscussion, addMessage };
}
