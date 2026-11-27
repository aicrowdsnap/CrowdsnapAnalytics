// API endpoint to get user responses for a specific grid
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gridId = searchParams.get('gridId');

    if (!gridId) {
      return NextResponse.json(
        { error: 'gridId is required' },
        { status: 400 }
      );
    }

    console.log(`[Responses API] Fetching responses for gridId: ${gridId}`);

    // Get ALL cells for debugging
    const allCellsQuery = 'SELECT * FROM grid_cells WHERE grid_id = ? ORDER BY created_at DESC';
    const allCells = await executeQuery<any[]>(allCellsQuery, [gridId]);
    
    console.log(`[Responses API] Total cells: ${allCells.length}`);
    
    // Log each cell's user_input status
    allCells.forEach((cell, idx) => {
      try {
        const notesObj = cell.notes ? (typeof cell.notes === 'string' ? JSON.parse(cell.notes) : cell.notes) : {};
        console.log(`  Cell ${idx}: user_input=${cell.user_input}, isGridTemplate=${notesObj.isGridTemplate || false}`);
      } catch (e) {
        console.log(`  Cell ${idx}: user_input=${cell.user_input}, notes parsing failed`);
      }
    });

    // Filter responses: only cells with user_input = 1 AND NOT isGridTemplate
    const userResponses = allCells.filter(cell => {
      // Must have user_input = 1
      if (cell.user_input !== 1 && cell.user_input !== true) {
        return false;
      }
      
      // Check if it's a template cell
      try {
        if (!cell.notes) return true; // No notes = not a template
        
        const notes = typeof cell.notes === 'string' ? JSON.parse(cell.notes) : cell.notes;
        // Skip template cells
        if (notes && notes.isGridTemplate === true) {
          return false;
        }
        return true;
      } catch (e) {
        // If we can't parse notes, treat it as a response
        return true;
      }
    });

    console.log(`[Responses API] Filtered to ${userResponses.length} user responses`);
    userResponses.forEach((r, idx) => {
      console.log(`  Response ${idx}: ${r.row_name} x ${r.column_name} = ${r.cell_value}`);
    });

    return NextResponse.json(
      {
        success: true,
        gridId,
        count: userResponses.length,
        results: userResponses
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching grid responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grid responses', details: String(error) },
      { status: 500 }
    );
  }
}
