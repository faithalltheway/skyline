import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; registered?: string }>;
}) {
  const params = await searchParams;
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-extrabold">Welcome back</h1>
      <p className="mt-1 text-sm text-neutral-500">Log in to find accessible events near you.</p>
      {params.registered && (
        <p className="mt-4 rounded-control bg-[var(--color-confirmed-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-confirmed)]">
          Account created! You can now log in.
        </p>
      )}
      <div className="mt-6">
        <LoginForm callbackUrl={params.callbackUrl ?? "/post-login"} />
      </div>
      <p className="mt-6 text-center text-sm text-neutral-500">
        New to OnTheSpot?{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
