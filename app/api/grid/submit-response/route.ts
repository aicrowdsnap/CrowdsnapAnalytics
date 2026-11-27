// API endpoint to submit user responses to an existing grid
import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { MatrixCell } from '@/types/matrix';

interface SubmitResponseRequest {
  gridId: string;
  cells: Array<{
    row: string;
    column: string;
    userInput?: boolean;
    notes?: Record<string, any> | string;
  }>;
  responseId?: string;
  responseDateTime?: string;
  responseIp?: string;
  responseGuid?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitResponseRequest = await request.json();

    console.log('Submit response request:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.gridId || !Array.isArray(body.cells)) {
      return NextResponse.json(
        { error: 'Missing required fields: gridId, cells (must be an array)' },
        { status: 400 }
      );
    }

    // If no cells provided, still return success
    if (body.cells.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No responses to save',
          gridId: body.gridId,
          cellCount: 0
        },
        { status: 201 }
      );
    }

    // Save responses directly to the database
    // Ensure user_input = 1 for responses
    const cellsToSave = body.cells.map(cell => {
      let answerValue = '';
      if (cell.notes && typeof cell.notes === 'object' && 'answer' in cell.notes) {
        answerValue = String((cell.notes as any).answer);
      }
      
      return [
        body.gridId,
        cell.row,
        cell.column,
        answerValue, // cell_value
        1, // user_input = 1 for responses (THIS IS KEY!)
        JSON.stringify(cell.notes || {}),
        body.responseId || null,
        body.responseDateTime || null,
        body.responseIp || null,
        body.responseGuid || null
      ];
    });

    const placeholders = cellsToSave.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
    const flatValues = cellsToSave.flat();

    const query = `
      INSERT INTO grid_cells 
      (grid_id, row_name, column_name, cell_value, user_input, notes, response_id, response_datetime, response_ip, response_guid)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        cell_value = VALUES(cell_value),
        user_input = VALUES(user_input),
        notes = VALUES(notes)
    `;

    console.log('Executing insert with', cellsToSave.length, 'cells');
    await executeQuery(query, flatValues);

    return NextResponse.json(
      {
        success: true,
        message: 'Response saved successfully',
        gridId: body.gridId,
        cellCount: cellsToSave.length
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving response:', error);
    return NextResponse.json(
      { error: 'Failed to save response', details: String(error) },
      { status: 500 }
    );
  }
}
