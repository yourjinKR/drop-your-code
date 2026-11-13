import { useCallback, useEffect, useState } from 'react';
import type { SnapshotInput } from '../state/workspace';
import { buildSnapshotModel } from './model';
import type { SnapshotModel } from './model';

type Request = {
  input: SnapshotInput;
  attempt: number;
  status: 'ready' | 'error';
  model: SnapshotModel | null;
};

export function useSnapshotModel(input: SnapshotInput) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Request | null>(null);
  const retry = useCallback(() => setAttempt((previous) => previous + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const model = await buildSnapshotModel(input, controller.signal);
        if (!controller.signal.aborted) setResult({ input, attempt, status: 'ready', model });
      } catch {
        if (!controller.signal.aborted) {
          setResult((previous) => ({ input, attempt, status: 'error', model: previous?.model ?? null }));
        }
      }
    }, 24);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [input, attempt]);

  useEffect(() => {
    document.fonts?.addEventListener('loadingdone', retry);
    return () => document.fonts?.removeEventListener('loadingdone', retry);
  }, [retry]);

  const status = result?.input === input && result.attempt === attempt ? result.status : 'pending';
  return { model: result?.model ?? null, status, retry } as const;
}
