'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useTheme } from './ThemeContext';

interface ChartItem {
  answer: string;
  count: number;
  percentage: number;
}

interface BarChartCardProps {
  data: ChartItem[];
}

export default function BarChartCard({ data }: BarChartCardProps) {
  const { theme } = useTheme();

  // Explicit hex fallbacks for SVG chart boundaries
  const gridStroke = theme === 'light' ? 'rgba(19, 26, 22, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const tickColor = theme === 'light' ? '#5b6b62' : '#8fa39b';
  const startGradient = theme === 'light' ? '#7cab04' : '#a0d405';
  const endGradient = theme === 'light' ? '#218a41' : '#2c9e4b';

  if (!data || data.length === 0) return null;

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <span className="text-[11px] font-medium text-ink-muted">
          Distribution Metric Map
        </span>
        <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
          <span 
            className="w-4 h-2 rounded-xs inline-block transition-colors duration-200" 
            style={{ backgroundImage: `linear-gradient(to right, ${startGradient}, ${endGradient})` }}
          />
          <span>User selections</span>
        </div>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 35 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={startGradient} />
                <stop offset="100%" stopColor={endGradient} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" vertical={false} stroke={gridStroke} />
            <XAxis
              dataKey="answer"
              tick={{ fontSize: 10, fill: tickColor }}
              angle={-20}
              textAnchor="end"
              interval={0}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: tickColor }}
              tickLine={false}
            />
            <Bar dataKey="count" fill="url(#barGradient)" radius={[4, 4, 0, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}