import { effPrice, promoOn, promoPct } from "../utils.js";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMenu } from "../MenuContext.jsx";
import { useCart } from "../CartContext.jsx";
import { toast } from "../utils.js";

// Fiche produit reproduite d'après la maquette (grille de 941 × 1672).
// Les mesures de product.css sont en unités « u » = 1 px de la maquette.

const num = (n) => new Intl.NumberFormat("fr-FR").format(n || 0);

const Back = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12H5M11 5l-7 7 7 7" /></svg>
);
const CartIcon = ({ solid }) => (
  <svg viewBox="0 0 24 24" fill={solid ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 3.5h3l2.2 11h10.6l2-8H6.3" /><circle cx="9" cy="19.5" r="1.7" /><circle cx="17" cy="19.5" r="1.7" /></svg>
);
const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" /></svg>
);

export default function ProductPage() {
  const { id } = useParams();
  const { products, loading } = useMenu();
  const p = products.find((x) => x.id === id);
  if (loading) return <div className="shop pd"><p className="pd-msg">Chargement…</p></div>;
  if (!p) return <div className="shop pd"><p className="pd-msg">Produit introuvable.</p><Link className="pd-back-link" to="/categories">← Retour à la carte</Link></div>;
  return <Detail key={p.id} p={p} />;
}

function Detail({ p }) {
  const nav = useNavigate();
  const { categories } = useMenu();
  const cat = categories.find((c) => c.id === p.category_id);
  const { add, count } = useCart();
  const [qty, setQty] = useState(1);
  // comme sur la maquette : le premier choix des groupes obligatoires à choix unique est présélectionné
  const [sel, setSel] = useState(() => {
    const s = {};
    p.option_groups.forEach((g) => {
      const first = g.option_items.find((i) => i.available);
      if (g.required && !g.multiple && first) s[g.id] = [first.id];
    });
    return s;
  });
  const [err, setErr] = useState("");

  const chosen = (g) => sel[g.id] || [];
  const unit = p.option_groups.reduce(
    (s, g) => s + g.option_items.filter((i) => chosen(g).includes(i.id)).reduce((a, i) => a + i.price_delta, 0),
    effPrice(p)
  );
  const toggle = (g, i) => { setErr(""); setSel((s) => {
    const cur = s[g.id] || [];
    if (g.multiple) return { ...s, [g.id]: cur.includes(i.id) ? cur.filter((x) => x !== i.id) : [...cur, i.id] };
    if (!g.required && cur.includes(i.id)) return { ...s, [g.id]: [] };
    return { ...s, [g.id]: [i.id] };
  }); };

  const goBack = () => (window.history.state?.idx > 0 ? nav(-1) : nav("/categories"));
  const submit = () => {
    if (!p.available) return;
    const missing = p.option_groups.find((g) => g.required && g.option_items.some((i) => i.available) && chosen(g).length === 0);
    if (missing) { setErr(`Choisis : ${missing.name}`); return; }
    const ids = [], labels = [];
    p.option_groups.forEach((g) => {
      const picked = g.option_items.filter((i) => chosen(g).includes(i.id));
      picked.forEach((i) => ids.push(i.id));
      if (picked.length) labels.push(`${g.name}: ${picked.map((i) => i.name).join(", ")}`);
    });
    add({ key: p.id + "|" + [...ids].sort().join(","), product_id: p.id, name: p.name, option_ids: ids, labels, unit, qty, image: p.image_url || null });
    toast("Ajouté au panier ✓");
    goBack();
  };

  const missingGroup = p.option_groups.find((g) => g.required && g.option_items.some((i) => i.available) && chosen(g).length === 0);
  const jumpTo = (g) => { const el = document.getElementById("g-" + g.id); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); };

  return (
    <div className={"shop pd" + (p.available ? "" : " off")}>
      <div className="pd-photo">
        {p.image_url ? <img src={p.image_url} alt={p.name} /> : <span className="pd-ph">{(p.name || "?").trim().charAt(0).toUpperCase()}</span>}
        <button className="pd-round l" aria-label="Retour" onClick={goBack}><Back /></button>
        <Link to="/panier" className="pd-round r" aria-label={`Panier, ${count} article(s)`}><CartIcon solid />{count > 0 && <span className="pd-badge">{count}</span>}</Link>
      </div>

      <div className="pd-sheet">
        <div className="pd-head">
          <h1>{p.name}</h1>
          <div className="pd-price">
            {promoOn(p) && <s>{num(p.price)}</s>}<em>{num(effPrice(p))} FCFA</em>
            {promoOn(p) && <b className="pd-off">-{promoPct(p)}%</b>}
            {!p.available && <span className="pd-na">Indisponible</span>}
          </div>
          {p.description && <p className="pd-desc">{p.description}</p>}
        </div>

        {p.option_groups.map((g) => {
          const items = g.option_items.filter((i) => i.available);
          if (!items.length) return null;
          return (
            <section className="pd-group" key={g.id} id={"g-" + g.id}>
              <div className="pd-gh">
                <div><h3>{g.name}</h3><span className="pd-hint">{g.multiple ? "Plusieurs choix possibles" : "Choisis 1 option"}</span></div>
                <span className={"pd-req" + (g.required ? " on" : "")}>{g.required ? "Requis" : "Facultatif"}</span>
              </div>
              <div className="pd-list">
                {items.map((i) => {
                  const on = chosen(g).includes(i.id);
                  return (
                    <label key={i.id} className={"pd-opt" + (on ? " on" : "") + (g.multiple ? " multi" : "")}>
                      <input type={g.multiple ? "checkbox" : "radio"} name={"g" + g.id} checked={on} onChange={() => toggle(g, i)} />
                      <i className="mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.500 4.500 4.500L19 7.500" /></svg></i>
                      <span className="n">{i.name}</span>
                      {i.price_delta ? <em>{(i.price_delta > 0 ? "+" : "−") + num(Math.abs(i.price_delta))} FCFA</em> : null}
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="pd-bar">
        {err && <p className="pd-err">{err}</p>}
        <div className="pd-row">
          <div className="pd-step">
            <button aria-label="Moins" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <b>{qty}</b>
            <button aria-label="Plus" onClick={() => setQty((q) => Math.min(50, q + 1))}>+</button>
          </div>
          <button className={"pd-add" + (missingGroup ? " need" : "")} disabled={!p.available}
            aria-label={p.available ? `Ajouter au panier, ${num(unit * qty)} FCFA` : `${p.name} : indisponible`}
            onClick={() => { if (missingGroup) { setErr(`Choisis : ${missingGroup.name}`); jumpTo(missingGroup); return; } submit(); }}>
            <span>{!p.available ? "Indisponible" : missingGroup ? `Choisis : ${missingGroup.name}` : `Ajouter${qty > 1 ? " " + qty : ""}`}</span>
            {p.available && !missingGroup && <b>{num(unit * qty)} FCFA</b>}
          </button>
        </div>
      </div>
    </div>
  );
}
