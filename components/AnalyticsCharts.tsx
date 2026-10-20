'use client';

import React, { useState, useId } from 'react';

interface DailyChartItem {
  date: string;
  scans: number;
  generated?: number;
  visits: number;
}

interface LanguageItem {
  name: string;
  value: number;
}

interface DeviceItem {
  name: string;
  value: number;
}

interface AnalyticsData {
  dailyChart: DailyChartItem[];
  languageData: LanguageItem[];
  deviceData: DeviceItem[];
  cards?: Record<string, any>;
}

interface AnalyticsChartsProps {
  analyticsData: AnalyticsData | null;
}

export default function AnalyticsCharts({ analyticsData }: AnalyticsChartsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const scanGradId = useId();
  const visitGradId = useId();

  if (!analyticsData || !analyticsData.dailyChart || analyticsData.dailyChart.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-72 w-full bg-slate-100/70 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-56 bg-slate-100/70 rounded-2xl animate-pulse" />
          <div className="h-56 bg-slate-100/70 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const { dailyChart, languageData = [], deviceData = [] } = analyticsData;

  // Compute Area Chart scaling
  const chartHeight = 220;
  const chartWidth = 700;
  const padding = { top: 20, right: 20, bottom: 35, left: 35 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxVal = Math.max(
    ...dailyChart.map((d) => Math.max(d.scans || 0, d.visits || 0)),
    10
  );

  const getX = (index: number) => {
    if (dailyChart.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (dailyChart.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return padding.top + innerHeight - (val / maxVal) * innerHeight;
  };

  // Build SVG path strings
  const scansPoints = dailyChart.map((d, i) => `${getX(i)},${getY(d.scans || 0)}`);
  const visitsPoints = dailyChart.map((d, i) => `${getX(i)},${getY(d.visits || 0)}`);

  const scansLinePath = `M ${scansPoints.join(' L ')}`;
  const scansAreaPath = `${scansLinePath} L ${getX(dailyChart.length - 1)},${padding.top + innerHeight} L ${getX(0)},${padding.top + innerHeight} Z`;

  const visitsLinePath = `M ${visitsPoints.join(' L ')}`;
  const visitsAreaPath = `${visitsLinePath} L ${getX(dailyChart.length - 1)},${padding.top + innerHeight} L ${getX(0)},${padding.top + innerHeight} Z`;

  // Language bar metrics calculation
  const totalLangScans = languageData.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const langColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

  // Device metrics calculation
  const totalDevices = deviceData.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const deviceColors: Record<string, string> = {
    mobile: '#3B82F6',
    tablet: '#10B981',
    desktop: '#F59E0B',
  };

  // Donut SVG circumference calculation
  const donutRadius = 40;
  const circumference = 2 * Math.PI * donutRadius;
  let accumulatedOffset = 0;

  const donutSegments = deviceData.map((d) => {
    const ratio = d.value / totalDevices;
    const strokeDasharray = `${ratio * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedOffset;
    accumulatedOffset += ratio * circumference;
    const color = deviceColors[d.name.toLowerCase()] || '#94A3B8';
    return {
      name: d.name,
      value: d.value,
      percentage: Math.round(ratio * 100),
      strokeDasharray,
      strokeDashoffset,
      color,
    };
  });

  const activeItem = hoveredIndex !== null && dailyChart[hoveredIndex] ? dailyChart[hoveredIndex] : null;

  return (
    <div className="space-y-4">
      {/* Main Area Chart: Reviews & Scans Over Time */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Reviews & Scans Over Time
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Daily activity tracking for selected branch</p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/40" />
              <span className="text-slate-600">Total Scans</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
              <span className="text-slate-600">Google Visits</span>
            </div>
          </div>
        </div>

        {/* SVG Responsive Area Chart */}
        <div className="relative w-full h-72">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={scanGradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id={visitGradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const yPos = padding.top + innerHeight * (1 - pct);
              const gridVal = Math.round(maxVal * pct);
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={chartWidth - padding.right}
                    y2={yPos}
                    stroke="#F1F5F9"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={yPos + 3}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {gridVal}
                  </text>
                </g>
              );
            })}

            {/* Area Fills */}
            <path d={scansAreaPath} fill={`url(#${scanGradId})`} />
            <path d={visitsAreaPath} fill={`url(#${visitGradId})`} />

            {/* Stroke Lines */}
            <path d={scansLinePath} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
            <path d={visitsLinePath} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />

            {/* Hover Guides & Points */}
            {dailyChart.map((d, i) => {
              const cx = getX(i);
              const cyScan = getY(d.scans || 0);
              const cyVisit = getY(d.visits || 0);
              const isHovered = hoveredIndex === i;

              return (
                <g key={i} className="cursor-pointer">
                  {/* Invisible hit column for smooth mouse tracking */}
                  <rect
                    x={cx - innerWidth / dailyChart.length / 2}
                    y={padding.top}
                    width={innerWidth / dailyChart.length}
                    height={innerHeight}
                    fill="transparent"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />

                  {isHovered && (
                    <>
                      <line
                        x1={cx}
                        y1={padding.top}
                        x2={cx}
                        y2={padding.top + innerHeight}
                        stroke="#94A3B8"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <circle cx={cx} cy={cyScan} r="5" fill="#3B82F6" stroke="#ffffff" strokeWidth="2" />
                      <circle cx={cx} cy={cyVisit} r="5" fill="#10B981" stroke="#ffffff" strokeWidth="2" />
                    </>
                  )}
                </g>
              );
            })}

            {/* X-Axis Date Labels */}
            {dailyChart.map((d, i) => {
              // Show label every few days to prevent clutter
              const step = Math.ceil(dailyChart.length / 7);
              if (i % step !== 0 && i !== dailyChart.length - 1) return null;
              return (
                <text
                  key={i}
                  x={getX(i)}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400 font-medium"
                >
                  {d.date}
                </text>
              );
            })}
          </svg>

          {/* Floating Tooltip Card */}
          {activeItem && hoveredIndex !== null && (
            <div
              className="absolute pointer-events-none z-20 bg-slate-900/95 text-white px-3.5 py-2.5 rounded-xl shadow-xl backdrop-blur-sm text-xs border border-slate-700 transition-all duration-75"
              style={{
                left: `${(hoveredIndex / (dailyChart.length - 1)) * 90 + 5}%`,
                top: '15px',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="font-bold text-slate-200 border-b border-slate-700/80 pb-1 mb-1.5">
                {activeItem.date}
              </div>
              <div className="flex items-center justify-between gap-4 py-0.5">
                <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-400" /> Scans:
                </span>
                <span className="font-bold font-mono">{activeItem.scans || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-0.5">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Visits:
                </span>
                <span className="font-bold font-mono">{activeItem.visits || 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mini Breakdowns Grid: Languages & Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Languages Metrics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">
              Languages Metrics
            </h3>
            <p className="text-xs text-slate-400 mb-6">Distribution of customer preferred languages</p>

            <div className="space-y-4">
              {languageData.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-6 text-center">No language data yet</div>
              ) : (
                languageData.map((lang, idx) => {
                  const pct = Math.round((lang.value / totalLangScans) * 100);
                  const color = langColors[idx % langColors.length];
                  const langNameMap: Record<string, string> = {
                    en: 'English',
                    ml: 'Malayalam (മലയാളം)',
                    hi: 'Hindi (हिंदी)',
                    ar: 'Arabic (العربية)',
                  };
                  const displayName = langNameMap[lang.name.toLowerCase()] || lang.name.toUpperCase();

                  return (
                    <div key={lang.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          {displayName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400">{lang.value} reviews</span>
                          <span className="font-bold text-slate-800">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Device Metrics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">
              Device Metrics
            </h3>
            <p className="text-xs text-slate-400 mb-6">QR Scans broken down by hardware device</p>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
              {/* SVG Donut Ring */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={donutRadius}
                    fill="transparent"
                    stroke="#F1F5F9"
                    strokeWidth="14"
                  />
                  {donutSegments.map((segment) => (
                    <circle
                      key={segment.name}
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      fill="transparent"
                      stroke={segment.color}
                      strokeWidth="14"
                      strokeDasharray={segment.strokeDasharray}
                      strokeDashoffset={segment.strokeDashoffset}
                      strokeLinecap="round"
                    />
                  ))}
                </svg>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-slate-800 tracking-tight">
                    {totalDevices}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Scans
                  </span>
                </div>
              </div>

              {/* Device Legend Badges */}
              <div className="space-y-3 w-full sm:w-auto">
                {donutSegments.map((seg) => (
                  <div
                    key={seg.name}
                    className="flex items-center justify-between sm:justify-start gap-4 p-2 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                      <span className="text-xs font-bold text-slate-700 capitalize">
                        {seg.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900 ml-auto">
                      {seg.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
