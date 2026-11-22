import { Link } from "react-router-dom";
import { useMenu } from "../MenuContext.jsx";
import { useCart } from "../CartContext.jsx";

// Page « Notre carte » reproduite d'après la maquette (grille de 941 × 1672).
// Les mesures de categories.css sont en unités « u » = 1 px de la maquette.

const TAGLINES = [
  [/bubble|th[eé]|tea/i, "Fraîcheur en chaque gorgée"],
  [/fruit|jus|smoothie/i, "Naturellement bon"],
  [/snack|fast|burger|plat/i, "Le goût du bonheur"],
  [/dessert|g[aâ]teau|glace|gaufre/i, "Douceur garantie"],
];
const tagline = (name, count) => (TAGLINES.find(([re]) => re.test(name)) || [])[1] || `${count} ${count > 1 ? "produits" : "produit"}`;

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" /></svg>
);
const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 3.5h3l2.2 11h10.6l2-8H6.3" /><circle cx="9" cy="19.5" r="1.7" /><circle cx="17" cy="19.5" r="1.7" /></svg>
);
const ClocheIcon = () => (
  <svg viewBox="0 0 48 40" fill="currentColor" aria-hidden="true"><path d="M24 4a3 3 0 0 1 3 3v1.2C36.5 9.6 43 17 43 26H5C5 17 11.500 9.600 21 8.200V7a3 3 0 0 1 3-3z" /><rect x="2" y="29" width="44" height="5" rx="2.500" /></svg>
);
const Leaf = ({ className }) => (
  <svg className={className} viewBox="0 0 120 190" aria-hidden="true">
    <defs><linearGradient id="lf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#58b32a" /><stop offset="1" stopColor="#1d6e16" /></linearGradient></defs>
    <path d="M10 180C0 110 30 40 108 6c10 70-18 150-98 174z" fill="url(#lf)" />
    <path d="M14 176C40 120 70 70 104 14" stroke="#c6efa2" strokeWidth="2" fill="none" opacity=".7" />
  </svg>
);

export default function CategoriesPage() {
  const { categories, products, loading, error } = useMenu();
  const { count } = useCart();

  const cards = categories.map((c) => {
    const items = products.filter((p) => p.category_id === c.id);
    return { key: c.id, to: `/categorie/${c.id}`, title: c.name, sub: tagline(c.name, items.length), img: items.find((p) => p.image_url)?.image_url };
  });

  return (
    <div className="shop cp">
      <Leaf className="cp-leaf l" />
      <Leaf className="cp-leaf r" />

      <header className="cp-top">
        <Link to="/" className="cp-brand" aria-label="BubbleTea, accueil">
          <img className="cp-logo" src="/logo.webp" alt="" width="82" height="132" />
          <span><b>Bubble<i>Tea</i></b><small>Goût • Fraîcheur • Bonheur</small></span>
        </Link>
        <div className="cp-actions">
          <Link to="/panier" className="cp-round" aria-label={`Panier, ${count} article(s)`}><CartIcon /><span className="cp-badge">{count}</span></Link>
        </div>
      </header>

      <div className="cp-title">
        <h1>Notre carte</h1>
        <p>Découvrez nos délicieuses créations</p>
        <span className="cp-bar" />
      </div>

      <div className="cp-cards">
        {error && <p className="cp-msg">{error}</p>}
        {loading && <p className="cp-msg">Chargement…</p>}
        {!loading && !error && !cards.length && <p className="cp-msg">Le menu arrive bientôt.</p>}
        {cards.map((c, i) => (
          <Link key={c.key} to={c.to} className={"cp-card t" + (i % 4)}>
            <span className="cp-ct"><b>{c.title}</b><small>{c.sub}</small></span>
            {c.img && <img className="cp-ph" src={c.img} alt="" loading="lazy" />}
            <span className="cp-go" aria-hidden="true"><Arrow /></span>
          </Link>
        ))}
      </div>

      <Link to="/menu" className="cp-all">
        <span className="ic"><ClocheIcon /></span><span className="sep" /><span className="txt">Voir toute la carte</span><span className="ar"><Arrow /></span>
      </Link>
    </div>
  );
}
