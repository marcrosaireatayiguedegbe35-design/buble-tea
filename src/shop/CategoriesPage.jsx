import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMenu, useFeaturedList } from "../MenuContext.jsx";
import { useCart } from "../CartContext.jsx";

// Page « Catégories » (accueil de la carte) reproduite d'après la maquette. Ne défile pas.

const num = (n) => new Intl.NumberFormat("fr-FR").format(n || 0);

const P = {
  cart: <><path d="M2.5 3.5h3l2.2 11h10.6l2-8H6.3" /><circle cx="9" cy="19.5" r="1.7" /><circle cx="17" cy="19.5" r="1.7" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  arrow: <path d="M4 12h15M13 5l7 7-7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  home: <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  grid: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.500" y="4" width="6.500" height="6.500" rx="1.500" /><rect x="4" y="13.500" width="6.500" height="6.500" rx="1.500" /><rect x="13.500" y="13.500" width="6.500" height="6.500" rx="1.500" /></>,
  list: <><path d="M6 3h12a1.500 1.500 0 0 1 1.500 1.500v15A1.500 1.500 0 0 1 18 21H6a1.500 1.500 0 0 1-1.500-1.500v-15A1.500 1.500 0 0 1 6 3z" /><path d="M8.500 8h7M8.500 12h7M8.500 16h4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.400 3.600-7 8-7s8 2.600 8 7" /></>,
  heart: <path d="M12 20.500s-7.500-4.600-7.500-10A4.300 4.300 0 0 1 12 7.600a4.300 4.300 0 0 1 7.500 2.900c0 5.400-7.500 10-7.500 10z" />,
  star: <path d="m12 3 2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9z" fill="currentColor" stroke="none" />,
  scooter: <><circle cx="6" cy="17" r="2.600" /><circle cx="18" cy="17" r="2.600" /><path d="M8.600 17H15l-2-8h-3M16 6h2.500M3 12h4" /></>,
  shield: <><path d="M12 3 4.500 6v5.500c0 4.600 3.100 8.200 7.500 9.500 4.400-1.300 7.500-4.900 7.500-9.500V6z" /><path d="m8.500 12 2.500 2.500 4.500-5" /></>,
  headset: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="13" width="4" height="6" rx="1.500" /><rect x="17" y="13" width="4" height="6" rx="1.500" /><path d="M19 19c0 1.500-1.500 2-4 2" /></>,
};
const Ic = ({ k, sw = 2 }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[k]}</svg>;

const shortName = (n) => (n || "").replace(/\s*&\s*/g, " & ");

export default function CategoriesPage() {
  const { categories, products, loading, error } = useMenu();
  const { count } = useCart();
  const list = useFeaturedList(4);
  const [bi, setBi] = useState(0);
  useEffect(() => { if (list.length < 2) return; const t = setInterval(() => setBi((i) => i + 1), 5000); return () => clearInterval(t); }, [list.length]);
  const feat = list.length ? list[bi % list.length] : null;
  const [favs, setFavs] = useState(() => { try { return JSON.parse(localStorage.getItem("favs") || "[]"); } catch { return []; } });
  const toggleFav = (e, id) => {
    e.preventDefault(); e.stopPropagation();
    setFavs((f) => { const n = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]; try { localStorage.setItem("favs", JSON.stringify(n)); } catch (_) {} return n; });
  };
  const [q, setQ] = useState("");

  const sellable = useMemo(() => products.filter((p) => p.published !== false), [products]);
  const chips = useMemo(() => categories.map((c) => {
    const items = sellable.filter((p) => p.category_id === c.id);
    return { ...c, items, img: items.find((p) => p.image_url)?.image_url };
  }), [categories, sellable]);

  const cur = chips[0];
  const term = q.trim().toLowerCase();
  const results = term ? sellable.filter((p) => p.name.toLowerCase().includes(term) || (p.description || "").toLowerCase().includes(term)) : null;
  // Mélange de toutes les catégories : un produit de chaque catégorie à tour de rôle, puis les autres
  const featured = useMemo(() => {
    const cols = [...chips.map((c) => c.items), sellable.filter((p) => !chips.some((c) => c.id === p.category_id))].filter((a) => a.length);
    const out = [];
    for (let i = 0; out.length < 8 && cols.some((a) => a[i]); i++) cols.forEach((a) => { if (a[i] && out.length < 8) out.push(a[i]); });
    return out;
  }, [chips, sellable]);

  let lastOrder = null;
  try { lastOrder = localStorage.getItem("lastOrder"); } catch (_) {}

  const Card = ({ p, star }) => (
    <Link to={`/produit/${p.id}`} className={"cg-card" + (p.available === false ? " off" : "")}>
      <span className="ph">{p.image_url ? <img src={p.image_url} alt="" loading="lazy" /> : <b>{p.name.charAt(0)}</b>}<button type="button" className={"fav" + (favs.includes(p.id) ? " on" : "")} aria-label="Ajouter aux favoris" onClick={(e) => toggleFav(e, p.id)}><Ic k="heart" /></button></span>
      <span className="nm">{p.name}</span>
      <span className="pr"><span>{num(p.price)} CFA</span><i className="add" aria-hidden="true"><Ic k="plus" sw={3} /></i></span>
    </Link>
  );

  return (
    <div className="shop cg">
      <header className="cg-top">
        <Link to="/" className="cg-brand" aria-label="BubbleTea, accueil">
          <img src="/logo.webp" alt="" width="60" height="96" />
          <span><b>Bubble<i>Tea</i></b><small>Thé · Fraîcheur · Bonheur</small></span>
        </Link>
        <Link to="/panier" className="cg-cart" aria-label={`Panier, ${count} article(s)`}><Ic k="cart" /><span className="bd">{count}</span></Link>
      </header>

      <label className="cg-search"><Ic k="search" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un thé, un snack…" aria-label="Rechercher" />
      </label>

      {error && <p className="cg-msg">{error}</p>}
      {loading && <p className="cg-msg">Chargement…</p>}

      {!loading && !error && results && (
        <section className="cg-res">
          <h2>{results.length} résultat{results.length > 1 ? "s" : ""}</h2>
          <div className="cg-grid">{results.map((p) => <Card key={p.id} p={p} />)}</div>
          {!results.length && <p className="cg-msg">Aucun produit trouvé.</p>}
        </section>
      )}

      {!loading && !error && !results && (
        <>
          {!chips.length && <p className="cg-msg">Le menu arrive bientôt.</p>}
          {chips.length > 0 && (
            <nav className="cg-chips" aria-label="Catégories">
              {chips.map((c) => (
                <Link key={c.id} to={`/categorie/${c.id}`} className={"cg-chip" + (cur?.id === c.id ? " on" : "")}>
                  <span className="im">{c.img ? <img src={c.img} alt="" loading="lazy" /> : <b>{c.name.charAt(0)}</b>}</span>
                  <span className="lb">{shortName(c.name)}</span>
                </Link>
              ))}
            </nav>
          )}

          {feat && (
            <section className="cg-banner">
              <Link to={`/produit/${feat.id}`} className="hit" aria-label={`Voir ${feat.name}`} />
              <div className="tx">
                <span className="tag">Offre spéciale ✦</span>
                <h2>{feat.name}</h2>
                <p>{feat.description || `${num(feat.price)} CFA`}</p>
                <Link to={`/produit/${feat.id}`} className="go">Commander <Ic k="arrow" sw={2.4} /></Link>
              </div>
              {feat.image_url && <img key={feat.id} src={feat.image_url} alt="" />}
            </section>
          )}
          {list.length > 1 && (
            <div className="cg-dots" role="tablist" aria-label="Produits à la une">
              {list.map((p, i) => <button key={p.id} role="tab" aria-selected={i === bi % list.length} aria-label={p.name} className={i === bi % list.length ? "on" : ""} onClick={() => setBi(i)} />)}
            </div>
          )}

          {featured.length > 0 && (
            <section className="cg-feat">
              <div className="hd"><h2>Nos incontournables</h2><Link to="/menu">Voir tout <Ic k="arrow" sw={2.4} /></Link></div>
              <div className="row">{featured.map((p) => <Card key={p.id} p={p} />)}</div>
            </section>
          )}

          <div className="cg-trust">
            <span><Ic k="scooter" /><b>Livraison<br />rapide</b></span><i />
            <span><Ic k="shield" /><b>Paiement<br />sécurisé</b></span><i />
            <span><Ic k="headset" /><b>Assistance<br />24/7</b></span>
          </div>
        </>
      )}

      <nav className="cg-nav" aria-label="Navigation">
        <Link to="/"><Ic k="home" /><span>Accueil</span></Link>
        <Link to="/categories" className="on"><Ic k="grid" /><span>Catégories</span></Link>
        <Link to={lastOrder ? `/suivi/${lastOrder}` : "/panier"}><Ic k="list" /><span>Commandes</span></Link>
        <Link to="/contact"><Ic k="user" /><span>Profil</span></Link>
      </nav>
    </div>
  );
}
