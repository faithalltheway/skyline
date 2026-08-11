import { Card } from "@/components/ui/Card";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Account suspended" };

export default async function AccountSuspendedPage() {
  const session = await auth();

  return (
    <Card className="p-6 sm:p-8 text-center">
      <h1 className="text-2xl font-extrabold">
        {session?.user.status === "BANNED" ? "Account banned" : "Account suspended"}
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Your account has been {session?.user.status === "BANNED" ? "banned" : "temporarily suspended"} by an
        OnTheSpot administrator. If you believe this is a mistake, contact support.
      </p>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <Button type="submit" variant="outline" className="mt-6">
          Log out
        </Button>
      </form>
    </Card>
  );
}
