import { Link } from "react-router-dom";
import { useShop } from "../MenuContext.jsx";
import { ArrowRight, ClockIcon, PhoneIcon, PinIcon, Shell, TopBar } from "./ui.jsx";

export default function Contact() {
  const c = useShop();
  const wa = (c.whatsapp || "").replace(/\D/g, "");
  const rows = [
    c.phone && [<PhoneIcon key="p" />, <a href={"tel:" + c.phone.replace(/[^\d+]/g, "")}>{c.phone}</a>],
    c.address && [<PinIcon key="a" />, c.address],
    c.hours && [<ClockIcon key="h" />, c.hours],
  ].filter(Boolean);
  return (
    <Shell>
      <TopBar />
      <div className="s-photo contact"><img src="/hero.jpg" alt="Nos bubble teas et leurs perles de tapioca" /></div>
      <div className="s-detail">
        <h1 className="serif">Commande en livraison ou au retrait</h1>
        <p className="muted">Passe commande en ligne, sans compte. On te rappelle si besoin.</p>
        {rows.length > 0 ? (
          <ul className="s-info">{rows.map((r, i) => <li key={i}><span className="s-ico">{r[0]}</span><span>{r[1]}</span></li>)}</ul>
        ) : (
          <p className="muted">Les coordonnées de la boutique seront bientôt ici.</p>
        )}
        <div className="s-buy">
          <Link to="/categories" className="s-cta wide"><span>Commander</span><span className="s-cta-dot"><ArrowRight /></span></Link>
          {wa && <a className="s-cta wide light" href={"https://wa.me/" + wa} target="_blank" rel="noopener noreferrer"><span>Écrire sur WhatsApp</span></a>}
        </div>
      </div>
    </Shell>
  );
}
