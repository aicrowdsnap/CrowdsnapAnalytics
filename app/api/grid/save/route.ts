// API endpoint to save grid data to TiDB
import { NextRequest, NextResponse } from 'next/server';
import { 
  saveGridMetadata, 
  saveGridRows, 
  saveGridCells,
  matrixCellsToGridCellData 
} from '@/services/gridService';
import { MatrixCell } from '@/types/matrix';

interface SaveGridRequest {
  gridId: string;
  gridName: string;
  gridType: 'text' | 'multi' | 'checkbox';
  columns: string[];
  rows: string[];
  cells: MatrixCell[];
  responseId?: string;
  responseDateTime?: string;
  responseIp?: string;
  responseGuid?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveGridRequest = await request.json();

    // Validate required fields
    if (!body.gridId || !body.gridName || !body.gridType) {
      return NextResponse.json(
        { error: 'Missing required fields: gridId, gridName, gridType' },
        { status: 400 }
      );
    }

    // Save grid metadata
    await saveGridMetadata({
      grid_id: body.gridId,
      grid_name: body.gridName,
      grid_type: body.gridType,
      metadata: {
        columns: body.columns,
        rows: body.rows
      }
    });

    // Save grid rows
    await saveGridRows(body.gridId, body.rows);

    // Convert and save cells
    const gridCellData = matrixCellsToGridCellData(
      body.gridId,
      body.cells,
      body.responseId,
      body.responseDateTime,
      body.responseIp,
      body.responseGuid
    );

    await saveGridCells(gridCellData);

    return NextResponse.json(
      {
        success: true,
        message: 'Grid data saved successfully',
        gridId: body.gridId,
        rowCount: body.rows.length,
        cellCount: body.cells.length
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving grid:', error);
    return NextResponse.json(
      { error: 'Failed to save grid data', details: String(error) },
      { status: 500 }
    );
  }
}
