import { NextRequest, NextResponse } from 'next/server';
import { UserFeedbackSchema } from '@/lib/schemas';
import { updateInvestigationFeedback } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = UserFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid feedback data' },
        { status: 400 }
      );
    }

    const updated = await updateInvestigationFeedback(
      params.id,
      parsed.data.helpful,
      parsed.data.comment
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Investigation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}

