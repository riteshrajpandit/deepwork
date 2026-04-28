// ── Pure transform functions: API DTOs → UI domain types ────────────────────
// No side-effects, no React imports. Safe to use anywhere.

import { toAbsoluteUrl } from "@/lib/api";
import type { OrgMember, ApiTask, ApiSubTask } from "@/lib/api";
import type { User, Task, Project, Team } from "@/lib/types";
import {
  UI_STATUS_BY_API,
  UI_PRIORITY_BY_API,
  STATUS_ORDER,
} from "@/lib/types";

export const roleColors: Record<string, string> = {
  owner: "bg-primary",
  admin: "bg-secondary",
  member: "bg-tertiary",
};

export function mapOrgMemberToUser(member: OrgMember, orgId: string): User {
  const name = member.user_full_name?.trim() || member.user_email;
  const avatar =
    toAbsoluteUrl(member.user_avatar) ??
    `https://api.dicebear.com/7.x/initials/svg?seed=${member.user_email}`;
  return {
    id: member.user,
    name,
    email: member.user_email,
    avatar,
    color: roleColors[member.role] ?? "bg-primary",
    role: member.role,
    orgId,
    orgRole: member.role as User["orgRole"],
  };
}

export function mapProjectStatus(status: string): Project["status"] {
  if (status === "completed") return "Completed";
  if (status === "archived") return "Archived";
  return "Active";
}

export function deriveParentStatus(subtasks: Task[]): Task["status"] {
  if (subtasks.length === 0) return "Todo";
  if (subtasks.every((t) => t.status === "Done")) return "Done";
  if (subtasks.some((t) => t.status === "In Progress")) return "In Progress";
  return "Todo";
}

export function derivePriority(subtasks: Task[]): Task["priority"] {
  if (subtasks.some((t) => t.priority === "High")) return "High";
  if (subtasks.some((t) => t.priority === "Medium")) return "Medium";
  if (subtasks.some((t) => t.priority === "Low")) return "Low";
  return "Medium";
}

export function statusFromProgress(progress: {
  total: number;
  in_progress: number;
  completed: number;
}): Task["status"] {
  if (!progress.total) return "Todo";
  if (progress.completed === progress.total) return "Done";
  if (progress.in_progress > 0) return "In Progress";
  return "Todo";
}

export function uniqueIds(list: string[]): string[] {
  return Array.from(new Set(list));
}

// Maps a flat ApiSubTask onto UI Task, also populates the shared userMap
export function mapSubtask(
  subtask: ApiSubTask,
  parentTask: ApiTask,
  projectId: string,
  orgId: string,
  userMap: Map<string, User>,
): Task {
  subtask.assignees.forEach((assignee) => {
    if (userMap.has(assignee.user)) return;
    userMap.set(assignee.user, {
      id: assignee.user,
      name: assignee.user_full_name?.trim() || assignee.user_email,
      email: assignee.user_email,
      avatar:
        toAbsoluteUrl(assignee.user_avatar) ??
        `https://api.dicebear.com/7.x/initials/svg?seed=${assignee.user_email}`,
      color: roleColors.member,
      role: "member",
      orgId,
      orgRole: "member",
    });
  });

  return {
    id: subtask.id,
    projectId,
    parentTaskId: parentTask.id,
    title: subtask.title,
    status: UI_STATUS_BY_API[subtask.status],
    assigneeIds: subtask.assignees.map((a) => a.user),
    dueDate: subtask.deadline ?? parentTask.deadline,
    priority: UI_PRIORITY_BY_API[subtask.priority],
  };
}

export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return "";
  const today = new Date();
  const toISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayStr = toISO(today);
  const tomorrowStr = toISO(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
  );
  const yesterdayStr = toISO(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
  );
  if (dateStr === todayStr) return "Today";
  if (dateStr === tomorrowStr) return "Tomorrow";
  if (dateStr === yesterdayStr) return "Yesterday";
  const d = new Date(dateStr);
  if (isNaN(d.valueOf())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
