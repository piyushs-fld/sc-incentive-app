"use client";
import React from "react";
import { TIERS } from "@/lib/config";
import { P, n, nn } from "@/lib/format";
import type { AdminSection, Config, Tier, TierId } from "@/types";
import { ActivityRow, Badge, Empty, Formula, NumberField, Notice, Segmented } from "@/components/ui";

export function adminWarnings(c: Config): string[] {
  const w: string[] = [];
  TIERS.forEach((id) => {
    const t = c.tiers[id];
    const en = c.activities.filter((a) => (t.fcActs || []).indexOf(a.id) > -1).length;
    if (t.fcOn && n(t.fcMin) > en)
      w.push(t.label + ": Full-Cycle threshold (" + n(t.fcMin) + ") exceeds " + en + " enabled activities — the bonus can never be earned.");
    const te = c.taActivities.filter((a) => (t.taActs || []).indexOf(a.id) > -1).length;
    if (n(t.taMin) > te)
      w.push(t.label + ": Tag-Along threshold (" + n(t.taMin) + ") exceeds " + te + " enabled activities — no Tag-Along can qualify.");
  });
  if (nn(c.guard.green) >= nn(c.guard.amber))
    w.push("Green (" + P(c.guard.green, 1) + ") must be below Amber (" + P(c.guard.amber, 1) + ").");
  return w;
}

const NAV: [AdminSection, string][] = [
  ["tier", "Tier Economics"], ["fc", "Full-Cycle Rules"], ["ta", "Tag-Along Rules"],
  ["mgr", "Manager Overlay"], ["guard", "CFO Guardrails"], ["legacy", "Legacy Policy"],
];

export default function Admin({
  cfg, setCfg, section, setSection, fcTier, setFcTier, taTier, setTaTier, onSave, openModal,
}: {
  cfg: Config; setCfg: (c: Config) => void;
  section: AdminSection; setSection: (s: AdminSection) => void;
  fcTier: TierId; setFcTier: (t: TierId) => void;
  taTier: TierId; setTaTier: (t: TierId) => void;
  onSave: () => void | Promise<void>;
  openModal: (t: "reset" | "export" | "import" | "acts-fc" | "acts-ta") => void;
}) {
  const w = adminWarnings(cfg);
  const setTier = <K extends keyof Tier>(id: TierId, k: K, v: Tier[K]) =>
    setCfg({ ...cfg, tiers: { ...cfg.tiers, [id]: { ...cfg.tiers[id], [k]: v } } });
  const pctNum = (raw: string) => Math.min(100, Math.max(0, n(raw)));
  const plainNum = (raw: string) => Math.max(0, n(raw));
  const toggle = (arr: string[], id: string) => arr.indexOf(id) > -1 ? arr.filter((x) => x !== id) : arr.concat([id]);

  let body: React.ReactNode = null;

  if (section === "tier") {
    const fields: (keyof Tier)[] = ["mrrPct", "setupPct", "fcPct", "taPct", "mgrPct"];
    body = (
      <>
        <div className="sh">Tier Economics</div>
        <p className="sm mut" style={{ margin: "-4px 0 14px" }}>Every economic lever, per tier. Nothing is hardcoded in the calculator.</p>
        <div className="pn"><div className="tw">
          <table>
            <thead><tr><th>Tier</th><th className="r">MRR %</th><th className="r">Setup %</th>
              <th className="r">Full-Cycle %</th><th className="r">Tag-Along %</th><th className="r">Manager %</th></tr></thead>
            <tbody>
              {TIERS.map((id) => (
                <tr key={id}>
                  <th scope="row"><Badge id={id} label={cfg.tiers[id].label} /></th>
                  {fields.map((f) => (
                    <td key={String(f)} className="r">
                      <NumberField id={"tiers." + id + "." + String(f)} value={cfg.tiers[id][f] as number} step={0.5} suf="%"
                        onChange={(raw) => setTier(id, f, pctNum(raw) as Tier[typeof f])} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </>
    );
  } else if (section === "fc") {
    const t = cfg.tiers[fcTier];
    body = (
      <>
        <div className="sh">Full-Cycle Rules</div>
        <p className="sm mut" style={{ margin: "-4px 0 14px" }}>Reward is a Bonus % applied to the Base Incentive — not a multiplier and not a score.</p>
        <Segmented<TierId> value={fcTier} options={TIERS.map((x) => ({ v: x, l: cfg.tiers[x].label }))} onChange={setFcTier} />
        <div className="pn pd" style={{ marginTop: 14 }}>
          <div className="g g3">
            <div><label className="lb">Status</label>
              <Segmented full value={t.fcOn ? "y" : "n"} options={[{ v: "y", l: "Enabled" }, { v: "n", l: "Disabled" }]}
                onChange={(v) => setTier(fcTier, "fcOn", v === "y")} /></div>
            <div><label className="lb" htmlFor={"i-tiers." + fcTier + ".fcMin"}>Minimum Activities</label>
              <NumberField id={"tiers." + fcTier + ".fcMin"} value={t.fcMin} step={1}
                onChange={(raw) => setTier(fcTier, "fcMin", plainNum(raw))} /></div>
            <div><label className="lb" htmlFor={"i-tiers." + fcTier + ".fcPct"}>Bonus <em>of Base Incentive</em></label>
              <NumberField id={"tiers." + fcTier + ".fcPct"} value={t.fcPct} step={1} suf="%"
                onChange={(raw) => setTier(fcTier, "fcPct", pctNum(raw))} /></div>
          </div>
          <div className="dv" />
          <div className="row sp">
            <span className="sh" style={{ margin: 0 }}>Qualifying Activities</span>
            <button className="bn gh s" onClick={() => openModal("acts-fc")}>Manage Activities</button>
          </div>
          <div className="arl" style={{ marginTop: 10 }}>
            {cfg.activities.length ? cfg.activities.map((a) => (
              <ActivityRow key={a.id} on={(t.fcActs || []).indexOf(a.id) > -1} label={a.l}
                onToggle={() => setTier(fcTier, "fcActs", toggle(t.fcActs, a.id))} />
            )) : <Empty>No activities defined.</Empty>}
          </div>
        </div>
      </>
    );
  } else if (section === "ta") {
    const t = cfg.tiers[taTier];
    body = (
      <>
        <div className="sh">Tag-Along Rules</div>
        <p className="sm mut" style={{ margin: "-4px 0 14px" }}>Applied to the Final Primary SC Incentive. Approvals gate the payout entirely.</p>
        <Segmented<TierId> value={taTier} options={TIERS.map((x) => ({ v: x, l: cfg.tiers[x].label }))} onChange={setTaTier} />
        <div className="pn pd" style={{ marginTop: 14 }}>
          <div className="g g2">
            <div><label className="lb" htmlFor={"i-tiers." + taTier + ".taPct"}>Tag-Along <em>of Final Primary SC</em></label>
              <NumberField id={"tiers." + taTier + ".taPct"} value={t.taPct} step={1} suf="%"
                onChange={(raw) => setTier(taTier, "taPct", pctNum(raw))} /></div>
            <div><label className="lb" htmlFor={"i-tiers." + taTier + ".taMin"}>Minimum Activities</label>
              <NumberField id={"tiers." + taTier + ".taMin"} value={t.taMin} step={1}
                onChange={(raw) => setTier(taTier, "taMin", plainNum(raw))} /></div>
            <div><label className="lb">Manager Approval</label>
              <Segmented full value={t.taMgr ? "y" : "n"} options={[{ v: "y", l: "Required" }, { v: "n", l: "Not required" }]}
                onChange={(v) => setTier(taTier, "taMgr", v === "y")} /></div>
            <div><label className="lb">Sales Approval</label>
              <Segmented full value={t.taSales ? "y" : "n"} options={[{ v: "y", l: "Required" }, { v: "n", l: "Not required" }]}
                onChange={(v) => setTier(taTier, "taSales", v === "y")} /></div>
          </div>
          <div className="dv" />
          <div className="row sp">
            <span className="sh" style={{ margin: 0 }}>Eligible Activities</span>
            <button className="bn gh s" onClick={() => openModal("acts-ta")}>Manage Activities</button>
          </div>
          <div className="arl" style={{ marginTop: 10 }}>
            {cfg.taActivities.length ? cfg.taActivities.map((a) => (
              <ActivityRow key={a.id} on={(t.taActs || []).indexOf(a.id) > -1} label={a.l}
                onToggle={() => setTier(taTier, "taActs", toggle(t.taActs, a.id))} />
            )) : <Empty>No activities defined.</Empty>}
          </div>
        </div>
      </>
    );
  } else if (section === "mgr") {
    body = (
      <>
        <div className="sh">Manager Overlay</div>
        <p className="sm mut" style={{ margin: "-4px 0 14px" }}>Automatic and tier-based. No manager checklist or score exists.</p>
        <div className="pn pd">
          <Formula />
          <p className="xs mut" style={{ textAlign: "center", marginTop: 8 }}>
            Eligible Team = Final Primary SC + all eligible Tag-Along payouts
          </p>
          <div className="dv" />
          <div className="g g3">
            {TIERS.map((id) => (
              <div key={id}>
                <label className="lb" htmlFor={"i-tiers." + id + ".mgrPct"}>{cfg.tiers[id].label} <em>of team incentive</em></label>
                <NumberField id={"tiers." + id + ".mgrPct"} value={cfg.tiers[id].mgrPct} step={1} suf="%"
                  onChange={(raw) => setTier(id, "mgrPct", pctNum(raw))} />
              </div>
            ))}
          </div>
          <Notice style={{ marginTop: 14 }}>
            The overlay is an additional organizational payout. It never reduces the Primary SC or any Tag-Along payout.
          </Notice>
        </div>
      </>
    );
  } else if (section === "guard") {
    const gr = nn(cfg.guard.green), am = nn(cfg.guard.amber), mx = Math.max(am * 1.4, gr * 1.4, 1);
    body = (
      <>
        <div className="sh">CFO Guardrails</div>
        <p className="sm mut" style={{ margin: "-4px 0 14px" }}>Governance indicators only.</p>
        <div className="pn pd">
          <div className="g g2">
            <div><label className="lb" htmlFor="i-guard.green">Green <em>at or below</em></label>
              <NumberField id="guard.green" value={cfg.guard.green} step={0.1} suf="%"
                onChange={(raw) => setCfg({ ...cfg, guard: { ...cfg.guard, green: pctNum(raw) } })} /></div>
            <div><label className="lb" htmlFor="i-guard.amber">Amber <em>at or below; above is Red</em></label>
              <NumberField id="guard.amber" value={cfg.guard.amber} step={0.1} suf="%"
                onChange={(raw) => setCfg({ ...cfg, guard: { ...cfg.guard, amber: pctNum(raw) } })} /></div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="scale">
              <i className="a" style={{ width: (gr / mx * 100) + "%" }} />
              <i className="b" style={{ width: (Math.max(0, am - gr) / mx * 100) + "%" }} />
              <i className="c" style={{ flex: 1 }} />
            </div>
            <div className="slb">
              <span>Green &le; {P(gr, 1)}</span><span>Amber &le; {P(am, 1)}</span><span>Red &gt; {P(am, 1)}</span>
            </div>
          </div>
          <Notice style={{ marginTop: 14 }}>
            <b>Guardrails flag economics; they never modify payout.</b> Changing these thresholds moves the indicator only.
          </Notice>
        </div>
      </>
    );
  } else {
    body = (
      <>
        <div className="sh">Legacy Policy</div>
        <p className="sm mut" style={{ margin: "-4px 0 14px" }}>Comparison only. Never read by the proposed policy.</p>
        <div className="pn pd">
          <div className="calc" style={{ marginBottom: 14 }}>
            <span className="h">{"Legacy SC      = (MRR% × MRR) + (Setup Rate × Setup × Effort Multiplier)\nLegacy Manager = Legacy SC × Manager Share × Contribution Multiplier\nLegacy Total   = Legacy SC + Legacy Manager"}</span>
          </div>
          <div className="g g3">
            <div><label className="lb" htmlFor="i-legacy.mrrPct">MRR %</label>
              <NumberField id="legacy.mrrPct" value={cfg.legacy.mrrPct} step={0.5} suf="%"
                onChange={(raw) => setCfg({ ...cfg, legacy: { ...cfg.legacy, mrrPct: pctNum(raw) } })} /></div>
            <div><label className="lb" htmlFor="i-legacy.setupRate">Setup Rate <em>0 if unearned today</em></label>
              <NumberField id="legacy.setupRate" value={cfg.legacy.setupRate} step={0.5} suf="%"
                onChange={(raw) => setCfg({ ...cfg, legacy: { ...cfg.legacy, setupRate: pctNum(raw) } })} /></div>
            <div><label className="lb" htmlFor="i-legacy.mgrShare">Manager Share <em>0 if none today</em></label>
              <NumberField id="legacy.mgrShare" value={cfg.legacy.mgrShare} step={1} suf="%"
                onChange={(raw) => setCfg({ ...cfg, legacy: { ...cfg.legacy, mgrShare: pctNum(raw) } })} /></div>
          </div>
          <Notice tone="wr" style={{ marginTop: 14 }}>
            Effort and contribution multipliers are per-deal legacy inputs and live in the Calculator under &ldquo;Today&rsquo;s Policy Assumptions&rdquo;. Today&rsquo;s policy has no Tag-Along mechanism.
          </Notice>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="pt">
        <div className="row sp">
          <div>
            <h1>Formula Admin</h1>
            <p>Every percentage, threshold and activity used by the Calculator and Simulator. Changes apply immediately and persist in this browser.</p>
          </div>
          <div className="row">
            <button className="bn ac s" onClick={onSave}>Save</button>
            <button className="bn gh s" onClick={() => openModal("export")}>Export JSON</button>
            <button className="bn gh s" onClick={() => openModal("import")}>Import JSON</button>
            <button className="bn dg s" onClick={() => openModal("reset")}>Reset Defaults</button>
          </div>
        </div>
      </div>
      <Notice tone="wr" style={{ marginBottom: 16 }}>
        <b>Draft values.</b> Shipped percentages are modelling assumptions, not approved policy.
      </Notice>
      {w.length > 0 && (
        <Notice tone="dg" style={{ marginBottom: 16 }}>
          <b>Configuration warnings</b><ul>{w.map((x) => <li key={x}>{x}</li>)}</ul>
        </Notice>
      )}
      <div className="adm">
        <div className="anv">
          {NAV.map((x) => (
            <button key={x[0]} className={section === x[0] ? "on" : undefined} onClick={() => setSection(x[0])}>{x[1]}</button>
          ))}
        </div>
        <div>{body}</div>
      </div>
    </>
  );
}
