// API endpoint to list all saved grids
import { NextRequest, NextResponse } from 'next/server';

interface GridInfo {
  id: number;
  grid_id: string;
  grid_name: string;
  grid_type: string;
  columns_count: number;
  rows_count: number;
  total_cells: number;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    // Import dynamically to handle connection errors
    const { executeQuery } = await import('@/lib/db');
    
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.max(1, Math.min(100, searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50)); // 1-100
    const offset = Math.max(0, searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0);
    const search = searchParams.get('search');

    // Build query with LIMIT as literal values, not parameters
    let query = `
      SELECT 
        g.id,
        g.grid_id,
        g.grid_name,
        g.grid_type,
        g.created_at,
        g.updated_at,
        0 as columns_count,
        0 as rows_count,
        0 as total_cells
      FROM grid_data g
      WHERE 1=1
    `;

    const params: any[] = [];

    if (search && search.trim()) {
      query += ` AND g.grid_name LIKE ?`;
      params.push(`%${search}%`);
    }

    // Build LIMIT clause with literal integers (not parameters)
    query += ` ORDER BY g.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    console.log('Executing list query:', query);
    console.log('Query params:', params);
    
    const results = await executeQuery<any[]>(query, params);
    console.log('Query results count:', results.length);

    // Get detailed stats for each grid
    const gridsWithStats = await Promise.all(
      results.map(async (grid) => {
        try {
          const statsQuery = `
            SELECT 
              COUNT(DISTINCT column_name) as columns_count,
              COUNT(DISTINCT row_name) as rows_count,
              COUNT(DISTINCT id) as total_cells
            FROM grid_cells
            WHERE grid_id = ?
          `;
          const stats = await executeQuery<any[]>(statsQuery, [grid.grid_id]);
          return {
            ...grid,
            columns_count: stats[0]?.columns_count || 0,
            rows_count: stats[0]?.rows_count || 0,
            total_cells: stats[0]?.total_cells || 0,
          };
        } catch (err) {
          console.error('Error getting stats for grid:', grid.grid_id, err);
          return grid;
        }
      })
    );

    return NextResponse.json(
      {
        success: true,
        pagination: {
          limit,
          offset,
          count: gridsWithStats.length,
        },
        grids: gridsWithStats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error listing grids:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to list grids', 
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
