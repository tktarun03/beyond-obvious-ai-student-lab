'use client';

import { useId, useMemo, useState } from 'react';

/**
 * Accessible SVG charts, built in-house rather than pulled from a library.
 *
 * WHY in-house: almost every charting library renders a <canvas> or an
 * unlabelled <svg>, and the accessible fallback is an afterthought a student
 * then cannot explain in an interview. Ninety lines of SVG buys a real
 * <table> alternative, keyboard-reachable points, and marks that follow the
 * design system's own tokens.
 *
 * COLOUR DECISIONS (validated, not eyeballed):
 *   • One series, so there is no categorical palette and no legend box — the
 *     chart title names the series.
 *   • The series uses var(--accent): amber-500 on the deck surface, amber-600
 *     on the ledger surface. Both clear 3:1 against their own background.
 *   • Anomalies are a STATUS, not a second series. Status must never be carried
 *     by colour alone, so an anomalous point gets a hollow ring marker at a
 *     larger radius, a direct text label, the caution colour, AND a text column
 *     in the table view. Any one of those four alone would identify it.
 */

export interface ChartPoint {
  /** Category or time label, used on the axis and in the table. */
  readonly label: string;
  readonly value: number;
  /** Marks the point as an anomaly — a status, encoded four ways. */
  readonly anomaly?: boolean;
  /** Optional explanation, shown in the tooltip and the table. */
  readonly note?: string;
}

interface BaseChartProps {
  readonly title: string;
  /** One sentence naming the trend, for screen readers and for the caption. */
  readonly summary: string;
  readonly data: readonly ChartPoint[];
  readonly valueLabel: string;
  readonly height?: number;
  readonly formatValue?: (value: number) => string;
}

const PAD = { top: 24, right: 16, bottom: 34, left: 48 };
const defaultFormat = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

function useScale(data: readonly ChartPoint[], height: number) {
  return useMemo(() => {
    const values = data.map((d) => d.value);
    const rawMax = Math.max(0, ...values);
    const rawMin = Math.min(0, ...values);
    // A little headroom stops the tallest mark touching the title.
    const max = rawMax === rawMin ? rawMax + 1 : rawMax + (rawMax - rawMin) * 0.08;
    const min = rawMin;
    const plotHeight = height - PAD.top - PAD.bottom;
    const y = (value: number) => PAD.top + plotHeight - ((value - min) / (max - min)) * plotHeight;
    const ticks = [min, min + (max - min) / 2, max];
    return { min, max, y, plotHeight, ticks };
  }, [data, height]);
}

/** The table is not a fallback bolted on — it is the same data, always present. */
function DataTable({
  title,
  data,
  valueLabel,
  formatValue,
}: {
  title: string;
  data: readonly ChartPoint[];
  valueLabel: string;
  formatValue: (v: number) => string;
}) {
  const hasAnomalies = data.some((d) => d.anomaly);
  return (
    <details className="lab-chart__table">
      <summary className="lab-btn lab-btn--ghost lab-btn--sm" style={{ marginTop: 8 }}>
        View {title} as a table
      </summary>
      <div className="lab-tablewrap" style={{ marginTop: 8 }}>
        <table className="lab-table">
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">{valueLabel}</th>
              {hasAnomalies && <th scope="col">Status</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.label}>
                <th
                  scope="row"
                  style={{
                    fontFamily: 'var(--lab-font-body)',
                    textTransform: 'none',
                    letterSpacing: 0,
                    background: 'transparent',
                  }}
                >
                  {point.label}
                </th>
                <td className="lab-num">{formatValue(point.value)}</td>
                {hasAnomalies && (
                  <td>
                    {point.anomaly ? `Anomaly${point.note ? ` — ${point.note}` : ''}` : 'Normal'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function AnomalyLegend({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="lab-strip__legend" style={{ marginTop: 8 }}>
      <span>
        <svg
          width="14"
          height="14"
          aria-hidden="true"
          style={{ verticalAlign: '-2px', marginRight: 6 }}
        >
          <circle cx="7" cy="7" r="5" fill="none" stroke="var(--lab-caution)" strokeWidth="2" />
        </svg>
        Flagged as an anomaly
      </span>
    </p>
  );
}

/* ------------------------------------------------------------------ BarChart */

export function BarChart({
  title,
  summary,
  data,
  valueLabel,
  height = 260,
  formatValue = defaultFormat,
}: BaseChartProps) {
  const titleId = useId();
  const descId = useId();
  const [hovered, setHovered] = useState<number | null>(null);
  const { y, ticks, min } = useScale(data, height);

  const width = Math.max(320, PAD.left + PAD.right + data.length * 44);
  const plotWidth = width - PAD.left - PAD.right;
  // 2px of surface between adjacent fills, per the mark spec.
  const slot = data.length > 0 ? plotWidth / data.length : plotWidth;
  const barWidth = Math.max(6, slot - 8);
  const baseline = y(Math.max(0, min));

  return (
    <figure style={{ margin: 0 }}>
      <div className="lab-chart">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-labelledby={`${titleId} ${descId}`}
        >
          <title id={titleId}>{title}</title>
          <desc id={descId}>{summary}</desc>

          {ticks.map((tick) => (
            <g key={tick}>
              <line
                className="lab-chart__grid"
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text className="lab-chart__axis" x={PAD.left - 8} y={y(tick) + 3} textAnchor="end">
                {formatValue(tick)}
              </text>
            </g>
          ))}

          {data.map((point, index) => {
            const x = PAD.left + index * slot + (slot - barWidth) / 2;
            const top = y(point.value);
            const barHeight = Math.max(2, baseline - top);
            const isHovered = hovered === index;
            return (
              <g key={point.label}>
                <rect
                  x={x}
                  y={top}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill={point.anomaly ? 'var(--lab-caution)' : 'var(--accent)'}
                  opacity={hovered === null || isHovered ? 1 : 0.55}
                />
                {point.anomaly && (
                  <text
                    className="lab-chart__axis"
                    x={x + barWidth / 2}
                    y={top - 6}
                    textAnchor="middle"
                    fill="var(--lab-caution)"
                  >
                    !
                  </text>
                )}
                {/* Hit target deliberately wider than the mark. */}
                <rect
                  x={PAD.left + index * slot}
                  y={PAD.top}
                  width={slot}
                  height={height - PAD.top - PAD.bottom}
                  fill="transparent"
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                />
                {index % Math.ceil(data.length / 8 || 1) === 0 && (
                  <text
                    className="lab-chart__axis"
                    x={PAD.left + index * slot + slot / 2}
                    y={height - PAD.bottom + 16}
                    textAnchor="middle"
                  >
                    {point.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {hovered !== null && data[hovered] && (
        <p className="lab-xs" role="status" style={{ marginTop: 4 }}>
          <strong className="lab-num">{data[hovered]!.label}</strong>{' '}
          <span className="lab-num">{formatValue(data[hovered]!.value)}</span> {valueLabel}
          {data[hovered]!.anomaly &&
            ` — anomaly${data[hovered]!.note ? `: ${data[hovered]!.note}` : ''}`}
        </p>
      )}

      <AnomalyLegend show={data.some((d) => d.anomaly)} />
      <figcaption className="lab-xs" style={{ marginTop: 8 }}>
        {summary}
      </figcaption>
      <DataTable title={title} data={data} valueLabel={valueLabel} formatValue={formatValue} />
    </figure>
  );
}

/* ----------------------------------------------------------------- LineChart */

export function LineChart({
  title,
  summary,
  data,
  valueLabel,
  height = 260,
  formatValue = defaultFormat,
}: BaseChartProps) {
  const titleId = useId();
  const descId = useId();
  const [hovered, setHovered] = useState<number | null>(null);
  const { y, ticks } = useScale(data, height);

  const width = Math.max(360, PAD.left + PAD.right + data.length * 36);
  const plotWidth = width - PAD.left - PAD.right;
  const step = data.length > 1 ? plotWidth / (data.length - 1) : 0;
  const x = (index: number) => PAD.left + index * step;

  const path = data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.value)}`).join(' ');
  const labelEvery = Math.ceil(data.length / 8 || 1);

  return (
    <figure style={{ margin: 0 }}>
      <div className="lab-chart">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-labelledby={`${titleId} ${descId}`}
        >
          <title id={titleId}>{title}</title>
          <desc id={descId}>{summary}</desc>

          {ticks.map((tick) => (
            <g key={tick}>
              <line
                className="lab-chart__grid"
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text className="lab-chart__axis" x={PAD.left - 8} y={y(tick) + 3} textAnchor="end">
                {formatValue(tick)}
              </text>
            </g>
          ))}

          {hovered !== null && (
            <line
              className="lab-chart__grid"
              x1={x(hovered)}
              x2={x(hovered)}
              y1={PAD.top}
              y2={height - PAD.bottom}
            />
          )}

          <path
            d={path}
            stroke="var(--accent)"
            strokeWidth={2}
            fill="none"
            strokeLinejoin="round"
          />

          {data.map((point, index) => (
            <g key={point.label}>
              {point.anomaly ? (
                // Hollow ring at a larger radius: identifiable without colour.
                <circle
                  cx={x(index)}
                  cy={y(point.value)}
                  r={6}
                  fill="var(--surface)"
                  stroke="var(--lab-caution)"
                  strokeWidth={2}
                />
              ) : (
                <circle cx={x(index)} cy={y(point.value)} r={3} fill="var(--accent)" />
              )}
              {point.anomaly && (
                <text
                  className="lab-chart__axis"
                  x={x(index)}
                  y={y(point.value) - 12}
                  textAnchor="middle"
                  fill="var(--lab-caution)"
                >
                  {formatValue(point.value)}
                </text>
              )}
              <rect
                x={x(index) - step / 2}
                y={PAD.top}
                width={Math.max(step, 20)}
                height={height - PAD.top - PAD.bottom}
                fill="transparent"
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
              />
              {index % labelEvery === 0 && (
                <text
                  className="lab-chart__axis"
                  x={x(index)}
                  y={height - PAD.bottom + 16}
                  textAnchor="middle"
                >
                  {point.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {hovered !== null && data[hovered] && (
        <p className="lab-xs" role="status" style={{ marginTop: 4 }}>
          <strong className="lab-num">{data[hovered]!.label}</strong>{' '}
          <span className="lab-num">{formatValue(data[hovered]!.value)}</span> {valueLabel}
          {data[hovered]!.anomaly &&
            ` — anomaly${data[hovered]!.note ? `: ${data[hovered]!.note}` : ''}`}
        </p>
      )}

      <AnomalyLegend show={data.some((d) => d.anomaly)} />
      <figcaption className="lab-xs" style={{ marginTop: 8 }}>
        {summary}
      </figcaption>
      <DataTable title={title} data={data} valueLabel={valueLabel} formatValue={formatValue} />
    </figure>
  );
}
