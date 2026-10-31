import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { UserFeedbackSchema } from '@/lib/schemas';
import { updateInvestigationFeedback } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

import { blockUnauthenticatedProductionApi } from '@/lib/security/public-launch-guard';

import {
  checkRateLimit,
  RateLimitUnavailableError,
} from '@/lib/security/rate-limit';

import {
  readLimitedJson,
  RequestBodyTooLargeError,
  InvalidJsonBodyError,
} from '@/lib/security/read-limited-json';

export const dynamic = 'force-dynamic';

const InvestigationIdSchema = z.string().uuid();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const blocked = blockUnauthenticatedProductionApi();
  if (blocked) return blocked;

  const authResult = await requireUserId();
  if (authResult.response) return authResult.response;

  const idResult = InvestigationIdSchema.safeParse(params.id);

  if (!idResult.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid investigation ID' },
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  try {
    const rateLimit = await checkRateLimit(
      authResult.userId,
      'feedback'
    );

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Feedback limit reached. Try again later.',
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          reset: rateLimit.reset,
        },
        {
          status: 429,
          headers: {
            'Cache-Control': 'no-store',
            'Retry-After': String(
              Math.max(
                1,
                Math.ceil((rateLimit.reset - Date.now()) / 1000)
              )
            ),
          },
        }
      );
    }

    const body = await readLimitedJson(req);
    const parsed = UserFeedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid feedback data' },
        {
          status: 400,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    const updated = await updateInvestigationFeedback(
      idResult.data,
      authResult.userId,
      parsed.data.helpful,
      parsed.data.comment
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Investigation not found' },
        {
          status: 404,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    return NextResponse.json(
      { success: true, data: updated },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (error instanceof RateLimitUnavailableError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service temporarily unavailable. Please try again later.',
        },
        {
          status: 503,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { success: false, error: 'Request body is too large' },
        {
          status: 413,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    if (error instanceof InvalidJsonBodyError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body' },
        {
          status: 400,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    console.error('Failed to record feedback:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to record feedback' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}