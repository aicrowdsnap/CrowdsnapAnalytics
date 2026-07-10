'use client';

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useTheme } from './ThemeContext';

interface ChartItem {
  answer: string;
  count: number;
  percentage: number;
}

interface RadarChartCardProps {
  data: ChartItem[];
}

export default function RadarChartCard({ data }: RadarChartCardProps) {
  const { theme } = useTheme();

  const gridStroke = theme === 'light' ? 'rgba(19, 26, 22, 0.12)' : 'rgba(255, 255, 255, 0.12)';
  const tickColor = theme === 'light' ? '#1b2420' : '#edf2ee';
  const labelColor = theme === 'light' ? '#5b6b62' : '#8fa39b';
  const fillAccent = theme === 'light' ? 'rgba(12, 143, 134, 0.25)' : 'rgba(18, 179, 168, 0.2)';
  const strokeAccent = theme === 'light' ? '#0e8f86' : '#12b3a8';

  if (!data || data.length === 0) return null;

  return (
    <div className="flex flex-col items-center w-full">
      <h3 className="text-xs font-display font-semibold text-ink-muted mb-4 self-start uppercase tracking-wide">
        Multi-Angle Radar Matrix
      </h3>

      <div className="w-full h-56 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke={gridStroke} />
            <PolarAngleAxis 
              dataKey="answer" 
              tick={{ fill: labelColor, fontSize: 9, fontWeight: 500 }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 'auto']} 
              tick={{ fill: labelColor, fontSize: 8 }}
              tickLine={false}
              axisLine={false}
            />
            <Radar
              name="Metrics"
              dataKey="count"
              stroke={strokeAccent}
              fill={fillAccent}
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}