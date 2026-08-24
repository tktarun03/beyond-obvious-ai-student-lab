import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ Button */

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  /**
   * Renders a busy state. The label stays visible and aria-busy is set, so a
   * screen-reader user is told the button is working rather than being handed
   * a silently disabled control.
   */
  busy?: boolean;
  busyLabel?: string;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  busy = false,
  busyLabel = 'Working…',
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cx('lab-btn', `lab-btn--${variant}`, size === 'sm' && 'lab-btn--sm', className)}
      disabled={disabled ?? busy}
      aria-busy={busy || undefined}
      {...rest}
    >
      {busy ? busyLabel : children}
    </button>
  );
}

export interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
}

export function LinkButton({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <a
      className={cx('lab-btn', `lab-btn--${variant}`, size === 'sm' && 'lab-btn--sm', className)}
      {...rest}
    >
      {children}
    </a>
  );
}

/* -------------------------------------------------------------------- Pill */

export type PillTone = 'verified' | 'caution' | 'accent' | 'info' | 'neutral';

export interface PillProps {
  tone?: PillTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Status is never carried by colour alone: the pill always contains text, and
 * the caller is expected to write text that is meaningful when read aloud.
 * "VERIFIED" is fine. A green dot on its own is not.
 */
export function Pill({ tone = 'neutral', dot = false, children, className }: PillProps) {
  return (
    <span className={cx('lab-pill', `lab-pill--${tone}`, className)}>
      {dot && <span className="lab-pill__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------- Card */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
  flush?: boolean;
}

export function Card({ accent, flush, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        'lab-card',
        accent && 'lab-card--accent',
        flush && 'lab-card--flush',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------- Callout */

export interface CalloutProps {
  tone: 'verified' | 'caution' | 'info' | 'accent';
  title: string;
  children: ReactNode;
  /**
   * role="alert" announces immediately and interrupts. Correct for a failure
   * the user must act on; wrong for ambient information, which is why it is
   * opt-in rather than the default.
   */
  live?: boolean;
}

export function Callout({ tone, title, children, live = false }: CalloutProps) {
  return (
    <div
      className={cx('lab-callout', `lab-callout--${tone}`)}
      role={live ? 'alert' : undefined}
      aria-live={live ? 'assertive' : undefined}
    >
      <p className="lab-callout__title">{title}</p>
      <div>{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------- Empty state */

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * An empty state is an invitation, not an apology. "No documents yet. Upload
 * one to ask your first question." tells the user what to do next; "No data"
 * tells them the page is broken.
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="lab-empty">
      <p className="lab-empty__title">{title}</p>
      <p>{description}</p>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ Layout */

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="lab-visually-hidden">{children}</span>;
}

export function SkipLink({ targetId = 'main' }: { targetId?: string }) {
  return (
    <a className="lab-skip" href={`#${targetId}`}>
      Skip to main content
    </a>
  );
}

export function Eyebrow({ index, children }: { index?: string; children: ReactNode }) {
  return (
    <p className="lab-eyebrow">
      {index && <i>{index}</i>}
      {children}
    </p>
  );
}

/* ---------------------------------------------------------------- Data bits */

export function DataRow({
  label,
  value,
  total = false,
}: {
  label: ReactNode;
  value: ReactNode;
  total?: boolean;
}) {
  return (
    <div className={cx('lab-drow', total && 'lab-drow--total')}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function StatTile({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="lab-stat">
      <span className="lab-stat__value">{value}</span>
      <span className="lab-stat__label">{label}</span>
    </div>
  );
}

export function Skeleton({ height = 16, width = '100%' }: { height?: number; width?: string }) {
  return (
    <span className="lab-skeleton" style={{ display: 'block', height, width }} aria-hidden="true" />
  );
}

/**
 * Loading region that announces itself once, politely.
 * A spinner with no accessible name is invisible to a screen reader; a
 * spinner with aria-live="assertive" interrupts on every keystroke. Polite
 * plus a stable label is the version that works for everyone.
 */
export function LoadingRegion({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <VisuallyHidden>{label}</VisuallyHidden>
      {children ?? (
        <div className="lab-stack" aria-hidden="true">
          <Skeleton height={14} width="70%" />
          <Skeleton height={14} width="95%" />
          <Skeleton height={14} width="45%" />
        </div>
      )}
    </div>
  );
}
