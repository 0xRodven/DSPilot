import {
  AlertTriangle,
  BarChart3,
  Calendar,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  type LucideIcon,
  MessageSquare,
  Settings,
  Upload,
  Users,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

/**
 * Generate sidebar items with dynamic organization name for Stats page
 */
export function getSidebarItems(orgName?: string): NavGroup[] {
  const statsTitle = orgName ? `${orgName} Stats` : "Stats";

  return [
    {
      id: 1,
      label: "Principal",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: statsTitle,
          url: "/dashboard/stats",
          icon: BarChart3,
        },
        {
          title: "Drivers",
          url: "/dashboard/drivers",
          icon: Users,
        },
        {
          title: "Erreurs",
          url: "/dashboard/errors",
          icon: AlertTriangle,
        },
        {
          title: "Import",
          url: "/dashboard/import",
          icon: Upload,
        },
      ],
    },
    {
      id: 2,
      label: "Coaching",
      items: [
        {
          title: "Planification",
          url: "/dashboard/coaching",
          icon: ClipboardList,
        },
        {
          title: "Calendrier",
          url: "/dashboard/coaching/calendar",
          icon: Calendar,
        },
        {
          title: "Recapitulatifs",
          url: "/dashboard/coaching/recaps",
          icon: MessageSquare,
        },
      ],
    },
    {
      id: 3,
      label: "Configuration",
      items: [
        {
          title: "Rapports",
          url: "/dashboard/reports",
          icon: FileText,
        },
        {
          title: "Parametres",
          url: "/dashboard/settings",
          icon: Settings,
        },
      ],
    },
  ];
}

// Backward compatibility export
export const sidebarItems = getSidebarItems();
