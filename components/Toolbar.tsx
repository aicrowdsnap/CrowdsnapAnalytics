'use client';

import React, { useState } from 'react';
import { PieChart, BarChart2, LineChart, Hexagon, RotateCw, Image, Download } from 'lucide-react';

export type DashboardView = 'all' | 'pie' | 'bar' | 'line' | 'radar';

interface TelemetryRow {
  answer: string;
  count: number;
  percentage: number;
}

interface ToolbarProps {
  onViewChange?: (view: DashboardView) => void;
  currentView?: DashboardView;
  data?: TelemetryRow[];
}

export default function Toolbar({ onViewChange, currentView = 'all', data = [] }: ToolbarProps) {
  const [checked, setChecked] = useState(false);

  // Functional Excel/CSV Spreadsheet Telemetry Exporter
  const handleDownloadCSV = () => {
    if (!data || data.length === 0) {
      alert('No telemetry data available for translation.');
      return;
    }

    const headers = ['Answer Choice', 'Response Count', 'Percentage Ratio'];
    const csvRows = data.map(item => [
      `"${item.answer.replace(/"/g, '""')}"`,
      item.count,
      `"${item.percentage}%"`
    ]);

    const csvContent = [
      headers.join(','), 
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.setAttribute('download', `telemetry_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
  };

  // Fixed Vector Graph Capture Engine (Resolves XML Validation Error)
  const handleCaptureVectorImage = () => {
    const svgElement = document.querySelector('.recharts-responsive-container svg');
    
    if (!svgElement) {
      alert('Unable to capture active layout view wrapper. Switch views or refresh charts.');
      return;
    }

    try {
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;

      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

      const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      styleElement.textContent = 'text { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; font-weight: 600; }';

      clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);

      const xmlSerializer = new XMLSerializer();
      const svgSourceString = xmlSerializer.serializeToString(clonedSvg);

      const imageBlob = new Blob([svgSourceString], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(imageBlob);

      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = blobUrl;
      downloadAnchor.setAttribute('download', `chart_snapshot_${currentView}_${Date.now()}.svg`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();

      // Step F: Clean up background tracking memory addresses cleanly
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Image rendering failed:', error);
      alert('System capture handshake failed.');
    }
  };

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
          onClick={handleCaptureVectorImage}
          className="p-2 text-[var(--color-ink-muted)] hover:bg-white/5 hover:text-[var(--color-neon-green)] rounded-lg transition"
          title="Save Dashboard Image (.svg)"
        >
          <Image className="w-4 h-4" />
        </button>
        <button
          onClick={handleDownloadCSV}
          className="p-2 text-[var(--color-ink-muted)] hover:bg-white/5 hover:text-[var(--color-neon-teal)] rounded-lg transition"
          title="Download Excel CSV Telemetry Data Summary"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}