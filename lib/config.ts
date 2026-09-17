import type { Config, TierId } from "@/types";

/* Central configuration — DRAFT/SAMPLE defaults, not approved policy values.
   Carried over unchanged from the approved build. */
export const KEY = "fa-sc-incentive-cfg-v3";
export const TIERS: TierId[] = ["gold", "platinum", "tw"];

export const DEF: Config = {
  activities: [
    { id: "rfp", l: "Detailed RFP / RFI" },
    { id: "demo", l: "Personalized / Custom Demo" },
    { id: "uat", l: "UAT / POC" },
    { id: "wshop", l: "Solution Workshop" },
    { id: "integ", l: "Integration / Scoping Workshop" },
    { id: "own", l: "Full-Cycle Ownership" },
  ],
  taActivities: [
    { id: "tdemo", l: "Demo Support" },
    { id: "tdoc", l: "Solution Documentation" },
    { id: "tuat", l: "UAT Support" },
    { id: "twshop", l: "Workshop Participation" },
  ],
  tiers: {
    gold: {
      label: "Gold", mrrPct: 8, setupPct: 1.5,
      fcOn: true, fcPct: 10, fcMin: 3, fcActs: ["rfp", "demo", "uat", "wshop", "integ", "own"],
      taPct: 15, taMin: 2, taActs: ["tdemo", "tdoc", "tuat", "twshop"],
      taMgr: true, taSales: true, mgrPct: 15,
    },
    platinum: {
      label: "Platinum", mrrPct: 10, setupPct: 2.5,
      fcOn: true, fcPct: 15, fcMin: 2, fcActs: ["rfp", "demo", "uat", "wshop", "integ", "own"],
      taPct: 20, taMin: 2, taActs: ["tdemo", "tdoc", "tuat", "twshop"],
      taMgr: true, taSales: true, mgrPct: 20,
    },
    tw: {
      label: "TW", mrrPct: 12, setupPct: 3, 
      fcOn: true, fcPct: 20, fcMin: 2, fcActs: ["rfp", "demo", "uat", "wshop", "integ", "own"],
      taPct: 25, taMin: 1, taActs: ["tdemo", "tdoc", "tuat", "twshop"],
      taMgr: true, taSales: true, mgrPct: 25,
    },
  },
  guard: { green: 2.5, amber: 4 },
  /* Legacy = comparison only. Never read by New Policy. */
  legacy: { mrrPct: 10, setupRate: 0, mgrShare: 0 },
};

export function clone<T>(o: T): T { return JSON.parse(JSON.stringify(o)) as T }
