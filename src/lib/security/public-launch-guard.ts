import { NextResponse } from 'next/server';

export function blockUnauthenticatedProductionApi() {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  return NextResponse.json(
    {
      success: false,
      error:
        'This feature is temporarily unavailable while account security is being configured.',
    },
    {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

