"use client";
import React from "react";
import { TIERS } from "@/lib/config";
import { calcNewPolicy } from "@/lib/calc";
import { L, P, n } from "@/lib/format";
import type { Config } from "@/types";
import { Badge, Formula, Notice, WLine } from "@/components/ui";

const FLOW = ["ACCOUNT TIER", "MRR + SETUP", "FULL-CYCLE", "PRIMARY SC", "TAG-ALONG", "TEAM INCENTIVE", "MANAGER OVERLAY"];

function Sec({ t, children }: { t: string; children: React.ReactNode }) {
  return <section className="sec"><div className="sh">{t}</div>{children}</section>;
}

export default function Policy({ cfg }: { cfg: Config }) {
  const pl = cfg.tiers.platinum;
  const ex = calcNewPolicy({
    mrr: 20, setup: 200, tier: "platinum",
    fcDone: cfg.activities.slice(0, Math.max(1, n(pl.fcMin))).map((a) => a.id),
    tags: [{ acts: cfg.taActivities.slice(0, Math.max(1, n(pl.taMin))).map((a) => a.id), mgr: true, sales: true }],
  }, cfg);

  return (
    <>
      <div className="pt"><h1>SC Incentive Policy</h1>
        <p>Proposed Framework · tier-driven economics for the Primary SC, approved Tag-Along participation and the manager overlay.</p></div>

      <div className="pn pd" style={{ marginBottom: 24 }}>
        <div className="flow">
          {FLOW.map((x, i) => (
            <React.Fragment key={x}>
              <span className={"n" + (i === 0 ? " k" : i === FLOW.length - 1 ? " a" : "")}>{x}</span>
              {i < FLOW.length - 1 && <span className="ar2">{"\u2192"}</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <Notice tone="wr" style={{ marginBottom: 24 }}>
        <b>Status of the values in this document.</b> Percentages shown are the values currently configured in Formula Admin. They are draft modelling assumptions, not approved policy.
      </Notice>

      <Sec t="Account Tiers">
        <div className="pn pd" style={{ marginBottom: 12 }}>
          <ul className="bl">
            <li><b>The Account Tier comes from Sales.</b> Every opportunity is already classified as Gold, Platinum or TW. This tool captures that classification and never calculates or recommends a tier.</li>
            <li>All economics differ independently by tier — MRR %, Setup %, bonus, thresholds, Tag-Along % and manager overlay.</li>
          </ul>
        </div>
        <div className="pn"><div className="tw">
          <table>
            <thead><tr><th>Tier</th><th className="r">MRR %</th><th className="r">Setup %</th><th className="r">Full-Cycle %</th>
              <th className="r">Min. Activities</th><th className="r">Tag-Along %</th><th className="r">Manager %</th></tr></thead>
            <tbody>
              {TIERS.map((id) => {
                const t = cfg.tiers[id];
                return (
                  <tr key={id}>
                    <th scope="row"><Badge id={id} label={t.label} /></th>
                    <td className="r nm">{P(t.mrrPct, 1)}</td>
                    <td className="r nm">{P(t.setupPct, 1)}</td>
                    <td className="r nm">{t.fcOn ? P(t.fcPct, 1) : <span className="mut">n/a</span>}</td>
                    <td className="r nm">{t.fcOn ? t.fcMin : <span className="mut">{"\u2014"}</span>}</td>
                    <td className="r nm">{P(t.taPct, 1)}</td>
                    <td className="r nm">{P(t.mgrPct, 1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </Sec>

      <Sec t="Primary SC">
        <div className="pn pd">
          <div className="wf" style={{ maxWidth: 420 }}>
            <WLine cls="sub" k="Recurring Incentive" v="MRR × Tier MRR %" />
            <WLine cls="sub" k="Setup Incentive" v="Setup Value × Tier Setup %" />
            <div className="rule" />
            <WLine cls="st2" k="Base Incentive" v="Recurring + Setup" />
          </div>
          <Notice tone="ok" style={{ marginTop: 14 }}>
            <b>Effort scoring is not part of the revised incentive policy.</b> There is no effort score, percentage, band, weight, multiplier or manager contribution score anywhere in this model.
          </Notice>
          <ul className="bl" style={{ marginTop: 14 }}>
            <li>The <b>Setup Incentive applies to all tiers</b> — Gold, Platinum and TW. No tier leaves one-time setup value unrewarded.</li>
            <li>MRR % and Setup % are set independently per tier and carry <b>no multiplier of any kind</b>.</li>
          </ul>
        </div>
      </Sec>

      <Sec t="Full-Cycle Bonus">
        <div className="pn pd">
          <ul className="bl">
            <li>Qualification is a <b>count of completed qualifying activities</b> against the tier threshold. Activities are not weighted.</li>
            <li><b>Qualified = completed eligible activities ≥ tier minimum.</b> Below the threshold the bonus is nil — no partial or sliding award.</li>
            <li>The reward is a <b>Bonus %, not a multiplier</b>, applied to the <b>complete Base Incentive — MRR and Setup together</b>.</li>
          </ul>
          <div className="calc" style={{ marginTop: 14 }}>
            {"Qualified:     Full-Cycle Bonus = Base Incentive × Tier Bonus %\nNot qualified: Full-Cycle Bonus = \u20B90.00\n\nFinal Primary SC = Base Incentive + Full-Cycle Bonus"}
          </div>
        </div>
      </Sec>

      <Sec t="Tag-Along">
        <div className="pn pd">
          <ul className="bl">
            <li>Recognises meaningful secondary participation. <b>It is not effort scoring.</b></li>
            <li><b>Incremental — it never reduces the Primary SC payout.</b></li>
            <li>Eligibility requires the <b>minimum participation threshold</b>, <b>Manager approval</b> and <b>Sales approval</b>. Both approvals are mandatory by default and remain configurable.</li>
            <li>Calculated on the <b>Final Primary SC Incentive after the Full-Cycle Bonus</b> — not on the Base Incentive.</li>
            <li>Multiple Tag-Along SCs are supported; each qualifies and is calculated independently.</li>
          </ul>
          <div className="calc" style={{ marginTop: 14 }}>
            {"Eligible:     Tag-Along = Final Primary SC × Tier Tag-Along %\nNot eligible: Tag-Along = \u20B90.00"}
          </div>
        </div>
      </Sec>

      <Sec t="Manager Overlay">
        <div className="pn pd">
          <Formula />
          <ul className="bl" style={{ marginTop: 14 }}>
            <li><b>No checklist, no scoring.</b> Manager contribution scoring and activity multipliers are removed entirely.</li>
            <li>Calculated on the <b>final incentive actually earned by the eligible team</b> — Final Primary SC plus all eligible Tag-Along payouts.</li>
            <li><b>Does not reduce</b> the Primary SC or any Tag-Along payout. It is an additional organizational cost.</li>
          </ul>
        </div>
      </Sec>

      <Sec t="Governance">
        <div className="pn pd">
          <div className="calc">{"Year-1 Deal Value = (MRR × 12) + Setup\nPayout Ratio %    = Total Payout \u00F7 Year-1 Deal Value × 100"}</div>
          <ul className="bl" style={{ marginTop: 14 }}>
            <li>Current guardrails: <b>Green ≤ {P(cfg.guard.green, 1)}</b>, <b>Amber ≤ {P(cfg.guard.amber, 1)}</b>, above Amber is <b>Red</b>.</li>
            <li>Guardrails are <b>indicators only</b> — changing them never alters any payout.</li>
            <li>Today&rsquo;s policy runs on a completely separate legacy engine and cannot influence the proposed calculation. It has no Tag-Along mechanism.</li>
          </ul>
        </div>
      </Sec>

      <Sec t="Formula Summary">
        <div className="pn pd">
          <div className="calc">
{` 1  Account Tier            provided by Sales
 2  MRR Incentive         = MRR × Tier MRR %
 3  Setup Incentive       = Setup × Tier Setup %
 4  Base Incentive        = MRR Incentive + Setup Incentive
 5  Full-Cycle Qualified  = completed activities ≥ tier minimum
 6  Full-Cycle Bonus      = Base × Tier Bonus %        (0 if not qualified)
 7  Final Primary SC      = Base + Full-Cycle Bonus
 8  Tag-Along (each)      = Final Primary × Tier Tag-Along %   (0 if not eligible)
 9  Eligible Team         = Final Primary + all eligible Tag-Alongs
10  Manager Overlay       = Eligible Team × Tier Manager %
11  TOTAL PAYOUT          = Eligible Team + Manager Overlay`}
          </div>
          <div className="dv" />
          <p className="sm mut" style={{ marginBottom: 10 }}>
            Worked example — Platinum, ₹20.00 L MRR, ₹200.00 L setup, Full-Cycle qualified, one approved Tag-Along. Live from the current configuration.
          </p>
          <div className="wf" style={{ maxWidth: 420 }}>
            <WLine cls="sub" k="MRR Incentive" v={L(ex.mrrInc)} />
            <WLine cls="sub" k="Setup Incentive" v={L(ex.setupInc)} />
            <div className="rule" />
            <WLine cls="st2" k="Base Incentive" v={L(ex.base)} />
            <WLine cls="sub" k="Full-Cycle Bonus" v={L(ex.fc.amount)} />
            <div className="rule" />
            <WLine cls="st2" k="Final Primary SC" v={L(ex.primary)} />
            <WLine cls="sub" k="Tag-Along" v={L(ex.tagTotal)} />
            <div className="rule" />
            <WLine cls="st2" k="Eligible Team" v={L(ex.team)} />
            <WLine cls="sub" k="Manager Overlay" v={L(ex.mgr.amount)} />
            <div className="dbl" />
            <WLine cls="tot" k="TOTAL PAYOUT" v={L(ex.total)} />
          </div>
        </div>
      </Sec>
    </>
  );
}
