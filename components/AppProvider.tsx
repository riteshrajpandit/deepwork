"use client";
import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { X, Plus, GitBranch, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";

export type User = { id: string; name: string; avatar: string; color: string; role: string; orgId?: string; orgRole?: "owner" | "admin" | "member"; };
export type Task = { id: string; projectId: string; title: string; status: 'Todo' | 'In Progress' | 'Done'; assigneeIds: string[]; notifyIds?: string[]; dueDate: string; priority: 'Low' | 'Medium' | 'High'; parentTaskId?: string; };
export type Project = { id: string; name: string; description: string; status: 'Active' | 'Completed' | 'Archived'; teamIds: string[]; memberIds: string[]; };
export type AppNotification = { id: string; userId: string; message: string; read: boolean; timestamp: string; taskId?: string; };
export type Discussion = { id: string; projectId: string | null; title: string; updatedAt: string; };
export type Message = { id: string; discussionId: string; authorId: string; content: string; timestamp: string; };
export type Organization = { id: string; name: string; };
export type TeamMember = { userId: string; title: string; permissions: { read: boolean; create: boolean; update: boolean; delete: boolean; }; };
export type Team = { id: string; name: string; description: string; orgId: string; members: TeamMember[]; };
export type FileNode = { id: string; projectId: string; type: 'file' | 'folder' | 'upload'; name: string; parentId: string | null; content?: string; fileData?: string; fileType?: string; uploaderId: string; attachedMemberIds?: string[]; isArchived?: boolean; };

export function formatFriendlyDate(dateStr: string) {
  if (!dateStr) return '';
  if (dateStr === '2026-04-23') return 'Today';
  if (dateStr === '2026-04-24') return 'Tomorrow';
  if (dateStr === '2026-04-22') return 'Yesterday';
  const d = new Date(dateStr);
  if (isNaN(d.valueOf())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type AppContextType = {
  currentUser: User | null;
  login: (id: string) => void;
  loginWithToken: (user: User) => void;
  logout: () => void;
  projects: Project[];
  addProject: (p: Pick<Project, 'name' | 'description' | 'memberIds'>) => void;
  tasks: Task[];
  addTask: (t: Omit<Task, 'id' | 'status'>) => string;
  addSubTask: (parentTaskId: string, t: Omit<Task, 'id' | 'status' | 'parentTaskId'>) => void;
  addUser: (u: Pick<User, 'name' | 'role'> & { email: string }) => string;
  updateTaskStatus: (id: string, status: Task['status']) => void;
  updateTaskAssignees: (id: string, assigneeIds: string[]) => void;
  users: User[];
  isProjectModalOpen: boolean;
  setProjectModalOpen: (open: boolean) => void;
  isTaskModalOpen: { open: boolean; projectId?: string; dateStr?: string };
  setTaskModalOpen: (state: { open: boolean; projectId?: string; dateStr?: string }) => void;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  discussions: Discussion[];
  addDiscussion: (d: Pick<Discussion, 'title' | 'projectId'>) => void;
  messages: Message[];
  addMessage: (m: Pick<Message, 'discussionId' | 'content' | 'authorId'>) => void;
  organization: Organization;
  updateOrganization: (patch: Partial<Organization>) => void;
  teams: Team[];
  addTeam: (t: Pick<Team, 'name' | 'description' | 'members'>) => void;
  updateTeamMembers: (id: string, members: TeamMember[]) => void;
  linkTeamToProject: (projectId: string, teamId: string) => void;
  files: FileNode[];
  addFile: (f: Pick<FileNode, 'projectId' | 'type' | 'name' | 'parentId' | 'content' | 'fileData' | 'fileType' | 'attachedMemberIds'>) => void;
  updateFileContent: (id: string, content: string) => void;
  archiveProject: (id: string) => void;
  restoreProject: (id: string) => void;
  archiveFile: (id: string) => void;
  restoreFile: (id: string) => void;
};

export const AppContext = createContext<AppContextType | null>(null);

const initialUsers: User[] = [
  { id: 'u1', name: 'Sarah Jenkins', avatar: 'https://picsum.photos/seed/sarah/100/100', color: 'bg-primary', role: 'Organization Lead' },
  { id: 'u2', name: 'Alex Chen', avatar: 'https://picsum.photos/seed/alex/100/100', color: 'bg-secondary', role: 'Project Lead' },
  { id: 'u3', name: 'Jordan Lee', avatar: 'https://picsum.photos/seed/jordan/100/100', color: 'bg-tertiary', role: 'Team Lead' },
  { id: 'u4', name: 'Taylor Swift', avatar: 'https://picsum.photos/seed/taylor/100/100', color: 'bg-error', role: 'Contributor' }
];

const initialProjects: Project[] = [
  { id: 'p1', name: 'Q3 Platform Redesign', description: 'Overhaul the core platform UI for improved conversions.', status: 'Active', teamIds: ['t1'], memberIds: ['u1', 'u2'] },
  { id: 'p2', name: 'Client Onboarding Flow', description: 'Streamline the sign-up and initial configuration.', status: 'Active', teamIds: [], memberIds: ['u1'] },
  { id: 'p3', name: 'Security Audit Resolution', description: 'Address all P1/P2 issues from the recent audit.', status: 'Active', teamIds: ['t2'], memberIds: ['u3'] }
];

const initialOrganization: Organization = { id: 'org1', name: 'Trust & Peace Inc.' };

const initialTeams: Team[] = [
  {
    id: 't1', orgId: 'org1', name: 'Frontend Guild', description: 'Core UI/UX engineers',
    members: [
      { userId: 'u1', title: 'Organization Lead', permissions: { read: true, create: true, update: true, delete: true } },
      { userId: 'u2', title: 'Project Lead', permissions: { read: true, create: true, update: true, delete: true } }
    ]
  },
  {
    id: 't2', orgId: 'org1', name: 'Backend Services', description: 'API and Database team',
    members: [
      { userId: 'u3', title: 'Team Lead', permissions: { read: true, create: true, update: true, delete: false } }
    ]
  }
];

const initialFiles: FileNode[] = [
  { id: 'f1', projectId: 'p1', type: 'folder', name: 'Design Specs', parentId: null, uploaderId: 'u1' },
  { id: 'f2', projectId: 'p1', type: 'file', name: 'Q3_Requirements.html', parentId: 'f1', content: '<h2>Requirements</h2><ul><li>Improve UX</li></ul>', uploaderId: 'u1', attachedMemberIds: ['u1'] }
];

const initialTasks: Task[] = [
  { id: 't1', projectId: 'p1', title: 'Review Q3 Wireframes', status: 'Todo', assigneeIds: ['u1', 'u2'], dueDate: '2026-04-23', priority: 'High' },
  { id: 't2', projectId: 'p2', title: 'Draft update for Stakeholders', status: 'In Progress', assigneeIds: ['u1'], dueDate: '2026-04-24', priority: 'Medium' },
  { id: 't3', projectId: 'p1', title: 'Phase 1 Design Handoff', status: 'Done', assigneeIds: ['u3'], dueDate: '2026-04-22', priority: 'High' },
  { id: 't4', projectId: 'p3', title: 'Patch Middleware vulnerability', status: 'In Progress', assigneeIds: ['u2'], dueDate: '2026-04-25', priority: 'High' }
];

const initialDiscussions: Discussion[] = [
  { id: 'd1', projectId: 'p1', title: 'Platform Redesign - Design Sync', updatedAt: '2026-04-23T10:30:00' },
  { id: 'd2', projectId: null, title: 'General Announcements', updatedAt: '2026-04-22T08:15:00' },
  { id: 'd3', projectId: 'p2', title: 'Onboarding Flow - Legal Copy updates', updatedAt: '2026-04-21T14:45:00' }
];

const initialMessages: Message[] = [
  { id: 'm1', discussionId: 'd1', authorId: 'u1', content: 'Hey everyone, I uploaded the new wireframes. Could we review them today?', timestamp: '2026-04-23T09:00:00' },
  { id: 'm2', discussionId: 'd1', authorId: 'u3', content: 'They look great. I have a few notes on the navigation structure.', timestamp: '2026-04-23T10:15:00' },
  { id: 'm3', discussionId: 'd1', authorId: 'u2', content: 'I will take a look after my current meeting.', timestamp: '2026-04-23T10:30:00' },
  { id: 'm4', discussionId: 'd2', authorId: 'u1', content: 'Welcome to the new Trust & Peace workspace!', timestamp: '2026-04-22T08:15:00' }
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [discussions, setDiscussions] = useState<Discussion[]>(initialDiscussions);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [organization, setOrganization] = useState<Organization>(initialOrganization);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [files, setFiles] = useState<FileNode[]>(initialFiles);

  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskModalOpen] = useState<{ open: boolean; projectId?: string; dateStr?: string }>({ open: false });

  // ── Stable callbacks — never recreated unless deps change ──────────────────

  const addProject = useCallback((project: Pick<Project, 'name' | 'description' | 'memberIds'>) => {
    setProjects(prev => [...prev, { ...project, id: `p${Date.now()}`, status: 'Active', teamIds: [] }]);
  }, []);

  const addUser = useCallback((userData: Pick<User, 'name' | 'role'> & { email: string }) => {
    const newId = `u${Date.now()}`;
    const newUser: User = {
      id: newId,
      name: userData.name || userData.email.split('@')[0],
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${userData.email}`,
      color: 'bg-primary',
      role: userData.role || 'Contributor'
    };
    setUsers(prev => [...prev, newUser]);
    return newId;
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'status'>): string => {
    const newTaskId = `t${Date.now()}`;
    setTasks(prev => [...prev, { ...task, id: newTaskId, status: 'Todo' }]);
    if (task.notifyIds && task.notifyIds.length > 0) {
      const ts = new Date().toISOString();
      const newNotifs = task.notifyIds.map(uid => ({
        id: `n${Date.now()}_${uid}`,
        userId: uid,
        message: `You were notified about a new task: ${task.title}`,
        read: false,
        timestamp: ts,
        taskId: newTaskId
      }));
      setNotifications(prev => [...prev, ...newNotifs]);
    }
    return newTaskId;
  }, []);

  const addSubTask = useCallback((parentTaskId: string, task: Omit<Task, 'id' | 'status' | 'parentTaskId'>) => {
    const newTaskId = `t${Date.now()}`;
    setTasks(prev => [...prev, { ...task, id: newTaskId, status: 'Todo', parentTaskId }]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications(prev => prev.filter(n => n.userId !== currentUser?.id));
  }, [currentUser?.id]);

  const updateTaskStatus = useCallback((id: string, status: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }, []);

  const updateTaskAssignees = useCallback((id: string, assigneeIds: string[]) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, assigneeIds } : t));
  }, []);

  const addDiscussion = useCallback((discussion: Pick<Discussion, 'title' | 'projectId'>) => {
    setDiscussions(prev => [{ ...discussion, id: `d${Date.now()}`, updatedAt: new Date().toISOString() }, ...prev]);
  }, []);

  const addMessage = useCallback((message: Pick<Message, 'discussionId' | 'content' | 'authorId'>) => {
    const timestamp = new Date().toISOString();
    setMessages(prev => [...prev, { ...message, id: `m${Date.now()}`, timestamp }]);
    setDiscussions(prev =>
      prev
        .map(d => d.id === message.discussionId ? { ...d, updatedAt: timestamp } : d)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );
  }, []);

  const addTeam = useCallback((team: Pick<Team, 'name' | 'description' | 'members'>) => {
    setTeams(prev => [...prev, { ...team, id: `tm${Date.now()}`, orgId: organization.id }]);
  }, [organization.id]);

  const updateTeamMembers = useCallback((id: string, members: TeamMember[]) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, members } : t));
  }, []);

  const linkTeamToProject = useCallback((projectId: string, teamId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, teamIds: p.teamIds.includes(teamId) ? p.teamIds : [...p.teamIds, teamId] };
    }));
  }, []);

  const addFile = useCallback((f: Pick<FileNode, 'projectId' | 'type' | 'name' | 'parentId' | 'content' | 'attachedMemberIds'>) => {
    setFiles(prev => [...prev, { ...f, id: `f${Date.now()}`, uploaderId: 'u1' }]);
  }, []);

  const updateFileContent = useCallback((id: string, content: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, content } : f));
  }, []);

  const archiveProject = useCallback((id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'Archived' } : p));
  }, []);

  const restoreProject = useCallback((id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'Active' } : p));
  }, []);

  const archiveFile = useCallback((id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isArchived: true } : f));
  }, []);

  const restoreFile = useCallback((id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isArchived: false } : f));
  }, []);

  const login = useCallback((id: string) => {
    setCurrentUser(u => {
      const found = initialUsers.find(u => u.id === id);
      return found ?? u;
    });
    setUsers(prev => {
      const found = prev.find(u => u.id === id);
      if (found) setCurrentUser(found);
      return prev;
    });
  }, []);

  const loginWithToken = useCallback((user: User) => {
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const updateOrganization = useCallback((patch: Partial<Organization>) => {
    setOrganization(prev => ({ ...prev, ...patch }));
  }, []);

  // ── Memoize the context value — only changes when actual data changes ───────
  const value = useMemo<AppContextType>(() => ({
    currentUser, login, loginWithToken, logout,
    notifications, markNotificationRead, clearNotifications,
    projects, addProject,
    tasks, addTask, addSubTask, updateTaskStatus, updateTaskAssignees,
    users, addUser,
    discussions, addDiscussion,
    messages, addMessage,
    organization, updateOrganization,
    teams, addTeam, updateTeamMembers, linkTeamToProject,
    files, addFile, updateFileContent,
    archiveProject, restoreProject,
    archiveFile, restoreFile,
    isProjectModalOpen, setProjectModalOpen,
    isTaskModalOpen, setTaskModalOpen,
  }), [
    currentUser, login, loginWithToken, logout,
    notifications, markNotificationRead, clearNotifications,
    projects, addProject,
    tasks, addTask, addSubTask, updateTaskStatus, updateTaskAssignees,
    users, addUser,
    discussions, addDiscussion,
    messages, addMessage,
    organization, updateOrganization,
    teams, addTeam, updateTeamMembers, linkTeamToProject,
    files, addFile, updateFileContent,
    archiveProject, restoreProject,
    archiveFile, restoreFile,
    isProjectModalOpen, isTaskModalOpen,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
      {isProjectModalOpen && (
        <ProjectModal
          onClose={() => setProjectModalOpen(false)}
          onAdd={addProject}
          users={users}
          onInviteUser={addUser}
        />
      )}
      {isTaskModalOpen.open && (
        <TaskModal
          projectId={isTaskModalOpen.projectId}
          dateStr={isTaskModalOpen.dateStr}
          onClose={() => setTaskModalOpen({ open: false })}
          onAdd={addTask}
          onAddSubTask={addSubTask}
          projects={projects}
          users={users}
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

// ── Modals ────────────────────────────────────────────────────────────────────

function ProjectModal({ onClose, onAdd, users, onInviteUser }: {
  onClose: () => void;
  onAdd: (p: Pick<Project, 'name' | 'description' | 'memberIds'>) => void;
  users: User[];
  onInviteUser: (u: Pick<User, 'name' | 'role'> & { email: string }) => string;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Contributor");

  const toggleMember = useCallback((id: string) => {
    setMemberIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const handleInvite = useCallback(() => {
    if (!inviteEmail || !inviteEmail.includes('@')) return;
    const newId = onInviteUser({ email: inviteEmail, role: inviteRole, name: inviteEmail.split('@')[0] });
    setMemberIds(prev => [...prev, newId]);
    setInviteEmail("");
  }, [inviteEmail, inviteRole, onInviteUser]);

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name) return;
    onAdd({ name, description, memberIds });
    onClose();
  }, [name, description, memberIds, onAdd, onClose]);

  return (
    <div className="fixed inset-0 bg-on-background/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-surface border border-outline-variant/30 rounded-xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] flex flex-col">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface cursor-pointer"><X size={20}/></button>
        <h2 className="text-headline-md font-headline-md text-on-surface mb-6 shrink-0">Create New Project</h2>

        <div className="space-y-6 overflow-y-auto no-scrollbar pb-4 -mx-2 px-2">
          <div className="space-y-4">
            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Project Name</label>
              <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q4 Marketing Campaign" className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2 outline-none focus:border-primary text-body-md transition-colors" required />
            </div>
            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Description (Optional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief overview of the goals..." className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2 outline-none focus:border-primary text-body-md min-h-[80px] resize-none transition-colors" />
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/30">
            <h3 className="text-body-lg font-semibold text-on-surface mb-4">Project Members</h3>
            <div className="mb-6">
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-2">Assign Existing Members</label>
              <div className="flex gap-2 flex-wrap max-h-[120px] overflow-y-auto p-1">
                {users.map(u => (
                  <button key={u.id} type="button" onClick={() => toggleMember(u.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-body-md transition-all cursor-pointer ${memberIds.includes(u.id) ? 'bg-primary border-primary text-on-primary' : 'bg-surface-container-lowest border-outline-variant hover:border-outline text-on-surface-variant'}`}>
                    <Image src={u.avatar} width={18} height={18} className="rounded-full overflow-hidden shrink-0" alt={u.name} unoptimized />
                    <div className="flex flex-col text-left line-clamp-1">
                      <span>{u.name}</span>
                      <span className="text-[10px] opacity-70 leading-none">{u.role}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4">
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-2">Invite New Member</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@example.com" className="flex-1 bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm outline-none focus:border-primary transition-colors" />
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm outline-none focus:border-primary cursor-pointer">
                  <option value="Contributor">Contributor</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="Project Lead">Project Lead</option>
                </select>
                <button type="button" onClick={handleInvite} disabled={!inviteEmail} className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg font-medium text-body-sm transition-colors cursor-pointer disabled:opacity-50">Invite</button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-outline-variant/30 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-body-md font-medium text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg text-body-md font-medium bg-primary text-on-primary hover:opacity-90 transition-opacity cursor-pointer shadow-sm">Create Project</button>
        </div>
      </form>
    </div>
  );
}

function TaskModal({ onClose, onAdd, onAddSubTask, projects, users, projectId, dateStr }: {
  onClose: () => void;
  onAdd: (t: Omit<Task, 'id' | 'status'>) => string;
  onAddSubTask: (parentTaskId: string, t: Omit<Task, 'id' | 'status' | 'parentTaskId'>) => void;
  projects: Project[];
  users: User[];
  projectId?: string;
  dateStr?: string;
}) {
  const [title, setTitle] = useState("");
  const [projId, setProjId] = useState(projectId || (projects[0]?.id || ""));
  const [dueDate, setDueDate] = useState(dateStr || "2026-04-23");
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [notifyIds, setNotifyIds] = useState<string[]>([]);
  const [subTaskTitles, setSubTaskTitles] = useState<string[]>([]);
  const [subTaskInput, setSubTaskInput] = useState("");
  const [showSubTasks, setShowSubTasks] = useState(false);

  const toggleAssignee = useCallback((id: string) => {
    setAssigneeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const toggleNotify = useCallback((id: string) => {
    setNotifyIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const addSubTaskTitle = useCallback(() => {
    const trimmed = subTaskInput.trim();
    if (!trimmed) return;
    setSubTaskTitles(prev => [...prev, trimmed]);
    setSubTaskInput("");
  }, [subTaskInput]);

  const removeSubTaskTitle = useCallback((index: number) => {
    setSubTaskTitles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !projId) return;
    const parentId = onAdd({ title, projectId: projId, dueDate, priority, assigneeIds, notifyIds });
    subTaskTitles.forEach(subTitle => {
      onAddSubTask(parentId, { title: subTitle, projectId: projId, dueDate, priority: 'Low', assigneeIds: [], notifyIds: [] });
    });
    onClose();
  }, [title, projId, dueDate, priority, assigneeIds, notifyIds, subTaskTitles, onAdd, onAddSubTask, onClose]);

  // Non-org-lead users for notifications
  const notifyableUsers = useMemo(() => users.filter(u => u.role !== 'Organization Lead'), [users]);

  return (
    <div className="fixed inset-0 bg-on-background/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-surface border border-outline-variant/30 rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface cursor-pointer"><X size={20}/></button>
        <h2 className="text-headline-md font-headline-md text-on-surface mb-6">Add New Task</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Task Title</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Finalize copy for homepage" className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2 outline-none focus:border-primary text-body-md transition-colors" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Project</label>
              <select value={projId} onChange={e => setProjId(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 py-2 outline-none focus:border-primary text-body-md transition-colors cursor-pointer" required>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as 'Low' | 'Medium' | 'High')} className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 py-2 outline-none focus:border-primary text-body-md transition-colors cursor-pointer">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2 outline-none focus:border-primary text-body-md transition-colors" />
          </div>

          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-2">Assign Team Members</label>
            <div className="flex gap-2 flex-wrap">
              {users.map(u => (
                <button key={u.id} type="button" onClick={() => toggleAssignee(u.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-body-md transition-all cursor-pointer ${assigneeIds.includes(u.id) ? 'bg-primary border-primary text-on-primary' : 'bg-surface-container-lowest border-outline-variant hover:border-outline text-on-surface-variant'}`}>
                  <Image src={u.avatar} width={18} height={18} className="rounded-full overflow-hidden shrink-0" alt={u.name} unoptimized />
                  <div className="flex flex-col text-left line-clamp-1">
                    <span>{u.name}</span>
                    <span className="text-[10px] opacity-70 leading-none">{u.role}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-2">Notify Members (Optional)</label>
            <div className="flex gap-2 flex-wrap">
              {notifyableUsers.map(u => (
                <button key={`notify-${u.id}`} type="button" onClick={() => toggleNotify(u.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-body-md transition-all cursor-pointer ${notifyIds.includes(u.id) ? 'bg-secondary-container border-secondary-container text-on-secondary-container' : 'bg-surface-container-lowest border-outline-variant hover:border-outline text-on-surface-variant'}`}>
                  <div className="flex flex-col text-left line-clamp-1">
                    <span>{u.name}</span>
                    <span className="text-[10px] opacity-70 leading-none">{u.role}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-outline-variant/30 pt-4">
            <button type="button" onClick={() => setShowSubTasks(p => !p)}
              className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer w-full">
              <GitBranch size={15} className="text-primary" />
              <span className="font-medium">Sub-tasks</span>
              {subTaskTitles.length > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold">{subTaskTitles.length}</span>
              )}
              <span className="ml-auto">{showSubTasks ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
            </button>

            {showSubTasks && (
              <div className="mt-3 space-y-2">
                {subTaskTitles.map((st, i) => (
                  <div key={i} className="flex items-center gap-2 pl-4 border-l-2 border-primary/30">
                    <GitBranch size={12} className="text-primary/50 shrink-0" />
                    <span className="flex-1 text-body-md text-on-surface">{st}</span>
                    <button type="button" onClick={() => removeSubTaskTitle(i)} className="text-on-surface-variant hover:text-error transition-colors cursor-pointer p-0.5 rounded">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pl-4 border-l-2 border-outline-variant/30 mt-2">
                  <input type="text" value={subTaskInput} onChange={e => setSubTaskInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubTaskTitle(); } }}
                    placeholder="Add a sub-task…"
                    className="flex-1 bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 py-1.5 outline-none focus:border-primary text-body-md transition-colors text-sm" />
                  <button type="button" onClick={addSubTaskTitle} disabled={!subTaskInput.trim()}
                    className="p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors cursor-pointer disabled:opacity-40">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-body-md font-medium text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg text-body-md font-medium bg-primary text-on-primary hover:opacity-90 transition-opacity cursor-pointer shadow-sm">Add Task</button>
        </div>
      </form>
    </div>
  );
}
