"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, ExternalLink } from "lucide-react";
import { LoadingPage } from "@/components/loading/LoadingPage";

interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  location: string;
  attendees: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
  htmlLink: string;
  status: string;
  creator: {
    email: string;
    displayName?: string;
  };
  organizer: {
    email: string;
    displayName?: string;
  };
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split("T")[0],
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });

  const fetchEvents = async () => {
    if (!dateRange.start || !dateRange.end) {
      setError("Please select both start and end dates");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const timeMin = new Date(dateRange.start).toISOString();
      const timeMax = new Date(dateRange.end).toISOString();

      const response = await fetch(
        `/api/calendar/events?timeMin=${timeMin}&timeMax=${timeMax}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch events");
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch events");
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const getResponseStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "tentative":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getResponseStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "Accepted";
      case "declined":
        return "Declined";
      case "tentative":
        return "Tentative";
      case "needsAction":
        return "No Response";
      default:
        return status;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            View and manage your Google Calendar events
          </p>
        </div>
      </div>

      {/* Date Range Picker */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date Range</CardTitle>
          <CardDescription>
            Choose the date range to fetch events from your Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <Button onClick={fetchEvents} disabled={isLoading}>
              {isLoading ? "Loading..." : "Fetch Events"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingPage
            message="Fetching your calendar events..."
            fullScreen={false}
          />
        </div>
      )}

      {/* Events List */}
      {!isLoading && !error && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Events ({events.length})</h2>
            {events.length > 0 && (
              <Badge variant="outline">
                {dateRange.start} to {dateRange.end}
              </Badge>
            )}
          </div>

          {events.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No events found</h3>
                  <p className="text-muted-foreground">
                    No events found in the selected date range.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => {
                const startTime = formatDateTime(event.start);
                const endTime = formatDateTime(event.end);

                return (
                  <Card
                    key={event.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {event.summary}
                          </CardTitle>
                          {event.description && (
                            <CardDescription className="line-clamp-2">
                              {event.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              event.status === "confirmed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {event.status}
                          </Badge>
                          {event.htmlLink && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(event.htmlLink, "_blank")
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Date and Time */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {startTime.date} at {startTime.time} -{" "}
                            {endTime.time}
                          </span>
                        </div>

                        {/* Location */}
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}

                        {/* Attendees */}
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Users className="h-4 w-4" />
                              <span>Attendees ({event.attendees.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {event.attendees.map((attendee, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <span className="font-medium">
                                    {attendee.displayName || attendee.email}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={getResponseStatusColor(
                                      attendee.responseStatus
                                    )}
                                  >
                                    {getResponseStatusText(
                                      attendee.responseStatus
                                    )}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Organizer */}
                        {event.organizer && (
                          <div className="text-xs text-muted-foreground">
                            Organized by:{" "}
                            {event.organizer.displayName ||
                              event.organizer.email}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
