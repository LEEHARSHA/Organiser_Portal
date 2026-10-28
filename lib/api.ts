import type { User } from "@firebase/auth";

export type OrganizerStatus = "pending" | "approved" | "rejected" | "changes_requested";
export type EventStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "cancelled"
  | "completed";

export type Organizer = {
  id?: string;
  type: "organization" | "individual";
  organizationName: string;
  organizationType: string;
  contactName: string;
  phone: string;
  address: string;
  city: string;
  website: string;
  description: string;
  experience: string;
  publicProfile: string;
  status: OrganizerStatus;
  reviewNote: string | null;
  submittedAt: string;
  updatedAt: string;
  approvedAt: string | null;
};

export type CommunityEvent = {
  id: string;
  title: string;
  description: string;
  category: string;
  coverImageUrl: string;
  startAt: string;
  endAt: string;
  timeZone: string;
  venueType: "in_person" | "online";
  venueName: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  registrationDeadline: string | null;
  capacity: number | null;
  registrationCount: number;
  eligibility: string;
  instructions: string;
  pricingType: "free" | "paid";
  amount: number | null;
  currency: string;
  externalRegistrationUrl: string;
  status: EventStatus;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  organizer: {
    name: string;
    type: "organization" | "individual";
    verified: boolean;
    website: string;
    publicProfile: string;
  } | null;
};

type ApiResponse<T> = { success: boolean; message?: string; code?: string } & T;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");

export class CommunityApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "CommunityApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  path: string,
  user?: User,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  if (!API_BASE_URL) {
    throw new Error("The Community API is not configured. Set NEXT_PUBLIC_API_BASE_URL.");
  }
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (user) headers.set("Authorization", `Bearer ${await user.getIdToken()}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/community${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new Error(`Could not reach the backend at ${API_BASE_URL}. Check the API URL and server availability.`);
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = await response.json() as ApiResponse<T>;
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const message = payload?.message || `Backend request failed with HTTP ${response.status}.`;
    if (response.status === 401) throw new CommunityApiError(`Sign in again: ${message}`, response.status);
    throw new CommunityApiError(message, response.status, payload?.code);
  }
  if (!payload?.success) throw new Error(payload?.message || "The backend returned an unsuccessful response.");
  return payload;
}

export function getPublicEvents(params: Record<string, string | number> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => query.set(key, String(value)));
  return request<{ events: CommunityEvent[]; total: number; page: number; limit: number }>(
    `/events${query.size ? `?${query.toString()}` : ""}`,
  );
}

export function getPublicEvent(id: string) {
  return request<{ event: CommunityEvent }>(`/events/${encodeURIComponent(id)}`);
}

export function getMyOrganizer(user: User) {
  return request<{ organizer: Organizer }>("/organizers/me", user);
}

export function getOrganizerSummary(user: User) {
  return request<{ summary: {
    totalEvents: number;
    upcomingEvents: number;
    registrations: number;
    completedEvents: number;
    pendingReviewEvents: number;
  } }>("/organizers/me/summary", user);
}

export function applyAsOrganizer(user: User, application: Record<string, unknown>) {
  return request<{ organizer: Organizer }>("/organizers/apply", user, {
    method: "POST",
    body: JSON.stringify(application),
  });
}

export function updateOrganizer(user: User, profile: Record<string, unknown>) {
  return request<{ organizer: Organizer }>("/organizers/me", user, {
    method: "PATCH",
    body: JSON.stringify(profile),
  });
}

export function getMyEvents(user: User, status?: string, page = 1, limit = 100) {
  const params = new URLSearchParams({ limit: String(limit), page: String(page) });
  if (status) params.set("status", status);
  const query = `?${params.toString()}`;
  return request<{ events: CommunityEvent[]; total: number }>("/events/mine" + query, user);
}

export function getMyEvent(user: User, id: string) {
  return request<{ event: CommunityEvent }>(`/events/${encodeURIComponent(id)}/manage`, user);
}

export function createEvent(user: User, input: Record<string, unknown>) {
  return request<{ event: CommunityEvent }>("/events", user, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateEvent(user: User, id: string, input: Record<string, unknown>) {
  return request<{ event: CommunityEvent }>(`/events/${encodeURIComponent(id)}`, user, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function submitEvent(user: User, id: string) {
  return request<{ event: CommunityEvent }>(`/events/${encodeURIComponent(id)}/submit`, user, {
    method: "POST",
    body: "{}",
  });
}

export function cancelEvent(user: User, id: string) {
  return request<{ event: CommunityEvent }>(`/events/${encodeURIComponent(id)}/cancel`, user, {
    method: "POST",
    body: "{}",
  });
}

export function registerForEvent(user: User, id: string) {
  return request<{ registration: { status: string; paymentNote: string | null } }>(
    `/events/${encodeURIComponent(id)}/registrations`,
    user,
    { method: "POST", body: "{}" },
  );
}

export function cancelMyRegistration(user: User, id: string) {
  return request<{ registration: { status: string } }>(
    `/events/${encodeURIComponent(id)}/registrations/me`,
    user,
    { method: "DELETE" },
  );
}

export function getMyRegistrations(user: User) {
  return request<{ registrations: Array<{
    id: string;
    status: string;
    event: CommunityEvent;
  }>; total: number }>(`/registrations/mine?limit=50`, user);
}

export function getMyEventRegistration(user: User, id: string) {
  return request<{ registration: { status: string; registeredAt: string } }>(
    `/events/${encodeURIComponent(id)}/registrations/me`,
    user,
  );
}

export function getEventRegistrations(user: User, id: string, page = 1) {
  return request<{
    registrations: Array<{
      id: string;
      participantName: string;
      email?: string;
      phone?: string;
      status: string;
      registeredAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
  }>(`/events/${encodeURIComponent(id)}/registrations?page=${page}&limit=50`, user);
}

export function isValidHttpsImageUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
