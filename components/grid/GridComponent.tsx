'use client';

import React, { useMemo, useState } from 'react';
import { Grid3x3, Check, X } from 'lucide-react';
import { MatrixCell } from '../../types/matrix';

interface GridComponentProps {
  matrixData?: MatrixCell[];
  metadata?: {
    rows?: string[];
    columns?: string[];
    type?: string;
  };
  pollMetadata?: string;
  responsesList?: Array<{ vote: string; datetime?: string; ip?: string; guid?: string }>;
}

export default function GridComponent({ matrixData = [], metadata, pollMetadata, responsesList = [] }: GridComponentProps) {
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);

  const { columns, rows, isCheckboxMatrix, isSimpleRowOnly, isMultiType, processedResponses } = useMemo(() => {
    let cols: string[] = [];
    let rowsList: string[] = [];
    let matrixType = 'text';
    let isMulti = false;
    let responses: Array<{ data: MatrixCell[]; datetime?: string; ip?: string; guid?: string }> = [];

    // Try to parse pollMetadata first (from API response)
    if (pollMetadata) {
      try {
        const parsed = JSON.parse(pollMetadata);
        cols = parsed.columns || [];
        rowsList = parsed.rows || [];
        matrixType = parsed.type || 'text';
        isMulti = matrixType === 'multi';
      } catch (e) {
        console.error('Error parsing pollMetadata:', e);
      }
    }

    // Fallback to metadata prop
    if (cols.length === 0 && metadata?.columns) {
      cols = metadata.columns;
    }
    if (rowsList.length === 0 && metadata?.rows) {
      rowsList = metadata.rows;
    }
    if (matrixType === 'text' && metadata?.type) {
      matrixType = metadata.type;
      isMulti = matrixType === 'multi';
    }

    // If multi-type, process responses list to extract matrix data
    if (isMulti && responsesList.length > 0) {
      responses = responsesList.map(resp => {
        let voteData: MatrixCell[] = [];
        try {
          const voteArray = JSON.parse(resp.vote);
          if (Array.isArray(voteArray)) {
            voteData = voteArray.map(item => ({
              row: item.row || '',
              column: item.column || '',
              userInput: item.userInput || false,
              notes: item.notes || {},
            }));
          }
        } catch (e) {
          console.error('Error parsing vote data:', e);
        }
        return {
          data: voteData,
          datetime: resp.datetime,
          ip: resp.ip,
          guid: resp.guid,
        };
      });
    } else {
      // For non-multi types, use matrixData directly
      responses = [{ data: matrixData }];
    }

    // Extract columns and rows from the first response's data
    const firstResponseData = responses[0]?.data || [];

    if (cols.length === 0) {
      cols = Array.from(new Set(firstResponseData.map(cell => cell.column))).sort();
    }

    if (rowsList.length === 0) {
      rowsList = Array.from(new Set(firstResponseData.map(cell => cell.row))).sort((a, b) => {
        const aNum = parseInt(a);
        const bNum = parseInt(b);
        return isNaN(aNum) || isNaN(bNum) ? a.localeCompare(b) : aNum - bNum;
      });
    }

    // Check if this is a simple row-only matrix
    let simpleRowOnly = false;
    if (pollMetadata) {
      try {
        const parsed = JSON.parse(pollMetadata);
        if (!parsed.columns || parsed.columns.length === 0) {
          simpleRowOnly = true;
        }
      } catch (e) {}
    }

    console.log('GridComponent - isMultiType:', isMulti);
    console.log('GridComponent - processedResponses count:', responses.length);
    console.log('GridComponent - columns:', cols);
    console.log('GridComponent - rows:', rowsList);

    return { 
      columns: cols, 
      rows: rowsList, 
      isCheckboxMatrix: matrixType === 'multi' && !isMulti,
      isSimpleRowOnly: simpleRowOnly,
      isMultiType: isMulti,
      processedResponses: responses
    };
  }, [matrixData, metadata, pollMetadata, responsesList]);

  // Handle empty data cases
  if ((!matrixData || matrixData.length === 0) && (!isMultiType || processedResponses.length === 0)) {
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

  // Single return statement with conditional rendering
  if (isMultiType) {
    // Render multi-type matrix with separate table per response
    const currentResponse = processedResponses[currentResponseIndex];
    const currentData = currentResponse?.data || [];

    return (
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-4 h-4 text-neon-lime" />
            <h3 className="text-sm font-semibold text-ink">Grid Component (Multi-Response)</h3>
          </div>
          <div className="text-xs text-ink-muted">
            Response <span className="font-semibold text-neon-lime">{currentResponseIndex + 1}</span> of{' '}
            <span className="font-semibold text-neon-lime">{processedResponses.length}</span>
          </div>
        </div>

        {/* Response Navigation */}
        {processedResponses.length > 1 && (
          <div className="flex items-center justify-between gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
            <button
              onClick={() => setCurrentResponseIndex(prev => Math.max(0, prev - 1))}
              disabled={currentResponseIndex === 0}
              className="px-3 py-1 text-xs font-semibold rounded bg-neon-lime/10 text-neon-lime hover:bg-neon-lime/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            
            <div className="flex flex-col gap-1 text-center">
              <p className="text-xs text-ink-muted">Response Info</p>
              {currentResponse?.datetime && (
                <p className="text-[9px] font-mono text-neon-teal">{currentResponse.datetime}</p>
              )}
              {currentResponse?.ip && (
                <p className="text-[9px] font-mono text-neon-lime">{currentResponse.ip}</p>
              )}
            </div>

            <button
              onClick={() => setCurrentResponseIndex(prev => Math.min(processedResponses.length - 1, prev + 1))}
              disabled={currentResponseIndex === processedResponses.length - 1}
              className="px-3 py-1 text-xs font-semibold rounded bg-neon-lime/10 text-neon-lime hover:bg-neon-lime/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* Current Response Table */}
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-4 py-3 text-left font-semibold text-ink-muted min-w-[200px] bg-white/[0.02]">
                  Row / Column
                </th>
                {columns.map(col => (
                  <th
                    key={col}
                    className="px-4 py-3 text-center font-semibold text-ink-muted whitespace-nowrap bg-white/[0.02] border-l border-white/10"
                  >
                    {col}
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-semibold text-ink-muted min-w-[120px] bg-white/[0.02] border-l border-white/10">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => {
                const rowNotes = currentData.find(cell => cell.row === row)?.notes;
                let notesDisplay = '-';
                
                if (rowNotes) {
                  if (typeof rowNotes === 'object' && !Array.isArray(rowNotes)) {
                    const notesArray = Object.values(rowNotes).map(String);
                    notesDisplay = notesArray.join(' - ');
                  } else if (typeof rowNotes === 'string') {
                    notesDisplay = rowNotes;
                  }
                }

                return (
                  <tr key={row} className={rowIdx % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                    <td className="px-4 py-3 font-semibold text-ink border-r border-white/10 sticky left-0 bg-white/[0.05]">
                      <div>
                        <p>{row}</p>
                      </div>
                    </td>
                    {columns.map(col => {
                      const cell = currentData.find(c => c.row === row && c.column === col);
                      const isChecked = cell?.userInput === true;

                      return (
                        <td
                          key={`${row}-${col}`}
                          className={`px-4 py-3 border-l border-white/10 text-center ${
                            isChecked ? 'bg-neon-lime/5' : 'bg-transparent'
                          }`}
                        >
                          {isChecked ? (
                            <div className="flex items-center justify-center">
                              <Check className="w-4 h-4 text-neon-lime" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <X className="w-4 h-4 text-ink-muted/30" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-left border-l border-white/10 text-ink text-xs max-w-xs truncate" title={notesDisplay}>
                      {notesDisplay}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  } else if (isCheckboxMatrix) {
    // Checkbox matrix type
    return (
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-4 h-4 text-neon-lime" />
          <h3 className="text-sm font-semibold text-ink">Grid Component (Checkbox Matrix)</h3>
        </div>

        {/* Checkbox Matrix Table */}
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-4 py-3 text-left font-semibold text-ink-muted min-w-[200px] bg-white/[0.02]">Row / Column</th>
                {columns.map(col => (
                  <th
                    key={col}
                    className="px-4 py-3 text-center font-semibold text-ink-muted whitespace-nowrap bg-white/[0.02] border-l border-white/10"
                  >
                    {col}
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-semibold text-ink-muted min-w-[120px] bg-white/[0.02] border-l border-white/10">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => {
                // Get the first cell's notes for this row (all cells in a row share the same notes)
                const rowNotes = matrixData.find(cell => cell.row === row)?.notes;
                let notesDisplay = '-';
                
                if (rowNotes) {
                  if (typeof rowNotes === 'object' && !Array.isArray(rowNotes)) {
                    // If notes is an object with numeric keys, extract and join values
                    const notesArray = Object.values(rowNotes).map(String);
                    notesDisplay = notesArray.join(' - ');
                  } else if (typeof rowNotes === 'string') {
                    notesDisplay = rowNotes;
                  }
                }

                return (
                  <tr key={row} className={rowIdx % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                    <td className="px-4 py-3 font-semibold text-ink border-r border-white/10 sticky left-0 bg-white/[0.05]">
                      <div>
                        <p>{row}</p>
                      </div>
                    </td>
                    {columns.map(col => {
                      const cell = matrixData.find(c => c.row === row && c.column === col);
                      const isChecked = cell?.userInput === true;

                      return (
                        <td
                          key={`${row}-${col}`}
                          className={`px-4 py-3 border-l border-white/10 text-center ${
                            isChecked ? 'bg-neon-lime/5' : 'bg-transparent'
                          }`}
                        >
                          {isChecked ? (
                            <div className="flex items-center justify-center">
                              <Check className="w-4 h-4 text-neon-lime" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <X className="w-4 h-4 text-ink-muted/30" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-left border-l border-white/10 text-ink text-xs max-w-xs truncate" title={notesDisplay}>
                      {notesDisplay}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  } else {
    // For text matrix type (original implementation)
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-4 h-4 text-neon-lime" />
          <h3 className="text-sm font-semibold text-ink">Grid Component</h3>
        </div>

        {/* Handle case where this is a simple row-only matrix */}
        {isSimpleRowOnly ? (
          <div className="space-y-3">
            <div className="text-xs text-ink-muted">
              Total Responses: <span className="font-semibold text-neon-lime">{matrixData.length}</span>
            </div>
            <div className="max-h-[600px] overflow-y-auto rounded-lg border border-white/10">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 sticky top-0">
                    <th className="px-4 py-3 text-left font-semibold text-ink-muted min-w-[150px] bg-white/[0.02]">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-ink-muted min-w-[150px] bg-white/[0.02] border-l border-white/10">Row</th>
                    <th className="px-4 py-3 text-left font-semibold text-ink-muted min-w-[400px] bg-white/[0.02] border-l border-white/10">Response</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixData.map((entry, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                      <td className="px-4 py-3 font-mono text-ink-muted border-r border-white/10 sticky left-0 bg-white/[0.05]">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink border-l border-white/10">
                        {entry.row}
                      </td>
                      <td className="px-4 py-3 text-left border-l border-white/10 text-ink">
                        {typeof entry.notes === 'string' ? (
                          <span className="inline-block px-2 py-1 bg-neon-lime/10 text-neon-lime rounded text-[9px] font-mono max-w-xs overflow-hidden text-ellipsis whitespace-nowrap" title={entry.notes}>
                            {entry.notes}
                          </span>
                        ) : typeof entry.notes === 'object' ? (
                          <span className="inline-block px-2 py-1 bg-neon-lime/10 text-neon-lime rounded text-[9px] font-mono max-w-xs overflow-hidden text-ellipsis whitespace-nowrap" title={Object.values(entry.notes).join(' / ')}>
                            {Object.values(entry.notes).join(' / ')}
                          </span>
                        ) : (
                          <span className="text-ink-muted/30">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Original multi-column matrix display */
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-xs">
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
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr key={row} className={rowIdx % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                    <td className="px-4 py-3 font-semibold text-ink border-r border-white/10 sticky left-0 bg-white/[0.05]">
                      {row}
                    </td>
                    {columns.map((col, colIdx) => {
                      const cell = matrixData.find(c => c.row === row && c.column === col);
                      
                      // Extract the actual value from notes based on column index
                      let displayValue = '';
                      if (cell?.notes) {
                        if (typeof cell.notes === 'string') {
                          displayValue = cell.notes;
                        } else if (typeof cell.notes === 'object' && !Array.isArray(cell.notes)) {
                          // For object with numeric keys like {"0": "value1", "1": "value2", ...}
                          // The key corresponds to the column index
                          displayValue = cell.notes[colIdx] || '';
                        }
                      } else if (typeof cell?.userInput === 'string') {
                        displayValue = cell.userInput;
                      }

                      const hasData = displayValue && displayValue.trim().length > 0;

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
                              title={displayValue}
                            >
                              {displayValue.length > 15 ? displayValue.substring(0, 15) + '...' : displayValue}
                            </span>
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
        )}
      </div>
    );
  }
}
