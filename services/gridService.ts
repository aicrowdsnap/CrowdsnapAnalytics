// Grid/Matrix data service
import { executeQuery, escapeFTQuery } from '@/lib/db';
import { MatrixCell } from '@/types/matrix';

export interface GridData {
  grid_id: string;
  grid_name: string;
  grid_type: 'text' | 'multi' | 'checkbox';
  metadata: {
    columns: string[];
    rows: string[];
  };
}

export interface GridCellData {
  grid_id: string;
  row_name: string;
  column_name: string;
  cell_value?: string;
  user_input?: boolean;
  notes?: Record<string, any> | string;
  response_id?: string;
  response_datetime?: string;
  response_ip?: string;
  response_guid?: string;
}

export interface SearchResult {
  id: number;
  grid_id: string;
  row_name: string;
  column_name: string;
  cell_value: string;
  user_input: boolean;
  notes: any;
  created_at: string;
}

// Save grid metadata
export async function saveGridMetadata(gridData: GridData): Promise<boolean> {
  try {
    const query = `
      INSERT INTO grid_data (grid_id, grid_name, grid_type, metadata)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        grid_name = VALUES(grid_name),
        grid_type = VALUES(grid_type),
        metadata = VALUES(metadata),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await executeQuery(query, [
      gridData.grid_id,
      gridData.grid_name,
      gridData.grid_type,
      JSON.stringify(gridData.metadata)
    ]);
    
    return true;
  } catch (error) {
    console.error('Error saving grid metadata:', error);
    throw error;
  }
}

// Save grid rows
export async function saveGridRows(gridId: string, rows: string[]): Promise<boolean> {
  try {
    // Delete existing rows for this grid
    await executeQuery('DELETE FROM grid_rows WHERE grid_id = ?', [gridId]);
    
    // Insert new rows
    if (rows.length > 0) {
      const values = rows.flatMap((row, index) => [gridId, row, index]);
      const placeholders = rows.map(() => '(?, ?, ?)').join(',');
      
      const query = `
        INSERT INTO grid_rows (grid_id, row_name, row_order)
        VALUES ${placeholders}
      `;
      
      await executeQuery(query, values);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving grid rows:', error);
    throw error;
  }
}

// Save grid cells - ONLY save cells where user has actually checked (userInput = true)
export async function saveGridCells(cells: GridCellData[]): Promise<boolean> {
  try {
    // Filter to only save cells where user_input is explicitly true
    // Don't save unchecked cells to avoid database bloat and confusion
    const cellsToSave = cells.filter(cell => cell.user_input === true);
    
    if (cellsToSave.length === 0) {
      // If no cells are checked, still success but no rows inserted
      return true;
    }
    
    const values = cellsToSave.flatMap(cell => [
      cell.grid_id,
      cell.row_name,
      cell.column_name,
      cell.cell_value || null,
      true, // Always true since we filtered
      cell.notes ? JSON.stringify(cell.notes) : null,
      cell.response_id || null,
      cell.response_datetime || null,
      cell.response_ip || null,
      cell.response_guid || null
    ]);
    
    const placeholders = cellsToSave.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
    
    const query = `
      INSERT INTO grid_cells 
      (grid_id, row_name, column_name, cell_value, user_input, notes, response_id, response_datetime, response_ip, response_guid)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        cell_value = VALUES(cell_value),
        user_input = VALUES(user_input),
        notes = VALUES(notes)
    `;
    
    await executeQuery(query, values);
    return true;
  } catch (error) {
    console.error('Error saving grid cells:', error);
    throw error;
  }
}

// Search grid cells
export async function searchGridCells(
  gridId: string,
  searchText: string,
  options?: {
    rowName?: string;
    columnName?: string;
    limit?: number;
    offset?: number;
  }
): Promise<SearchResult[]> {
  try {
    let query = 'SELECT * FROM grid_cells WHERE grid_id = ?';
    const params: any[] = [gridId];
    
    if (searchText && searchText.trim()) {
      // Use FULLTEXT search if search text provided
      const ftQuery = escapeFTQuery(searchText);
      query += ` AND MATCH(cell_value) AGAINST(? IN BOOLEAN MODE)`;
      params.push(ftQuery);
    }
    
    if (options?.rowName) {
      query += ` AND row_name LIKE ?`;
      params.push(`%${options.rowName}%`);
    }
    
    if (options?.columnName) {
      query += ` AND column_name LIKE ?`;
      params.push(`%${options.columnName}%`);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    if (options?.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
      
      if (options?.offset) {
        query += ` OFFSET ?`;
        params.push(options.offset);
      }
    }
    
    const results = await executeQuery<SearchResult[]>(query, params);
    return results;
  } catch (error) {
    console.error('Error searching grid cells:', error);
    throw error;
  }
}

// Get grid metadata
export async function getGridMetadata(gridId: string): Promise<GridData | null> {
  try {
    const query = 'SELECT * FROM grid_data WHERE grid_id = ?';
    const results = await executeQuery<GridData[]>(query, [gridId]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Error getting grid metadata:', error);
    throw error;
  }
}

// Get all cells for a grid
export async function getGridCells(gridId: string): Promise<SearchResult[]> {
  try {
    const query = 'SELECT * FROM grid_cells WHERE grid_id = ? ORDER BY row_name, column_name';
    const results = await executeQuery<SearchResult[]>(query, [gridId]);
    return results;
  } catch (error) {
    console.error('Error getting grid cells:', error);
    throw error;
  }
}

// Delete grid and all related data
export async function deleteGrid(gridId: string): Promise<boolean> {
  try {
    const query = 'DELETE FROM grid_data WHERE grid_id = ?';
    await executeQuery(query, [gridId]);
    return true;
  } catch (error) {
    console.error('Error deleting grid:', error);
    throw error;
  }
}

// Convert MatrixCell[] to GridCellData[]
export function matrixCellsToGridCellData(
  gridId: string,
  cells: MatrixCell[],
  responseId?: string,
  responseDateTime?: string,
  responseIp?: string,
  responseGuid?: string
): GridCellData[] {
  return cells.map(cell => ({
    grid_id: gridId,
    row_name: cell.row,
    column_name: cell.column,
    user_input: cell.userInput === true || cell.userInput === 'true' ? true : false,
    notes: cell.notes,
    response_id: responseId,
    response_datetime: responseDateTime,
    response_ip: responseIp,
    response_guid: responseGuid
  }));
}

// Get only user response cells (cells where userInput = true or isUserResponse flag is set)
export async function getGridResponses(gridId: string): Promise<SearchResult[]> {
  try {
    const query = `
      SELECT * FROM grid_cells 
      WHERE grid_id = ? AND user_input = true
      ORDER BY created_at DESC
    `;
    const results = await executeQuery<SearchResult[]>(query, [gridId]);
    return results;
  } catch (error) {
    console.error('Error getting grid responses:', error);
    throw error;
  }
}
