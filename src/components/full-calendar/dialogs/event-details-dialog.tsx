"use client";

import type { ReactNode } from "react";

import { format, parseISO } from "date-fns";
import { Calendar, Clock, Text, User } from "lucide-react";
import { toast } from "sonner";

import { useCalendar } from "@/components/full-calendar/contexts/calendar-context";
import { AddEditEventDialog } from "@/components/full-calendar/dialogs/add-edit-event-dialog";
import { formatTime } from "@/components/full-calendar/helpers";
import type { IEvent } from "@/components/full-calendar/interfaces";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface IProps {
  event: IEvent;
  children: ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
  const { use24HourFormat, removeEvent } = useCalendar();

  const deleteEvent = (eventId: number) => {
    try {
      removeEvent(eventId);
      toast.success("Event deleted successfully.");
    } catch {
      toast.error("Error deleting event.");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-4 p-4">
            <div className="flex items-start gap-2">
              <User className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Responsible</p>
                <p className="text-muted-foreground text-sm">{event.user.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Start Date</p>
                <p className="text-muted-foreground text-sm">
                  {format(startDate, "EEEE dd MMMM")}
                  <span className="mx-1">at</span>
                  {formatTime(parseISO(event.startDate), use24HourFormat)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">End Date</p>
                <p className="text-muted-foreground text-sm">
                  {format(endDate, "EEEE dd MMMM")}
                  <span className="mx-1">at</span>
                  {formatTime(parseISO(event.endDate), use24HourFormat)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Text className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Description</p>
                <p className="text-muted-foreground text-sm">{event.description}</p>
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2">
          <AddEditEventDialog event={event}>
            <Button variant="outline">Edit</Button>
          </AddEditEventDialog>
          <Button
            variant="destructive"
            onClick={() => {
              deleteEvent(event.id);
            }}
          >
            Delete
          </Button>
        </div>
        <DialogClose />
      </DialogContent>
    </Dialog>
  );
}
