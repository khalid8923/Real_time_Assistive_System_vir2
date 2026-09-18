import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export const { GET, POST } = toNextJsHandler(auth);