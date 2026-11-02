import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Ensures unauthenticated calls are blocked in production environments.
 * If Clerk user is authenticated, requests are allowed to proceed.
 */
export async function blockUnauthenticatedProductionApi() {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  try {
    const { userId } = await auth();
    if (userId) {
      return null;
    }
  } catch {
    // If auth resolution throws or is unavailable, block by default
  }

  return NextResponse.json(
    {
      success: false,
      error:
        'This feature requires an active account. Please sign in to continue.',
    },
    {
      status: 401,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
