"use client"

import { OrganizationSwitcher } from "@clerk/nextjs"

/**
 * OrganizationSwitcher compact pour le header
 * Remplace le StationSelector - 1 Org = 1 Station
 */
export function HeaderOrgSwitcher() {
  return (
    <OrganizationSwitcher
      afterCreateOrganizationUrl="/dashboard"
      afterSelectOrganizationUrl="/dashboard"
      afterLeaveOrganizationUrl="/dashboard"
      hidePersonal={true}
      appearance={{
        elements: {
          rootBox: "w-[140px] md:w-[200px]",
          organizationSwitcherTrigger:
            "w-full h-9 px-3 border border-border rounded-md bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground",
          organizationPreviewMainIdentifier: "truncate font-medium text-sm",
          organizationPreviewSecondaryIdentifier: "hidden",
          organizationSwitcherTriggerIcon: "text-muted-foreground",
        },
      }}
    />
  )
}
