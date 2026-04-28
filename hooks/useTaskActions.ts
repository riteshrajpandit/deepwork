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

      // Steps through the status state machine one step at a time
      const advanceSubtask = async (
        subtask: Task,
        target: Task["status"],
      ): Promise<Task["status"]> => {
        const currentIdx = STATUS_ORDER.indexOf(subtask.status);
        const targetIdx = STATUS_ORDER.indexOf(target);
        if (targetIdx <= currentIdx) return subtask.status;

        let updatedStatus = subtask.status;
        for (let i = currentIdx + 1; i <= targetIdx; i++) {
          const nextStatus = STATUS_ORDER[i];
          try {
            await todoApi.updateSubtaskStatus(
              activeOrgId,
              subtask.projectId,
              subtask.parentTaskId as string,
              subtask.id,
              API_STATUS_BY_UI[nextStatus],
            );
            updatedStatus = nextStatus;
          } catch (err) {
            setCoreError(
              err instanceof ApiError ? err.message : "Failed to update subtask status.",
            );
            break;
          }
        }
        return updatedStatus;
      };

      // Parent task: advance all children
      if (!task.parentTaskId) {
        const children = tasks.filter((t) => t.parentTaskId === task.id);
        if (children.length === 0) return;

        const updated = new Map<string, Task["status"]>();
        for (const child of children) {
          updated.set(child.id, await advanceSubtask(child, status));
        }

        setTasks((prev) => {
          const next = prev.map((t) =>
            updated.has(t.id) ? { ...t, status: updated.get(t.id)! } : t,
          );
          const refreshedChildren = next.filter((t) => t.parentTaskId === task.id);
          const parentStatus = deriveParentStatus(refreshedChildren);
          return next.map((t) => (t.id === task.id ? { ...t, status: parentStatus } : t));
        });
        return;
      }

      // Subtask: advance itself then re-derive parent
      const nextStatus = await advanceSubtask(task, status);
      setTasks((prev) => {
        const next = prev.map((t) =>
          t.id === task.id ? { ...t, status: nextStatus } : t,
        );
        const parentId = task.parentTaskId as string;
        const siblings = next.filter((t) => t.parentTaskId === parentId);
        const parentStatus = deriveParentStatus(siblings);
        return next.map((t) =>
          t.id === parentId ? { ...t, status: parentStatus } : t,
        );
      });
    },
    [activeOrgId, tasks, setTasks, setCoreError],
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
