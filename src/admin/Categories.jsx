import { useCallback, useEffect, useState } from "react";
import { sb } from "../supabase.js";
import { toast } from "../utils.js";

function Row({ c, i, list, reload }) {
  const [name, setName] = useState(c.name);
  const save = async () => {
    if (name.trim() === c.name) return;
    const r = await sb.from("categories").update({ name: name.trim() }).eq("id", c.id);
    toast(r.error ? r.error.message : "Enregistré", !!r.error);
  };
  const up = async () => {
    if (i === 0) return;
    await sb.from("categories").update({ sort_order: list[i - 1].sort_order }).eq("id", c.id);
    await sb.from("categories").update({ sort_order: c.sort_order }).eq("id", list[i - 1].id);
    reload();
  };
  return (
    <div className="panel prow">
      <div className="grow"><input value={name} onChange={(e) => setName(e.target.value)} onBlur={save} /></div>
      <button className="btn ghost small" title="Monter" onClick={up}>↑</button>
      <button className="btn ghost small" onClick={async () => { await sb.from("categories").update({ active: !c.active }).eq("id", c.id); reload(); }}>{c.active ? "Visible" : "Masquée"}</button>
      <button className="btn danger small" aria-label={`Supprimer ${c.name}`} title="Supprimer définitivement" onClick={async () => {
        if (!window.confirm(`Supprimer la catégorie « ${c.name} » définitivement ?\n\nLes produits ne sont pas supprimés : ils restent sur la carte, sans catégorie. Cette action est irréversible.\n\n(Pour seulement la cacher, utilise plutôt « Visible / Masquée ».)`)) return;
        const r = await sb.from("categories").delete().eq("id", c.id);
        if (r.error) toast(r.error.message, true); else { toast("Catégorie supprimée définitivement"); reload(); }
      }}>✕</button>
    </div>
  );
}

export default function Categories() {
  const [list, setList] = useState([]);
  const [name, setName] = useState("");
  const load = useCallback(async () => {
    const r = await sb.from("categories").select("*").order("sort_order");
    if (r.error) toast(r.error.message, true); else setList(r.data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    const r = await sb.from("categories").insert({ name: name.trim(), sort_order: list.length });
    if (r.error) toast(r.error.message, true); else { setName(""); load(); }
  };

  return (
    <>
      <div className="panel" style={{ display: "flex", gap: 8 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Nouvelle catégorie (ex : Bubble tea)" />
        <button className="btn" onClick={add}>Ajouter</button>
      </div>
      {list.map((c, i) => <Row key={c.id + c.name} c={c} i={i} list={list} reload={load} />)}
    </>
  );
}
