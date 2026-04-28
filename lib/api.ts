const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// ── Token storage ────────────────────────────────────────────────────────────

const KEYS = { access: "tp_access", refresh: "tp_refresh", user: "tp_user" } as const;

export const tokenStore = {
  getAccess: () => (typeof window !== "undefined" ? localStorage.getItem(KEYS.access) : null),
  getRefresh: () => (typeof window !== "undefined" ? localStorage.getItem(KEYS.refresh) : null),
  set: (access: string, refresh: string) => {
    localStorage.setItem(KEYS.access, access);
    localStorage.setItem(KEYS.refresh, refresh);
  },
  clear: () => {
    localStorage.removeItem(KEYS.access);
    localStorage.removeItem(KEYS.refresh);
  },
};

export type StoredUser = {
  id: string;
  email: string;
  full_name?: string;
  role?: OrgRole;
  organization_id?: string;
};

export const userStore = {
  get: (): StoredUser | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(KEYS.user);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  },
  set: (user: StoredUser) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEYS.user, JSON.stringify(user));
  },
  clear: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEYS.user);
  },
};

const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${BASE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
};

// ── Core fetch wrapper ───────────────────────────────────────────────────────

type FetchOptions = {
  method?: string;
  body?: Record<string, unknown> | FormData;
  auth?: boolean;       // attach Bearer token (default: false)
  isFormData?: boolean; // send as multipart/form-data
};

type ApiEnvelope<T> = { success: boolean; message?: string; data: T };

async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false, isFormData = false } = opts;

  const headers: Record<string, string> = {};

  if (auth) {
    const token = tokenStore.getAccess();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let bodyPayload: BodyInit | undefined;
  if (body) {
    if (isFormData) {
      const fd = new FormData();
      Object.entries(body).forEach(([k, v]) => fd.append(k, String(v)));
      bodyPayload = fd;
    } else {
      headers["Content-Type"] = "application/json";
      bodyPayload = JSON.stringify(body);
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: bodyPayload,
  });

  // Auto-refresh on 401 (access token expired)
  if (res.status === 401 && auth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      // Retry original request with new access token
      return request<T>(path, opts);
    }
    // Refresh also failed — clear tokens and throw so caller can redirect
    tokenStore.clear();
    userStore.clear();
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      message = data?.message ?? data?.detail ?? JSON.stringify(data?.data ?? data);
    } catch {
      // response body wasn't JSON
    }
    throw new ApiError(res.status, message);
  }

  // 204 No Content — return empty object
  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return false;

  try {
    const data = await fetch(`${BASE_URL}/auth/v1/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!data.ok) return false;
    const json = (await data.json()) as ApiEnvelope<{ access?: string }>;
    if (json.data?.access) {
      // Backend may return a new refresh token too; keep existing if not
      tokenStore.set(json.data.access, refresh);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Auth API ─────────────────────────────────────────────────────────────────

export type RegisterPayload = {
  org_name: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
};

export type LoginResponse = {
  success: boolean;
  message?: string;
  data: {
    tokens: {
      access: string;
      refresh: string;
    };
    user: {
      id: string;
      email: string;
      full_name?: string;
      role?: OrgRole;
      organization_id?: string;
    };
  };
};

// ── Organisation API ──────────────────────────────────────────────────────────

export type OrgRole = "owner" | "admin" | "member";

export type OrgDetail = {
  id: string;
  name: string;
  slug: string;
  member_count?: number;
};

export type OrgMember = {
  id: string;           // membership record id
  user: string;         // user_id
  user_email: string;
  user_full_name: string;
  user_avatar: string | null;
  role: OrgRole;
  status: string;
  joined_at: string;
};

type OrgMembersResponse = {
  success: boolean;
  message?: string;
  data: OrgMember[];
};

export const orgApi = {
  get: async (orgId: string) => {
    const res = await request<ApiEnvelope<OrgDetail>>(`/org/v1/${orgId}/`, { auth: true });
    return res.data;
  },

  edit: async (orgId: string, name: string) => {
    const res = await request<ApiEnvelope<OrgDetail>>(`/org/v1/${orgId}/`, {
      method: "PATCH",
      body: { name },
      auth: true,
    });
    return res.data;
  },

  listMembers: async (orgId: string): Promise<OrgMember[]> => {
    const res = await request<OrgMembersResponse>(`/org/v1/${orgId}/members/`, { auth: true });
    return (res.data ?? []).map(member => ({
      ...member,
      user_avatar: toAbsoluteUrl(member.user_avatar),
    }));
  },

  sendInvite: (orgId: string, email: string, role: "admin" | "member") =>
    request<{ detail?: string }>(`/org/v1/${orgId}/invites/`, {
      method: "POST",
      body: { email, role },
      auth: true,
    }),

  acceptInvite: (token: string, payload: {
    password: string;
    confirm_password: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
  }) =>
    request<ApiEnvelope<{ tokens: { access: string; refresh: string }; user: { id: string; email: string; full_name?: string; role?: OrgRole }; organization?: { id: string; name: string } }>>(`/org/v1/invites/${token}/accept/`, {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
    }),

  addAdmin: (orgId: string, userId: string) =>
    request<{ detail?: string }>(`/org/v1/${orgId}/members/add-admin/`, {
      method: "POST",
      body: { user_id: userId },
      auth: true,
    }),

  removeAdmin: (orgId: string, userId: string) =>
    request<{ detail?: string }>(`/org/v1/${orgId}/members/remove-admin/`, {
      method: "POST",
      body: { user_id: userId },
      auth: true,
    }),

  demoteAdmin: (orgId: string, userId: string) =>
    request<{ detail?: string }>(`/org/v1/${orgId}/members/demote-admin/`, {
      method: "POST",
      body: { user_id: userId },
      auth: true,
    }),

  transferOwnership: (orgId: string, userId: string) =>
    request<{ detail?: string }>(`/org/v1/${orgId}/members/transfer-ownership/`, {
      method: "POST",
      body: { user_id: userId },
      auth: true,
    }),

  removeMember: (orgId: string, userId: string) =>
    request<{ detail?: string }>(`/org/v1/${orgId}/members/remove-member/`, {
      method: "POST",
      body: { user_id: userId },
      auth: true,
    }),
};

// ── Team API ──────────────────────────────────────────────────────────────────

type ApiTeamSummary = {
  id: string;
  name: string;
  description?: string;
};

type ApiTeamMemberDetail = {
  id: string;
  user: string;
  user_email: string;
  user_full_name: string;
  user_avatar: string | null;
  role: "lead" | "member";
};

type ApiTeamDetail = {
  id: string;
  name: string;
  description?: string;
  lead?: { id: string; email: string; full_name: string } | null;
  members: ApiTeamMemberDetail[];
};

export type ApiTeam = {
  id: string;
  name: string;
  description?: string;
  lead?: string | null; // user_id of lead
  members: string[];    // array of user_ids
};

export type ApiTeamMember = {
  user_id: string;
  full_name?: string;
  email?: string;
  is_lead?: boolean;
};

export const teamApi = {
  // GET /teams/v1/{org_id}/teamaction/  — list all teams in org
  list: async (orgId: string): Promise<ApiTeam[]> => {
    const res = await request<ApiEnvelope<ApiTeamSummary[]>>(`/teams/v1/${orgId}/teamaction/`, { auth: true });
    const summaries = res.data ?? [];

    const details = await Promise.all(
      summaries.map(summary =>
        request<ApiEnvelope<ApiTeamDetail>>(`/teams/v1/${orgId}/${summary.id}/`, { auth: true })
          .then(r => r.data)
          .catch(() => null),
      ),
    );

    const detailMap = new Map(details.filter(Boolean).map(detail => [detail!.id, detail!]));

    return summaries.map(summary => {
      const detail = detailMap.get(summary.id);
      const members = detail?.members?.map((m: ApiTeamMemberDetail) => m.user) ?? [];
      return {
        id: summary.id,
        name: summary.name,
        description: summary.description,
        lead: detail?.lead?.id ?? null,
        members,
      };
    });
  },

  // POST /teams/v1/{org_id}/teamaction/  — create team
  create: (orgId: string, payload: { name: string; description?: string; members?: string[] }) =>
    request<ApiEnvelope<ApiTeam>>(`/teams/v1/${orgId}/teamaction/`, {
      method: "POST",
      body: payload as Record<string, unknown>,
      auth: true,
    }),

  // GET /teams/v1/{org_id}/{team_id}/  — team detail
  get: async (orgId: string, teamId: string) => {
    const res = await request<ApiEnvelope<ApiTeamDetail>>(`/teams/v1/${orgId}/${teamId}/`, { auth: true });
    return {
      id: res.data.id,
      name: res.data.name,
      description: res.data.description,
      lead: res.data.lead?.id ?? null,
      members: res.data.members?.map((m: ApiTeamMemberDetail) => m.user) ?? [],
    } as ApiTeam;
  },

  // PATCH /teams/v1/{org_id}/{team_id}/  — edit team name/description
  edit: (orgId: string, teamId: string, payload: { name?: string; description?: string }) =>
    request<ApiEnvelope<ApiTeamSummary>>(`/teams/v1/${orgId}/${teamId}/`, {
      method: "PATCH",
      body: payload as Record<string, unknown>,
      auth: true,
    }),

  // DELETE /teams/v1/{org_id}/{team_id}/  — delete team
  delete: (orgId: string, teamId: string) =>
    request<void>(`/teams/v1/${orgId}/${teamId}/`, {
      method: "DELETE",
      auth: true,
    }),

  // POST /teams/v1/{org_id}/{team_id}/members/  — add member
  addMember: (orgId: string, teamId: string, userId: string) =>
    request<ApiEnvelope<ApiTeamMember>>(`/teams/v1/${orgId}/${teamId}/members/`, {
      method: "POST",
      body: { user_id: userId },
      auth: true,
    }),

  // DELETE /teams/v1/{org_id}/{team_id}/members/{user_id}/  — remove member
  removeMember: (orgId: string, teamId: string, userId: string) =>
    request<void>(`/teams/v1/${orgId}/${teamId}/members/${userId}/`, {
      method: "DELETE",
      auth: true,
    }),

  // POST /teams/v1/{org_id}/{team_id}/assign-lead/  — assign lead
  assignLead: (orgId: string, teamId: string, userId: string) =>
    request<ApiEnvelope<{ detail?: string }>>(`/teams/v1/${orgId}/${teamId}/assign-lead/`, {
      method: "POST",
      body: { user_id: userId },
      auth: true,
    }),
};

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<{ detail?: string }>("/auth/v1/register/", {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
      isFormData: true,
    }),

  verifyOtp: (email: string, code: string) =>
    request<{ detail?: string }>("/auth/v1/verify-otp/", {
      method: "POST",
      body: { email, code },
    }),

  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/v1/login/", {
      method: "POST",
      body: { email, password },
    }),

  logout: async () => {
    const refresh = tokenStore.getRefresh();
    if (!refresh) return;
    // Backend blacklists the refresh token on this call — must include it
    await request("/auth/v1/logout/", {
      method: "POST",
      body: { refresh },
      auth: true,
    }).catch(() => {
      // Even if the request fails, clear tokens locally
    });
    tokenStore.clear();
    userStore.clear();
  },
};

// ── Projects API ─────────────────────────────────────────────────────────────

export type ApiProject = {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "completed" | "archived";
  deadline: string | null;
  team_count?: number;
  lead?: string | null;
  lead_full_name?: string | null;
  lead_email?: string | null;
  archived_at?: string | null;
};

export type ApiProjectTeam = {
  id: string;
  team_id: string;
  team_name: string;
  team_description?: string;
  member_count: number;
  lead?: { id: string; email: string; full_name: string } | null;
  created_at?: string;
};

export const projectApi = {
  list: async (orgId: string): Promise<ApiProject[]> => {
    const res = await request<ApiEnvelope<ApiProject[]>>(`/projects/v1/${orgId}/`, { auth: true });
    return res.data ?? [];
  },
  get: async (orgId: string, projectId: string): Promise<ApiProject> => {
    const res = await request<ApiEnvelope<ApiProject>>(`/projects/v1/${orgId}/${projectId}/`, { auth: true });
    return res.data;
  },
  create: async (orgId: string, payload: { name: string; description?: string; deadline?: string | null }) => {
    const res = await request<ApiEnvelope<ApiProject>>(`/projects/v1/${orgId}/`, {
      method: "POST",
      body: payload as Record<string, unknown>,
      auth: true,
    });
    return res.data;
  },
  update: async (orgId: string, projectId: string, payload: { name?: string; description?: string; deadline?: string | null }) => {
    const res = await request<ApiEnvelope<ApiProject>>(`/projects/v1/${orgId}/${projectId}/`, {
      method: "PATCH",
      body: payload as Record<string, unknown>,
      auth: true,
    });
    return res.data;
  },
  updateStatus: async (orgId: string, projectId: string, status: "active" | "completed" | "archived") => {
    const res = await request<ApiEnvelope<ApiProject>>(`/projects/v1/${orgId}/${projectId}/status/`, {
      method: "PATCH",
      body: { status },
      auth: true,
    });
    return res.data;
  },
  updateDeadline: async (orgId: string, projectId: string, deadline: string) => {
    const res = await request<ApiEnvelope<ApiProject>>(`/projects/v1/${orgId}/${projectId}/deadline/`, {
      method: "PATCH",
      body: { deadline },
      auth: true,
    });
    return res.data;
  },
  listTeams: async (orgId: string, projectId: string): Promise<ApiProjectTeam[]> => {
    const res = await request<ApiEnvelope<ApiProjectTeam[]>>(`/projects/v1/${orgId}/${projectId}/teams/`, { auth: true });
    return res.data ?? [];
  },
  attachTeams: async (orgId: string, projectId: string, teamIds: string[]) =>
    request<ApiEnvelope<{ detail?: string }>>(`/projects/v1/${orgId}/${projectId}/teams/`, {
      method: "POST",
      body: { team_ids: teamIds },
      auth: true,
    }),
  detachTeam: async (orgId: string, projectId: string, teamId: string) =>
    request<ApiEnvelope<{ detail?: string }>>(`/projects/v1/${orgId}/${projectId}/teams/${teamId}/`, {
      method: "DELETE",
      auth: true,
    }),
  assignLead: async (orgId: string, projectId: string, userId: string) =>
    request<ApiEnvelope<{ detail?: string }>>(`/projects/v1/${orgId}/${projectId}/assign-lead/`, {
      method: "POST",
      body: { user_id: userId },
      auth: true,
    }),
};

// ── Todos (Tasks + Subtasks) API ────────────────────────────────────────────

export type ApiTask = {
  id: string;
  title: string;
  description?: string | null;
  assigned_team: string;
  assigned_team_name?: string;
  deadline: string;
  progress: {
    total: number;
    todo: number;
    in_progress: number;
    completed: number;
    percentage: number;
  };
  created_at: string;
  updated_at: string;
};

export type ApiSubTask = {
  id: string;
  title: string;
  description?: string | null;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  deadline?: string | null;
  assignees: Array<{
    id: string;
    user: string;
    user_email: string;
    user_full_name: string;
    user_avatar: string | null;
  }>;
  created_at: string;
  updated_at: string;
};

export type ApiTaskDetail = ApiTask & {
  subtasks: {
    todo: ApiSubTask[];
    in_progress: ApiSubTask[];
    completed: ApiSubTask[];
  };
};

export const todoApi = {
  list: async (orgId: string, projectId: string): Promise<ApiTask[]> => {
    const res = await request<ApiEnvelope<ApiTask[]>>(`/todos/v1/${orgId}/${projectId}/`, { auth: true });
    return res.data ?? [];
  },
  get: async (orgId: string, projectId: string, taskId: string): Promise<ApiTaskDetail> => {
    const res = await request<ApiEnvelope<ApiTaskDetail>>(`/todos/v1/${orgId}/${projectId}/${taskId}/`, { auth: true });
    return res.data;
  },
  create: async (orgId: string, projectId: string, payload: { title: string; description?: string | null; assigned_team: string; deadline: string }) => {
    const res = await request<ApiEnvelope<ApiTask>>(`/todos/v1/${orgId}/${projectId}/`, {
      method: "POST",
      body: payload as Record<string, unknown>,
      auth: true,
    });
    return res.data;
  },
  update: async (orgId: string, projectId: string, taskId: string, payload: { title?: string; description?: string | null; assigned_team?: string; deadline?: string }) => {
    const res = await request<ApiEnvelope<ApiTask>>(`/todos/v1/${orgId}/${projectId}/${taskId}/`, {
      method: "PATCH",
      body: payload as Record<string, unknown>,
      auth: true,
    });
    return res.data;
  },
  delete: async (orgId: string, projectId: string, taskId: string) =>
    request<ApiEnvelope<{ detail?: string }>>(`/todos/v1/${orgId}/${projectId}/${taskId}/`, {
      method: "DELETE",
      auth: true,
    }),
  createSubtask: async (orgId: string, projectId: string, taskId: string, payload: { title: string; description?: string | null; priority?: "low" | "medium" | "high"; deadline?: string | null; assignee_ids?: string[] }) => {
    const res = await request<ApiEnvelope<ApiSubTask>>(`/todos/v1/${orgId}/${projectId}/${taskId}/subtasks/`, {
      method: "POST",
      body: payload as Record<string, unknown>,
      auth: true,
    });
    return res.data;
  },
  updateSubtaskStatus: async (orgId: string, projectId: string, taskId: string, subtaskId: string, status: "todo" | "in_progress" | "completed") => {
    const res = await request<ApiEnvelope<ApiSubTask>>(`/todos/v1/${orgId}/${projectId}/${taskId}/subtasks/${subtaskId}/status/`, {
      method: "PATCH",
      body: { status },
      auth: true,
    });
    return res.data;
  },

  updateSubtask: async (orgId: string, projectId: string, taskId: string, subtaskId: string, payload: { title?: string; description?: string | null; priority?: "low" | "medium" | "high"; deadline?: string | null }) => {
    const res = await request<ApiEnvelope<ApiSubTask>>(`/todos/v1/${orgId}/${projectId}/${taskId}/subtasks/${subtaskId}/`, {
      method: "PATCH",
      body: payload as Record<string, unknown>,
      auth: true,
    });
    return res.data;
  },

  deleteSubtask: async (orgId: string, projectId: string, taskId: string, subtaskId: string) =>
    request<ApiEnvelope<{ detail?: string }>>(`/todos/v1/${orgId}/${projectId}/${taskId}/subtasks/${subtaskId}/`, {
      method: "DELETE",
      auth: true,
    }),

  updateTaskDeadline: async (orgId: string, projectId: string, taskId: string, deadline: string) => {
    const res = await request<ApiEnvelope<ApiTask>>(`/todos/v1/${orgId}/${projectId}/${taskId}/deadline/`, {
      method: "PATCH",
      body: { deadline },
      auth: true,
    });
    return res.data;
  },

  updateSubtaskDeadline: async (orgId: string, projectId: string, taskId: string, subtaskId: string, deadline: string) => {
    const res = await request<ApiEnvelope<ApiSubTask>>(`/todos/v1/${orgId}/${projectId}/${taskId}/subtasks/${subtaskId}/deadline/`, {
      method: "PATCH",
      body: { deadline },
      auth: true,
    });
    return res.data;
  },

  addSubtaskAssignees: async (orgId: string, projectId: string, taskId: string, subtaskId: string, userIds: string[]) =>
    request<ApiEnvelope<{ detail?: string }>>(`/todos/v1/${orgId}/${projectId}/${taskId}/subtasks/${subtaskId}/assignees/`, {
      method: "POST",
      body: { user_ids: userIds },
      auth: true,
    }),

  removeSubtaskAssignee: async (orgId: string, projectId: string, taskId: string, subtaskId: string, userId: string) =>
    request<ApiEnvelope<{ detail?: string }>>(`/todos/v1/${orgId}/${projectId}/${taskId}/subtasks/${subtaskId}/assignees/${userId}/`, {
      method: "DELETE",
      auth: true,
    }),
};

export { toAbsoluteUrl };
