"use client";
import { useMemo, memo } from "react";
import { useAppContext } from "@/components/AppProvider";
import type { Project, Task, User } from "@/components/AppProvider";
import Link from "next/link";
import { Plus, Folder } from "lucide-react";
import Image from "next/image";

// ── ProjectCard — memoized so sibling cards don't re-render when one changes ──

const ProjectCard = memo(function ProjectCard({
  project, tasks, members,
}: { project: Project; tasks: Task[]; members: User[] }) {
  // Derived values scoped to this card
  const completedCount = useMemo(
    () => tasks.filter(t => t.status === 'Done').length,
    [tasks],
  );
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const visibleMembers = members.slice(0, 4);
  const overflow = members.length > 4 ? members.length - 4 : 0;

  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 ambient-shadow hover:shadow-lg transition-all hover:border-primary/30 h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Folder size={20} />
          </div>
          <span className={`px-2 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider ${project.status === 'Active' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
            {project.status}
          </span>
        </div>

        <h3 className="text-headline-md font-headline-md text-on-surface mb-2 group-hover:text-primary transition-colors">{project.name}</h3>
        <p className="text-body-md font-body-md text-on-surface-variant mb-8 flex-1 line-clamp-2">{project.description}</p>

        <div className="mt-auto">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-label-sm font-label-sm text-on-surface-variant">Progress</span>
            <span className="text-label-sm font-label-sm text-on-surface font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden mb-4">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-outline-variant/30">
            <div className="flex -space-x-2">
              {visibleMembers.map(u => (
                <div key={u.id} className="w-8 h-8 rounded-full border-2 border-surface-container-lowest overflow-hidden bg-surface-container">
                  <Image src={u.avatar} width={32} height={32} alt={u.name} className="w-full h-full object-cover" unoptimized />
                </div>
              ))}
              {members.length === 0 && <span className="text-label-sm text-outline italic">No team yet</span>}
              {overflow > 0 && (
                <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-surface-container-high text-on-surface-variant flex items-center justify-center text-xs font-medium">
                  +{overflow}
                </div>
              )}
            </div>
            <span className="text-label-sm font-label-sm text-on-surface-variant">{tasks.length} Tasks</span>
          </div>
        </div>
      </div>
    </Link>
  );
});

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const { projects, tasks, users, setProjectModalOpen, currentUser } = useAppContext();
  const canCreateProject = currentUser?.orgRole === "owner" || currentUser?.orgRole === "admin";

  const rootTasks = useMemo(() => tasks.filter(t => !t.parentTaskId), [tasks]);

  // Lookup maps — built once, O(1) per access instead of O(n) per project
  const tasksByProject = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of rootTasks) {
      if (!map.has(t.projectId)) map.set(t.projectId, []);
      map.get(t.projectId)!.push(t);
    }
    return map;
  }, [rootTasks]);

  const userById = useMemo(
    () => new Map(users.map(u => [u.id, u])),
    [users],
  );

  const activeProjects = useMemo(
    () => projects.filter(p => p.status !== 'Archived'),
    [projects],
  );

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-display-xl font-display-xl text-on-surface mb-2">Projects</h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant">Manage and track your primary initiatives.</p>
        </div>
        {canCreateProject && (
          <button
            onClick={() => setProjectModalOpen(true)}
            className="bg-primary text-on-primary px-4 py-2.5 rounded-lg font-label-sm text-label-sm hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            <Plus size={18} /> Create Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeProjects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            tasks={tasksByProject.get(project.id) ?? []}
            members={project.memberIds.map(id => userById.get(id)).filter(Boolean) as User[]}
          />
        ))}
      </div>
    </>
  );
}
