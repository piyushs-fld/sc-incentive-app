import { NextResponse } from "next/server";
import { CONFIG_KEY, redis } from "@/lib/redis";
import { DEF, clone } from "@/lib/config";
import { isConfig } from "@/lib/validate";
import type { Config } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const saved = await redis.get<Config>(CONFIG_KEY);
    if (saved && isConfig(saved)) return NextResponse.json({ config: saved, source: "redis" });
    return NextResponse.json({ config: clone(DEF), source: "default" });
  } catch {
    /* Store unavailable — fall back to defaults rather than breaking the UI. */
    return NextResponse.json({ config: clone(DEF), source: "default" });
  }
}

export async function PUT(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }
  const candidate =
    body && typeof body === "object" && "config" in (body as object)
      ? (body as { config: unknown }).config
      : body;
  if (!isConfig(candidate)) {
    return NextResponse.json(
      { error: "Invalid configuration — active configuration unchanged." },
      { status: 400 }
    );
  }
  try {
    await redis.set(CONFIG_KEY, candidate);
    return NextResponse.json({ config: candidate, source: "redis" });
  } catch {
    return NextResponse.json({ error: "Could not reach the configuration store." }, { status: 502 });
  }
}
