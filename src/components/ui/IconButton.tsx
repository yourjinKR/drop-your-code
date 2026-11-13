import { useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

type IconButtonProps = Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-busy' | 'aria-controls' | 'aria-disabled' |
  'aria-expanded' | 'aria-pressed' | 'className' | 'disabled' | 'onClick'> & {
  label: string;
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
};

export function IconButton({ label, children, ref, className = 'icon-button', ...props }: IconButtonProps) {
  const [dismissed, setDismissed] = useState(false);

  return (
    <span className="icon-control" onMouseLeave={() => setDismissed(false)}>
      <button
        {...props}
        type="button"
        className={className}
        ref={ref}
        aria-label={label}
        onBlur={() => setDismissed(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setDismissed(true);
        }}
      >
        {children}
      </button>
      {!dismissed && <span className="icon-tooltip" aria-hidden="true">{label}</span>}
    </span>
  );
}
