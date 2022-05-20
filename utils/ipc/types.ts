export interface DatabaseResponse {
  data?: unknown;
  error?: { message: string; name: string; stack?: string };
}
