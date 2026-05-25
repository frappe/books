export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info' | 'debug' | 'unknown';
  code?: string;
  message: string;
  refs?: string[];
}

export interface ValidationResult {
  arellePath: string;
  ok: boolean;
  issues: ValidationIssue[];
  rawLog: string;
  exitCode: number;
  stderr: string;
}

export interface ValidationRequest {
  instancePath: string;
  taxonomyEntryPath?: string;
  arellePath: string;
}

export async function detectArelle(arellePath: string): Promise<string | null> {
  return await ipc.ee.detectArelle(arellePath);
}

export async function validateXbrl(
  req: ValidationRequest
): Promise<ValidationResult> {
  const resp = (await ipc.ee.validateXbrl(req)) as {
    data?: ValidationResult;
    error?: { message?: string };
  };

  if (resp.error) {
    throw new Error(resp.error.message ?? 'arelle validation failed');
  }
  if (!resp.data) {
    throw new Error('arelle validation returned no data');
  }
  return resp.data;
}
