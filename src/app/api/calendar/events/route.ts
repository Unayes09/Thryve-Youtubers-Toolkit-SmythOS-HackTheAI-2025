import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get("timeMin");
    const timeMax = searchParams.get("timeMax");

    if (!timeMin || !timeMax) {
      return NextResponse.json(
        { error: "timeMin and timeMax parameters are required" },
        { status: 400 }
      );
    }

    const token = (
      await (
        await clerkClient()
      ).users.getUserOauthAccessToken(user?.id as string, "google")
    ).data[0].token;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in with Google OAuth" },
        { status: 401 }
      );
    }

    // Initialize Google Calendar API with user's OAuth token
    const calendar = google.calendar({
      version: "v3",
      auth: process.env.YOUTUBE_API_KEY, // Using the same Google API key
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Get user's calendar events
    const eventsResponse = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 100,
    });

    if (!eventsResponse.data.items) {
      return NextResponse.json({
        events: [],
        totalEvents: 0,
      });
    }

    // Format the response with calendar events
    const events = eventsResponse.data.items.map((event) => ({
      id: event.id,
      summary: event.summary || "No Title",
      description: event.description || "",
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || "",
      attendees:
        event.attendees?.map((attendee) => ({
          email: attendee.email,
          displayName: attendee.displayName,
          responseStatus: attendee.responseStatus,
        })) || [],
      htmlLink: event.htmlLink || "",
      status: event.status,
      creator: {
        email: event.creator?.email,
        displayName: event.creator?.displayName,
      },
      organizer: {
        email: event.organizer?.email,
        displayName: event.organizer?.displayName,
      },
    }));

    return NextResponse.json({
      events: events,
      totalEvents: events.length,
      timeMin: timeMin,
      timeMax: timeMax,
    });
  } catch (error) {
    console.error("Google Calendar API Error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Google Calendar API Error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
