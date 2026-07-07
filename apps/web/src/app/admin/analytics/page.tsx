'use client';

import { useState, useRef, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart2 } from 'lucide-react';
import { useAnalyticsOverview, type AnalyticsPeriod } from '@/hooks/use-analytics';
import { formatPrice } from '@/lib/utils';

// ─── Design tokens (dataviz palette) ──────────────────────────────────────────
// Primary series: emerald (brand primary, used for single-series charts)
// Text roles: secondary #52514e, muted/axis #898781
// Grid hairlines: #e1e0d9 (1px solid)
// Categorical for multi-series: #2a78d6, #1baf7a, #eda100, #4a3aa7
const CAT = ['#2a78d6', '#1baf7a', '#eda100', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834', '#008300'];
const MUTED_INK = '#898781';
const SEC_INK = '#52514e';
const GRID = '#e1e0d9';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string, period: AnalyticsPeriod) {
  const d = new Date(iso + 'T12:00:00Z');
  if (period === '1y') return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  if (period === '90d') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtMoney(v: number) {
  if (v >= 1_000_000) return `৳${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `৳${(v / 1_000).toFixed(1)}K`;
  return `৳${v.toFixed(0)}`;
}

function fmtCount(v: number) {
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

function niceTicks(max: number, n = 5): number[] {
  if (max === 0) return [0];
  const raw = max / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const nice = Math.ceil(raw / mag) * mag;
  return Array.from({ length: n + 1 }, (_, i) => i * nice);
}

// ─── SVG line chart (single series, crosshair+tooltip) ────────────────────────
const W = 640, PAD = { t: 16, r: 16, b: 28, l: 60 };

function LineChart({
  data, yKey, color = '#10b981', formatY = fmtMoney, period,
}: {
  data: Record<string, number | string>[];
  yKey: string;
  color?: string;
  formatY?: (v: number) => string;
  period: AnalyticsPeriod;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<{ xi: number; px: number; py: number } | null>(null);

  const vals = data.map((d) => d[yKey] as number);
  const rawMax = Math.max(...vals, 1);
  const ticks = niceTicks(rawMax);
  const maxTick = ticks[ticks.length - 1];
  const H = 200;
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;

  const px = (i: number) => PAD.l + (data.length < 2 ? iW / 2 : (i / (data.length - 1)) * iW);
  const py = (v: number) => PAD.t + iH - (v / maxTick) * iH;

  const pts = data.map((d, i) => ({ x: px(i), y: py(d[yKey] as number) }));
  const linePts = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const areaD =
    data.length < 2
      ? ''
      : `M${PAD.l},${PAD.t + iH} ` +
        pts.map((p) => `L${p.x},${p.y}`).join(' ') +
        ` L${PAD.l + iW},${PAD.t + iH} Z`;

  const onMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || data.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * W;
      let near = 0;
      let best = Infinity;
      pts.forEach((p, i) => {
        const d = Math.abs(p.x - mx);
        if (d < best) { best = d; near = i; }
      });
      setTip({ xi: near, px: pts[near].x, py: pts[near].y });
    },
    [pts, data.length],
  );

  const tipVal = tip != null ? (data[tip.xi][yKey] as number) : 0;
  const tipDate = tip != null ? fmtDate(data[tip.xi].date as string, period) : '';

  // Sparse x-axis labels
  const xLabelStep = Math.max(1, Math.ceil(data.length / 6));

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No data for this period
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full select-none"
      onMouseMove={onMove}
      onMouseLeave={() => setTip(null)}
    >
      {/* Horizontal gridlines + y-axis labels */}
      {ticks.map((v) => (
        <g key={v}>
          <line x1={PAD.l} y1={py(v)} x2={PAD.l + iW} y2={py(v)} stroke={GRID} strokeWidth={1} />
          <text x={PAD.l - 6} y={py(v) + 4} textAnchor="end" fontSize={10} fill={MUTED_INK}
            style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatY(v)}
          </text>
        </g>
      ))}

      {/* Area fill — 10% opacity */}
      {areaD && <path d={areaD} fill={color} fillOpacity={0.1} />}

      {/* 2px line, round join/cap */}
      <polyline
        points={linePts} fill="none" stroke={color}
        strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
      />

      {/* X-axis sparse labels */}
      {data.map((d, i) => {
        if (i % xLabelStep !== 0 && i !== data.length - 1) return null;
        return (
          <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fontSize={10} fill={MUTED_INK}>
            {fmtDate(d.date as string, period)}
          </text>
        );
      })}

      {/* Crosshair + dot + tooltip */}
      {tip && (
        <>
          <line
            x1={tip.px} y1={PAD.t} x2={tip.px} y2={PAD.t + iH}
            stroke={MUTED_INK} strokeWidth={1} strokeDasharray="3 3"
          />
          {/* End-dot: 8px diameter (r=4), 2px surface ring */}
          <circle cx={tip.px} cy={tip.py} r={6} fill="white" stroke="none" />
          <circle cx={tip.px} cy={tip.py} r={4} fill={color} />

          {/* Tooltip: position left of cursor when near right edge */}
          {(() => {
            const right = tip.px + 8 + 110 > W;
            const tx = right ? tip.px - 118 : tip.px + 8;
            const ty = Math.max(PAD.t, tip.py - 28);
            return (
              <g>
                <rect x={tx} y={ty} width={110} height={44} rx={6}
                  fill="white" stroke={GRID} strokeWidth={1}
                  style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.10))' }} />
                <text x={tx + 8} y={ty + 16} fontSize={11} fontWeight={600} fill="#111827">
                  {formatY(tipVal)}
                </text>
                <text x={tx + 8} y={ty + 30} fontSize={10} fill={SEC_INK}>{tipDate}</text>
              </g>
            );
          })()}
        </>
      )}
    </svg>
  );
}

// ─── Horizontal bar chart (≤24px, 4px rounded data-end, square baseline) ─────
function roundedRight(x: number, y: number, w: number, h: number, r: number): string {
  const R = Math.min(r, w / 2, h / 2);
  return `M${x},${y} H${x + w - R} Q${x + w},${y} ${x + w},${y + R} V${y + h - R} Q${x + w},${y + h} ${x + w - R},${y + h} H${x} Z`;
}

function HBarChart({
  data, color = '#10b981', formatVal = fmtMoney,
}: {
  data: { name: string; value: number; sub?: string }[];
  color?: string;
  formatVal?: (v: number) => string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const max = Math.max(...data.map((d) => d.value), 1);
  const BAR_H = 20;       // ≤24px
  const GAP = 10;
  const LABEL_W = 130;
  const VAL_W = 70;
  const SVG_W = 560;
  const BAR_AREA = SVG_W - LABEL_W - VAL_W;
  const SVG_H = data.length * (BAR_H + GAP) + GAP;

  if (data.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full select-none">
      {data.map((d, i) => {
        const y = GAP + i * (BAR_H + GAP);
        const fillW = Math.max((d.value / max) * BAR_AREA, 4);
        const isHov = hovered === i;
        const fillColor = isHov ? `${color}cc` : color;

        return (
          <g key={d.name}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Name label — truncate at 18 chars */}
            <text x={0} y={y + BAR_H / 2 + 4} fontSize={11} fill={SEC_INK}>
              {d.name.length > 18 ? d.name.slice(0, 17) + '…' : d.name}
            </text>

            {/* Track (background bar) */}
            <rect x={LABEL_W} y={y} width={BAR_AREA} height={BAR_H} rx={4} fill="#f3f4f6" />

            {/* Fill bar — 4px rounded right end, square left (baseline) */}
            <path d={roundedRight(LABEL_W, y, fillW, BAR_H, 4)} fill={fillColor} />

            {/* Value at tip */}
            <text
              x={LABEL_W + BAR_AREA + 8} y={y + BAR_H / 2 + 4}
              fontSize={11} fill={SEC_INK}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatVal(d.value)}
            </text>

            {/* Hover: show sub-label inside bar if there's room */}
            {isHov && d.sub && fillW > 60 && (
              <text
                x={LABEL_W + fillW - 6} y={y + BAR_H / 2 + 4}
                textAnchor="end" fontSize={10} fill="white" fillOpacity={0.9}
              >
                {d.sub}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── KPI stat tile with signed delta ──────────────────────────────────────────
function StatTile({
  label, value, change, icon: Icon, loading,
}: {
  label: string;
  value: string;
  change: number | null;
  icon: React.ElementType;
  loading?: boolean;
}) {
  const up = change !== null && change > 0;
  const down = change !== null && change < 0;
  const DeltaIcon = up ? TrendingUp : down ? TrendingDown : Minus;
  const deltaColor = up ? 'text-emerald-600' : down ? 'text-red-600' : 'text-muted-foreground';

  return (
    <div className="rounded-xl border border-border bg-background p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>

      {loading ? (
        <div className="h-8 w-32 animate-pulse rounded bg-secondary/60" />
      ) : (
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      )}

      {change !== null && !loading && (
        <div className={`flex items-center gap-1 text-xs font-medium ${deltaColor}`}>
          <DeltaIcon className="h-3.5 w-3.5" />
          {change > 0 ? '+' : ''}{change}% vs prior period
        </div>
      )}
    </div>
  );
}

// ─── Period selector ──────────────────────────────────────────────────────────
const PERIODS: { label: string; value: AnalyticsPeriod }[] = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last year', value: '1y' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const { data, isLoading, isFetching } = useAnalyticsOverview(period);

  const opacity = isFetching && !isLoading ? 'opacity-60 transition-opacity' : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BarChart2 className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">Store performance at a glance</p>
          </div>
        </div>

        {/* Period filter — one row above all charts, scopes everything */}
        <div className="flex rounded-lg border border-border bg-background overflow-hidden">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                period === value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI stat tiles */}
      <div className={`grid grid-cols-2 gap-4 lg:grid-cols-4 ${opacity}`}>
        <StatTile
          label="Revenue"
          value={formatPrice(data?.kpis.revenue ?? 0)}
          change={data?.kpis.revenueChange ?? null}
          icon={TrendingUp}
          loading={isLoading}
        />
        <StatTile
          label="Orders"
          value={String(data?.kpis.orders ?? 0)}
          change={data?.kpis.ordersChange ?? null}
          icon={TrendingUp}
          loading={isLoading}
        />
        <StatTile
          label="Avg. Order Value"
          value={formatPrice(data?.kpis.aov ?? 0)}
          change={data?.kpis.aovChange ?? null}
          icon={TrendingUp}
          loading={isLoading}
        />
        <StatTile
          label="New Customers"
          value={String(data?.kpis.newCustomers ?? 0)}
          change={data?.kpis.newCustomersChange ?? null}
          icon={TrendingUp}
          loading={isLoading}
        />
      </div>

      {/* Revenue trend (full-width line chart) */}
      <div className={`rounded-xl border border-border bg-background p-5 ${opacity}`}>
        <h2 className="text-sm font-semibold mb-4">Revenue Trend</h2>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-lg bg-secondary/50" />
        ) : (
          <LineChart
            data={data?.revenueTrend ?? []}
            yKey="revenue"
            color="#10b981"
            formatY={fmtMoney}
            period={period}
          />
        )}
      </div>

      {/* Top Products + Category Revenue */}
      <div className={`grid gap-4 lg:grid-cols-2 ${opacity}`}>
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Top Products by Revenue</h2>
            <span className="text-xs text-muted-foreground">Top 8</span>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-secondary/50" />
              ))}
            </div>
          ) : (
            <HBarChart
              data={(data?.topProducts ?? []).map((p) => ({
                name: p.name,
                value: p.revenue,
                sub: `${p.quantity} sold`,
              }))}
              color="#2a78d6"
              formatVal={fmtMoney}
            />
          )}
        </div>

        <div className="rounded-xl border border-border bg-background p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Revenue by Category</h2>
            <span className="text-xs text-muted-foreground">Top 8</span>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-secondary/50" />
              ))}
            </div>
          ) : (
            <HBarChart
              data={(data?.categoryRevenue ?? []).map((c) => ({
                name: c.name,
                value: c.revenue,
              }))}
              color="#1baf7a"
              formatVal={fmtMoney}
            />
          )}
        </div>
      </div>

      {/* Customer trend + Orders by status */}
      <div className={`grid gap-4 lg:grid-cols-2 ${opacity}`}>
        <div className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-sm font-semibold mb-4">New Customer Acquisition</h2>
          {isLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-secondary/50" />
          ) : (
            <LineChart
              data={data?.customerTrend ?? []}
              yKey="count"
              color="#4a3aa7"
              formatY={fmtCount}
              period={period}
            />
          )}
        </div>

        <div className="rounded-xl border border-border bg-background p-5">
          <h2 className="text-sm font-semibold mb-4">Orders by Status</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-secondary/50" />
              ))}
            </div>
          ) : (
            <HBarChart
              data={(data?.ordersByStatus ?? []).map((s) => ({
                name: s.status,
                value: s.count,
              }))}
              color="#eda100"
              formatVal={fmtCount}
            />
          )}
        </div>
      </div>

      {/* Payment method mix */}
      {((data?.paymentMix.length ?? 0) > 0 || isLoading) && (
        <div className={`rounded-xl border border-border bg-background p-5 ${opacity}`}>
          <h2 className="text-sm font-semibold mb-4">Payment Method Mix</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-secondary/50" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Bar chart by order count */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">By order count</p>
                <HBarChart
                  data={(data?.paymentMix ?? []).map((p) => ({
                    name: p.method,
                    value: p.count,
                    sub: `${p.count} orders`,
                  }))}
                  color={CAT[0]}
                  formatVal={fmtCount}
                />
              </div>
              {/* Bar chart by revenue */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">By revenue</p>
                <HBarChart
                  data={(data?.paymentMix ?? []).map((p) => ({
                    name: p.method,
                    value: p.revenue,
                  }))}
                  color={CAT[1]}
                  formatVal={fmtMoney}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table view — all values accessible without hover (accessibility requirement) */}
      {data && (
        <details className="rounded-xl border border-border bg-background p-5">
          <summary className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground">
            Raw data table
          </summary>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border">
                <tr>
                  <th className="py-2 pr-4 text-left font-medium text-muted-foreground">Date</th>
                  <th className="py-2 pr-4 text-right font-medium text-muted-foreground">Revenue</th>
                  <th className="py-2 text-right font-medium text-muted-foreground">New Customers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.revenueTrend.map((r, i) => (
                  <tr key={r.date}>
                    <td className="py-1.5 pr-4 text-muted-foreground">{fmtDate(r.date, period)}</td>
                    <td className="py-1.5 pr-4 text-right tabular-nums">{fmtMoney(r.revenue)}</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {data.customerTrend[i]?.count ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
