import { useCallback, useEffect, useState } from "react";
import { sb } from "../supabase.js";

const pad = (n) => String(n).padStart(2, "0");
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };

export const PERIODS = [
  ["today", "Aujourd'hui"],
  ["7d", "7 jours"],
  ["30d", "30 jours"],
  ["month", "Ce mois"],
  ["year", "Cette année"],
  ["custom", "Personnalisé"],
];

// Renvoie { from, to } (dates locales YYYY-MM-DD, bornes incluses)
export function rangeOf(kind, custom) {
  const t = new Date();
  if (kind === "today") return { from: ymd(t), to: ymd(t) };
  if (kind === "7d") return { from: ymd(addDays(t, -6)), to: ymd(t) };
  if (kind === "30d") return { from: ymd(addDays(t, -29)), to: ymd(t) };
  if (kind === "month") return { from: ymd(new Date(t.getFullYear(), t.getMonth(), 1)), to: ymd(t) };
  if (kind === "year") return { from: ymd(new Date(t.getFullYear(), 0, 1)), to: ymd(t) };
  const f = custom?.from || ymd(t), e = custom?.to || ymd(t);
  return f <= e ? { from: f, to: e } : { from: e, to: f };
}

export function usePeriod(initial = "30d") {
  const [kind, setKind] = useState(initial);
  const [custom, setCustom] = useState({ from: ymd(addDays(new Date(), -29)), to: ymd(new Date()) });
  return { kind, setKind, custom, setCustom, range: rangeOf(kind, custom) };
}

export function PeriodBar({ p }) {
  return (
    <div className="pbar">
      <div className="filters">
        {PERIODS.map(([id, l]) => <button key={id} className={p.kind === id ? "on" : ""} onClick={() => p.setKind(id)}>{l}</button>)}
      </div>
      {p.kind === "custom" && (
        <div className="pbar-dates">
          <label>Du <input type="date" value={p.custom.from} max={p.custom.to} onChange={(e) => p.setCustom({ ...p.custom, from: e.target.value })} /></label>
          <label>au <input type="date" value={p.custom.to} min={p.custom.from} onChange={(e) => p.setCustom({ ...p.custom, to: e.target.value })} /></label>
        </div>
      )}
      <span className="pbar-label">{p.range.from === p.range.to ? fdate(p.range.from) : `${fdate(p.range.from)} → ${fdate(p.range.to)}`}</span>
    </div>
  );
}

export const fdate = (s) => new Date(s + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

// Charge toutes les commandes de la période (par pages de 1000), avec leurs lignes
export function useOrders(range) {
  const [orders, setOrders] = useState(null);
  const [err, setErr] = useState("");
  const load = useCallback(async () => {
    const start = new Date(range.from + "T00:00:00").toISOString();
    const end = new Date(range.to + "T23:59:59.999").toISOString();
    let all = [];
    for (let from = 0; from < 10000; from += 1000) {
      const r = await sb.from("orders").select("*, order_items(*)").gte("created_at", start).lte("created_at", end)
        .order("created_at", { ascending: false }).range(from, from + 999);
      if (r.error) { setErr(r.error.message); return; }
      all = all.concat(r.data);
      if (r.data.length < 1000) break;
    }
    setErr(""); setOrders(all);
  }, [range.from, range.to]);
  useEffect(() => { setOrders(null); load(); }, [load]);
  return { orders, err, reload: load };
}

// Chiffre d'affaires = commandes non annulées
export const isSale = (o) => o.status !== "cancelled" && o.status !== "undelivered";
export const dayOf = (iso) => ymd(new Date(iso));

export function sumUp(orders) {
  const all = orders || [];
  const sales = all.filter(isSale);
  const sum = (l) => l.reduce((t, o) => t + (o.total || 0), 0);
  const delivered = all.filter((o) => o.status === "delivered");
  const open = all.filter((o) => ["new", "preparing", "ready"].includes(o.status));
  const cancelled = all.filter((o) => !isSale(o));
  return {
    ca: sum(sales), count: sales.length, avg: sales.length ? Math.round(sum(sales) / sales.length) : 0,
    deliveredAmt: sum(delivered), deliveredN: delivered.length,
    openAmt: sum(open), openN: open.length,
    cancelledAmt: sum(cancelled), cancelledN: cancelled.length,
  };
}

export function downloadCsv(name, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "﻿" + rows.map((r) => r.map(esc).join(";")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
