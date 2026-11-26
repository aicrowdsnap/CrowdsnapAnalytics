'use client';

import React, { useMemo, useState } from 'react';
import { Grid3x3, Check, X, Save, Search } from 'lucide-react';
import { MatrixCell } from '../../types/matrix';
import { saveGridData, searchGridData, SaveGridPayload } from '@/services/api';

interface GridComponentProps {
  matrixData?: MatrixCell[];
  metadata?: {
    rows?: string[];
    columns?: string[];
    type?: string;
  };
  pollMetadata?: string;
  responsesList?: Array<{ vote: string; datetime?: string; ip?: string; guid?: string }>;
  gridId?: string;
  gridName?: string;
  responseId?: string;
  responseDateTime?: string;
  responseIp?: string;
  responseGuid?: string;
}

export default function GridComponentEnhanced({
  matrixData = [],
  metadata,
  pollMetadata,
  responsesList = [],
  gridId = `grid_${Date.now()}`,
  gridName = 'Grid Data',
  responseId,
  responseDateTime,
  responseIp,
  responseGuid,
}: GridComponentProps) {
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const { columns, rows, isCheckboxMatrix, isSimpleRowOnly, isMultiType, processedResponses } = useMemo(() => {
    let cols: string[] = [];
    let rowsList: string[] = [];
    let matrixType = 'text';
    let isMulti = false;
    let responses: Array<{ data: MatrixCell[]; datetime?: string; ip?: string; guid?: string }> = [];

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
      responses = [{ data: matrixData }];
    }

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

    let simpleRowOnly = false;
    if (pollMetadata) {
      try {
        const parsed = JSON.parse(pollMetadata);
        if (!parsed.columns || parsed.columns.length === 0) {
          simpleRowOnly = true;
        }
      } catch (e) {}
    }

    return {
      columns: cols,
      rows: rowsList,
      isCheckboxMatrix: matrixType === 'multi' && !isMulti,
      isSimpleRowOnly: simpleRowOnly,
      isMultiType: isMulti,
      processedResponses: responses
    };
  }, [matrixData, metadata, pollMetadata, responsesList]);

  // Handle save grid
  const handleSaveGrid = async () => {
    setIsSaving(true);
    setSaveStatus({ type: null, message: '' });

    try {
      const dataToSave: SaveGridPayload = {
        gridId,
        gridName,
        gridType: isMultiType ? 'multi' : isCheckboxMatrix ? 'checkbox' : 'text',
        columns,
        rows,
        cells: matrixData,
        responseId,
        responseDateTime,
        responseIp,
        responseGuid,
      };

      const result = await saveGridData(dataToSave);
      setSaveStatus({
        type: 'success',
        message: `Grid saved successfully! Rows: ${result.rowCount}, Cells: ${result.cellCount}`
      });
    } catch (error) {
      setSaveStatus({
        type: 'error',
        message: `Failed to save: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const result = await searchGridData({
        gridId,
        search: searchQuery,
      });

      setSearchResults(result.results || []);
      setShowSearchResults(true);
    } catch (error) {
      setSaveStatus({
        type: 'error',
        message: `Search failed: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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

  // Main table content
  const renderTable = (data: MatrixCell[]) => (
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
            const rowNotes = data.find(cell => cell.row === row)?.notes;
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
                  {row}
                </td>
                {columns.map(col => {
                  const cell = data.find(c => c.row === row && c.column === col);
                  const isChecked = cell?.userInput === true;

                  return (
                    <td
                      key={`${row}-${col}`}
                      className={`px-4 py-3 border-l border-white/10 text-center ${isChecked ? 'bg-neon-lime/5' : 'bg-transparent'
                        }`}
                    >
                      {isChecked ? (
                        <Check className="w-4 h-4 text-neon-lime mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-ink-muted/30 mx-auto" />
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
  );

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-4 h-4 text-neon-lime" />
          <h3 className="text-sm font-semibold text-ink">Grid Component</h3>
        </div>
      </div>

      {/* Status Message */}
      {saveStatus.type && (
        <div
          className={`p-3 rounded-lg border text-xs ${
            saveStatus.type === 'success'
              ? 'bg-neon-lime/10 border-neon-lime/30 text-neon-lime'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {saveStatus.message}
        </div>
      )}

      {/* Search Bar */}
      <div className="flex gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search grid data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-xs text-ink placeholder-ink-muted focus:outline-none focus:border-neon-lime/50"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="flex items-center gap-2 px-3 py-2 bg-neon-lime/10 text-neon-lime rounded hover:bg-neon-lime/20 disabled:opacity-50 transition-colors text-xs font-semibold"
        >
          <Search className="w-4 h-4" />
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Search Results */}
      {showSearchResults && searchResults.length > 0 && (
        <div className="p-4 bg-white/[0.03] rounded-lg border border-neon-lime/20">
          <h4 className="text-xs font-semibold text-neon-lime mb-3">Search Results ({searchResults.length})</h4>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {searchResults.map((result, idx) => (
              <div key={idx} className="p-3 bg-white/5 rounded border border-white/10 text-xs">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-ink">{result.row_name}</span>
                  <span className="text-neon-lime">{result.column_name}</span>
                </div>
                <p className="text-ink-muted">{result.cell_value}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowSearchResults(false)}
            className="mt-3 w-full px-3 py-2 bg-white/5 text-ink-muted rounded text-xs hover:bg-white/10 transition-colors"
          >
            Close Results
          </button>
        </div>
      )}

      {/* Main Table */}
      {isMultiType ? (
        <div className="space-y-4">
          {processedResponses.length > 1 && (
            <div className="flex items-center justify-between gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
              <button
                onClick={() => setCurrentResponseIndex(prev => Math.max(0, prev - 1))}
                disabled={currentResponseIndex === 0}
                className="px-3 py-1 text-xs font-semibold rounded bg-neon-lime/10 text-neon-lime hover:bg-neon-lime/20 disabled:opacity-50 transition-colors"
              >
                ← Previous
              </button>
              <div className="text-xs text-ink-muted">
                Response {currentResponseIndex + 1} of {processedResponses.length}
              </div>
              <button
                onClick={() => setCurrentResponseIndex(prev => Math.min(processedResponses.length - 1, prev + 1))}
                disabled={currentResponseIndex === processedResponses.length - 1}
                className="px-3 py-1 text-xs font-semibold rounded bg-neon-lime/10 text-neon-lime hover:bg-neon-lime/20 disabled:opacity-50 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
          {renderTable(processedResponses[currentResponseIndex]?.data || [])}
        </div>
      ) : (
        renderTable(matrixData)
      )}

      {/* Save Button */}
      <button
        onClick={handleSaveGrid}
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neon-lime text-black rounded-lg font-semibold hover:bg-neon-lime/90 disabled:opacity-50 transition-colors"
      >
        <Save className="w-4 h-4" />
        {isSaving ? 'Saving...' : 'Save to Database'}
      </button>
    </div>
  );
}
