import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/auth/google/connect
 * Initiates Google OAuth flow for HR to connect their calendar
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/callback`
    );

    // Generate auth URL with calendar access scope
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Gets refresh token
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'email',
      ],
      prompt: 'consent', // Force consent to get refresh token
      state: user.userId.toString(), // Pass user ID for callback
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google OAuth' },
      { status: 500 }
    );
  }
}
