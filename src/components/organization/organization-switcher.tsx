"use client";

import { OrganizationSwitcher as ClerkOrgSwitcher } from "@clerk/nextjs";

interface OrganizationSwitcherProps {
  collapsed?: boolean;
}

export function OrganizationSwitcher({ collapsed = false }: OrganizationSwitcherProps) {
  return (
    <ClerkOrgSwitcher
      afterCreateOrganizationUrl="/dashboard"
      afterSelectOrganizationUrl="/dashboard"
      afterLeaveOrganizationUrl="/dashboard"
      hidePersonal={true}
      appearance={{
        elements: {
          rootBox: collapsed ? "w-10" : "w-full",
          organizationSwitcherTrigger: collapsed ? "p-2 justify-center" : "w-full justify-start px-2 py-2 text-left",
          organizationPreviewMainIdentifier: collapsed ? "hidden" : "truncate font-medium",
          organizationPreviewSecondaryIdentifier: collapsed ? "hidden" : "text-xs text-muted-foreground",
          organizationSwitcherTriggerIcon: collapsed ? "hidden" : "",
        },
      }}
    />
  );
}
