import { TIERS } from "@/lib/config";
import type { Config, Tier } from "@/types";

const isNum = (v: unknown): v is number => typeof v === "number" && isFinite(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const isActs = (v: unknown): boolean =>
  Array.isArray(v) && v.every((a) => a && typeof a === "object" && isStr((a as { id: unknown }).id) && isStr((a as { l: unknown }).l));
const isIds = (v: unknown): boolean => Array.isArray(v) && v.every(isStr);

function isTier(t: unknown): t is Tier {
  if (!t || typeof t !== "object") return false;
  const x = t as Record<string, unknown>;
  return isStr(x.label) &&
    isNum(x.mrrPct) && isNum(x.setupPct) && isNum(x.mgrPct) &&
    isBool(x.fcOn) && isNum(x.fcPct) && isNum(x.fcMin) && isIds(x.fcActs) &&
    isNum(x.taPct) && isNum(x.taMin) && isIds(x.taActs) &&
    isBool(x.taMgr) && isBool(x.taSales);
}

/** Structural validation — a malformed body must never replace the active config. */
export function isConfig(c: unknown): c is Config {
  if (!c || typeof c !== "object") return false;
  const x = c as Record<string, unknown>;
  if (!isActs(x.activities) || !isActs(x.taActivities)) return false;
  if (!x.tiers || typeof x.tiers !== "object") return false;
  const tiers = x.tiers as Record<string, unknown>;
  if (!TIERS.every((t) => isTier(tiers[t]))) return false;
  const g = x.guard as Record<string, unknown> | undefined;
  if (!g || !isNum(g.green) || !isNum(g.amber)) return false;
  const l = x.legacy as Record<string, unknown> | undefined;
  if (!l || !isNum(l.mrrPct) || !isNum(l.setupRate) || !isNum(l.mgrShare)) return false;
  return true;
}
