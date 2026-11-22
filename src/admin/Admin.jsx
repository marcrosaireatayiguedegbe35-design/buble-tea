import { useCallback, useEffect, useState } from "react";
import { sb } from "../supabase.js";
import { beep, sound, toast } from "../utils.js";
import Orders from "./Orders.jsx";
import Products from "./Products.jsx";
import Categories from "./Categories.jsx";
import Settings from "./Settings.jsx";
import Dashboard from "./Dashboard.jsx";
import History from "./History.jsx";
import Accounting from "./Accounting.jsx";
import "../admin.css";

const I = {
  dash: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  history: <path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-4v4h4M12 7v5l3 2" />,
  acc: <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3Zm4 5h6M9 12h6M9 16h3" />,
  orders: <path d="M6 4h12l1 4H5l1-4ZM5 8h14v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8Zm4 4h6" />,
  products: <path d="M4 8l8-4 8 4-8 4-8-4Zm0 0v8l8 4 8-4V8M12 12v8" />,
  cats: <path d="M4 5h7v7H4V5Zm9 0h7v7h-7V5ZM4 14h7v6H4v-6Zm9 0h7v6h-7v-6Z" />,
  settings: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-2.5.1-1a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.3.9a7 7 0 0 0-1.7-1L15 3h-4l-.4 2.4a7 7 0 0 0-1.7 1l-2.3-.9-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.3-.9a7 7 0 0 0 1.7 1L11 21h4l.4-2.4a7 7 0 0 0 1.7-1l2.3.9 2-3.5-2-1.5Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  out: <path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9M16 8l4 4-4 4M20 12H9" />,
  eye: <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  eyeoff: <path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 7.6C3.8 9.4 2 12 2 12s3.5 6 10 6c1.5 0 2.800-.3 4-.9M9.9 9.9a3 3 0 0 0 4.200 4.200" />,
  bell: <path d="M6 16V11a6 6 0 1 1 12 0v5l1.500 2h-15L6 16Zm4 4a2 2 0 0 0 4 0" />,
  site: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
};
const Ico = ({ n }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{I[n]}</svg>
);

const TABS = [
  ["dash", "Tableau de bord", "Tes ventes sur la période de ton choix", "dash", "Pilotage"],
  ["orders", "Commandes", "Consultez et gérez vos commandes", "orders", "Boutique"],
  ["history", "Historique", "Toutes les commandes passées, avec recherche et export", "history"],
  ["products", "Produits", "Publie tes produits avec leurs photos et leurs options", "products"],
  ["cats", "Catégories", "Organise ta carte", "cats"],
  ["acc", "Comptabilité", "Tes ventes calculées automatiquement, jour par jour", "acc", "Gestion"],
  ["settings", "Réglages", "Coordonnées de la boutique et numéro WhatsApp", "settings"],
];

function Login({ onDone }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const go = async () => {
    setErr("");
    if (!email.trim() || !pass) { setErr("Entre ton e-mail et ton mot de passe."); setShake(true); return; }
    setBusy(true);
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pass });
    setBusy(false);
    if (error) { setErr("Connexion refusée : e-mail ou mot de passe incorrect."); setShake(true); } else onDone();
  };
  useEffect(() => { if (shake) { const t = setTimeout(() => setShake(false), 600); return () => clearTimeout(t); } }, [shake]);
  return (
    <div className="lg4">
      <div className="lg4-photo" aria-hidden="true" />
      <h2 className="lg4-slogan">Chaque commande compte,<br />chaque sourire aussi</h2>
      <header className="lg4-top">
        <span className="lg4-logo"><img src="/logo.webp" alt="" /></span>
        <span className="lg4-brand">BUBBLETEA</span>
      </header>
      <main className="lg4-main">
        <h1 className="lg4-title">Bon<br />retour</h1>
        <p className="lg4-sub">Connecte-toi pour suivre tes commandes, publier tes produits et gérer ta carte.</p>
        <form className={"lg4-form" + (shake ? " shake" : "")} onSubmit={(e) => { e.preventDefault(); go(); }} noValidate>
          {err && <p className="login-error" role="alert"><span className="login-error-mark" aria-hidden="true">!</span>{err}</p>}
          <label className="lg4-field" htmlFor="adm-email"><span>E-mail</span>
            <input id="adm-email" type="email" placeholder="Ton e-mail" autoComplete="username" autoCapitalize="none" spellCheck="false" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <div className="lg4-field">
            <label htmlFor="adm-pass"><span>Mot de passe</span></label>
            <div className="lg4-pw">
              <input id="adm-pass" type={show ? "text" : "password"} placeholder="Ton mot de passe" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} />
              <button type="button" className="lg4-eye" onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                <Ico n={show ? "eyeoff" : "eye"} />
              </button>
            </div>
          </div>
          <button type="submit" className="lg4-go" disabled={busy}>{busy ? "Connexion…" : "Connexion"}</button>
          <p className="lg4-or">Gestion des commandes et de la carte</p>
          <p className="lg4-copy">© {new Date().getFullYear()} BubbleTea</p>
        </form>
      </main>
      <svg className="lg4-deco" viewBox="0 0 300 300" aria-hidden="true">
        <circle cx="185" cy="185" r="150" fill="none" stroke="#68b848" strokeWidth="1.2" />
        <circle cx="198" cy="198" r="150" fill="none" stroke="#0888c8" strokeWidth="1.2" />
        <circle cx="212" cy="215" r="150" fill="#0878b8" />
        <circle cx="262" cy="262" r="78" fill="#68b848" opacity=".92" />
      </svg>
    </div>
  );
}

function NotAdmin({ user }) {
  const sql = `insert into public.admins(user_id) values ('${user.id}');`;
  return (
    <div className="adm-wrap">
      <div className="panel" style={{ maxWidth: 560, margin: "40px auto" }}>
        <h2 className="panel-title">Compte pas encore autorisé</h2>
        <p>Tu es connecté, mais ce compte n'a pas encore le droit d'administrer la boutique. Dans Supabase → <b>SQL Editor</b>, exécute cette ligne :</p>
        <pre>{sql}</pre>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn primary small" onClick={() => navigator.clipboard?.writeText(sql).then(() => toast("Copié ✓"))}>Copier la ligne</button>
          <button className="btn ghost small" onClick={() => location.reload()}>J'ai exécuté, recharger</button>
          <button className="btn ghost small" onClick={() => sb.auth.signOut()}>Se déconnecter</button>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [phase, setPhase] = useState("loading"); // loading | login | notadmin | app
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("dash");
  const [soundOn, setSoundOn] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [nav, setNav] = useState(false);

  const check = useCallback(async () => {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { setPhase("login"); return; }
    setUser(session.user);
    const adm = await sb.from("admins").select("user_id").eq("user_id", session.user.id);
    setPhase(adm.error || !adm.data.length ? "notadmin" : "app");
  }, []);

  useEffect(() => {
    check();
    const { data } = sb.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_OUT") setPhase("login"); });
    return () => data.subscription.unsubscribe();
  }, [check]);

  // l'admin ne doit pas être référencé par les moteurs de recherche
  useEffect(() => {
    document.title = "Admin · BubbleTea";
    const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex,nofollow"; document.head.append(m);
    return () => m.remove();
  }, []);

  // pastille « nouvelles commandes » sur l'onglet
  const refreshNew = useCallback(async () => {
    const r = await sb.from("orders").select("id", { count: "exact", head: true }).eq("status", "new");
    if (!r.error) setNewCount(r.count || 0);
  }, []);
  useEffect(() => {
    if (phase !== "app") return;
    refreshNew();
    const ch = sb.channel("adm-new-" + Math.random().toString(36).slice(2))
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => refreshNew()).subscribe();
    window.addEventListener("orders-changed", refreshNew);
    return () => { sb.removeChannel(ch); window.removeEventListener("orders-changed", refreshNew); };
  }, [phase, refreshNew]);

  const toggleSound = () => { sound.on = !sound.on; setSoundOn(sound.on); if (sound.on) beep(); };

  if (phase === "loading") return <div className="adm"><p className="empty">Chargement…</p></div>;
  if (phase === "login") return <div className="adm adm-login"><Login onDone={check} /></div>;
  if (phase === "notadmin") return <div className="adm"><NotAdmin user={user} /></div>;

  const cur = TABS.find((t) => t[0] === tab);
  const name = (user?.email || "Admin").split("@")[0];
  const initials = name.slice(0, 2).toUpperCase();
  const pick = (id) => { setTab(id); setNav(false); };

  return (
    <div className={"adm adm-shell" + (nav ? " nav-open" : "")}>
      <aside className="sidebar" aria-label="Navigation">
        <div className="sb-brand">
          <img src="/logo.webp" alt="" />
          <span><strong>BUBBLETEA</strong><small>Espace admin</small></span>
        </div>
        <nav className="side-nav">
          {TABS.map(([id, label, , ico, group]) => (
            <div key={id} style={{ display: "contents" }}>
              {group && <p className="side-nav-group">{group}</p>}
              <button className={"side-nav-link" + (tab === id ? " is-active" : "")} onClick={() => pick(id)}>
                <span className="side-nav-ico"><Ico n={ico} /></span>
                <span>{label}</span>
                {id === "orders" && newCount > 0 && <span className="adm-pill">{newCount}</span>}
              </button>
            </div>
          ))}
          <div className="side-nav-divider" />
          <a className="side-nav-link" href="/" target="_blank" rel="noopener noreferrer">
            <span className="side-nav-ico"><Ico n="site" /></span><span>Voir le site</span>
          </a>
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="user-avatar" aria-hidden="true">{initials}</span>
            <span className="user-meta"><span className="user-name">{name}</span><span className="user-role">Administrateur</span></span>
            <button className="btn-logout" onClick={() => sb.auth.signOut()}><Ico n="out" />Se déconnecter</button>
          </div>
        </div>
      </aside>
      <button className="sidebar-backdrop" onClick={() => setNav(false)} aria-label="Fermer le menu" />

      <div className="main">
        <div className="mobile-bar">
          <button className="nav-toggle" onClick={() => setNav(true)} aria-label="Menu"><Ico n="menu" /></button>
          <span className="mobile-bar-brand"><img src="/logo.webp" alt="" />BUBBLETEA</span>
          <span className="user-avatar" aria-hidden="true">{initials}</span>
        </div>
        <div className="topbar2">
          <span className="tb2-hello">Bonjour <b>{name}</b></span>
          <button type="button" className="tb2-bell" onClick={toggleSound} aria-pressed={soundOn} title={soundOn ? "Son des commandes activé" : "Son coupé"}>
            <Ico n="bell" />{!soundOn && <i className="bell-off" aria-hidden="true" />}
            {newCount > 0 && soundOn && <i className="bell-dot" aria-hidden="true" />}
          </button>
          <span className="tb2-date">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
        <div className="content">
          <header className="page-header">
            <span className="page-header-ico"><Ico n={cur[3]} /></span>
            <div><h1>{cur[1]}</h1><p className="page-subtitle">{cur[2]}</p></div>
          </header>
          {tab === "dash" && <Dashboard />}
          {tab === "orders" && <Orders />}
          {tab === "history" && <History />}
          {tab === "products" && <Products />}
          {tab === "cats" && <Categories />}
          {tab === "acc" && <Accounting />}
          {tab === "settings" && <Settings />}
        </div>
      </div>
    </div>
  );
}
