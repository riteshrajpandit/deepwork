"use client";
import React, { useState } from "react";
import { useAppContext } from "@/components/AppProvider";
import { Building2, Users, Plus, MailOpen, UserPlus, MoreHorizontal, Shield, Edit2, Trash2 } from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
  const { organization, teams, users, addTeam, updateTeamMembers } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<'Org'|'Teams'>('Teams');
  const [newTeamOpen, setNewTeamOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;
    addTeam({ name: newTeamName, description: newTeamDesc, members: [] });
    setNewTeamName("");
    setNewTeamDesc("");
    setNewTeamOpen(false);
  };

  const removeTeamMember = (teamId: string, memberId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    const newMembers = team.members.filter(m => m.userId !== memberId);
    updateTeamMembers(teamId, newMembers);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-display-xl font-display-xl text-on-surface mb-1">Settings</h2>
          <p className="text-body-md font-body-md text-on-surface-variant">Manage organization and teams.</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Settings Navigation */}
        <div className="w-64 bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-4 shrink-0 flex flex-col gap-2 ambient-shadow hidden md:flex">
          <button 
            onClick={() => setActiveTab('Org')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 cursor-pointer ${activeTab === 'Org' ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'}`}
          >
            <Building2 size={18} strokeWidth={activeTab === 'Org' ? 2.5 : 2} /> Organization
          </button>
          <button 
            onClick={() => setActiveTab('Teams')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 cursor-pointer ${activeTab === 'Teams' ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'}`}
          >
            <Users size={18} strokeWidth={activeTab === 'Teams' ? 2.5 : 2} /> Teams & Groups
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
          
          {activeTab === 'Org' && (
            <div className="space-y-6 max-w-3xl">
              <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-8 ambient-shadow">
                <h3 className="text-headline-md font-headline-md text-on-surface mb-6">Organization Profile</h3>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-display-large font-bold shrink-0">
                    {organization.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Workspace Name</label>
                    <input type="text" value={organization.name} readOnly className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2 text-on-surface outline-none" />
                    <p className="text-[12px] text-outline mt-2">Organization name changes require super admin privileges.</p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-8 ambient-shadow">
                <h3 className="text-headline-md font-headline-md text-on-surface mb-6">Invite Members</h3>
                <div className="flex gap-4">
                  <input type="email" placeholder="colleague@company.com" className="flex-1 bg-surface-container border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface outline-none focus:border-primary transition-colors" />
                  <button className="px-6 py-2.5 bg-primary text-on-primary font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm">
                    <MailOpen size={18} /> Send Invite
                  </button>
                </div>
                
                <div className="mt-8 border-t border-outline-variant/30 pt-6">
                   <h4 className="text-label-sm font-label-sm text-outline uppercase tracking-wider mb-4">Current Members</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {users.map(u => (
                       <div key={u.id} className="flex items-center gap-3 p-3 border border-outline-variant/30 rounded-xl bg-surface">
                         <div className="w-10 h-10 rounded-full bg-surface-container shadow-sm overflow-hidden border border-surface">
                           <Image src={u.avatar} alt={u.name} width={40} height={40} unoptimized className="w-full h-full object-cover" />
                         </div>
                         <div className="flex-1 truncate">
                           <p className="text-body-md font-body-md font-medium text-on-surface">{u.name}</p>
                           <p className="text-[11px] text-outline-variant truncate">member</p>
                         </div>
                         <button className="p-2 text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-md transition-colors cursor-pointer"><MoreHorizontal size={16}/></button>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Teams' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-headline-md font-headline-md text-on-surface">Manage Teams</h3>
                {!newTeamOpen && (
                  <button onClick={() => setNewTeamOpen(true)} className="px-4 py-2 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-2 cursor-pointer">
                    <Plus size={18} /> Create Team
                  </button>
                )}
              </div>

              {newTeamOpen && (
                <div className="bg-surface-container-lowest border border-primary/40 rounded-xl p-6 ambient-shadow mb-8 relative">
                   <h4 className="text-body-lg font-medium text-on-surface mb-4">New Team Name</h4>
                   <form onSubmit={handleCreateTeam}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                       <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="e.g. Design Systems" className="bg-surface border border-outline-variant/50 rounded-lg px-4 py-2 outline-none focus:border-primary" autoFocus required />
                       <input value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} placeholder="Team purpose or description" className="bg-surface border border-outline-variant/50 rounded-lg px-4 py-2 outline-none focus:border-primary" />
                     </div>
                     <div className="flex justify-end gap-3">
                       <button type="button" onClick={() => setNewTeamOpen(false)} className="px-4 py-2 text-on-surface-variant hover:text-on-surface font-medium cursor-pointer">Cancel</button>
                       <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium shadow-sm hover:opacity-90 cursor-pointer">Save Team</button>
                     </div>
                   </form>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                {teams.map(team => {
                  const availableUsers = users.filter(u => !team.members.some(m => m.userId === u.id));

                  return (
                    <TeamManagementCard 
                      key={team.id} 
                      team={team} 
                      availableUsers={availableUsers} 
                      allUsers={users}
                      onUpdateMembers={(newMembers) => updateTeamMembers(team.id, newMembers)}
                    />
                  );
                })}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

import { Team, TeamMember, User } from "@/components/AppProvider";

function TeamManagementCard({ team, availableUsers, allUsers, onUpdateMembers }: { team: Team, availableUsers: User[], allUsers: User[], onUpdateMembers: (m: TeamMember[]) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [perms, setPerms] = useState({ read: true, create: false, update: false, delete: false });
  const [editingMember, setEditingMember] = useState<string | null>(null);

  const handleAddMember = () => {
    if (!newUserId) return;
    const newMember: TeamMember = {
      userId: newUserId,
      title: newTitle || 'Team Member',
      permissions: perms
    };
    onUpdateMembers([...team.members, newMember]);
    setIsAdding(false);
    setNewUserId("");
    setNewTitle("");
    setPerms({ read: true, create: false, update: false, delete: false });
  };

  const handleUpdateMember = (userId: string, updatedMember: TeamMember) => {
    onUpdateMembers(team.members.map(m => m.userId === userId ? updatedMember : m));
    setEditingMember(null);
  };

  const handleRemoveMember = (userId: string) => {
    onUpdateMembers(team.members.filter(m => m.userId !== userId));
  };

  return (
    <div className="flex flex-col bg-surface-container-lowest border border-outline-variant/50 rounded-xl ambient-shadow overflow-hidden">
      <div className="p-5 border-b border-outline-variant/30 bg-surface flex justify-between items-center">
        <div>
          <h4 className="text-body-lg font-medium text-on-surface">{team.name}</h4>
          <p className="text-label-sm font-label-sm text-on-surface-variant mt-1">{team.description || 'No description provided.'}</p>
        </div>
        <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wider flex items-center gap-2">
          <Shield size={14} /> {team.members.length} Members
        </span>
      </div>
      
      <div className="flex-1 px-5 py-2 bg-surface-container-lowest divide-y divide-outline-variant/20">
         {team.members.map(member => {
           const u = allUsers.find(user => user.id === member.userId);
           if (!u) return null;
           const isEditing = editingMember === member.userId;

           return (
             <div key={member.userId} className="py-4 flex flex-col md:flex-row md:items-center gap-4">
               <div className="flex items-center gap-3 w-64 shrink-0">
                 <Image src={u.avatar} alt={u.name} width={36} height={36} className="rounded-full shadow-sm" unoptimized />
                 <div>
                   <p className="text-body-md font-medium text-on-surface">{u.name}</p>
                   <p className="text-label-sm text-on-surface-variant font-medium">{member.title}</p>
                 </div>
               </div>

               {isEditing ? (
                 <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 bg-surface-container border border-outline-variant/50 p-3 rounded-lg">
                   <div className="flex gap-4 p-2 bg-surface-container-lowest rounded-md">
                     <label className="flex items-center gap-1.5 text-label-sm cursor-pointer"><input type="checkbox" checked={member.permissions.read} readOnly className="accent-primary" /> Read</label>
                     <label className="flex items-center gap-1.5 text-label-sm cursor-pointer"><input type="checkbox" defaultChecked={member.permissions.create} onChange={e => handleUpdateMember(member.userId, { ...member, permissions: { ...member.permissions, create: e.target.checked } })} className="accent-primary" /> Create</label>
                     <label className="flex items-center gap-1.5 text-label-sm cursor-pointer"><input type="checkbox" defaultChecked={member.permissions.update} onChange={e => handleUpdateMember(member.userId, { ...member, permissions: { ...member.permissions, update: e.target.checked } })} className="accent-primary" /> Update</label>
                     <label className="flex items-center gap-1.5 text-label-sm cursor-pointer text-error"><input type="checkbox" defaultChecked={member.permissions.delete} onChange={e => handleUpdateMember(member.userId, { ...member, permissions: { ...member.permissions, delete: e.target.checked } })} className="accent-error" /> Delete</label>
                   </div>
                   <button onClick={() => setEditingMember(null)} className="px-3 py-1.5 text-[12px] bg-primary text-on-primary rounded font-medium shadow-sm active:scale-95 transition-all">Done</button>
                 </div>
               ) : (
                 <div className="flex-1 flex items-center justify-between">
                    <div className="flex gap-2">
                       {member.permissions.read && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface">Read</span>}
                       {member.permissions.create && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container">Create</span>}
                       {member.permissions.update && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-tertiary-container text-on-tertiary-container">Update</span>}
                       {member.permissions.delete && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-error-container text-on-error-container">Delete</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingMember(member.userId)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded transition-colors cursor-pointer" title="Edit Permissions">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleRemoveMember(member.userId)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded transition-colors cursor-pointer" title="Remove Member">
                        <Trash2 size={16} />
                      </button>
                    </div>
                 </div>
               )}
             </div>
           );
         })}
         
         {team.members.length === 0 && (
           <div className="py-6 text-center text-label-sm text-outline italic">No members assigned to this team yet.</div>
         )}
      </div>

      <div className="bg-surface-container p-5 border-t border-outline-variant/30">
        {isAdding ? (
          <div className="bg-surface-container-lowest border border-outline-variant/50 p-4 rounded-xl ambient-shadow flex flex-col gap-4">
             <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
               <h5 className="text-body-md font-semibold text-on-surface">Assign New Member Details</h5>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Select User</label>
                 <select value={newUserId} onChange={e => setNewUserId(e.target.value)} className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-body-sm outline-none focus:border-primary cursor-pointer">
                   <option value="" disabled>Choose a team member...</option>
                   {availableUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                 </select>
               </div>
               <div>
                 <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Assigned Title/Role</label>
                 <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-body-sm outline-none focus:border-primary" />
               </div>
             </div>

             <div>
               <label className="block text-label-sm font-label-sm text-on-surface-variant mb-2">Access Control (RBAC)</label>
               <div className="flex flex-wrap gap-4 p-3 bg-surface border border-outline-variant/30 rounded-lg">
                 <label className="flex items-center gap-2 cursor-pointer text-body-sm"><input type="checkbox" checked={perms.read} readOnly className="accent-primary w-4 h-4" /> Read (Required)</label>
                 <label className="flex items-center gap-2 cursor-pointer text-body-sm"><input type="checkbox" checked={perms.create} onChange={e => setPerms({...perms, create: e.target.checked})} className="accent-primary w-4 h-4" /> Create</label>
                 <label className="flex items-center gap-2 cursor-pointer text-body-sm"><input type="checkbox" checked={perms.update} onChange={e => setPerms({...perms, update: e.target.checked})} className="accent-primary w-4 h-4" /> Update</label>
                 <label className="flex items-center gap-2 cursor-pointer text-body-sm text-error"><input type="checkbox" checked={perms.delete} onChange={e => setPerms({...perms, delete: e.target.checked})} className="accent-error w-4 h-4" /> Delete</label>
               </div>
             </div>

             <div className="flex justify-end gap-3 mt-2">
               <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-body-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">Cancel</button>
               <button onClick={handleAddMember} disabled={!newUserId || !newTitle} className="px-4 py-2 bg-primary text-on-primary text-body-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2">
                 <UserPlus size={16} /> Assign to Team
               </button>
             </div>
          </div>
        ) : (
          <button 
             onClick={() => setIsAdding(true)}
             disabled={availableUsers.length === 0}
             className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-outline-variant hover:border-primary/50 text-body-sm font-medium text-on-surface-variant hover:text-on-surface bg-surface-container-lowest hover:bg-surface-container-low transition-all cursor-pointer disabled:opacity-50"
          >
             <Plus size={16} /> Add Member Roles
          </button>
        )}
      </div>
    </div>
  );
}
