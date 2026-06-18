import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TrendingUp, BarChart3, Receipt, Calendar, CalendarDays, DollarSign } from 'lucide-react';
import { Order } from '../types';

interface CustomerSpendingChartProps {
  orders: Order[];
}

interface ChartPoint {
  date: Date;
  amount: number;
  cumulative: number;
  id: string;
  label: string;
}

export default function CustomerSpendingChart({ orders }: CustomerSpendingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 280 });
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [metricOption, setMetricOption] = useState<'individual' | 'cumulative'>('cumulative');

  // Filter completed and sorted orders
  // Let's treat orders that are placed as valid completed print transactions
  const completedOrders = orders
    .filter(o => o.status !== 'Design Review' || o.payments.length > 0)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Generate chart data chronologically
  const chartData: ChartPoint[] = [];
  let accumulativeSum = 0;

  completedOrders.forEach((order) => {
    accumulativeSum += order.totalAmount;
    chartData.push({
      date: new Date(order.createdAt),
      amount: order.totalAmount,
      cumulative: accumulativeSum,
      id: order.id,
      label: new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
      }),
    });
  });

  // Calculate statistics
  const totalSpend = accumulativeSum;
  const averageSpend = completedOrders.length > 0 ? Math.round(totalSpend / completedOrders.length) : 0;
  const peakOrderVal = completedOrders.length > 0 ? Math.max(...completedOrders.map((o) => o.totalAmount)) : 0;

  // Track size dynamically with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        // set height to proportional value or lock min/max bounds
        setDimensions({
          width: Math.max(280, width),
          height: 250,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Compute SVG elements with D3
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const width = dimensions.width;
  const height = dimensions.height;
  const svgWidth = width;
  const svgHeight = height;

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Scales
  const xScale = d3.scaleTime()
    .domain(d3.extent(chartData, d => d.date) as [Date, Date] || [new Date(), new Date()])
    .range([0, chartWidth]);

  const yMax = metricOption === 'cumulative' 
    ? (d3.max(chartData, d => d.cumulative) || 1000) 
    : (d3.max(chartData, d => d.amount) || 1000);

  const yScale = d3.scaleLinear()
    .domain([0, yMax * 1.1]) // Add some head cushion
    .range([chartHeight, 0]);

  // Generate Path Strings
  const lineGenerator = d3.line<ChartPoint>()
    .x(d => xScale(d.date))
    .y(d => yScale(metricOption === 'cumulative' ? d.cumulative : d.amount))
    .curve(d3.curveMonotoneX);

  const areaGenerator = d3.area<ChartPoint>()
    .x(d => xScale(d.date))
    .y0(chartHeight)
    .y1(d => yScale(metricOption === 'cumulative' ? d.cumulative : d.amount))
    .curve(d3.curveMonotoneX);

  const linePath = chartData.length > 0 ? lineGenerator(chartData) : '';
  const areaPath = chartData.length > 0 ? areaGenerator(chartData) : '';

  // Gridlines / ticks values
  const xTicksList = chartData;
  const yTicksList = yScale.ticks(5);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-[36px] border border-gray-200/80 p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-zinc-50 border border-zinc-200 text-zinc-400 mx-auto rounded-2xl flex items-center justify-center">
          <TrendingUp className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-lg font-heavy text-slate-900 uppercase tracking-tight">Analytical Spend Engine Dormant</h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto font-bold uppercase tracking-wider font-mono leading-relaxed">
          Unlock interactive spending growth visualization charts once your active print runs progress through checkout!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[36px] overflow-hidden border border-zinc-200/80 p-6 md:p-8 space-y-6 shadow-sm" id="spending-trend-visualizer">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-[#fff5f0] text-[#FF4D00] px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest font-mono">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Live Account Intelligence</span>
          </div>
          <h3 className="text-xl font-heavy text-slate-900 uppercase tracking-tight">
            PRODUCTIONS SPENDING TREND
          </h3>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider font-mono mt-1">D3-Engine compiling chronological order print runs valuation</p>
        </div>

        {/* Metric Selector toggle */}
        <div className="flex gap-1 bg-zinc-100 p-1.5 rounded-xl border border-zinc-200/50 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setMetricOption('cumulative')}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all cursor-pointer ${
              metricOption === 'cumulative'
                ? 'bg-black text-white'
                : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
            }`}
          >
            Cumulative Spend
          </button>
          <button
            type="button"
            onClick={() => setMetricOption('individual')}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all cursor-pointer ${
              metricOption === 'individual'
                ? 'bg-black text-white'
                : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
            }`}
          >
            By Print Job
          </button>
        </div>
      </div>

      {/* Stats microcards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total cashflow */}
        <div className="bg-zinc-50 border border-zinc-150 p-4 rounded-[22px] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF4D00] flex items-center justify-center font-bold text-sm shrink-0">
            ₹
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider">Total Active Spend</span>
            <span className="text-lg font-heavy text-slate-950 font-mono">₹{totalSpend.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Average cost */}
        <div className="bg-zinc-50 border border-zinc-150 p-4 rounded-[22px] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF4D00] flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-[#FF4D00]" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider">Avg Order Value</span>
            <span className="text-lg font-heavy text-slate-950 font-mono">₹{averageSpend.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Peak order */}
        <div className="bg-zinc-50 border border-zinc-150 p-4 rounded-[22px] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF4D00] flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-[#FF4D00]" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider">Peak Prints Ticket</span>
            <span className="text-lg font-heavy text-slate-950 font-mono">₹{peakOrderVal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div ref={containerRef} className="relative w-full overflow-visible py-2 select-none">
        
        {/* Tooltip Overlay */}
        {hoveredPoint && (
          <div 
            className="absolute z-35 bg-zinc-950 text-white rounded-2xl p-3 border border-zinc-800 shadow-xl pointer-events-none transition-all duration-100"
            style={{
              left: Math.min(width - 180, xScale(hoveredPoint.date) + margin.left - 70),
              top: Math.max(0, yScale(metricOption === 'cumulative' ? hoveredPoint.cumulative : hoveredPoint.amount) - 60),
            }}
          >
            <p className="text-[8px] font-black uppercase text-zinc-400 font-mono tracking-wider">{hoveredPoint.label}</p>
            <div className="flex flex-col mt-0.5">
              <span className="text-xs font-black text-white">Order: #{hoveredPoint.id}</span>
              <span className="text-[#FF4D00] font-mono font-heavy text-[13px] mt-0.5">
                Valuation: ₹{hoveredPoint.amount.toLocaleString('en-IN')}
              </span>
              {metricOption === 'cumulative' && (
                <span className="text-emerald-400 font-mono text-[10px] mt-0.5">
                  Cumulative: ₹{hoveredPoint.cumulative.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
        )}

        <svg width={svgWidth} height={svgHeight} className="overflow-visible">
          <defs>
            {/* Smooth glowing gradient path fill */}
            <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF4D00" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FF4D00" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="solid-bar-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E293B" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#1E293B" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            
            {/* horizontal guide lines */}
            {yTicksList.map((tickVal) => (
              <g key={tickVal} transform={`translate(0, ${yScale(tickVal)})`}>
                <line 
                  x1={0} 
                  x2={chartWidth} 
                  stroke="#F3F4F6" 
                  strokeWidth={1} 
                  strokeDasharray="4,4" 
                />
                <text 
                  x={-12} 
                  y={4} 
                  textAnchor="end" 
                  className="fill-zinc-405 font-mono text-[9px] font-bold text-gray-400 uppercase"
                >
                  ₹{tickVal >= 1000 ? `${(tickVal / 1000).toFixed(1)}k` : tickVal}
                </text>
              </g>
            ))}

            {/* area background path */}
            {areaPath && (
              <path 
                d={areaPath} 
                fill="url(#gradient-area)" 
                className="transition-all duration-300"
              />
            )}

            {/* high precision line trend */}
            {linePath && (
              <path 
                d={linePath} 
                fill="none" 
                stroke="#FF4D00" 
                strokeWidth={2.5} 
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            )}

            {/* data points overlay circles */}
            {chartData.map((d, i) => {
              const cx = xScale(d.date);
              const cy = yScale(metricOption === 'cumulative' ? d.cumulative : d.amount);
              const isSelected = hoveredPoint?.id === d.id;

              return (
                <g key={d.id} className="cursor-pointer">
                  {/* Outer glow ring for interaction */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 10 : 6}
                    fill="#FF4D00"
                    fillOpacity={isSelected ? 0.35 : 0}
                    className="transition-all duration-155"
                    onMouseEnter={() => setHoveredPoint(d)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Central sharp point */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 4.5 : 3.5}
                    fill={isSelected ? '#0F172A' : '#FF4D00'}
                    stroke="white"
                    strokeWidth={1.5}
                    onMouseEnter={() => setHoveredPoint(d)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              );
            })}

            {/* X Axis ticks labels */}
            {chartData.length > 0 && (
              <g transform={`translate(0, ${chartHeight + 16})`}>
                {/* Draw clean x line */}
                <line x1={0} x2={chartWidth} y1={-8} y2={-8} stroke="#E5E7EB" strokeWidth={1} />
                
                {/* Select evenly spaced indices to prevent label overlapping for dense lists */}
                {(() => {
                  const labelFilterInterval = Math.max(1, Math.ceil(chartData.length / 6));
                  return chartData
                    .filter((_, idx) => idx % labelFilterInterval === 0 || idx === chartData.length - 1)
                    .map((d) => (
                      <text
                        key={d.id}
                        x={xScale(d.date)}
                        y={4}
                        textAnchor="middle"
                        className="fill-zinc-500 font-mono text-[8px] font-bold text-gray-400 uppercase tracking-widest"
                      >
                        {d.label}
                      </text>
                    ));
                })()}
              </g>
            )}

          </g>
        </svg>
      </div>

    </div>
  );
}
