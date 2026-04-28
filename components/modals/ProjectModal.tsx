"use client";

import React, { useState, useCallback } from "react";
import { X } from "lucide-react";
import type { Team, Project } from "@/lib/types";

type Props = {
  teams: Team[];
  onAdd: (p: {
    name: string;
    description: string;
    deadline?: string | null;
    teamIds: string[];
  }) => Promise<void>;
  onClose: () => void;
};

export function ProjectModal({ teams, onAdd, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [teamIds, setTeamIds] = useState<string[]>([]);

  const toggleTeam = useCallback((id: string) => {
    setTeamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!name.trim()) return;
      await onAdd({ name: name.trim(), description, deadline: deadline || null, teamIds });
      onClose();
    },
    [name, description, deadline, teamIds, onAdd, onClose],
  );

  return (
    <div className="fixed inset-0 bg-on-background/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-outline-variant/30 rounded-xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] flex flex-col"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface cursor-pointer"
        >
          <X size={20} />
        </button>

        <h2 className="text-headline-md font-headline-md text-on-surface mb-6 shrink-0">
          Create New Project
        </h2>

        <div className="space-y-6 overflow-y-auto no-scrollbar pb-4 -mx-2 px-2">
          <div className="space-y-4">
            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                Project Name
              </label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q4 Marketing Campaign"
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2 outline-none focus:border-primary text-body-md transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief overview of the goals..."
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2 outline-none focus:border-primary text-body-md min-h-[80px] resize-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                Deadline (Optional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2 outline-none focus:border-primary text-body-md transition-colors"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/30">
            <h3 className="text-body-lg font-semibold text-on-surface mb-4">
              Project Teams
            </h3>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-2">
              Attach Teams
            </label>
            {teams.length === 0 ? (
              <p className="text-[12px] text-outline-variant">
                Create a team in Settings before attaching it to a project.
              </p>
            ) : (
              <div className="flex gap-2 flex-wrap max-h-[140px] overflow-y-auto p-1">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => toggleTeam(team.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-body-md transition-all cursor-pointer ${
                      teamIds.includes(team.id)
                        ? "bg-primary border-primary text-on-primary"
                        : "bg-surface-container-lowest border-outline-variant hover:border-outline text-on-surface-variant"
                    }`}
                  >
                    <span className="font-medium">{team.name}</span>
                    <span className="text-[10px] opacity-70 leading-none">
                      {team.memberIds.length} members
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-outline-variant/30 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-body-md font-medium text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-body-md font-medium bg-primary text-on-primary hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            Create Project
          </button>
        </div>
      </form>
    </div>
  );
}
