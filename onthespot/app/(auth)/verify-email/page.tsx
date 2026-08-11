import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { verifyEmailToken } from "./actions";

export const metadata = { title: "Verify email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token
    ? await verifyEmailToken(token)
    : { success: false, message: "No verification token was provided." };

  return (
    <Card className="p-6 sm:p-8 text-center">
      <h1 className="text-2xl font-extrabold">{result.success ? "Email verified" : "Verification failed"}</h1>
      <p className="mt-2 text-sm text-neutral-500">{result.message}</p>
      <LinkButton href="/discover" className="mt-6">
        Continue to OnTheSpot
      </LinkButton>
    </Card>
  );
}
