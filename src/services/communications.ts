/**
 * Communications API Services
 */

import { api, ApiResponse } from "@/lib/api-client";

export interface MessageTemplate {
  id: string;
  tenantId: string | null;
  name: string;
  subject: string;
  body: string;
  type: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageLog {
  id: string;
  tenantId: string | null;
  eventId: string | null;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  channel: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  event?: {
    id: string;
    title: string;
  } | null;
}

export interface SendMessageData {
  eventId: string;
  subject: string;
  body: string;
  recipientFilter?: {
    status?: string;
    role?: string;
    category?: string;
  };
}

export interface SendResult {
  sent: number;
  failed: number;
  total: number;
}

export interface CreateTemplateData {
  name: string;
  subject: string;
  body: string;
  type?: string;
}

export const communicationsService = {
  /**
   * Send bulk email to registrants
   */
  send: (data: SendMessageData) =>
    api.post<SendResult>("/api/communications/send", data),

  /**
   * Get all templates
   */
  getTemplates: () =>
    api.get<MessageTemplate[]>("/api/communications/templates"),

  /**
   * Create a template
   */
  createTemplate: (data: CreateTemplateData) =>
    api.post<MessageTemplate>("/api/communications/templates", data),

  /**
   * Update a template
   */
  updateTemplate: (templateId: string, data: Partial<CreateTemplateData>) =>
    api.put<MessageTemplate>("/api/communications/templates", { templateId, ...data }),

  /**
   * Delete a template
   */
  deleteTemplate: (templateId: string) =>
    api.delete<{ id: string }>(`/api/communications/templates?templateId=${templateId}`),

  /**
   * Get message history
   */
  getHistory: (filters?: { page?: number; limit?: number; eventId?: string; status?: string }) =>
    api.get<MessageLog[]>("/api/communications/history", filters as Record<string, string | number | boolean>),
};
