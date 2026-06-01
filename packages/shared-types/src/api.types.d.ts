import type { CalendarProject } from './calendar.types';
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
    progress?: number;
    downloadUrl?: string;
    error?: string;
}
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
//# sourceMappingURL=api.types.d.ts.map