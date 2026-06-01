// =============================================================================
// API Types — Request/Response DTOs
// =============================================================================

import type { CalendarProject } from './calendar.types.js';

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export interface UploadImageResponse {
  id: string;
  originalFilename: string;
  storagePath: string;
  thumbnailPath: string;
  widthPx: number;
  heightPx: number;
  fileSizeBytes: number;
  mimeType: string;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export type RenderJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface RenderRequest {
  project: CalendarProject;
}

export interface RenderResponse {
  jobId: string;
  status: RenderJobStatus;
  message: string;
}

export interface RenderStatusResponse {
  jobId: string;
  status: RenderJobStatus;
  progress?: number; // 0-100
  downloadUrl?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export interface ProjectSummary {
  id: string;
  name: string;
  year: number;
  updatedAt: string;
  thumbnailUrl?: string;
}

export interface SaveProjectRequest {
  project: CalendarProject;
}

export interface SaveProjectResponse {
  id: string;
  updatedAt: string;
}
