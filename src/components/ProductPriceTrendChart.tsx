/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Product } from '../types';
import { TrendingDown, Sparkles } from 'lucide-react';

interface ProductPriceTrendChartProps {
  product: Product;
}

export default function ProductPriceTrendChart({ product }: ProductPriceTrendChartProps) {
  const slabs = product.quantitySlabs || [];
  
  if (slabs.length < 2) {
    return null;
  }

  // Ensure slabs are sorted by quantity
  const sortedSlabs = [...slabs].sort((a, b) => a.quantity - b.quantity);
  const baseSlab = sortedSlabs[0];
  const maxSlab = sortedSlabs[sortedSlabs.length - 1];
  
  // Calculate max volume savings
  const maxDiscount = baseSlab && baseSlab.unitPrice > 0
    ? Math.round((1 - (maxSlab.unitPrice / baseSlab.unitPrice)) * 100)
    : 0;

  // Map to chart data
  const data = sortedSlabs.map((slab) => {
    const discount = baseSlab && baseSlab.unitPrice > 0
      ? Math.round((1 - (slab.unitPrice / baseSlab.unitPrice)) * 100)
      : 0;
    return {
      quantity: slab.quantity,
      label: `${slab.quantity >= 1000 ? `${slab.quantity / 1000}k` : slab.quantity}`,
      fullLabel: `${slab.quantity} PCS`,
      unitPrice: slab.unitPrice,
      discount: discount,
    };
  });

  // Custom tool-tip component for clean high-contrast styling
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-zinc-950 border-2 border-black p-2.5 rounded-2xl shadow-xl text-[10px] font-mono text-zinc-100 space-y-1 pointer-events-none z-50">
          <p className="font-bold text-white text-xs border-b border-zinc-800 pb-1 flex items-center gap-1">
            <span>📦 {point.fullLabel}</span>
          </p>
          <div className="pt-0.5 space-y-0.5 text-zinc-300">
            <p>Unit Price: <span className="font-bold text-[#FF4D00]">₹{point.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span></p>
            <p>Total: <span className="text-zinc-100 font-bold">₹{(point.quantity * point.unitPrice).toLocaleString('en-IN')}</span></p>
            {point.discount > 0 && (
              <p className="text-emerald-400 font-bold flex items-center gap-0.5 mt-1">
                <span>🔥 Save {point.discount}% Bulk Off</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-4 p-3.5 bg-zinc-50 rounded-2xl border-2 border-zinc-100/80 hover:border-black/10 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-[#FF4D00]/10 rounded-lg text-[#FF4D00]">
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-600 tracking-wider">
            Price Trend / Unit
          </span>
        </div>
        {maxDiscount > 0 && (
          <div className="flex items-center gap-0.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full text-[9px] font-mono font-bold animate-pulse">
            <Sparkles className="w-2.5 h-2.5" />
            <span>SAVE UP TO {maxDiscount}%</span>
          </div>
        )}
      </div>

      <div className="w-full h-[64px] relative -mx-2.5 pr-2 select-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={data}
            margin={{ top: 4, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`colorPrice-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF4D00" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#FF4D00" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="label" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 8, fontFamily: 'monospace', fill: '#71717a', fontWeight: 'bold' }}
              dy={4}
            />
            <YAxis 
              hide={true} 
              domain={['dataMin * 0.9', 'dataMax * 1.1']}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: '#000000', strokeWidth: 1, strokeDasharray: '2 2' }}
              allowEscapeViewBox={{ x: true, y: true }}
            />
            <Area 
              type="monotone" 
              dataKey="unitPrice" 
              stroke="#FF4D00" 
              strokeWidth={2}
              fillOpacity={1} 
              fill={`url(#colorPrice-${product.id})`}
              activeDot={{ r: 4, stroke: '#FFFFFF', strokeWidth: 1.5, fill: '#FF4D00' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] font-mono text-zinc-400 mt-1.5 text-center leading-none">
        Hover points to explore custom quantity slabs
      </p>
    </div>
  );
}
