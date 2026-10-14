import { NextResponse } from "next/server";
import { dbHealth } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const startedAt = Date.now();

export async function GET() {
  const db = await dbHealth();

  const status = db.ok ? "ok" : "degraded";
  const httpStatus = db.ok ? 200 : 503;

  return NextResponse.json(
    {
      status,
      timestamp: Date.now(),
      uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
      env: process.env.NODE_ENV,
      db: {
        ok: db.ok,
        latencyMs: db.latencyMs ?? null,
        error: db.error ?? null,
      },
    },
    {
      status: httpStatus,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}