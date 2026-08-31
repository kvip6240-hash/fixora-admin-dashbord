/**
 * src/lib/api.ts
 * Central API client for Fixora Admin Dashboard.
 * Automatically attaches Bearer token from localStorage.
 * Throws ApiError for non-2xx responses with proper status codes.
 */

import { toast } from "sonner";

export const BASE_URL = import.meta.env.VITE_API_URL;

export type AttachmentType = "image" | "video" | "pdf" | "document" | "other";

/**
 * Prepend backend BASE_URL if the URL is a relative path (e.g. /uploads/file.pdf).
 * Preserves Cloudinary HTTPS URLs intact and upgrades http:// Cloudinary URLs.
 */
export function getAttachmentUrl(
  attachment?: string | { url?: string; fileUrl?: string; secure_url?: string; path?: string } | null,
): string {
  if (!attachment) return "";

  let rawUrl = "";
  if (typeof attachment === "string") {
    rawUrl = attachment.trim();
  } else if (typeof attachment === "object") {
    rawUrl = (attachment.url || attachment.secure_url || attachment.fileUrl || attachment.path || "").trim();
  }

  if (!rawUrl) return "";

  // Upgrade insecure Cloudinary HTTP URLs to HTTPS to prevent browser mixed-content blocking
  if (rawUrl.startsWith("http://res.cloudinary.com/")) {
    return rawUrl.replace("http://res.cloudinary.com/", "https://res.cloudinary.com/");
  }

  // Already a full absolute URL
  if (
    rawUrl.startsWith("http://") ||
    rawUrl.startsWith("https://") ||
    rawUrl.startsWith("data:") ||
    rawUrl.startsWith("blob:")
  ) {
    return rawUrl;
  }

  // Relative path (e.g. /uploads/...)
  const base = (BASE_URL || "").replace(/\/+$/, "");
  const cleanPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  return `${base}${cleanPath}`;
}

/**
 * Accurately determines file type for images, videos, PDFs, and documents
 */
export function getAttachmentType(
  attachment?: string | { url?: string; fileUrl?: string; secure_url?: string; path?: string; type?: string; mimeType?: string; resource_type?: string } | null,
): AttachmentType {
  if (!attachment) return "other";

  // Check object metadata if present
  if (typeof attachment === "object") {
    if (attachment.type === "video" || attachment.resource_type === "video" || attachment.mimeType?.startsWith("video/")) {
      return "video";
    }
    if (attachment.type === "image" || attachment.resource_type === "image" || attachment.mimeType?.startsWith("image/")) {
      return "image";
    }
    if (attachment.mimeType === "application/pdf" || attachment.type === "pdf") {
      return "pdf";
    }
  }

  const url = getAttachmentUrl(attachment).toLowerCase();

  // Cloudinary resource path check
  if (url.includes("/video/upload/") || url.includes("/video/")) {
    return "video";
  }
  if (url.includes("/image/upload/") || url.includes("/image/")) {
    return "image";
  }

  // Video extensions
  if (/\.(mp4|mov|avi|webm|mkv|m4v|3gp|ogv|flv|wmv)(\?.*)?$/i.test(url)) {
    return "video";
  }

  // PDF
  if (/\.pdf(\?.*)?$/i.test(url)) {
    return "pdf";
  }

  // Image extensions
  if (/\.(jpg|jpeg|png|webp|gif|svg|bmp|ico|tiff|heic|avif)(\?.*)?$/i.test(url)) {
    return "image";
  }

  // Document extensions
  if (/\.(doc|docx|xls|xlsx|ppt|pptx|txt|rtf|csv)(\?.*)?$/i.test(url)) {
    return "document";
  }

  return "other";
}

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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
      case 409:
        toast.error(message);
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

export interface PublishJobResult {
  status: string;
  workflowStatus: string;
  isPublished: boolean;
  [key: string]: unknown;
}

export interface PublishJobResponse {
  success: boolean;
  message: string;
  project: PublishJobResult;
}

/** POST /api/admin/projects/:projectId/publish */
export async function publishProjectJob(projectId: string): Promise<PublishJobResponse> {
  return request<PublishJobResponse>(`/api/admin/projects/${projectId}/publish`, {
    method: "POST",
  });
}

export interface PrepareQuotationPayload {
  amount: number;
  currency: string;
  estimatedDuration: string;
  hourlyRate?: number;
  labourCost?: number;
  materialCost?: number;
  serviceCharge?: number;
  tax?: number;
  discount?: number;
  remarks?: string;
}

/** POST /api/admin/project-requests/:id/prepare-quotation */
export async function prepareProjectQuotation(
  id: string,
  payload: PrepareQuotationPayload
): Promise<{ success: boolean; data?: ProjectRequest; message?: string }> {
  return request<{ success: boolean; data?: ProjectRequest; message?: string }>(
    `/api/admin/project-requests/${id}/prepare-quotation`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Users & Service Providers
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ServiceProvider {
  _id: string;
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  serviceCategories?: string[];
  isApproved?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/** GET /api/admin/users */
export async function fetchUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sort?: string;
}): Promise<PaginatedResponse<User>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));
  if (params?.sort) query.set("sort", params.sort);
  const qs = query.toString();
  return request<PaginatedResponse<User>>(`/api/admin/users${qs ? `?${qs}` : ""}`);
}

/** GET /api/admin/service-providers */
export async function fetchServiceProviders(params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isApproved?: boolean;
  sort?: string;
}): Promise<PaginatedResponse<ServiceProvider>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));
  if (params?.isApproved !== undefined) query.set("isApproved", String(params.isApproved));
  if (params?.sort) query.set("sort", params.sort);
  const qs = query.toString();
  return request<PaginatedResponse<ServiceProvider>>(`/api/admin/service-providers${qs ? `?${qs}` : ""}`);
}

/** GET /api/admin/users/count */
export async function fetchUsersCount(): Promise<{ success: boolean; count: number }> {
  return request<{ success: boolean; count: number }>("/api/admin/users/count");
}

/** GET /api/admin/service-providers/count */
export async function fetchServiceProvidersCount(): Promise<{ success: boolean; count: number }> {
  return request<{ success: boolean; count: number }>("/api/admin/service-providers/count");
}

/** PUT /api/admin/users/:id */
export async function updateUser(id: string, data: Partial<User>): Promise<{ success: boolean; data: User }> {
  return request<{ success: boolean; data: User }>(`/api/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** DELETE /api/admin/users/:id */
export async function deleteUser(id: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/api/admin/users/${id}`, {
    method: "DELETE",
  });
}

/** PUT /api/admin/service-providers/:id */
export async function updateServiceProvider(id: string, data: Partial<ServiceProvider>): Promise<{ success: boolean; data: ServiceProvider }> {
  return request<{ success: boolean; data: ServiceProvider }>(`/api/admin/service-providers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** DELETE /api/admin/service-providers/:id */
export async function deleteServiceProvider(id: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/api/admin/service-providers/${id}`, {
    method: "DELETE",
  });
}

/** PUT /api/admin/service-providers/:id/status */
export async function updateServiceProviderStatus(id: string, status: { isActive?: boolean; isApproved?: boolean }): Promise<{ success: boolean; data: ServiceProvider }> {
  return request<{ success: boolean; data: ServiceProvider }>(`/api/admin/service-providers/${id}/status`, {
    method: "PUT",
    body: JSON.stringify(status),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Categories Management
// ─────────────────────────────────────────────────────────────────────────────

export interface Category {
  _id: string;
  name: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/** GET /api/admin/categories/count */
export async function fetchCategoriesCount(): Promise<{ success: boolean; count: number }> {
  return request<{ success: boolean; count: number }>("/api/admin/categories/count");
}

/** GET /api/admin/categories */
export async function adminFetchCategories(params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sort?: string;
}): Promise<PaginatedResponse<Category>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));
  if (params?.sort) query.set("sort", params.sort);
  const qs = query.toString();
  return request<PaginatedResponse<Category>>(`/api/admin/categories${qs ? `?${qs}` : ""}`);
}

/** POST /api/admin/categories */
export async function adminCreateCategory(data: { name: string; icon?: string; isActive?: boolean }): Promise<{ success: boolean; data: Category }> {
  return request<{ success: boolean; data: Category }>("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PUT /api/admin/categories/:id */
export async function adminUpdateCategory(id: string, data: Partial<Category>): Promise<{ success: boolean; data: Category }> {
  return request<{ success: boolean; data: Category }>(`/api/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** DELETE /api/admin/categories/:id */
export async function adminDeleteCategory(id: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/api/admin/categories/${id}`, {
    method: "DELETE",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Bookings Management
// ─────────────────────────────────────────────────────────────────────────────

export interface BookingListItem {
  _id: string;
  bookingId: string;
  customerName: string;
  providerName: string;
  service: string;
  bookingDate: string;
  status: string;
}

export interface BookingDetails {
  _id: string;
  requestNumber?: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  paymentStatus: string;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
  requesterId?: {
    _id: string;
    companyName?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  assignedProvider?: {
    _id: string;
    companyName?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  categoryId?: {
    _id: string;
    name: string;
    icon?: string;
  };
  location?: any;
  schedule?: any;
  attachments?: string[];
  [key: string]: unknown;
}

/** GET /api/admin/recent-bookings */
export async function fetchRecentBookings(): Promise<{ success: boolean; data: BookingListItem[] }> {
  return request<{ success: boolean; data: BookingListItem[] }>("/api/admin/recent-bookings");
}

/** GET /api/admin/bookings/:id */
export async function fetchBookingDetails(id: string): Promise<{ success: boolean; data: BookingDetails }> {
  return request<{ success: boolean; data: BookingDetails }>(`/api/admin/bookings/${id}`);
}

/** PUT /api/admin/bookings/:id */
export async function updateBookingDetails(id: string, data: { status?: string; assignedProvider?: string | null; paymentStatus?: string; adminNotes?: string }): Promise<{ success: boolean; data: any }> {
  return request<{ success: boolean; data: any }>(`/api/admin/bookings/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export interface ActiveBookingItem {
  _id: string;
  requestNumber?: string | null;
  title: string;
  categoryName?: string | null;
  priority: string;
  status: string;
  createdAt: string;
  submittedAt?: string | null;
  acceptedAt?: string | null;
  rfqNumber?: string | null;
  quotedAmount?: number | null;
  currency?: string | null;
  customerName?: string | null;
}

export interface PendingBookingItem {
  _id: string;
  requestNumber?: string | null;
  title: string;
  categoryName?: string | null;
  priority: string;
  status: string;
  createdAt: string;
  submittedAt?: string | null;
  minutesWaiting: number;
  customerName?: string | null;
}

/** GET /api/admin/bookings/active */
export async function fetchActiveBookings(): Promise<{ success: boolean; count: number; data: ActiveBookingItem[] }> {
  return request<{ success: boolean; count: number; data: ActiveBookingItem[] }>("/api/admin/bookings/active");
}

/** GET /api/admin/bookings/pending */
export async function fetchPendingBookings(): Promise<{ success: boolean; count: number; data: PendingBookingItem[] }> {
  return request<{ success: boolean; count: number; data: PendingBookingItem[] }>("/api/admin/bookings/pending");
}

// ─────────────────────────────────────────────────────────────────────────────
// Reports & Analytics Management
// ─────────────────────────────────────────────────────────────────────────────

export interface ReportsDashboardData {
  rfqThroughput: number;
  rfqGrowthPercentage: number;
  quotationRate: number;
  quotationRateGrowth: number;
  awardConversion: number;
  awardGrowth: number;
  averageCommission: number;
  commissionStatus: "Stable" | "Increasing" | "Decreasing";
}

export interface ReportsMonthlyRfq {
  month: string;
  count: number;
}

export interface ReportsCategoryMix {
  category: string;
  percentage: number;
}

export interface ReportsRegionalPerformance {
  rank: number;
  region: string;
  awards: number;
  status: "Top" | "Steady";
}

export interface ReportsFilterParams {
  fromDate?: string;
  toDate?: string;
  category?: string;
  region?: string;
  company?: string;
  status?: string;
}

function buildReportsQuery(params?: ReportsFilterParams): string {
  if (!params) return "";
  const query = new URLSearchParams();
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.category) query.set("category", params.category);
  if (params.region) query.set("region", params.region);
  if (params.company) query.set("company", params.company);
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

/** GET /api/admin/reports/dashboard */
export async function fetchReportsDashboard(
  params?: ReportsFilterParams
): Promise<{ success: boolean; data: ReportsDashboardData }> {
  return request<{ success: boolean; data: ReportsDashboardData }>(
    `/api/admin/reports/dashboard${buildReportsQuery(params)}`
  );
}

/** GET /api/admin/reports/monthly-rfq */
export async function fetchReportsMonthlyRfq(
  params?: ReportsFilterParams
): Promise<{ success: boolean; data: ReportsMonthlyRfq[] }> {
  return request<{ success: boolean; data: ReportsMonthlyRfq[] }>(
    `/api/admin/reports/monthly-rfq${buildReportsQuery(params)}`
  );
}

/** GET /api/admin/reports/category-mix */
export async function fetchReportsCategoryMix(
  params?: ReportsFilterParams
): Promise<{ success: boolean; data: ReportsCategoryMix[] }> {
  return request<{ success: boolean; data: ReportsCategoryMix[] }>(
    `/api/admin/reports/category-mix${buildReportsQuery(params)}`
  );
}

/** GET /api/admin/reports/regional-performance */
export async function fetchReportsRegionalPerformance(
  params?: ReportsFilterParams
): Promise<{ success: boolean; data: ReportsRegionalPerformance[] }> {
  return request<{ success: boolean; data: ReportsRegionalPerformance[] }>(
    `/api/admin/reports/regional-performance${buildReportsQuery(params)}`
  );
}

/** GET /api/admin/reports/filter */
export async function fetchReportsFilteredCombined(
  params?: ReportsFilterParams
): Promise<{
  success: boolean;
  data: {
    summary: ReportsDashboardData;
    monthlyRfq: ReportsMonthlyRfq[];
    categoryMix: ReportsCategoryMix[];
    regionalPerformance: ReportsRegionalPerformance[];
  };
}> {
  return request<{
    success: boolean;
    data: {
      summary: ReportsDashboardData;
      monthlyRfq: ReportsMonthlyRfq[];
      categoryMix: ReportsCategoryMix[];
      regionalPerformance: ReportsRegionalPerformance[];
    };
  }>(`/api/admin/reports/filter${buildReportsQuery(params)}`);
}

/** GET /api/admin/reports/export */
export async function exportReportFile(
  type: "excel" | "csv" | "pdf",
  params?: ReportsFilterParams
): Promise<Blob> {
  const token = localStorage.getItem("fixora_token");
  const query = new URLSearchParams();
  query.set("type", type);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.category) query.set("category", params.category);
  if (params?.region) query.set("region", params.region);
  if (params?.company) query.set("company", params.company);
  if (params?.status) query.set("status", params.status);

  const response = await fetch(`${BASE_URL}/api/admin/reports/export?${query.toString()}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to export report");
  }

  return response.blob();
}

