import { useMemo } from "react";
import { fmt } from "../utils.js";
import { PeriodBar, dayOf, fdate, isSale, sumUp, useOrders, usePeriod, ymd } from "./period.jsx";

const STATUS = { new: "Nouvelles", ready: "Préparées", delivered: "Livrées", undelivered: "Non remises", cancelled: "Annulées" };
const TONE = { new: "#f0b018", ready: "#075ea8", delivered: "#16a34a", undelivered: "#e8590c", cancelled: "#dc2626" };

function Kpi({ label, value, sub, tone, icon }) {
  return (
    <div className="kpi" style={{ "--tone": tone }}>
      <span className="kpi-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icon}</svg></span>
      <div className="kpi-copy"><span className="kpi-label">{label}</span><span className="kpi-value">{value}</span>{sub && <span className="kpi-sub">{sub}</span>}</div>
    </div>
  );
}

const short = (n) => n >= 1e6 ? (n / 1e6).toFixed(1).replace(".0", "") + " M" : n >= 1e3 ? Math.round(n / 1e3) + " k" : String(n);

function Chart({ days }) {
  const W = 720, H = 220, L = 44, B = 26, T = 10;
  const max = Math.max(1, ...days.map((d) => d.ca));
  const bw = (W - L) / days.length;
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const step = Math.ceil(days.length / 8);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Ventes par jour">
      {[0, .5, 1].map((f) => (
        <g key={f}><line x1={L} x2={W} y1={y(max * f)} y2={y(max * f)} stroke="#e4edf6" /><text x={L - 6} y={y(max * f) + 4} textAnchor="end" fontSize="11" fill="#5a7a9a">{short(Math.round(max * f))}</text></g>
      ))}
      {days.map((d, i) => {
        const x = L + i * bw, w = Math.max(3, Math.min(26, bw * .6));
        return (
          <g key={d.day}>
            <title>{`${fdate(d.day)} — ${d.n} commande${d.n > 1 ? "s" : ""}, ${fmt(d.ca)}`}</title>
            <rect x={x + (bw - w) / 2} y={y(d.ca)} width={w} height={Math.max(0, H - B - y(d.ca))} rx="3" fill="#075ea8" />
            {i % step === 0 && <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#5a7a9a">{d.day.slice(8)}/{d.day.slice(5, 7)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export default function Dashboard() {
  const p = usePeriod("30d");
  const { orders, err } = useOrders(p.range);

  const data = useMemo(() => {
    if (!orders) return null;
    const s = sumUp(orders);
    const map = {};
    const a = new Date(p.range.from + "T12:00:00"), b = new Date(p.range.to + "T12:00:00");
    const span = Math.round((b - a) / 864e5) + 1;
    const bucket = (day) => { if (span <= 62) return day; const d = new Date(day + "T12:00:00"); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ymd(d); };
    for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) { const k = bucket(ymd(d)); map[k] ||= { day: k, ca: 0, n: 0 }; }
    orders.filter(isSale).forEach((o) => { const m = (map[bucket(dayOf(o.created_at))] ||= { day: bucket(dayOf(o.created_at)), ca: 0, n: 0 }); m.ca += o.total || 0; m.n++; });
    const days = Object.values(map).sort((x, y) => x.day.localeCompare(y.day));
    const top = {};
    orders.filter(isSale).forEach((o) => (o.order_items || []).forEach((i) => { top[i.product_name] = (top[i.product_name] || 0) + i.quantity; }));
    const tops = Object.entries(top).sort((x, y) => y[1] - x[1]).slice(0, 6);
    const byStatus = Object.keys(STATUS).map((k) => [k, orders.filter((o) => (o.status === "preparing" ? "ready" : o.status) === k).length]);
    const best = days.reduce((m, d) => (d.ca > m.ca ? d : m), { ca: 0, day: "" });
    return { s, days, tops, byStatus, best, weekly: span > 62 };
  }, [orders, p.range.from, p.range.to]);

  return (
    <>
      <PeriodBar p={p} />
      {err && <p className="adm-warn">{err}</p>}
      {!data ? <p className="empty">Chargement…</p> : (
        <>
          <div className="kpi-grid">
            <Kpi label="Chiffre d'affaires" value={fmt(data.s.ca)} sub="Commandes non annulées" tone="#075ea8" icon={<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />} />
            <Kpi label="Commandes" value={data.s.count} sub={`${data.s.deliveredN} livrée${data.s.deliveredN > 1 ? "s" : ""} · ${data.s.openN} en cours`} tone="#16a34a" icon={<path d="M6 4h12l1 4H5l1-4ZM5 8h14v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8Zm4 4h6" />} />
            <Kpi label="Panier moyen" value={fmt(data.s.avg)} sub="Par commande" tone="#2a7ec8" icon={<path d="M6 6h15l-2 9H8L6 6Zm0 0L5 3H2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />} />
            <Kpi label="Encaissé (livré)" value={fmt(data.s.deliveredAmt)} sub={data.s.openAmt ? `${fmt(data.s.openAmt)} à venir` : "Rien en attente"} tone="#f0b018" icon={<path d="m5 12 4 4 10-10" />} />
          </div>

          <div className="dash-row">
            <section className="panel">
              <div className="panel-head"><h2 className="panel-title">Ventes {data.weekly ? "par semaine" : "par jour"}</h2></div>
              <Chart days={data.days} />
              {data.best.ca > 0 && <p className="muted" style={{ marginTop: 6 }}>Meilleur {data.weekly ? "semaine" : "jour"} : <b>{fdate(data.best.day)}</b> avec {fmt(data.best.ca)}.</p>}
            </section>
            <section className="panel">
              <h2 className="panel-title">Statut des commandes</h2>
              <ul className="hbars">
                {data.byStatus.map(([k, n]) => (
                  <li key={k}><span className="hb-l">{STATUS[k]}</span><span className="hb-t"><i style={{ width: n / Math.max(1, orders.length) * 100 + "%", background: TONE[k] }} /></span><b>{n}</b></li>
                ))}
              </ul>
              {data.s.cancelledN > 0 && <p className="muted">Annulées ou non remises : {fmt(data.s.cancelledAmt)} non comptés dans le chiffre d'affaires.</p>}
            </section>
          </div>

          <section className="panel">
            <h2 className="panel-title">Produits les plus vendus</h2>
            {!data.tops.length ? <p className="muted">Aucune vente sur cette période.</p> : (
              <ul className="hbars">
                {data.tops.map(([n, q]) => <li key={n}><span className="hb-l">{n}</span><span className="hb-t"><i style={{ width: q / data.tops[0][1] * 100 + "%", background: "#075ea8" }} /></span><b>{q}</b></li>)}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
