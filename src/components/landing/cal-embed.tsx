"use client";

import { type ReactNode, useEffect } from "react";

import { getCalApi } from "@calcom/embed-react";

type CalEmbedProps = {
  trigger: ReactNode;
  /** Namespace for this embed (allows multiple on same page). */
  namespace?: string;
};

export function CalEmbed({ trigger, namespace = "dspilot-demo" }: CalEmbedProps) {
  const calLink = process.env.NEXT_PUBLIC_CAL_LINK;

  useEffect(() => {
    if (!calLink) return;
    (async () => {
      const cal = await getCalApi({ namespace });
      cal("ui", {
        cssVarsPerTheme: {
          light: { "cal-brand": "#2563EB" },
          dark: { "cal-brand": "#2563EB" },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, [calLink, namespace]);

  if (!calLink) {
    return <>{trigger}</>;
  }

  return (
    <span
      data-cal-namespace={namespace}
      data-cal-link={calLink}
      data-cal-config='{"layout":"month_view"}'
      className="inline-block cursor-pointer"
    >
      {trigger}
    </span>
  );
}
