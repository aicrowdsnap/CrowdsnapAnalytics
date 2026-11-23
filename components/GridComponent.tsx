'use client';

import React, { useMemo } from 'react';
import { Grid3x3 } from 'lucide-react';

interface MatrixCell {
  row: string;
  column: string;
  userInput: string;
  notes: Record<string, string>;
}

interface GridComponentProps {
  matrixData?: MatrixCell[];
  metadata?: {
    rows?: string[];
    columns?: string[];
    type?: string;
  };
  pollMetadata?: string;
}

export default function GridComponent({ matrixData = [], metadata, pollMetadata }: GridComponentProps) {
  const { columns, rows, displayData } = useMemo(() => {
    let cols: string[] = [];
    let rowsList: string[] = [];

    // Try to parse pollMetadata first (from API response)
    if (pollMetadata) {
      try {
        const parsed = JSON.parse(pollMetadata);
        cols = parsed.columns || [];
        rowsList = parsed.rows || [];
      } catch (e) {
        console.error('Error parsing pollMetadata:', e);
      }
    }

    // Fallback to metadata prop or extract from matrixData
    if (cols.length === 0 && metadata?.columns) {
      cols = metadata.columns;
    }
    if (rowsList.length === 0 && metadata?.rows) {
      rowsList = metadata.rows;
    }

    // If still no columns, extract from matrixData
    if (cols.length === 0) {
      cols = Array.from(new Set(matrixData.map(cell => cell.column))).sort();
    }

    // If still no rows, extract from matrixData
    if (rowsList.length === 0) {
      rowsList = Array.from(new Set(matrixData.map(cell => cell.row))).sort((a, b) => {
        const aNum = parseInt(a);
        const bNum = parseInt(b);
        return isNaN(aNum) || isNaN(bNum) ? a.localeCompare(b) : aNum - bNum;
      });
    }

    // Build display data: for each row, get the first cell (which has all the data)
    // and map the notes indices to columns
    const display = new Map<string, Record<string, string>>();
    
    rowsList.forEach(row => {
      // Get any cell from this row (they should all have the same notes)
      const firstCellInRow = matrixData.find(cell => cell.row === row);
      if (firstCellInRow && Object.keys(firstCellInRow.notes).length > 0) {
        const rowData: Record<string, string> = {};
        // Map notes by index to columns
        cols.forEach((col, idx) => {
          rowData[col] = firstCellInRow.notes[String(idx)] || '';
        });
        display.set(row, rowData);
      }
    });

    return { columns: cols, rows: rowsList, displayData: display };
  }, [matrixData, metadata, pollMetadata]);

  if (!matrixData || matrixData.length === 0) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-4 h-4 text-neon-lime" />
          <h3 className="text-sm font-semibold text-ink">Grid Component</h3>
        </div>
        <div className="flex items-center justify-center min-h-[300px]">
          <p className="text-xs text-ink-muted">No matrix data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Grid3x3 className="w-4 h-4 text-neon-lime" />
        <h3 className="text-sm font-semibold text-ink">Grid Component</h3>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-xs">
          {/* Table Header */}
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-4 py-3 text-left font-semibold text-ink-muted min-w-[60px] bg-white/[0.02]">Row</th>
              {columns.map(col => (
                <th
                  key={col}
                  className="px-4 py-3 text-center font-semibold text-ink-muted whitespace-nowrap bg-white/[0.02] border-l border-white/10"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {rows.map((row, rowIdx) => {
              const rowData = displayData.get(row);
              return (
                <tr key={row} className={rowIdx % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                  <td className="px-4 py-3 font-semibold text-ink border-r border-white/10 sticky left-0 bg-white/[0.05]">
                    {row}
                  </td>
                  {columns.map(col => {
                    const value = rowData?.[col] || '';
                    const hasData = value && value.trim().length > 0;

                    return (
                      <td
                        key={`${row}-${col}`}
                        className={`px-4 py-3 border-l border-white/10 text-center ${
                          hasData ? 'bg-neon-lime/5' : 'bg-transparent'
                        }`}
                      >
                        {hasData ? (
                          <span
                            className="inline-block px-2 py-1 bg-neon-lime/10 text-neon-lime rounded text-[9px] font-mono"
                            title={value}
                          >
                            {value.length > 8 ? value.substring(0, 8) + '...' : value}
                          </span>
                        ) : (
                          <span className="text-ink-muted/30">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
