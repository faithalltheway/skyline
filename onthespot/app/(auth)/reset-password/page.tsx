import { Card } from "@/components/ui/Card";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-extrabold">Choose a new password</h1>
      {!token ? (
        <p className="mt-4 text-sm text-neutral-500">
          This link is missing a reset token. Please use the link from your email.
        </p>
      ) : (
        <div className="mt-6">
          <ResetPasswordForm token={token} />
        </div>
      )}
    </Card>
  );
}
