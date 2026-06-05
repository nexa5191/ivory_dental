import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Receipt,
  Package,
  BarChart3,
  Settings,
  Stethoscope,
  MapPin,
  Store,
  FolderOpen,
  LifeBuoy,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/vendors", label: "Vendor", icon: Store },
  { href: "/products", label: "Inventory", icon: Package },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/help", label: "Help & how-to", icon: LifeBuoy },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isNavActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
