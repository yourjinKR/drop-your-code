import { useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

type IconButtonProps = Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-controls' | 'aria-expanded' | 'onClick'> & {
  label: string;
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
};

export function IconButton({ label, children, ref, ...props }: IconButtonProps) {
  const [dismissed, setDismissed] = useState(false);

  return (
    <span className="icon-control" onMouseLeave={() => setDismissed(false)}>
      <button
        {...props}
        type="button"
        className="icon-button"
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
