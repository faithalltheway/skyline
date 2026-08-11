import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LinkButton } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/post-login");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-2 font-extrabold text-brand-700 dark:text-brand-300">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white">
            <Icon name="pin" size={18} />
          </span>
          OnTheSpot
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LinkButton href="/login" variant="ghost" size="sm">
            Log in
          </LinkButton>
          <LinkButton href="/register" variant="primary" size="sm">
            Sign up
          </LinkButton>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-24">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Find events built for <span className="text-brand-600">how you move through the world</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">
            OnTheSpot matches nearby concerts, meetups, and festivals against your accessibility, mobility,
            sensory, and accommodation needs — so you know before you go.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/register" size="lg">
              Get started free
            </LinkButton>
            <LinkButton href="/discover" variant="outline" size="lg">
              Browse events
            </LinkButton>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-5 px-4 pb-20 sm:grid-cols-3">
          {[
            {
              icon: "compass",
              title: "Personalized matches",
              body: "Save your accessibility preferences once — see a match score on every event.",
            },
            {
              icon: "shield",
              title: "Verified information",
              body: "Confirmed, not available, or unknown — never guesswork dressed up as accessible.",
            },
            {
              icon: "building",
              title: "Built for hosts too",
              body: "Organizations publish structured accessibility details, not just a paragraph of text.",
            },
          ].map((f) => (
            <Card key={f.title} className="p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                <Icon name={f.icon} size={22} />
              </span>
              <h2 className="mt-4 text-lg font-bold">{f.title}</h2>
              <p className="mt-1 text-sm text-neutral-500">{f.body}</p>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-neutral-500">
        <Link href="/discover" className="hover:underline">
          Explore events
        </Link>{" "}
        · OnTheSpot MVP
      </footer>
    </div>
  );
}
