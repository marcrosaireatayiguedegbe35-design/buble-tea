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

const LEAF = "M0 0C36-36 112-44 158-4 112 36 36 40 0 0Z";
function Decor() {
  return (
    <svg className="pd-deco" viewBox="0 0 200 520" aria-hidden="true">
      <defs><linearGradient id="pdg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5eb02c" /><stop offset="1" stopColor="#1f6d17" /></linearGradient></defs>
      <path d="M200 40C150 40 118 100 128 190c6 70-40 130-38 210 2 60 60 90 110 90V40z" fill="#e3edcc" opacity=".9" />
      <g fill="url(#pdg)">
        <path d={LEAF} transform="translate(176 92) rotate(-62) scale(.9)" />
        <path d={LEAF} transform="translate(198 196) rotate(186) scale(1.12)" />
        <path d={LEAF} transform="translate(150 262) rotate(60) scale(.85)" />
      </g>
    </svg>
  );
}

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
    p.price
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

  return (
    <div className={"shop pd" + (p.available ? "" : " off")}>
      <div className="pd-photo">
        {p.image_url ? <img src={p.image_url} alt={p.name} /> : <span className="pd-ph">{(p.name || "?").trim().charAt(0).toUpperCase()}</span>}
        <button className="pd-round l" aria-label="Retour" onClick={goBack}><Back /></button>
        <Link to="/panier" className="pd-round r" aria-label={`Panier, ${count} article(s)`}><CartIcon solid />{count > 0 && <span className="pd-badge">{count}</span>}</Link>
      </div>

      <div className="pd-sheet">
        <svg className="pd-wave" viewBox="0 0 941 121" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 60C60 52 110 44 160 52 330 80 520 118 690 112 780 108 820 60 860 24 890 4 915 0 941 0V121H0Z" fill="#f6f1e3" />
        </svg>
        <Decor />

        <div className="pd-body">
          <h1>{p.name}</h1>
          <div className="pd-price"><em>{num(p.price)}</em> FCFA</div>
          {p.description && <p className="pd-desc">{p.description}</p>}

          {p.option_groups.map((g) => {
            const items = g.option_items.filter((i) => i.available);
            if (!items.length) return null;
            return (
              <div className="pd-group" key={g.id}>
                <h3>{g.name} <span>({g.required ? "obligatoire" : "optionnel"})</span></h3>
                <div className="pd-chips">
                  {items.map((i) => {
                    const on = chosen(g).includes(i.id);
                    return (
                      <label key={i.id} className={"pd-chip" + (on ? " on" : "")}>
                        <input type={g.multiple ? "checkbox" : "radio"} name={"g" + g.id} checked={on} onChange={() => toggle(g, i)} />
                        <span>{i.name}</span>
                        {i.price_delta ? <em>{(i.price_delta > 0 ? "+" : "−") + num(Math.abs(i.price_delta))} FCFA</em> : null}
                      </label>
                    );
                  })}
                </div>
              </div>
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
            <button className="pd-add" disabled={!p.available} aria-label={p.available ? `Ajouter au panier, ${num(unit * qty)} FCFA` : `${p.name} : indisponible`} onClick={submit}>
              <CartIcon solid /><span>Ajouter · {num(unit * qty)} FCFA</span>
            </button>
            <Link to="/panier" className="pd-go" aria-label="Voir le panier"><Arrow /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
