import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PARTNER_PREFIX = "/partner";
const ADMIN_PREFIX = "/admin";
const AUTHENTICATED_PREFIXES = ["/onboarding", "/profile", "/saved", "/rsvps", "/events/create"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  const isAdmin = pathname.startsWith(ADMIN_PREFIX);
  const isPartnerOnboarding = pathname.startsWith("/partner/onboarding");
  const isPartner = pathname.startsWith(PARTNER_PREFIX) && !isPartnerOnboarding;
  const isAuthenticatedRoute = AUTHENTICATED_PREFIXES.some((p) => pathname.startsWith(p)) || isPartnerOnboarding;

  if ((isAdmin || isPartner || isAuthenticatedRoute) && !user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdmin && user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  // Partner *authorization* (organization membership) is enforced server-side by
  // requireOrganization() on every /partner page and action — the JWT role claim
  // can lag a fresh role upgrade until re-login, so middleware only checks auth here.

  if (user && (user.status === "BANNED" || user.status === "SUSPENDED") && pathname !== "/account-suspended") {
    return NextResponse.redirect(new URL("/account-suspended", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
