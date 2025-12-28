import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { sql } from '@/lib/db';

/**
 * GET /api/auth/google/callback
 * Handles Google OAuth callback and stores tokens
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // HR user ID
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=${error}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=missing_params', request.url)
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/callback`
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    // Calculate token expiry from Unix timestamp in milliseconds
    // tokens.expiry_date is Unix timestamp (ms), convert to ISO string
    const expiryDate = tokens.expiry_date 
      ? new Date(tokens.expiry_date).toISOString()
      : new Date(Date.now() + 3600000).toISOString(); // Default 1 hour

    // Store tokens in database
    await sql`
      UPDATE hrs
      SET google_access_token = ${tokens.access_token},
          google_refresh_token = ${tokens.refresh_token},
          google_token_expiry = ${expiryDate},
          google_email = ${data.email}
      WHERE id = ${parseInt(state)}
    `;

    console.log(`✅ Google Calendar connected for HR ID: ${state}`);

    return NextResponse.redirect(
      new URL('/dashboard/settings?success=google_connected', request.url)
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=oauth_failed', request.url)
    );
  }
}
