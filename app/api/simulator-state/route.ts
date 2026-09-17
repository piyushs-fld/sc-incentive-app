import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { isSimState } from "@/lib/validateState";
import type { SimState } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KEY = "sc:incentive:simulator:state";

interface Saved { state: SimState; updatedAt: string }

export async function GET() {
  try {
    const saved = await redis.get<Saved>(KEY);
    if (saved && isSimState(saved.state)) {
      return NextResponse.json({ state: saved.state, updatedAt: saved.updatedAt ?? null });
    }
    return NextResponse.json({ state: null, updatedAt: null });
  } catch {
    /* Store unavailable — the app keeps its current defaults. */
    return NextResponse.json({ state: null, updatedAt: null });
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
    body && typeof body === "object" && "state" in (body as object)
      ? (body as { state: unknown }).state
      : body;
  if (!isSimState(candidate)) {
    return NextResponse.json({ error: "Invalid simulator state — nothing was saved." }, { status: 400 });
  }
  const payload: Saved = { state: candidate, updatedAt: new Date().toISOString() };
  try {
    await redis.set(KEY, payload);
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Could not reach the configuration store." }, { status: 502 });
  }
}
