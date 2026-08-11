"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { PRIMARY_NAV } from "./nav-items";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function TopNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/discover" className="flex items-center gap-2 font-extrabold text-brand-700 dark:text-brand-300">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white">
            <Icon name="pin" size={18} />
          </span>
          <span className="hidden text-lg sm:inline">OnTheSpot</span>
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {PRIMARY_NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "tap-target flex items-center gap-1.5 rounded-control px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-surface-muted hover:text-foreground dark:text-neutral-300",
                      active && "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
                    )}
                  >
                    <Icon name={item.icon} size={18} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {status === "authenticated" && session.user.role === "PARTNER" && (
            <LinkButton href="/partner" variant="outline" size="sm" className="hidden sm:inline-flex">
              Partner
            </LinkButton>
          )}
          {status === "authenticated" && session.user.role === "ADMIN" && (
            <LinkButton href="/admin" variant="outline" size="sm" className="hidden sm:inline-flex">
              Admin
            </LinkButton>
          )}
          {status === "authenticated" ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="tap-target flex items-center gap-1 rounded-control px-2 py-1.5 hover:bg-surface-muted"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800 dark:bg-brand-800 dark:text-brand-100">
                  {session.user.name?.[0]?.toUpperCase() ?? "U"}
                </span>
                <Icon name="chevronDown" size={16} />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 rounded-card border border-border bg-surface p-1.5 shadow-lg"
                >
                  <Link
                    role="menuitem"
                    href="/profile"
                    className="block rounded-control px-3 py-2 text-sm hover:bg-surface-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="block w-full rounded-control px-3 py-2 text-left text-sm hover:bg-surface-muted"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : status === "unauthenticated" ? (
            <div className="flex items-center gap-2">
              <LinkButton href="/login" variant="ghost" size="sm">
                Log in
              </LinkButton>
              <LinkButton href="/register" variant="primary" size="sm">
                Sign up
              </LinkButton>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
