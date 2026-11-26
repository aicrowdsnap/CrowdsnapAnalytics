'use client';

import React, { useState, useRef } from 'react';
import {
  Plus,
  Eye,
  Upload,
  CheckSquare,
  Type,
  Star,
  ChevronDownSquare,
  MessageCircleQuestion,
  Smile,
  SlidersHorizontal,
  Image as ImageIcon,
  LayoutGrid,
  GripVertical,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  X,
} from 'lucide-react';

type ActiveTab = 'create' | 'preview';

export type GridFieldType =
  | 'selection'
  | 'image'
  | 'checkbox'
  | 'text'
  | 'rating'
  | 'dropdown'
  | 'yesno'
  | 'emoji'
  | 'custom';

interface GridTypeOption {
  id: GridFieldType;
  label: string;
  description: string;
  icon: React.ReactNode;
  accentClass: string;
}

interface AxisHeader {
  id: string;
  label: string;
  imageUrl?: string;
  customType?: Exclude<GridFieldType, 'custom'>;
}

interface SavedGrid {
  id: string;
  title: string;
  gridType: GridFieldType;
  options: string[];
  columns: AxisHeader[];
  rows: AxisHeader[];
  enabledCells: Record<string, boolean>;
  showOptionLabels: boolean;
  required: boolean;
  createdAt: string;
}

const GRID_TYPES: GridTypeOption[] = [
  {
    id: 'selection',
    label: 'Selection',
    description: 'Single selection from options',
    icon: <LayoutGrid className="w-4 h-4" />,
    accentClass: 'text-[var(--color-neon-lime)]',
  },
  {
    id: 'image',
    label: 'Image Upload',
    description: 'Upload images per cell',
    icon: <ImageIcon className="w-4 h-4" />,
    accentClass: 'text-sky-400',
  },
  {
    id: 'checkbox',
    label: 'Checkbox',
    description: 'Multiple selection',
    icon: <CheckSquare className="w-4 h-4" />,
    accentClass: 'text-[var(--color-neon-green)]',
  },
  {
    id: 'text',
    label: 'Text',
    description: 'Short text input',
    icon: <Type className="w-4 h-4" />,
    accentClass: 'text-amber-400',
  },
  {
    id: 'rating',
    label: 'Rating',
    description: 'Star rating (1–5)',
    icon: <Star className="w-4 h-4" />,
    accentClass: 'text-yellow-400',
  },
  {
    id: 'dropdown',
    label: 'Dropdown',
    description: 'Select from list',
    icon: <ChevronDownSquare className="w-4 h-4" />,
    accentClass: 'text-purple-400',
  },
  {
    id: 'yesno',
    label: 'Yes / No',
    description: 'Binary choice',
    icon: <MessageCircleQuestion className="w-4 h-4" />,
    accentClass: 'text-[var(--color-neon-teal)]',
  },
  {
    id: 'emoji',
    label: 'Emoji Rating',
    description: 'Rate with emojis',
    icon: <Smile className="w-4 h-4" />,
    accentClass: 'text-orange-400',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Per-column input types',
    icon: <SlidersHorizontal className="w-4 h-4" />,
    accentClass: 'text-pink-400',
  },
];

const EMOJI_SCALE = [
  { value: '1', emoji: '😠', label: 'Very Poor' },
  { value: '2', emoji: '🙁', label: 'Poor' },
  { value: '3', emoji: '😐', label: 'Neutral' },
  { value: '4', emoji: '🙂', label: 'Good' },
  { value: '5', emoji: '😄', label: 'Excellent' },
];

const createDefaultColumns = (): AxisHeader[] => [
  { id: 'col-1', label: 'Feature A', customType: 'selection' },
  { id: 'col-2', label: 'Feature B', customType: 'text' },
];

const createDefaultRows = (): AxisHeader[] => [
  { id: 'row-1', label: 'Quality' },
  { id: 'row-2', label: 'Performance' },
];

const buildDefaultEnabledMap = (rows: AxisHeader[], cols: AxisHeader[]): Record<string, boolean> => {
  const map: Record<string, boolean> = {};
  rows.forEach((r) => {
    cols.forEach((c) => {
      map[`${r.id}:${c.id}`] = true;
    });
  });
  return map;
};

export default function GuideComponent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('create');

  // Builder State (Defaults: 2 columns, 2 rows, all cells enabled)
  const [gridType, setGridType] = useState<GridFieldType>('selection');
  const [questionTitle, setQuestionTitle] = useState('Please rate the following features');
  const [selectionOptions, setSelectionOptions] = useState<string[]>([
    'Poor',
    'Average',
    'Good',
    'Excellent',
  ]);
  const [newOptionText, setNewOptionText] = useState('');

  const [columns, setColumns] = useState<AxisHeader[]>(createDefaultColumns);
  const [rows, setRows] = useState<AxisHeader[]>(createDefaultRows);
  const [enabledCells, setEnabledCells] = useState<Record<string, boolean>>(() =>
    buildDefaultEnabledMap(createDefaultRows(), createDefaultColumns())
  );

  // Advanced Options
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [showOptionLabels, setShowOptionLabels] = useState(true);
  const [required, setRequired] = useState(false);

  // Saved Grids + Interactive Preview Responses
  const [savedGrids, setSavedGrids] = useState<SavedGrid[]>([]);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Header image upload refs
  const headerImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ axis: 'row' | 'col'; id: string } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  };

  // --- Column & Row Mutations ---
  const handleAddColumn = () => {
    const nextNum = columns.length + 1;
    const newCol: AxisHeader = {
      id: `col-${Date.now()}-${nextNum}`,
      label: `Feature ${String.fromCharCode(64 + nextNum)}`,
      customType: 'text',
    };
    const nextCols = [...columns, newCol];
    setColumns(nextCols);

    setEnabledCells((prev) => {
      const updated = { ...prev };
      rows.forEach((r) => {
        updated[`${r.id}:${newCol.id}`] = true;
      });
      return updated;
    });
  };

  const handleRemoveColumn = (colId: string) => {
    if (columns.length <= 1) return;
    setColumns((prev) => prev.filter((c) => c.id !== colId));
    setEnabledCells((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        if (key.endsWith(`:${colId}`)) delete updated[key];
      });
      return updated;
    });
  };

  const handleAddRow = () => {
    const nextNum = rows.length + 1;
    const newRow: AxisHeader = {
      id: `row-${Date.now()}-${nextNum}`,
      label: `Criteria ${nextNum}`,
    };
    const nextRows = [...rows, newRow];
    setRows(nextRows);

    setEnabledCells((prev) => {
      const updated = { ...prev };
      columns.forEach((c) => {
        updated[`${newRow.id}:${c.id}`] = true;
      });
      return updated;
    });
  };

  const handleRemoveRow = (rowId: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    setEnabledCells((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        if (key.startsWith(`${rowId}:`)) delete updated[key];
      });
      return updated;
    });
  };

  const updateColumn = (colId: string, patch: Partial<AxisHeader>) => {
    setColumns((prev) => prev.map((c) => (c.id === colId ? { ...c, ...patch } : c)));
  };

  const updateRow = (rowId: string, patch: Partial<AxisHeader>) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));
  };

  const toggleCell = (rowId: string, colId: string) => {
    const key = `${rowId}:${colId}`;
    setEnabledCells((prev) => ({
      ...prev,
      [key]: !(prev[key] ?? true),
    }));
  };

  const toggleAllCells = (state: boolean) => {
    const updated: Record<string, boolean> = {};
    rows.forEach((r) => {
      columns.forEach((c) => {
        updated[`${r.id}:${c.id}`] = state;
      });
    });
    setEnabledCells(updated);
  };

  // --- Selection / Dropdown Options Handlers ---
  const handleAddSelectionOption = () => {
    const trimmed = newOptionText.trim();
    if (!trimmed) return;
    setSelectionOptions((prev) => [...prev, trimmed]);
    setNewOptionText('');
  };

  const handleUpdateSelectionOption = (idx: number, val: string) => {
    setSelectionOptions((prev) => prev.map((opt, i) => (i === idx ? val : opt)));
  };

  const handleRemoveSelectionOption = (idx: number) => {
    if (selectionOptions.length <= 1) return;
    setSelectionOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  // --- Header Image Upload ---
  const triggerHeaderImageUpload = (axis: 'row' | 'col', id: string) => {
    setUploadTarget({ axis, id });
    headerImageInputRef.current?.click();
  };

  const handleHeaderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageUrl = ev.target?.result as string;
      if (uploadTarget.axis === 'col') {
        updateColumn(uploadTarget.id, { imageUrl });
      } else {
        updateRow(uploadTarget.id, { imageUrl });
      }
      setUploadTarget(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // --- Save / Reset / Duplicate ---
  const handleSaveGrid = () => {
    if (!questionTitle.trim()) {
      showToast('Please enter a Question Title before creating.');
      return;
    }

    const activeCount = Object.values(enabledCells).filter(Boolean).length;
    if (activeCount === 0) {
      showToast('Enable at least one cell in the grid.');
      return;
    }

    const newGrid: SavedGrid = {
      id: Date.now().toString(),
      title: questionTitle.trim(),
      gridType,
      options: [...selectionOptions],
      columns: columns.map((c) => ({ ...c })),
      rows: rows.map((r) => ({ ...r })),
      enabledCells: { ...enabledCells },
      showOptionLabels,
      required,
      createdAt: new Date().toLocaleString(),
    };

    setSavedGrids((prev) => [newGrid, ...prev]);
    setPreviewAnswers({});
    setActiveTab('preview');
    showToast('Grid created! Viewing respondent preview.');
  };

  const handleLoadIntoBuilder = (grid: SavedGrid) => {
    setQuestionTitle(grid.title);
    setGridType(grid.gridType);
    setSelectionOptions([...grid.options]);
    setColumns(grid.columns.map((c) => ({ ...c })));
    setRows(grid.rows.map((r) => ({ ...r })));
    setEnabledCells({ ...grid.enabledCells });
    setShowOptionLabels(grid.showOptionLabels);
    setRequired(grid.required);
    setActiveTab('create');
    showToast(`Loaded "${grid.title}" into editor.`);
  };

  const handleDuplicateGrid = (grid: SavedGrid) => {
    const copy: SavedGrid = {
      ...grid,
      id: Date.now().toString(),
      title: `${grid.title} (Copy)`,
      createdAt: new Date().toLocaleString(),
    };
    setSavedGrids((prev) => [copy, ...prev]);
    showToast('Grid duplicated.');
  };

  const handleDeleteGrid = (id: string) => {
    setSavedGrids((prev) => prev.filter((g) => g.id !== id));
    showToast('Grid deleted.');
  };

  // --- Respondent Cell Renderer (Preview Mode) ---
  const renderRespondentCell = (
    grid: Pick<SavedGrid, 'gridType' | 'options' | 'showOptionLabels'>,
    col: AxisHeader,
    cellKey: string
  ) => {
    const effectiveType: Exclude<GridFieldType, 'custom'> =
      grid.gridType === 'custom' ? col.customType || 'text' : grid.gridType;

    const currentValue = previewAnswers[cellKey];
    const setCellVal = (val: any) =>
      setPreviewAnswers((prev) => ({
        ...prev,
        [cellKey]: val,
      }));

    switch (effectiveType) {
      case 'selection':
        return (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {grid.options.map((opt, i) => {
              const selected = currentValue === opt;
              return (
                <label
                  key={i}
                  onClick={() => setCellVal(opt)}
                  title={opt}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs cursor-pointer transition select-none ${
                    selected
                      ? 'border-[var(--color-neon-lime)] bg-[var(--color-neon-lime)]/15 text-[var(--color-ink)] font-semibold'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:border-[var(--color-ink-muted)]/40'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      selected
                        ? 'border-[var(--color-neon-lime)]'
                        : 'border-[var(--color-ink-muted)]/50'
                    }`}
                  >
                    {selected && (
                      <span className="w-2 h-2 rounded-full bg-[var(--color-neon-lime)]" />
                    )}
                  </span>
                  {grid.showOptionLabels && <span>{opt}</span>}
                </label>
              );
            })}
          </div>
        );

      case 'dropdown':
        return (
          <select
            value={currentValue || ''}
            onChange={(e) => setCellVal(e.target.value)}
            className="w-full min-w-[130px] px-2.5 py-1.5 rounded-lg bg-[var(--color-void-2)] border border-[var(--color-border)] text-xs text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-neon-lime)]"
          >
            <option value="">Select option...</option>
            {grid.options.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setCellVal(!currentValue)}
              className={`w-5 h-5 rounded border flex items-center justify-center transition ${
                currentValue
                  ? 'bg-[var(--color-neon-lime)] border-[var(--color-neon-lime)] text-[var(--color-on-accent)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-neon-lime)]/60'
              }`}
              aria-label="Toggle response checkbox"
            >
              {currentValue && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          </div>
        );

      case 'text':
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => setCellVal(e.target.value)}
            placeholder="Enter response..."
            className="w-full min-w-[140px] px-2.5 py-1.5 rounded-lg bg-[var(--color-void-2)] border border-[var(--color-border)] text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]/60 focus:outline-none focus:border-[var(--color-neon-lime)]"
          />
        );

      case 'rating':
        return (
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (currentValue || 0) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setCellVal(star)}
                  className="p-0.5 transition-transform hover:scale-110"
                  title={`${star} Star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-4 h-4 ${
                      active
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-[var(--color-ink-muted)]/40'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        );

      case 'emoji':
        return (
          <div className="flex items-center justify-center gap-1.5">
            {EMOJI_SCALE.map((item) => {
              const selected = currentValue === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCellVal(item.value)}
                  title={item.label}
                  className={`text-base p-1 rounded-lg transition ${
                    selected
                      ? 'bg-[var(--color-neon-lime)]/20 ring-1 ring-[var(--color-neon-lime)] scale-110'
                      : 'opacity-65 hover:opacity-100'
                  }`}
                >
                  {item.emoji}
                </button>
              );
            })}
          </div>
        );

      case 'yesno':
        return (
          <div className="inline-flex rounded-lg border border-[var(--color-border)] overflow-hidden">
            {(['Yes', 'No'] as const).map((choice) => {
              const active = currentValue === choice;
              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setCellVal(choice)}
                  className={`px-3 py-1 text-xs font-semibold transition ${
                    active
                      ? choice === 'Yes'
                        ? 'bg-[var(--color-neon-green)] text-white'
                        : 'bg-red-500/80 text-white'
                      : 'bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        );

      case 'image':
        return (
          <div className="flex items-center justify-center">
            {currentValue ? (
              <div className="relative inline-block">
                <img
                  src={currentValue}
                  alt="Uploaded"
                  className="h-12 w-12 object-cover rounded-lg border border-[var(--color-border)]"
                />
                <button
                  type="button"
                  onClick={() => setCellVal(null)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-[var(--color-border)] hover:border-[var(--color-neon-lime)] text-[11px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer transition">
                <Upload className="w-3.5 h-3.5 text-[var(--color-neon-lime)]" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setCellVal(ev.target?.result as string);
                    reader.readAsDataURL(f);
                  }}
                />
              </label>
            )}
          </div>
        );
    }
  };

  // --- Shared Respondent Grid Table Renderer ---
  const renderRespondentGridTable = (grid: Omit<SavedGrid, 'id' | 'createdAt'>, prefix: string) => {
    return (
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-void-2)]/60">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] min-w-[160px]">
                Criteria
              </th>
              {grid.columns.map((col) => (
                <th
                  key={col.id}
                  className="px-4 py-3 text-center font-semibold text-[var(--color-ink)] border-l border-[var(--color-border)] min-w-[160px]"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    {col.imageUrl && (
                      <img
                        src={col.imageUrl}
                        alt={col.label}
                        className="h-10 w-10 rounded-lg object-cover border border-[var(--color-border)]"
                      />
                    )}
                    <span>{col.label || 'Untitled Column'}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {grid.rows.map((row) => (
              <tr key={row.id} className="hover:bg-[var(--color-surface-hover)] transition">
                <td className="px-4 py-3.5 font-semibold text-[var(--color-ink)] bg-[var(--color-surface)]/40">
                  <div className="flex items-center gap-2.5">
                    {row.imageUrl && (
                      <img
                        src={row.imageUrl}
                        alt={row.label}
                        className="h-9 w-9 rounded-lg object-cover border border-[var(--color-border)] shrink-0"
                      />
                    )}
                    <span>{row.label || 'Untitled Row'}</span>
                  </div>
                </td>
                {grid.columns.map((col) => {
                  const rawKey = `${row.id}:${col.id}`;
                  const isCellVisible = grid.enabledCells[rawKey] ?? true;

                  return (
                    <td
                      key={rawKey}
                      className={`px-4 py-3.5 border-l border-[var(--color-border)] text-center align-middle ${
                        !isCellVisible ? 'bg-[var(--color-void)]/40' : ''
                      }`}
                    >
                      {/* Unchecked cells in builder are completely hidden from the user in preview */}
                      {isCellVisible ? (
                        renderRespondentCell(grid, col, `${prefix}:${rawKey}`)
                      ) : (
                        <span className="sr-only">Not applicable</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const showOptionsPanel = gridType === 'selection' || gridType === 'dropdown';
  const activeCellCount = Object.values(enabledCells).filter(Boolean).length;
  const totalCellCount = rows.length * columns.length;

  return (
    <div className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      {/* Top Mode Switcher Bar */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-void-2)]/70 px-4">
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-display font-bold uppercase tracking-wider transition border-b-2 ${
              activeTab === 'create'
                ? 'border-[var(--color-neon-lime)] text-[var(--color-neon-lime)] bg-[var(--color-neon-lime)]/10'
                : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            <Plus className="w-4 h-4" />
            Grid Builder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-display font-bold uppercase tracking-wider transition border-b-2 ${
              activeTab === 'preview'
                ? 'border-[var(--color-neon-teal)] text-[var(--color-neon-teal)] bg-[var(--color-neon-teal)]/10'
                : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            <Eye className="w-4 h-4" />
            User Preview
            {savedGrids.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-[var(--color-neon-teal)]/20 text-[var(--color-neon-teal)]">
                {savedGrids.length}
              </span>
            )}
          </button>
        </div>

        {toastMessage && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-neon-lime)]/15 text-[var(--color-neon-lime)] border border-[var(--color-neon-lime)]/30">
            <Sparkles className="w-3.5 h-3.5" />
            {toastMessage}
          </div>
        )}
      </div>

      {/* ==================== CREATE TAB ==================== */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Sidebar: Grid Type Selector */}
          <aside className="lg:col-span-4 xl:col-span-3 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] bg-[var(--color-void-2)]/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-[var(--color-ink)]">
                Grid Type
              </span>
              <span className="text-[10px] text-[var(--color-ink-muted)]">Select input mode</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {GRID_TYPES.map((item) => {
                const isSelected = gridType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGridType(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[var(--color-neon-lime)] bg-[var(--color-neon-lime)]/12 shadow-[0_0_20px_-8px_rgba(160,212,5,0.45)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
                    }`}
                  >
                    {/* Radio Indicator */}
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-[var(--color-neon-lime)]'
                          : 'border-[var(--color-ink-muted)]/50'
                      }`}
                    >
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[var(--color-neon-lime)]" />
                      )}
                    </span>

                    {/* Type Icon */}
                    <span className={`shrink-0 ${item.accentClass}`}>{item.icon}</span>

                    {/* Label & Subtitle */}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-ink)] truncate">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-[var(--color-ink-muted)] truncate">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Workspace: Question Title, Dynamic Options, Interactive Grid & Advanced */}
          <div className="lg:col-span-8 xl:col-span-9 p-5 md:p-6 space-y-6">
            {/* 1. Question Title */}
            <div className="space-y-2">
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-[var(--color-ink)]">
                Question Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={questionTitle}
                onChange={(e) => setQuestionTitle(e.target.value)}
                placeholder="e.g., Please rate the following features"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-void-2)] border border-[var(--color-border)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]/60 focus:outline-none focus:border-[var(--color-neon-lime)] transition"
              />
            </div>

            {/* 2. Conditional Selection / Dropdown Options Panel */}
            {showOptionsPanel && (
              <div className="p-4 rounded-xl border border-[var(--color-neon-lime)]/35 bg-[var(--color-neon-lime)]/[0.05] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-display font-bold uppercase tracking-wider text-[var(--color-neon-lime)]">
                      {gridType === 'selection' ? 'Selection Options' : 'Dropdown Options'}
                    </h4>
                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      Choices displayed inside every enabled grid cell.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--color-ink-muted)]">
                    {selectionOptions.length} choices
                  </span>
                </div>

                {/* Editable Option Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectionOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-void-2)] border border-[var(--color-border)] focus-within:border-[var(--color-neon-lime)]"
                    >
                      <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleUpdateSelectionOption(idx, e.target.value)}
                        className="flex-1 bg-transparent text-xs text-[var(--color-ink)] outline-none"
                      />
                      {selectionOptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectionOption(idx)}
                          className="text-[var(--color-ink-muted)] hover:text-red-400 transition"
                          title="Remove option"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add New Option Row */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSelectionOption();
                      }
                    }}
                    placeholder="Add another choice (press Enter)..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-void-2)] border border-[var(--color-border)] text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]/60 focus:outline-none focus:border-[var(--color-neon-lime)]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSelectionOption}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-neon-lime)]/20 text-[var(--color-neon-lime)] border border-[var(--color-neon-lime)]/40 hover:bg-[var(--color-neon-lime)]/30 text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Option
                  </button>
                </div>
              </div>
            )}

            {/* 3. Visual WYSIWYG Grid Configuration */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-display font-bold uppercase tracking-wider text-[var(--color-ink)]">
                    Grid Configuration
                  </h4>
                  <p className="text-[11px] text-[var(--color-ink-muted)]">
                    Click any row/column title to edit. Check cells that should collect responses in the preview.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2.5 py-1 rounded-md bg-[var(--color-void-2)] border border-[var(--color-border)] font-mono text-[var(--color-ink-muted)]">
                    Active cells:{' '}
                    <strong className="text-[var(--color-neon-lime)]">
                      {activeCellCount}/{totalCellCount}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleAllCells(activeCellCount < totalCellCount)}
                    className="px-2.5 py-1 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition"
                  >
                    {activeCellCount < totalCellCount ? 'Check All' : 'Uncheck All'}
                  </button>
                </div>
              </div>

              {/* Interactive Spreadsheet Matrix */}
              <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-void-2)]/70">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                      {/* Top-left corner cell */}
                      <th className="px-3 py-3 text-left font-medium text-[var(--color-ink-muted)] min-w-[180px]">
                        Rows \ Columns
                      </th>

                      {/* Editable Column Headers */}
                      {columns.map((col, colIdx) => (
                        <th
                          key={col.id}
                          className="px-3 py-2.5 border-l border-[var(--color-border)] min-w-[165px] group align-top"
                        >
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              {/* Optional Column Thumbnail / Upload Trigger */}
                              {col.imageUrl ? (
                                <div className="relative shrink-0">
                                  <img
                                    src={col.imageUrl}
                                    alt={col.label}
                                    className="w-7 h-7 rounded object-cover border border-[var(--color-border)]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateColumn(col.id, { imageUrl: undefined })}
                                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center"
                                    title="Remove image"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => triggerHeaderImageUpload('col', col.id)}
                                  className="p-1 rounded text-[var(--color-ink-muted)] hover:text-[var(--color-neon-lime)] hover:bg-[var(--color-surface-hover)] transition shrink-0"
                                  title="Attach column image"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Inline Editable Column Input */}
                              <input
                                type="text"
                                value={col.label}
                                onChange={(e) => updateColumn(col.id, { label: e.target.value })}
                                placeholder={`Column ${colIdx + 1}`}
                                className="w-full bg-transparent text-center font-semibold text-[var(--color-ink)] px-1.5 py-1 rounded border border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-neon-lime)] focus:bg-[var(--color-void-2)] outline-none transition"
                              />

                              {/* Delete Column Button */}
                              {columns.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColumn(col.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--color-ink-muted)] hover:text-red-400 transition shrink-0"
                                  title="Delete column"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Per-Column Type Selector when Custom Grid Type is active */}
                            {gridType === 'custom' && (
                              <select
                                value={col.customType || 'text'}
                                onChange={(e) =>
                                  updateColumn(col.id, {
                                    customType: e.target.value as Exclude<GridFieldType, 'custom'>,
                                  })
                                }
                                className="w-full px-2 py-1 rounded bg-[var(--color-void-2)] border border-[var(--color-border)] text-[10px] text-[var(--color-neon-teal)] outline-none"
                              >
                                <option value="selection">Selection</option>
                                <option value="text">Text</option>
                                <option value="checkbox">Checkbox</option>
                                <option value="rating">Rating</option>
                                <option value="dropdown">Dropdown</option>
                                <option value="yesno">Yes / No</option>
                                <option value="emoji">Emoji Rating</option>
                                <option value="image">Image Upload</option>
                              </select>
                            )}
                          </div>
                        </th>
                      ))}

                      {/* "+ Add Column" Slot Right After Last Column */}
                      <th className="p-2 border-l border-[var(--color-border)] min-w-[130px]">
                        <button
                          type="button"
                          onClick={handleAddColumn}
                          className="w-full py-2 px-3 rounded-lg border border-dashed border-[var(--color-neon-lime)]/50 hover:border-[var(--color-neon-lime)] bg-[var(--color-neon-lime)]/5 hover:bg-[var(--color-neon-lime)]/15 text-[var(--color-neon-lime)] font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Column
                        </button>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[var(--color-border)]">
                    {rows.map((row, rowIdx) => (
                      <tr
                        key={row.id}
                        className="group/row hover:bg-[var(--color-surface-hover)]/60 transition"
                      >
                        {/* Editable Row Header */}
                        <td className="px-3 py-2.5 bg-[var(--color-surface)]/30">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="w-3.5 h-3.5 text-[var(--color-ink-muted)]/50 shrink-0" />

                            {row.imageUrl ? (
                              <div className="relative shrink-0">
                                <img
                                  src={row.imageUrl}
                                  alt={row.label}
                                  className="w-7 h-7 rounded object-cover border border-[var(--color-border)]"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateRow(row.id, { imageUrl: undefined })}
                                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center"
                                  title="Remove image"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => triggerHeaderImageUpload('row', row.id)}
                                className="p-1 rounded text-[var(--color-ink-muted)] hover:text-[var(--color-neon-teal)] hover:bg-[var(--color-surface-hover)] transition shrink-0"
                                title="Attach row image"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <input
                              type="text"
                              value={row.label}
                              onChange={(e) => updateRow(row.id, { label: e.target.value })}
                              placeholder={`Row ${rowIdx + 1}`}
                              className="w-full bg-transparent font-medium text-[var(--color-ink)] px-1.5 py-1 rounded border border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-neon-teal)] focus:bg-[var(--color-void-2)] outline-none transition"
                            />

                            {rows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(row.id)}
                                className="opacity-0 group-hover/row:opacity-100 p-1 rounded text-[var(--color-ink-muted)] hover:text-red-400 transition shrink-0"
                                title="Delete row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Cell Visibility Checkboxes */}
                        {columns.map((col) => {
                          const cellKey = `${row.id}:${col.id}`;
                          const isChecked = enabledCells[cellKey] ?? true;

                          return (
                            <td
                              key={cellKey}
                              onClick={() => toggleCell(row.id, col.id)}
                              title={
                                isChecked
                                  ? 'Checked: Shown to user in preview'
                                  : 'Unchecked: Hidden from user in preview'
                              }
                              className={`px-4 py-3 border-l border-[var(--color-border)] text-center cursor-pointer transition select-none ${
                                isChecked
                                  ? 'bg-[var(--color-neon-lime)]/[0.06] hover:bg-[var(--color-neon-lime)]/[0.12]'
                                  : 'bg-[var(--color-void)]/50 opacity-55 hover:opacity-80'
                              }`}
                            >
                              <div className="inline-flex items-center justify-center">
                                <span
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                                    isChecked
                                      ? 'bg-[var(--color-neon-lime)] border-[var(--color-neon-lime)] text-[var(--color-on-accent)]'
                                      : 'border-[var(--color-ink-muted)]/50 bg-transparent'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </span>
                              </div>
                            </td>
                          );
                        })}

                        {/* Trailing spacer aligned under "+ Add Column" */}
                        <td className="border-l border-[var(--color-border)] bg-[var(--color-void)]/20" />
                      </tr>
                    ))}

                    {/* "+ Add Row" Slot Right After Last Row */}
                    <tr>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={handleAddRow}
                          className="w-full py-2 px-3 rounded-lg border border-dashed border-[var(--color-neon-teal)]/50 hover:border-[var(--color-neon-teal)] bg-[var(--color-neon-teal)]/5 hover:bg-[var(--color-neon-teal)]/15 text-[var(--color-neon-teal)] font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Row
                        </button>
                      </td>
                      <td
                        colSpan={columns.length + 1}
                        className="px-4 py-2 text-[11px] text-[var(--color-ink-muted)]"
                      >
                        Uncheck any cell above to hide it on the respondent preview screen.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Collapsible Advanced Options */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-void-2)]/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setAdvancedOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--color-surface-hover)] transition"
              >
                <span className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-[var(--color-ink)]">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-neon-lime)]" />
                  Advanced Options
                </span>
                {advancedOpen ? (
                  <ChevronUp className="w-4 h-4 text-[var(--color-ink-muted)]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--color-ink-muted)]" />
                )}
              </button>

              {advancedOpen && (
                <div className="px-4 pb-4 pt-2 border-t border-[var(--color-border)] space-y-3">
                  {/* Toggle: Show option labels */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-[var(--color-ink)]">
                        Show option labels to users
                      </p>
                      <p className="text-[11px] text-[var(--color-ink-muted)]">
                        Display choice text beside radio buttons in selection grids.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={showOptionLabels}
                      onClick={() => setShowOptionLabels((prev) => !prev)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                        showOptionLabels
                          ? 'bg-[var(--color-neon-lime)]'
                          : 'bg-[var(--color-slate)]'
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          showOptionLabels ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle: Required */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-[var(--color-ink)]">Required</p>
                      <p className="text-[11px] text-[var(--color-ink-muted)]">
                        Require respondents to complete all visible cells before submitting.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={required}
                      onClick={() => setRequired((prev) => !prev)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                        required ? 'bg-[var(--color-neon-lime)]' : 'bg-[var(--color-slate)]'
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          required ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-ink)] flex items-center justify-center gap-2 transition"
              >
                <Eye className="w-4 h-4 text-[var(--color-neon-teal)]" />
                Live Preview
              </button>
              <button
                type="button"
                onClick={handleSaveGrid}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-neon-lime)] to-[var(--color-neon-green)] text-[var(--color-on-accent)] font-bold text-xs shadow-[0_4px_20px_-4px_rgba(160,212,5,0.45)] hover:brightness-105 active:scale-98 transition"
              >
                Create Grid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== USER PREVIEW TAB ==================== */}
      {activeTab === 'preview' && (
        <div className="p-6 space-y-8">
          {/* Active Draft Live Preview */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--color-neon-lime)]/15 text-[var(--color-neon-lime)] border border-[var(--color-neon-lime)]/30 mb-1.5">
                  Live Draft Preview
                </span>
                <h3 className="text-lg font-display font-bold text-[var(--color-ink)]">
                  {questionTitle || 'Untitled Grid Question'}
                  {required && <span className="text-red-400 ml-1">*</span>}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="px-3.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-void-2)] hover:bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-ink)] transition"
              >
                ← Back to Editor
              </button>
            </div>

            {renderRespondentGridTable(
              {
                title: questionTitle,
                gridType,
                options: selectionOptions,
                columns,
                rows,
                enabledCells,
                showOptionLabels,
                required,
              },
              'draft'
            )}
          </div>

          {/* Saved Grids List */}
          {savedGrids.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-[var(--color-border)]">
              <h4 className="text-xs font-display font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Saved Grids ({savedGrids.length})
              </h4>

              {savedGrids.map((grid) => (
                <div
                  key={grid.id}
                  className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-void-2)]/50 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h5 className="text-sm font-bold text-[var(--color-ink)]">
                        {grid.title}
                        {grid.required && <span className="text-red-400 ml-1">*</span>}
                      </h5>
                      <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                        Type: <span className="capitalize text-[var(--color-neon-lime)]">{grid.gridType}</span> •{' '}
                        {grid.rows.length} rows × {grid.columns.length} columns • {grid.createdAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadIntoBuilder(grid)}
                        className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-xs font-medium text-[var(--color-ink)] transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateGrid(grid)}
                        className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-neon-teal)] hover:bg-[var(--color-neon-teal)]/10 transition"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGrid(grid.id)}
                        className="p-1.5 rounded-lg border border-[var(--color-border)] text-red-400 hover:bg-red-500/10 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {renderRespondentGridTable(grid, grid.id)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <input
        ref={headerImageInputRef}
        type="file"
        accept="image/*"
        onChange={handleHeaderImageChange}
        className="hidden"
      />
    </div>
  );
}