'use client';

import React, { useState } from 'react';
import { PieChart, BarChart2, LineChart, Hexagon, RotateCw, Image, Download } from 'lucide-react';

export type DashboardView = 'all' | 'pie' | 'bar' | 'line' | 'radar';

interface ToolbarProps {
  onViewChange?: (view: DashboardView) => void;
  currentView?: DashboardView;
}

export default function Toolbar({ onViewChange, currentView = 'all' }: ToolbarProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-4 border-t border-white/10">
      {/* Control Actions Icons Row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onViewChange?.('pie')}
          className={`p-2 rounded-lg transition-all duration-150 ${
            currentView === 'pie'
              ? 'bg-[var(--color-neon-lime)]/15 text-[var(--color-neon-lime)] shadow-[0_0_15px_-5px_rgba(160,212,5,0.4)]'
              : 'text-[var(--color-ink-muted)] hover:bg-white/5 hover:text-[var(--color-ink)]'
          }`}
          title="Show Pie Chart Only"
        >
          <PieChart className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewChange?.('bar')}
          className={`p-2 rounded-lg transition-all duration-150 ${
            currentView === 'bar'
              ? 'bg-[var(--color-neon-green)]/15 text-[var(--color-neon-green)] shadow-[0_0_15px_-5px_rgba(44,158,75,0.4)]'
              : 'text-[var(--color-ink-muted)] hover:bg-white/5 hover:text-[var(--color-ink)]'
          }`}
          title="Show Bar Chart Only"
        >
          <BarChart2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewChange?.('line')}
          className={`p-2 rounded-lg transition-all duration-150 ${
            currentView === 'line'
              ? 'bg-[var(--color-neon-lime)]/15 text-[var(--color-neon-lime)] shadow-[0_0_15px_-5px_rgba(160,212,5,0.4)]'
              : 'text-[var(--color-ink-muted)] hover:bg-white/5 hover:text-[var(--color-ink)]'
          }`}
          title="Show Line Chart Only"
        >
          <LineChart className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewChange?.('radar')}
          className={`p-2 rounded-lg transition-all duration-150 ${
            currentView === 'radar'
              ? 'bg-[var(--color-neon-teal)]/15 text-[var(--color-neon-teal)] shadow-[0_0_15px_-5px_rgba(18,179,168,0.4)]'
              : 'text-[var(--color-ink-muted)] hover:bg-white/5 hover:text-[var(--color-ink)]'
          }`}
          title="Show Radar Chart Only"
        >
          <Hexagon className="w-4 h-4" />
        </button>
        
        <span className="h-4 w-[1px] bg-white/10 mx-1" />

        <button
          onClick={() => onViewChange?.('all')}
          className={`p-2 rounded-lg transition-all text-xs font-semibold px-3 ${
            currentView === 'all'
              ? 'bg-white/10 text-[var(--color-ink)] shadow-sm'
              : 'text-[var(--color-ink-muted)] hover:bg-white/5 hover:text-[var(--color-ink)]'
          }`}
          title="Reset View Grid"
        >
          Reset View
        </button>

        <span className="h-4 w-[1px] bg-white/10 mx-1" />

        <button
          onClick={() => window.location.reload()}
          className="p-2 text-[var(--color-ink-muted)] hover:bg-white/5 hover:text-[var(--color-neon-lime)] rounded-lg transition"
          title="Refresh Analytics Data"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => alert('Capture View Snapshot Generated')}
          className="p-2 text-[var(--color-ink-muted)] hover:bg-white/5 hover:text-[var(--color-neon-green)] rounded-lg transition"
          title="Save Dashboard Image"
        >
          <Image className="w-4 h-4" />
        </button>
        <button
          onClick={() => alert('Downloading report data (CSV)...')}
          className="p-2 text-[var(--color-ink-muted)] hover:bg-white/5 hover:text-[var(--color-neon-teal)] rounded-lg transition"
          title="Download Excel Data Summary"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}