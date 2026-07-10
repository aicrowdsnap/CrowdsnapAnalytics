'use client';

import React from 'react';

interface TableItem {
  answer: string;
  count: number;
  percentage: number;
}

interface DataTableProps {
  data: TableItem[];
}

export default function DataTable({ data }: DataTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-dashed border-white/15 text-ink-muted">
            <th className="py-2 font-semibold font-display uppercase tracking-wide text-[10px]">Answer</th>
            <th className="py-2 font-semibold font-display uppercase tracking-wide text-[10px] text-center">Count</th>
            <th className="py-2 font-semibold font-display uppercase tracking-wide text-[10px] text-right">Percentage</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 text-ink font-medium">
          {data.map((row) => (
            <tr key={row.answer} className="hover:bg-white/5 transition">
              <td className="py-2.5 text-ink">{row.answer}</td>
              <td className="py-2.5 text-center font-mono text-neon-teal">{row.count}</td>
              <td className="py-2.5 text-right font-mono text-neon-lime">{row.percentage}%</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={3} className="py-8 text-center text-ink-muted text-xs">
                No telemetry segments found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}