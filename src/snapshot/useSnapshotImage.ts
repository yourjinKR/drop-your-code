import { useEffect, useState } from 'react';
import type { SnapshotModel } from './model';
import { renderSnapshotSvg } from './renderSvg';

type SnapshotImage = { model: SnapshotModel; url: string };

export function useSnapshotImage(model: SnapshotModel | null, active: boolean) {
  const [image, setImage] = useState<SnapshotImage | null>(null);
  const [failedModel, setFailedModel] = useState<SnapshotModel | null>(null);
  const displayedModel = image?.model;

  useEffect(() => {
    if (!active || !model || model === displayedModel || model === failedModel) return;
    let url: string | undefined;
    let cancelled = false;
    let displayed = false;
    async function decode(current: SnapshotModel) {
      try {
        url = URL.createObjectURL(new Blob([renderSnapshotSvg(current)], { type: 'image/svg+xml' }));
        const candidate = new Image();
        candidate.src = url;
        await candidate.decode();
        if (!cancelled) {
          displayed = true;
          setImage({ model: current, url });
        }
      } catch {
        if (url) URL.revokeObjectURL(url);
        if (!cancelled) setFailedModel(current);
      }
    }
    void decode(model);
    return () => {
      cancelled = true;
      if (url && !displayed) URL.revokeObjectURL(url);
    };
  }, [active, model, displayedModel, failedModel]);

  useEffect(() => {
    if (image) return () => URL.revokeObjectURL(image.url);
  }, [image]);

  return { image, failed: model !== null && model === failedModel };
}
