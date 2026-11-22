// Mode démo (?demo=1) : faux menu pour voir le design, sans toucher à la base.
let n = 0;
const id = (p) => `${p}${++n}`;
const item = (name, price_delta = 0, i = 0) => ({ id: id("oi"), name, price_delta, available: true, sort_order: i });
const group = (name, required, multiple, items, i) => ({ id: id("og"), name, required, multiple, sort_order: i, option_items: items.map((x, k) => item(x[0], x[1], k)) });
const drink = () => [
  group("Taille", true, false, [["Moyen", 0], ["Grand", 500]], 0),
  group("Sucre", true, false, [["0%", 0], ["30%", 0], ["50%", 0], ["100%", 0]], 1),
  group("Toppings", false, true, [["Perles tapioca", 300], ["Gelée coco", 300], ["Cheese foam", 500]], 2),
];
const photo = (n) => `https://images.pexels.com/photos/${n}/pexels-photo-${n}.jpeg?auto=compress&cs=tinysrgb&w=700&h=700&fit=crop`;
const prod = (cat, name, price, description, groups = [], img = null) => ({ id: id("p"), category_id: cat, name, price, description, image_url: img ? photo(img) : null, available: true, sort_order: 0, option_groups: groups });

export const demoCategories = [
  { id: "c1", name: "Bubble tea", sort_order: 0, active: true },
  { id: "c2", name: "Boissons fruitées", sort_order: 1, active: true },
  { id: "c3", name: "Snacks & fast-food", sort_order: 2, active: true },
  { id: "c4", name: "Desserts", sort_order: 3, active: true },
];

export const demoProducts = [
  prod("c1", "Bubble tea taro", 1800, "Thé au lait onctueux au taro, perles de tapioca moelleuses.", drink(), 35727299),
  prod("c1", "Brown sugar boba", 2000, "Sucre brun caramélisé, lait frais et perles chaudes.", drink(), 11160112),
  prod("c1", "Matcha latte", 2000, "Thé matcha intense, lait mousseux.", drink(), 38345070),
  prod("c2", "Mangue passion", 1700, "Jus de mangue et fruit de la passion, glace pilée.", drink().slice(0, 2), 5817624),
  prod("c2", "Fraise litchi", 1700, "Fraise fraîche, litchi, un soupçon de menthe.", drink().slice(0, 2), 30591640),
  prod("c3", "Burger poulet croustillant", 3000, "Poulet pané, salade, sauce maison.", [], 2874990),
  prod("c3", "Frites maison", 1000, "Pommes de terre fraîches, sel de mer.", [], 8272619),
  prod("c3", "Nuggets de poulet (6)", 1800, "Six nuggets dorés et leur sauce.", [], 18188572),
  prod("c4", "Gaufre sucrée", 1500, "Gaufre chaude, sucre glace et chocolat.", [], 35054718),
];

// Exemples de promotions (mode essai uniquement)
if (demoProducts[2]) demoProducts[2].promo_price = Math.round(demoProducts[2].price * 0.8);
if (demoProducts[4]) demoProducts[4].promo_price = Math.round(demoProducts[4].price * 0.85);
