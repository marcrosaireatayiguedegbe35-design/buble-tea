import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sb } from "../supabase.js";
import { useCart } from "../CartContext.jsx";
import { useMenu, useShop } from "../MenuContext.jsx";

// Panier reproduit d'après la maquette (grille de 842 px de large).
// Les mesures de cart.css sont en unités « u » = 1 px de la maquette.

const num = (n) => new Intl.NumberFormat("fr-FR").format(n || 0);

const I = {
  back: <path d="M20 12H5M11 5l-7 7 7 7" />,
  cart: <><path d="M2.5 3.5h3l2.2 11h10.6l2-8H6.3" /><circle cx="9" cy="19.5" r="1.7" /><circle cx="17" cy="19.5" r="1.7" /></>,
  arrow: <path d="M4 12h15M13 5l7 7-7 7" />,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 12.200A1.800 1.800 0 0 0 8.800 21h6.400a1.800 1.800 0 0 0 1.800-1.800L18 7M9 7V4.500A1.500 1.500 0 0 1 10.500 3h3A1.500 1.500 0 0 1 15 4.500V7" /></>,
  locate: <><circle cx="12" cy="12" r="3.500" /><circle cx="12" cy="12" r="8" /><path d="M12 1.500v3M12 19.500v3M1.500 12h3M19.500 12h3" /></>,
};
const Svg = ({ k, fill, sw = 2.2 }) => (
  <svg viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{I[k]}</svg>
);
const Pin = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 22s7-6.300 7-12.200A7 7 0 0 0 5 9.800C5 15.700 12 22 12 22zm0-9.500a2.800 2.800 0 1 1 0-5.600 2.800 2.800 0 0 1 0 5.600z" /></svg>;
const Phone = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.600 10.800a15 15 0 0 0 6.600 6.600l2.200-2.200a1 1 0 0 1 1-.25 11.400 11.400 0 0 0 3.600.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.500a1 1 0 0 1 1 1c0 1.250.2 2.450.57 3.600a1 1 0 0 1-.25 1z" /></svg>;
const Person = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="7.500" r="4.200" /><path d="M3.500 21c0-4.700 3.800-7.500 8.500-7.500s8.500 2.800 8.500 7.500z" /></svg>;
const Note = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 3h10l4 4v5.500l-3.200 3.200-.8 3.800-3.800.8H5a1.500 1.500 0 0 1-1.500-1.500V4.500A1.500 1.500 0 0 1 5 3zm2 6v1.600h7V9zm0 3.500v1.600h5v-1.600z" /></svg>;
const Chat = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6.500L8 21v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><circle cx="8.500" cy="10.500" r=".8" fill="currentColor" /><circle cx="12" cy="10.500" r=".8" fill="currentColor" /><circle cx="15.500" cy="10.500" r=".8" fill="currentColor" /></svg>;
const Cloche = () => (
  <svg className="ct-cloche" viewBox="0 0 280 200" aria-hidden="true">
    <path d="M140 18a14 14 0 0 1 14 14v6c62 10 104 56 104 110H22c0-54 42-100 104-110v-6a14 14 0 0 1 14-14z" fill="#d6ebc0" />
    <rect x="4" y="152" width="272" height="22" rx="11" fill="#d6ebc0" />
  </svg>
);

function Header({ back, count }) {
  return (
    <header className="ct-top">
      <button className="ct-round l" aria-label="Retour" onClick={back}><Svg k="back" sw={2.4} /></button>
      <Link to="/" className="ct-brand" aria-label="BubbleTea, accueil">
        <img src="/logo.webp" alt="" width="60" height="96" /><b>Bubble<i>Tea</i></b>
      </Link>
      <Link to="/panier" className="ct-round r" aria-label={`Panier, ${count} article(s)`}><Svg k="cart" /><span className="ct-badge">{count}</span></Link>
    </header>
  );
}

const Scooter = () => (
  <svg viewBox="0 0 130 100" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="4.500" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 40h24M10 51h18M2 62h22" opacity=".8" />
      <rect x="36" y="14" width="26" height="24" rx="3" /><path d="M42 14V8h14v6M36 26h26" />
      <circle cx="44" cy="78" r="13" /><circle cx="112" cy="78" r="13" />
      <path d="M44 78h56M98 56l12 22M94 56H70" />
    </g>
    <circle cx="84" cy="20" r="9" fill="currentColor" />
    <path d="M76 31c-6 6-10 14-12 24h30c1-10-2-18-8-24z" fill="currentColor" />
    <path d="M92 38l16 12" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
  </svg>
);
const Wallet = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.900" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.500" y="6" width="19" height="12.500" rx="2.500" /><circle cx="12" cy="12.250" r="3" /><path d="M6 9.500v.01M18 15v.01" /></svg>
);
const Doc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.900" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v13a1.500 1.500 0 0 1-1.500 1.500h-11A1.500 1.500 0 0 1 5 20V4.500A1.500 1.500 0 0 1 6 3z" /><path d="M9 11h6M9 14.500h6M9 18h3" /></svg>
);
const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
);

function OrderDone({ done, back, count }) {
  const s = done.summary;
  const shop = useShop();
  const wa = (shop.whatsapp || "").replace(/\D/g, "");
  const link = `${location.origin}/suivi/${done.token}`;
  const fmtLabels = (labels) => labels.map((x) => x.replace(/:\s*/, " : ")).join(" • ");
  const lines = s.items.map((l) => `• ${l.qty} × ${l.name}${l.labels.length ? ` (${fmtLabels(l.labels)})` : ""} — ${num(l.unit * l.qty)} FCFA`);
  const message = [
    "Bonjour 👋", `Voici ma commande n°${done.number} :`, ...lines, `Total : ${num(done.total)} FCFA`, "",
    `Nom : ${s.name}`, `Téléphone : ${s.phone}`, `Lieu : ${s.lieu}`, s.notes ? `Indications : ${s.notes}` : null, "", `Suivi : ${link}`,
  ].filter((x) => x !== null).join("\n");
  const waHref = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(message)}` : null;
  const cta = (
    <><span>Suivre ma commande</span><span className="dot"><Svg k="arrow" sw={2.6} /></span></>
  );

  return (
    <div className="shop ct dn">
      <span className="dn-blob a" /><span className="dn-blob b" /><span className="dn-blob c" /><span className="dn-blob d" />
      <Header back={back} count={count} />

      <div className="ct-scroll dn-scroll">
        <div className="dn-check" aria-hidden="true">
          <span className="h1" /><span className="h2" />
          <span className="core"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.200" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.500l4.500 4.500L19 7.500" /></svg></span>
          <svg className="sparks" viewBox="0 0 60 70"><g stroke="#3f9f33" strokeWidth="5" strokeLinecap="round"><path d="M30 6l-8 12" /><path d="M48 24l-14 6" /><path d="M50 46l-13-2" /></g></svg>
        </div>

        <h1 className="dn-title">Commande reçue <span aria-hidden="true">🎉</span></h1>
        <p className="dn-sub">Votre commande n° <b>#{done.number}</b> a bien été prise en compte. Merci pour votre confiance !</p>

        <section className="dn-card">
          <span className="ic"><Scooter /></span><span className="sep" />
          <div><b>Livraison en cours de traitement</b><span>Nous préparons votre commande et vous tiendrons informé(e) de son avancement.</span></div>
        </section>

        <section className="dn-total">
          <span className="ic"><Wallet /></span><span className="sep" />
          <div><span>Montant de la commande</span><b>{num(done.total)} FCFA</b></div>
        </section>

        <details className="dn-details">
          <summary><span className="ic"><Doc /></span><span className="t">Détails de ma commande</span><span className="chev"><Chevron /></span></summary>
          <ul>
            {s.items.map((l, i) => (
              <li key={i}>
                <span><b>{l.qty} × {l.name}</b>{l.labels.length > 0 && <small>{fmtLabels(l.labels)}</small>}</span>
                <em>{num(l.unit * l.qty)} FCFA</em>
              </li>
            ))}
          </ul>
          <dl>
            <dt>Nom</dt><dd>{s.name}</dd>
            <dt>Téléphone</dt><dd>{s.phone}</dd>
            <dt>Lieu</dt><dd>{s.lieu}</dd>
            {s.notes && <><dt>Indications</dt><dd>{s.notes}</dd></>}
          </dl>
        </details>
      </div>

      <div className="ct-foot">
        {waHref && <p className="dn-note">Le suivi de votre commande se fait sur WhatsApp.</p>}
        {waHref
          ? <a className="ct-cta" href={waHref} target="_blank" rel="noopener noreferrer" aria-label="Suivre ma commande sur WhatsApp">{cta}</a>
          : <Link className="ct-cta" to={`/suivi/${done.token}`}>{cta}</Link>}
      </div>
    </div>
  );
}

export default function CartPage() {
  const nav = useNavigate();
  const { cart, total, count, change, remove, clear } = useCart();
  const { demo, products } = useMenu();
  const [name, setName] = useState("");
  const [lieu, setLieu] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [done, setDone] = useState(null);

  const back = () => (window.history.state?.idx > 0 ? nav(-1) : nav("/categories"));

  // Localisation : uniquement quand le client appuie sur le bouton (le navigateur demande l'autorisation)
  const locate = () => {
    setErr("");
    if (!navigator.geolocation) return setErr("La localisation n'est pas disponible sur cet appareil.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: a, longitude: o } }) => {
        const la = a.toFixed(5), lo = o.toFixed(5);
        setLieu(`Position GPS : ${la}, ${lo} (https://maps.google.com/?q=${la},${lo})`);
        setLocating(false);
      },
      () => { setLocating(false); setErr("Impossible de te localiser. Écris ton adresse."); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async () => {
    setErr("");
    if (demo) return setErr("Les commandes sont indisponibles pour le moment.");
    if (name.trim().length < 2) return setErr("Indique ton nom.");
    if (lieu.trim().length < 3) return setErr("Indique le lieu de livraison.");
    if (phone.replace(/\D/g, "").length < 8) return setErr("Indique un numéro de téléphone valide.");
    setBusy(true);
    const fullNotes = `Lieu : ${lieu.trim()}` + (notes.trim() ? `\nIndications : ${notes.trim()}` : "");
    const { data, error } = await sb.rpc("place_order", {
      p_name: name, p_phone: phone, p_notes: fullNotes,
      p_items: cart.map((l) => ({ product_id: l.product_id, quantity: l.qty, option_ids: l.option_ids })),
    });
    setBusy(false);
    if (error) return setErr(/indisponible/i.test(error.message) ? "Un produit de ton panier n'est plus disponible. Retire-le pour continuer." : "Erreur : " + error.message);
    try { localStorage.setItem("lastOrder", data.token); } catch (_) {}
    const summary = {
      name: name.trim(), phone: phone.trim(), lieu: lieu.trim(), notes: notes.trim(),
      items: cart.map((l) => ({ name: l.name, labels: l.labels, qty: l.qty, unit: l.unit })),
    };
    clear();
    setDone({ ...data, summary });
  };

  if (done) return <OrderDone done={done} back={() => nav("/categories")} count={count} />;

  return (
    <div className="shop ct">
      <Cloche />
      <Header back={back} count={count} />

      <div className="ct-title">
        <h1>Mon panier</h1>
        <p>Vérifiez votre commande avant de valider</p>
      </div>

      <div className="ct-scroll">
        {!cart.length ? (
          <div className="ct-empty">
            <p>Ton panier est vide.</p>
            <Link className="ct-cta" to="/categories"><span>Voir la carte</span><span className="dot"><Svg k="arrow" sw={2.6} /></span></Link>
          </div>
        ) : (
          <>
            {cart.map((l) => {
              const img = l.image || products.find((p) => p.id === l.product_id)?.image_url;
              return (
                <article className="ct-item" key={l.key}>
                  <div className="ph">{img ? <img src={img} alt="" /> : <span>{(l.name || "?").charAt(0).toUpperCase()}</span>}</div>
                  <div className="info">
                    <b>{l.name}</b>
                    {l.labels.length > 0 && <span className="opts">{l.labels.map((x) => x.replace(/:\s*/, " : ")).join(" • ")}</span>}
                    <span className="pr">{num(l.unit * l.qty)} FCFA</span>
                    <span className="un">{num(l.unit)} FCFA x {l.qty}</span>
                  </div>
                  <button className="del" aria-label={`Retirer ${l.name}`} onClick={() => remove(l.key)}><Svg k="trash" /></button>
                  <div className="step">
                    <button aria-label="Moins" onClick={() => change(l.key, -1)}>−</button>
                    <b>{l.qty}</b>
                    <button aria-label="Plus" onClick={() => change(l.key, 1)}>+</button>
                  </div>
                </article>
              );
            })}

            <div className="ct-total"><span>Total</span><span>{num(total)} FCFA</span></div>

            <div className="ct-form">
              <label className="f" htmlFor="ct-name"><span className="ic"><Person /></span>Votre nom <i>*</i></label>
              <div className="inp"><span className="lead"><Person /></span><input id="ct-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" autoComplete="name" maxLength={100} /></div>

              <label className="f" htmlFor="ct-lieu"><span className="ic"><Pin /></span>Lieu de livraison <i>*</i></label>
              <div className="inp"><span className="lead"><Pin /></span>
                <input id="ct-lieu" value={lieu} onChange={(e) => setLieu(e.target.value)} placeholder="Quartier, rue, maison, repère…" autoComplete="street-address" maxLength={200} />
                <button type="button" className="loc" aria-label="Utiliser ma position" disabled={locating} onClick={locate}><Svg k="locate" sw={2.2} /></button>
              </div>

              <label className="f" htmlFor="ct-tel"><span className="ic"><Phone /></span>Téléphone <i>*</i></label>
              <div className="inp"><span className="lead"><Phone /></span><input id="ct-tel" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Votre numéro de téléphone" autoComplete="tel" maxLength={30} /></div>

              <label className="f" htmlFor="ct-notes"><span className="ic"><Note /></span>Indications pour le livreur</label>
              <div className="inp area"><span className="lead"><Chat /></span>
                <textarea id="ct-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Quartier, rue, maison, repère connu… (facultatif)" maxLength={100} rows={2} />
                <small>{notes.length}/100</small>
              </div>
            </div>
          </>
        )}
      </div>

      {cart.length > 0 && (
        <div className="ct-foot">
          {err && <p className="ct-err" role="alert">{err}</p>}
          <button className="ct-cta" disabled={busy} onClick={submit}>
            <span>{busy ? "Envoi…" : `Valider - ${num(total)} FCFA`}</span><span className="dot"><Svg k="arrow" sw={2.6} /></span>
          </button>
        </div>
      )}
    </div>
  );
}
