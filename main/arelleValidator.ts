import { spawn } from 'child_process';
import { constants as fsConstants, promises as fs } from 'fs';
import os from 'os';
import path from 'path';

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

export interface ValidateOptions {
  instancePath: string;
  taxonomyEntryPath?: string;
  arellePath: string;
}

export async function detectArelle(arellePath: string): Promise<string | null> {
  if (!arellePath) return null;
  if (await isExecutable(arellePath)) return arellePath;
  return null;
}

export async function validateXbrl(
  options: ValidateOptions
): Promise<ValidationResult> {
  if (!options.arellePath) {
    throw new Error(
      'Arelle CLI path is not configured. Set it in Accounting Settings.'
    );
  }
  if (!(await isExecutable(options.arellePath))) {
    throw new Error(`Arelle binary not executable at ${options.arellePath}.`);
  }

  const taxonomyEntry =
    options.taxonomyEntryPath ?? (await defaultTaxonomyEntryPath());

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'arelle-ee-'));
  const logFile = path.join(tmpDir, 'log.xml');

  const instanceForValidation =
    taxonomyEntry !== undefined
      ? await prepareInstanceWithSchemaRef(
          options.instancePath,
          taxonomyEntry,
          tmpDir
        )
      : options.instancePath;

  try {
    const args = [
      '--file',
      instanceForValidation,
      '--validate',
      '--logFile',
      logFile,
      '--logLevel',
      'info',
    ];

    const child = spawn(options.arellePath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stderrChunks: Buffer[] = [];
    child.stderr.on('data', (b: Buffer) => stderrChunks.push(b));
    const exitCode = await new Promise<number>((resolve, reject) => {
      child.on('error', reject);
      child.on('close', (code) => resolve(code ?? 0));
    });

    let rawLog = '';
    try {
      rawLog = await fs.readFile(logFile, 'utf-8');
    } catch {}

    const issues = parseArelleLog(rawLog);
    const ok = issues.every((i) => i.severity !== 'error');

    return {
      arellePath: options.arellePath,
      ok,
      issues,
      rawLog,
      exitCode,
      stderr: Buffer.concat(stderrChunks).toString('utf-8'),
    };
  } finally {
    await fs
      .rm(tmpDir, { recursive: true, force: true })
      .catch(() => undefined);
  }
}

export function parseArelleLog(xml: string): ValidationIssue[] {
  if (!xml) return [];
  const issues: ValidationIssue[] = [];
  const entryRe = /<entry\b([^>]*)>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null;
  while ((match = entryRe.exec(xml)) !== null) {
    const attrs = match[1];
    const inner = match[2];
    const level = extractAttr(attrs, 'level');
    const code = extractAttr(attrs, 'code');
    const message =
      extractTag(inner, 'message') ??
      extractTag(inner, 'msg') ??
      stripTags(inner).trim();
    const refs = extractAllAttrs(inner, 'href');
    issues.push({
      severity: normalizeSeverity(level),
      code: code ?? undefined,
      message: message || '(no message)',
      refs: refs.length > 0 ? refs : undefined,
    });
  }
  return issues;
}

async function prepareInstanceWithSchemaRef(
  instancePath: string,
  taxonomyEntryPath: string,
  tmpDir: string
): Promise<string> {
  const raw = await fs.readFile(instancePath, 'utf-8');
  if (/<link:schemaRef\b/.test(raw)) {
    return instancePath;
  }

  const fileUrl = pathToFileUrl(taxonomyEntryPath);
  const schemaRef = `<link:schemaRef xlink:type="simple" xlink:href="${fileUrl}"/>`;

  const patched = raw.replace(/(<xbrli:xbrl\b[^>]*>)/, `$1\n  ${schemaRef}`);

  const out = path.join(tmpDir, 'instance.xbrl');
  await fs.writeFile(out, patched, 'utf-8');
  return out;
}

function pathToFileUrl(p: string): string {
  const normalized = p.replace(/\\/g, '/');
  const prefix = normalized.startsWith('/') ? 'file://' : 'file:///';
  return prefix + encodeURI(normalized).replace(/#/g, '%23');
}

async function defaultTaxonomyEntryPath(): Promise<string | undefined> {
  const roots = [
    path.join(process.cwd(), 'reports/EstonianAnnualReport/taxonomy'),
    path.join(__dirname, '../../reports/EstonianAnnualReport/taxonomy'),
  ];
  const layouts = [
    'et-gaap_2026-01-01/et-gaap-cor_2026-01-01.xsd',
    'et-gaap_2026-01-01/et-gaap_2026-01-01/et-gaap-cor_2026-01-01.xsd',
  ];
  for (const root of roots) {
    for (const layout of layouts) {
      const candidate = path.join(root, layout);
      try {
        await fs.access(candidate);
        return candidate;
      } catch {}
    }
  }
  return undefined;
}

function normalizeSeverity(raw: string | null): ValidationIssue['severity'] {
  if (!raw) return 'unknown';
  const lower = raw.toLowerCase();
  if (lower.includes('error')) return 'error';
  if (lower.includes('warn')) return 'warning';
  if (lower === 'info') return 'info';
  if (lower === 'debug') return 'debug';
  return 'unknown';
}

function extractAttr(attrs: string, name: string): string | null {
  const re = new RegExp(`\\b${escapeRe(name)}\\s*=\\s*"([^"]*)"`);
  const m = re.exec(attrs);
  return m ? m[1] : null;
}

function extractTag(xml: string, tag: string): string | null {
  const re = new RegExp(
    `<${escapeRe(tag)}\\b[^>]*>([\\s\\S]*?)<\\/${escapeRe(tag)}>`
  );
  const m = re.exec(xml);
  return m ? unescapeXml(m[1]).trim() : null;
}

function extractAllAttrs(xml: string, attr: string): string[] {
  const re = new RegExp(`\\b${escapeRe(attr)}\\s*=\\s*"([^"]*)"`, 'g');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) out.push(m[1]);
  return out;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '');
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function unescapeXml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

async function isExecutable(p: string): Promise<boolean> {
  try {
    const stat = await fs.stat(p);
    if (!stat.isFile()) return false;
    if (process.platform === 'win32') return p.toLowerCase().endsWith('.exe');
    await fs.access(p, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}
