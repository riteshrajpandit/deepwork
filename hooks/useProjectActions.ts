"use client";
// ── Project mutations: create, archive, restore, link team ───────────────────

import { useCallback } from "react";
import { projectApi, teamApi, ApiError } from "@/lib/api";

type SetError = (msg: string | null) => void;

type AddProjectPayload = {
  name: string;
  description: string;
  deadline?: string | null;
  teamIds: string[];
};

type AddTeamPayload = {
  name: string;
  description?: string;
  memberIds: string[];
};

export function useProjectActions(
  activeOrgId: string,
  setCoreError: SetError,
  refreshCore: () => Promise<void>,
) {
  const addProject = useCallback(
    async (payload: AddProjectPayload): Promise<void> => {
      if (!activeOrgId) return;
      try {
        const created = await projectApi.create(activeOrgId, {
          name: payload.name,
          description: payload.description,
          deadline: payload.deadline ?? null,
        });

        if (payload.teamIds.length > 0) {
          await projectApi.attachTeams(activeOrgId, created.id, payload.teamIds);
        }

        await refreshCore();
      } catch (err) {
        setCoreError(err instanceof ApiError ? err.message : "Failed to create project.");
      }
    },
    [activeOrgId, refreshCore, setCoreError],
  );

  const archiveProject = useCallback(
    async (id: string): Promise<void> => {
      if (!activeOrgId) return;
      try {
        await projectApi.updateStatus(activeOrgId, id, "archived");
        await refreshCore();
      } catch (err) {
        setCoreError(err instanceof ApiError ? err.message : "Failed to archive project.");
      }
    },
    [activeOrgId, refreshCore, setCoreError],
  );

  const restoreProject = useCallback(
    async (id: string): Promise<void> => {
      if (!activeOrgId) return;
      try {
        await projectApi.updateStatus(activeOrgId, id, "active");
        await refreshCore();
      } catch (err) {
        setCoreError(err instanceof ApiError ? err.message : "Failed to restore project.");
      }
    },
    [activeOrgId, refreshCore, setCoreError],
  );

  const linkTeamToProject = useCallback(
    async (projectId: string, teamId: string): Promise<void> => {
      if (!activeOrgId) return;
      try {
        await projectApi.attachTeams(activeOrgId, projectId, [teamId]);
        await refreshCore();
      } catch (err) {
        setCoreError(err instanceof ApiError ? err.message : "Failed to attach team.");
      }
    },
    [activeOrgId, refreshCore, setCoreError],
  );

  const addTeam = useCallback(
    async (payload: AddTeamPayload): Promise<void> => {
      if (!activeOrgId) return;
      try {
        await teamApi.create(activeOrgId, {
          name: payload.name,
          description: payload.description,
        });
        await refreshCore();
      } catch (err) {
        setCoreError(err instanceof ApiError ? err.message : "Failed to create team.");
      }
    },
    [activeOrgId, refreshCore, setCoreError],
  );

  return {
    addProject,
    archiveProject,
    restoreProject,
    linkTeamToProject,
    addTeam,
  };
}
