# Google Calendar OAuth Setup Guide

This guide explains how to set up Google Calendar OAuth 2.0 integration for per-HR scheduling with Google Meet.

## Overview

Each HR can connect their own Google Calendar account through the Settings page. When scheduling interviews, the system will:
- Create calendar events in the HR's Google Calendar
- Generate Google Meet links automatically
- Send invitations to candidates with meet links
- Store tokens securely in the database per HR

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google Calendar API
   - Google People API (for email verification)

### 2. Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in required fields:
   - App name: "Velocity-H Recruitment"
   - User support email: your-email@example.com
   - Developer contact: your-email@example.com
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.email`
5. Add test users (HRs who will connect their calendars during development)
6. Save and continue

### 3. Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: "Velocity-H Web App"
5. Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://your-domain.com/api/auth/google/callback`
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

### 4. Configure Environment Variables

Add to `.env.local`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

**Important:** Never commit `.env.local` to version control!

### 5. Update Database Schema

The following columns should already exist in the `hrs` table:
- `google_access_token` (TEXT) - Current access token
- `google_refresh_token` (TEXT) - Refresh token for long-term access
- `google_token_expiry` (TIMESTAMP) - Token expiration time
- `google_email` (VARCHAR) - Connected Google account email

If not, run the migration:
```bash
node scripts/add-google-oauth-columns.mjs
```

## Usage Flow

### For HR Users

1. **Connect Google Calendar:**
   - Navigate to **Dashboard** → **Settings**
   - Click **Connect Google Calendar**
   - Authorize the app in Google's consent screen
   - You'll be redirected back with a success message

2. **Schedule Interviews:**
   - Go to **Recruitment** page
   - Click **Schedule** button for any applicant
   - Select date/time and add notes
   - System automatically creates Google Meet link in your calendar
   - Candidate receives email with meeting details

3. **Disconnect Google Calendar:**
   - Go to **Settings**
   - Click **Disconnect Google Calendar**
   - Tokens will be removed from database
   - Future interviews will use mock links until reconnected

### For Developers

**OAuth Endpoints:**

- `GET /api/auth/google/status` - Check connection status
- `GET /api/auth/google/connect` - Initiate OAuth flow
- `GET /api/auth/google/callback` - Handle OAuth callback
- `POST /api/auth/google/disconnect` - Remove Google connection

**Scheduling Flow:**

1. HR clicks "Schedule Interview" in ApplicantTable
2. POST to `/api/scheduling` with applicant_id, job_id, interview_time, notes
3. System checks if HR has `google_refresh_token` in database:
   - **Yes:** Call `createCalendarEventWithMeet({ hrId, ... })` for real Google Meet
   - **No:** Call `createMockMeetLink()` for development
4. Save schedule to database with meet link
5. Update applicant status to "scheduled"
6. Send email invitation to candidate with meeting details

## Security Considerations

### Token Storage
- Access tokens are stored in database (encrypted at rest by Neon)
- Refresh tokens allow long-term access without re-authentication
- Tokens are scoped per HR user (isolation)

### Token Refresh
- Access tokens expire after 1 hour
- `google-calendar.js` automatically refreshes tokens when expired
- New tokens are stored back in database

### Best Practices
- Never log tokens in production
- Use HTTPS in production for OAuth callbacks
- Validate HR ownership before using their tokens
- Handle token expiry gracefully with fallbacks

## Troubleshooting

### "redirect_uri_mismatch" Error
- Ensure redirect URI in Google Cloud Console exactly matches `GOOGLE_REDIRECT_URI`
- Check for trailing slashes, http vs https

### "Access blocked: This app's request is invalid"
- Verify all required scopes are added in OAuth consent screen
- Check that APIs (Calendar, People) are enabled

### "Invalid grant" Error
- Refresh token may be revoked
- Ask HR to disconnect and reconnect Google Calendar

### Mock Links Still Generated
- Check if HR has connected Google Calendar in Settings
- Verify `google_refresh_token` exists in database for that HR
- Check console logs for Google API errors

## Testing

### Local Development
1. Use `http://localhost:3000/api/auth/google/callback` as redirect URI
2. Add your test Google accounts to OAuth consent screen
3. Mock links will be used if credentials not configured

### Production Deployment
1. Update redirect URI to production domain
2. Publish OAuth consent screen (if using External type)
3. Monitor logs for successful calendar event creation

## API Reference

### createCalendarEventWithMeet()

```javascript
import { createCalendarEventWithMeet } from '@/lib/google-calendar';

const meetData = await createCalendarEventWithMeet({
  hrId: 'hr-user-id',                    // Required: HR's user ID
  summary: 'Interview: John Doe',         // Required: Event title
  description: 'Interview for SDE role',  // Optional: Event description
  startDateTime: '2024-01-15T10:00:00Z', // Required: ISO 8601 datetime
  durationMinutes: 60,                    // Optional: Default 60 minutes
  attendeeEmail: 'candidate@example.com', // Optional: Invite candidate
});

// Returns: { meetLink: 'https://meet.google.com/xxx-yyyy-zzz' }
```

### Google Calendar Library

The `google-calendar.js` module handles:
- Per-HR credential fetching from database
- Automatic token refresh with expiry tracking
- Calendar event creation with Google Meet conferencing
- Error handling and fallback to mock links

## Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Meet API Reference](https://developers.google.com/calendar/api/guides/create-events#conferencing)

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify environment variables are set correctly
3. Test with Google OAuth Playground: https://developers.google.com/oauthplayground/
