import { useMemo } from "react";
import { fmt } from "../utils.js";
import { PeriodBar, dayOf, downloadCsv, fdate, isSale, sumUp, useOrders, usePeriod } from "./period.jsx";

// Comptabilité des ventes : 100 % automatique, calculée à partir des commandes (aucune saisie).
export default function Accounting() {
  const p = usePeriod("month");
  const { orders, err } = useOrders(p.range);
  const s = useMemo(() => (orders ? sumUp(orders) : null), [orders]);

  const rows = useMemo(() => {
    const m = {};
    (orders || []).forEach((o) => {
      const d = dayOf(o.created_at);
      const r = (m[d] ||= { day: d, n: 0, delivered: 0, open: 0, cancelled: 0 });
      if (!isSale(o)) r.cancelled += o.total || 0;
      else { r.n++; if (o.status === "delivered") r.delivered += o.total || 0; else r.open += o.total || 0; }
    });
    return Object.values(m).sort((a, b) => b.day.localeCompare(a.day));
  }, [orders]);

  const exportCsv = () => downloadCsv(`ventes_${p.range.from}_${p.range.to}.csv`, [
    ["Date", "Commandes", "Livré (FCFA)", "En cours (FCFA)", "Total ventes (FCFA)", "Annulé (FCFA)"],
    ...rows.map((r) => [r.day, r.n, r.delivered, r.open, r.delivered + r.open, r.cancelled]),
    ["TOTAL", s.count, s.deliveredAmt, s.openAmt, s.ca, s.cancelledAmt],
  ]);

  return (
    <>
      <PeriodBar p={p} />
      {err && <p className="adm-warn">{err}</p>}
      {!s ? <p className="empty">Chargement…</p> : (
        <>
          <div className="kpi-grid">
            <div className="kpi" style={{ "--tone": "#075ea8" }}><div className="kpi-copy"><span className="kpi-label">Total des ventes</span><span className="kpi-value">{fmt(s.ca)}</span><span className="kpi-sub">{s.count} commande{s.count > 1 ? "s" : ""}</span></div></div>
            <div className="kpi" style={{ "--tone": "#16a34a" }}><div className="kpi-copy"><span className="kpi-label">Livré / encaissé</span><span className="kpi-value">{fmt(s.deliveredAmt)}</span><span className="kpi-sub">{s.deliveredN} commande{s.deliveredN > 1 ? "s" : ""}</span></div></div>
            <div className="kpi" style={{ "--tone": "#f0b018" }}><div className="kpi-copy"><span className="kpi-label">En cours</span><span className="kpi-value">{fmt(s.openAmt)}</span><span className="kpi-sub">{s.openN} commande{s.openN > 1 ? "s" : ""}</span></div></div>
            <div className="kpi" style={{ "--tone": "#dc2626" }}><div className="kpi-copy"><span className="kpi-label">Annulé / non remis</span><span className="kpi-value">{fmt(s.cancelledAmt)}</span><span className="kpi-sub">{s.cancelledN} commande{s.cancelledN > 1 ? "s" : ""}</span></div></div>
          </div>
          <section className="panel">
            <div className="panel-head row-between">
              <h2 className="panel-title">Ventes jour par jour</h2>
              <button className="btn ghost small" onClick={exportCsv} disabled={!rows.length}>⬇ Exporter (Excel)</button>
            </div>
            <p className="muted" style={{ marginBottom: 10 }}>Calculé automatiquement à partir des commandes : rien à saisir.</p>
            {!rows.length ? <p className="empty">Aucune vente sur cette période.</p> : (
              <div className="tbl-wrap">
                <table className="adm-table">
                  <thead><tr><th>Date</th><th className="n">Commandes</th><th className="n">Livré</th><th className="n">En cours</th><th className="n">Total</th><th className="n">Annulé / non remis</th></tr></thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.day}><td>{fdate(r.day)}</td><td className="n">{r.n}</td><td className="n">{fmt(r.delivered)}</td><td className="n">{fmt(r.open)}</td><td className="n"><b>{fmt(r.delivered + r.open)}</b></td><td className="n neg">{r.cancelled ? fmt(r.cancelled) : "—"}</td></tr>
                    ))}
                    <tr className="tot"><td>Total</td><td className="n">{s.count}</td><td className="n">{fmt(s.deliveredAmt)}</td><td className="n">{fmt(s.openAmt)}</td><td className="n">{fmt(s.ca)}</td><td className="n neg">{s.cancelledAmt ? fmt(s.cancelledAmt) : "—"}</td></tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
