"use client";
// ── Thin orchestrator — composes domain hooks into a single context ──────────

import { createContext, useContext, useState, useMemo, useCallback } from "react";
import type { ReactNode } from "react";

import type { User, Project, Task, Team, Organization, AppNotification, Discussion, Message, FileNode } from "@/lib/types";
import { useWorkspaceSync } from "@/hooks/useWorkspaceSync";
import { useTaskActions } from "@/hooks/useTaskActions";
import { useProjectActions } from "@/hooks/useProjectActions";
import { useDiscussions } from "@/hooks/useDiscussions";
import { useFiles } from "@/hooks/useFiles";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { TaskModal } from "@/components/modals/TaskModal";

// Re-export types so existing imports like `import type { User } from "@/components/AppProvider"` keep working
export type { User, Project, Task, Team, Organization, AppNotification, Discussion, Message, FileNode };

// Re-export the helper so pages using `import { formatFriendlyDate } from "@/components/AppProvider"` keep working
export { formatFriendlyDate } from "@/lib/mappers";

// ── Context shape ────────────────────────────────────────────────────────────

type AppContextType = {
  // Auth
  currentUser: User | null;
  login: (id: string) => void;
  loginWithToken: (user: User) => void;
  logout: () => void;

  // Data-fetch status
  coreLoading: boolean;
  coreError: string | null;
  refreshCore: () => Promise<void>;

  // Workspace data
  organization: Organization;
  updateOrganization: (patch: Partial<Organization>) => void;
  users: User[];
  teams: Team[];
  addTeam: (t: { name: string; description?: string; memberIds: string[] }) => Promise<void>;
  updateTeamMembers: (id: string, members: string[]) => void;

  // Projects
  projects: Project[];
  addProject: (p: { name: string; description: string; deadline?: string | null; teamIds: string[] }) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
  linkTeamToProject: (projectId: string, teamId: string) => Promise<void>;

  // Tasks
  tasks: Task[];
  addTask: (t: { title: string; projectId: string; teamId: string; dueDate: string; priority: Task["priority"]; assigneeIds: string[]; subTaskTitles?: string[] }) => Promise<string>;
  addSubTask: (parentTaskId: string, t: { title: string; projectId: string; dueDate: string; priority: Task["priority"]; assigneeIds: string[] }) => Promise<void>;
  updateTaskStatus: (id: string, status: Task["status"]) => void;
  updateTaskAssignees: (id: string, assigneeIds: string[]) => void;

  // Notifications (local)
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Discussions (local)
  discussions: Discussion[];
  addDiscussion: (d: Pick<Discussion, "title" | "projectId">) => void;
  messages: Message[];
  addMessage: (m: Pick<Message, "discussionId" | "content" | "authorId">) => void;

  // Files (local)
  files: FileNode[];
  addFile: (f: Pick<FileNode, "projectId" | "type" | "name" | "parentId" | "content" | "fileData" | "fileType" | "attachedMemberIds">) => void;
  updateFileContent: (id: string, content: string) => void;
  archiveFile: (id: string) => void;
  restoreFile: (id: string) => void;

  // Modal state
  isProjectModalOpen: boolean;
  setProjectModalOpen: (open: boolean) => void;
  isTaskModalOpen: { open: boolean; projectId?: string; dateStr?: string };
  setTaskModalOpen: (state: { open: boolean; projectId?: string; dateStr?: string }) => void;
};

export const AppContext = createContext<AppContextType | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  // ── Auth state ─────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskModalOpen] = useState<{ open: boolean; projectId?: string; dateStr?: string }>({ open: false });

  // ── Domain hooks ───────────────────────────────────────────────────────────
  const workspace = useWorkspaceSync(currentUser);
  const activeOrgId = currentUser?.orgId ?? "";

  const taskActions = useTaskActions(
    activeOrgId,
    workspace.tasks,
    workspace.setTasks,
    workspace.setCoreError,
    workspace.refreshCore,
  );

  const projectActions = useProjectActions(
    activeOrgId,
    workspace.setCoreError,
    workspace.refreshCore,
  );

  const { discussions, messages, addDiscussion, addMessage } = useDiscussions();
  const { files, addFile, updateFileContent, archiveFile, restoreFile } = useFiles(
    currentUser?.id,
  );

  // ── Auth callbacks ─────────────────────────────────────────────────────────
  const login = useCallback(
    (id: string) => {
      const found = workspace.users.find((u) => u.id === id);
      if (found) setCurrentUser(found);
    },
    [workspace.users],
  );

  const loginWithToken = useCallback((user: User) => {
    setCurrentUser(user);
  }, []);

  const { setOrganization } = workspace;

  const logout = useCallback(() => {
    setCurrentUser(null);
    setOrganization({ id: "", name: "" });
  }, [setOrganization]);

  // ── Org callbacks ──────────────────────────────────────────────────────────
  const updateOrganization = useCallback(
    (patch: Partial<Organization>) => {
      setOrganization((prev) => ({ ...prev, ...patch }));
    },
    [setOrganization],
  );

  const updateTeamMembers = useCallback(
    (_id: string, _members: string[]) => {
      // Optimistic local update; refreshCore will reconcile
    },
    [],
  );

  // ── Notification callbacks ─────────────────────────────────────────────────
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications((prev) => prev.filter((n) => n.userId !== currentUser?.id));
  }, [currentUser?.id]);

  // ── Memoized context value ─────────────────────────────────────────────────
  const value = useMemo<AppContextType>(
    () => ({
      currentUser,
      login,
      loginWithToken,
      logout,

      coreLoading: workspace.coreLoading,
      coreError: workspace.coreError,
      refreshCore: workspace.refreshCore,

      organization: workspace.organization,
      updateOrganization,
      users: workspace.users,
      teams: workspace.teams,
      addTeam: projectActions.addTeam,
      updateTeamMembers,

      projects: workspace.projects,
      addProject: projectActions.addProject,
      archiveProject: projectActions.archiveProject,
      restoreProject: projectActions.restoreProject,
      linkTeamToProject: projectActions.linkTeamToProject,

      tasks: workspace.tasks,
      addTask: taskActions.addTask,
      addSubTask: taskActions.addSubTask,
      updateTaskStatus: taskActions.updateTaskStatus,
      updateTaskAssignees: taskActions.updateTaskAssignees,

      notifications,
      markNotificationRead,
      clearNotifications,

      discussions,
      addDiscussion,
      messages,
      addMessage,

      files,
      addFile,
      updateFileContent,
      archiveFile,
      restoreFile,

      isProjectModalOpen,
      setProjectModalOpen,
      isTaskModalOpen,
      setTaskModalOpen,
    }),
    [
      currentUser, login, loginWithToken, logout,
      workspace.coreLoading, workspace.coreError, workspace.refreshCore,
      workspace.organization, updateOrganization,
      workspace.users, workspace.teams,
      projectActions.addTeam, updateTeamMembers,
      workspace.projects, projectActions.addProject,
      projectActions.archiveProject, projectActions.restoreProject,
      projectActions.linkTeamToProject,
      workspace.tasks, taskActions.addTask, taskActions.addSubTask,
      taskActions.updateTaskStatus, taskActions.updateTaskAssignees,
      notifications, markNotificationRead, clearNotifications,
      discussions, addDiscussion, messages, addMessage,
      files, addFile, updateFileContent, archiveFile, restoreFile,
      isProjectModalOpen, isTaskModalOpen,
    ],
  );

  return (
    <AppContext.Provider value={value}>
      {children}

      {isProjectModalOpen && (
        <ProjectModal
          teams={workspace.teams}
          onAdd={projectActions.addProject}
          onClose={() => setProjectModalOpen(false)}
        />
      )}

      {isTaskModalOpen.open && (
        <TaskModal
          projects={workspace.projects}
          users={workspace.users}
          teams={workspace.teams}
          projectId={isTaskModalOpen.projectId}
          dateStr={isTaskModalOpen.dateStr}
          onAdd={taskActions.addTask}
          onClose={() => setTaskModalOpen({ open: false })}
        />
      )}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
};
