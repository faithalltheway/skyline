import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Event submitted" };

export default function EventSubmittedPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <Card className="p-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-confirmed-bg)] text-[var(--color-confirmed)]">
          <Icon name="check" size={28} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold">Event submitted!</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Thanks for hosting on OnTheSpot. Our moderation team will review your event and let you know once it&apos;s
          approved.
        </p>
        <LinkButton href="/discover" className="mt-6">
          Back to Discover
        </LinkButton>
      </Card>
    </div>
  );
}
