import { useEffect, useState } from "react";

import { useCalendar } from "@/components/full-calendar/contexts/calendar-context";
import { formatTime } from "@/components/full-calendar/helpers";

export function CalendarTimeline() {
  const { use24HourFormat } = useCalendar();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const getCurrentTimePosition = () => {
    const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    return (minutes / 1440) * 100;
  };

  const formatCurrentTime = () => {
    return formatTime(currentTime, use24HourFormat);
  };

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-50 border-primary border-t"
      style={{ top: `${getCurrentTimePosition()}%` }}
    >
      <div className="-left-1.5 -top-1.5 absolute size-3 rounded-full bg-primary" />

      <div className="-left-18 -translate-y-1/2 absolute flex w-16 justify-end bg-background pr-1 font-medium text-primary text-xs">
        {formatCurrentTime()}
      </div>
    </div>
  );
}
