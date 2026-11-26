// API endpoint to search grid data
import { NextRequest, NextResponse } from 'next/server';
import { searchGridCells, getGridMetadata } from '@/services/gridService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gridId = searchParams.get('gridId');
    const searchText = searchParams.get('search');
    const rowName = searchParams.get('rowName');
    const columnName = searchParams.get('columnName');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    if (!gridId) {
      return NextResponse.json(
        { error: 'gridId is required' },
        { status: 400 }
      );
    }

    // Get grid metadata
    const metadata = await getGridMetadata(gridId);
    if (!metadata) {
      return NextResponse.json(
        { error: 'Grid not found' },
        { status: 404 }
      );
    }

    // Search grid cells
    const results = await searchGridCells(gridId, searchText || '', {
      rowName: rowName || undefined,
      columnName: columnName || undefined,
      limit,
      offset
    });

    return NextResponse.json(
      {
        success: true,
        gridId,
        gridName: metadata.grid_name,
        gridType: metadata.grid_type,
        searchQuery: {
          text: searchText || '',
          rowName: rowName || '',
          columnName: columnName || ''
        },
        pagination: {
          limit,
          offset,
          count: results.length
        },
        results
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error searching grid:', error);
    return NextResponse.json(
      { error: 'Failed to search grid data', details: String(error) },
      { status: 500 }
    );
  }
}
