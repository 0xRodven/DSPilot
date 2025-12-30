import type { Appearance } from "@clerk/types"

/**
 * Configuration d'apparence Clerk pour supporter le dark mode
 * Les couleurs utilisent les variables CSS du thème shadcn
 */
export const clerkAppearance: Appearance = {
  variables: {
    // Utiliser nos variables CSS pour la cohérence
    colorPrimary: "hsl(var(--primary))",
    colorDanger: "hsl(var(--destructive))",
    colorSuccess: "hsl(142.1 76.2% 36.3%)",
    colorWarning: "hsl(48 96% 53%)",
    colorBackground: "hsl(var(--background))",
    colorInputBackground: "hsl(var(--card))",
    colorInputText: "hsl(var(--card-foreground))",
    colorText: "hsl(var(--foreground))",
    colorTextSecondary: "hsl(var(--muted-foreground))",
    borderRadius: "0.625rem",
  },
  elements: {
    // Root containers
    rootBox: "font-sans",
    card: "bg-card border border-border shadow-none",

    // Form elements
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
    formFieldInput: "bg-card border-border text-card-foreground",
    formFieldLabel: "text-foreground",

    // Organization switcher trigger (header)
    organizationSwitcherTrigger:
      "bg-transparent border-0 text-foreground hover:bg-accent/50 transition-colors",
    organizationPreviewMainIdentifier: "text-foreground font-medium",
    organizationSwitcherTriggerIcon: "text-muted-foreground",

    // Organization switcher popover
    organizationSwitcherPopoverCard: "bg-popover border border-border shadow-lg",
    organizationSwitcherPopoverActions: "border-t border-border",
    organizationSwitcherPopoverActionButton: "text-foreground hover:bg-accent [&_svg]:text-foreground",
    organizationSwitcherPopoverActionButtonText: "text-foreground",
    organizationSwitcherPopoverActionButtonIcon: "text-foreground",
    organizationSwitcherPopoverActionButtonIconBox: "text-foreground [&_svg]:text-foreground",
    organizationPreview: "hover:bg-accent",
    organizationPreviewTextContainer: "text-foreground",
    organizationPreviewSecondaryIdentifier: "text-muted-foreground",

    // Manage organization button
    organizationSwitcherPreviewButton: "text-foreground hover:bg-accent [&_svg]:text-muted-foreground",

    // User button
    userButtonPopoverCard: "bg-popover border border-border shadow-lg",
    userButtonPopoverMain: "bg-popover",
    userButtonPopoverActions: "border-t border-border bg-muted/50",
    userButtonPopoverActionButton: "text-foreground hover:bg-accent",
    userButtonPopoverFooter: "hidden",

    // Profile pages
    profileSectionContent: "bg-card",
    profileSectionPrimaryButton: "bg-primary text-primary-foreground hover:bg-primary/90",

    // Navbar in profile
    navbar: "bg-card border-r border-border",
    navbarButton: "text-foreground hover:bg-accent",

    // Page elements
    pageScrollBox: "bg-card",
    headerTitle: "text-foreground",
    headerSubtitle: "text-muted-foreground",

    // Badges
    badge: "bg-muted text-muted-foreground",

    // Dividers
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground",

    // Alerts
    alertText: "text-foreground",

    // Table elements (members list)
    tableHead: "text-muted-foreground border-b border-border",
    tableBodyRow: "border-b border-border hover:bg-accent/50",

    // Modal/overlay
    modalBackdrop: "bg-background/80 backdrop-blur-sm",
    modalContent: "bg-card border border-border",
  },
}
