"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";

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
            "w-full h-9 px-3 border border-input rounded-md bg-background hover:bg-accent transition-colors",
          organizationPreviewMainIdentifier: "truncate font-medium text-sm text-foreground",
          organizationPreviewSecondaryIdentifier: "hidden",
          organizationSwitcherTriggerIcon: "text-muted-foreground",
          // Dropdown styling
          organizationSwitcherPopoverCard: "bg-popover border border-border shadow-lg",
          organizationSwitcherPopoverActions: "border-t border-border",
          organizationSwitcherPopoverActionButton:
            "text-foreground hover:bg-accent [&>span]:text-foreground [&_svg]:text-foreground",
          organizationSwitcherPopoverActionButtonText: "text-foreground",
          organizationSwitcherPopoverActionButtonIcon: "text-foreground",
          organizationSwitcherPopoverActionButtonIconBox: "text-foreground bg-muted [&_svg]:text-foreground",
          organizationPreview: "hover:bg-accent",
          organizationPreviewTextContainer: "[&_*]:text-foreground",
          // Manage org button (gear icon)
          organizationSwitcherPreviewButton:
            "text-muted-foreground hover:text-foreground hover:bg-accent [&_svg]:text-current",
        },
      }}
    />
  );
}
