
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function requireUserId() {
  const { userId } = await auth();

  if (!userId) {
    return {
      userId: null,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        {
          status: 401,
          headers: { 'Cache-Control': 'no-store' },
        }
      ),
    };
  }

  return {
    userId,
    response: null,
  };
}
