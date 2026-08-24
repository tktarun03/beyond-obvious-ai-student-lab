import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (ids: {
    inputId: string;
    describedBy: string | undefined;
    invalid: boolean;
  }) => ReactNode;
}

/**
 * The accessibility contract for every input in this repository:
 *
 *   • a real <label for>, never a placeholder standing in for one — a
 *     placeholder disappears the moment the user types, taking the only
 *     description of the field with it;
 *   • aria-describedby wires the hint AND the error to the input, so a screen
 *     reader reads "CPF, edit text, invalid entry, two digits missing" rather
 *     than leaving the error stranded visually beside the box;
 *   • aria-invalid so assistive technology knows the state, not just the colour;
 *   • the error text says what is wrong and what to do.
 */
function FieldShell({ label, hint, error, required, children }: FieldShellProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx('lab-field', error && 'lab-field--invalid')}>
      <label className="lab-field__label" htmlFor={inputId}>
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: 'var(--lab-caution)' }}>
            {' '}
            *
          </span>
        )}
      </label>
      {children({ inputId, describedBy, invalid: Boolean(error) })}
      {hint && (
        <span className="lab-field__hint" id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className="lab-field__error" id={errorId}>
          {error}
        </span>
      )}
    </div>
  );
}

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({ label, hint, error, required, ...rest }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      {({ inputId, describedBy, invalid }) => (
        <input
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

export interface TextAreaFieldProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'id'
> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextAreaField({ label, hint, error, required, ...rest }: TextAreaFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      {({ inputId, describedBy, invalid }) => (
        <textarea
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          rows={4}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

export interface SelectFieldProps {
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  name?: string;
  disabled?: boolean;
}

export function SelectField({
  label,
  hint,
  error,
  value,
  onChange,
  options,
  name,
  disabled,
}: SelectFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ inputId, describedBy, invalid }) => (
        <select
          id={inputId}
          name={name}
          value={value}
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}
