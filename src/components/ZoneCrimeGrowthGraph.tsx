import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  MapPin,
  ArrowUpRight,
  Activity,
  Navigation,
  RefreshCw,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { OFFICIAL_AREAS, IdentifierType } from '../engine/normalizer';
import { MapCluster, DailyZoneMetric } from '../engine/trustEngine';

interface ZoneCrimeGrowthGraphProps {
  selectedPincode?: string;
  onSelectZone?: (pincode: string) => void;
  onInspectTarget?: (type: IdentifierType, value: string) => void;
  onDataMutated?: () => void;
  compact?: boolean;
}

export const ZoneCrimeGrowthGraph: React.FC<ZoneCrimeGrowthGraphProps> = ({
  selectedPincode,
  onSelectZone,
  compact = false
}) => {
  const [clusters, setClusters] = useState<MapCluster[]>([]);
  const [activePincode, setActivePincode] = useState<string>(
    selectedPincode || '560102'
  );
  const [metricMode, setMetricMode] = useState<'cumulative' | 'daily'>('cumulative');
  const [loading, setLoading] = useState<boolean>(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    if (selectedPincode) {
      setActivePincode(selectedPincode);
    }
  }, [selectedPincode]);

  const fetchZoneData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/map?days=7&radius_km=3000');
      const data = await res.json();
      if (res.ok && Array.isArray(data.clusters)) {
        setClusters(data.clusters);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZoneData();
  }, []);

  const currentArea = OFFICIAL_AREAS[activePincode] || {
    pincode: activePincode,
    area: 'HSR Layout',
    city: 'Bengaluru',
    lat: 12.9116,
    lng: 77.6473
  };

  const activeCluster = useMemo(() => {
    return clusters.find((c) => c.area_pincode === activePincode) || null;
  }, [clusters, activePincode]);

  // 100% real report data from the backend trustEngine daily_series
  const dailySeries: DailyZoneMetric[] = useMemo(() => {
    if (activeCluster?.daily_series && activeCluster.daily_series.length === 7) {
      return activeCluster.daily_series;
    }

    const dayLabels = [
      'Origin (D-6)',
      'Day -5',
      'Day -4',
      'Day -3',
      'Day -2',
      'Yesterday',
      'Today (Now)'
    ];
    const now = Date.now();
    return dayLabels.map((label, i) => {
      const d = new Date(now - (6 - i) * 24 * 3600 * 1000);
      return {
        day_label: label,
        date_str: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        daily_reports: 0,
        cumulative_reports: 0,
        daily_raw_reports: 0,
        cumulative_raw_reports: 0,
        daily_blocked_reports: 0,
        cumulative_blocked_reports: 0,
        trust_score_sum: 0,
        growth_pct: 0
      };
    });
  }, [activeCluster]);

  const getVerifiedVal = (pt: DailyZoneMetric) =>
    metricMode === 'cumulative' ? pt.cumulative_reports : pt.daily_reports;

  const getRawVal = (pt: DailyZoneMetric) =>
    metricMode === 'cumulative'
      ? pt.cumulative_raw_reports ?? pt.cumulative_reports
      : pt.daily_raw_reports ?? pt.daily_reports;

  const getBlockedVal = (pt: DailyZoneMetric) =>
    metricMode === 'cumulative'
      ? pt.cumulative_blocked_reports ?? 0
      : pt.daily_blocked_reports ?? 0;

  const originVal = dailySeries.length > 0 ? getVerifiedVal(dailySeries[0]) : 0;
  const currentVal =
    dailySeries.length > 0 ? getVerifiedVal(dailySeries[dailySeries.length - 1]) : 0;
  const currentRawVal =
    dailySeries.length > 0 ? getRawVal(dailySeries[dailySeries.length - 1]) : 0;

  const totalZoneReports = activeCluster?.report_count || 0;
  const totalBlockedReports = activeCluster?.blocked_report_count || 0;
  const totalRawReports = activeCluster?.raw_report_count || totalZoneReports;

  const overallGrowthPct =
    originVal === 0
      ? currentVal > 0
        ? currentVal * 100
        : 0
      : Math.round(((currentVal - originVal) / originVal) * 100);

  // SVG coordinate calculation
  const svgWidth = 680;
  const svgHeight = compact ? 245 : 275;
  const padLeft = 52;
  const padRight = 42;
  const padTop = 38;
  const padBottom = 46;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const maxVal =
    Math.max(
      ...dailySeries.map((d) => Math.max(getVerifiedVal(d), getRawVal(d))),
      4
    ) + 2;
  const minVal = 0;

  const coords = dailySeries.map((pt, idx) => {
    const val = getVerifiedVal(pt);
    const rawVal = getRawVal(pt);
    const blockedVal = getBlockedVal(pt);
    const x = padLeft + (idx / (dailySeries.length - 1)) * plotW;
    const y =
      padTop +
      plotH -
      ((val - minVal) / Math.max(1, maxVal - minVal)) * plotH;
    const rawY =
      padTop +
      plotH -
      ((rawVal - minVal) / Math.max(1, maxVal - minVal)) * plotH;
    return { x, y, rawY, val, rawVal, blockedVal, ...pt };
  });

  const getArrowSegment = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    startOffset = 8,
    endOffset = 12
  ) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len <= startOffset + endOffset) {
      return { sx: x1, sy: y1, ex: x2, ey: y2 };
    }
    const ux = dx / len;
    const uy = dy / len;
    return {
      sx: x1 + ux * startOffset,
      sy: y1 + uy * startOffset,
      ex: x2 - ux * endOffset,
      ey: y2 - uy * endOffset
    };
  };

  const areaFillPath = useMemo(() => {
    if (coords.length === 0) return '';
    const lineParts = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
      .join(' ');
    const last = coords[coords.length - 1];
    const first = coords[0];
    return `${lineParts} L ${last.x} ${padTop + plotH} L ${first.x} ${padTop + plotH} Z`;
  }, [coords, padTop, plotH]);

  const rawAreaFillPath = useMemo(() => {
    if (coords.length === 0 || totalBlockedReports === 0) return '';
    const lineParts = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.rawY}`)
      .join(' ');
    const last = coords[coords.length - 1];
    const first = coords[0];
    return `${lineParts} L ${last.x} ${padTop + plotH} L ${first.x} ${padTop + plotH} Z`;
  }, [coords, padTop, plotH, totalBlockedReports]);

  const handleZoneChange = (pin: string) => {
    setActivePincode(pin);
    if (onSelectZone) {
      onSelectZone(pin);
    }
  };

  return (
    <div className="bg-[#0D1322]/95 border border-slate-800/90 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 text-rose-400" />
              Live Database Report Trajectory
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              Zone Origin: PIN {currentArea.pincode} ({currentArea.area}, {currentArea.city}) •{' '}
              {totalZoneReports} Verified / {totalRawReports} Raw DB Reports
            </span>
            {totalBlockedReports > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[11px] font-mono font-extrabold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                {totalBlockedReports} Fake Reports Blocked (0.0 Trust)
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1 flex flex-wrap items-center gap-2">
            <span>Reported Crime Rate Growth in Zone Origin</span>
            <span
              className={`text-xs font-mono px-2.5 py-0.5 rounded-lg border font-extrabold inline-flex items-center gap-1 ${
                overallGrowthPct > 0
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {overallGrowthPct >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
              )}
              {overallGrowthPct >= 0 ? `+${overallGrowthPct}%` : `${overallGrowthPct}%`} ({originVal} → {currentVal} verified)
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Plots real reports from the Trust Engine for PIN {currentArea.pincode}.
          </p>
        </div>

        {/* Controls: Metric Toggle + Zone Origin Picker */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#070B14] border border-slate-800 rounded-xl p-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setMetricMode('cumulative')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                metricMode === 'cumulative'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cumulative Growth
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('daily')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                metricMode === 'daily'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Daily New Reports
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-[#070B14] border border-slate-800 rounded-xl px-3 py-2">
            <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={activePincode}
              onChange={(e) => handleZoneChange(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-slate-200 focus:outline-none cursor-pointer"
            >
              {Object.values(OFFICIAL_AREAS).map((area) => {
                const cl = clusters.find((c) => c.area_pincode === area.pincode);
                const count = cl ? cl.report_count : 0;
                const blocked = cl ? cl.blocked_report_count : 0;
                return (
                  <option
                    key={area.pincode}
                    value={area.pincode}
                    className="bg-slate-900 text-slate-100"
                  >
                    PIN {area.pincode} — {area.area} ({count} verified{blocked > 0 ? `, ${blocked} blocked` : ''})
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            onClick={fetchZoneData}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Refresh Live Database Counts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SVG Point-Arrow Graph */}
      <div className="relative w-full bg-[#070B14]/90 border border-slate-800/80 rounded-xl p-3 overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none"
        >
          <defs>
            <linearGradient id="crimeGrowthAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.28" />
              <stop offset="65%" stopColor="#f59e0b" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#070B14" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="rawAttackAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#070B14" stopOpacity="0.0" />
            </linearGradient>

            <marker
              id="arrowUpRed"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#fb7185" />
            </marker>

            <marker
              id="arrowFlatAmber"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#fbbf24" />
            </marker>

            <marker
              id="arrowDownGreen"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#34d399" />
            </marker>

            <marker
              id="arrowRawAttackPurple"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#c084fc" />
            </marker>

            <marker
              id="arrowOriginVector"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Horizontal Y-Axis Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padTop + plotH - ratio * plotH;
            const labelVal = Math.round(minVal + ratio * (maxVal - minVal));
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray={idx === 0 ? undefined : '4 4'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Shaded Area for Blocked Raw Attack Spike (if any blocked reports exist) */}
          {totalBlockedReports > 0 && (
            <path d={rawAreaFillPath} fill="url(#rawAttackAreaGrad)" />
          )}

          {/* Shaded Area Under Verified Point-Arrow Curve */}
          <path d={areaFillPath} fill="url(#crimeGrowthAreaGrad)" />

          {/* Dashed Purple Point-Arrow Trajectory for Raw Unfiltered Attack Volume */}
          {totalBlockedReports > 0 &&
            coords.map((pt, i) => {
              if (i === coords.length - 1) return null;
              const next = coords[i + 1];
              if (pt.rawVal === pt.val && next.rawVal === next.val) return null;
              const seg = getArrowSegment(pt.x, pt.rawY, next.x, next.rawY, 8, 12);
              const rawDiff = next.rawVal - pt.rawVal;
              const midX = (pt.x + next.x) / 2;
              const midY = (pt.rawY + next.rawY) / 2;
              return (
                <g key={`raw-arrow-${i}`}>
                  <line
                    x1={seg.sx}
                    y1={seg.sy}
                    x2={seg.ex}
                    y2={seg.ey}
                    stroke="#c084fc"
                    strokeWidth="2.2"
                    strokeDasharray="5 3"
                    markerEnd="url(#arrowRawAttackPurple)"
                  />
                  <text
                    x={midX - 8}
                    y={midY - 8}
                    textAnchor="middle"
                    fill="#d8b4fe"
                    fontSize="9"
                    fontWeight="800"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    +{rawDiff} raw ({next.blockedVal} blocked)
                  </text>
                </g>
              );
            })}

          {/* Dashed Direct Zone Origin -> Today Net Growth Vector Arrow */}
          {coords.length >= 2 && totalZoneReports > 0 && (
            <g>
              {(() => {
                const first = coords[0];
                const last = coords[coords.length - 1];
                const vec = getArrowSegment(first.x, first.y, last.x, last.y, 12, 16);
                const midX = (first.x + last.x) / 2;
                const midY = (first.y + last.y) / 2 - 14;
                return (
                  <>
                    <line
                      x1={vec.sx}
                      y1={vec.sy}
                      x2={vec.ex}
                      y2={vec.ey}
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeDasharray="5 4"
                      strokeOpacity="0.65"
                      markerEnd="url(#arrowOriginVector)"
                    />
                    <rect
                      x={midX - 88}
                      y={midY - 11}
                      width="176"
                      height="17"
                      rx="5"
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth="0.8"
                      strokeOpacity="0.75"
                    />
                    <text
                      x={midX}
                      y={midY + 1}
                      textAnchor="middle"
                      fill="#38bdf8"
                      fontSize="9.5"
                      fontWeight="700"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      Verified: {originVal} → {currentVal} ({overallGrowthPct >= 0 ? `+${overallGrowthPct}%` : `${overallGrowthPct}%`})
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* Step-by-Step Verified Point-to-Point Directional Arrows */}
          {coords.map((pt, i) => {
            if (i === coords.length - 1) return null;
            const next = coords[i + 1];
            const diff = next.val - pt.val;
            const seg = getArrowSegment(pt.x, pt.y, next.x, next.y, 9, 13);
            const midX = (pt.x + next.x) / 2;
            const midY = (pt.y + next.y) / 2;

            const strokeColor =
              diff > 0 ? '#fb7185' : diff === 0 ? '#fbbf24' : '#34d399';
            const markerId =
              diff > 0
                ? 'url(#arrowUpRed)'
                : diff === 0
                ? 'url(#arrowFlatAmber)'
                : 'url(#arrowDownGreen)';

            return (
              <g key={`arrow-seg-${i}`}>
                <line
                  x1={seg.sx}
                  y1={seg.sy}
                  x2={seg.ex}
                  y2={seg.ey}
                  stroke={strokeColor}
                  strokeWidth="2.6"
                  markerEnd={markerId}
                />
                {diff !== 0 && (
                  <text
                    x={midX}
                    y={midY - 7}
                    textAnchor="middle"
                    fill={diff > 0 ? '#fda4af' : '#6ee7b7'}
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {diff > 0 ? `+${diff} rep` : `${diff} rep`}
                  </text>
                )}
              </g>
            );
          })}

          {/* Raw Blocked Attack Nodes (Purple Nodes when blockedVal > 0) */}
          {totalBlockedReports > 0 &&
            coords.map((pt, i) => {
              if (pt.rawVal <= pt.val) return null;
              return (
                <g key={`raw-node-${i}`}>
                  {/* Vertical Shield Drop Line showing the collapse from Raw to Verified */}
                  <line
                    x1={pt.x}
                    y1={pt.rawY + 7}
                    x2={pt.x}
                    y2={pt.y - 9}
                    stroke="#a855f7"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.rawY}
                    r={11}
                    fill="#a855f7"
                    fillOpacity={0.22}
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.rawY}
                    r={6}
                    fill="#070B14"
                    stroke="#c084fc"
                    strokeWidth="2.5"
                  />
                  <text
                    x={pt.x - 10}
                    y={pt.rawY - 12}
                    textAnchor="end"
                    fill="#e9d5ff"
                    fontSize="9.5"
                    fontWeight="800"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {pt.rawVal} raw ({pt.blockedVal} blocked)
                  </text>
                </g>
              );
            })}

          {/* Verified Data Points (Nodes) */}
          {coords.map((pt, i) => {
            const isOrigin = i === 0;
            const isLatest = i === coords.length - 1;
            const isHovered = hoveredIdx === i;
            const nodeColor = isOrigin
              ? '#38bdf8'
              : isLatest
              ? '#f43f5e'
              : '#f59e0b';

            return (
              <g
                key={`node-${i}`}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isOrigin || isLatest || isHovered ? 12 : 8}
                  fill={nodeColor}
                  fillOpacity={isHovered ? 0.35 : 0.18}
                />

                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isOrigin || isLatest ? 6.5 : 5}
                  fill="#070B14"
                  stroke={nodeColor}
                  strokeWidth="2.8"
                />

                <circle cx={pt.x} cy={pt.y} r={2.3} fill="#ffffff" />

                <text
                  x={pt.x}
                  y={pt.y - 14}
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize="10.5"
                  fontWeight="800"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {pt.val}
                </text>

                <text
                  x={pt.x}
                  y={padTop + plotH + 18}
                  textAnchor="middle"
                  fill={isOrigin ? '#38bdf8' : isLatest ? '#fb7185' : '#94a3b8'}
                  fontSize="10"
                  fontWeight={isOrigin || isLatest ? '800' : '600'}
                >
                  {pt.day_label}
                </text>
                <text
                  x={pt.x}
                  y={padTop + plotH + 31}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {pt.date_str}
                </text>
              </g>
            );
          })}
        </svg>

        {totalZoneReports === 0 && totalBlockedReports === 0 && !loading && (
          <div className="mt-2 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>
              0 reports in database for PIN {activePincode}. Select an active zone below or file a scam report to update live.
            </span>
          </div>
        )}

        {/* Legend & Zone Origin Telemetry Footer */}
        <div className="mt-2 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
              Origin Day: {originVal} verified
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
              Today Verified: {currentVal} report(s)
            </span>
            {totalBlockedReports > 0 && (
              <span className="flex items-center gap-1.5 text-purple-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
                Raw Attack Spike: {currentRawVal} total ({totalBlockedReports} blocked at 0.0 trust)
              </span>
            )}
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Dominant Vector:{' '}
              <strong className="text-slate-200 uppercase font-mono">
                {activeCluster?.top_scam_type || 'NONE'}
              </strong>
            </span>
          </div>

          {/* Quick Zone Origin Switcher Pills showing real DB report counts */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold mr-1">Active DB Origins:</span>
            {clusters.slice(0, 5).map((cl) => (
              <button
                key={cl.area_pincode}
                type="button"
                onClick={() => handleZoneChange(cl.area_pincode)}
                className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border transition-all cursor-pointer ${
                  cl.area_pincode === activePincode
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {cl.area_name} ({cl.report_count} verified
                {cl.blocked_report_count > 0 ? ` / ${cl.blocked_report_count} blocked` : ''})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
