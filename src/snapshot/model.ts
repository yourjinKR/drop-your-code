import type { SnapshotInput } from '../state/workspace';
import { highlightSnapshot } from './highlight';
import { layoutSnapshot } from './layout';
import type { SnapshotModel } from './layout';
import { prepareTextMeasurement } from './measureText';
import { defaultSnapshotPresentation, snapshotFont } from './presentation';

export type { SnapshotModel } from './layout';

export async function buildSnapshotModel(input: SnapshotInput, signal?: AbortSignal): Promise<SnapshotModel> {
  const { fontSize, lineHeight } = defaultSnapshotPresentation;
  const [highlights, { measure, measureTitle, baseline }] = await Promise.all([
    highlightSnapshot(input, signal),
    prepareTextMeasurement(snapshotFont, fontSize, fontSize * lineHeight),
  ]);
  signal?.throwIfAborted();
  return layoutSnapshot(input, highlights, measure, baseline, measureTitle);
}
