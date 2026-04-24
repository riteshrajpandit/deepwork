"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "@/components/AppProvider";
import {
  Building2, Users, Plus, Mail, MoreHorizontal, Shield,
  Edit2, Trash2, Crown, UserPlus, Loader2,
  AlertTriangle, Check, X, UserCog, ArrowRightLeft, ChevronDown
} from "lucide-react";
import Image from "next/image";
import { orgApi, teamApi, OrgMember, OrgRole, ApiTeam, ApiError } from "@/lib/api";

// ── Role badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: OrgRole }) {
  const styles: Record<OrgRole, string> = {
    owner: "bg-primary/10 text-primary",
    admin: "bg-secondary-container text-on-secondary-container",
    member: "bg-surface-container-high text-on-surface-variant",
  };
  const icons: Record<OrgRole, React.ReactNode> = {
    owner: <Crown size={11} />,
    admin: <Shield size={11} />,
    member: null,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[role]}`}>
      {icons[role]}
      {role}
    </span>
  );
}

// ── Confirm modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  title, message, confirmLabel, danger = false,
  onConfirm, onCancel, loading,
}: {
  title: string; message: string; confirmLabel: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-on-background/20 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-surface border border-outline-variant/30 rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${danger ? "bg-error-container" : "bg-secondary-container"}`}>
          <AlertTriangle size={20} className={danger ? "text-error" : "text-secondary"} />
        </div>
        <h3 className="text-headline-md font-headline-md text-on-surface mb-2">{title}</h3>
        <p className="text-body-md text-on-surface-variant mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-body-md font-medium text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-body-md font-medium flex items-center gap-2 cursor-pointer disabled:opacity-60 shadow-sm ${
              danger ? "bg-error text-on-error hover:opacity-90" : "bg-primary text-on-primary hover:opacity-90"
            }`}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Member action menu ────────────────────────────────────────────────────────

function MemberActionsMenu({
  member, myRole, myId, orgId,
  onRefresh,
}: {
  member: OrgMember; myRole: OrgRole; myId: string; orgId: string;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<{
    action: string; label: string; danger?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isOwner = myRole === "owner";
  const isAdmin = myRole === "admin";
  const targetIsOwner = member.role === "owner";
  const targetIsAdmin = member.role === "admin";
  const targetIsSelf = member.user === myId;

  // Only show menu if the viewer has any available action
  const canPromote = isOwner && !targetIsAdmin && !targetIsOwner;
  const canDemote = isOwner && targetIsAdmin;
  const canTransfer = isOwner && !targetIsOwner;
  const canRemove = (isOwner || isAdmin) && !targetIsOwner && !targetIsSelf;

  if (!canPromote && !canDemote && !canTransfer && !canRemove) return null;

  const doAction = async () => {
    if (!confirm) return;
    setLoading(true);
    setError("");
    try {
      if (confirm.action === "add-admin") await orgApi.addAdmin(orgId, member.user);
      else if (confirm.action === "remove-admin") await orgApi.removeAdmin(orgId, member.user);
      else if (confirm.action === "demote-admin") await orgApi.demoteAdmin(orgId, member.user);
      else if (confirm.action === "transfer") await orgApi.transferOwnership(orgId, member.user);
      else if (confirm.action === "remove") await orgApi.removeMember(orgId, member.user);
      setConfirm(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  const name = member.user_full_name?.trim() || member.user_email;

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(p => !p)}
          className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-md transition-colors cursor-pointer"
        >
          <MoreHorizontal size={16} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 mt-1 w-52 bg-surface border border-outline-variant/30 rounded-xl shadow-lg z-50 overflow-hidden py-1">
              {canPromote && (
                <button
                  onClick={() => { setOpen(false); setConfirm({ action: "add-admin", label: "Make Admin" }); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-body-md text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <Shield size={15} className="text-secondary" /> Make Admin
                </button>
              )}
              {canDemote && (
                <button
                  onClick={() => { setOpen(false); setConfirm({ action: "remove-admin", label: "Remove Admin" }); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-body-md text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <UserCog size={15} className="text-on-surface-variant" /> Remove Admin
                </button>
              )}
              {canDemote && (
                <button
                  onClick={() => { setOpen(false); setConfirm({ action: "demote-admin", label: "Demote to Member" }); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-body-md text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <ChevronDown size={15} className="text-on-surface-variant" /> Demote to Member
                </button>
              )}
              {canTransfer && (
                <button
                  onClick={() => { setOpen(false); setConfirm({ action: "transfer", label: "Transfer Ownership", danger: true }); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-body-md text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <ArrowRightLeft size={15} className="text-primary" /> Transfer Ownership
                </button>
              )}
              {canRemove && (
                <>
                  <div className="h-px bg-outline-variant/30 my-1" />
                  <button
                    onClick={() => { setOpen(false); setConfirm({ action: "remove", label: "Remove", danger: true }); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-body-md text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} /> Remove from org
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {confirm && (
        <ConfirmModal
          title={confirm.label}
          message={
            confirm.action === "transfer"
              ? `Transfer ownership to ${name}? You will become an admin and lose owner privileges.`
              : confirm.action === "remove"
              ? `Remove ${name} from the organisation? They will lose all access immediately.`
              : `${confirm.label} for ${name}?`
          }
          confirmLabel={confirm.label}
          danger={confirm.danger}
          loading={loading}
          onConfirm={doAction}
          onCancel={() => { setConfirm(null); setError(""); }}
        />
      )}
      {error && (
        <p className="text-[11px] text-error mt-1">{error}</p>
      )}
    </>
  );
}

// ── Organisation tab ──────────────────────────────────────────────────────────

function OrgTab() {
  const { currentUser, organization, updateOrganization } = useAppContext();
  const orgId = currentUser?.orgId ?? organization.id;
  const myRole: OrgRole = (currentUser?.orgRole as OrgRole) ?? "member";
  const isOwner = myRole === "owner";
  const canViewMembers = myRole === "owner" || myRole === "admin";

  const [orgName, setOrgName] = useState(organization.name);
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");

  const loadMembers = useCallback(async () => {
    if (!canViewMembers || !orgId) return;
    setMembersLoading(true);
    setMembersError("");
    try {
      const data = await orgApi.listMembers(orgId);
      setMembers(data);
    } catch (err) {
      setMembersError(err instanceof ApiError ? err.message : "Failed to load members.");
    } finally {
      setMembersLoading(false);
    }
  }, [orgId, canViewMembers]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleSaveName = async () => {
    if (!orgName.trim() || orgName === organization.name) { setEditingName(false); return; }
    setSavingName(true);
    setNameError("");
    try {
      const updated = await orgApi.edit(orgId, orgName.trim());
      updateOrganization({ name: updated.name });
      setEditingName(false);
    } catch (err) {
      setNameError(err instanceof ApiError ? err.message : "Failed to save.");
    } finally {
      setSavingName(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      await orgApi.sendInvite(orgId, inviteEmail, inviteRole);
      setInviteSuccess(`Invite sent to ${inviteEmail}.`);
      setInviteEmail("");
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.message : "Failed to send invite.");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Profile card */}
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 ambient-shadow">
        <h3 className="text-headline-md font-headline-md text-on-surface mb-6">Organisation Profile</h3>

        <div className="flex items-center gap-5 mb-2">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold shrink-0 select-none">
            {(orgName || organization.name).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Workspace Name</label>
            {isOwner && editingName ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") { setEditingName(false); setOrgName(organization.name); } }}
                  className="flex-1 bg-surface-container border border-primary rounded-lg px-4 py-2 text-on-surface outline-none text-body-md"
                />
                <button onClick={handleSaveName} disabled={savingName} className="p-2 bg-primary text-on-primary rounded-lg hover:opacity-90 cursor-pointer disabled:opacity-60">
                  {savingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                </button>
                <button onClick={() => { setEditingName(false); setOrgName(organization.name); }} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg cursor-pointer">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-body-lg font-semibold text-on-surface">{organization.name}</p>
                {isOwner && (
                  <button onClick={() => setEditingName(true)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-md transition-colors cursor-pointer">
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
            )}
            {nameError && <p className="text-[11px] text-error mt-1">{nameError}</p>}
            {!isOwner && (
              <p className="text-[12px] text-outline mt-1">Only the owner can rename the organisation.</p>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-outline-variant/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container border border-outline-variant/30">
            <Image src={currentUser?.avatar ?? ""} alt="" width={32} height={32} className="w-full h-full object-cover" unoptimized />
          </div>
          <div>
            <p className="text-label-sm font-medium text-on-surface">{currentUser?.name}</p>
            <p className="text-[11px] text-outline-variant">{currentUser?.role}</p>
          </div>
          <RoleBadge role={myRole} />
        </div>
      </div>

      {/* Invite (owner only) */}
      {isOwner && (
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 ambient-shadow">
          <h3 className="text-headline-md font-headline-md text-on-surface mb-4">Invite Member</h3>
          <p className="text-body-md text-on-surface-variant mb-5 text-sm">
            An email with a secure registration link will be sent. The invite stays valid until accepted.
          </p>

          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
              className="flex-1 bg-surface-container border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface outline-none focus:border-primary transition-colors text-body-md"
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as "admin" | "member")}
              className="bg-surface-container border border-outline-variant/50 rounded-lg px-3 py-2.5 text-on-surface outline-none focus:border-primary transition-colors cursor-pointer text-body-md"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={inviting || !inviteEmail}
              className="px-5 py-2.5 bg-primary text-on-primary font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
            >
              {inviting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              Send Invite
            </button>
          </form>

          {inviteSuccess && (
            <div className="mt-3 flex items-center gap-2 text-[13px] text-secondary bg-secondary-container/30 border border-secondary/20 rounded-lg px-3 py-2">
              <Check size={14} className="shrink-0" /> {inviteSuccess}
            </div>
          )}
          {inviteError && (
            <p className="mt-3 text-[12px] text-error bg-error-container/40 border border-error/20 rounded-lg px-3 py-2">{inviteError}</p>
          )}
        </div>
      )}

      {/* Members list (owner + admin) */}
      {canViewMembers && (
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 ambient-shadow">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-headline-md font-headline-md text-on-surface">
              Members
              {members.length > 0 && (
                <span className="ml-2 bg-surface-container text-on-surface-variant text-[11px] px-2 py-0.5 rounded-full font-normal">
                  {members.length}
                </span>
              )}
            </h3>
            {membersLoading && <Loader2 size={16} className="animate-spin text-outline" />}
          </div>

          {membersError && (
            <p className="text-[13px] text-error bg-error-container/40 border border-error/20 rounded-lg px-3 py-2 mb-4">{membersError}</p>
          )}

          <div className="divide-y divide-outline-variant/20">
            {members.map(m => {
              const name = m.user_full_name?.trim() || m.user_email;
              const initials = (m.user_full_name?.[0] ?? m.user_email[0]).toUpperCase();

              return (
                <div key={m.id} className="flex items-center gap-4 py-3">
                  {m.user_avatar ? (
                    <Image src={m.user_avatar} alt={name} width={36} height={36} className="w-9 h-9 rounded-full object-cover shrink-0" unoptimized />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 select-none">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-medium text-on-surface truncate">{name}</p>
                    <p className="text-[11px] text-outline-variant truncate">{m.user_email}</p>
                  </div>
                  <RoleBadge role={m.role} />
                  <MemberActionsMenu
                    member={m}
                    myRole={myRole}
                    myId={currentUser?.id ?? ""}
                    orgId={orgId}
                    onRefresh={loadMembers}
                  />
                </div>
              );
            })}

            {!membersLoading && members.length === 0 && !membersError && (
              <p className="text-body-md text-outline italic py-4 text-center">No members found.</p>
            )}
          </div>
        </div>
      )}

      {/* Member view — no member list visible */}
      {myRole === "member" && (
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 ambient-shadow">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <Users size={20} className="shrink-0" />
            <p className="text-body-md">
              You are a <span className="font-semibold text-on-surface">Member</span> of this organisation.
              Contact your admin or owner to manage membership settings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Team card ─────────────────────────────────────────────────────────────────

function TeamCard({
  team, orgId, orgMembers, onRefresh,
}: {
  team: ApiTeam; orgId: string; orgMembers: OrgMember[]; onRefresh: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(team.name);
  const [savingName, setSavingName] = useState(false);

  const [addingMember, setAddingMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [addingLoading, setAddingLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  // Org members not yet in this team
  const available = orgMembers.filter(m => !team.members.includes(m.user));

  const getMemberInfo = (userId: string) => orgMembers.find(m => m.user === userId);

  const handleSaveName = async () => {
    if (!nameVal.trim() || nameVal === team.name) { setEditingName(false); return; }
    setSavingName(true);
    try {
      await teamApi.edit(orgId, team.id, { name: nameVal.trim() });
      onRefresh();
      setEditingName(false);
    } catch (err) {
      setNameVal(team.name);
    } finally {
      setSavingName(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    setAddingLoading(true);
    setAddError("");
    try {
      await teamApi.addMember(orgId, team.id, selectedUserId);
      onRefresh();
      setAddingMember(false);
      setSelectedUserId("");
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : "Failed to add member.");
    } finally {
      setAddingLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setActionLoading(userId);
    setActionError("");
    try {
      await teamApi.removeMember(orgId, team.id, userId);
      onRefresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to remove member.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignLead = async (userId: string) => {
    setActionLoading(`lead-${userId}`);
    setActionError("");
    try {
      await teamApi.assignLead(orgId, team.id, userId);
      onRefresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to assign lead.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await teamApi.delete(orgId, team.id);
      onRefresh();
    } catch {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  return (
    <>
      <div className="flex flex-col bg-surface-container-lowest border border-outline-variant/50 rounded-xl ambient-shadow overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-outline-variant/30 bg-surface flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") { setEditingName(false); setNameVal(team.name); } }}
                  className="flex-1 bg-surface-container border border-primary rounded-lg px-3 py-1.5 text-body-md outline-none"
                />
                <button onClick={handleSaveName} disabled={savingName} className="p-1.5 bg-primary text-on-primary rounded-lg cursor-pointer disabled:opacity-60">
                  {savingName ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button onClick={() => { setEditingName(false); setNameVal(team.name); }} className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h4 className="text-body-lg font-semibold text-on-surface truncate">{team.name}</h4>
                <button onClick={() => setEditingName(true)} className="p-1 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded transition-colors cursor-pointer shrink-0">
                  <Edit2 size={13} />
                </button>
              </div>
            )}
            {team.description && (
              <p className="text-label-sm text-on-surface-variant mt-0.5 truncate">{team.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider flex items-center gap-1.5">
              <Users size={12} /> {team.members.length}
            </span>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
              title="Delete team"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Members list */}
        <div className="divide-y divide-outline-variant/20 px-5">
          {team.members.map(userId => {
            const info = getMemberInfo(userId);
            const isLead = team.lead === userId;
            const name = info ? (info.user_full_name?.trim() || info.user_email) : userId;
            const initials = (info?.user_full_name?.[0] ?? info?.user_email[0] ?? "?").toUpperCase();
            const busy = actionLoading === userId;

            return (
              <div key={userId} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 select-none">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-medium text-on-surface truncate">{name}</p>
                  {info?.user_email && <p className="text-[11px] text-outline-variant truncate">{info.user_email}</p>}
                </div>

                {isLead && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    <Crown size={10} /> Lead
                  </span>
                )}

                <div className="flex items-center gap-1 shrink-0">
                  {!isLead && (
                    <button
                      onClick={() => handleAssignLead(userId)}
                      disabled={!!actionLoading}
                      title="Make Lead"
                      className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {actionLoading === `lead-${userId}` ? <Loader2 size={13} className="animate-spin" /> : <Crown size={13} />}
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveMember(userId)}
                    disabled={!!actionLoading}
                    title="Remove from team"
                    className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            );
          })}

          {team.members.length === 0 && (
            <p className="py-5 text-center text-label-sm text-outline italic">No members yet.</p>
          )}
        </div>

        {actionError && (
          <p className="mx-5 mb-2 text-[11px] text-error">{actionError}</p>
        )}

        {/* Add member footer */}
        <div className="bg-surface-container p-4 border-t border-outline-variant/30">
          {addingMember ? (
            <div className="flex items-center gap-2">
              <select
                autoFocus
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="flex-1 bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm outline-none focus:border-primary cursor-pointer"
              >
                <option value="" disabled>Choose org member…</option>
                {available.map(m => {
                  const n = m.user_full_name?.trim() || m.user_email;
                  return <option key={m.user} value={m.user}>{n}</option>;
                })}
              </select>
              <button
                onClick={handleAddMember}
                disabled={!selectedUserId || addingLoading}
                className="px-3 py-2 bg-primary text-on-primary text-body-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer shadow-sm hover:opacity-90 flex items-center gap-1.5"
              >
                {addingLoading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                Add
              </button>
              <button onClick={() => { setAddingMember(false); setSelectedUserId(""); setAddError(""); }} className="p-2 text-on-surface-variant hover:text-on-surface cursor-pointer rounded-lg">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingMember(true)}
              disabled={available.length === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-outline-variant hover:border-primary/50 text-body-sm font-medium text-on-surface-variant hover:text-on-surface bg-surface-container-lowest hover:bg-surface-container-low transition-all cursor-pointer disabled:opacity-50 w-full justify-center"
            >
              <Plus size={15} /> Add Member
            </button>
          )}
          {addError && <p className="mt-1.5 text-[11px] text-error">{addError}</p>}
        </div>
      </div>

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Team"
          message={`Delete "${team.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}
    </>
  );
}

// ── Teams tab ─────────────────────────────────────────────────────────────────

function TeamsTab() {
  const { currentUser, organization } = useAppContext();
  const orgId = currentUser?.orgId ?? organization.id;

  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);

  const [newTeamOpen, setNewTeamOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const loadTeams = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError("");
    try {
      const [teamsData, membersData] = await Promise.all([
        teamApi.list(orgId),
        orgApi.listMembers(orgId).catch(() => [] as OrgMember[]),
      ]);
      setTeams(teamsData);
      setOrgMembers(membersData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load teams.");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      await teamApi.create(orgId, { name: newTeamName.trim(), description: newTeamDesc.trim() || undefined });
      setNewTeamName("");
      setNewTeamDesc("");
      setNewTeamOpen(false);
      loadTeams();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Failed to create team.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <h3 className="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
          Manage Teams
          {!loading && (
            <span className="bg-surface-container text-on-surface-variant text-[11px] px-2 py-0.5 rounded-full font-normal">
              {teams.length}
            </span>
          )}
        </h3>
        {!newTeamOpen && (
          <button
            onClick={() => setNewTeamOpen(true)}
            className="px-4 py-2 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus size={18} /> Create Team
          </button>
        )}
      </div>

      {newTeamOpen && (
        <div className="bg-surface-container-lowest border border-primary/40 rounded-xl p-6 ambient-shadow">
          <h4 className="text-body-lg font-medium text-on-surface mb-4">New Team</h4>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                autoFocus
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="e.g. Design Systems"
                required
                className="bg-surface border border-outline-variant/50 rounded-lg px-4 py-2.5 outline-none focus:border-primary text-body-md"
              />
              <input
                value={newTeamDesc}
                onChange={e => setNewTeamDesc(e.target.value)}
                placeholder="Team purpose (optional)"
                className="bg-surface border border-outline-variant/50 rounded-lg px-4 py-2.5 outline-none focus:border-primary text-body-md"
              />
            </div>
            {createError && <p className="text-[12px] text-error">{createError}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setNewTeamOpen(false); setCreateError(""); }} className="px-4 py-2 text-on-surface-variant hover:text-on-surface font-medium cursor-pointer">Cancel</button>
              <button type="submit" disabled={creating} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium shadow-sm hover:opacity-90 cursor-pointer disabled:opacity-60 flex items-center gap-2">
                {creating && <Loader2 size={14} className="animate-spin" />}
                Save Team
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-outline" />
        </div>
      )}

      {error && (
        <p className="text-[13px] text-error bg-error-container/40 border border-error/20 rounded-lg px-4 py-3">{error}</p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map(team => (
            <TeamCard
              key={team.id}
              team={team}
              orgId={orgId}
              orgMembers={orgMembers}
              onRefresh={loadTeams}
            />
          ))}
          {teams.length === 0 && (
            <p className="md:col-span-2 text-body-md text-outline italic py-6 text-center">
              No teams yet. Create one to get started.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"Org" | "Teams">("Org");

  const tabs = [
    { id: "Org" as const, label: "Organisation", icon: Building2 },
    { id: "Teams" as const, label: "Teams & Groups", icon: Users },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-display-xl font-display-xl text-on-surface mb-1">Settings</h2>
          <p className="text-body-md font-body-md text-on-surface-variant">Manage organisation and teams.</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Sidebar nav */}
        <div className="w-56 bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 shrink-0 flex flex-col gap-1 ambient-shadow hidden md:flex">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 cursor-pointer ${active ? "bg-primary/10 text-primary font-medium" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"}`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
          {activeTab === "Org" && <OrgTab />}
          {activeTab === "Teams" && <TeamsTab />}
        </div>
      </div>
    </div>
  );
}
