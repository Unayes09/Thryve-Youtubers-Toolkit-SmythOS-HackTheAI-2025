"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Loader,
  CheckCircle2,
} from "lucide-react";
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

interface CalendarScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scheduleData: {
    dateRange: { start: string; end: string };
    freeTime: Array<{ start: string; end: string; duration: number }>;
  }) => void;
  ideaTitle: string;
}

export function CalendarScheduleModal({
  isOpen,
  onClose,
  onConfirm,
  ideaTitle,
}: CalendarScheduleModalProps) {
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split("T")[0],
    end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freeTimeSlots, setFreeTimeSlots] = useState<
    Array<{ start: string; end: string; duration: number }>
  >([]);

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
      calculateFreeTime(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch events");
      setEvents([]);
      setFreeTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFreeTime = (events: CalendarEvent[]) => {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const freeSlots: Array<{ start: string; end: string; duration: number }> =
      [];

    // Sort events by start time
    const sortedEvents = events
      .filter((event) => event.start && event.end)
      .map((event) => ({
        start: new Date(event.start),
        end: new Date(event.end),
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    // Generate free time slots for each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Skip weekends (optional - you can remove this if you want to include weekends)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Get events for this specific day
      const dayStart = new Date(currentDate);
      dayStart.setHours(9, 0, 0, 0); // Start at 9 AM

      const dayEnd = new Date(currentDate);
      dayEnd.setHours(18, 0, 0, 0); // End at 6 PM

      const dayEvents = sortedEvents.filter((event) => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === currentDate.toDateString();
      });

      // Find free time slots for this day
      let currentTime = new Date(dayStart);

      for (const event of dayEvents) {
        // Check if there's free time before this event
        if (currentTime < event.start && currentTime < dayEnd) {
          const freeStart = new Date(currentTime);
          const freeEnd = new Date(
            Math.min(event.start.getTime(), dayEnd.getTime())
          );

          if (freeEnd > freeStart) {
            const duration =
              (freeEnd.getTime() - freeStart.getTime()) / (1000 * 60 * 60); // hours
            if (duration >= 1) {
              // Only consider slots of 1+ hours
              freeSlots.push({
                start: freeStart.toISOString(),
                end: freeEnd.toISOString(),
                duration: Math.round(duration * 10) / 10,
              });
            }
          }
        }

        // Move current time to after this event
        currentTime = new Date(
          Math.max(currentTime.getTime(), event.end.getTime())
        );
      }

      // Check for free time after the last event of the day
      if (currentTime < dayEnd) {
        const duration =
          (dayEnd.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
        if (duration >= 1) {
          freeSlots.push({
            start: currentTime.toISOString(),
            end: dayEnd.toISOString(),
            duration: Math.round(duration * 10) / 10,
          });
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setFreeTimeSlots(freeSlots);
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      dayName: date.toLocaleDateString("en-US", { weekday: "long" }),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const handleConfirm = () => {
    onConfirm({
      dateRange,
      freeTime: freeTimeSlots,
    });
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Schedule Video Production</span>
          </DialogTitle>
          <DialogDescription>
            Select your availability for "{ideaTitle}" and we'll create a
            production plan that fits your schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range Selection */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Select Date Range</CardTitle>
              <CardDescription>
                Choose the period when you want to plan and shoot your video
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
                      setDateRange((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
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
                  {isLoading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Check Availability"
                  )}
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

          {/* Calendar Events and Free Time */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Existing Events */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Existing Events ({events.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Your scheduled events during this period
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {events.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="mx-auto h-8 w-8 mb-2" />
                      <p>No events scheduled</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {events.map((event) => {
                        const startTime = formatDateTime(event.start);
                        return (
                          <div
                            key={event.id}
                            className="p-3 border rounded-lg bg-gray-50"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-1">
                                  {event.summary}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {startTime.dayName}, {startTime.date} at{" "}
                                  {startTime.time}
                                </p>
                                {event.location && (
                                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {event.location}
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant={
                                  event.status === "confirmed"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {event.status}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Free Time Slots */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Available Time ({freeTimeSlots.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Free time slots for video production
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {freeTimeSlots.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="mx-auto h-8 w-8 mb-2" />
                      <p>No free time slots found</p>
                      <p className="text-xs">Try adjusting your date range</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {freeTimeSlots.map((slot, index) => {
                        const startTime = formatDateTime(slot.start);
                        const endTime = formatDateTime(slot.end);
                        return (
                          <div
                            key={index}
                            className="p-3 border rounded-lg bg-green-50 border-green-200"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-sm">
                                  {startTime.dayName}, {startTime.date}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {startTime.time} - {endTime.time}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="text-green-700 border-green-300"
                              >
                                {slot.duration}h
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Summary */}
          {!isLoading && !error && freeTimeSlots.length > 0 && (
            <Card className="bg-primary/5 border-primary">
              <CardContent className="">
                <p className="text-sm text-primary">
                  We found <strong>{freeTimeSlots.length}</strong> available
                  time slots between <strong>{dateRange.start}</strong> and{" "}
                  <strong>{dateRange.end}</strong>. The AI will create a
                  production plan that fits your schedule.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || freeTimeSlots.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Create Production Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
