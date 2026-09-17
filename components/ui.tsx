"use client";
import React, { useEffect, useRef, useState } from "react";
import type { TierId } from "@/types";

export function Badge({ id, label }: { id: TierId; label: string }) {
  return <span className={"bd bd-" + id}>{label}</span>;
}

export function Tag({ c, children, dot }: { c: "ok" | "wr" | "dg" | "n"; children: React.ReactNode; dot?: boolean }) {
  return <span className={"tg tg-" + c}>{dot && <i className="dot" />}{children}</span>;
}

export function Tip({ t }: { t: string }) { return <span className="tp" title={t}>?</span> }

export function Segmented<T extends string>({ value, options, onChange, full }: {
  value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; full?: boolean;
}) {
  return (
    <div className={"sg" + (full ? " f" : "")}>
      {options.map((o) => (
        <button key={o.v} type="button" className={o.v === value ? "on" : undefined} onClick={() => onChange(o.v)}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

/**
 * Numeric field.
 *
 * Holds the in-progress string locally while focused and only pushes the parsed
 * value upward. This is the React equivalent of the approved build's fix for the
 * caret bug: the element is never re-valued mid-keystroke, so the caret keeps its
 * position and partial entries such as "12." survive until blur.
 */
export function NumberField({ id, value, step, pre, suf, onChange, onCommit }: {
  id: string; value: number | string; step: number; pre?: string; suf?: string;
  onChange: (raw: string) => void; onCommit?: () => void;
}) {
  const [buf, setBuf] = useState<string>(String(value));
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setBuf(String(value)) }, [value]);
  return (
    <div className={"fld" + (pre ? " pre" : "") + (suf ? " suf" : "")}>
      {pre && <span className="p">{pre}</span>}
      <input
        type="number" min={0} step={step} id={"i-" + id} value={buf}
        onFocus={() => { focused.current = true }}
        onBlur={() => { focused.current = false; setBuf(String(value)); onCommit && onCommit() }}
        onChange={(e) => { setBuf(e.target.value); onChange(e.target.value) }}
      />
      {suf && <span className="s">{suf}</span>}
    </div>
  );
}

export function TextField({ id, value, placeholder, onChange }: {
  id: string; value: string; placeholder?: string; onChange: (v: string) => void;
}) {
  return (
    <input type="text" id={"i-" + id} value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)} />
  );
}

export function ActivityRow({ on, label, help, onToggle }: {
  on: boolean; label: string; help?: string; onToggle: () => void;
}) {
  return (
    <label className={"ar" + (on ? " on" : "")}>
      <input type="checkbox" checked={on} onChange={onToggle} />
      <b>{label}</b>
      {help && <span className="h">{help}</span>}
    </label>
  );
}

export function ApprovalRow({ on, label, required, onToggle }: {
  on: boolean; label: string; required: boolean; onToggle: () => void;
}) {
  return (
    <label className={"apr" + (on ? " on" : "")}>
      <input type="checkbox" checked={on} onChange={onToggle} />
      <span><b>{label}</b><br /><span className="xs mut">{required ? "required" : "not required"}</span></span>
      <span className="mk">{on ? "\u2713 Approved" : "\u25CB Pending"}</span>
    </label>
  );
}

export function Progress({ done, req, okText, noText }: {
  done: number; req: number; okText: string; noText: string;
}) {
  const ok = done >= req;
  const p = req > 0 ? Math.min(100, done / req * 100) : 100;
  return (
    <>
      <div className={"pg" + (ok ? "" : " w")}><i style={{ width: p + "%" }} /></div>
      <div className="row sp">
        <span className="xs mut nm">{done} / {req} activities</span>
        {ok ? <Tag c="ok">{"\u2713 " + okText}</Tag> : <Tag c="wr">{noText}</Tag>}
      </div>
    </>
  );
}

export function Panel({ title, sub, children, bare }: {
  title: string; sub?: string; children: React.ReactNode; bare?: boolean;
}) {
  return (
    <section className="sec">
      <div className="sh">{title}</div>
      {sub && <p className="sm mut" style={{ margin: "-4px 0 12px" }}>{sub}</p>}
      {bare ? children : <div className="pn pd">{children}</div>}
    </section>
  );
}

export function WLine({ k, v, cls }: { k: React.ReactNode; v: React.ReactNode; cls?: string }) {
  return <div className={"l " + (cls || "")}><span>{k}</span><span>{v}</span></div>;
}

export function Notice({ tone, children, style }: {
  tone?: "ok" | "wr" | "dg"; children: React.ReactNode; style?: React.CSSProperties;
}) {
  return <div className={"nt" + (tone ? " nt-" + tone : "")} style={style}>{children}</div>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="emp">{children}</div>;
}

export function Formula() {
  return (
    <div className="fx">
      <span className="xs mut">MANAGER INCENTIVE</span>
      <b>Eligible Team Incentive</b><i>&times;</i><b>Tier Manager %</b>
    </div>
  );
}
