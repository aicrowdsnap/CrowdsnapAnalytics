'use client';

import React, { useState, useRef } from 'react';
import { Plus, Eye, Upload } from 'lucide-react';

type GuideTab = 'create' | 'view';

interface ColumnConfig {
  name: string;
  type: 'text' | 'select' | 'checkbox' | 'radio' | 'number' | 'email' | 'date';
  imageUrl?: string;
}

interface RowConfig {
  name: string;
  imageUrl?: string;
}

interface TableData {
  id: string;
  name: string;
  columns: ColumnConfig[];
  rows: string[][];
  rowNames: RowConfig[];
  disabledCells: Set<string>;
  createdAt: string;
}

export default function GuideComponent() {
  const [activeTab, setActiveTab] = useState<GuideTab>('create');
  const [tables, setTables] = useState<TableData[]>([]);
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<ColumnConfig[]>([{ name: 'Column 1', type: 'text' }]);
  const [rows, setRows] = useState<string[][]>([['']]);
  const [disabledCells, setDisabledCells] = useState<Set<string>>(new Set());
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<'text' | 'select' | 'checkbox' | 'radio' | 'number' | 'email' | 'date'>('text');
  const [newRowCount, setNewRowCount] = useState(1);
  const [rowNames, setRowNames] = useState<RowConfig[]>([{ name: '', imageUrl: undefined }]);
  
  // Image upload refs
  const columnImageInputRef = useRef<HTMLInputElement>(null);
  const rowImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingColumnIdx, setUploadingColumnIdx] = useState<number | null>(null);
  const [uploadingRowIdx, setUploadingRowIdx] = useState<number | null>(null);

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      setColumns([...columns, { name: newColumnName, type: newColumnType }]);
      setRows(rows.map(row => [...row, '']));
      setNewColumnName('');
      setNewColumnType('text');
    }
  };

  const handleRemoveColumn = (index: number) => {
    if (columns.length > 1) {
      setColumns(columns.filter((_, i) => i !== index));
      setRows(rows.map(row => row.filter((_, i) => i !== index)));
    }
  };

  const handleAddRow = () => {
    setRows([...rows, new Array(columns.length).fill('')]);
    setRowNames([...rowNames, { name: '', imageUrl: undefined }]);
  };

  const handleAddMultipleRows = () => {
    if (newRowCount > 0) {
      const newRows = Array(newRowCount).fill(null).map(() => new Array(columns.length).fill(''));
      const newNames = Array(newRowCount).fill(null).map(() => ({ name: '', imageUrl: undefined }));
      setRows([...rows, ...newRows]);
      setRowNames([...rowNames, ...newNames]);
      setNewRowCount(1);
    }
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
      setRowNames(rowNames.filter((_, i) => i !== index));
    }
  };

  const handleCellChange = (rowIdx: number, colIdx: number, value: string) => {
    const newRows = [...rows];
    newRows[rowIdx][colIdx] = value;
    setRows(newRows);
  };

  const toggleCellDisabled = (rowIdx: number, colIdx: number) => {
    const cellKey = `${rowIdx},${colIdx}`;
    const newDisabled = new Set(disabledCells);
    if (newDisabled.has(cellKey)) {
      newDisabled.delete(cellKey);
    } else {
      newDisabled.add(cellKey);
    }
    setDisabledCells(newDisabled);
  };

  const handleColumnImageUpload = (e: React.ChangeEvent<HTMLInputElement>, columnIdx: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        const newColumns = [...columns];
        newColumns[columnIdx].imageUrl = imageUrl;
        setColumns(newColumns);
        setUploadingColumnIdx(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRowImageUpload = (e: React.ChangeEvent<HTMLInputElement>, rowIdx: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        const newRowNames = [...rowNames];
        newRowNames[rowIdx].imageUrl = imageUrl;
        setRowNames(newRowNames);
        setUploadingRowIdx(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeColumnImage = (columnIdx: number) => {
    const newColumns = [...columns];
    newColumns[columnIdx].imageUrl = undefined;
    setColumns(newColumns);
  };

  const removeRowImage = (rowIdx: number) => {
    const newRowNames = [...rowNames];
    newRowNames[rowIdx].imageUrl = undefined;
    setRowNames(newRowNames);
  };

  const handleCreateTable = () => {
    if (!tableName.trim()) {
      alert('Please enter a table name');
      return;
    }

    const newTable: TableData = {
      id: Date.now().toString(),
      name: tableName,
      columns: [...columns],
      rows: rows.map(row => [...row]),
      rowNames: [...rowNames],
      disabledCells: new Set(disabledCells),
      createdAt: new Date().toLocaleString()
    };

    setTables([newTable, ...tables]);
    setTableName('');
    setColumns([{ name: 'Column 1', type: 'text' }]);
    setRows([['']]);
    setRowNames([{ name: '', imageUrl: undefined }]);
    setDisabledCells(new Set());
  };

  const handleDeleteTable = (id: string) => {
    setTables(tables.filter(table => table.id !== id));
  };

  const handleDuplicateTable = (table: TableData) => {
    const duplicated: TableData = {
      ...table,
      id: Date.now().toString(),
      name: `${table.name} (Copy)`,
      columns: table.columns.map(col => ({ ...col })),
      rows: table.rows.map(row => [...row]),
      rowNames: table.rowNames.map(rn => ({ ...rn })),
      disabledCells: new Set(table.disabledCells)
    };
    setTables([duplicated, ...tables]);
  };

  const renderCellInput = (rowIdx: number, colIdx: number, cell: string, isDisabled: boolean) => {
    const colType = columns[colIdx].type;
    const sharedInputClasses = `w-full px-2.5 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-[var(--color-ink)] placeholder-gray-500 dark:placeholder-[var(--color-ink-muted)] focus:outline-none focus:ring-1 focus:ring-lime-500 dark:focus:ring-[var(--color-neon-lime)] focus:border-transparent text-xs transition ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-white/[0.02] border-gray-300 dark:border-white/5' : 'hover:border-gray-400 dark:hover:border-white/20'}`;

    switch (colType) {
      case 'text':
        return <input type="text" value={cell} onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)} disabled={isDisabled} placeholder="…" className={sharedInputClasses} />;
      case 'number':
        return <input type="number" value={cell} onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)} disabled={isDisabled} placeholder="…" className={sharedInputClasses} />;
      case 'email':
        return <input type="email" value={cell} onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)} disabled={isDisabled} placeholder="…" className={sharedInputClasses} />;
      case 'date':
        return <input type="date" value={cell} onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)} disabled={isDisabled} className={sharedInputClasses} />;
      case 'checkbox':
        return <input type="checkbox" checked={cell === 'true'} onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.checked ? 'true' : 'false')} disabled={isDisabled} className={`w-4 h-4 cursor-pointer accent-lime-600 dark:accent-[var(--color-neon-lime)] transition ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`} />;
      case 'radio':
        return <input type="radio" checked={cell === 'true'} onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.checked ? 'true' : 'false')} disabled={isDisabled} className={`w-4 h-4 cursor-pointer accent-lime-600 dark:accent-[var(--color-neon-lime)] transition ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`} />;
      case 'select':
        return (
          <select value={cell} onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)} disabled={isDisabled} className={`w-full px-2.5 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-lime-500 dark:focus:ring-[var(--color-neon-lime)] focus:border-transparent text-xs transition ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-white/[0.02] border-gray-300 dark:border-white/5' : 'hover:border-gray-400 dark:hover:border-white/20'}`}>
            <option value="">—</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full glass border border-white/10 rounded-lg overflow-auto">
      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 bg-white/5 sticky top-0 z-10">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold transition-all duration-200 ${
            activeTab === 'create'
              ? 'text-[var(--color-neon-lime)] bg-[var(--color-neon-lime)]/10 border-b-2 border-[var(--color-neon-lime)]'
              : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-white/5'
          }`}
        >
          <Plus className="w-4 h-4" />
          Create
        </button>
        <button
          onClick={() => setActiveTab('view')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold transition-all duration-200 ${
            activeTab === 'view'
              ? 'text-[var(--color-neon-teal)] bg-[var(--color-neon-teal)]/10 border-b-2 border-[var(--color-neon-teal)]'
              : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-white/5'
          }`}
        >
          <Eye className="w-4 h-4" />
          View
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="w-full space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-1">Create Table</h2>
              <p className="text-sm text-[var(--color-ink-muted)]">Design your table structure with custom columns and rows. Columns and rows can be text or images.</p>
            </div>

            {/* Table Name Card */}
            <div className="bg-white dark:bg-gradient-to-br dark:from-white/[0.08] dark:to-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl p-5 backdrop-blur-sm hover:border-gray-300 dark:hover:border-white/20 transition shadow-sm dark:shadow-none">
              <label className="block text-sm font-semibold text-gray-800 dark:text-[var(--color-ink)] mb-2.5">Table Name</label>
              <input
                type="text"
                placeholder="e.g., Customer Survey, Product Feedback..."
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-[var(--color-ink)] placeholder-gray-500 dark:placeholder-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime)] focus:border-transparent transition text-base"
              />
            </div>

            {/* Columns Card */}
            <div className="bg-white dark:bg-gradient-to-br dark:from-white/[0.08] dark:to-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl p-5 backdrop-blur-sm hover:border-gray-300 dark:hover:border-white/20 transition shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-[var(--color-ink)]">Columns</label>
                  <p className="text-xs text-gray-600 dark:text-[var(--color-ink-muted)] mt-1">Define your table structure. Add text or image headers.</p>
                </div>
                <span className="inline-flex items-center justify-center w-7 h-7 bg-[var(--color-neon-lime)]/30 dark:bg-[var(--color-neon-lime)]/20 text-[var(--color-neon-lime)] text-xs font-bold rounded-full">{columns.length}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-5 p-3 bg-gray-100 dark:bg-white/[0.03] rounded-lg min-h-12">
                {columns.map((col, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-lime-100 dark:bg-[var(--color-neon-lime)]/15 border border-lime-300 dark:border-[var(--color-neon-lime)]/40 rounded-lg group hover:border-lime-400 dark:hover:border-[var(--color-neon-lime)]/60 transition">
                    {col.imageUrl ? (
                      <div className="relative">
                        <img src={col.imageUrl} alt={col.name} className="h-14 w-14 object-cover rounded" />
                        <button
                          onClick={() => removeColumnImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setUploadingColumnIdx(idx);
                          columnImageInputRef.current?.click();
                        }}
                        className="h-14 w-14 flex items-center justify-center rounded bg-white/20 hover:bg-white/30 transition text-xs"
                        title="Upload image"
                      >
                        <Upload className="w-6 h-6" />
                      </button>
                    )}
                    <div className="flex flex-col gap-0.5 flex-1">
                      <input
                        type="text"
                        value={col.name}
                        onChange={(e) => {
                          const newColumns = [...columns];
                          newColumns[idx].name = e.target.value;
                          setColumns(newColumns);
                        }}
                        className="bg-transparent text-xs font-semibold text-lime-700 dark:text-[var(--color-neon-lime)] outline-none focus:bg-white dark:focus:bg-white/5 focus:px-2 focus:py-1 focus:rounded transition max-w-[120px]"
                      />
                      <select
                        value={col.type}
                        onChange={(e) => {
                          const newColumns = [...columns];
                          newColumns[idx].type = e.target.value as any;
                          setColumns(newColumns);
                        }}
                        className="bg-transparent text-[10px] text-gray-600 dark:text-[var(--color-ink-muted)] outline-none focus:bg-white dark:focus:bg-white/5 focus:px-1 focus:py-0.5 focus:rounded transition max-w-[100px]"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="date">Date</option>
                        <option value="select">Select</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="radio">Radio</option>
                      </select>
                    </div>
                    <button
                      onClick={() => handleRemoveColumn(idx)}
                      className="text-red-500 dark:text-red-400 opacity-0 group-hover:opacity-100 transition text-lg font-bold"
                      title="Remove column"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Column name..."
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddColumn()}
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-[var(--color-ink)] placeholder-gray-500 dark:placeholder-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime)] focus:border-transparent transition text-sm"
                />
                <select value={newColumnType} onChange={(e) => setNewColumnType(e.target.value as any)} className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime)] focus:border-transparent transition text-sm">
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="date">Date</option>
                  <option value="select">Select</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="radio">Radio</option>
                </select>
                <button onClick={handleAddColumn} className="px-6 py-2.5 bg-lime-200 dark:bg-[var(--color-neon-lime)]/20 text-lime-700 dark:text-[var(--color-neon-lime)] border border-lime-400 dark:border-[var(--color-neon-lime)]/40 rounded-lg hover:bg-lime-300 dark:hover:bg-[var(--color-neon-lime)]/30 hover:border-lime-500 dark:hover:border-[var(--color-neon-lime)]/60 transition text-sm font-semibold">+ Add</button>
              </div>
            </div>

            {/* Rows Card */}
            <div className="bg-white dark:bg-gradient-to-br dark:from-white/[0.08] dark:to-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl p-5 backdrop-blur-sm hover:border-gray-300 dark:hover:border-white/20 transition shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-[var(--color-ink)]">Rows</label>
                  <p className="text-xs text-gray-600 dark:text-[var(--color-ink-muted)] mt-1">Add and name your rows. Add text or image headers.</p>
                </div>
                <span className="inline-flex items-center justify-center w-7 h-7 bg-cyan-200 dark:bg-[var(--color-neon-teal)]/20 text-cyan-700 dark:text-[var(--color-neon-teal)] text-xs font-bold rounded-full">{rows.length}</span>
              </div>
              
              {/* Existing row names display */}
              {rowNames.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5 p-3 bg-gray-100 dark:bg-white/[0.03] rounded-lg min-h-12">
                  {rowNames.map((rowName, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-lime-100 dark:bg-[var(--color-neon-lime)]/15 border border-lime-300 dark:border-[var(--color-neon-lime)]/40 rounded-lg group hover:border-lime-400 dark:hover:border-[var(--color-neon-lime)]/60 transition">
                      {rowName.imageUrl ? (
                        <div className="relative">
                          <img src={rowName.imageUrl} alt={rowName.name} className="h-14 w-14 object-cover rounded" />
                          <button
                            onClick={() => removeRowImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setUploadingRowIdx(idx);
                            rowImageInputRef.current?.click();
                          }}
                          className="h-14 w-14 flex items-center justify-center rounded bg-white/20 hover:bg-white/30 transition text-xs"
                          title="Upload image"
                        >
                          <Upload className="w-6 h-6" />
                        </button>
                      )}
                      <input
                        type="text"
                        value={rowName.name}
                        onChange={(e) => {
                          const newRowNames = [...rowNames];
                          newRowNames[idx].name = e.target.value;
                          setRowNames(newRowNames);
                        }}
                        placeholder={`Row ${idx + 1}`}
                        className="bg-transparent text-xs font-semibold text-lime-700 dark:text-[var(--color-neon-lime)] outline-none focus:bg-white dark:focus:bg-white/5 focus:px-2 focus:py-1 focus:rounded transition max-w-[120px] placeholder-lime-400/70 dark:placeholder-[var(--color-neon-lime)]/50"
                      />
                      <button
                        onClick={() => handleRemoveRow(idx)}
                        className="text-red-500 dark:text-red-400 opacity-0 group-hover:opacity-100 transition text-lg font-bold"
                        title="Remove row"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Number of rows to add..." 
                  value={newRowCount} 
                  onChange={(e) => setNewRowCount(Math.max(1, parseInt(e.target.value) || 1))} 
                  min="1" 
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-[var(--color-ink)] placeholder-gray-500 dark:placeholder-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-teal)] focus:border-transparent transition text-sm" 
                />
                <button onClick={handleAddMultipleRows} className="px-6 py-2.5 bg-lime-200 dark:bg-[var(--color-neon-lime)]/20 text-lime-700 dark:text-[var(--color-neon-lime)] border border-lime-400 dark:border-[var(--color-neon-lime)]/40 rounded-lg hover:bg-lime-300 dark:hover:bg-[var(--color-neon-lime)]/30 hover:border-lime-500 dark:hover:border-[var(--color-neon-lime)]/60 transition text-sm font-semibold whitespace-nowrap">+ Add Rows</button>
              </div>
            </div>

            {/* Table Preview */}
            <div className="bg-white dark:bg-gradient-to-br dark:from-white/[0.08] dark:to-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl p-5 backdrop-blur-sm shadow-sm dark:shadow-none">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-gray-800 dark:text-[var(--color-ink)]">Preview</span>
                <span className="text-xs text-gray-600 dark:text-[var(--color-ink-muted)]">Hover to disable/enable cells</span>
              </div>
              <div className="overflow-x-auto bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg shadow-sm dark:shadow-inner max-h-96">
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="border-b border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-white/5">
                      <th className="px-3 py-3 text-left text-xs font-bold text-cyan-700 dark:text-[var(--color-neon-teal)] min-w-[150px]">Row</th>
                      {columns.map((col, idx) => (
                        <th key={idx} className="px-4 py-3 text-left text-xs font-bold text-lime-700 dark:text-[var(--color-neon-lime)]">
                          {col.imageUrl ? (
                            <div className="flex flex-col items-center gap-2">
                              <img src={col.imageUrl} alt={col.name} className="h-16 w-16 object-cover rounded" />
                              <span className="text-center">{col.name}</span>
                            </div>
                          ) : (
                            <div>
                              <span>{col.name}</span>
                              <div className="text-[9px] text-gray-600 dark:text-[var(--color-ink-muted)] font-normal opacity-70">{col.type}</div>
                            </div>
                          )}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center text-xs font-bold text-cyan-700 dark:text-[var(--color-neon-teal)] w-10">🗑️</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-gray-300 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.08] transition">
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-[var(--color-ink-muted)] font-medium min-w-[150px]">
                          {rowNames[rowIdx]?.imageUrl ? (
                            <div className="flex flex-col items-center gap-2">
                              <img src={rowNames[rowIdx].imageUrl} alt={rowNames[rowIdx].name} className="h-16 w-16 object-cover rounded" />
                              <span className="text-center text-xs">{rowNames[rowIdx].name || `Row ${rowIdx + 1}`}</span>
                            </div>
                          ) : (
                            rowNames[rowIdx]?.name || `Row ${rowIdx + 1}`
                          )}
                        </td>
                        {row.map((cell, colIdx) => {
                          const cellKey = `${rowIdx},${colIdx}`;
                          const isDisabled = disabledCells.has(cellKey);
                          return (
                            <td key={colIdx} className={`px-4 py-2 relative group ${isDisabled ? 'bg-gray-100 dark:bg-white/[0.02]' : ''}`}>
                              {renderCellInput(rowIdx, colIdx, cell, isDisabled)}
                              <button
                                onClick={() => toggleCellDisabled(rowIdx, colIdx)}
                                className={`absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition text-xs font-bold w-6 h-6 flex items-center justify-center rounded backdrop-blur-sm ${isDisabled ? 'bg-green-500/40 dark:bg-green-500/30 text-green-700 dark:text-green-300 border border-green-600 dark:border-green-500/50 hover:bg-green-500/50 dark:hover:bg-green-500/40' : 'bg-yellow-500/40 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-300 border border-yellow-600 dark:border-yellow-500/50 hover:bg-yellow-500/50 dark:hover:bg-yellow-500/40'}`}
                                title={isDisabled ? 'Enable' : 'Disable'}
                              >
                                {isDisabled ? '🔒' : '🔓'}
                              </button>
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => handleRemoveRow(rowIdx)} className="text-red-500 dark:text-red-400 opacity-0 group-hover:opacity-100 transition text-lg font-bold" title="Remove row">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Create Button */}
            <button onClick={handleCreateTable} className="w-full py-3.5 px-6 bg-gradient-to-r from-lime-500 to-lime-500/80 dark:from-[var(--color-neon-lime)] dark:to-[var(--color-neon-lime)]/80 text-black font-bold rounded-lg hover:from-lime-600 hover:to-lime-600/80 dark:hover:from-[var(--color-neon-lime)] dark:hover:to-[var(--color-neon-lime)]/70 active:scale-95 transition-all shadow-lg dark:shadow-[0_0_30px_-8px_rgba(160,212,5,0.5)] text-base">Create Table</button>
          </div>
        )}

        {/* View Tab */}
        {activeTab === 'view' && (
          <div className="w-full">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-[var(--color-ink)] mb-1">View Tables</h2>
              <p className="text-sm text-gray-600 dark:text-[var(--color-ink-muted)]">Your created tables ({tables.length})</p>
            </div>

            {tables.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-700 dark:text-[var(--color-ink-muted)] text-base mb-2">No tables yet</p>
                <p className="text-gray-600 dark:text-[var(--color-ink-muted)] text-sm">Switch to <span className="font-semibold text-lime-700 dark:text-[var(--color-neon-lime)]">Create</span> to build your first table</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tables.map((table) => (
                  <div key={table.id} className="bg-white dark:bg-gradient-to-br dark:from-white/[0.08] dark:to-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl p-5 backdrop-blur-sm hover:border-gray-300 dark:hover:border-white/20 transition group shadow-sm dark:shadow-none">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-lime-700 dark:text-[var(--color-neon-lime)]">{table.name}</h3>
                        <p className="text-xs text-gray-600 dark:text-[var(--color-ink-muted)] mt-1">{table.columns.length} columns • {table.rows.length} rows • {table.createdAt}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => handleDuplicateTable(table)} className="p-2.5 text-cyan-700 dark:text-[var(--color-neon-teal)] bg-cyan-200 dark:bg-[var(--color-neon-teal)]/20 border border-cyan-400 dark:border-[var(--color-neon-teal)]/40 rounded-lg hover:bg-cyan-300 dark:hover:bg-[var(--color-neon-teal)]/30 transition" title="Duplicate">📋</button>
                        <button onClick={() => handleDeleteTable(table.id)} className="p-2.5 text-red-600 dark:text-red-400 bg-red-200 dark:bg-red-500/20 border border-red-400 dark:border-red-500/40 rounded-lg hover:bg-red-300 dark:hover:bg-red-500/30 transition" title="Delete">🗑️</button>
                      </div>
                    </div>
                    <div className="overflow-x-auto bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg shadow-sm dark:shadow-inner">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-white/5">
                            <th className="px-3 py-3 text-left text-xs font-bold text-cyan-700 dark:text-[var(--color-neon-teal)] min-w-[150px]">Row</th>
                            {table.columns.map((col, idx) => (
                              <th key={idx} className="px-4 py-3 text-left text-xs font-bold text-lime-700 dark:text-[var(--color-neon-lime)]">
                                {col.imageUrl ? (
                                  <div className="flex flex-col items-center gap-2">
                                    <img src={col.imageUrl} alt={col.name} className="h-16 w-16 object-cover rounded" />
                                    <span className="text-center">{col.name}</span>
                                  </div>
                                ) : (
                                  <div>
                                    <span>{col.name}</span>
                                    <div className="text-[9px] text-gray-600 dark:text-[var(--color-ink-muted)] font-normal opacity-70">{col.type}</div>
                                  </div>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.map((row, rowIdx) => (
                            <tr key={rowIdx} className="border-b border-gray-300 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.08] transition">
                              <td className="px-3 py-2 text-xs text-gray-600 dark:text-[var(--color-ink-muted)] min-w-[150px]">
                                {table.rowNames?.[rowIdx]?.imageUrl ? (
                                  <div className="flex flex-col items-center gap-2">
                                    <img src={table.rowNames[rowIdx].imageUrl} alt={table.rowNames[rowIdx].name} className="h-16 w-16 object-cover rounded" />
                                    <span className="text-center text-xs">{table.rowNames[rowIdx].name || `Row ${rowIdx + 1}`}</span>
                                  </div>
                                ) : (
                                  table.rowNames?.[rowIdx]?.name || `Row ${rowIdx + 1}`
                                )}
                              </td>
                              {row.map((cell, colIdx) => (
                                <td key={colIdx} className="px-4 py-2 text-xs text-gray-900 dark:text-[var(--color-ink)]">
                                  {table.columns[colIdx].type === 'checkbox' || table.columns[colIdx].type === 'radio' ? (
                                    <input type={table.columns[colIdx].type} checked={cell === 'true'} disabled className="w-4 h-4 cursor-not-allowed" />
                                  ) : (
                                    cell || '—'
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hidden file inputs for image uploads */}
        <input
          ref={columnImageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (uploadingColumnIdx !== null) {
              handleColumnImageUpload(e, uploadingColumnIdx);
            }
          }}
          className="hidden"
        />
        <input
          ref={rowImageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (uploadingRowIdx !== null) {
              handleRowImageUpload(e, uploadingRowIdx);
            }
          }}
          className="hidden"
        />
      </div>
    </div>
  );
}
