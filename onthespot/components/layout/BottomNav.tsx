"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_NAV } from "./nav-items";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-between">
        {MOBILE_NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "tap-target flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-neutral-500",
                  active && "text-brand-700 dark:text-brand-300",
                )}
              >
                <Icon name={item.icon} size={22} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
