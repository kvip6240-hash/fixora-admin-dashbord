/**
 * src/lib/api.ts
 * Central API client for Fixora Admin Dashboard.
 * Automatically attaches Bearer token from localStorage.
 * Throws ApiError for non-2xx responses with proper status codes.
 */

import { toast } from "sonner";

const BASE_URL = import.meta.env.VITE_API_URL || "https://fixora-backend-qsl7.onrender.com";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken(): string | null {
  return localStorage.getItem("fixora_token");
}

function handleAuthError() {
  localStorage.removeItem("fixora_token");
  localStorage.removeItem("fixora_user");
  window.location.href = "/login";
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    toast.error("Unable to connect to the server. Please check your connection.");
    throw new ApiError(0, "Network error");
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      message = body?.message || message;
    } catch {
      // ignore parse errors
    }

    switch (response.status) {
      case 401:
        toast.error("Session expired. Please log in again.");
        handleAuthError();
        break;
      case 403:
        toast.error("You do not have permission to perform this action.");
        break;
      case 404:
        toast.error("The requested resource was not found.");
        break;
      case 500:
      default:
        toast.error("Server error. Please try again later.");
        break;
    }

    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Type definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalCompanies: number;
  totalCategories: number;
  totalSubmittedRequests: number;
  totalRFQs: number;
  totalPublishedJobs: number;
  totalAssignedJobs: number;
  totalCompletedJobs: number;
  totalRevenue: number;
  totalCommission: number;
  pendingPayments: number;
}

export interface Company {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt?: string;
  // allow arbitrary extra fields from API
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProjectRequest {
  _id: string;
  title?: string;
  status?: string;
  category?: string | { name: string; [key: string]: unknown };
  company?: Company | string;
  location?: string;
  schedule?: string;
  attachments?: string[];
  createdAt?: string;
  description?: string;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/admin/dashboard */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  return request<DashboardStats>("/api/admin/dashboard");
}

/** GET /api/admin/companies */
export async function fetchCompanies(params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}): Promise<PaginatedResponse<Company>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));
  const qs = query.toString();
  return request<PaginatedResponse<Company>>(`/api/admin/companies${qs ? `?${qs}` : ""}`);
}

/** GET /api/admin/companies/:id */
export async function fetchCompanyById(id: string): Promise<Company> {
  return request<Company>(`/api/admin/companies/${id}`);
}

/** PUT /api/admin/companies/:id/status */
export async function updateCompanyStatus(
  id: string,
  isActive: boolean,
): Promise<{ success: boolean; message: string }> {
  return request(`/api/admin/companies/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ isActive }),
  });
}

/** GET /api/admin/project-requests */
export async function fetchProjectRequests(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
}): Promise<PaginatedResponse<ProjectRequest>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.sort) query.set("sort", params.sort);
  const qs = query.toString();
  return request<PaginatedResponse<ProjectRequest>>(
    `/api/admin/project-requests${qs ? `?${qs}` : ""}`,
  );
}

/** GET /api/admin/project-requests/:id */
export async function fetchProjectRequestById(id: string): Promise<ProjectRequest> {
  return request<ProjectRequest>(`/api/admin/project-requests/${id}`);
}
