import { DashboardShell } from "@/components/layout/DashboardShell";

const NAV = [
  { href: "/admin", label: "Overview", icon: "home" },
  { href: "/admin/moderation", label: "Moderation", icon: "shield" },
  { href: "/admin/events", label: "Events", icon: "compass" },
  { href: "/admin/users", label: "Users", icon: "user" },
  { href: "/admin/partners", label: "Partners", icon: "building" },
  { href: "/admin/reports", label: "Reports", icon: "alert" },
  { href: "/admin/revenue", label: "Revenue", icon: "star" },
  { href: "/admin/audit-log", label: "Audit Log", icon: "clock" },
  { href: "/admin/system", label: "System", icon: "filter" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell title="Admin" navItems={NAV}>
      {children}
    </DashboardShell>
  );
}
