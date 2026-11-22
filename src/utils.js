export const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n || 0) + " FCFA";

export const ck = (res) => {
  if (res.error) throw new Error(res.error.message);
  return res.data;
};

export function toast(msg, bad = false) {
  const t = document.createElement("div");
  t.className = "toast" + (bad ? " bad" : "");
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 3500);
}

// Son de notification (admin)
export const sound = { on: true };
let audioCtx = null;
export function beep() {
  if (!sound.on) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((t) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.frequency.value = 880;
      o.connect(g);
      g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.2, audioCtx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + t + 0.2);
      o.start(audioCtx.currentTime + t);
      o.stop(audioCtx.currentTime + t + 0.2);
    });
  } catch (_) {}
}

// Promotions : prix promotionnel actif (inférieur au prix normal, et pas encore expiré)
export const promoOn = (p) => !!p && p.promo_price != null && p.promo_price < p.price && (!p.promo_until || new Date(p.promo_until) > new Date());
export const effPrice = (p) => (promoOn(p) ? p.promo_price : p.price);
export const promoPct = (p) => (promoOn(p) ? Math.round((1 - p.promo_price / p.price) * 100) : 0);
