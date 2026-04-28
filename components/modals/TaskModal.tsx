"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { X, Plus, GitBranch, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import type { Task, Project, User, Team } from "@/lib/types";
import { API_PRIORITY_BY_UI } from "@/lib/types";

type Props = {
  projects: Project[];
  users: User[];
  teams: Team[];
  projectId?: string;
  dateStr?: string;
  onAdd: (t: {
    title: string;
    projectId: string;
    teamId: string;
    dueDate: string;
    priority: Task["priority"];
    assigneeIds: string[];
    subTaskTitles?: string[];
  }) => Promise<string>;
  onClose: () => void;
};

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TaskModal({ projects, users, teams, projectId, dateStr, onAdd, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [projId, setProjId] = useState(projectId || projects[0]?.id || "");
  const [dueDate] = useState(dateStr || todayISO());
  const [priority, setPriority] = useState<Task["priority"]>("Medium");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [teamId, setTeamId] = useState("");
  const [subTaskTitles, setSubTaskTitles] = useState<string[]>([]);
  const [subTaskInput, setSubTaskInput] = useState("");
  const [showSubTasks, setShowSubTasks] = useState(false);

  // Sync default project when projects load
  useEffect(() => {
    if (!projId && projects.length > 0) setProjId(projects[0].id);
  }, [projId, projects]);

  const projectTeamIds = useMemo(
    () => projects.find((p) => p.id === projId)?.teamIds ?? [],
    [projects, projId],
  );
  const availableTeams = useMemo(
    () => teams.filter((t) => projectTeamIds.includes(t.id)),
    [teams, projectTeamIds],
  );

  // Auto-select first team when project changes
  useEffect(() => {
    setAssigneeIds([]);
    setTeamId(availableTeams[0]?.id ?? "");
  }, [projId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear assignees when team changes
  useEffect(() => {
    setAssigneeIds([]);
  }, [teamId]);

  // Auto-select first team when available teams resolve
  useEffect(() => {
    if (!teamId && availableTeams.length > 0) setTeamId(availableTeams[0].id);
  }, [availableTeams, teamId]);

  const teamMemberIds = useMemo(
    () => new Set(availableTeams.find((t) => t.id === teamId)?.memberIds ?? []),
    [availableTeams, teamId],
  );
  const assignableUsers = useMemo(
    () => users.filter((u) => teamMemberIds.has(u.id)),
    [users, teamMemberIds],
  );

  const toggleAssignee = useCallback((id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const addSubTaskTitle = useCallback(() => {
    const trimmed = subTaskInput.trim();
    if (!trimmed) return;
    setSubTaskTitles((prev) => [...prev, trimmed]);
    setSubTaskInput("");
  }, [subTaskInput]);

  const removeSubTaskTitle = useCallback((index: number) => {
    setSubTaskTitles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!title || !projId || !teamId) return;
      await onAdd({ title, projectId: projId, teamId, dueDate, priority, assigneeIds, subTaskTitles });
      onClose();
    },
    [title, projId, teamId, dueDate, priority, assigneeIds, subTaskTitles, onAdd, onClose],
  );

  return (
    <div className="fixed inset-0 bg-on-background/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-outline-variant/30 rounded-xl shadow-2xl w-full max-w-md p-6 relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface cursor-pointer"
        >
          <X size={20} />
        </button>
        <h2 className="text-headline-md font-headline-md text-on-surface mb-6">
          Add New Task
        </h2>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
              Task Title
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finalize copy for homepage"
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2 outline-none focus:border-primary text-body-md transition-colors"
              required
            />
          </div>

          {/* Project + Team */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                Project
              </label>
              <select
                value={projId}
                onChange={(e) => setProjId(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 py-2 outline-none focus:border-primary text-body-md transition-colors cursor-pointer"
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                Assigned Team
              </label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 py-2 outline-none focus:border-primary text-body-md transition-colors cursor-pointer"
                required
              >
                {availableTeams.length === 0 && (
                  <option value="" disabled>No teams attached</option>
                )}
                {availableTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {availableTeams.length === 0 && (
                <p className="mt-1 text-[11px] text-outline-variant">
                  Attach a team to this project first.
                </p>
              )}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task["priority"])}
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 py-2 outline-none focus:border-primary text-body-md transition-colors cursor-pointer"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
              Due Date
            </label>
            <input
              type="date"
              defaultValue={dueDate}
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2 outline-none focus:border-primary text-body-md transition-colors"
            />
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-2">
              Assign Members
            </label>
            {assignableUsers.length === 0 ? (
              <p className="text-[12px] text-outline-variant">
                No members found for this team.
              </p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {assignableUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleAssignee(u.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-body-md transition-all cursor-pointer ${
                      assigneeIds.includes(u.id)
                        ? "bg-primary border-primary text-on-primary"
                        : "bg-surface-container-lowest border-outline-variant hover:border-outline text-on-surface-variant"
                    }`}
                  >
                    <Image
                      src={u.avatar}
                      width={18}
                      height={18}
                      className="rounded-full shrink-0"
                      alt={u.name}
                      unoptimized
                    />
                    <div className="flex flex-col text-left">
                      <span>{u.name}</span>
                      <span className="text-[10px] opacity-70 leading-none">{u.role}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sub-tasks */}
          <div className="border-t border-outline-variant/30 pt-4">
            <button
              type="button"
              onClick={() => setShowSubTasks((p) => !p)}
              className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer w-full"
            >
              <GitBranch size={15} className="text-primary" />
              <span className="font-medium">Sub-tasks</span>
              {subTaskTitles.length > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {subTaskTitles.length}
                </span>
              )}
              <span className="ml-auto">
                {showSubTasks ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </span>
            </button>

            {showSubTasks && (
              <div className="mt-3 space-y-2">
                {subTaskTitles.map((st, i) => (
                  <div key={i} className="flex items-center gap-2 pl-4 border-l-2 border-primary/30">
                    <GitBranch size={12} className="text-primary/50 shrink-0" />
                    <span className="flex-1 text-body-md text-on-surface">{st}</span>
                    <button
                      type="button"
                      onClick={() => removeSubTaskTitle(i)}
                      className="text-on-surface-variant hover:text-error transition-colors cursor-pointer p-0.5 rounded"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pl-4 border-l-2 border-outline-variant/30 mt-2">
                  <input
                    type="text"
                    value={subTaskInput}
                    onChange={(e) => setSubTaskInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubTaskTitle(); } }}
                    placeholder="Add a sub-task…"
                    className="flex-1 bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 py-1.5 outline-none focus:border-primary text-body-md transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={addSubTaskTitle}
                    disabled={!subTaskInput.trim()}
                    className="p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-body-md font-medium text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!teamId || !title}
            className="px-4 py-2 rounded-lg text-body-md font-medium bg-primary text-on-primary hover:opacity-90 transition-opacity cursor-pointer shadow-sm disabled:opacity-60"
          >
            Add Task
          </button>
        </div>
      </form>
    </div>
  );
}
