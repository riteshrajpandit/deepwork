"use client";
import { useAppContext, formatFriendlyDate } from "@/components/AppProvider";
import { Calendar, CheckSquare, ListTodo, Plus } from "lucide-react";
import Image from "next/image";

export default function TodosPage() {
  const { tasks, projects, users, updateTaskStatus, setTaskModalOpen } = useAppContext();

  // Group tasks by status globally
  const todoTasks = tasks.filter(t => t.status === 'Todo');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const doneTasks = tasks.filter(t => t.status === 'Done');

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

                return (
                  <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface hover:bg-surface-container-low border border-outline-variant/30 rounded-lg transition-colors group">
                    <div className="flex items-center gap-4 mb-3 sm:mb-0">
                      <select 
                        value={task.status} 
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as any)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 w-8 text-transparent bg-transparent outline-none cursor-pointer"
                        title="Change Status"
                      >
                        <option value="Todo">Todo</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                      
                      <button 
                        onClick={() => updateTaskStatus(task.id, task.status === 'Done' ? 'Todo' : 'Done')}
                        className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${task.status === 'Done' ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant text-transparent hover:border-primary'}`}
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

                    <div className="flex items-center gap-6 text-label-sm font-label-sm text-on-surface-variant pl-9 sm:pl-0">
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
                    </div>
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
