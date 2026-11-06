import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('app foundation', () => {
  it('mounts a named workspace with a keyboard entry point and settings region', () => {
    render(<App />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Drop Your Code' })).toBeVisible();
    const workspace = screen.getByRole('main', { name: '작업 공간' });
    expect(workspace).toHaveAttribute('id', 'workspace');
    expect(workspace).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('complementary', { name: '설정' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '작업 공간으로 건너뛰기' })).toHaveAttribute(
      'href',
      '#workspace',
    );
    expect(
      screen.queryByRole('button', { name: /복사|내보내기|히스토리|copy|export|history/i }),
    ).not.toBeInTheDocument();
  });
});
