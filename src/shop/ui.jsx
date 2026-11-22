import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../CartContext.jsx";
import { fmt } from "../utils.js";
import { shopConfig } from "../shopConfig.js";

const svg = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
export const ArrowRight = () => <svg {...svg}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const ArrowLeft = () => <svg {...svg}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
export const PlusIcon = () => <svg {...svg}><path d="M12 5v14M5 12h14" /></svg>;
export const BagIcon = () => <svg {...svg}><path d="M6 8h12l-1 12H7L6 8zM9 8a3 3 0 016 0" /></svg>;
export const PhoneIcon = () => <svg {...svg}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" /></svg>;
export const PinIcon = () => <svg {...svg}><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>;
export const ClockIcon = () => <svg {...svg}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
export const Leaf = ({ className = "s-leaf" }) => (
  <svg className={className} viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
    <path d="M8 54C12 32 28 14 54 8c-2 26-16 42-40 46M8 54L40 22M22 41l-3-11M31 32l-2-10M40 22l-1-9" />
  </svg>
);

export function Thumb({ src, alt = "", name = "" }) {
  if (src) return <img src={src} alt={alt} loading="lazy" />;
  const letter = (name || alt || "?").trim().charAt(0).toUpperCase();
  return <span className="s-ph serif" aria-hidden="true">{letter}</span>;
}

/* ---- Structure ---- */
export function Shell({ children, hideFab }) {
  return <div className="shop">{children}{!hideFab && <Fab />}</div>;
}

export function TopBar({ back = true, dark = false, cart = true }) {
  const nav = useNavigate();
  const { count } = useCart();
  const goBack = () => (window.history.state?.idx > 0 ? nav(-1) : nav("/"));
  return (
    <div className={"s-top" + (dark ? " dark" : "")}>
      {back
        ? <button className="s-circle" aria-label="Retour" onClick={goBack}><ArrowLeft /></button>
        : <Link to="/" className="s-logo"><span className="s-mark">🧋</span><span><b className="serif">{shopConfig.name}</b><small>{shopConfig.tagline}</small></span></Link>}
      {cart && (
        <Link to="/panier" className="s-circle" aria-label={`Panier, ${count} article(s)`}>
          <BagIcon />{count > 0 && <span className="s-dot">{count}</span>}
        </Link>
      )}
    </div>
  );
}

function Fab() {
  const { count, total } = useCart();
  const { pathname } = useLocation();
  if (!count || pathname === "/panier" || pathname.startsWith("/produit") || pathname === "/") return null;
  return (
    <Link className="s-fab" to="/panier">
      <span>Mon panier · {count}</span><b>{fmt(total)}</b><span className="s-cta-dot"><ArrowRight /></span>
    </Link>
  );
}
