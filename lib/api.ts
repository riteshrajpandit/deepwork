const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// ── Token storage ────────────────────────────────────────────────────────────

const KEYS = { access: "tp_access", refresh: "tp_refresh" } as const;

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

// ── Core fetch wrapper ───────────────────────────────────────────────────────

type FetchOptions = {
  method?: string;
  body?: Record<string, unknown> | FormData;
  auth?: boolean;       // attach Bearer token (default: false)
  isFormData?: boolean; // send as multipart/form-data
};

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
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      message = data?.detail ?? data?.message ?? JSON.stringify(data);
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
    const json = await data.json();
    if (json.access) {
      // Backend may return a new refresh token too; keep existing if not
      tokenStore.set(json.access, json.refresh ?? refresh);
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
  owner: string; // user_id
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
  get: (orgId: string) =>
    request<OrgDetail>(`/org/v1/${orgId}/`, { auth: true }),

  edit: (orgId: string, name: string) =>
    request<OrgDetail>(`/org/v1/${orgId}/`, {
      method: "PATCH",
      body: { name },
      auth: true,
    }),

  listMembers: async (orgId: string): Promise<OrgMember[]> => {
    const res = await request<OrgMembersResponse>(`/org/v1/${orgId}/members/`, { auth: true });
    return res.data ?? [];
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
    request<{ detail?: string }>(`/org/v1/invites/${token}/accept/`, {
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

type ApiEnvelope<T> = { success: boolean; message?: string; data: T };

export const teamApi = {
  // GET /teams/v1/{org_id}/teamaction/  — list all teams in org
  list: async (orgId: string): Promise<ApiTeam[]> => {
    const res = await request<ApiEnvelope<ApiTeam[]>>(`/teams/v1/${orgId}/teamaction/`, { auth: true });
    return res.data ?? [];
  },

  // POST /teams/v1/{org_id}/teamaction/  — create team
  create: (orgId: string, payload: { name: string; description?: string; members?: string[] }) =>
    request<ApiEnvelope<ApiTeam>>(`/teams/v1/${orgId}/teamaction/`, {
      method: "POST",
      body: payload as Record<string, unknown>,
      auth: true,
    }),

  // GET /teams/v1/{org_id}/{team_id}/  — team detail
  get: (orgId: string, teamId: string) =>
    request<ApiTeam>(`/teams/v1/${orgId}/${teamId}/`, { auth: true }),

  // PATCH /teams/v1/{org_id}/{team_id}/  — edit team name/description
  edit: (orgId: string, teamId: string, payload: { name?: string; description?: string }) =>
    request<ApiTeam>(`/teams/v1/${orgId}/${teamId}/`, {
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
    request<ApiTeam>(`/teams/v1/${orgId}/${teamId}/members/`, {
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
    request<ApiTeam>(`/teams/v1/${orgId}/${teamId}/assign-lead/`, {
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
  },
};
