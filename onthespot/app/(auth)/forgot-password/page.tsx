import { Card } from "@/components/ui/Card";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-extrabold">Reset your password</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Enter the email on your account and we&apos;ll send you a reset link.
      </p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
    </Card>
  );
}
