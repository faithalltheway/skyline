import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "Create your account" };

export default function RegisterPage() {
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-extrabold">Create your account</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Join OnTheSpot to discover and host accessible events.
      </p>
      <div className="mt-6">
        <RegisterForm />
      </div>
      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
          Log in
        </Link>
      </p>
    </Card>
  );
}
