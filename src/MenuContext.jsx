import { createContext, useContext, useEffect, useState } from "react";
import { sb } from "./supabase.js";
import { ck } from "./utils.js";
import { shopConfig } from "./shopConfig.js";
import { demoCategories, demoProducts } from "./demoData.js";

const Ctx = createContext({ categories: [], products: [], loading: true, error: "", demo: false, settings: {} });
export const useMenu = () => useContext(Ctx);
// Infos de la boutique : réglages saisis dans l'admin, sinon valeurs de shopConfig.js
export const useShop = () => { const { settings } = useContext(Ctx); return { ...shopConfig, ...settings }; };

function isDemo() {
  try {
    const q = new URLSearchParams(location.search).get("demo");
    if (q === "1") sessionStorage.setItem("demo", "1");
    if (q === "0") sessionStorage.removeItem("demo");
    return sessionStorage.getItem("demo") === "1";
  } catch { return false; }
}

// Charge le menu une seule fois pour toute la vitrine
export function MenuProvider({ children }) {
  const [state, setState] = useState({ categories: [], products: [], loading: true, error: "", demo: false, settings: {} });
  useEffect(() => {
    if (isDemo()) { setState({ categories: demoCategories, products: demoProducts, loading: false, error: "", demo: true }); return; }
    (async () => {
      try {
        const categories = ck(await sb.from("categories").select("*").eq("active", true).order("sort_order"));
        const products = ck(await sb.from("products").select("*, option_groups(*, option_items(*))").order("sort_order").order("created_at"));
        products.forEach((p) => {
          p.option_groups.sort((a, b) => a.sort_order - b.sort_order);
          p.option_groups.forEach((g) => g.option_items.sort((a, b) => a.sort_order - b.sort_order));
        });
        const st = await sb.from("settings").select("*");
        const settings = Object.fromEntries((st.data || []).filter((r) => r.value).map((r) => [r.key, r.value]));
        setState({ categories, products, loading: false, error: "", demo: false, settings });
      } catch (e) {
        setState({ categories: [], products: [], loading: false, error: "Impossible de charger le menu : " + e.message, demo: false });
      }
    })();
  }, []);
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}
