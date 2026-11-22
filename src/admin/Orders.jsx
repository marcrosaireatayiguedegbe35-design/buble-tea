import { useCallback, useEffect, useState } from "react";
import { sb } from "../supabase.js";
import { beep, fmt, toast } from "../utils.js";

const STATUS = { new: "Nouvelle", ready: "Préparée", delivered: "Livrée", undelivered: "Non remise", cancelled: "Annulée" };
const ORDER = ["new", "ready", "delivered", "undelivered", "cancelled"];
const FILTERS = [["active", "En cours"], ["new", "Nouvelles"], ["ready", "Préparées"], ["delivered", "Livrées"], ["undelivered", "Non remises"], ["cancelled", "Annulées"], ["all", "Toutes"]];

function Linkify({ text }) {
  return text.split(/(https?:\/\/[^\s)]+)/g).map((part, i) =>
    /^https?:\/\//.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part.includes("maps.google") ? "📍 Ouvrir la carte" : part}</a>
      : part
  );
}

// Numéro au format international pour wa.me (ajoute l'indicatif du pays si le client ne l'a pas saisi)
function waNumber(phone, cc) {
  const raw = phone.trim(), d = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) return d;
  if (d.startsWith("00")) return d.slice(2);
  return cc && !d.startsWith(cc) ? cc + d : d;
}

const Ico = {
  phone: <path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z" fill="currentColor" stroke="none" />,
  pin: <path d="M12 22s7-6.3 7-12.2A7 7 0 0 0 5 9.8C5 15.7 12 22 12 22zm0-9.5a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6z" fill="currentColor" stroke="none" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
};
const Svg = ({ k }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{Ico[k]}</svg>;

const ago = (iso) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
  return m < 1 ? "à l'instant" : m < 60 ? `Il y a ${m} min` : m < 1440 ? `Il y a ${Math.floor(m / 60)} h` : `Il y a ${Math.floor(m / 1440)} j`;
};
const lieuOf = (n) => { const m = (n || "").match(/Lieu\s*:\s*([^\n]*)/); return m ? m[1].trim() : (n || "").split("\n")[0]; };

function OrderCard({ o, onStatus, onDelete, cc }) {
  const [open, setOpen] = useState(false);
  const tel = o.customer_phone.replace(/[^\d+]/g, "");
  const wa = waNumber(o.customer_phone, cc);
  const hello = encodeURIComponent(`Bonjour ${o.customer_name}, c'est BubbleTea au sujet de votre commande n°${o.number}.`);
  const when = new Date(o.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const qty = o.order_items.reduce((t, i) => t + i.quantity, 0);
  const names = [...new Set(o.order_items.map((i) => i.product_name))];
  return (
    <article className={"orow " + o.status + (open ? " open" : "")}>
      <div className="or-main">
        <div className="or-c1">
          <b className="or-num">#{o.number}</b>
          <span>{when}</span>
          <span className="or-ago"><Svg k="clock" />{ago(o.created_at)}</span>
        </div>
        <div className="or-c2">
          <b className="or-name">{o.customer_name}</b>
          <span className="or-line"><Svg k="phone" />{o.customer_phone}</span>
          {o.delivery_notes && <span className="or-line"><Svg k="pin" />Lieu : {lieuOf(o.delivery_notes)}</span>}
          <div className="or-chips">
            <span className="c1">{qty} article{qty > 1 ? "s" : ""}</span>
            {names.slice(0, 3).map((n) => <span key={n}>{n}</span>)}
            {names.length > 3 && <span>+{names.length - 3}</span>}
          </div>
        </div>
        <div className="or-c3">
          <label className={"or-status " + o.status}><i />
            <select value={o.status === "preparing" ? "ready" : o.status} aria-label="Statut de la commande" onChange={(e) => onStatus(o.id, e.target.value)}>
              {ORDER.map((k) => <option key={k} value={k}>{STATUS[k]}</option>)}
            </select>
          </label>
          <div className="or-bottom">
            <b className="or-total">{fmt(o.total)}</b>
            <button className="or-detail" aria-expanded={open} onClick={() => setOpen(!open)}><Svg k="eye" />{open ? "Masquer" : "Voir détails"}</button>
          </div>
        </div>
      </div>

      {open && (
        <div className="or-more">
          <div className="oc-body">
            <section className="oc-items">
              <h4>Articles</h4>
              <ul>
                {o.order_items.map((i) => (
                  <li key={i.id}>
                    <span className="q">{i.quantity}×</span>
                    <span className="n"><b>{i.product_name}</b>{(i.options || []).length > 0 && <small>{i.options.map((x) => `${x.group} : ${x.name}`).join(" • ")}</small>}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="oc-info">
              <h4>Client</h4>
              <p className="oc-line"><b>{o.customer_name}</b></p>
              <a className="oc-line" href={"tel:" + tel}>📞 {o.customer_phone}</a>
              {o.delivery_notes ? <p className="oc-line deliv"><span style={{ whiteSpace: "pre-line", overflowWrap: "anywhere" }}><Linkify text={o.delivery_notes} /></span></p> : <p className="muted">Aucune indication.</p>}
            </section>
          </div>
          <div className="actions">
            <a className="btn ghost small" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${wa}?text=${hello}`}>WhatsApp</a>
            <a className="btn ghost small" href={"tel:" + tel}>Appeler</a>
            <button className="btn danger small oc-del" onClick={() => onDelete(o)} aria-label="Supprimer la commande">🗑 Supprimer</button>
          </div>
        </div>
      )}
    </article>
  );
}

export default function Orders() {
  const [filter, setFilter] = useState("active");
  const [orders, setOrders] = useState(null);
  const [err, setErr] = useState("");
  const [cc, setCc] = useState("229");
  const [q, setQ] = useState("");
  const [nActive, setNActive] = useState(0);

  const load = useCallback(async () => {
    let q = sb.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(100);
    if (filter === "active") q = q.in("status", ["new", "preparing", "ready"]);
    else if (filter !== "all") q = q.eq("status", filter);
    const r = await q;
    if (r.error) setErr(r.error.message); else { setErr(""); setOrders(r.data); }
    const c = await sb.from("orders").select("id", { count: "exact", head: true }).in("status", ["new", "preparing", "ready"]);
    if (!c.error) setNActive(c.count || 0);
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    sb.from("settings").select("value").eq("key", "country_code").then((r) => { const v = r.data?.[0]?.value; if (v) setCc(String(v).replace(/\D/g, "")); });
  }, []);

  // Temps réel : une nouvelle commande apparaît toute seule, avec un bip
  useEffect(() => {
    let t;
    const ch = sb.channel("orders-live-" + Math.random().toString(36).slice(2))
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (p) => {
        if (p.eventType === "INSERT") beep();
        clearTimeout(t); t = setTimeout(load, 600);
      })
      .subscribe();
    return () => { clearTimeout(t); sb.removeChannel(ch); };
  }, [load]);

  const setStatus = async (id, status) => {
    const r = await sb.from("orders").update({ status }).eq("id", id);
    if (r.error) toast(r.error.message, true); else { load(); window.dispatchEvent(new Event("orders-changed")); }
  };

  const del = async (o) => {
    if (!window.confirm(`Supprimer définitivement la commande #${o.number} de ${o.customer_name} ?\nCette action est irréversible.`)) return;
    const r = await sb.from("orders").delete().eq("id", o.id);
    if (r.error) toast(r.error.message, true); else { toast("Commande supprimée"); load(); window.dispatchEvent(new Event("orders-changed")); }
  };

  const t = q.trim().toLowerCase();
  const shown = (orders || []).filter((o) => !t || `${o.number} ${o.customer_name} ${o.customer_phone}`.toLowerCase().includes(t));

  return (
    <>
      <div className="ofilters">
        {FILTERS.map(([id, l]) => (
          <button key={id} className={filter === id ? "on" : ""} onClick={() => setFilter(id)}>
            {l}{id === "active" && <em>{nActive}</em>}
          </button>
        ))}
      </div>
      <label className="osearch"><Svg k="search" />
        <input type="search" placeholder="Rechercher une commande…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher une commande" />
      </label>
      {err && <p className="empty">Erreur : {err}</p>}
      {orders && !shown.length && <p className="empty">{q ? "Aucune commande ne correspond." : "Aucune commande ici pour le moment."}</p>}
      <div className="olist">
        {shown.map((o) => <OrderCard key={o.id} o={o} onStatus={setStatus} onDelete={del} cc={cc} />)}
      </div>
    </>
  );
}
