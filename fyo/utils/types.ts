export interface ErrorLog {
  name: string;
  message: string;
  stack?: string;
  more?: Record<string, unknown>;
}
