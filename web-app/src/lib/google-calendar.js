import { google } from 'googleapis';
import { sql } from './db';

/**
 * Get HR's Google credentials from database
 * @param {number} hrId - HR user ID
 * @returns {Promise<Object>} HR's Google credentials
 */
async function getHRGoogleCredentials(hrId) {
  const result = await sql`
    SELECT google_access_token, google_refresh_token, google_token_expiry
    FROM hrs
    WHERE id = ${hrId}
  `;

  if (result.length === 0 || !result[0].google_refresh_token) {
    throw new Error('HR has not connected Google Calendar');
  }

  return result[0];
}

/**
 * Initialize Google Calendar API client for specific HR
 * @param {number} hrId - HR user ID
 * @returns {Promise<Object>} Authenticated calendar client
 */
async function getCalendarClient(hrId) {
  const credentials = await getHRGoogleCredentials(hrId);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/callback`
  );

  // Set HR's refresh token
  oauth2Client.setCredentials({
    access_token: credentials.google_access_token,
    refresh_token: credentials.google_refresh_token,
  });

  // Handle token refresh automatically
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      // Update stored tokens if new refresh token received
      await sql`
        UPDATE hrs
        SET google_access_token = ${tokens.access_token},
            google_refresh_token = ${tokens.refresh_token}
        WHERE id = ${hrId}
      `;
    } else if (tokens.access_token) {
      // Just update access token
      await sql`
        UPDATE hrs
        SET google_access_token = ${tokens.access_token}
        WHERE id = ${hrId}
      `;
    }
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Create a Google Calendar event with Google Meet link
 * 
 * @param {Object} params - Event parameters
 * @param {number} params.hrId - HR user ID (REQUIRED for per-HR)
 * @param {string} params.summary - Event title
 * @param {string} params.description - Event description
 * @param {string} params.startDateTime - ISO datetime string
 * @param {number} params.durationMinutes - Event duration (default: 60)
 * @param {string[]} params.attendees - Array of attendee emails
 * @returns {Promise<Object>} Event object with meet link
 */
export async function createCalendarEventWithMeet({
  hrId,
  summary,
  description,
  startDateTime,
  durationMinutes = 60,
  attendees = [],
}) {
  try {
    if (!hrId) {
      throw new Error('hrId is required for per-HR calendar integration');
    }

    const calendar = await getCalendarClient(hrId);

    // Calculate end time
    const start = new Date(startDateTime);
    const end = new Date(start.getTime() + durationMinutes * 60000);

    // Create calendar event with Google Meet
    const event = {
      summary,
      description,
      start: {
        dateTime: start.toISOString(),
        timeZone: 'UTC', // You can make this dynamic based on user timezone
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'UTC',
      },
      attendees: attendees.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`, // Unique ID for the meeting
          conferenceSolutionKey: {
            type: 'hangoutsMeet', // This creates Google Meet link
          },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 },      // 30 min before
        ],
      },
    };

    // Insert event into calendar
    const response = await calendar.events.insert({
      calendarId: 'primary', // Use HR's primary calendar
      conferenceDataVersion: 1, // Required for Google Meet
      resource: event,
      sendUpdates: 'all', // Send email invites to attendees
    });

    console.log('Calendar event created:', {
      eventId: response.data.id,
      meetLink: response.data.hangoutLink,
    });

    return {
      eventId: response.data.id,
      meetLink: response.data.hangoutLink,
      htmlLink: response.data.htmlLink,
      startDateTime: response.data.start.dateTime,
      endDateTime: response.data.end.dateTime,
    };
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    throw error;
  }
}

/**
 * 📚 SIMPLIFIED VERSION: For development without Google OAuth
 * Generates a mock meet link for testing
 * Replace this with createCalendarEventWithMeet in production
 */
export async function createMockMeetLink({ startDateTime }) {
  // Generate a realistic-looking Google Meet link
  const meetCode = Math.random().toString(36).substring(2, 12);
  const mockMeetLink = `https://meet.google.com/${meetCode}`;

  console.log('🔧 Development mode: Using mock Google Meet link');

  return {
    eventId: `mock-${Date.now()}`,
    meetLink: mockMeetLink,
    htmlLink: mockMeetLink,
    startDateTime,
  };
}
