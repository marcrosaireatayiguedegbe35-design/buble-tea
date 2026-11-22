import { effPrice, promoOn, promoPct } from "../utils.js";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMenu } from "../MenuContext.jsx";
import { useCart } from "../CartContext.jsx";
import { toast } from "../utils.js";

// Liste des produits (une catégorie, ou toute la carte), reproduite d'après la maquette 941 × 1672.
// Les mesures de menu.css sont en unités « u » = 1 px de la maquette.

const SUBS = [
  [/dessert|g[aâ]teau|glace|gaufre/i, "Choisissez votre dessert préféré"],
  [/snack|fast|burger|plat/i, "Choisissez votre plat préféré"],
  [/bubble|th[eé]|tea|fruit|jus|smoothie|boisson/i, "Choisissez votre boisson préférée"],
];
const subtitle = (name) => (SUBS.find(([re]) => re.test(name)) || [])[1] || "Choisissez votre produit préféré";
const num = (n) => new Intl.NumberFormat("fr-FR").format(n || 0);

const Back = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12H5M11 5l-7 7 7 7" /></svg>
);
const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 3.5h3l2.2 11h10.6l2-8H6.3" /><circle cx="9" cy="19.5" r="1.7" /><circle cx="17" cy="19.5" r="1.7" /></svg>
);
const Plus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
);

const LEAF = "M0 0C36-24 112-30 158-4 112 24 36 28 0 0Z";
function Decor() {
  return (
    <>
      <svg className="mp-deco top" viewBox="0 0 941 480" aria-hidden="true">
        <defs>
          <linearGradient id="mpg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#62b52e" /><stop offset="1" stopColor="#1f6d17" /></linearGradient>
        </defs>
        <path d="M560 0H941V450C905 400 840 330 740 345 650 360 600 300 585 200 575 110 540 40 560 0Z" fill="#e6efd1" />
        <path d="M941 150C850 160 720 250 640 385H941Z" fill="#d8e6bd" />
        <path d="M941 372C925 335 910 305 892 282" stroke="#2f7a1d" strokeWidth="5" strokeLinecap="round" fill="none" />
        <g fill="url(#mpg)">
          <path d={LEAF} transform="translate(893 282) rotate(-78) scale(.92)" />
          <path d={LEAF} transform="translate(893 290) rotate(-172) scale(.95)" />
          <path d={LEAF} transform="translate(912 322) rotate(-192) scale(.8)" />
        </g>
      </svg>
      <svg className="mp-deco bot" viewBox="0 0 941 260" aria-hidden="true">
        <path d="M0 70C140 20 250 110 430 98 610 86 770 10 941 60V260H0Z" fill="#e1ecca" />
        <path d="M0 150C200 120 360 190 560 215 720 235 860 190 941 160V260H0Z" fill="#edf4dc" />
        <path d="M80 258C74 214 80 160 62 118" stroke="#2f7a1d" strokeWidth="4" strokeLinecap="round" fill="none" />
        <g fill="url(#mpg)">
          <path d={LEAF} transform="translate(70 252) rotate(-100) scale(1.0)" />
          <path d={LEAF} transform="translate(95 245) rotate(-55) scale(1.35)" />
          <path d={LEAF} transform="translate(90 258) rotate(-18) scale(1.35)" />
        </g>
        <g fill="none" stroke="#b8d598" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" opacity=".95">
          <path d="M772 66h116l-12 128a14 14 0 0 1-14 12h-64a14 14 0 0 1-14-12z" />
          <path d="M768 66h124M796 66c4-26 28-40 52-40s48 14 52 40" opacity="0" />
          <path d="M850 62l18-34 14 7" />
          <circle cx="803" cy="108" r="9" /><circle cx="828" cy="128" r="9" /><circle cx="852" cy="106" r="9" /><circle cx="838" cy="156" r="9" /><circle cx="866" cy="140" r="9" /><circle cx="808" cy="150" r="9" />
        </g>
      </svg>
      <p className="mp-script" aria-hidden="true">Goût unique,<br />plaisir garanti !<svg viewBox="0 0 130 12"><path d="M2 9C40 2 90 2 128 4" fill="none" stroke="#1f5a2a" strokeWidth="3.4" strokeLinecap="round" /></svg></p>
    </>
  );
}

function Card({ p }) {
  const nav = useNavigate();
  const { add } = useCart();
  const hasOptions = p.option_groups.some((g) => g.option_items.some((i) => i.available));
  const quick = () => {
    if (hasOptions) return nav(`/produit/${p.id}`);
    add({ key: p.id + "|", product_id: p.id, name: p.name, option_ids: [], labels: [], unit: effPrice(p), qty: 1, image: p.image_url || null });
    toast("Ajouté au panier ✓");
  };
  return (
    <article className={"mp-card" + (p.available ? "" : " off")}>
      <Link to={`/produit/${p.id}`} className="mp-img" tabIndex={-1} aria-hidden="true">
        {p.image_url ? <img src={p.image_url} alt="" loading="lazy" /> : <span className="mp-ph">{(p.name || "?").trim().charAt(0).toUpperCase()}</span>}
      </Link>
      <Link to={`/produit/${p.id}`} className="mp-info">
        <b>{p.name}</b>
        {p.description && <span className="d">{p.description}</span>}
        <span className="pr">{promoOn(p) && <s>{num(p.price)}</s>}<em>{num(effPrice(p))}</em> FCFA{promoOn(p) && <b className="pd-off">-{promoPct(p)}%</b>}</span>
      </Link>
      <button className="mp-plus" aria-label={p.available ? `Ajouter ${p.name}` : `${p.name} : indisponible`} disabled={!p.available} onClick={quick}><Plus /></button>
    </article>
  );
}

export default function MenuPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { categories, products, loading, error } = useMenu();
  const { count } = useCart();
  const cat = categories.find((c) => c.id === id);
  const listRef = useRef(null);
  const [scrolls, setScrolls] = useState(false);
  // le fondu du bas n'apparaît que si la liste défile vraiment
  useEffect(() => {
    const check = () => { const l = listRef.current; if (l) setScrolls(l.scrollHeight > l.clientHeight + 2); };
    check();
    window.addEventListener("resize", check);
    const t = setTimeout(check, 400);
    return () => { window.removeEventListener("resize", check); clearTimeout(t); };
  }, [categories, products, loading, id]);

  let sections;
  if (id) sections = [{ title: null, items: products.filter((p) => p.category_id === id) }];
  else {
    const ids = new Set(categories.map((c) => c.id));
    sections = categories.map((c) => ({ title: c.name, items: products.filter((p) => p.category_id === c.id) }));
    const rest = products.filter((p) => !p.category_id || !ids.has(p.category_id));
    if (rest.length) sections.push({ title: "Autres", items: rest });
  }
  sections = sections.filter((s) => s.items.length);

  const title = id ? (cat ? cat.name : "Catégorie") : "Toute la carte";
  const sub = id ? subtitle(cat ? cat.name : "") : "Découvrez toutes nos créations";
  const goBack = () => (window.history.state?.idx > 0 ? nav(-1) : nav("/categories"));

  return (
    <div className="shop mp">
      <Decor />
      <header className="mp-top">
        <button className="mp-round" aria-label="Retour" onClick={goBack}><Back /></button>
        <Link to="/panier" className="mp-round" aria-label={`Panier, ${count} article(s)`}><CartIcon /><span className="mp-badge">{count}</span></Link>
      </header>

      <div className="mp-head">
        <h1 style={{ "--k": title.length > 15 ? 0.72 : title.length > 11 ? 0.84 : 1 }}>{title}</h1>
        <p>{sub}</p>
        <span className="mp-bar" />
      </div>

      <div className={"mp-list" + (scrolls ? " scrolls" : "")} ref={listRef}>
        {error && <p className="mp-msg">{error}</p>}
        {loading && <p className="mp-msg">Chargement…</p>}
        {!loading && !error && !sections.length && <p className="mp-msg">Aucun produit pour le moment.</p>}
        {sections.map((s, i) => (
          <section key={i}>
            {s.title && <h2>{s.title}</h2>}
            {s.items.map((p) => <Card key={p.id} p={p} />)}
          </section>
        ))}
      </div>
    </div>
  );
}
