"use client";
import React from "react";
import { calcScenario, gc, guardStatus } from "@/lib/calc";
import { L, P } from "@/lib/format";
import type { Config, NewPolicyResult, SimState } from "@/types";
import { ActivityRow, NumberField, Panel, Segmented, Tag } from "@/components/ui";
import { fmtSaved } from "@/components/Calculator";

export default function Simulator({ cfg, sim, setSim, onSaveState, savedAt }: {
  cfg: Config; sim: SimState; setSim: (s: SimState) => void;
  onSaveState: () => void | Promise<void>; savedAt: string | null;
}) {
  const res = calcScenario(sim.mrr, sim.setup, sim.fcDone, sim.tag, cfg);
  const toggle = (arr: string[], id: string) => arr.indexOf(id) > -1 ? arr.filter((x) => x !== id) : arr.concat([id]);
  const rows: { l: string; f: (r: NewPolicyResult) => React.ReactNode; strong?: boolean }[] = [
    { l: "MRR Incentive", f: (r) => L(r.mrrInc) },
    { l: "Setup Incentive", f: (r) => L(r.setupInc) },
    { l: "Base Incentive", f: (r) => L(r.base), strong: true },
    { l: "Full-Cycle Status", f: (r) => r.fc.qualified
        ? <Tag c="ok">{r.fc.done + "/" + r.fc.req + " Qualified"}</Tag>
        : <Tag c="n">{r.fc.done + "/" + r.fc.req + " Standard"}</Tag> },
    { l: "Full-Cycle Bonus", f: (r) => L(r.fc.amount) },
    { l: "Final Primary SC", f: (r) => L(r.primary), strong: true },
    { l: "Tag-Along", f: (r) => r.tags.length
        ? (r.tags[0].eligible ? L(r.tagTotal) : <span className="mut">{L(0)}</span>)
        : <span className="mut">{"\u2014"}</span> },
    { l: "Eligible Team", f: (r) => L(r.team), strong: true },
    { l: "Manager Overlay", f: (r) => L(r.mgr.amount) },
  ];

  return (
    <>
      <div className="pt">
        <div className="row sp">
          <div>
            <h1>Compare Policy Economics</h1>
            <p>How the same opportunity behaves across Gold, Platinum and TW under the proposed framework. Uses the identical calculation engine as the Calculator.</p>
          </div>
          <div className="row">
            {savedAt && <span className="xs mut">Last saved: {fmtSaved(savedAt)}</span>}
            <button className="bn gh s" onClick={() => onSaveState()}>Save Scenario</button>
          </div>
        </div>
      </div>

      <Panel title="Assumptions">
        <div className="g g3">
          <div>
            <label className="lb" htmlFor="i-sim.mrr">MRR <em>₹ Lakhs / month</em></label>
            <NumberField id="sim.mrr" value={sim.mrr} step={1} pre="&#8377;" suf="L" onChange={(raw) => setSim({ ...sim, mrr: raw })} />
          </div>
          <div>
            <label className="lb" htmlFor="i-sim.setup">Setup Value <em>₹ Lakhs</em></label>
            <NumberField id="sim.setup" value={sim.setup} step={5} pre="&#8377;" suf="L" onChange={(raw) => setSim({ ...sim, setup: raw })} />
          </div>
          <div>
            <label className="lb">Tag-Along Assumption <em>applied to every tier</em></label>
            <Segmented full value={sim.tag.on ? "y" : "n"}
              options={[{ v: "n", l: "None" }, { v: "y", l: "One approved" }]}
              onChange={(v) => setSim({ ...sim, tag: { ...sim.tag, on: v === "y" } })} />
          </div>
        </div>
        <div className="dv" />
        <div className="sh">Activities assumed completed</div>
        <div className="g g3">
          {cfg.activities.map((a) => (
            <ActivityRow key={a.id} on={sim.fcDone.indexOf(a.id) > -1} label={a.l}
              onToggle={() => setSim({ ...sim, fcDone: toggle(sim.fcDone, a.id) })} />
          ))}
        </div>
        {sim.tag.on && (
          <>
            <div className="sh" style={{ marginTop: 16 }}>Tag-Along participation assumed</div>
            <div className="g g2">
              {cfg.taActivities.map((a) => (
                <ActivityRow key={a.id} on={sim.tag.acts.indexOf(a.id) > -1} label={a.l}
                  onToggle={() => setSim({ ...sim, tag: { ...sim.tag, acts: toggle(sim.tag.acts, a.id) } })} />
              ))}
            </div>
          </>
        )}
        <p className="xs mut" style={{ marginTop: 12 }}>
          Each tier counts only its own enabled activities and applies its own threshold, so one assumption can qualify under one tier and not another.
        </p>
      </Panel>

      <section className="sec">
        <div className="sh">Tier Comparison</div>
        <p className="sm mut" style={{ margin: "-4px 0 12px" }}>
          Every figure respects that tier&rsquo;s configured percentages, activities and thresholds.
        </p>
        <div className="pn">
          <div className="tw">
            <table>
              <thead>
                <tr><th>Component</th>
                  {res.map((r, i) => <th key={r.tierId} className={"r" + (i === 1 ? " hl" : "")}>{r.tier.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((rw) => (
                  <tr key={rw.l} style={rw.strong ? { background: "var(--bg)" } : undefined}>
                    <th scope="row" style={rw.strong ? { fontWeight: 600, color: "var(--ink)" } : undefined}>{rw.l}</th>
                    {res.map((r, i) => <td key={r.tierId} className={"r nm" + (i === 1 ? " hl" : "")}>{rw.f(r)}</td>)}
                  </tr>
                ))}
                <tr className="tt"><th scope="row">TOTAL PAYOUT</th>
                  {res.map((r, i) => <td key={r.tierId} className={"r nm" + (i === 1 ? " hl" : "")}>{L(r.total)}</td>)}
                </tr>
                <tr><th scope="row">Year-1 Deal Value</th>
                  {res.map((r, i) => <td key={r.tierId} className={"r nm" + (i === 1 ? " hl" : "")}>{L(r.y1)}</td>)}
                </tr>
                <tr><th scope="row">Payout Ratio</th>
                  {res.map((r, i) => {
                    const g = guardStatus(r.ratio, cfg.guard);
                    return (
                      <td key={r.tierId} className={"r nm" + (i === 1 ? " hl" : "")}>
                        {r.y1 > 0 ? P(r.ratio) : "\u2014"}<br /><Tag c={gc(g)} dot>{g.t}</Tag>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
