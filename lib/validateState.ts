import { TIERS } from "@/lib/config";
import type { DealState, SimState, TierId } from "@/types";

/* Structural validation for the saved Calculator / Simulator input state.
   Field names and shapes mirror types/index.ts exactly — nothing is renamed. */

const isStr = (v: unknown): v is string => typeof v === "string";
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const isNum = (v: unknown): v is number => typeof v === "number" && isFinite(v);
const isIds = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);

function isTag(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const x = v as Record<string, unknown>;
  return isStr(x.name) && isIds(x.acts) && isBool(x.mgr) && isBool(x.sales);
}

export function isDealState(v: unknown): v is DealState {
  if (!v || typeof v !== "object") return false;
  const x = v as Record<string, unknown>;
  return isStr(x.name) && isStr(x.mrr) && isStr(x.setup) &&
    isStr(x.tier) && TIERS.indexOf(x.tier as TierId) > -1 &&
    isIds(x.fcDone) && Array.isArray(x.tags) && x.tags.every(isTag);
}

export function isLegacyInputs(v: unknown): v is { effortMult: number; contribMult: number } {
  if (!v || typeof v !== "object") return false;
  const x = v as Record<string, unknown>;
  return isNum(x.effortMult) && isNum(x.contribMult);
}

export function isSimState(v: unknown): v is SimState {
  if (!v || typeof v !== "object") return false;
  const x = v as Record<string, unknown>;
  if (!isStr(x.mrr) || !isStr(x.setup) || !isIds(x.fcDone)) return false;
  const t = x.tag as Record<string, unknown> | undefined;
  return !!t && isBool(t.on) && isIds(t.acts) && isBool(t.mgr) && isBool(t.sales);
}

/** Calculator screen inputs: the deal form plus the legacy comparison inputs. */
export interface CalculatorState { deal: DealState; legacyIn: { effortMult: number; contribMult: number } }

export function isCalculatorState(v: unknown): v is CalculatorState {
  if (!v || typeof v !== "object") return false;
  const x = v as Record<string, unknown>;
  return isDealState(x.deal) && isLegacyInputs(x.legacyIn);
}
