import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Kysely } from "kysely";
import { LibsqlDialect } from "@libsql/kysely-libsql";

export const runtime = "nodejs";

const db = new Kysely({
  dialect: new LibsqlDialect({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  }),
});

export const auth = betterAuth({
  database: {
    db,
    type: "sqlite",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 6,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  user: {
    additionalFields: {
      fullName: {
        type: "string",
        required: false,
      },
      university: {
        type: "string",
        required: false,
      },
      studentId: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "student",
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;