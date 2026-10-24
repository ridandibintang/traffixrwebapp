import {
  Building2,
  ChartColumn,
  FileText,
  LayoutDashboard,
  Link2,
  ScanSearch,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

// Admin sidebar. One entry per module in the blueprint; pages beyond
// Dashboard are placeholders until their phase is built.
export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Building2 },
  { label: "Content", href: "/content", icon: FileText },
  { label: "Audits", href: "/audits", icon: ScanSearch },
  { label: "Off-page", href: "/off-page", icon: Link2 },
  { label: "Reports", href: "/reports", icon: ChartColumn },
];
