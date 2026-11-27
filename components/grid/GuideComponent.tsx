'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Download,
  Loader2,
  RotateCw,
} from 'lucide-react';
import { listSavedGrids, getGridDataById } from '@/services/api';
import { MessageSquare } from 'lucide-react';

type ActiveTab = 'create' | 'preview' | 'load' | 'responses';

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
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Database Grids Loading State
  const [dbGrids, setDbGrids] = useState<any[]>([]);
  const [isLoadingGrids, setIsLoadingGrids] = useState(false);
  const [gridSearchQuery, setGridSearchQuery] = useState('');

  // Responses State
  const [userResponses, setUserResponses] = useState<any[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [currentGridId, setCurrentGridId] = useState<string | null>(null);

  // Track the current grid being previewed (for submitting responses)
  const [currentPreviewGridId, setCurrentPreviewGridId] = useState<string | null>(null);

  // Header image upload refs
  const headerImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ axis: 'row' | 'col'; id: string } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  };

  // Load grids from database
  useEffect(() => {
    if (activeTab === 'load') {
      loadGridsFromDatabase();
    }
  }, [activeTab]);

  // Load responses when Responses tab is active
  useEffect(() => {
    if (activeTab === 'responses') {
      // If dbGrids is empty, load them first
      if (dbGrids.length === 0) {
        loadGridsFromDatabase();
      }
      // Then load responses if gridId is selected
      if (currentGridId) {
        loadResponsesFromDatabase();
      }
    }
  }, [activeTab, currentGridId]);

  // Also load responses when user clicks Refresh button
  const handleRefreshResponses = async () => {
    if (currentGridId) {
      await loadResponsesFromDatabase();
    }
  };

  const loadGridsFromDatabase = async () => {
    setIsLoadingGrids(true);
    try {
      const result = await listSavedGrids({
        search: gridSearchQuery || undefined,
        limit: 50,
      });
      setDbGrids(result.grids || []);
      if (result.grids?.length === 0) {
        showToast('No grids found in database');
      }
    } catch (error) {
      showToast(`Error loading grids: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Load error:', error);
    } finally {
      setIsLoadingGrids(false);
    }
  };

  const loadResponsesFromDatabase = async () => {
    if (!currentGridId) return;
    
    setIsLoadingResponses(true);
    try {
      const { getGridResponses } = await import('@/services/api');
      const result = await getGridResponses(currentGridId);
      
      console.log('[GuideComponent] Responses result:', result);
      console.log('[GuideComponent] Results array:', result.results);
      console.log('[GuideComponent] Results count:', result.count);
      
      // The API already filters responses, so use them directly!
      const responses = result.results || [];
      console.log('[GuideComponent] Using responses directly:', responses.length);
      
      setUserResponses(responses);
      
      if (responses.length === 0) {
        showToast('No responses found for this grid');
      } else {
        showToast(`✓ Loaded ${responses.length} responses`);
      }
    } catch (error) {
      showToast(`Error loading responses: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Responses load error:', error);
    } finally {
      setIsLoadingResponses(false);
    }
  };

  const handleDeleteGridFromDB = async (gridId: string, gridName: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${gridName}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      setIsLoadingGrids(true);
      const { deleteGridData } = await import('@/services/api');
      
      await deleteGridData({ gridId });
      
      // Remove from local list
      setDbGrids((prev) => prev.filter((g) => g.grid_id !== gridId));
      showToast(`✓ Grid "${gridName}" deleted successfully`);
    } catch (error) {
      showToast(`Error deleting grid: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Delete error:', error);
    } finally {
      setIsLoadingGrids(false);
    }
  };

  const handleLoadGridFromDB = async (gridId: string, gridName: string) => {
    try {
      setIsLoadingGrids(true);
      const result = await getGridDataById({ gridId });

      if (result.grid) {
        const { gridType, metadata, cells } = result.grid;
        
        // Convert to local grid format
        const localGrid: SavedGrid = {
          id: gridId,
          title: gridName,
          gridType: gridType as any,
          options: metadata.columns || [],
          columns: (metadata.columns || []).map((col: string, idx: number) => ({
            id: `col-${idx}`,
            label: col,
            customType: 'text' as const,
          })),
          rows: (metadata.rows || []).map((row: string, idx: number) => ({
            id: `row-${idx}`,
            label: row,
          })),
          enabledCells: metadata.enabledCells || {},
          showOptionLabels: true,
          required: false,
          createdAt: new Date().toLocaleString(),
        };

        // If enabledCells is stored in metadata, use it directly
        let enableMap = { ...localGrid.enabledCells };
        
        // If we have a valid enabledCells map from metadata, use it
        if (enableMap && Object.keys(enableMap).length > 0) {
          // Use the stored map as-is
          localGrid.enabledCells = enableMap;
        } else if (cells && Array.isArray(cells)) {
          // Fallback: build enabledCells from template cells in database
          enableMap = {};
          
          // Initialize all cells as disabled
          localGrid.rows.forEach((r) => {
            localGrid.columns.forEach((c) => {
              enableMap[`${r.id}:${c.id}`] = false;
            });
          });

          // Enable only cells that exist in the database as template cells
          cells.forEach((cell: any) => {
            const notes = cell.notes ? (typeof cell.notes === 'string' ? JSON.parse(cell.notes) : cell.notes) : {};
            if (notes.isGridTemplate === true) {
              const matchingRow = localGrid.rows.find(r => r.label === cell.row);
              const matchingCol = localGrid.columns.find(c => c.label === cell.column);
              
              if (matchingRow && matchingCol) {
                const cellKey = `${matchingRow.id}:${matchingCol.id}`;
                enableMap[cellKey] = true;
              }
            }
          });
          
          localGrid.enabledCells = enableMap;
        }

        // Load into builder
        setQuestionTitle(localGrid.title);
        setGridType(localGrid.gridType);
        setSelectionOptions(localGrid.options);
        setColumns(localGrid.columns);
        setRows(localGrid.rows);
        setEnabledCells(localGrid.enabledCells);
        setShowOptionLabels(localGrid.showOptionLabels);
        setRequired(localGrid.required);
        setCurrentPreviewGridId(gridId); // Set the preview grid ID so responses can be submitted
        setActiveTab('create');
        showToast(`✓ Loaded "${gridName}" into editor`);
      }
    } catch (error) {
      showToast(`Error loading grid: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Load error:', error);
    } finally {
      setIsLoadingGrids(false);
    }
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
  const handleSaveGrid = async () => {
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

    // Convert grid structure to MatrixCell format for database
    // KEY FIX: Only save cells that exist in the grid (all with userInput: false initially)
    // This establishes the grid template structure, not user responses
    const matrixCells: Array<{
      row: string;
      column: string;
      userInput?: boolean;
      notes?: Record<string, any> | string;
    }> = [];

    rows.forEach((row) => {
      columns.forEach((col) => {
        const cellKey = `${row.id}:${col.id}`;
        const isEnabled = enabledCells[cellKey] ?? true;

        // Only save enabled cells - this defines which cells the form shows
        if (isEnabled) {
          matrixCells.push({
            row: row.label,
            column: col.label,
            userInput: false, // Grid template starts unchecked
            notes: {
              gridType,
              isGridTemplate: true,
              optionIndex: selectionOptions.indexOf(col.label),
            },
          });
        }
      });
    });

    // Save to database
    try {
      const gridId = `grid_${newGrid.id}`;
      const response = await fetch('/api/grid/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gridId: gridId,
          gridName: questionTitle.trim(),
          gridType: gridType,
          columns: columns.map((c) => c.label),
          rows: rows.map((r) => r.label),
          cells: matrixCells,
          metadata: {
            enabledCells: enabledCells, // Store which cells are enabled/disabled
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast(`Failed to save: ${error.error}`);
        return;
      }

      const saveResult = await response.json();
      setSavedGrids((prev) => [newGrid, ...prev]);
      setCurrentPreviewGridId(gridId); // Store the grid ID for response submission
      setPreviewAnswers({});
      setActiveTab('preview');
      showToast(`✓ Grid template saved! (${saveResult.cellCount} cells in structure)`);
    } catch (error) {
      showToast(`Error saving grid: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Save error:', error);
    }
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
    setCurrentPreviewGridId(grid.id); // Set the preview grid ID so responses can be submitted
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

  // Handler to reset form for new grid
  const handleNewGrid = () => {
    setQuestionTitle('Please rate the following features');
    setSelectionOptions(['Poor', 'Average', 'Good', 'Excellent']);
    setGridType('selection');
    setColumns(createDefaultColumns());
    setRows(createDefaultRows());
    setEnabledCells(buildDefaultEnabledMap(createDefaultRows(), createDefaultColumns()));
    setShowOptionLabels(true);
    setRequired(false);
    setCurrentPreviewGridId(null);
    setActiveTab('create');
    showToast('✓ Ready for new grid');
  };

  // Handler to update an existing grid
  const handleUpdateGrid = async () => {
    if (!currentPreviewGridId) {
      showToast('No grid selected for update');
      return;
    }

    if (!questionTitle.trim()) {
      showToast('Please enter a question title');
      return;
    }

    const activeCount = Object.values(enabledCells).filter(Boolean).length;
    if (activeCount === 0) {
      showToast('Enable at least one cell in the grid.');
      return;
    }

    // Build matrix cells for update
    const matrixCells: Array<{
      row: string;
      column: string;
      userInput?: boolean;
      notes?: Record<string, any> | string;
    }> = [];

    rows.forEach((row) => {
      columns.forEach((col) => {
        const cellKey = `${row.id}:${col.id}`;
        const isEnabled = enabledCells[cellKey] ?? true;

        if (isEnabled) {
          matrixCells.push({
            row: row.label,
            column: col.label,
            userInput: false,
            notes: {
              gridType,
              isGridTemplate: true,
              optionIndex: selectionOptions.indexOf(col.label),
            },
          });
        }
      });
    });

    try {
      const response = await fetch('/api/grid/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gridId: currentPreviewGridId,
          gridName: questionTitle.trim(),
          gridType: gridType,
          columns: columns.map((c) => c.label),
          rows: rows.map((r) => r.label),
          cells: matrixCells,
          metadata: {
            enabledCells: enabledCells,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        showToast(`Failed to update: ${error.error}`);
        return;
      }

      showToast('✓ Grid updated successfully');
      // Refresh the grid list
      await loadGridsFromDatabase();
    } catch (error) {
      showToast('Error updating grid');
      console.error(error);
    }
  };

  return (
    <div className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      {/* Top Mode Switcher Bar */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-void-2)]/70 px-4">
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-display font-bold uppercase tracking-wider transition border-b-2 cursor-pointer ${
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
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-display font-bold uppercase tracking-wider transition border-b-2 cursor-pointer ${
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
          <button
            type="button"
            onClick={() => setActiveTab('load')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-display font-bold uppercase tracking-wider transition border-b-2 cursor-pointer ${
              activeTab === 'load'
                ? 'border-[var(--color-neon-lime)] text-[var(--color-neon-lime)] bg-[var(--color-neon-lime)]/10'
                : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            <Download className="w-4 h-4" />
            Load Grids
            {dbGrids.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-[var(--color-neon-lime)]/20 text-[var(--color-neon-lime)]">
                {dbGrids.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('responses')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-display font-bold uppercase tracking-wider transition border-b-2 cursor-pointer ${
              activeTab === 'responses'
                ? 'border-[var(--color-neon-purple)] text-[var(--color-neon-purple)] bg-[var(--color-neon-purple)]/10'
                : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Responses
            {userResponses.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-[var(--color-neon-purple)]/20 text-[var(--color-neon-purple)]">
                {userResponses.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleNewGrid}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-neon-lime)] text-[var(--color-void)] font-semibold text-xs uppercase tracking-wider hover:bg-[var(--color-neon-lime)]/90 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Grid
          </button>

          {toastMessage && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-neon-lime)]/15 text-[var(--color-neon-lime)] border border-[var(--color-neon-lime)]/30">
              <Sparkles className="w-3.5 h-3.5" />
              {toastMessage}
            </div>
          )}
        </div>
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
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
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
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-ink)] flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[var(--color-neon-teal)]" />
                Live Preview
              </button>
              {currentPreviewGridId && (
                <button
                  type="button"
                  onClick={handleUpdateGrid}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-neon-teal)] to-[var(--color-neon-cyan)] text-[var(--color-on-accent)] font-bold text-xs shadow-[0_4px_20px_-4px_rgba(0,220,180,0.45)] hover:brightness-105 active:scale-98 transition cursor-pointer"
                >
                  Update Grid
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveGrid}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-neon-lime)] to-[var(--color-neon-green)] text-[var(--color-on-accent)] font-bold text-xs shadow-[0_4px_20px_-4px_rgba(160,212,5,0.45)] hover:brightness-105 active:scale-98 transition cursor-pointer"
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
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--color-neon-lime)]/15 text-[var(--color-neon-lime)] border border-[var(--color-neon-lime)]/30 mb-1.5">
                  Live Draft Preview
                </span>
                <h3 className="text-lg font-display font-bold text-[var(--color-ink)]">
                  {questionTitle || 'Untitled Grid Question'}
                  {required && <span className="text-red-400 ml-1">*</span>}
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)] mt-2">
                  Try filling out this grid. Click "Submit Response" to save your answers.
                </p>
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

            {/* Submit Response Button */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={async () => {
                  try {
                    setIsSubmittingResponse(true);
                    
                    // Convert previewAnswers into MatrixCell format
                    // For selection/dropdown/etc: value is the choice (string)
                    // For checkbox: value is boolean true
                    const responseMatrixCells: Array<{
                      row: string;
                      column: string;
                      userInput: boolean;
                      notes?: Record<string, any> | string;
                    }> = [];

                    rows.forEach((row) => {
                      columns.forEach((col) => {
                        const cellKey = `${row.id}:${col.id}`;
                        const isCellEnabled = enabledCells[cellKey] ?? true;

                        if (isCellEnabled) {
                          // Look up the user's response for this cell
                          const userAnswer = previewAnswers[`draft:${cellKey}`];
                          
                          // Check if user has provided any answer
                          // For checkbox: userAnswer === true
                          // For selection/dropdown/rating/etc: userAnswer has a value (string, number, etc)
                          const hasAnswer = userAnswer !== undefined && userAnswer !== null && userAnswer !== '' && userAnswer !== false;
                          
                          if (hasAnswer) {
                            responseMatrixCells.push({
                              row: row.label,
                              column: col.label,
                              userInput: true,
                              notes: {
                                gridType,
                                isUserResponse: true, // Mark as user response, NOT as template
                                answer: userAnswer, // Store the actual answer value
                              },
                            });
                          }
                        }
                      });
                    });

                    if (responseMatrixCells.length === 0) {
                      showToast('Please select at least one option before submitting');
                      setIsSubmittingResponse(false);
                      return;
                    }

                    // Save response to the original grid template
                    if (!currentPreviewGridId) {
                      showToast('Error: Grid ID not found. Please create the grid first.');
                      setIsSubmittingResponse(false);
                      return;
                    }

                    const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    
                    const { submitGridResponse } = await import('@/services/api');
                    const result = await submitGridResponse({
                      gridId: currentPreviewGridId,
                      cells: responseMatrixCells,
                      responseId,
                      responseDateTime: new Date().toISOString(),
                    });

                    showToast(`✓ Response saved! (${responseMatrixCells.length} responses submitted)`);
                    setPreviewAnswers({}); // Clear preview answers after save
                  } catch (error) {
                    showToast(`Error saving response: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    console.error('Response submission error:', error);
                  } finally {
                    setIsSubmittingResponse(false);
                  }
                }}
                disabled={isSubmittingResponse}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-neon-lime)] text-black rounded-lg font-semibold hover:bg-[var(--color-neon-lime)]/90 disabled:opacity-50 transition text-xs"
              >
                {isSubmittingResponse ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Submit Response
                  </>
                )}
              </button>
              <button
                onClick={() => setPreviewAnswers({})}
                disabled={Object.keys(previewAnswers).length === 0}
                className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-void-2)] hover:bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-ink)] disabled:opacity-50 transition"
              >
                Clear
              </button>
            </div>
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

      {/* ==================== LOAD GRIDS TAB ==================== */}
      {activeTab === 'load' && (
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-display font-bold text-[var(--color-ink)]">
                  Load Saved Grids
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                  Browse and load previously saved grids from the database
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search grids by name..."
                  value={gridSearchQuery}
                  onChange={(e) => setGridSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-void-2)] border border-[var(--color-border)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]/60 focus:outline-none focus:border-[var(--color-neon-lime)] transition"
                />
              </div>
              <button
                type="button"
                onClick={loadGridsFromDatabase}
                disabled={isLoadingGrids}
                className="px-4 py-2.5 bg-[var(--color-neon-lime)] text-black rounded-xl font-semibold hover:bg-[var(--color-neon-lime)]/90 disabled:opacity-50 transition flex items-center gap-2 cursor-pointer"
              >
                {isLoadingGrids ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RotateCw className="w-4 h-4" />
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Grids List */}
          <div className="space-y-3">
            {isLoadingGrids ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--color-neon-lime)]" />
                  <p className="text-xs text-[var(--color-ink-muted)]">Loading grids from database...</p>
                </div>
              </div>
            ) : dbGrids.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-[var(--color-border)] text-center">
                <p className="text-sm text-[var(--color-ink-muted)]">No grids found</p>
                <p className="text-xs text-[var(--color-ink-muted)]/60 mt-1">Create a grid in the Grid Builder tab first</p>
              </div>
            ) : (
              dbGrids.map((grid) => (
                <div
                  key={grid.grid_id}
                  className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-void-2)]/50 hover:bg-[var(--color-void-2)] transition space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[var(--color-ink)] truncate">
                        {grid.grid_name}
                      </h4>
                      <p className="text-[11px] text-[var(--color-ink-muted)] mt-1 space-y-1">
                        <span className="block">
                          Type: <span className="capitalize text-[var(--color-neon-lime)]">{grid.grid_type}</span>
                        </span>
                        <span className="block">
                          {grid.rows_count} rows × {grid.columns_count} columns • {grid.total_cells} cells
                        </span>
                        <span className="block font-mono text-[var(--color-ink-muted)]/50">
                          Created: {new Date(grid.created_at).toLocaleDateString()}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadGridFromDB(grid.grid_id, grid.grid_name)}
                        disabled={isLoadingGrids}
                        className="px-4 py-2 rounded-lg border border-[var(--color-neon-lime)] bg-[var(--color-neon-lime)]/10 text-[var(--color-neon-lime)] hover:bg-[var(--color-neon-lime)]/20 disabled:opacity-50 text-xs font-semibold transition whitespace-nowrap cursor-pointer"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentGridId(grid.grid_id);
                          setActiveTab('responses');
                        }}
                        disabled={isLoadingGrids}
                        className="px-4 py-2 rounded-lg border border-[var(--color-neon-purple)] bg-[var(--color-neon-purple)]/10 text-[var(--color-neon-purple)] hover:bg-[var(--color-neon-purple)]/20 disabled:opacity-50 text-xs font-semibold transition whitespace-nowrap cursor-pointer"
                        title="View responses for this grid"
                      >
                        Responses
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGridFromDB(grid.grid_id, grid.grid_name)}
                        disabled={isLoadingGrids}
                        className="p-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 disabled:opacity-50 transition cursor-pointer"
                        title="Delete this grid"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== RESPONSES TAB ==================== */}
      {activeTab === 'responses' && (
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-display font-bold text-[var(--color-ink)]">
                  User Responses
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                  View all responses submitted by users
                </p>
              </div>
              <div className="flex gap-2">
                <select
                  value={currentGridId || ''}
                  onChange={(e) => setCurrentGridId(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--color-void-2)] border border-[var(--color-border)] text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-neon-purple)] transition"
                >
                  <option value="">Select a grid...</option>
                  {dbGrids.map((grid) => (
                    <option key={grid.grid_id} value={grid.grid_id}>
                      {grid.grid_name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={loadResponsesFromDatabase}
                  disabled={isLoadingResponses || !currentGridId}
                  className="px-4 py-2.5 bg-[var(--color-neon-purple)] text-white rounded-xl font-semibold hover:bg-[var(--color-neon-purple)]/90 disabled:opacity-50 transition flex items-center gap-2 cursor-pointer"
                >
                  {isLoadingResponses ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RotateCw className="w-4 h-4" />
                      Refresh
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Responses Display */}
          {isLoadingResponses ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-neon-purple)]" />
                <p className="text-xs text-[var(--color-ink-muted)]">Loading responses...</p>
              </div>
            </div>
          ) : !currentGridId ? (
            <div className="p-8 rounded-xl border border-dashed border-[var(--color-border)] text-center">
              <MessageSquare className="w-8 h-8 text-[var(--color-ink-muted)]/40 mx-auto mb-2" />
              <p className="text-sm text-[var(--color-ink-muted)]">Select a grid to view responses</p>
              <p className="text-xs text-[var(--color-ink-muted)]/60 mt-1">First load a grid from the Load Grids tab</p>
            </div>
          ) : userResponses.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-[var(--color-border)] text-center">
              <MessageSquare className="w-8 h-8 text-[var(--color-ink-muted)]/40 mx-auto mb-2" />
              <p className="text-sm text-[var(--color-ink-muted)]">No responses found</p>
              <p className="text-xs text-[var(--color-ink-muted)]/60 mt-1">Users haven't submitted any responses yet</p>
            </div>
          ) : (
            // Display responses in grid/matrix format
            <div className="space-y-6">
              {/* Group responses by response_id to show each submission separately */}
              {Object.entries(
                userResponses.reduce((acc: Record<string, any[]>, response: any) => {
                  const respId = response.response_id || 'default';
                  if (!acc[respId]) acc[respId] = [];
                  acc[respId].push(response);
                  return acc;
                }, {})
              ).map(([respId, responses]: [string, any], submissionIdx: number) => {
                // Get unique rows and columns from this response set
                const rows = Array.from(new Set((responses as any[]).map((r: any) => r.row_name)));
                const columns = Array.from(new Set((responses as any[]).map((r: any) => r.column_name)));
                
                // Create a map for quick lookup
                const responseMap = new Map(
                  responses.map((r: any) => [`${r.row_name}|${r.column_name}`, r])
                );

                return (
                  <div key={respId || submissionIdx} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-[var(--color-ink)]">
                          Response #{submissionIdx + 1}
                        </h4>
                        <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                          Submitted: {responses[0]?.created_at ? new Date(responses[0].created_at).toLocaleString() : '—'}
                        </p>
                      </div>
                      {responses[0]?.notes && typeof responses[0].notes === 'string' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--color-neon-purple)]/20 text-[var(--color-neon-purple)] text-[10px] font-semibold">
                          {JSON.parse(responses[0].notes)?.gridType ? 
                            JSON.parse(responses[0].notes).gridType.charAt(0).toUpperCase() + JSON.parse(responses[0].notes).gridType.slice(1)
                            : 'Unknown'}
                        </span>
                      )}
                    </div>

                    {/* Grid/Matrix display */}
                    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-void-2)]/60">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                            <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink-muted)] min-w-[150px]">
                              Criteria
                            </th>
                            {columns.map((col) => (
                              <th key={col} className="px-4 py-3 text-center font-semibold text-[var(--color-ink)] border-l border-[var(--color-border)] min-w-[120px]">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                          {rows.map((row) => (
                            <tr key={row} className="hover:bg-[var(--color-surface-hover)] transition">
                              <td className="px-4 py-3 font-medium text-[var(--color-ink)] bg-[var(--color-surface)]/40">
                                {row}
                              </td>
                              {columns.map((col) => {
                                const response = responseMap.get(`${row}|${col}`);
                                return (
                                  <td
                                    key={`${row}|${col}`}
                                    className="px-4 py-3 text-center border-l border-[var(--color-border)]"
                                  >
                                    {response ? (
                                      <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-[var(--color-neon-lime)]/20 text-[var(--color-neon-lime)] font-semibold text-xs border border-[var(--color-neon-lime)]/50">
                                        {(response as any)?.cell_value || '✓'}
                                      </span>
                                    ) : (
                                      <span className="text-[var(--color-ink-muted)]/40">—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
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