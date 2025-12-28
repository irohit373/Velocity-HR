import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/auth/google/disconnect
 * Disconnects Google Calendar for the current HR
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove Google tokens from database
    await sql`
      UPDATE hrs
      SET google_access_token = NULL,
          google_refresh_token = NULL,
          google_token_expiry = NULL,
          google_email = NULL
      WHERE id = ${user.userId}
    `;

    console.log(`✅ Google Calendar disconnected for HR ID: ${user.userId}`);

    return NextResponse.json({ 
      message: 'Google Calendar disconnected successfully' 
    });
  } catch (error) {
    console.error('Google disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Google Calendar' },
      { status: 500 }
    );
  }
}
