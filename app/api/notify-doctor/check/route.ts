import { NextRequest, NextResponse } from "next/server";
import { getUnseenReply, markReplySeen } from "@/lib/db/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key")?.trim();

  if (!key || key.length < 4) {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }

  try {
    const reply = await getUnseenReply(key);

    if (!reply) {
      return NextResponse.json(
        { ok: true, reply: null },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    await markReplySeen(reply.id);

    return NextResponse.json(
      {
        ok: true,
        reply: {
          type: reply.replyType,
          at: reply.repliedAt,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[notify-doctor/check]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}