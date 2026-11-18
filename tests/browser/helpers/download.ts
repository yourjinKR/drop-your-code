import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';

export async function downloadImage(page: Page) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export', exact: true }).click(),
  ]);
  return { bytes: await readFile(await download.path()), download, filename: download.suggestedFilename() };
}
