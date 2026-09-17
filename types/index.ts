export type TierId = "gold" | "platinum" | "tw";

export interface ActivityDef { id: string; l: string }

export interface Tier {
  label: string;
  mrrPct: number; setupPct: number;
  fcOn: boolean; fcPct: number; fcMin: number; fcActs: string[];
  taPct: number; taMin: number; taActs: string[];
  taMgr: boolean; taSales: boolean;
  mgrPct: number;
}

export interface Guard { green: number; amber: number }
export interface Legacy { mrrPct: number; setupRate: number; mgrShare: number }

export interface Config {
  activities: ActivityDef[];
  taActivities: ActivityDef[];
  tiers: Record<TierId, Tier>;
  guard: Guard;
  legacy: Legacy;
}

export interface TagInput { name?: string; acts: string[]; mgr: boolean; sales: boolean }
export interface DealInput { mrr: number | string; setup: number | string; tier: TierId; fcDone: string[]; tags: TagInput[] }

export interface BaseParts { mrrInc: number; setupInc: number; base: number }
export interface BonusResult {
  on: boolean; eligible: string[]; done: number; req: number;
  qualified: boolean; pct: number; amount: number;
}
export interface TagResult {
  name: string; eligible: boolean; reasons: string[];
  done: number; req: number; eligActs: string[]; pct: number; amount: number;
}
export interface ManagerResult { pct: number; basis: number; amount: number }

export interface NewPolicyResult {
  tier: Tier; tierId: TierId; mrr: number; setup: number;
  mrrInc: number; setupInc: number; base: number;
  fc: BonusResult; primary: number;
  tags: TagResult[]; tagTotal: number; team: number;
  mgr: ManagerResult; total: number; y1: number; ratio: number;
}

export interface LegacyInputs { effortMult: number; contribMult: number }
export interface LegacyResult {
  sc: number; tag: number; mgr: number; total: number;
  y1: number; ratio: number; effortMult: number; contribMult: number;
}

export interface ComparisonRow { k: string; a: number; b: number; d: number; p: number | null; na: boolean }
export interface GuardStatus { t: string; cls: string; pill: string }

export type Page = "calc" | "policy" | "sim" | "admin";
export type AdminSection = "tier" | "fc" | "ta" | "mgr" | "guard" | "legacy";

export interface SimState {
  mrr: string; setup: string; fcDone: string[];
  tag: { on: boolean; acts: string[]; mgr: boolean; sales: boolean };
}
export interface DealState {
  name: string; mrr: string; setup: string; tier: TierId;
  fcDone: string[]; tags: { name: string; acts: string[]; mgr: boolean; sales: boolean }[];
}
export type ModalState =
  | { t: "reset"; title: string }
  | { t: "export"; title: string }
  | { t: "import"; title: string; err?: string }
  | { t: "acts"; k: "fc" | "ta"; title: string }
  | null;
