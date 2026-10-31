
import { NextRequest, NextResponse } from 'next/server';
import { getInvestigationById, deleteInvestigation } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { blockUnauthenticatedProductionApi } from '@/lib/security/public-launch-guard';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const blocked = blockUnauthenticatedProductionApi();
  if (blocked) return blocked;

  const authResult = await requireUserId();
  if (authResult.response) return authResult.response;

  try {
    const investigation = await getInvestigationById(
      params.id,
      authResult.userId
    );

    if (!investigation) {
      return NextResponse.json(
        { success: false, error: 'Investigation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: investigation },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    console.error('Failed to fetch investigation:', error);
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
  const blocked = blockUnauthenticatedProductionApi();
  if (blocked) return blocked;

  const authResult = await requireUserId();
  if (authResult.response) return authResult.response;

  try {
    const deleted = await deleteInvestigation(
      params.id,
      authResult.userId
    );

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
    console.error('Failed to delete investigation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete investigation' },
      { status: 500 }
    );
  }
}
