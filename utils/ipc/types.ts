export interface BackendResponse {
  data?: unknown;
  error?: { message: string; name: string; stack?: string; code?: string };
}
