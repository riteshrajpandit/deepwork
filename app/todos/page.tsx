"use client";
import { useState } from "react";
import { useAppContext, formatFriendlyDate } from "@/components/AppProvider";
import { Calendar, CheckSquare, ListTodo, Plus, GitBranch, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";

export default function TodosPage() {
  const { tasks, projects, users, updateTaskStatus, setTaskModalOpen } = useAppContext();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  };

  // Only root tasks (no parentTaskId)
  const rootTasks = tasks.filter(t => !t.parentTaskId);
  const getSubTasks = (parentId: string) => tasks.filter(t => t.parentTaskId === parentId);

  const todoTasks = rootTasks.filter(t => t.status === 'Todo');
  const inProgressTasks = rootTasks.filter(t => t.status === 'In Progress');
  const doneTasks = rootTasks.filter(t => t.status === 'Done');

  const groups = [
    { title: "To Do", icon: ListTodo, items: todoTasks, color: "text-on-surface" },
    { title: "In Progress", icon: Calendar, items: inProgressTasks, color: "text-primary" },
    { title: "Done", icon: CheckSquare, items: doneTasks, color: "text-secondary" }
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-display-xl font-display-xl text-on-surface mb-2">My Todos</h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant">Your pending work across all initiatives.</p>
        </div>
        <button
          onClick={() => setTaskModalOpen({ open: true })}
          className="bg-primary text-on-primary px-4 py-2.5 rounded-lg font-label-sm text-label-sm hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
        >
          <Plus size={18} /> Add Todo
        </button>
      </div>

      <div className="space-y-8">
        {groups.map(group => (
          <div key={group.title} className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 ambient-shadow">
            <h3 className={`text-headline-md font-headline-md mb-4 flex items-center gap-2 ${group.color}`}>
              <group.icon size={20} />
              {group.title}
              <span className="bg-surface-container text-on-surface-variant text-[11px] px-2 py-0.5 rounded-full ml-auto">{group.items.length}</span>
            </h3>

            <div className="flex flex-col gap-2">
              {group.items.map(task => {
                const project = projects.find(p => p.id === task.projectId);
                const assignees = users.filter(u => task.assigneeIds.includes(u.id));
                const subTasks = getSubTasks(task.id);
                const isExpanded = expandedTasks.has(task.id);
                const doneSubCount = subTasks.filter(s => s.status === 'Done').length;

                return (
                  <div key={task.id} className="rounded-lg border border-outline-variant/30 overflow-hidden">
                    {/* Parent task row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface hover:bg-surface-container-low transition-colors group">
                      <div className="flex items-center gap-4 mb-3 sm:mb-0">
                        <button
                          onClick={() => updateTaskStatus(task.id, task.status === 'Done' ? 'Todo' : 'Done')}
                          className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${task.status === 'Done' ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant text-transparent hover:border-primary'}`}
                        >
                          <CheckSquare size={14} className={task.status === 'Done' ? 'opacity-100' : 'opacity-0'} />
                        </button>

                        <div>
                          <p className={`text-body-md font-body-md font-medium ${task.status === 'Done' ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{task.title}</p>
                          <p className="text-label-sm font-label-sm text-outline flex items-center gap-1.5 mt-0.5">
                            {project?.name || 'No Project'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-label-sm font-label-sm text-on-surface-variant pl-9 sm:pl-0">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                          task.priority === 'High' ? 'bg-error-container text-on-error-container' :
                          task.priority === 'Medium' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'
                        }`}>
                          {task.priority}
                        </span>
                        <span>{formatFriendlyDate(task.dueDate)}</span>

                        <div className="flex -space-x-1.5 w-[60px] justify-end">
                          {assignees.map(u => (
                            <div key={u.id} className="w-7 h-7 rounded-full border-2 border-surface overflow-hidden bg-surface-container" title={u.name}>
                              <Image src={u.avatar} width={28} height={28} alt={u.name} className="w-full h-full object-cover" unoptimized />
                            </div>
                          ))}
                        </div>

                        {subTasks.length > 0 && (
                          <button
                            onClick={() => toggleExpanded(task.id)}
                            className="flex items-center gap-1 text-primary hover:bg-primary/10 px-2 py-1 rounded-md transition-colors cursor-pointer"
                          >
                            <GitBranch size={13} />
                            <span className="text-[11px] font-bold">{doneSubCount}/{subTasks.length}</span>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sub-tasks */}
                    {subTasks.length > 0 && isExpanded && (
                      <div className="border-t border-outline-variant/20 bg-surface-container-low/50">
                        {subTasks.map((sub, idx) => (
                          <div
                            key={sub.id}
                            className={`flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container transition-colors ${idx < subTasks.length - 1 ? 'border-b border-outline-variant/20' : ''}`}
                          >
                            {/* Branch line */}
                            <div className="flex items-center gap-2 pl-7 shrink-0">
                              <div className="w-px h-3 bg-outline-variant/40 -mt-2.5" />
                              <GitBranch size={12} className="text-primary/50 shrink-0" />
                            </div>

                            <button
                              onClick={() => updateTaskStatus(sub.id, sub.status === 'Done' ? 'Todo' : 'Done')}
                              className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${sub.status === 'Done' ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant text-transparent hover:border-primary'}`}
                            >
                              <CheckSquare size={10} className={sub.status === 'Done' ? 'opacity-100' : 'opacity-0'} />
                            </button>

                            <span className={`flex-1 text-body-md ${sub.status === 'Done' ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                              {sub.title}
                            </span>

                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                              sub.status === 'Done' ? 'bg-surface-container-high text-on-surface-variant' :
                              sub.status === 'In Progress' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'
                            }`}>
                              {sub.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {group.items.length === 0 && (
                <div className="p-6 text-center text-outline text-body-md bg-surface-container-low rounded-lg border border-dashed border-outline-variant/50">
                  No tasks here.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
