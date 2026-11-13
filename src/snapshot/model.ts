import type { SnapshotInput } from '../state/workspace';
import { highlightSnapshot } from './highlight';
import { layoutSnapshot } from './layout';
import type { SnapshotModel } from './layout';
import { prepareTextMeasurement } from './measureText';
import { snapshotFonts } from './presentation';

export type { SnapshotModel } from './layout';

export async function buildSnapshotModel(input: SnapshotInput, signal?: AbortSignal): Promise<SnapshotModel> {
  const { fontId, fontSize, lineHeight } = input.presentation;
  const [highlights, { measure, measureTitle, baseline }] = await Promise.all([
    highlightSnapshot(input, signal),
    prepareTextMeasurement(snapshotFonts[fontId].family, fontSize, fontSize * lineHeight),
  ]);
  signal?.throwIfAborted();
  return layoutSnapshot(input, highlights, measure, baseline, measureTitle);
}
