// Debug endpoint to check database connection and tables
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { pool } = await import('@/lib/db');
    
    const dbName = process.env.DB_NAME || 'crowdsnap_analytics';
    
    // Test connection
    const connection = await pool.getConnection();
    console.log('✓ Database connection successful');
    
    // Check if grid_data table exists
    const tableCheckQuery = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('grid_data', 'grid_rows', 'grid_cells')
    `;
    
    const [tables] = await connection.execute(tableCheckQuery, [dbName] as any);
    console.log('Tables found:', tables);
    
    // Try to count grids
    const countQuery = `SELECT COUNT(*) as count FROM grid_data`;
    const [countResult] = await connection.execute(countQuery, [] as any);
    console.log('Grid count:', countResult);
    
    connection.release();
    
    return NextResponse.json(
      {
        success: true,
        message: 'Database is working',
        db_name: dbName,
        tables_found: tables,
        grid_count: countResult,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Debug error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        db_host: process.env.DB_HOST,
        db_name: process.env.DB_NAME,
      },
      { status: 500 }
    );
  }
}
