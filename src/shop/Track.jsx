import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { sb } from "../supabase.js";
import { fmt } from "../utils.js";
import { ArrowRight, Shell, TopBar } from "./ui.jsx";

const STEPS = [["new", "Reçue"], ["preparing", "En préparation"], ["ready", "Prête"], ["delivered", "Livrée"]];

export default function Track() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, data: null });

  useEffect(() => {
    let stop = false;
    const draw = async () => {
      const { data, error } = await sb.rpc("get_order_status", { p_token: token });
      if (!stop) setState({ loading: false, data: error ? null : data });
    };
    draw();
    const t = setInterval(draw, 15000);
    return () => { stop = true; clearInterval(t); };
  }, [token]);

  const { loading, data } = state;
  const idx = data ? STEPS.findIndex((s) => s[0] === data.status) : -1;

  return (
    <Shell hideFab>
      <TopBar />
      <div className="s-detail">
        {loading ? <p className="empty">Chargement…</p> : !data ? <p className="empty">Commande introuvable.</p> : (
          <>
            <h1 className="serif">Commande n°{data.number}</h1>
            <p className="muted">{fmt(data.total)}</p>
            {data.status === "cancelled"
              ? <p className="badge cancelled">Commande annulée</p>
              : <div className="steps">{STEPS.map((s, i) => <div key={s[0]} className={i <= idx ? "on" : ""}>{s[1]}</div>)}</div>}
            <p className="muted">Cette page se met à jour automatiquement.</p>
          </>
        )}
        <div className="s-buy"><Link className="s-cta wide light" to="/categories"><span>Retour au menu</span></Link></div>
      </div>
    </Shell>
  );
}
