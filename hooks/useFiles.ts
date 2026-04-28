"use client";
// ── Local-only file/document tree state (no backend API yet) ─────────────────

import { useState, useCallback } from "react";
import type { FileNode } from "@/lib/types";

const initialFiles: FileNode[] = [
  {
    id: "f1",
    projectId: "",
    type: "folder",
    name: "Design Specs",
    parentId: null,
    uploaderId: "",
  },
];

export function useFiles(currentUserId?: string) {
  const [files, setFiles] = useState<FileNode[]>(initialFiles);

  const addFile = useCallback(
    (
      f: Pick<
        FileNode,
        "projectId" | "type" | "name" | "parentId" | "content" | "fileData" | "fileType" | "attachedMemberIds"
      >,
    ) => {
      setFiles((prev) => [
        ...prev,
        { ...f, id: `f${Date.now()}`, uploaderId: currentUserId ?? "system" },
      ]);
    },
    [currentUserId],
  );

  const updateFileContent = useCallback((id: string, content: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, content } : f)),
    );
  }, []);

  const archiveFile = useCallback((id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isArchived: true } : f)),
    );
  }, []);

  const restoreFile = useCallback((id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isArchived: false } : f)),
    );
  }, []);

  return { files, addFile, updateFileContent, archiveFile, restoreFile };
}
