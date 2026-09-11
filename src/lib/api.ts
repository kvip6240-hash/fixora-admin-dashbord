/**
 * src/lib/api.ts
 * Central API client for Fixora Admin Dashboard.
 * Automatically attaches Bearer token from localStorage.
 * Throws ApiError for non-2xx responses with proper status codes.
 */

import { toast } from "sonner";

/**
 * Normalizes backend base URL:
 * - Strips trailing whitespace and slashes
 * - Falls back to window.location.origin in browser if empty, or http://localhost:5000 in dev
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:5000";
  }
  return "";
}

/**
 * Robustly constructs full API URL preventing double slashes or duplicate /api/api
 */
export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (!base) return cleanPath;

  if (base.endsWith("/api") && cleanPath.startsWith("/api/")) {
    return `${base}${cleanPath.slice(4)}`;
  }

  return `${base}${cleanPath}`;
}

export const BASE_URL = getApiBaseUrl();

export type AttachmentType = "image" | "video" | "pdf" | "document" | "other";

/**
 * Safe helper to extract and normalize media URL from multiple potential API shapes.
 * Returns a trimmed string URL if successful, otherwise null.
 * Preserves the exact Cloudinary URL (whether image, video, or raw document).
 */
export function getMediaUrl(
  attachment?: string | { url?: string; fileUrl?: string; secure_url?: string; path?: string; link?: string; src?: string } | null,
): string | null {
  if (!attachment) return null;

  if (typeof attachment === "string") {
    const trimmed = attachment.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof attachment === "object" && !Array.isArray(attachment)) {
    const secureUrl = attachment.secure_url;
    if (typeof secureUrl === "string" && secureUrl.trim()) {
      return secureUrl.trim();
    }
    const url = attachment.url;
    if (typeof url === "string" && url.trim()) {
      return url.trim();
    }
    const fileUrl = (attachment as any).fileUrl;
    if (typeof fileUrl === "string" && fileUrl.trim()) {
      return fileUrl.trim();
    }
    const path = (attachment as any).path;
    if (typeof path === "string" && path.trim()) {
      return path.trim();
    }
    const link = (attachment as any).link;
    if (typeof link === "string" && link.trim()) {
      return link.trim();
    }
    const src = (attachment as any).src;
    if (typeof src === "string" && src.trim()) {
      return src.trim();
    }
  }

  return null;
}

/**
 * Prepend backend BASE_URL if the URL is a relative path (e.g. /uploads/file.pdf).
 * Preserves Cloudinary HTTPS URLs intact and upgrades http:// Cloudinary URLs to https://.
 * Never alters Cloudinary resource paths (/video/upload/, /raw/upload/, etc.).
 */
export function getAttachmentUrl(
  attachment?: any,
): string {
  const rawUrl = getMediaUrl(attachment);
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
  const base = getApiBaseUrl();
  const cleanPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  return `${base}${cleanPath}`;
}

/**
 * Accurately determines file type for images, videos, PDFs, and documents
 * Detection Priority:
 * 1. resource_type (Cloudinary: image | video | raw)
 * 2. mime_type / mimeType (e.g. video/mp4, application/pdf)
 * 3. format (e.g. mp4, pdf, png)
 * 4. File extension from URL or original filename/public_id
 */
export function getAttachmentType(
  attachment?: any,
): AttachmentType {
  if (!attachment) return "other";

  const mediaUrl = getMediaUrl(attachment);
  const getExt = (str?: string | null): string => {
    if (!str || typeof str !== "string") return "";
    const clean = str.split("?")[0].split("#")[0];
    const parts = clean.split(".");
    return parts.length > 1 ? parts.pop()!.toLowerCase().trim() : "";
  };

  const fileName = typeof attachment === "object" && attachment !== null
    ? String((attachment as any).original_filename || (attachment as any).name || (attachment as any).public_id || "")
    : "";

  let resourceType = "";
  let mimeType = "";
  let format = "";
  let typeProp = "";

  if (attachment && typeof attachment === "object" && !Array.isArray(attachment)) {
    resourceType = String(attachment.resource_type || "").toLowerCase().trim();
    mimeType = String(attachment.mime_type || attachment.mimeType || "").toLowerCase().trim();
    format = String(attachment.format || "").toLowerCase().trim();
    typeProp = String(attachment.type || "").toLowerCase().trim();
  }

  const videoFormats = ["mp4", "mov", "avi", "webm", "mkv", "m4v", "3gp", "ogv", "flv", "wmv"];
  const imageFormats = ["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "ico", "tiff", "heic", "avif"];
  const docFormats = ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf", "csv"];

  // 1. Check resource_type
  if (resourceType === "video" || typeProp === "video") return "video";
  if (resourceType === "image" || typeProp === "image") return "image";
  if (resourceType === "raw" && (format === "pdf" || mimeType === "application/pdf" || getExt(mediaUrl) === "pdf" || getExt(fileName) === "pdf")) {
    return "pdf";
  }

  // 2. Check mime_type
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("text/") || mimeType.includes("document") || mimeType.includes("sheet")) return "document";

  // 3. Check format
  if (format === "pdf" || typeProp === "pdf") return "pdf";
  if (videoFormats.includes(format)) return "video";
  if (imageFormats.includes(format)) return "image";
  if (docFormats.includes(format)) return "document";

  // 4. Check URL patterns & extension
  const ext = getExt(mediaUrl) || getExt(fileName);
  if (ext === "pdf") return "pdf";
  if (videoFormats.includes(ext)) return "video";
  if (imageFormats.includes(ext)) return "image";
  if (docFormats.includes(ext)) return "document";

  if (mediaUrl) {
    const urlLower = mediaUrl.toLowerCase();
    if (urlLower.includes("/video/upload/") || urlLower.includes("/video/")) return "video";
    if (urlLower.includes("/image/upload/") || urlLower.includes("/image/")) return "image";
    if (urlLower.includes("/raw/upload/") && urlLower.includes(".pdf")) return "pdf";
  }

  return "other";
}

/**
 * Safely determines if the media attachment is a video.
 */
export function isVideo(
  attachment: any,
  mediaUrl?: string | null,
): boolean {
  return getAttachmentType(attachment) === "video";
}

/**
 * Safely determines if the media attachment is an image.
 */
export function isImage(
  attachment: any,
  mediaUrl?: string | null,
): boolean {
  return getAttachmentType(attachment) === "image";
}

/**
 * Safely determines if the media attachment is a PDF document.
 */
export function isPdf(
  attachment: any,
  mediaUrl?: string | null,
): boolean {
  return getAttachmentType(attachment) === "pdf";
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
  const fullUrl = buildApiUrl(path);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(fullUrl, {
      ...options,
      headers,
    });
  } catch (err: any) {
    const errorDetails =
      err instanceof TypeError && err.message.includes("Failed to fetch")
        ? `Cannot connect to backend (${getApiBaseUrl() || "relative URL"}). Check CORS or server status.`
        : err?.message || "Network error";

    toast.error(`Connection Error: ${errorDetails}`);
    console.error(`[API Network Error] ${options.method || "GET"} ${fullUrl}:`, err);
    throw new ApiError(0, errorDetails);
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status} (${response.statusText})`;
    try {
      const body = await response.json();
      message = body?.message || message;
    } catch {
      // ignore parse errors for HTML/plain text error responses
    }

    switch (response.status) {
      case 401:
        toast.error("Session expired or unauthorized. Please log in again.");
        handleAuthError();
        break;
      case 403:
        toast.error(`Access Forbidden (403): ${message}`);
        break;
      case 404:
        toast.error(`Not Found (404): ${fullUrl}`);
        break;
      case 409:
        toast.error(message);
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        toast.error(`Server Error (${response.status}): ${message}`);
        break;
      default:
        toast.error(`Error (${response.status}): ${message}`);
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

/** A single Cloudinary attachment object returned by the backend upload flow. */
export interface CloudinaryAttachment {
  url?: string;
  secure_url?: string;
  public_id?: string;
  resource_type?: string;
  format?: string;
  fileUrl?: string;
  path?: string;
  name?: string;
  type?: string;
  mimeType?: string;
  [key: string]: unknown;
}

/** Attachment is either a plain URL string OR a Cloudinary object — both are valid. */
export type Attachment = string | CloudinaryAttachment;

export interface ProjectRequest {
  _id: string;
  title?: string;
  status?: string;
  category?: string | { name: string; [key: string]: unknown };
  company?: Company | string;
  location?: string;
  schedule?: string;
  attachments?: Attachment[];
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
  attachments?: Attachment[];
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

  const fullUrl = buildApiUrl(`/api/admin/reports/export?${query.toString()}`);
  const response = await fetch(fullUrl, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      toast.error("Session expired. Please log in again.");
      handleAuthError();
    }
    throw new Error(`Failed to export report (${response.status})`);
  }

  return response.blob();
}

export type AdminCsvExport = "bookings" | "rfqs" | "payments";

function getDownloadFilename(contentDisposition: string | null, fallback: string): string {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
}

/** Downloads a real, admin-authorized CSV export from the backend. */
export async function exportAdminCsv(
  resource: AdminCsvExport,
): Promise<{ blob: Blob; filename: string }> {
  const token = getToken();
  const fullUrl = buildApiUrl(`/api/admin/exports/${resource}?format=csv`);

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (err: any) {
    throw new ApiError(0, err?.message || "Unable to connect to the export service.");
  }

  if (!response.ok) {
    let message = `Unable to export ${resource} (${response.status}).`;
    try {
      const body = await response.json();
      message = body?.message || message;
    } catch {
      // The backend may return an empty response for an error.
    }

    if (response.status === 401) handleAuthError();
    throw new ApiError(response.status, message);
  }

  return {
    blob: await response.blob(),
    filename: getDownloadFilename(response.headers.get("Content-Disposition"), `fixora-${resource}.csv`),
  };
}

