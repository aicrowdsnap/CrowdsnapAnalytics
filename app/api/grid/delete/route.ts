// API endpoint to delete a grid and all its related data
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gridId } = body;

    if (!gridId) {
      return NextResponse.json(
        { error: 'gridId is required' },
        { status: 400 }
      );
    }

    console.log('Deleting grid:', gridId);

    const { deleteGrid } = await import('@/services/gridService');
    
    // Delete grid metadata and all related cells (cascade delete handled by DB)
    await deleteGrid(gridId);

    return NextResponse.json(
      {
        success: true,
        message: 'Grid deleted successfully',
        gridId: gridId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting grid:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to delete grid', details: errorMessage },
      { status: 500 }
    );
  }
}
