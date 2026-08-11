import Link from "next/link";
import { TopNav } from "./TopNav";
import { Icon } from "@/components/ui/Icon";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: string;
}

export function DashboardShell({
  title,
  navItems,
  children,
}: {
  title: string;
  navItems: DashboardNavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <TopNav />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row">
        <nav aria-label={`${title} navigation`} className="md:w-56 md:shrink-0">
          <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-neutral-400">{title}</p>
          <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {navItems.map((item) => (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className="tap-target flex items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-surface-muted hover:text-foreground dark:text-neutral-300"
                >
                  <Icon name={item.icon} size={18} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
