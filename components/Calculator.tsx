"use client";
import React from "react";
import { calcComparison, calcLegacyPolicy, calcNewPolicy, gc, guardStatus, gtxt } from "@/lib/calc";
import { L, P } from "@/lib/format";
import type { Config, DealState, LegacyInputs, NewPolicyResult, TierId } from "@/types";
import { TIERS } from "@/lib/config";
import {
  ActivityRow, ApprovalRow, Badge, Empty, NumberField, Notice, Panel, Progress,
  Segmented, Tag, TextField, WLine,
} from "@/components/ui";

const R = (x: number) => L(x);

function Trace({ res }: { res: NewPolicyResult }) {
  const t = res.tier;
  const lines: React.ReactNode[] = [];
  const h = (s: string) => <span className="h">{s}</span>;
  lines.push(<React.Fragment key="a">{h("MRR Incentive")}{"\n = " + R(res.mrr) + " \u00D7 " + P(t.mrrPct, 1) + "\n = "}<b>{R(res.mrrInc)}</b>{"\n\n"}</React.Fragment>);
  lines.push(<React.Fragment key="b">{h("Setup Incentive")}{"\n = " + R(res.setup) + " \u00D7 " + P(t.setupPct, 1) + "\n = "}<b>{R(res.setupInc)}</b>{"\n\n"}</React.Fragment>);
  lines.push(<React.Fragment key="c">{h("Base Incentive")}{"\n = " + R(res.mrrInc) + " + " + R(res.setupInc) + "\n = "}<b>{R(res.base)}</b>{"\n\n"}</React.Fragment>);
  lines.push(<React.Fragment key="d">{h("Full-Cycle Bonus")}{"\n = " + res.fc.done + " / " + res.fc.req + " activities \u2192 " + (res.fc.qualified ? "Qualified" : "Standard Cycle") + "\n = " + (res.fc.qualified ? R(res.base) + " \u00D7 " + P(t.fcPct, 1) : "no bonus") + "\n = "}<b>{R(res.fc.amount)}</b>{"\n\n"}</React.Fragment>);
  lines.push(<React.Fragment key="e">{h("Final Primary SC")}{"\n = " + R(res.base) + " + " + R(res.fc.amount) + "\n = "}<b>{R(res.primary)}</b>{"\n\n"}</React.Fragment>);
  res.tags.forEach((x, i) => lines.push(
    <React.Fragment key={"t" + i}>{h("Tag-Along " + (i + 1) + (x.name ? " \u2014 " + x.name : ""))}
      {"\n = " + (x.eligible ? "Eligible\n = " + R(res.primary) + " \u00D7 " + P(x.pct, 1) : "Not eligible \u2014 " + x.reasons.join("; ") + "\n = \u20B90.00 L") + "\n = "}
      <b>{R(x.amount)}</b>{"\n\n"}</React.Fragment>));
  lines.push(<React.Fragment key="f">{h("Eligible Team")}{"\n = " + R(res.primary) + " + " + R(res.tagTotal) + "\n = "}<b>{R(res.team)}</b>{"\n\n"}</React.Fragment>);
  lines.push(<React.Fragment key="g">{h("Manager Overlay")}{"\n = " + R(res.team) + " \u00D7 " + P(t.mgrPct, 1) + "\n = "}<b>{R(res.mgr.amount)}</b>{"\n\n"}</React.Fragment>);
  lines.push(<React.Fragment key="h">{h("TOTAL PAYOUT")}{"\n = " + R(res.team) + " + " + R(res.mgr.amount) + "\n = "}<b>{R(res.total)}</b>{"\n\n"}</React.Fragment>);
  lines.push(<React.Fragment key="i">{h("Payout Ratio")}{"\n = " + R(res.total) + " \u00F7 " + R(res.y1) + " \u00D7 100\n = "}<b>{res.y1 > 0 ? P(res.ratio) : "n/a \u2014 Year-1 value is zero"}</b></React.Fragment>);
  return <div className="calc">{lines}</div>;
}

function Chg({ d, p }: { d: number; p: number | null }) {
  if (Math.abs(d) < 0.005) return <span className="mut">{"\u2014"}</span>;
  const s = d > 0 ? "+" : "\u2212";
  return (
    <span style={{ color: d > 0 ? "var(--ac2)" : "var(--wr)", fontWeight: 600 }}>
      {s + L(Math.abs(d))}
      {p !== null && <span className="xs"> ({s + Math.abs(p).toFixed(0)}%)</span>}
    </span>
  );
}
function PpChg({ d }: { d: number }) {
  if (Math.abs(d) < 0.005) return <span className="mut">{"\u2014"}</span>;
  const s = d > 0 ? "+" : "\u2212";
  return <span style={{ color: d > 0 ? "var(--ac2)" : "var(--wr)", fontWeight: 600 }}>{s + Math.abs(d).toFixed(2)} pp</span>;
}

export default function Calculator({
  cfg, deal, setDeal, legacyIn, setLegacyIn, open, setOpen, goAdmin,
}: {
  cfg: Config; deal: DealState; setDeal: (d: DealState) => void;
  legacyIn: LegacyInputs; setLegacyIn: (l: LegacyInputs) => void;
  open: Record<string, boolean>; setOpen: (o: Record<string, boolean>) => void;
  goAdmin: (section: "fc") => void;
}) {
  const t = cfg.tiers[deal.tier];
  const R2 = calcNewPolicy(deal, cfg);
  const LG = calcLegacyPolicy(deal, cfg, legacyIn);
  const CMP = calcComparison(LG, R2);
  const g = guardStatus(R2.ratio, cfg.guard);
  const acts = cfg.activities.filter((a) => (t.fcActs || []).indexOf(a.id) > -1);
  const need = Math.max(0, R2.fc.req - R2.fc.done);
  const up = (patch: Partial<DealState>) => setDeal({ ...deal, ...patch });
  const toggle = (arr: string[], id: string) =>
    arr.indexOf(id) > -1 ? arr.filter((x) => x !== id) : arr.concat([id]);
  const pctTrim = (x: number) => P(x, 0).replace(".0", "");

  return (
    <>
      <div className="pt"><h1>Calculate Incentive</h1>
        <p>Configure the opportunity and involvement to calculate the proposed payout.</p></div>

      <div className="cols">
        <div>
          <Panel title="Opportunity">
            <div className="g g2">
              <div>
                <label className="lb" htmlFor="i-name">Opportunity Name <em>optional</em></label>
                <TextField id="name" value={deal.name} placeholder="e.g. Orkla India — RTM" onChange={(v) => up({ name: v })} />
              </div>
              <div>
                <label className="lb">Account Tier <em>provided by Sales</em></label>
                <Segmented<TierId> full value={deal.tier}
                  options={TIERS.map((x) => ({ v: x, l: cfg.tiers[x].label }))}
                  onChange={(v) => up({ tier: v })} />
              </div>
              <div>
                <label className="lb" htmlFor="i-deal.mrr">MRR <em>₹ Lakhs / month</em></label>
                <NumberField id="deal.mrr" value={deal.mrr} step={1} pre="&#8377;" suf="L" onChange={(raw) => up({ mrr: raw })} />
              </div>
              <div>
                <label className="lb" htmlFor="i-deal.setup">Setup Value <em>₹ Lakhs, one-time</em></label>
                <NumberField id="deal.setup" value={deal.setup} step={5} pre="&#8377;" suf="L" onChange={(raw) => up({ setup: raw })} />
              </div>
            </div>
            <div className="dv" />
            <div className="row sp">
              <span className="sm mut">Year-1 Deal Value <span className="xs">(MRR × 12 + Setup)</span></span>
              <span className="sm nm" style={{ fontWeight: 700, color: "var(--ink)" }}>{L(R2.y1)}</span>
            </div>
          </Panel>

          <Panel title="Primary SC Qualification" sub="Tick the qualifying activities actually completed.">
            {!t.fcOn ? (
              <Notice tone="wr">Full-Cycle Bonus is <b>disabled for {t.label}</b> in the current configuration. The Base Incentive applies with no bonus.</Notice>
            ) : !acts.length ? (
              <Empty>No Full-Cycle activities are enabled for {t.label}.<br />
                <button className="lk" style={{ marginTop: 6 }} onClick={() => goAdmin("fc")}>Configure in Formula Admin</button>
              </Empty>
            ) : (
              <>
                <div className="arl">
                  {acts.map((a) => (
                    <ActivityRow key={a.id} on={deal.fcDone.indexOf(a.id) > -1} label={a.l}
                      onToggle={() => up({ fcDone: toggle(deal.fcDone, a.id) })} />
                  ))}
                </div>
                <div style={{ marginTop: 14 }}>
                  <Progress done={R2.fc.done} req={R2.fc.req} okText="Full-Cycle Qualified"
                    noText={"Standard Cycle · " + need + " more required"} />
                </div>
                {R2.fc.req > acts.length && (
                  <Notice tone="dg" style={{ marginTop: 12 }}>
                    Threshold of {R2.fc.req} exceeds the {acts.length} activities enabled for this tier — the bonus can never be earned.
                  </Notice>
                )}
              </>
            )}
          </Panel>

          <Panel title="Tag-Along SC" sub="Optional. Each participant qualifies independently." bare>
            {deal.tags.length ? deal.tags.map((tg, i) => {
              const r = R2.tags[i];
              const list = cfg.taActivities.filter((a) => r.eligActs.indexOf(a.id) > -1);
              const op = open["t" + i] !== false;
              return (
                <div key={i} className={"tc" + (r.eligible ? " ok" : "")}>
                  <div className="tch" onClick={() => setOpen({ ...open, ["t" + i]: open["t" + i] === false })}>
                    <b>{tg.name || "Tag-Along SC " + (i + 1)}</b>
                    {r.eligible ? <Tag c="ok">{L(r.amount)}</Tag> : <Tag c="wr">{r.done + "/" + r.req + " · pending"}</Tag>}
                    <button type="button" className="bn gh s"
                      onClick={(e) => { e.stopPropagation(); up({ tags: deal.tags.filter((_, j) => j !== i) }) }}>Remove</button>
                  </div>
                  {op && (
                    <div className="tcb">
                      <label className="lb" htmlFor={"i-tg" + i}>SC Name <em>optional</em></label>
                      <TextField id={"tg" + i} value={tg.name} placeholder="Consultant name"
                        onChange={(v) => up({ tags: deal.tags.map((x, j) => j === i ? { ...x, name: v } : x) })} />
                      {list.length ? (
                        <>
                          <div className="sh" style={{ marginTop: 16 }}>Qualifying Participation</div>
                          <div className="arl">
                            {list.map((a) => (
                              <ActivityRow key={a.id} on={(tg.acts || []).indexOf(a.id) > -1} label={a.l}
                                onToggle={() => up({ tags: deal.tags.map((x, j) => j === i ? { ...x, acts: toggle(x.acts, a.id) } : x) })} />
                            ))}
                          </div>
                          <div style={{ marginTop: 12 }}>
                            <Progress done={r.done} req={r.req} okText="Participation met"
                              noText={"Participation · " + Math.max(0, r.req - r.done) + " more required"} />
                          </div>
                        </>
                      ) : <div className="emp" style={{ marginTop: 12 }}>No Tag-Along activities enabled for this tier.</div>}
                      <div className="sh" style={{ marginTop: 16 }}>Approvals</div>
                      <div className="g g2">
                        <ApprovalRow on={tg.mgr} label="Manager Approval" required={t.taMgr}
                          onToggle={() => up({ tags: deal.tags.map((x, j) => j === i ? { ...x, mgr: !x.mgr } : x) })} />
                        <ApprovalRow on={tg.sales} label="Sales Approval" required={t.taSales}
                          onToggle={() => up({ tags: deal.tags.map((x, j) => j === i ? { ...x, sales: !x.sales } : x) })} />
                      </div>
                      <Notice tone={r.eligible ? "ok" : "wr"} style={{ marginTop: 12 }}>
                        {r.eligible ? (
                          <><b>Eligible.</b> Pays {P(r.pct, 1)} of the Final Primary SC Incentive = <b>{L(r.amount)}</b></>
                        ) : (
                          <><b>Not eligible.</b><ul>{r.reasons.map((x) => <li key={x}>{x}</li>)}</ul></>
                        )}
                      </Notice>
                    </div>
                  )}
                </div>
              );
            }) : (
              <Empty>No Tag-Along SC on this opportunity.<br />
                <span className="xs">Tag-Along is incremental and never reduces the Primary SC payout.</span></Empty>
            )}
            <button type="button" className="bn gh s" style={{ marginTop: 10 }}
              onClick={() => { setOpen({ ...open, ["t" + deal.tags.length]: true });
                up({ tags: deal.tags.concat([{ name: "", acts: [], mgr: false, sales: false }]) }) }}>
              + Add Tag-Along SC
            </button>
          </Panel>
        </div>

        <div>
          <div className="pn stick">
            <div className="hero">
              <div className="cap">Proposed Incentive</div>
              <div className="amt">{L(R2.total)}</div>
              <div className="row" style={{ marginTop: 9 }}>
                <Badge id={deal.tier} label={t.label} />
                {t.fcOn
                  ? (R2.fc.qualified ? <Tag c="ok">Full-Cycle Qualified</Tag> : <Tag c="n">Standard Cycle</Tag>)
                  : <Tag c="n">No bonus for tier</Tag>}
              </div>
            </div>
            <div className="pd wf">
              <WLine cls="sub" k="MRR Incentive" v={L(R2.mrrInc)} />
              <WLine cls="sub" k="Setup Incentive" v={L(R2.setupInc)} />
              <div className="rule" />
              <WLine cls="st2" k="Base Incentive" v={L(R2.base)} />
              <div style={{ height: 6 }} />
              <WLine cls="sub" k={"Full-Cycle Bonus" + (R2.fc.qualified ? " (+" + pctTrim(t.fcPct) + ")" : "")} v={L(R2.fc.amount)} />
              <div className="rule" />
              <WLine cls="st2" k="Final Primary SC" v={L(R2.primary)} />
              <div style={{ height: 6 }} />
              <WLine cls="sub" k={"Tag-Along" + (R2.tags.length ? " (" + R2.tags.filter((x) => x.eligible).length + " of " + R2.tags.length + ")" : "")} v={L(R2.tagTotal)} />
              <div className="rule" />
              <WLine cls="st2" k="Eligible Team" v={L(R2.team)} />
              <div style={{ height: 6 }} />
              <WLine cls="sub" k={"Manager Overlay (" + pctTrim(t.mgrPct) + ")"} v={L(R2.mgr.amount)} />
              <div className="dbl" />
              <WLine cls="tot" k="TOTAL PAYOUT" v={L(R2.total)} />
              <div className="dv" />
              <div className="mt"><span className="mut">Year-1 Deal Value</span><span>{L(R2.y1)}</span></div>
              <div className="mt"><span className="mut">Payout Ratio</span><span>{R2.y1 > 0 ? P(R2.ratio) : "\u2014"}</span></div>
              <div style={{ marginTop: 8 }}><Tag c={gc(g)} dot>{gtxt(g)}</Tag></div>
            </div>
            <details className="ac">
              <summary>View calculation</summary>
              <div className="bd2"><Trace res={R2} /></div>
            </details>
          </div>
        </div>
      </div>

      <div className="sec" style={{ marginTop: 32 }}>
        <div className="pt" style={{ marginBottom: 16 }}>
          <h2>Today&rsquo;s Policy vs Proposed Policy</h2>
          <p>Understand the payout impact for this opportunity.</p>
        </div>
        <div className="pn">
          <div className="tw">
            <table>
              <thead><tr><th>Metric</th><th className="r">Today</th><th className="r hl">Proposed</th><th className="r">Change</th></tr></thead>
              <tbody>
                {CMP.map((r) => (
                  <tr key={r.k} className={r.k === "Total Payout" ? "tt" : undefined}>
                    <th scope="row">{r.k}</th>
                    <td className="r nm">{r.na && r.a === 0 ? <span className="mut">{"\u2014"}</span> : L(r.a)}</td>
                    <td className="r nm hl">{L(r.b)}</td>
                    <td className="r nm">{r.na && r.a === 0 ? <span className="mut">{"\u2014"}</span> : <Chg d={r.d} p={r.p} />}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">Payout Ratio</th>
                  <td className="r nm">{P(LG.ratio)}</td>
                  <td className="r nm hl">{P(R2.ratio)}</td>
                  <td className="r nm"><PpChg d={R2.ratio - LG.ratio} /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="pd" style={{ paddingTop: 0 }}>
            <details className="pl">
              <summary>Today&rsquo;s Policy Assumptions</summary>
              <div className="bd2">
                <p className="xs mut" style={{ marginBottom: 12 }}>
                  Legacy inputs used only to reproduce today&rsquo;s payout. They never affect the Proposed Policy.
                </p>
                <div className="calc" style={{ marginBottom: 12 }}>
                  <span className="h">{"Legacy SC      = (MRR% × MRR) + (Setup Rate × Setup × Effort Multiplier)\nLegacy Manager = Legacy SC × Manager Share × Contribution Multiplier"}</span>
                </div>
                <div className="g g2">
                  <div>
                    <label className="lb" htmlFor="i-legacyIn.effortMult">Effort Multiplier <em>legacy only</em></label>
                    <NumberField id="legacyIn.effortMult" value={legacyIn.effortMult} step={0.05} suf="&times;"
                      onChange={(raw) => setLegacyIn({ ...legacyIn, effortMult: Math.max(0, Number(raw) || 0) })} />
                  </div>
                  <div>
                    <label className="lb" htmlFor="i-legacyIn.contribMult">Contribution Multiplier <em>legacy only</em></label>
                    <NumberField id="legacyIn.contribMult" value={legacyIn.contribMult} step={0.05} suf="&times;"
                      onChange={(raw) => setLegacyIn({ ...legacyIn, contribMult: Math.max(0, Number(raw) || 0) })} />
                  </div>
                </div>
                <div className="calc" style={{ marginTop: 12 }}>
                  {"MRR " + P(cfg.legacy.mrrPct, 1) + "  ·  Setup Rate " + P(cfg.legacy.setupRate, 1) + "  ·  Manager Share " + P(cfg.legacy.mgrShare, 1) + "\nLegacy SC      = "}
                  <b>{L(LG.sc)}</b>{"\nLegacy Manager = "}<b>{L(LG.mgr)}</b>{"\nLegacy Total   = "}<b>{L(LG.total)}</b>
                </div>
                <p className="xs mut" style={{ marginTop: 10 }}>
                  Today&rsquo;s policy has no Tag-Along mechanism, so that row shows a dash rather than an invented figure. Rates are set in Formula Admin → Legacy Policy.
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </>
  );
}
