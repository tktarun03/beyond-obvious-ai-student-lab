const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

export type EvidenceCellState = 'passed' | 'failed' | 'pending';

export interface EvidenceStripProps {
  label: string;
  cells: readonly { id: string; state: EvidenceCellState; title: string }[];
  /** Shown on the right of the label, e.g. "12 / 15". Always text, never only shape. */
  summary?: string;
  legend?: readonly { swatch: string; label: string }[];
}

/**
 * The signature component, inherited from the source design system's 15-punch
 * carnet strip.
 *
 * In that system the strip answered "how many entries do I have left?" without
 * a sentence. Here it answers the question an AI product must keep answering:
 * "how much of this was actually verified?" One cell per eval case, per
 * citation checked, per extracted field confirmed.
 *
 * Accessibility rules it must keep:
 *   • the count is stated in TEXT next to the strip — the shapes are a second
 *     encoding of information that is already readable;
 *   • each cell has a title and is exposed as a list item, so a screen-reader
 *     user can walk the individual results rather than hearing "graphic";
 *   • state is carried by fill AND border style AND the accessible name, never
 *     by colour alone.
 */
export function EvidenceStrip({ label, cells, summary, legend }: EvidenceStripProps) {
  const passed = cells.filter((c) => c.state === 'passed').length;
  const text = summary ?? `${passed} / ${cells.length}`;

  return (
    <div className="lab-strip">
      <p className="lab-strip__label">
        <span>{label}</span>
        <b className="lab-num">{text}</b>
      </p>
      <ul
        className="lab-strip__cells"
        style={{ listStyle: 'none', margin: 0, padding: 0 }}
        aria-label={`${label}: ${text}`}
      >
        {cells.map((cell) => (
          <li key={cell.id}>
            <span
              className={cx(
                'lab-cell',
                cell.state === 'passed' && 'lab-cell--filled',
                cell.state === 'failed' && 'lab-cell--failed',
                cell.state === 'pending' && 'lab-cell--pending',
              )}
              title={cell.title}
              role="img"
              aria-label={`${cell.title}: ${cell.state}`}
              style={{ display: 'block' }}
            />
          </li>
        ))}
      </ul>
      {legend && (
        <p className="lab-strip__legend">
          {legend.map((item) => (
            <span key={item.label}>
              <i style={{ background: item.swatch }} aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
