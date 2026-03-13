/**
 * API Client for ICMS Frontend
 * Handles all HTTP requests to the backend API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Main API request function
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {}, params } = options;

  const url = buildUrl(endpoint, params);

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include", // Include cookies for auth
  };

  if (body && method !== "GET") {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return {
        success: false,
        error: {
          code: "INVALID_RESPONSE",
          message: `Expected JSON but received ${contentType || "unknown content type"} (status ${response.status})`,
        },
      };
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || {
          code: "REQUEST_FAILED",
          message: data.message || "Request failed",
        },
      };
    }

    return data;
  } catch (error) {
    console.error("API Request Error:", error);
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Network error occurred",
      },
    };
  }
}

/**
 * Convenience methods
 */
export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
    apiRequest<T>(endpoint, { method: "GET", params }),

  post: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, { method: "POST", body }),

  put: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, { method: "PUT", body }),

  patch: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, { method: "PATCH", body }),

  delete: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
    apiRequest<T>(endpoint, { method: "DELETE", params }),
};

/**
 * Upload file
 */
export async function uploadFile(
  file: File,
  folder: string = "general"
): Promise<ApiResponse<{ url: string; fileName: string }>> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  try {
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error: {
          code: "UPLOAD_ERROR",
          message: errorData?.error?.message || `Upload failed with status ${response.status}`,
        },
      };
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message: error instanceof Error ? error.message : "Upload failed",
      },
    };
  }
}
