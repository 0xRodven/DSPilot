import type { TEventColor } from "@/components/full-calendar/types";

export interface IUser {
  id: string;
  name: string;
  picturePath: string | null;
}

export interface IEvent {
  id: number;
  startDate: string;
  endDate: string;
  title: string;
  color: TEventColor;
  description: string;
  user: IUser;
  // Optional opaque external identifier (e.g. a Convex document id) so a
  // generic calendar can persist deletes/updates back to a backing store.
  externalId?: string;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
