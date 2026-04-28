// ── Domain types shared across the entire app ────────────────────────────────

export type OrgRole = "owner" | "admin" | "member";

export type User = {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  color: string;
  role: string;
  orgId?: string;
  orgRole?: OrgRole;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  status: "Todo" | "In Progress" | "Done";
  assigneeIds: string[];
  dueDate: string;
  priority: "Low" | "Medium" | "High";
  parentTaskId?: string;
  teamId?: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  status: "Active" | "Completed" | "Archived";
  teamIds: string[];
  memberIds: string[];
  deadline?: string | null;
};

export type Team = {
  id: string;
  name: string;
  description?: string;
  orgId: string;
  memberIds: string[];
  leadId?: string | null;
};

export type Organization = {
  id: string;
  name: string;
};

export type AppNotification = {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  timestamp: string;
  taskId?: string;
};

export type Discussion = {
  id: string;
  projectId: string | null;
  title: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  discussionId: string;
  authorId: string;
  content: string;
  timestamp: string;
};

export type FileNode = {
  id: string;
  projectId: string;
  type: "file" | "folder" | "upload";
  name: string;
  parentId: string | null;
  content?: string;
  fileData?: string;
  fileType?: string;
  uploaderId: string;
  attachedMemberIds?: string[];
  isArchived?: boolean;
};

// ── Status / priority enums (UI ↔ API mapping) ──────────────────────────────

export const UI_STATUS_BY_API: Record<string, Task["status"]> = {
  todo: "Todo",
  in_progress: "In Progress",
  completed: "Done",
};

export const API_STATUS_BY_UI: Record<Task["status"], "todo" | "in_progress" | "completed"> = {
  Todo: "todo",
  "In Progress": "in_progress",
  Done: "completed",
};

export const UI_PRIORITY_BY_API: Record<string, Task["priority"]> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const API_PRIORITY_BY_UI: Record<Task["priority"], "low" | "medium" | "high"> = {
  Low: "low",
  Medium: "medium",
  High: "high",
};

export const STATUS_ORDER: Task["status"][] = ["Todo", "In Progress", "Done"];
