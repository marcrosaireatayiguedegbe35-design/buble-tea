import { useState } from "react";
import Modal from "../Modal.jsx";
import { sb } from "../supabase.js";
import { ck, toast } from "../utils.js";

// Réduit l'image avant envoi (rapide sur mobile, économise le stockage)
async function compress(file, max = 900) {
  const bmp = await createImageBitmap(file);
  const r = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * r);
  c.height = Math.round(bmp.height * r);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob(res, "image/webp", 0.82));
}

const TEMPLATE = () => [
  { name: "Taille", required: true, multiple: false, items: [{ name: "Moyen", price_delta: 0 }, { name: "Grand", price_delta: 500 }] },
  { name: "Sucre", required: true, multiple: false, items: [{ name: "0%", price_delta: 0 }, { name: "30%", price_delta: 0 }, { name: "50%", price_delta: 0 }, { name: "100%", price_delta: 0 }] },
  { name: "Glace", required: false, multiple: false, items: [{ name: "Sans glace", price_delta: 0 }, { name: "Peu de glace", price_delta: 0 }, { name: "Normal", price_delta: 0 }] },
  { name: "Toppings", required: false, multiple: true, items: [{ name: "Perles tapioca", price_delta: 300 }, { name: "Gelée coco", price_delta: 300 }, { name: "Cheese foam", price_delta: 500 }] },
];

// Modèle pour les plats (burger, sandwich…) : suppléments au choix, chacun avec son prix
const EXTRAS_TEMPLATE = () => [
  { name: "Suppléments", required: false, multiple: true, items: [{ name: "Frites", price_delta: 1000 }, { name: "Fromage", price_delta: 300 }, { name: "Œuf", price_delta: 300 }, { name: "Sauce piquante", price_delta: 200 }] },
];

const fromProduct = (p) =>
  (p?.option_groups || [])
    .slice().sort((a, b) => a.sort_order - b.sort_order)
    .map((g) => ({
      name: g.name, required: g.required, multiple: g.multiple,
      items: g.option_items.slice().sort((a, b) => a.sort_order - b.sort_order).map((i) => ({ name: i.name, price_delta: i.price_delta })),
    }));

export default function ProductEditor({ product: p, cats, onClose, onSaved }) {
  const [name, setName] = useState(p?.name || "");
  const [desc, setDesc] = useState(p?.description || "");
  const [price, setPrice] = useState(p ? String(p.price) : "");
  const [promo, setPromo] = useState(p?.promo_price != null ? String(p.promo_price) : "");
  const [promoUntil, setPromoUntil] = useState(p?.promo_until ? p.promo_until.slice(0, 10) : "");
  const [cat, setCat] = useState(p?.category_id || "");
  const [avail, setAvail] = useState(p ? p.available : true);
  const [imageUrl, setImageUrl] = useState(p?.image_url || null);
  const [groups, setGroups] = useState(() => fromProduct(p));
  const [published, setPublished] = useState(p ? p.published : false);
  const [busy, setBusy] = useState(false);

  // modifie une copie profonde des groupes
  const upd = (fn) => setGroups((g) => { const c = structuredClone(g); fn(c); return c; });

  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const pick = async (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast("Choisis un fichier image (JPG, PNG, WEBP).", true);
    setUploading(true);
    try {
      let blob = f, ext = (f.name.split(".").pop() || "jpg").toLowerCase(), type = f.type;
      try { blob = await compress(f); ext = "webp"; type = "image/webp"; } catch (_) { /* format non lisible par le canvas : on envoie l'original */ }
      if (blob.size > 5 * 1024 * 1024) throw new Error("Image trop lourde (5 Mo maximum).");
      const path = crypto.randomUUID() + "." + ext;
      const up = await sb.storage.from("product-images").upload(path, blob, { contentType: type, cacheControl: "31536000" });
      if (up.error) throw up.error;
      setImageUrl(sb.storage.from("product-images").getPublicUrl(path).data.publicUrl);
      toast("Photo envoyée ✓");
    } catch (err) { toast("Photo : " + (err.message || "envoi impossible"), true); }
    setUploading(false);
  };

  const save = async (pub) => {
    if (!name.trim() || price === "") return toast("Nom et prix obligatoires", true);
    if (promo !== "" && !(parseInt(promo, 10) >= 0 && parseInt(promo, 10) < parseInt(price, 10))) return toast("Le prix promotionnel doit être inférieur au prix normal.", true);
    setBusy(true);
    try {
      const payload = { name: name.trim(), description: desc.trim() || null, price: parseInt(price, 10), category_id: cat || null, available: avail, image_url: imageUrl, published: pub,
        promo_price: promo === "" ? null : parseInt(promo, 10),
        promo_until: promo === "" || !promoUntil ? null : new Date(promoUntil + "T23:59:59").toISOString() };
      let id = p?.id;
      if (id) ck(await sb.from("products").update(payload).eq("id", id));
      else id = ck(await sb.from("products").insert(payload).select().single()).id;

      ck(await sb.from("option_groups").delete().eq("product_id", id));
      for (const [gi, g] of groups.entries()) {
        if (!g.name.trim()) continue;
        const gr = ck(await sb.from("option_groups").insert({ product_id: id, name: g.name.trim(), required: g.required, multiple: g.multiple, sort_order: gi }).select().single());
        const items = g.items.filter((i) => i.name.trim()).map((i, ii) => ({ group_id: gr.id, name: i.name.trim(), price_delta: i.price_delta || 0, sort_order: ii }));
        if (items.length) ck(await sb.from("option_items").insert(items));
      }
      toast(pub ? "Publié sur le site ✓" : "Enregistré en brouillon ✓");
      onSaved();
    } catch (e) { toast(e.message, true); setBusy(false); }
  };

  return (
    <Modal onClose={onClose}>
      <h2>{p ? "Modifier le produit" : "Nouveau produit"}</h2>

      <label>Nom *</label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Bubble tea taro" />
      <label>Description</label>
      <textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description courte" />

      <div className="two">
        <div><label>Prix de base (FCFA) *</label><input type="number" min={0} step={25} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="FCFA" /></div>
        <div>
          <label>Catégorie</label>
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">— Sans catégorie —</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <label>Promotion (facultatif)</label>
      <div className="two">
        <div><input type="number" min={0} step={1} value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Prix promo en FCFA" /></div>
        <div><input type="date" value={promoUntil} onChange={(e) => setPromoUntil(e.target.value)} title="Dernier jour de la promotion (vide = sans limite)" /></div>
      </div>
      <p className="muted" style={{ margin: "4px 0 10px", fontSize: ".82rem" }}>
        {promo !== "" && price !== "" && parseInt(promo, 10) < parseInt(price, 10)
          ? `Réduction de ${Math.round((1 - parseInt(promo, 10) / parseInt(price, 10)) * 100)} %. ${promoUntil ? "Fin le " + new Date(promoUntil).toLocaleDateString("fr-FR") + "." : "Sans date de fin : retire le prix promo pour l'arrêter."}`
          : "Laisse vide s'il n'y a pas de promotion. Le prix barré affiché aux clients est le prix normal."}
      </p>

      <label>Photo du produit</label>
      <div className={"upz" + (drag ? " drag" : "") + (imageUrl ? " has" : "")}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}>
        {imageUrl ? <img src={imageUrl} alt="Aperçu du produit" /> : (
          <span className="upz-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg></span>
        )}
        <div className="upz-txt">
          <b>{uploading ? "Envoi en cours…" : imageUrl ? "Photo ajoutée" : "Ajoute une photo"}</b>
          <span>{imageUrl ? "Tu peux la remplacer ou la retirer." : "Glisse une image ici ou choisis-la depuis ton appareil."}</span>
          <div className="upz-btns">
            <label className={"btn small" + (uploading ? " disabled" : "")}>
              {imageUrl ? "Changer la photo" : "Choisir une photo"}
              <input type="file" accept="image/*" hidden disabled={uploading} onChange={(e) => { pick(e.target.files[0]); e.target.value = ""; }} />
            </label>
            {imageUrl && <button type="button" className="btn ghost small" onClick={() => setImageUrl(null)}>Retirer</button>}
          </div>
        </div>
      </div>

      <label style={{ fontWeight: 400 }}>
        <input type="checkbox" style={{ width: "auto" }} checked={avail} onChange={(e) => setAvail(e.target.checked)} /> Disponible à la vente
      </label>

      <h3>Options du client</h3>
      <p className="muted" style={{ margin: 0 }}>Taille, sucre, glace, toppings… Le supplément s'ajoute au prix de base.</p>
      <button className="btn ghost small" style={{ margin: "8px 6px 0 0" }}
        onClick={() => { if (!groups.length || window.confirm("Remplacer les options actuelles par le modèle bubble tea ?")) setGroups(TEMPLATE()); }}>
        Modèle bubble tea
      </button>
      <button className="btn ghost small" style={{ margin: "8px 6px 0 0" }}
        onClick={() => { if (!groups.length || window.confirm("Remplacer les options actuelles par le modèle suppléments ?")) setGroups(EXTRAS_TEMPLATE()); }}>
        Modèle suppléments (plats)
      </button>
      <button className="btn ghost small" style={{ marginTop: 8 }}
        onClick={() => setGroups((g) => [...g, { name: "", required: false, multiple: false, items: [{ name: "", price_delta: 0 }] }])}>
        + Groupe d'options
      </button>

      {groups.map((g, gi) => (
        <div className="gbox" key={gi}>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={g.name} placeholder="Nom du groupe (Taille, Sucre…)" onChange={(e) => upd((c) => { c[gi].name = e.target.value; })} />
            <button className="btn danger small" onClick={() => upd((c) => { c.splice(gi, 1); })}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 16, margin: "6px 0" }}>
            <label style={{ fontWeight: 400, margin: 0 }}>
              <input type="checkbox" style={{ width: "auto" }} checked={g.required} onChange={(e) => upd((c) => { c[gi].required = e.target.checked; })} /> Obligatoire
            </label>
            <label style={{ fontWeight: 400, margin: 0 }}>
              <input type="checkbox" style={{ width: "auto" }} checked={g.multiple} onChange={(e) => upd((c) => { c[gi].multiple = e.target.checked; })} /> Plusieurs choix
            </label>
          </div>
          {g.items.map((it, ii) => (
            <div className="irow" key={ii}>
              <input value={it.name} placeholder="Choix" onChange={(e) => upd((c) => { c[gi].items[ii].name = e.target.value; })} />
              <input type="number" step={25} value={it.price_delta} title="Supplément en FCFA"
                onChange={(e) => upd((c) => { c[gi].items[ii].price_delta = parseInt(e.target.value || "0", 10); })} />
              <button className="btn ghost small" onClick={() => upd((c) => { c[gi].items.splice(ii, 1); })}>✕</button>
            </div>
          ))}
          <button className="btn ghost small" onClick={() => upd((c) => { c[gi].items.push({ name: "", price_delta: 0 }); })}>+ Choix</button>
        </div>
      ))}

      <p className="muted" style={{ marginTop: 14 }}>
        {published ? "✅ Ce produit est publié : les clients le voient." : "📝 Brouillon : les clients ne le voient pas encore."}
      </p>
      <div className="sticky-btn" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn ghost" onClick={onClose}>Annuler</button>
        <button className="btn ghost" disabled={busy} onClick={() => save(published)}>{p ? "Enregistrer" : "Enregistrer en brouillon"}</button>
        {published
          ? <button className="btn danger" disabled={busy} onClick={() => { setPublished(false); save(false); }}>Dépublier</button>
          : <button className="btn" style={{ flex: 1 }} disabled={busy} onClick={() => { setPublished(true); save(true); }}>{busy ? "Publication…" : "Publier"}</button>}
      </div>
    </Modal>
  );
}
