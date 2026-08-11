import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validations/auth";
import type { Role, AccountStatus } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    status: AccountStatus;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      status: AccountStatus;
      image?: string | null;
    };
  }
}

interface AppToken {
  id: string;
  role: Role;
  status: AccountStatus;
  [key: string]: unknown;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user || user.deletedAt) return null;

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        if (user.status === "BANNED") {
          throw new Error("This account has been banned. Contact support for details.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const t = token as unknown as AppToken;
      if (user) {
        t.id = user.id!;
        t.role = user.role;
        t.status = user.status;
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as unknown as AppToken;
      session.user.id = t.id;
      session.user.role = t.role;
      session.user.status = t.status;
      return session;
    },
  },
});
