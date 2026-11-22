import { useCallback, useEffect, useMemo, useState } from "react";
import { sb } from "../supabase.js";
import { ck, fmt, toast, promoOn, promoPct } from "../utils.js";
import ProductEditor from "./ProductEditor.jsx";

export default function Products() {
  const [cats, setCats] = useState([]);
  const [prods, setProds] = useState(null);
  const [editing, setEditing] = useState(undefined); // undefined = fermé, null = nouveau, objet = modification
  const [q, setQ] = useState("");
  const [fcat, setFcat] = useState("all");
  const [fst, setFst] = useState("all"); // all | published | draft | off

  const load = useCallback(async () => {
    try {
      setCats(ck(await sb.from("categories").select("*").order("sort_order")));
      setProds(ck(await sb.from("products").select("*, option_groups(*, option_items(*))").order("created_at", { ascending: false })));
    } catch (e) { toast(e.message, true); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const update = async (p, patch, msg) => {
    const r = await sb.from("products").update(patch).eq("id", p.id);
    if (r.error) toast(r.error.message, true); else { toast(msg); load(); }
  };
  const remove = async (p) => {
    if (!window.confirm(`Supprimer « ${p.name} » définitivement ?\n\nLe produit, sa photo et ses options disparaissent de la carte. Les commandes déjà passées restent dans l'historique. Cette action est irréversible.\n\n(Pour seulement le retirer de la vente, utilise plutôt « Dépublier ».)`)) return;
    const r = await sb.from("products").delete().eq("id", p.id);
    if (r.error) return toast(r.error.message, true);
    // nettoie aussi la photo du stockage (sans bloquer si ce n'est pas possible)
    const m = (p.image_url || "").match(/\/product-images\/([^?]+)/);
    if (m) sb.storage.from("product-images").remove([decodeURIComponent(m[1])]).catch(() => {});
    toast("Produit supprimé définitivement"); load();
  };

  const stats = useMemo(() => ({
    total: prods?.length || 0,
    pub: prods?.filter((p) => p.published).length || 0,
    draft: prods?.filter((p) => !p.published).length || 0,
    off: prods?.filter((p) => p.published && !p.available).length || 0,
  }), [prods]);

  const list = (prods || []).filter((p) =>
    (fcat === "all" || p.category_id === fcat) &&
    (fst === "all" || (fst === "published" && p.published) || (fst === "draft" && !p.published) || (fst === "off" && !p.available)) &&
    p.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <>
      <div className="adm-bar">
        <p className="muted">{stats.total} produit(s) · <b>{stats.pub}</b> publié(s) · <b>{stats.draft}</b> brouillon(s){stats.off ? ` · ${stats.off} indisponible(s)` : ""}</p>
        <button className="btn" onClick={() => setEditing(null)}>+ Nouveau produit</button>
      </div>

      <div className="adm-filters">
        <input type="search" placeholder="Rechercher un produit…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher" />
        <select value={fcat} onChange={(e) => setFcat(e.target.value)} aria-label="Catégorie">
          <option value="all">Toutes les catégories</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={fst} onChange={(e) => setFst(e.target.value)} aria-label="État">
          <option value="all">Tous les états</option>
          <option value="published">Publiés</option>
          <option value="draft">Brouillons</option>
          <option value="off">Indisponibles</option>
        </select>
      </div>

      {prods && !prods.length && <p className="empty">Aucun produit. Clique sur « Nouveau produit », puis « Publier ».</p>}
      {prods && prods.length > 0 && !list.length && <p className="empty">Aucun produit ne correspond.</p>}

      {list.map((p) => {
        const cat = cats.find((c) => c.id === p.category_id);
        return (
          <div className={"adm-card prow" + (p.published ? "" : " draft")} key={p.id}>
            {p.image_url ? <img src={p.image_url} alt="" /> : <div className="ph">🧋</div>}
            <div className="grow">
              <b>{p.name}</b>
              <div className="muted">{promoOn(p) ? <><s>{fmt(p.price)}</s> <b>{fmt(p.promo_price)}</b></> : fmt(p.price)}{cat ? " · " + cat.name : " · sans catégorie"}</div>
              <div className="chips">
                <span className={"chip " + (p.published ? "pub" : "draft")}>{p.published ? "Publié" : "Brouillon"}</span>
                {p.published && !p.available && <span className="chip off">Indisponible</span>}
                {promoOn(p) && <span className="chip promo">Promo -{promoPct(p)}%</span>}
              </div>
            </div>
            <div className="row-actions">
              {p.published
                ? <button className="btn ghost small" onClick={() => update(p, { published: false }, "Retiré du site")}>Dépublier</button>
                : <button className="btn small" onClick={() => update(p, { published: true }, "Publié sur le site ✓")}>Publier</button>}
              <button className="btn ghost small" onClick={() => update(p, { available: !p.available }, p.available ? "Marqué indisponible" : "Marqué disponible")}>{p.available ? "Disponible" : "Indisponible"}</button>
              <button className="btn ghost small" onClick={() => setEditing(p)}>Modifier</button>
              <button className="btn danger small" aria-label={`Supprimer ${p.name}`} onClick={() => remove(p)}>✕</button>
            </div>
          </div>
        );
      })}

      {editing !== undefined && (
        <ProductEditor product={editing} cats={cats} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); load(); }} />
      )}
    </>
  );
}
