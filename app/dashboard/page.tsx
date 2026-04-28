"use client";
import { useMemo, useCallback, memo } from "react";
import { CheckSquare, Calendar, ArrowRight, Target, Loader2, Folder } from "lucide-react";
import { useAppContext, formatFriendlyDate } from "@/components/AppProvider";
import type { Project, Task } from "@/components/AppProvider";
import Link from "next/link";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildWeekDays() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  const days: { d: string; n: number; active: boolean; iso: string }[] = [];
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayISO = toISODate(today);
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    const iso = toISODate(cur);
    days.push({ d: labels[i], n: cur.getDate(), active: iso === todayISO, iso });
  }
  return days;
}

const PROJECT_COLORS = ['bg-primary', 'bg-secondary', 'bg-surface-tint'] as const;

// ── Isolated sub-components — memoized so they skip re-render when props unchanged ──

const ProjectRow = memo(function ProjectRow({
  project, tasks, colorClass,
}: { project: Project; tasks: Task[]; colorClass: string }) {
  // Derived values scoped to this card — not recomputed on siblings' changes
  const pTasks = useMemo(() => tasks.filter(t => t.projectId === project.id), [tasks, project.id]);
  const compCount = useMemo(() => pTasks.filter(t => t.status === 'Done').length, [pTasks]);
  const progress = pTasks.length ? Math.round((compCount / pTasks.length) * 100) : 0;
  const label = progress === 100 ? 'All caught up' : `${pTasks.length - compCount} tasks pending`;

  return (
    <div className="group">
      <div className="flex justify-between items-baseline mb-2">
        <Link href={`/projects/${project.id}`}>
          <h4 className="text-body-md font-body-md font-medium text-on-surface group-hover:text-primary transition-colors cursor-pointer">
            {project.name}
          </h4>
        </Link>
        <span className="text-label-sm font-label-sm text-on-surface-variant">{progress}%</span>
      </div>
      <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-label-sm font-label-sm text-outline">{label}</p>
    </div>
  );
});

const FocusTaskRow = memo(function FocusTaskRow({ task }: { task: Task }) {
  return (
    <label className="flex items-start gap-4 p-3 rounded-lg hover:bg-surface transition-colors cursor-pointer group border border-transparent hover:border-outline-variant/30">
      <input
        type="checkbox"
        readOnly
        checked={task.status === 'Done'}
        className="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 bg-transparent transition-colors"
      />
      <div>
        <p className="text-body-md font-body-md text-on-surface group-hover:text-primary transition-colors">{task.title}</p>
        <p className="text-label-sm font-label-sm text-outline mt-1">{formatFriendlyDate(task.dueDate)} · {task.priority}</p>
      </div>
    </label>
  );
});

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { projects, tasks, setTaskModalOpen, coreLoading } = useAppContext();

  const rootTasks = useMemo(() => tasks.filter(t => !t.parentTaskId), [tasks]);

  const activeProjects = useMemo(() => projects.filter(p => p.status === 'Active'), [projects]);
  const topProjects = useMemo(() => activeProjects.slice(0, 3), [activeProjects]);

  // Build a Set of active project IDs once so the focusTasks filter is O(1) per task
  const activeProjectIds = useMemo(() => new Set(activeProjects.map(p => p.id)), [activeProjects]);
  const focusTasks = useMemo(
    () => rootTasks.filter(t => t.status !== 'Done' && activeProjectIds.has(t.projectId)).slice(0, 3),
    [rootTasks, activeProjectIds],
  );

  // Upcoming tasks: next 5 non-done tasks sorted by due date ascending
  const upcomingTasks = useMemo(() => {
    const today = toISODate(new Date());
    return rootTasks
      .filter(t => t.status !== 'Done' && t.dueDate >= today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);
  }, [rootTasks]);

  const weekDays = useMemo(buildWeekDays, []);

  const openTaskModal = useCallback(() => setTaskModalOpen({ open: true }), [setTaskModalOpen]);

  if (coreLoading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-outline" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-display-xl font-display-xl text-on-surface mb-2">Good morning.</h2>
        <p className="text-body-lg font-body-lg text-on-surface-variant">Here is the quiet overview of your ongoing work.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">

        {/* Active Initiatives */}
        <div className="md:col-span-8 bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 ambient-shadow transition-all duration-300 hover:shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-headline-md font-headline-md text-on-surface">Active Initiatives</h3>
            <Link href="/projects" className="text-primary hover:bg-primary/5 rounded-lg px-3 py-1.5 transition-colors font-label-sm text-label-sm flex items-center gap-1 active:scale-95 cursor-pointer">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="space-y-6 flex-1">
            {topProjects.map((project, idx) => (
              <ProjectRow
                key={project.id}
                project={project}
                tasks={rootTasks}
                colorClass={PROJECT_COLORS[idx] ?? 'bg-surface-tint'}
              />
            ))}
            {topProjects.length === 0 && (
              <p className="text-body-md text-outline italic">No active projects right now.</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="md:col-span-4 bg-surface-container-low border border-surface-container rounded-xl p-6 flex flex-col gap-4">
          <h3 className="text-headline-md font-headline-md text-on-surface mb-2">Quick Actions</h3>

          <button onClick={openTaskModal} className="w-full bg-surface-container-lowest border border-outline-variant/50 hover:border-primary/50 text-on-surface-variant transition-all duration-200 rounded-lg p-4 flex items-center gap-4 ambient-shadow group text-left active:scale-[0.98] cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors text-primary">
              <CheckSquare size={20} />
            </div>
            <div>
              <p className="font-body-md text-body-md font-medium text-on-surface">Assign Task</p>
              <p className="font-label-sm text-label-sm text-outline mt-0.5">Delegate work to the team</p>
            </div>
          </button>

          <Link href="/projects" className="w-full bg-surface-container-lowest border border-outline-variant/50 hover:border-secondary/50 text-on-surface-variant transition-all duration-200 rounded-lg p-4 flex items-center gap-4 ambient-shadow group text-left active:scale-[0.98]">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors text-secondary">
              <Folder size={20} />
            </div>
            <div>
              <p className="font-body-md text-body-md font-medium text-on-surface">Browse Projects</p>
              <p className="font-label-sm text-label-sm text-outline mt-0.5">Check project milestones</p>
            </div>
          </Link>

          <Link href="/calendar" className="w-full bg-surface-container-lowest border border-outline-variant/50 hover:border-tertiary/50 text-on-surface-variant transition-all duration-200 rounded-lg p-4 flex items-center gap-4 ambient-shadow group text-left active:scale-[0.98]">
            <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center group-hover:bg-tertiary/20 transition-colors text-tertiary">
              <Calendar size={20} />
            </div>
            <div>
              <p className="font-body-md text-body-md font-medium text-on-surface">Schedule Review</p>
              <p className="font-label-sm text-label-sm text-outline mt-0.5">Set up a milestone check-in</p>
            </div>
          </Link>
        </div>

        {/* Focus Today */}
        <div className="md:col-span-4 bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 ambient-shadow flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-headline-md font-headline-md text-on-surface">Your Focus Today</h3>
            <Link href="/todos" className="text-primary hover:bg-primary/5 rounded-lg px-2 py-1 transition-colors font-label-sm text-label-sm flex items-center gap-1">All Todos</Link>
          </div>
          <div className="space-y-1 flex-1">
            {focusTasks.map(task => <FocusTaskRow key={task.id} task={task} />)}
            {focusTasks.length === 0 && (
              <p className="text-body-md text-outline italic px-3 py-2">No pending tasks for today. You&apos;re all clear!</p>
            )}
          </div>
        </div>

        {/* Upcoming mini-calendar */}
        <div className="md:col-span-4 bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 ambient-shadow flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-headline-md font-headline-md text-on-surface">Upcoming</h3>
            <Link href="/calendar" className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
              <Calendar size={20} />
            </Link>
          </div>

          <div className="flex gap-1 w-full justify-between mb-6">
            {weekDays.map((day, i) => (
              <div key={i} className={`flex flex-col items-center px-1.5 py-2 rounded-lg min-w-[36px] ${day.active ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high cursor-pointer transition-colors'}`}>
                <span className="text-[10px] font-semibold uppercase opacity-80">{day.d}</span>
                <span className={`text-label-sm font-medium mt-1 ${day.active ? 'text-on-primary' : 'text-on-surface'}`}>{day.n}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4 flex-1">
            {upcomingTasks.length === 0 ? (
              <p className="text-body-md text-outline italic px-1">No upcoming tasks.</p>
            ) : upcomingTasks.map((task, idx) => (
              <div key={task.id} className="flex gap-3 group cursor-pointer">
                <div className="flex flex-col items-center mt-1">
                  <div className={`w-2.5 h-2.5 rounded-full ring-4 ring-surface-container-lowest ${idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-secondary' : 'bg-outline-variant group-hover:bg-primary transition-colors'}`} />
                  {idx < upcomingTasks.length - 1 && <div className="w-px h-full bg-outline-variant/30 mt-1" />}
                </div>
                <div className="pb-4">
                  <p className={`text-label-sm font-label-sm mb-0.5 ${idx === 0 ? 'text-primary' : idx === 1 ? 'text-secondary' : 'text-outline'}`}>
                    {formatFriendlyDate(task.dueDate)}
                  </p>
                  <p className="text-body-md font-body-md text-on-surface font-medium group-hover:text-primary transition-colors">{task.title}</p>
                  <p className="text-label-sm font-label-sm text-outline mt-1 flex items-center gap-1.5">
                    <Target size={14} /> {task.priority} Priority
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Done tasks feed */}
        <div className="md:col-span-4 bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 ambient-shadow flex flex-col">
          <h3 className="text-headline-md font-headline-md text-on-surface mb-6">Recently Completed</h3>
          <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-outline-variant/50 flex-1">
            {rootTasks.filter(t => t.status === 'Done').slice(0, 4).map((task, idx) => (
              <div key={task.id} className="relative pl-6">
                <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-surface-container-lowest ${idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-secondary' : 'bg-outline'}`} />
                <p className="text-label-sm font-label-sm text-outline mb-1">{formatFriendlyDate(task.dueDate)}</p>
                <p className="text-body-md font-body-md text-on-surface leading-snug font-medium line-through opacity-70">{task.title}</p>
                <p className="text-label-sm font-label-sm text-outline mt-1 flex items-center gap-1.5">
                  <CheckSquare size={14} /> Completed
                </p>
              </div>
            ))}
            {rootTasks.filter(t => t.status === 'Done').length === 0 && (
              <p className="text-body-md text-outline italic">No completed tasks yet.</p>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
