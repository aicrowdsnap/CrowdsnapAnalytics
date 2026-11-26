// API endpoint to get grid details by ID
import { NextRequest, NextResponse } from 'next/server';
import { MatrixCell } from '@/types/matrix';

export async function GET(request: NextRequest) {
  try {
    const { getGridMetadata, getGridCells } = await import('@/services/gridService');
    
    const searchParams = request.nextUrl.searchParams;
    const gridId = searchParams.get('gridId');

    if (!gridId) {
      return NextResponse.json(
        { error: 'gridId is required' },
        { status: 400 }
      );
    }

    console.log('Getting grid:', gridId);

    // Get grid metadata
    const metadata = await getGridMetadata(gridId);
    if (!metadata) {
      console.log('Grid not found:', gridId);
      return NextResponse.json(
        { error: 'Grid not found' },
        { status: 404 }
      );
    }

    // Get all cells for this grid
    const cells = await getGridCells(gridId);

    // Convert to MatrixCell format
    const matrixCells: MatrixCell[] = cells.map(cell => ({
      row: cell.row_name,
      column: cell.column_name,
      userInput: cell.user_input,
      notes: cell.notes
    }));

    return NextResponse.json(
      {
        success: true,
        grid: {
          gridId: metadata.grid_id,
          gridName: metadata.grid_name,
          gridType: metadata.grid_type,
          metadata: metadata.metadata,
          cells: matrixCells,
          totalCells: cells.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting grid:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to get grid', details: errorMessage },
      { status: 500 }
    );
  }
}
