'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useTheme } from './ThemeContext';

interface ChartItem {
  answer: string;
  count: number;
  percentage: number;
}

interface PieChartCardProps {
  data: ChartItem[];
}

// Concrete theme-mapped HEX hex palettes to ensure absolute SVG rendering stability
const PALETTES = {
  dark: [
    '#a0d405', // Neon Lime
    '#12b3a8', // Neon Teal
    '#2c9e4b', // Neon Green
    '#8fa39b', // Ink Muted
    '#313a42', // Slate
    '#1c2227'  // Void 2
  ],
  light: [
    '#7cab04', // Deepened Accent Lime for AA contrast
    '#0e8f86', // Deepened Accent Teal
    '#218a41', // Deepened Accent Green
    '#5b6b62', // Ink Muted Light
    '#dfe6e1', // Slate Light
    '#b0c2b5'  // Muted Accent Blend
  ]
};

export default function PieChartCard({ data }: PieChartCardProps) {
  const { theme } = useTheme();
  
  // Guard against clean initial hydro states safely
  const currentPalette = theme === 'light' ? PALETTES.light : PALETTES.dark;
  const strokeColor = theme === 'light' ? '#ffffff' : '#1c2227';
  const labelColor = theme === 'light' ? '#1b2420' : '#edf2ee';

  if (!data || data.length === 0) return null;

  return (
    <div className="flex flex-col items-center w-full">
      <h3 className="text-xs font-display font-semibold text-ink-muted mb-4 self-start uppercase tracking-wide">
        Composition of the preferences
      </h3>

      {/* Legend Grid Matrix Elements */}
      <div className="grid grid-cols-3 gap-x-2 gap-y-2 text-[10px] text-ink-muted mb-6 w-full">
        {data.map((item, index) => (
          <div key={item.answer} className="flex items-center gap-1.5">
            <span
              className="w-4 h-2 inline-block rounded-xs shrink-0 transition-colors duration-200"
              style={{ backgroundColor: currentPalette[index % currentPalette.length] }}
            />
            <span className="truncate text-ink">{item.answer}</span>
          </div>
        ))}
      </div>

      {/* Recharts Graphical Elements Wrapper Layout */}
      <div className="w-full h-56 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="percentage"
              nameKey="answer"
              cx="50%"
              cy="50%"
              outerRadius={95}
              labelLine={false}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                const percentage = typeof value === 'number' ? value : Number(value);
                if (!percentage || percentage <= 0) return null;
                if (midAngle === undefined) return null;
                
                // Math matrix computing precise placement layout coordinates inside the vector arcs
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                return (
                  <text
                    x={x}
                    y={y}
                    fill={labelColor}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[11px] font-bold tracking-tight select-none pointer-events-none transition-colors duration-200"
                  >
                    {`${percentage}%`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={currentPalette[index % currentPalette.length]}
                  stroke={strokeColor}
                  strokeWidth={2}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
