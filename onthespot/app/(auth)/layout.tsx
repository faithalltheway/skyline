import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-muted">
      <header className="flex items-center justify-between p-4 sm:p-6">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-brand-700 dark:text-brand-300">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white">
            <Icon name="pin" size={18} />
          </span>
          OnTheSpot
        </Link>
        <ThemeToggle />
      </header>
      <main id="main-content" className="flex flex-1 items-center justify-center p-4 pb-16" tabIndex={-1}>
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
