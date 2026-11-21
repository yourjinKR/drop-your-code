import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadLanguage } from '../../src/editor/languages';
import { useLanguageChange } from '../../src/editor/useLanguageChange';

vi.mock('../../src/editor/languages', () => ({ loadLanguage: vi.fn() }));

const mockLoad = vi.mocked(loadLanguage);

function delayLanguageLoad() {
  let resolve!: (value: null) => void;
  const pending = new Promise<null>((finish) => { resolve = finish; });
  mockLoad.mockReturnValueOnce(pending);
  return () => resolve(null);
}

describe('shared language changes', () => {
  beforeEach(() => mockLoad.mockReset());

  it('cancels a pending choice when the applied language is selected', async () => {
    const finish = delayLanguageLoad();
    const onApplied = vi.fn();
    const { result } = renderHook(() => useLanguageChange('plaintext', onApplied));

    act(() => result.current.chooseLanguage('java'));
    expect(result.current.request).toEqual({ id: 'java', status: 'loading' });
    act(() => result.current.chooseLanguage('plaintext'));
    await act(async () => { finish(); });

    expect(result.current.request).toBeNull();
    expect(onApplied).not.toHaveBeenCalled();
    expect(mockLoad.mock.calls).toEqual([['java']]);
  });

  it('discards a language that resolves after unmount', async () => {
    const finish = delayLanguageLoad();
    const onApplied = vi.fn();
    const { result, unmount } = renderHook(() => useLanguageChange('plaintext', onApplied));

    act(() => result.current.chooseLanguage('java'));
    unmount();
    await act(async () => { finish(); });

    expect(onApplied).not.toHaveBeenCalled();
  });
});
