import { Link } from "react-router-dom";
import { useMenu } from "../MenuContext.jsx";

// Page d'accueil reproduite d'après la maquette (grille de 846 × 1858).
// Toutes les mesures de home.css sont exprimées en unités « u » = 1 px de la maquette.

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12h15M13 5l7 7-7 7" />
  </svg>
);

export default function Home() {
  const { products } = useMenu();
  const matcha = products.find((p) => /matcha/i.test(p.name) && p.available);
  const orderTo = matcha ? `/produit/${matcha.id}` : "/categories";


  return (
    <div className="shop hm">
      <div className="hm-bg" aria-hidden="true" />

      <header className="hm-top">
        <Link to="/" className="hm-brand" aria-label="BubbleTea, accueil">
          <img className="hm-logo" src="/logo.webp" alt="" width="67" height="107" />
          <span className="hm-name"><b>BubbleTea</b><small>Goût • Fraîcheur • Bonheur</small></span>
        </Link>
      </header>

      <main className="hm-stack">
        <h1>Le bon goût<br />du bubble tea,<br /><em>chez toi</em></h1>

        <p className="hm-sub">
          Fraîcheur et plaisir, à chaque gorgée !
          <svg className="hm-stroke" viewBox="0 0 200 34" aria-hidden="true"><path d="M2 31 C 55 8, 130 4, 198 6" fill="none" stroke="#ffe01b" strokeWidth="6" strokeLinecap="round" /></svg>
        </p>

        <Link to="/categories" className="hm-cta"><span>J'en profite</span><span className="dot"><Arrow /></span></Link>

        <section className="hm-card" aria-label="Notre spécialité">
          <span className="hm-badge"><span aria-hidden="true">★</span> Notre spécialité<span className="spark" aria-hidden="true">✦</span></span>
          <h2>Thé Matcha aux perles</h2>
          <p>Un mélange unique de thé matcha et de perles fondantes.</p>
          <Link to={orderTo} className="hm-order"><span>Commander</span><span className="dot"><Arrow /></span></Link>
          <img className="hm-cup" src="/matcha.webp" alt="Thé matcha glacé aux perles, feuilles de thé et poudre de matcha" width="357" height="370" />
        </section>
      </main>
    </div>
  );
}
