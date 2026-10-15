import { NextRequest, NextResponse } from 'next/server';
import { getInvestigationById, deleteInvestigation } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const investigation = await getInvestigationById(params.id);
    if (!investigation) {
      return NextResponse.json(
        { success: false, error: 'Investigation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: investigation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch investigation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteInvestigation(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Investigation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Investigation deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete investigation' },
      { status: 500 }
    );
  }
}

