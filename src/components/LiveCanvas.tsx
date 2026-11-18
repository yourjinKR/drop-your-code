import { useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import { Hand, LocateFixed, Maximize, Minus, Plus } from 'lucide-react';
import type { SnapshotModel } from '../snapshot/model';
import { minSnapshotWindowWidth, snapshotInsets, windowHeaderHeight } from '../snapshot/presentation';
import type { SnapshotPresentation } from '../snapshot/presentation';
import { IconButton } from './ui/IconButton';
import './live-canvas.css';

const zoomLevels = [0.125, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const canvasMargin = 20;

type Size = { width: number; height: number };
type Viewport = Size & { left: number; top: number; scale: number };
type Drag = { id: number; x: number; y: number; left: number; top: number };

export function LiveCanvas({ presentation, model, failed, retry, jpgBackground, children }: {
  presentation: SnapshotPresentation;
  model: SnapshotModel | null;
  failed: boolean;
  retry: () => void;
  jpgBackground?: string | undefined;
  children: ReactNode;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const composition = useRef<HTMLDivElement>(null);
  const previous = useRef<Viewport | null>(null);
  const scrollPosition = useRef({ left: 0, top: 0 });
  const recenter = useRef(false);
  const drag = useRef<Drag | null>(null);
  const [space, setSpace] = useState<Size>({ width: 0, height: 0 });
  const [compositionHeight, setCompositionHeight] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const [panMode, setPanMode] = useState(false);
  const [dragging, setDragging] = useState(false);

  const inset = snapshotInsets(presentation);
  const naturalWidth = (model?.window.width ?? minSnapshotWindowWidth) + 2 * inset.x;
  const minimumHeight = windowHeaderHeight + 2 + (model?.editorContentHeight ??
    Math.ceil(2 * presentation.codePadding + presentation.fontSize * presentation.lineHeight)) + inset.top + inset.bottom;
  const naturalHeight = Math.max(minimumHeight, compositionHeight);
  const usableWidth = Math.max(1, space.width - 2 * canvasMargin);
  const usableHeight = Math.max(1, space.height - 2 * canvasMargin);
  const initialScale = space.width ? Math.min(1, usableWidth / (minSnapshotWindowWidth + 2 * inset.x)) : 1;
  const scale = zoom ?? initialScale;
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  const innerWidth = Math.max(space.width, width + 2 * canvasMargin);
  const innerHeight = Math.max(space.height, height + 2 * canvasMargin);
  const left = space.width + (innerWidth - width) / 2;
  const top = space.height + (innerHeight - height) / 2;
  const zoomIn = zoomLevels.find((level) => level > scale);
  const zoomOut = zoomLevels.filter((level) => level < scale).at(-1);

  useLayoutEffect(() => {
    const view = viewport.current;
    const scene = composition.current;
    if (!view || !scene) return;
    const measure = () => {
      const { clientWidth, clientHeight } = view;
      setSpace((current) => current.width === clientWidth && current.height === clientHeight
        ? current : { width: clientWidth, height: clientHeight });
      setCompositionHeight(scene.offsetHeight);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(view);
    observer.observe(scene);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const view = viewport.current;
    if (!view || !space.width || !space.height) return;
    const before = previous.current;
    // Resizing the stage can clamp the DOM scroll position before this effect runs.
    const scroll = scrollPosition.current;
    if (!before || recenter.current) {
      view.scrollTo(space.width, space.height);
      recenter.current = false;
    } else if (scale !== before.scale) {
      const ratio = scale / before.scale;
      view.scrollTo(left + (scroll.left + before.width / 2 - before.left) * ratio - space.width / 2,
        top + (scroll.top + before.height / 2 - before.top) * ratio - space.height / 2);
    } else if (space.width !== before.width || space.height !== before.height) {
      view.scrollTo(scroll.left + space.width - before.width, scroll.top + space.height - before.height);
    }
    scrollPosition.current = { left: view.scrollLeft, top: view.scrollTop };
    previous.current = { ...space, left, top, scale };
  }, [left, top, scale, space]);

  function centerAt(next: number | null) {
    if (next === zoom) viewport.current?.scrollTo(space.width, space.height);
    else {
      recenter.current = true;
      setZoom(next);
    }
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    // Touch pans with the browser's native scroll gesture, including in Pan mode.
    if (drag.current || event.button !== 0 || event.pointerType === 'touch') return;
    if (!panMode && (event.pointerType !== 'mouse' || composition.current?.contains(event.target as Node))) return;
    event.preventDefault();
    const view = event.currentTarget;
    view.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: view.scrollLeft, top: view.scrollTop };
    setDragging(true);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (start?.id !== event.pointerId) return;
    event.currentTarget.scrollTo(start.left + start.x - event.clientX, start.top + start.y - event.clientY);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    const view = event.currentTarget;
    if (view.hasPointerCapture(event.pointerId)) view.releasePointerCapture(event.pointerId);
  }

  const background = presentation.transparent ? jpgBackground : presentation.backgroundColor;
  return (
    <div className="live-canvas">
      {failed && <div className="canvas-notice" role="alert">Could not update snapshot dimensions.
        <button type="button" onClick={retry}>Retry</button>
      </div>}
      <div className="canvas-viewport" ref={viewport} role="region" aria-label="Snapshot canvas" tabIndex={0}
        data-pan-mode={panMode} data-dragging={dragging} onPointerDownCapture={startDrag}
        onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}
        onScroll={(event) => { scrollPosition.current = { left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop }; }}>
        <div className="canvas-stage" style={{ width: innerWidth + 2 * space.width, height: innerHeight + 2 * space.height }}>
          <div className="canvas-piece" style={{ left, top, width, height }}>
            <div className="canvas-composition" ref={composition} data-transparent={!background}
              style={{ width: naturalWidth, padding: `${inset.top}px ${inset.x}px ${inset.bottom}px`,
                backgroundColor: background, transform: `scale(${scale})` }}>
              {children}
            </div>
          </div>
        </div>
      </div>
      <div className="canvas-toolbar">
        <div className="canvas-metadata">
          {model && <span className="canvas-dimensions">{model.width} × {model.height} px</span>}
          {model?.hasOverflowWrap && <span className="canvas-overflow-note">Long lines wrap in exported images.</span>}
        </div>
        <div className="canvas-controls" role="group" aria-label="Canvas navigation">
          <IconButton label="Pan mode" aria-pressed={panMode} onClick={() => setPanMode((active) => !active)}>
            <Hand size={15} aria-hidden="true" />
          </IconButton>
          <IconButton label="Zoom out" disabled={zoomOut === undefined} onClick={() => zoomOut && setZoom(zoomOut)}>
            <Minus size={15} aria-hidden="true" />
          </IconButton>
          <output className="canvas-scale" aria-label="Canvas zoom">{Math.round(scale * 100)}%</output>
          <IconButton label="Zoom in" disabled={zoomIn === undefined} onClick={() => zoomIn && setZoom(zoomIn)}>
            <Plus size={15} aria-hidden="true" />
          </IconButton>
          <IconButton label="Fit" onClick={() => centerAt(Math.min(1, usableWidth / naturalWidth, usableHeight / naturalHeight))}>
            <Maximize size={15} aria-hidden="true" />
          </IconButton>
          <IconButton label="Reset view" onClick={() => { setPanMode(false); centerAt(null); }}>
            <LocateFixed size={15} aria-hidden="true" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
