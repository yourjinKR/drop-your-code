import { useLayoutEffect, useRef, useState } from 'react';
import type { useSnapshotModel } from './useSnapshotModel';
import { useSnapshotImage } from './useSnapshotImage';

export const previewZoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const;

type PreviewProps = ReturnType<typeof useSnapshotModel> & {
  active: boolean;
  zoom: number | null;
  onDisplay: (scale: number, width: number, height: number) => void;
};

export function SnapshotPreview({ active, model, status, retry, zoom, onDisplay }: PreviewProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const previous = useRef<{ zoom: number | null; scale: number; offsetX: number; offsetY: number } | null>(null);
  const scroll = useRef({ x: 0, y: 0 });
  const [space, setSpace] = useState({ width: 0, height: 0 });
  const { image, failed } = useSnapshotImage(status === 'ready' ? model : null, active);
  const width = image?.model.width ?? 0;
  const height = image?.model.height ?? 0;
  const fit = width && height && space.width && space.height
    ? Math.min(1, space.width / width, space.height / height) : 1;
  const scale = zoom ?? fit;

  useLayoutEffect(() => {
    if (!active || !viewport.current) return;
    const element = viewport.current;
    const measure = () => setSpace({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [active]);

  useLayoutEffect(() => {
    if (!active) return;
    onDisplay(scale, width, height);
    const element = viewport.current;
    const img = imageRef.current;
    if (!element || !img) return;
    const before = previous.current;
    if (zoom === null) {
      element.scrollTo(0, 0);
    } else if (before && before.zoom !== zoom) {
      const cx = element.clientWidth / 2;
      const cy = element.clientHeight / 2;
      element.scrollTo(
        img.offsetLeft + (scroll.current.x + cx - before.offsetX) * scale / before.scale - cx,
        img.offsetTop + (scroll.current.y + cy - before.offsetY) * scale / before.scale - cy,
      );
    } else {
      element.scrollTo(scroll.current.x, scroll.current.y);
    }
    scroll.current = { x: element.scrollLeft, y: element.scrollTop };
    previous.current = { zoom, scale, offsetX: img.offsetLeft, offsetY: img.offsetTop };
  }, [active, height, onDisplay, scale, space, width, zoom]);

  const error = status === 'error' || failed;
  const pending = !error && (status === 'pending' || !image || image.model !== model);
  return (
    <div className="preview-panel" id="preview-panel" role="tabpanel" aria-labelledby="preview-tab" hidden={!active}>
      {error ? (
        <div className="preview-message" role="alert">
          <p>{image ? 'Could not update the preview. Showing the last preview.' : 'Could not render the preview.'}</p>
          <button type="button" onClick={retry}>Retry</button>
        </div>
      ) : pending ? (
        <p className="preview-message" role="status">{image ? 'Updating preview…' : 'Rendering preview…'}</p>
      ) : image?.model.hasOverflowWrap ? (
        <p className="preview-message">Lines beyond the maximum image width are wrapped in the preview.</p>
      ) : null}
      <div className="preview-viewport" ref={viewport} tabIndex={0} role="region" aria-label="Snapshot canvas"
        onScroll={(event) => {
          if (!active) return;
          const { scrollLeft, scrollTop } = event.currentTarget;
          scroll.current = { x: scrollLeft, y: scrollTop };
        }}>
        <div className="preview-stage">
          {image && <img ref={imageRef} src={image.url} alt="Code snapshot" draggable={false}
            style={{ width: width * scale, height: height * scale }} />}
        </div>
      </div>
    </div>
  );
}
