'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from './ThemeContext';

interface ChartItem {
  answer: string;
  count: number;
  percentage: number;
}

interface LineChartCardProps {
  data: ChartItem[];
}

export default function LineChartCard({ data }: LineChartCardProps) {
  const { theme } = useTheme();

  const gridStroke = theme === 'light' ? 'rgba(19, 26, 22, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const tickColor = theme === 'light' ? '#5b6b62' : '#8fa39b';
  const lineColor = theme === 'light' ? '#7cab04' : '#a0d405';
  const activeDotColor = theme === 'light' ? '#218a41' : '#2c9e4b';

  if (!data || data.length === 0) return null;

  return (
    <div className="flex flex-col w-full">
      <h3 className="text-xs font-display font-semibold text-ink-muted mb-4 uppercase tracking-wide">
        Trend Line Analysis
      </h3>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -25, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="answer"
              tick={{ fontSize: 9, fill: tickColor }}
              tickLine={false}
              interval={0}
              className="font-medium"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: tickColor }}
              tickLine={false}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={lineColor}
              strokeWidth={3}
              dot={{ fill: lineColor, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: activeDotColor, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}