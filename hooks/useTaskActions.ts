"use client";
// ── Task and subtask mutations ───────────────────────────────────────────────

import { useCallback } from "react";
import { todoApi, ApiError } from "@/lib/api";
import type { Task } from "@/lib/types";
import { STATUS_ORDER, API_STATUS_BY_UI, API_PRIORITY_BY_UI } from "@/lib/types";
import { deriveParentStatus } from "@/lib/mappers";

type SetTasks = React.Dispatch<React.SetStateAction<Task[]>>;
type SetError = (msg: string | null) => void;

type AddTaskPayload = {
  title: string;
  projectId: string;
  teamId: string;
  dueDate: string;
  priority: Task["priority"];
  assigneeIds: string[];
  subTaskTitles?: string[];
};

type AddSubTaskPayload = {
  title: string;
  projectId: string;
  dueDate: string;
  priority: Task["priority"];
  assigneeIds: string[];
};

export function useTaskActions(
  activeOrgId: string,
  tasks: Task[],
  setTasks: SetTasks,
  setCoreError: SetError,
  refreshCore: () => Promise<void>,
) {
  const addTask = useCallback(
    async (payload: AddTaskPayload): Promise<string> => {
      if (!activeOrgId) return "";
      try {
        const created = await todoApi.create(activeOrgId, payload.projectId, {
          title: payload.title,
          assigned_team: payload.teamId,
          deadline: payload.dueDate,
        });

        if (payload.subTaskTitles?.length) {
          await Promise.all(
            payload.subTaskTitles.map((title) =>
              todoApi.createSubtask(activeOrgId, payload.projectId, created.id, {
                title,
                priority: API_PRIORITY_BY_UI[payload.priority],
                assignee_ids: payload.assigneeIds,
                deadline: payload.dueDate,
              }),
            ),
          );
        }

        await refreshCore();
        return created.id;
      } catch (err) {
        setCoreError(err instanceof ApiError ? err.message : "Failed to create task.");
        return "";
      }
    },
    [activeOrgId, refreshCore, setCoreError],
  );

  const addSubTask = useCallback(
    async (parentTaskId: string, payload: AddSubTaskPayload): Promise<void> => {
      if (!activeOrgId) return;
      try {
        await todoApi.createSubtask(activeOrgId, payload.projectId, parentTaskId, {
          title: payload.title,
          priority: API_PRIORITY_BY_UI[payload.priority],
          assignee_ids: payload.assigneeIds,
          deadline: payload.dueDate,
        });
        await refreshCore();
      } catch (err) {
        setCoreError(err instanceof ApiError ? err.message : "Failed to create subtask.");
      }
    },
    [activeOrgId, refreshCore, setCoreError],
  );

  const updateTaskStatus = useCallback(
    async (id: string, status: Task["status"]): Promise<void> => {
      if (!activeOrgId) return;
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const apiStatus = API_STATUS_BY_UI[status];

      try {
        if (task.parentTaskId) {
          // It's a subtask
          await todoApi.updateSubtaskStatus(
            activeOrgId,
            task.projectId,
            task.parentTaskId,
            task.id,
            apiStatus,
          );
        } else {
          // It's a parent task
          await todoApi.update(activeOrgId, task.projectId, task.id, {
            status: apiStatus,
          });
        }
        await refreshCore();
      } catch (err) {
        setCoreError(
          err instanceof ApiError ? err.message : "Failed to update task status.",
        );
      }
    },
    [activeOrgId, tasks, setCoreError, refreshCore],
  );

  const updateTaskAssignees = useCallback(
    (id: string, assigneeIds: string[]) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, assigneeIds } : t)),
      );
    },
    [setTasks],
  );

  return { addTask, addSubTask, updateTaskStatus, updateTaskAssignees };
}
