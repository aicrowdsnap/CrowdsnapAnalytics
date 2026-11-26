// Helper utilities for grid operations
import { MatrixCell } from '@/types/matrix';

/**
 * Generate a unique grid ID
 * @param prefix - Prefix for the ID (e.g., 'survey', 'poll')
 * @param identifier - Optional identifier (e.g., poll ID, survey name)
 * @returns Unique grid ID
 */
export function generateGridId(prefix: string, identifier?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  if (identifier) {
    return `${prefix}_${identifier}_${random}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }
  
  return `${prefix}_${timestamp}_${random}`.toLowerCase();
}

/**
 * Convert MatrixCell array to searchable format
 * @param cells - Array of matrix cells
 * @returns Array of searchable strings
 */
export function cellsToSearchableText(cells: MatrixCell[]): string[] {
  return cells
    .filter(cell => cell.notes || cell.userInput)
    .map(cell => {
      let text = '';
      
      if (typeof cell.notes === 'string') {
        text = cell.notes;
      } else if (typeof cell.notes === 'object' && cell.notes !== null) {
        text = Object.values(cell.notes)
          .map(v => String(v))
          .join(' ');
      }
      
      if (cell.userInput) {
        text += ` ${cell.row} ${cell.column}`;
      }
      
      return text.trim();
    })
    .filter(text => text.length > 0);
}

/**
 * Validate grid data before saving
 * @param gridId - Grid ID
 * @param gridName - Grid name
 * @param cells - Matrix cells
 * @returns Validation result with errors array
 */
export function validateGridData(gridId: string, gridName: string, cells: MatrixCell[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!gridId || gridId.trim().length === 0) {
    errors.push('Grid ID is required');
  }
  
  if (!gridName || gridName.trim().length === 0) {
    errors.push('Grid name is required');
  }
  
  if (!cells || cells.length === 0) {
    errors.push('No cells to save');
  }
  
  // Check for duplicate cells (same row-column combination)
  const cellKeys = new Set<string>();
  cells.forEach(cell => {
    const key = `${cell.row}|${cell.column}`;
    if (cellKeys.has(key)) {
      errors.push(`Duplicate cell: ${cell.row} x ${cell.column}`);
    }
    cellKeys.add(key);
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format cell notes for display
 * @param notes - Raw notes from cell
 * @returns Formatted string for display
 */
export function formatCellNotes(notes: any): string {
  if (!notes) return '-';
  
  if (typeof notes === 'string') {
    return notes;
  }
  
  if (typeof notes === 'object' && !Array.isArray(notes)) {
    return Object.values(notes)
      .map(v => String(v))
      .filter(v => v.length > 0)
      .join(' | ');
  }
  
  if (Array.isArray(notes)) {
    return notes
      .map(v => String(v))
      .filter(v => v.length > 0)
      .join(' | ');
  }
  
  return '-';
}

/**
 * Build search query for FULLTEXT search
 * @param searchText - User search input
 * @param mode - Search mode: 'any', 'all', 'phrase', 'boolean'
 * @returns Formatted search query
 */
export function buildSearchQuery(searchText: string, mode: 'any' | 'all' | 'phrase' | 'boolean' = 'boolean'): string {
  if (!searchText) return '';
  
  const cleanText = searchText.trim();
  
  switch (mode) {
    case 'phrase':
      // Exact phrase search
      return `"${cleanText.replace(/"/g, '')}"`;
    
    case 'all':
      // All words must be present
      return cleanText
        .split(/\s+/)
        .map(word => `+${word}*`)
        .join(' ');
    
    case 'any':
      // Any word can match
      return cleanText
        .split(/\s+/)
        .map(word => `${word}*`)
        .join(' ');
    
    case 'boolean':
    default:
      // Boolean mode (default)
      return cleanText
        .split(/\s+/)
        .map(word => {
          if (word.startsWith('-')) {
            return word.startsWith('-+') ? word : `-${word.substring(1)}*`;
          }
          return `+${word}*`;
        })
        .join(' ');
  }
}

/**
 * Calculate grid statistics
 * @param cells - Array of matrix cells
 * @returns Statistics object
 */
export function calculateGridStats(cells: MatrixCell[]): {
  totalCells: number;
  checkedCells: number;
  uncheckedCells: number;
  cellsWithNotes: number;
  uniqueRows: number;
  uniqueColumns: number;
  checkPercentage: number;
} {
  const checkedCells = cells.filter(c => c.userInput === true).length;
  const uncheckedCells = cells.length - checkedCells;
  const cellsWithNotes = cells.filter(c => c.notes).length;
  const uniqueRows = new Set(cells.map(c => c.row)).size;
  const uniqueColumns = new Set(cells.map(c => c.column)).size;
  
  return {
    totalCells: cells.length,
    checkedCells,
    uncheckedCells,
    cellsWithNotes,
    uniqueRows,
    uniqueColumns,
    checkPercentage: cells.length > 0 ? Math.round((checkedCells / cells.length) * 100) : 0
  };
}

/**
 * Export grid data as CSV
 * @param gridName - Grid name
 * @param columns - Column names
 * @param rows - Row names
 * @param cells - Cell data
 * @returns CSV string
 */
export function exportGridAsCSV(
  gridName: string,
  columns: string[],
  rows: string[],
  cells: MatrixCell[]
): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`"${gridName}"`);
  lines.push(''); // Empty line
  
  // Table header
  const headerRow = ['Row', ...columns].map(h => `"${h}"`).join(',');
  lines.push(headerRow);
  
  // Data rows
  rows.forEach(row => {
    const rowData: string[] = [`"${row}"`];
    
    columns.forEach(col => {
      const cell = cells.find(c => c.row === row && c.column === col);
      const value = cell?.userInput ? '✓' : '✗';
      rowData.push(`"${value}"`);
    });
    
    lines.push(rowData.join(','));
  });
  
  return lines.join('\n');
}

/**
 * Parse CSV data into grid cells
 * @param csvData - CSV string
 * @param columns - Expected column names
 * @param rows - Expected row names
 * @returns Array of MatrixCell
 */
export function parseGridFromCSV(csvData: string, columns: string[], rows: string[]): MatrixCell[] {
  const lines = csvData.trim().split('\n');
  const cells: MatrixCell[] = [];
  
  // Skip header rows (first 2 lines)
  for (let i = 2; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
    const rowName = values[0];
    
    // Find matching row
    const matchedRow = rows.find(r => r.includes(rowName) || rowName.includes(r));
    if (!matchedRow) continue;
    
    // Parse cell values
    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
      const cellValue = values[colIdx + 1]?.trim();
      cells.push({
        row: matchedRow,
        column: columns[colIdx],
        userInput: cellValue === '✓' || cellValue === '1'
      });
    }
  }
  
  return cells;
}
