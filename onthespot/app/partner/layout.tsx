import { DashboardShell } from "@/components/layout/DashboardShell";

const NAV = [
  { href: "/partner", label: "Overview", icon: "home" },
  { href: "/partner/events", label: "Events", icon: "compass" },
  { href: "/partner/analytics", label: "Analytics", icon: "map" },
  { href: "/partner/profile", label: "Organization profile", icon: "building" },
];

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell title="Partner" navItems={NAV}>
      {children}
    </DashboardShell>
  );
}
