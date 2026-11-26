'use client';

import React, { useMemo } from 'react';
import { Grid3x3, AlertCircle } from 'lucide-react';
import { MatrixCell } from '../../types/matrix';

interface MatrixAnalyticsCardProps {
  data: MatrixCell[];
  metadata?: {
    rows?: string[];
    columns?: string[];
    type?: string;
  };
  pollQuestion?: string;
}

export default function MatrixAnalyticsCard({ data, metadata, pollQuestion }: MatrixAnalyticsCardProps) {
  const { rows, columns, cellData, stats } = useMemo(() => {
    if (!data || data.length === 0) {
      return { rows: [], columns: [], cellData: new Map(), stats: {} };
    }

    // Extract unique rows and columns
    const uniqueRows = Array.from(new Set(data.map(d => d.row))).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      return isNaN(aNum) || isNaN(bNum) ? a.localeCompare(b) : aNum - bNum;
    });

    const uniqueColumns = Array.from(new Set(data.map(d => d.column))).sort();

    // Build matrix data structure
    const matrix = new Map<string, Map<string, MatrixCell>>();
    data.forEach(item => {
      if (!matrix.has(item.row)) {
        matrix.set(item.row, new Map());
      }
      matrix.get(item.row)!.set(item.column, item);
    });

    // Calculate statistics
    const totalCells = data.length;
    const filledCells = data.filter(d => {
      const notes = d.notes;
      if (typeof notes === 'string') {
        return notes.length > 0;
      } else if (notes && typeof notes === 'object') {
        return Object.keys(notes).length > 0;
      }
      return false;
    }).length;

    return {
      rows: uniqueRows,
      columns: uniqueColumns,
      cellData: matrix,
      stats: {
        totalCells,
        filledCells,
        completionRate: ((filledCells / totalCells) * 100).toFixed(1)
      }
    };
  }, [data]);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
        <AlertCircle className="w-6 h-6 text-neon-lime/50" />
        <p className="text-xs text-ink-muted">No matrix data available</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Grid3x3 className="w-4 h-4 text-neon-lime" />
        <h3 className="text-sm font-semibold text-ink">Matrix Analytics</h3>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
        <div className="text-center">
          <p className="text-[10px] text-ink-muted font-mono">TOTAL ENTRIES</p>
          <p className="text-sm font-bold text-neon-lime">{stats.totalCells}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-ink-muted font-mono">FILLED</p>
          <p className="text-sm font-bold text-neon-green">{stats.filledCells}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-ink-muted font-mono">COMPLETION</p>
          <p className="text-sm font-bold text-neon-teal">{stats.completionRate}%</p>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-xs">
          {/* Header Row */}
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-3 py-2 text-left font-semibold text-ink-muted min-w-[80px]">Row / Column</th>
              {columns.map(col => (
                <th
                  key={col}
                  className="px-3 py-2 text-center font-semibold text-ink-muted whitespace-nowrap bg-white/[0.02] border-l border-white/10"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* Data Rows */}
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={row} className={rowIdx % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                <td className="px-3 py-2 font-semibold text-ink border-r border-white/10 sticky left-0 bg-white/[0.05]">
                  {row}
                </td>
                {columns.map(col => {
                  const cellItem = cellData.get(row)?.get(col);
                  const notes = cellItem?.notes;
                  let hasData = false;
                  let notesEntries: Array<[string, string]> = [];

                  if (notes) {
                    if (typeof notes === 'string') {
                      hasData = notes.length > 0;
                      if (hasData) notesEntries = [['0', notes]];
                    } else if (typeof notes === 'object') {
                      notesEntries = Object.entries(notes);
                      hasData = notesEntries.length > 0;
                    }
                  }

                  return (
                    <td
                      key={`${row}-${col}`}
                      className={`px-3 py-2 border-l border-white/10 text-center ${
                        hasData ? 'bg-neon-lime/5' : 'bg-transparent'
                      }`}
                    >
                      {hasData ? (
                        <div className="flex flex-col gap-1">
                          {notesEntries.map(([idx, val]) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 bg-neon-lime/10 text-neon-lime rounded text-[9px] font-mono"
                              title={String(val)}
                            >
                              {String(val).length > 8 ? String(val).substring(0, 8) + '...' : String(val)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-ink-muted/30">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Response View */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
        <p className="text-xs font-semibold text-ink mb-3">Response Details</p>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {data.map((item, idx) => {
            let notesDisplay: Array<[string, string]> = [];
            if (item.notes) {
              if (typeof item.notes === 'string') {
                notesDisplay = [['0', item.notes]];
              } else if (typeof item.notes === 'object') {
                notesDisplay = Object.entries(item.notes);
              }
            }

            return (
              <div
                key={idx}
                className="p-2 bg-white/[0.02] rounded border border-white/10 text-[10px] space-y-1"
              >
                <p className="font-mono text-neon-lime">
                  Row: <span className="text-ink font-bold">{item.row}</span> | Column:{' '}
                  <span className="text-ink font-bold">{item.column}</span>
                </p>
                {notesDisplay.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {notesDisplay.map(([idx, val]) => (
                      <span key={idx} className="px-2 py-0.5 bg-neon-teal/10 text-neon-teal rounded">
                        {val}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
