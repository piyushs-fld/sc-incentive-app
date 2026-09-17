import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { isCalculatorState, type CalculatorState } from "@/lib/validateState";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KEY = "sc:incentive:calculator:state";

interface Saved { state: CalculatorState; updatedAt: string }

export async function GET() {
  try {
    const saved = await redis.get<Saved>(KEY);
    if (saved && isCalculatorState(saved.state)) {
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
  if (!isCalculatorState(candidate)) {
    return NextResponse.json({ error: "Invalid calculator state — nothing was saved." }, { status: 400 });
  }
  const payload: Saved = { state: candidate, updatedAt: new Date().toISOString() };
  try {
    await redis.set(KEY, payload);
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Could not reach the configuration store." }, { status: 502 });
  }
}
