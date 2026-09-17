/* ===========================================================================
   CALCULATION ENGINE — translated 1:1 from the approved build.
   Pure functions, no React, no storage. Amounts in Rupee Lakhs.
   Calculator and Simulator both call these; logic is not duplicated.
   =========================================================================== */
import { TIERS } from "@/lib/config";
import { n, nn } from "@/lib/format";
import type {
  BaseParts, BonusResult, ComparisonRow, Config, DealInput, Guard, GuardStatus,
  Legacy, LegacyInputs, LegacyResult, ManagerResult, NewPolicyResult, TagInput,
  TagResult, Tier, TierId,
} from "@/types";

export function calcPrimary(mrr: number | string, setup: number | string, t: Tier): BaseParts {
  const m = nn(mrr) * nn(t.mrrPct) / 100, s = nn(setup) * nn(t.setupPct) / 100;
  return { mrrInc: m, setupInc: s, base: m + s };
}

export function calcFullCycleBonus(base: number, t: Tier, doneIds: string[], cfg: Config): BonusResult {
  const elig = (t.fcActs || []).filter((id) => cfg.activities.some((a) => a.id === id));
  const done = (doneIds || []).filter((id) => elig.indexOf(id) > -1);
  const req = Math.max(0, n(t.fcMin)), on = !!t.fcOn;
  const qualified = on && done.length >= req;
  return {
    on, eligible: elig, done: done.length, req, qualified,
    pct: nn(t.fcPct), amount: qualified ? base * nn(t.fcPct) / 100 : 0,
  };
}

export function calcTagAlong(primary: number, t: Tier, tag: TagInput, cfg: Config): TagResult {
  const elig = (t.taActs || []).filter((id) => cfg.taActivities.some((a) => a.id === id));
  const done = (tag.acts || []).filter((id) => elig.indexOf(id) > -1);
  const req = Math.max(0, n(t.taMin)), r: string[] = [];
  if (done.length < req) r.push("Participation threshold not met (" + done.length + " of " + req + ")");
  if (t.taMgr && !tag.mgr) r.push("Manager approval pending");
  if (t.taSales && !tag.sales) r.push("Sales approval pending");
  const ok = r.length === 0;
  return {
    name: tag.name || "", eligible: ok, reasons: r, done: done.length, req, eligActs: elig,
    pct: nn(t.taPct), amount: ok ? primary * nn(t.taPct) / 100 : 0,
  };
}

export function calcManagerOverlay(teamIncentive: number, t: Tier): ManagerResult {
  return { pct: nn(t.mgrPct), basis: teamIncentive, amount: teamIncentive * nn(t.mgrPct) / 100 };
}

/* Authoritative waterfall (steps 1-11) */
export function calcNewPolicy(d: DealInput, cfg: Config): NewPolicyResult {
  const t = cfg.tiers[d.tier] || cfg.tiers.platinum;
  const mrr = nn(d.mrr), setup = nn(d.setup);
  const p = calcPrimary(mrr, setup, t);
  const fc = calcFullCycleBonus(p.base, t, d.fcDone, cfg);
  const primary = p.base + fc.amount;
  const tags = (d.tags || []).map((tg) => calcTagAlong(primary, t, tg, cfg));
  const tagTotal = tags.reduce((a, x) => a + x.amount, 0);
  const team = primary + tagTotal;
  const mgr = calcManagerOverlay(team, t);
  const total = team + mgr.amount;
  const y1 = mrr * 12 + setup;
  return {
    tier: t, tierId: d.tier, mrr, setup, mrrInc: p.mrrInc, setupInc: p.setupInc, base: p.base,
    fc, primary, tags, tagTotal, team, mgr, total, y1, ratio: y1 > 0 ? total / y1 * 100 : 0,
  };
}

/* Legacy — isolated. Effort/contribution multipliers live only here. */
export function calcLegacyPolicy(
  d: { mrr: number | string; setup: number | string },
  cfg: Config,
  li?: LegacyInputs
): LegacyResult {
  const lg: Legacy = cfg.legacy, mrr = nn(d.mrr), setup = nn(d.setup);
  let em = n(li && li.effortMult), cm = n(li && li.contribMult);
  if (!em) em = 1;
  if (!cm) cm = 1;
  const sc = nn(lg.mrrPct) / 100 * mrr + nn(lg.setupRate) / 100 * setup * em;
  const mgr = sc * nn(lg.mgrShare) / 100 * cm;
  const y1 = mrr * 12 + setup, total = sc + mgr;
  return { sc, tag: 0, mgr, total, y1, ratio: y1 > 0 ? total / y1 * 100 : 0, effortMult: em, contribMult: cm };
}

export function calcComparison(lg: LegacyResult, nw: NewPolicyResult): ComparisonRow[] {
  const pctD = (a: number, b: number): number | null => (a === 0 ? null : (b - a) / Math.abs(a) * 100);
  const row = (k: string, a: number, b: number, na?: boolean): ComparisonRow =>
    ({ k, a, b, d: b - a, p: pctD(a, b), na: !!na });
  return [
    row("Primary SC", lg.sc, nw.primary),
    row("Tag-Along", lg.tag, nw.tagTotal, true),
    row("Manager", lg.mgr, nw.mgr.amount),
    row("Total Payout", lg.total, nw.total),
  ];
}

export function calcScenario(
  mrr: number | string, setup: number | string, fcDone: string[],
  tagSpec: { on: boolean; name?: string; acts: string[]; mgr: boolean; sales: boolean } | null,
  cfg: Config
): NewPolicyResult[] {
  return TIERS.map((id) => {
    let tags: TagInput[] = [];
    if (tagSpec && tagSpec.on)
      tags = [{ name: tagSpec.name || "", acts: tagSpec.acts || [], mgr: !!tagSpec.mgr, sales: !!tagSpec.sales }];
    return calcNewPolicy({ mrr, setup, tier: id as TierId, fcDone, tags }, cfg);
  });
}

export function guardStatus(ratio: number, g: Guard): GuardStatus {
  if (ratio <= nn(g.green)) return { t: "Green", cls: "n-teal", pill: "p-ok" };
  if (ratio <= nn(g.amber)) return { t: "Amber", cls: "n-amber", pill: "p-no" };
  return { t: "Red", cls: "n-danger", pill: "p-no" };
}

/* View helpers carried over from the approved build. */
export function gc(g: GuardStatus): "ok" | "wr" | "dg" {
  return g.t === "Green" ? "ok" : g.t === "Amber" ? "wr" : "dg";
}
export function gtxt(g: GuardStatus): string {
  return g.t === "Green" ? "Within Guardrail" : g.t === "Amber" ? "Above Green Band" : "Above Maximum Allowed";
}
