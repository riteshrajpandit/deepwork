"use client";
import React, { useState, useMemo } from "react";
import { useAppContext, formatFriendlyDate } from "@/components/AppProvider";
import type { Task } from "@/components/AppProvider";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Grid, Clock, CheckSquare, MoreHorizontal, X, LayoutTemplate } from "lucide-react";
import Image from "next/image";

export default function CalendarPage() {
  const { tasks, projects, users, setTaskModalOpen, updateTaskStatus } = useAppContext();
  const rootTasks = useMemo(() => tasks.filter(t => !t.parentTaskId), [tasks]);
  const [baseDate, setBaseDate] = useState(() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; });
  const [view, setView] = useState<'Month' | 'Week' | 'Day'>('Month');
  
  // Track selected date for side panel
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const toISODate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const todayISO = toISODate(new Date());
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const next = () => {
    const d = new Date(baseDate);
    if (view === 'Month') d.setMonth(d.getMonth() + 1);
    if (view === 'Week') d.setDate(d.getDate() + 7);
    if (view === 'Day') d.setDate(d.getDate() + 1);
    setBaseDate(d);
  };

  const prev = () => {
    const d = new Date(baseDate);
    if (view === 'Month') d.setMonth(d.getMonth() - 1);
    if (view === 'Week') d.setDate(d.getDate() - 7);
    if (view === 'Day') d.setDate(d.getDate() - 1);
    setBaseDate(d);
  };

  const goToday = () => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    setBaseDate(d);
    setSelectedDate(toISODate(d));
  };

  const getMonthGrid = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay(); 
    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ dateStr: toISODate(new Date(year, month - 1, prevMonthLastDay - i)), currentMonth: false, d: new Date(year, month - 1, prevMonthLastDay - i) });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ dateStr: toISODate(new Date(year, month, i)), currentMonth: true, d: new Date(year, month, i) });
    }
    const remainder = days.length % 7;
    if (remainder !== 0) {
      for (let i = 1; i <= 7 - remainder; i++) {
        days.push({ dateStr: toISODate(new Date(year, month + 1, i)), currentMonth: false, d: new Date(year, month + 1, i) });
      }
    }
    return days;
  };

  const getWeekGrid = () => {
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const startOfWeek = new Date(d.getFullYear(), d.getMonth(), diff);
    const week = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(startOfWeek);
      cur.setDate(startOfWeek.getDate() + i);
      week.push(toISODate(cur));
    }
    return week;
  };

  const monthDays = getMonthGrid();
  const weekDays = getWeekGrid();
  const currentISODate = toISODate(baseDate);

  // UI Helpers
  const getPriorityColor = (priority: string) => {
    if (priority === 'High') return 'bg-error-container text-on-error-container border-error/20';
    if (priority === 'Medium') return 'bg-secondary-container text-on-secondary-container border-secondary/20';
    return 'bg-surface-container-high text-on-surface-variant border-outline-variant/30';
  };

  const renderTasks = (dateStr: string) => {
    const dayTasks = rootTasks.filter(t => t.dueDate === dateStr);
    return dayTasks.map(task => {
      const assignees = users.filter(u => task.assigneeIds.includes(u.id));
      return (
        <div 
          key={task.id} 
          className={`flex flex-col gap-1.5 rounded-md border p-1.5 mb-1.5 transition-colors cursor-pointer hover:opacity-80 active:scale-95 ${getPriorityColor(task.priority)} ${task.status === 'Done' ? 'opacity-50 line-through' : ''}`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold truncate leading-tight flex-1" title={task.title}>{task.title}</span>
          </div>
          <div className="flex justify-between items-center mt-auto">
            <span className="text-[9px] opacity-70">
              {task.status}
            </span>
            <div className="flex -space-x-1">
              {assignees.map(u => (
                <div key={u.id} className="w-4 h-4 rounded-full overflow-hidden border border-surface bg-surface shadow-sm">
                  <Image src={u.avatar} width={16} height={16} alt={u.name} unoptimized className="w-full h-full object-cover"/>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center mb-6 shrink-0 gap-4">
        <div>
          <h2 className="text-display-xl font-display-xl text-on-surface mb-1">Calendar</h2>
          <p className="text-body-md font-body-md text-on-surface-variant">Schedule syncs and track deadlines.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-surface-container border border-outline-variant/30 rounded-lg p-1 shadow-sm">
            {['Month', 'Week', 'Day'].map(v => (
              <button 
                key={v} 
                onClick={() => setView(v as any)}
                className={`px-4 py-1.5 rounded-md text-label-sm font-label-sm transition-all cursor-pointer ${view === v ? 'bg-surface shadow-sm text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-surface-container border border-outline-variant/30 rounded-lg p-1 shadow-sm">
            <button onClick={prev} className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer">
              <ChevronLeft size={18} />
            </button>
            <button onClick={goToday} className="px-3 py-1.5 rounded-md text-label-sm font-label-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer">
              Today
            </button>
            <button onClick={next} className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer">
              <ChevronRight size={18} />
            </button>
          </div>

          <h3 className="text-headline-md font-headline-md text-on-surface min-w-[140px] text-right ml-2 mr-4">
            {view === 'Day' ? baseDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 
             view === 'Week' ? `Week of ${new Date(weekDays[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}` :
             baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>

          <button 
            onClick={() => setTaskModalOpen({ open: true })}
            className="bg-primary text-on-primary px-4 py-2.5 rounded-lg font-label-sm text-label-sm hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 ml-auto md:ml-0"
          >
            <Plus size={18} /> Add Event
          </button>
        </div>
      </div>

      {/* Calendar Body with Side Panel Split */}
      <div className="flex-1 flex overflow-hidden bg-surface-container-lowest border border-outline-variant/50 rounded-xl ambient-shadow">
        
        {/* Main Grid Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header row (Days of week) */}
          {(view === 'Month' || view === 'Week') && (
            <div className="grid grid-cols-7 border-b border-outline-variant/30 bg-surface-container-lowest shadow-sm shrink-0 z-10">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <div key={day} className="px-4 py-3 text-label-sm font-label-sm text-on-surface-variant text-center border-r border-outline-variant/30 last:border-0 uppercase tracking-wider">
                  {day}
                  {view === 'Week' && (
                    <span className={`block mt-1 text-body-md font-body-md ${weekDays[i] === todayISO ? 'text-primary font-semibold' : 'text-on-surface'}`}>
                      {new Date(weekDays[i]).getDate()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* MONTH VIEW */}
          {view === 'Month' && (
            <div className="flex-1 grid grid-cols-7 grid-rows-[repeat(auto-fill,minmax(120px,1fr))] overflow-y-auto no-scrollbar bg-outline-variant/20 gap-px">
              {monthDays.map((day, i) => {
                const isToday = day.dateStr === todayISO;
                const isSelected = selectedDate === day.dateStr;
                return (
                  <div 
                    key={i} 
                    onClick={() => setSelectedDate(day.dateStr)}
                    className={`min-h-[120px] p-2 hover:bg-surface-container-low transition-colors cursor-pointer border-[1.5px] ${
                      isSelected ? 'bg-surface-container-lowest border-primary shadow-md z-10' : 
                      !day.currentMonth ? 'bg-surface-container-lowest/50 opacity-80 border-transparent' : 'bg-surface-container-lowest border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2 pointer-events-none">
                       <span className={`w-7 h-7 flex items-center justify-center rounded-full text-label-sm font-label-sm ${isToday ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface'}`}>
                         {day.d.getDate()}
                       </span>
                    </div>
                    <div className="flex flex-col overflow-y-auto no-scrollbar max-h-[90px] pointer-events-none">
                      {renderTasks(day.dateStr)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* WEEK VIEW */}
          {view === 'Week' && (
            <div className="flex-1 grid grid-cols-7 bg-outline-variant/20 gap-px overflow-y-auto no-scrollbar">
              {weekDays.map(dateStr => {
                const isSelected = selectedDate === dateStr;
                return (
                  <div 
                    key={dateStr} 
                    onClick={() => setSelectedDate(dateStr)}
                    className={`min-h-full p-3 flex flex-col hover:bg-surface-container-low transition-colors cursor-pointer border-[1.5px] ${
                      isSelected ? 'bg-surface-container-lowest border-primary z-10 shadow-md' : 'bg-surface-container-lowest border-transparent'
                    }`}
                  >
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pointer-events-none">
                       {renderTasks(dateStr)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DAY VIEW */}
          {view === 'Day' && (
            <div className="flex-1 flex flex-col bg-surface-container-lowest overflow-y-auto no-scrollbar p-6">
              <div className="max-w-4xl w-full mx-auto">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-col shadow-sm">
                       <span className="text-display-xl font-display-xl leading-none tracking-tighter">{baseDate.getDate()}</span>
                     </div>
                     <div>
                       <h3 className="text-headline-lg font-headline-lg text-on-surface">{baseDate.toLocaleDateString('en-US', { weekday: 'long' })}</h3>
                       <p className="text-body-md font-body-md text-on-surface-variant cursor-pointer hover:text-primary transition-colors inline-block">{formatFriendlyDate(currentISODate)}</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                    {rootTasks.filter(t => t.dueDate === currentISODate).length === 0 ? (
                      <div className="text-center py-16 text-outline text-body-md bg-surface-container-low rounded-xl border border-dashed border-outline-variant/50">
                        Your schedule is clear for this day.
                      </div>
                    ) : (
                      rootTasks.filter(t => t.dueDate === currentISODate).map(task => {
                         const project = projects.find(p => p.id === task.projectId);
                         const assignees = users.filter(u => task.assigneeIds.includes(u.id));

                         return (
                           <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-surface hover:bg-surface-container-low border border-outline-variant/30 rounded-xl transition-colors group ambient-shadow hover:shadow-md">
                             <div className="flex items-center gap-4 mb-3 sm:mb-0">
                               <button 
                                 onClick={() => updateTaskStatus(task.id, task.status === 'Done' ? 'Todo' : 'Done')}
                                 className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors shrink-0 ${task.status === 'Done' ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant text-transparent hover:border-primary'}`}
                               >
                                 <CheckSquare size={16} className={task.status === 'Done' ? 'opacity-100' : 'opacity-0'} />
                               </button>
                               
                               <div>
                                 <p className={`text-headline-md font-headline-md text-base sm:text-lg mb-1 ${task.status === 'Done' ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{task.title}</p>
                                 <div className="flex gap-3 text-label-sm font-label-sm">
                                    <p className="text-primary flex items-center gap-1.5"><Grid size={14}/> {project?.name || 'No Project'}</p>
                                    <span className="text-outline-variant">|</span>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                                        task.priority === 'High' ? 'bg-error-container text-on-error-container' : 
                                        task.priority === 'Medium' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'
                                      }`}>
                                      {task.priority} Priority
                                    </span>
                                 </div>
                               </div>
                             </div>

                             <div className="flex items-center gap-6 text-label-sm font-label-sm text-on-surface-variant pl-10 sm:pl-0 border-t sm:border-t-0 border-outline-variant/20 pt-3 sm:pt-0">
                               <span className="flex items-center gap-1.5 bg-surface-container-high px-2.5 py-1 rounded-md text-on-surface">
                                 <Clock size={14}/> All Day
                               </span>
                               
                               <div className="flex -space-x-2">
                                 {assignees.map(u => (
                                   <div key={u.id} className="w-8 h-8 rounded-full border-2 border-surface overflow-hidden bg-surface-container shadow-sm" title={u.name}>
                                     <Image src={u.avatar} width={32} height={32} alt={u.name} className="w-full h-full object-cover" unoptimized />
                                   </div>
                                 ))}
                               </div>
                               <button className="text-on-surface-variant hover:text-on-surface p-2 rounded-lg hover:bg-surface-container transition-colors shadow-sm bg-surface border border-outline-variant/30 cursor-pointer"><MoreHorizontal size={18} /></button>
                             </div>
                           </div>
                         );
                      })
                    )}
                  </div>
              </div>
            </div>
          )}
        </div>

        {/* Expanding Right Side Panel (Visible outside 'Day' view when a date is selected) */}
        {selectedDate && view !== 'Day' && (
          <div className="w-80 lg:w-96 flex flex-col shrink-0 bg-surface border-l border-outline-variant/30 z-10 transition-transform">
            <div className="p-5 border-b border-outline-variant/30 flex justify-between items-start bg-surface-container-lowest shrink-0 shadow-sm relative z-10">
              <div>
                <h3 className="text-headline-lg font-headline-lg text-on-surface mb-0.5">
                  {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
                <p className="text-label-sm font-label-sm text-outline uppercase tracking-wider">
                  {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
              </div>
              <button 
                onClick={() => setSelectedDate(null)} 
                className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
              <button 
                onClick={() => setTaskModalOpen({ open: true, dateStr: selectedDate })}
                className="w-full bg-surface-container-lowest border border-outline-variant hover:border-primary/50 text-on-surface transition-all duration-200 rounded-lg py-3 flex items-center justify-center gap-2 ambient-shadow group active:scale-[0.98] cursor-pointer"
              >
                <Plus size={16} className="text-primary group-hover:scale-110 transition-transform" />
                <span className="font-label-sm font-medium">Add Task to {formatFriendlyDate(selectedDate)}</span>
              </button>

              <div className="space-y-3 pt-2">
                <h4 className="text-label-sm font-label-sm text-outline uppercase tracking-wider mb-2">
                  Scheduled Work
                </h4>
                
                {(() => {
                  const dayTasks = tasks.filter(t => t.dueDate === selectedDate);
                  if (dayTasks.length === 0) {
                    return (
                      <div className="py-8 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant/50 text-outline-variant text-[13px] flex flex-col items-center gap-2">
                        <LayoutTemplate size={24} className="opacity-40" />
                        No tasks for this day.
                      </div>
                    );
                  }
                  
                  return dayTasks.map(task => {
                    const project = projects.find(p => p.id === task.projectId);
                    const assignees = users.filter(u => task.assigneeIds.includes(u.id));

                    return (
                      <div key={task.id} className={`p-4 bg-surface-container-lowest border border-outline-variant/40 rounded-xl transition-all group hover:shadow-md ${task.status === 'Done' ? 'opacity-60 bg-surface-container-low/50' : ''}`}>
                        <div className="flex gap-3 mb-3 items-start">
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, task.status === 'Done' ? 'Todo' : 'Done') }}
                            className={`shrink-0 w-5 h-5 rounded flex items-center justify-center border cursor-pointer transition-colors mt-[3px] ${task.status === 'Done' ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant text-transparent hover:border-primary'}`}
                          >
                            <CheckSquare size={14} className={task.status === 'Done' ? 'opacity-100' : 'opacity-0'} />
                          </button>
                          <div>
                            <h5 className={`text-body-md font-body-md font-medium text-on-surface leading-snug mb-1.5 ${task.status === 'Done' ? 'line-through text-on-surface-variant' : ''}`}>
                              {task.title}
                            </h5>
                            {project && (
                              <p className="text-label-sm font-label-sm text-primary flex items-center gap-1.5 opacity-90">
                                <Grid size={12} /> {project.name}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3 mt-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                              task.priority === 'High' ? 'bg-error-container text-on-error-container' : 
                              task.priority === 'Medium' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'
                            }`}>
                            {task.priority}
                          </span>

                          <div className="flex -space-x-1.5">
                            {assignees.map(u => (
                              <div key={u.id} className="w-6 h-6 rounded-full border-2 border-surface-container-lowest overflow-hidden bg-surface-container shadow-sm" title={u.name}>
                                <Image src={u.avatar} width={24} height={24} alt={u.name} className="w-full h-full object-cover" unoptimized />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
