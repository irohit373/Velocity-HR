import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/auth/google/status
 * Check if current HR has Google Calendar connected
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sql`
      SELECT google_refresh_token, google_email
      FROM hrs
      WHERE id = ${user.userId}
    `;

    if (result.length === 0) {
      return NextResponse.json({
        connected: false,
        google_email: null,
      });
    }

    const connected = !!result[0].google_refresh_token;

    return NextResponse.json({
      connected,
      google_email: result[0].google_email,
    });
  } catch (error) {
    console.error('Google status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check Google status' },
      { status: 500 }
    );
  }
}
