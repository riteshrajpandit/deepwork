"use client";
// ── Integrated file/document tree hook ───────────────────────────────────────

import { useState, useCallback, useEffect } from "react";
import { fileApi, ApiError } from "@/lib/api";
import type { FileNode } from "@/lib/types";

export function useFiles(activeOrgId: string, projectId: string, currentUserId?: string) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async (parentId?: string) => {
    if (!activeOrgId || !projectId) return;
    setLoading(true);
    try {
      const data = await fileApi.list(activeOrgId, projectId, parentId);
      const mapped: FileNode[] = data.map(n => ({
        id: n.id,
        projectId: n.project,
        type: n.type as "folder" | "file" | "upload",
        name: n.name,
        parentId: n.parent,
        content: n.content_html || undefined,
        uploaderId: n.uploaded_by,
        isArchived: n.is_archived,
        fileData: n.file || undefined,
        fileType: n.mime_type || undefined,
      }));
      setFiles(mapped);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, projectId]);

  const addFile = useCallback(
    async (
      f: Pick<
        FileNode,
        "type" | "name" | "parentId" | "content" | "fileData" | "attachedMemberIds"
      >,
    ) => {
      if (!activeOrgId || !projectId) return;
      try {
        if (f.type === "upload" && f.fileData) {
          const fd = new FormData();
          fd.append("name", f.name);
          fd.append("type", "upload");
          if (f.parentId) fd.append("parent", f.parentId);
          // Assuming fileData is a File object here
          fd.append("file", f.fileData as unknown as Blob); 
          await fileApi.upload(activeOrgId, projectId, fd);
        } else {
          await fileApi.create(activeOrgId, projectId, {
            name: f.name,
            type: f.type,
            parent: f.parentId,
            content_html: f.content,
          });
        }
        await fetchFiles(f.parentId || undefined);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to add file");
      }
    },
    [activeOrgId, projectId, fetchFiles],
  );

  const updateFileContent = useCallback(async (id: string, content: string) => {
    if (!activeOrgId) return;
    try {
      await fileApi.update(activeOrgId, id, { content_html: content });
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, content } : f)),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update content");
    }
  }, [activeOrgId]);

  const archiveFile = useCallback(async (id: string) => {
    if (!activeOrgId) return;
    try {
      await fileApi.update(activeOrgId, id, { is_archived: true });
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, isArchived: true } : f)),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to archive file");
    }
  }, [activeOrgId]);

  const restoreFile = useCallback(async (id: string) => {
    if (!activeOrgId) return;
    try {
      await fileApi.update(activeOrgId, id, { is_archived: false });
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, isArchived: false } : f)),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to restore file");
    }
  }, [activeOrgId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return { files, loading, error, addFile, updateFileContent, archiveFile, restoreFile, fetchFiles };
}
