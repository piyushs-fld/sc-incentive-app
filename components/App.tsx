"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { DEF, TIERS, clone } from "@/lib/config";
import type {
  AdminSection, Config, DealState, LegacyInputs, ModalState, Page, SimState, TierId,
} from "@/types";
import Calculator from "@/components/Calculator";
import Policy from "@/components/Policy";
import Simulator from "@/components/Simulator";
import Admin from "@/components/Admin";

const PAGES: [Page, string][] = [
  ["calc", "Calculator"], ["policy", "Policy"], ["sim", "Scenario Simulator"], ["admin", "Formula Admin"],
];

export default function App() {
  /* Defaults render on the server and on first client paint, then the centrally
     saved configuration is fetched on mount — so markup matches and there is no
     hydration warning. Redis is reached only through /api/config. */
  const [cfg, setCfgState] = useState<Config>(() => clone(DEF));
  const [page, setPage] = useState<Page>("calc");
  const [deal, setDeal] = useState<DealState>({
    name: "", mrr: "20", setup: "200", tier: "platinum", fcDone: [], tags: [],
  });
  const [legacyIn, setLegacyIn] = useState<LegacyInputs>({ effortMult: 1, contribMult: 1 });
  const [sim, setSim] = useState<SimState>({
    mrr: "20", setup: "200", fcDone: ["rfp", "demo"],
    tag: { on: false, acts: ["tdemo", "tdoc"], mgr: true, sales: true },
  });
  const [adm, setAdm] = useState<AdminSection>("tier");
  const [fcTier, setFcTier] = useState<TierId>("platinum");
  const [taTier, setTaTier] = useState<TierId>("platinum");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<{ m: string; e: boolean } | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [calcSavedAt, setCalcSavedAt] = useState<string | null>(null);
  const [simSavedAt, setSimSavedAt] = useState<string | null>(null);
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Initial load: centrally saved configuration, falling back to DEF. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/config", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { config?: Config };
        if (!cancelled && data && data.config) setCfgState(data.config);
      } catch {
        /* Store unreachable — keep DEF so the UI still works. */
      }
    })();
    return () => { cancelled = true };
  }, []);

  /* Last explicitly saved Calculator / Simulator inputs. Fetched once on mount;
     absent or unreachable leaves the existing defaults in place. Only input
     state is stored — every result recalculates from the active Config. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/calculator-state", { cache: "no-store" });
        if (!res.ok) return;
        const d = (await res.json()) as { state?: { deal: DealState; legacyIn: LegacyInputs } | null; updatedAt?: string | null };
        if (cancelled || !d || !d.state) return;
        setDeal(d.state.deal);
        setLegacyIn(d.state.legacyIn);
        setCalcSavedAt(d.updatedAt ?? null);
      } catch { /* keep defaults */ }
    })();
    (async () => {
      try {
        const res = await fetch("/api/simulator-state", { cache: "no-store" });
        if (!res.ok) return;
        const d = (await res.json()) as { state?: SimState | null; updatedAt?: string | null };
        if (cancelled || !d || !d.state) return;
        setSim(d.state);
        setSimSavedAt(d.updatedAt ?? null);
      } catch { /* keep defaults */ }
    })();
    return () => { cancelled = true };
  }, []);

  const showToast = useCallback((m: string, e?: boolean) => {
    setToast({ m, e: !!e });
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 2600);
  }, []);

  /* Editing Formula Admin changes local React state only. Nothing is written to
     the shared store until Save is pressed. */
  const setCfg = useCallback((c: Config) => { setCfgState(c) }, []);

  const onSave = useCallback(async () => {
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: cfg }),
      });
      const data = (await res.json()) as { config?: Config; error?: string };
      if (!res.ok || !data.config) {
        /* Never report a false success; the editor keeps the current values. */
        showToast(data.error || "Could not save configuration", true);
        return;
      }
      setCfgState(data.config);
      showToast("Configuration saved");
    } catch {
      showToast("Could not save configuration", true);
    }
  }, [cfg, showToast]);

  /* Explicit saves only — never on keystroke. */
  const onSaveCalc = useCallback(async () => {
    try {
      const res = await fetch("/api/calculator-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: { deal, legacyIn } }),
      });
      const d = (await res.json()) as { updatedAt?: string; error?: string };
      if (!res.ok || !d.updatedAt) { showToast(d.error || "Could not save calculation", true); return }
      setCalcSavedAt(d.updatedAt);
      showToast("Calculation saved");
    } catch { showToast("Could not save calculation", true) }
  }, [deal, legacyIn, showToast]);

  const onSaveSim = useCallback(async () => {
    try {
      const res = await fetch("/api/simulator-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: sim }),
      });
      const d = (await res.json()) as { updatedAt?: string; error?: string };
      if (!res.ok || !d.updatedAt) { showToast(d.error || "Could not save scenario", true); return }
      setSimSavedAt(d.updatedAt);
      showToast("Scenario saved");
    } catch { showToast("Could not save scenario", true) }
  }, [sim, showToast]);

  const openModal = (t: "reset" | "export" | "import" | "acts-fc" | "acts-ta") => {
    if (t === "reset") setModal({ t: "reset", title: "Reset to Defaults" });
    else if (t === "export") { setJsonText(JSON.stringify(cfg, null, 2)); setModal({ t: "export", title: "Export Configuration" }) }
    else if (t === "import") { setJsonText(""); setModal({ t: "import", title: "Import Configuration" }) }
    else setModal({ t: "acts", k: t.slice(5) as "fc" | "ta", title: t.slice(5) === "fc" ? "Manage Full-Cycle Activities" : "Manage Tag-Along Activities" });
  };

  const doReset = () => {
    setCfg(clone(DEF));
    setDeal({ ...deal, fcDone: [], tags: [] });
    setModal(null);
    showToast("Reset to draft defaults");
  };

  const doImport = () => {
    try {
      const p = JSON.parse(jsonText) as Partial<Config>;
      if (!p || typeof p !== "object" || !p.tiers || !Array.isArray(p.activities)) throw new Error("bad");
      const c = clone(DEF);
      c.activities = p.activities;
      if (Array.isArray(p.taActivities)) c.taActivities = p.taActivities;
      if (p.guard) c.guard = Object.assign(c.guard, p.guard);
      if (p.legacy) c.legacy = Object.assign(c.legacy, p.legacy);
      TIERS.forEach((x) => { if (p.tiers![x]) c.tiers[x] = Object.assign(c.tiers[x], p.tiers![x]) });
      setCfg(c);
      setDeal({ ...deal, fcDone: [], tags: [] });
      setModal(null);
      showToast("Configuration imported");
    } catch {
      setModal({ t: "import", title: "Import Configuration", err: "Invalid configuration JSON — nothing was changed." });
    }
  };

  const addActivity = (k: "fc" | "ta") => {
    const id = "a" + Math.random().toString(36).slice(2, 8);
    const c = clone(cfg);
    (k === "fc" ? c.activities : c.taActivities).push({ id, l: "New activity" });
    TIERS.forEach((x) => { (k === "fc" ? c.tiers[x].fcActs : c.tiers[x].taActs).push(id) });
    setCfg(c);
  };
  const renameActivity = (k: "fc" | "ta", id: string, l: string) => {
    const c = clone(cfg);
    const list = k === "fc" ? c.activities : c.taActivities;
    const a = list.filter((x) => x.id === id)[0];
    if (a) a.l = l;
    setCfg(c);
  };
  const deleteActivity = (k: "fc" | "ta", id: string) => {
    const c = clone(cfg);
    if (k === "fc") {
      c.activities = c.activities.filter((a) => a.id !== id);
      TIERS.forEach((x) => { c.tiers[x].fcActs = c.tiers[x].fcActs.filter((y) => y !== id) });
      setDeal({ ...deal, fcDone: deal.fcDone.filter((y) => y !== id) });
      setSim({ ...sim, fcDone: sim.fcDone.filter((y) => y !== id) });
    } else {
      c.taActivities = c.taActivities.filter((a) => a.id !== id);
      TIERS.forEach((x) => { c.tiers[x].taActs = c.tiers[x].taActs.filter((y) => y !== id) });
      setDeal({ ...deal, tags: deal.tags.map((g) => ({ ...g, acts: g.acts.filter((y) => y !== id) })) });
      setSim({ ...sim, tag: { ...sim.tag, acts: sim.tag.acts.filter((y) => y !== id) } });
    }
    setCfg(c);
    showToast("Activity deleted");
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setModal(null) };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const go = (p: Page) => { setPage(p); window.scrollTo(0, 0) };

  return (
    <>
      <header className="hdr">
        <div className="wrap">
          <div className="bl">
            <div className="lg">FA</div>
            <div><div className="bt">SC Incentive Policy</div><div className="bs">Policy Simulator</div></div>
          </div>
          <span className="st"><i />Draft Policy</span>
        </div>
        <div className="nvw"><div className="wrap">
          <nav className="nv">
            {PAGES.map((p) => (
              <button key={p[0]} className={page === p[0] ? "on" : undefined} onClick={() => go(p[0])}>{p[1]}</button>
            ))}
          </nav>
        </div></div>
      </header>

      <main>
        <div className="wrap">
          {page === "calc" && (
            <Calculator cfg={cfg} deal={deal} setDeal={setDeal} legacyIn={legacyIn} setLegacyIn={setLegacyIn}
              open={open} setOpen={setOpen} goAdmin={(s) => { setAdm(s); go("admin") }}
              onSaveState={onSaveCalc} savedAt={calcSavedAt} />
          )}
          {page === "policy" && <Policy cfg={cfg} />}
          {page === "sim" && <Simulator cfg={cfg} sim={sim} setSim={setSim} onSaveState={onSaveSim} savedAt={simSavedAt} />}
          {page === "admin" && (
            <Admin cfg={cfg} setCfg={setCfg} section={adm} setSection={setAdm}
              fcTier={fcTier} setFcTier={setFcTier} taTier={taTier} setTaTier={setTaTier}
              onSave={onSave} openModal={openModal} />
          )}
        </div>
      </main>

      <footer><div className="wrap">
        <span>FieldAssist · Internal Tool — Confidential</span><span className="mo">v3.0</span>
      </div></footer>

      {modal && (
        <div className="ov" onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="md" role="dialog" aria-modal="true">
            <div className="mdh">
              <h2>{modal.title}</h2>
              <button className="bn gh s" aria-label="Close" onClick={() => setModal(null)}>{"\u2715"}</button>
            </div>
            <div className="mdb">
              {modal.t === "reset" && (
                <>
                  <p className="sm">This restores every tier percentage, threshold, activity and guardrail to the shipped draft defaults. Opportunity inputs on the Calculator are cleared.</p>
                  <div className="nt nt-wr" style={{ marginTop: 12 }}>This cannot be undone.</div>
                </>
              )}
              {modal.t === "export" && (
                <>
                  <p className="sm" style={{ marginBottom: 10 }}>Copy this configuration to share or archive it.</p>
                  <textarea id="jt" rows={11} readOnly value={jsonText} />
                </>
              )}
              {modal.t === "import" && (
                <>
                  <p className="sm" style={{ marginBottom: 10 }}>Paste a previously exported configuration.</p>
                  <textarea id="jt" rows={11} placeholder="{ ... }" value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
                  {modal.err && <div className="nt nt-dg" style={{ marginTop: 10 }}>{modal.err}</div>}
                </>
              )}
              {modal.t === "acts" && (
                <>
                  {(modal.k === "fc" ? cfg.activities : cfg.taActivities).length ? (
                    <div className="g" style={{ gap: 8 }}>
                      {(modal.k === "fc" ? cfg.activities : cfg.taActivities).map((a) => (
                        <div key={a.id} className="row" style={{ flexWrap: "nowrap", gap: 8 }}>
                          <input type="text" id={"i-ac-" + a.id} value={a.l}
                            onChange={(e) => renameActivity(modal.k, a.id, e.target.value)} />
                          <button className="bn dg s" onClick={() => deleteActivity(modal.k, a.id)}>Delete</button>
                        </div>
                      ))}
                    </div>
                  ) : <div className="emp">No activities defined yet.</div>}
                  <button className="bn gh s" style={{ marginTop: 12 }} onClick={() => addActivity(modal.k)}>+ Add activity</button>
                  <p className="xs mut" style={{ marginTop: 10 }}>
                    New activities are enabled for every tier by default. Deleting one removes it from all tiers and from any selection already made.
                  </p>
                </>
              )}
            </div>
            <div className="mdf">
              {modal.t === "reset" && (<>
                <button className="bn gh" onClick={() => setModal(null)}>Cancel</button>
                <button className="bn dg" onClick={doReset}>Reset Defaults</button></>)}
              {modal.t === "export" && (<>
                <button className="bn gh" onClick={() => setModal(null)}>Close</button>
                <button className="bn" onClick={() => {
                  const ta = document.getElementById("jt") as HTMLTextAreaElement | null;
                  if (ta) { ta.select(); try { document.execCommand("copy"); showToast("Configuration copied") } catch { showToast("Select and copy manually", true) } }
                }}>Copy</button></>)}
              {modal.t === "import" && (<>
                <button className="bn gh" onClick={() => setModal(null)}>Cancel</button>
                <button className="bn" onClick={doImport}>Import</button></>)}
              {modal.t === "acts" && <button className="bn" onClick={() => setModal(null)}>Done</button>}
            </div>
          </div>
        </div>
      )}

      {toast && <div className={"tst" + (toast.e ? " e" : "")} role="status">{(toast.e ? "\u2715" : "\u2713") + " " + toast.m}</div>}
    </>
  );
}
