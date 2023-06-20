import fs from 'fs/promises';
import path from 'path';
import { TemplateFile } from 'utils/types';

export async function getTemplates() {
  const paths = await getPrintTemplatePaths();
  if (!paths) {
    return [];
  }

  const templates: TemplateFile[] = [];
  for (const file of paths.files) {
    const filePath = path.join(paths.root, file);
    const template = await fs.readFile(filePath, 'utf-8');
    const { mtime } = await fs.stat(filePath);
    templates.push({ template, file, modified: mtime.toISOString() });
  }

  return templates;
}

async function getPrintTemplatePaths(): Promise<{
  files: string[];
  root: string;
} | null> {
  let root = path.join(process.resourcesPath, `../templates`);

  try {
    const files = await fs.readdir(root);
    return { files, root };
  } catch {
    root = path.join(__dirname, '..', '..', `templates`);
  }

  try {
    const files = await fs.readdir(root);
    return { files, root };
  } catch {
    return null;
  }
}
