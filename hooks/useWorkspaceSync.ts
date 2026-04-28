"use client";
// ── Fetches all workspace data for the active org and populates shared state ─

import { useState, useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import { orgApi, teamApi, projectApi, todoApi, ApiError } from "@/lib/api";
import type { OrgMember, ApiTask, ApiTaskDetail } from "@/lib/api";
import type { User, Project, Team, Task, Organization } from "@/lib/types";
import {
  mapOrgMemberToUser,
  mapProjectStatus,
  mapSubtask,
  deriveParentStatus,
  derivePriority,
  statusFromProgress,
  uniqueIds,
} from "@/lib/mappers";

type WorkspaceState = {
  organization: Organization;
  users: User[];
  teams: Team[];
  projects: Project[];
  tasks: Task[];
  coreLoading: boolean;
  coreError: string | null;
};

type WorkspaceSyncResult = WorkspaceState & {
  refreshCore: () => Promise<void>;
  setCoreError: (msg: string | null) => void;
  setOrganization: Dispatch<SetStateAction<Organization>>;
  setTasks: Dispatch<SetStateAction<Task[]>>;
};

export function useWorkspaceSync(
  currentUser: User | null,
): WorkspaceSyncResult {
  const [organization, setOrganization] = useState<Organization>({ id: "", name: "" });
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [coreLoading, setCoreLoading] = useState(false);
  const [coreError, setCoreError] = useState<string | null>(null);

  const activeOrgId = currentUser?.orgId ?? "";

  const refreshCore = useCallback(async () => {
    if (!activeOrgId) return;
    setCoreLoading(true);
    setCoreError(null);

    try {
      const [orgDetail, members, teamsData, projectsData] = await Promise.all([
        orgApi.get(activeOrgId),
        orgApi.listMembers(activeOrgId).catch(() => [] as OrgMember[]),
        teamApi.list(activeOrgId).catch(() => []),
        projectApi.list(activeOrgId).catch(() => []),
      ]);

      setOrganization({ id: orgDetail.id, name: orgDetail.name });

      // Build user map — seeded from org members
      const userMap = new Map<string, User>();
      members.forEach((m) => userMap.set(m.user, mapOrgMemberToUser(m, activeOrgId)));
      if (currentUser) userMap.set(currentUser.id, { ...currentUser, orgId: activeOrgId });

      // Map teams
      const mappedTeams: Team[] = teamsData.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        orgId: activeOrgId,
        memberIds: team.members ?? [],
        leadId: team.lead ?? null,
      }));
      setTeams(mappedTeams);

      const teamMap = new Map(mappedTeams.map((t) => [t.id, t]));

      // Resolve project teams in parallel
      const projectTeamsList = await Promise.all(
        projectsData.map((p) =>
          projectApi.listTeams(activeOrgId, p.id).catch(() => []),
        ),
      );

      const mappedProjects: Project[] = projectsData.map((project, idx) => {
        const teamIds = (projectTeamsList[idx] ?? []).map((pt) => pt.team_id);
        const memberIds = uniqueIds(
          teamIds.flatMap((tid) => teamMap.get(tid)?.memberIds ?? []),
        );
        return {
          id: project.id,
          name: project.name,
          description: project.description ?? "",
          status: mapProjectStatus(project.status),
          teamIds,
          memberIds,
          deadline: project.deadline,
        };
      });
      setProjects(mappedProjects);

      // Fetch tasks for every project
      const allTasks: Task[] = [];

      for (const project of mappedProjects) {
        const apiTasks: ApiTask[] = await todoApi
          .list(activeOrgId, project.id)
          .catch(() => []);

        const details = await Promise.all(
          apiTasks.map((t) =>
            todoApi.get(activeOrgId, project.id, t.id).catch(() => null),
          ),
        );
        const detailMap = new Map<string, ApiTaskDetail>(
          details.filter(Boolean).map((d) => [d!.id, d!]),
        );

        for (const apiTask of apiTasks) {
          const detail = detailMap.get(apiTask.id);
          const buckets = detail?.subtasks;
          const flatSubtasks = buckets
            ? [...buckets.todo, ...buckets.in_progress, ...buckets.completed]
            : [];

          const uiSubtasks: Task[] = flatSubtasks.map((sub) =>
            mapSubtask(sub, apiTask, project.id, activeOrgId, userMap),
          );

          allTasks.push({
            id: apiTask.id,
            projectId: project.id,
            title: apiTask.title,
            status: uiSubtasks.length
              ? deriveParentStatus(uiSubtasks)
              : statusFromProgress(apiTask.progress),
            assigneeIds: uniqueIds(uiSubtasks.flatMap((s) => s.assigneeIds)),
            dueDate: apiTask.deadline,
            priority: uiSubtasks.length ? derivePriority(uiSubtasks) : "Medium",
            teamId: apiTask.assigned_team,
          });

          allTasks.push(...uiSubtasks);
        }
      }

      setTasks(allTasks);
      setUsers(Array.from(userMap.values()));
    } catch (err) {
      setCoreError(
        err instanceof ApiError ? err.message : "Failed to load workspace data.",
      );
    } finally {
      setCoreLoading(false);
    }
  }, [activeOrgId, currentUser]);

  useEffect(() => {
    if (!activeOrgId) return;
    refreshCore();
  }, [activeOrgId, refreshCore]);

  return {
    organization,
    setOrganization,
    users,
    teams,
    projects,
    tasks,
    setTasks,
    coreLoading,
    coreError,
    setCoreError,
    refreshCore,
  };
}
