import { Fragment, useMemo, useState } from "react";
import { fmt } from "../utils.js";
import { PeriodBar, downloadCsv, isSale, useOrders, usePeriod } from "./period.jsx";

const STATUS = { new: "Nouvelle", preparing: "Préparée", ready: "Préparée", delivered: "Livrée", undelivered: "Non remise", cancelled: "Annulée" };
const when = (iso) => new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const lines = (o) => (o.order_items || []).map((i) => `${i.quantity} × ${i.product_name}${(i.options || []).length ? " (" + i.options.map((x) => x.name).join(", ") + ")" : ""}`);

export default function History() {
  const p = usePeriod("30d");
  const { orders, err } = useOrders(p.range);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const [page, setPage] = useState(0);
  const PER = 25;

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (orders || []).filter((o) =>
      (status === "all" || o.status === status) &&
      (!s || String(o.number).includes(s) || o.customer_name.toLowerCase().includes(s) || (o.customer_phone || "").replace(/\s/g, "").includes(s.replace(/\s/g, ""))));
  }, [orders, status, q]);

  const pages = Math.max(1, Math.ceil(list.length / PER));
  const cur = Math.min(page, pages - 1);
  const shown = list.slice(cur * PER, cur * PER + PER);
  const total = list.filter(isSale).reduce((s, o) => s + (o.total || 0), 0);

  const exportCsv = () => downloadCsv(`historique-commandes_${p.range.from}_${p.range.to}.csv`, [
    ["N°", "Date", "Client", "Téléphone", "Statut", "Articles", "Lieu", "Total (FCFA)"],
    ...list.map((o) => [o.number, when(o.created_at), o.customer_name, o.customer_phone, STATUS[o.status], lines(o).join(" | "), (o.delivery_notes || "").replace(/\n/g, " "), o.total]),
  ]);

  return (
    <>
      <PeriodBar p={p} />
      <div className="adm-filters hist">
        <input type="search" placeholder="Rechercher : n°, nom, téléphone…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} aria-label="Rechercher" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} aria-label="Statut">
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUS).filter(([k]) => k !== "preparing").map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <button className="btn ghost" onClick={exportCsv} disabled={!list.length}>⬇ Exporter (Excel)</button>
      </div>
      {err && <p className="adm-warn">{err}</p>}
      {!orders ? <p className="empty">Chargement…</p> : (
        <section className="panel">
          <p className="muted" style={{ marginBottom: 10 }}><b>{list.length}</b> commande{list.length > 1 ? "s" : ""} · total (hors annulées) <b>{fmt(total)}</b></p>
          {!list.length ? <p className="empty">Aucune commande pour ces critères.</p> : (
            <div className="tbl-wrap">
              <table className="adm-table">
                <thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Statut</th><th className="n">Total</th><th /></tr></thead>
                <tbody>
                  {shown.map((o) => (
                    <Fragment key={o.id}>
                      <tr className={"clk" + (open === o.id ? " open" : "")} onClick={() => setOpen(open === o.id ? null : o.id)}>
                        <td><b>#{o.number}</b></td><td>{when(o.created_at)}</td>
                        <td>{o.customer_name}<small className="muted"> · {o.customer_phone}</small></td>
                        <td><span className={"badge " + o.status}>{STATUS[o.status]}</span></td>
                        <td className="n"><b>{fmt(o.total)}</b></td><td className="chev">{open === o.id ? "▴" : "▾"}</td>
                      </tr>
                      {open === o.id && (
                        <tr className="detail"><td colSpan={6}>
                          <ul>{lines(o).map((l, i) => <li key={i}>{l}</li>)}</ul>
                          {o.delivery_notes && <p><b>📍 Lieu :</b> <span style={{ whiteSpace: "pre-line" }}>{o.delivery_notes}</span></p>}
                        </td></tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pages > 1 && (
            <div className="pager">
              <button className="btn ghost small" disabled={cur === 0} onClick={() => setPage(cur - 1)}>← Précédent</button>
              <span className="muted">Page {cur + 1} / {pages}</span>
              <button className="btn ghost small" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Suivant →</button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
