import { useEffect, useState } from "react";
import { sb } from "../supabase.js";
import { toast } from "../utils.js";

const FIELDS = [
  ["whatsapp", "Numéro WhatsApp de la boutique", "22997000000", "Chiffres uniquement, avec l'indicatif du pays. Le bouton « Suivre ma commande » du client ouvre WhatsApp sur ce numéro."],
  ["phone", "Téléphone", "+229 01 97 00 00 00", "Affiché sur la page Contact."],
  ["address", "Adresse", "Cotonou, Haie Vive", "Affichée sur la page Contact."],
  ["hours", "Horaires", "Tous les jours, 10h – 23h", "Affichés sur la page Contact."],
  ["country_code", "Indicatif du pays", "229", "Ajouté aux numéros que les clients saisissent sans indicatif, pour le bouton WhatsApp des commandes."],
];

export default function Settings() {
  const [v, setV] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sb.from("settings").select("*").then((r) => {
      if (r.error) return toast(r.error.message, true);
      const m = Object.fromEntries(r.data.map((x) => [x.key, x.value || ""]));
      setV(Object.fromEntries(FIELDS.map(([k]) => [k, m[k] ?? (k === "country_code" ? "229" : "")])));
    });
  }, []);

  const save = async () => {
    const wa = v.whatsapp.replace(/\D/g, "");
    if (v.whatsapp && (wa.length < 8 || wa.length > 15)) return toast("Numéro WhatsApp invalide (8 à 15 chiffres, avec l'indicatif).", true);
    setBusy(true);
    const rows = FIELDS.map(([k]) => ({ key: k, value: k === "whatsapp" || k === "country_code" ? v[k].replace(/\D/g, "") : v[k].trim() }));
    const r = await sb.from("settings").upsert(rows);
    setBusy(false);
    if (r.error) toast(r.error.message, true); else toast("Réglages enregistrés ✓");
  };

  if (!v) return <p className="empty">Chargement…</p>;
  const wa = v.whatsapp.replace(/\D/g, "");
  return (
    <div className="adm-card">
      <h2 style={{ marginTop: 0 }}>Réglages de la boutique</h2>
      {FIELDS.map(([k, label, ph, help]) => (
        <div key={k} style={{ marginBottom: 14 }}>
          <label htmlFor={"set-" + k} style={{ display: "block", fontWeight: 700, margin: "0 0 4px" }}>{label}</label>
          <input id={"set-" + k} value={v[k]} placeholder={"ex : " + ph} inputMode={k === "whatsapp" || k === "country_code" ? "numeric" : "text"}
            onChange={(e) => setV({ ...v, [k]: e.target.value })} style={{ width: "100%", padding: "11px 12px" }} />
          <small className="muted">{help}</small>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn" disabled={busy} onClick={save}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
        {wa.length >= 8 && <a className="btn ghost" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">Tester le lien WhatsApp ↗</a>}
      </div>
    </div>
  );
}
