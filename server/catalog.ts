export type MenuItem = { id: string; name: string; description: string; price: number; vegetarian?: boolean; popular?: boolean };
export type Restaurant = { id: string; name: string; cuisine: string; category: string; tagline: string; eta: string; fee: number; rating: number; reviews: number; promoted?: boolean; image: string; accent: string; menu: MenuItem[] };
export type CheckoutLine = { id: string; quantity: number };
export type OrderQuote = { subtotalCents: number; deliveryCents: number; serviceCents: number; totalCents: number; displayLines: Array<{ name: string; quantity: number; unitCents: number }> };

const heroImage = "/manus-storage/mesago-hero_6c5f0245.jpg";
const bowlImage = "/manus-storage/mesago-bowl_0c8f947b.jpg";
const pizzaImage = "/manus-storage/mesago-pizza_52125c0e.jpg";

export const restaurants: Restaurant[] = [
  { id: "solera", name: "Solera Cocina Viva", cuisine: "Mediterránea · Tapas", category: "Mediterránea", tagline: "Producto local, fuego lento y mucho verde.", eta: "18–28 min", fee: 0, rating: 4.8, reviews: 182, promoted: true, image: heroImage, accent: "#315B3F", menu: [
    { id: "solera-1", name: "Berenjena ahumada", description: "Miel de romero, yogur cítrico y avellana.", price: 9.5, vegetarian: true, popular: true }, { id: "solera-2", name: "Pollo al limón", description: "Patatas bravas, alioli suave y hierbas frescas.", price: 13.9 }, { id: "solera-3", name: "Ensalada de tomate", description: "Tomate de temporada, stracciatella y albahaca.", price: 10.5, vegetarian: true }, { id: "solera-4", name: "Tarta vasca", description: "Queso cremoso, sal marina y aceite de oliva.", price: 6.5, vegetarian: true }
  ] },
  { id: "taller-verde", name: "Taller Verde", cuisine: "Vegana · Bowls", category: "Vegana", tagline: "Bowls que viajan bien y saben mejor.", eta: "22–32 min", fee: 1.49, rating: 4.9, reviews: 96, image: bowlImage, accent: "#5D7C3D", menu: [
    { id: "verde-1", name: "Bowl umami", description: "Arroz integral, shiitake, edamame y sésamo tostado.", price: 12.9, vegetarian: true, popular: true }, { id: "verde-2", name: "Bowl de temporada", description: "Verduras asadas, boniato y salsa tahini-limón.", price: 11.9, vegetarian: true }, { id: "verde-3", name: "Hummus de remolacha", description: "Pan plano tibio, crudités y za’atar.", price: 7.5, vegetarian: true }, { id: "verde-4", name: "Té melocotón", description: "Té negro infusionado con melocotón natural.", price: 3.2, vegetarian: true }
  ] },
  { id: "forno-rossi", name: "Forno Rossi", cuisine: "Pizza · Italiana", category: "Pizza", tagline: "Masa de 48 horas, borde alto, sin prisa.", eta: "25–35 min", fee: 0.99, rating: 4.7, reviews: 241, promoted: true, image: pizzaImage, accent: "#B84A2F", menu: [
    { id: "rossi-1", name: "Margherita DOP", description: "Tomate San Marzano, fior di latte y albahaca.", price: 11.9, vegetarian: true, popular: true }, { id: "rossi-2", name: "Diavola", description: "Salami picante, mozzarella y miel de chile.", price: 13.5 }, { id: "rossi-3", name: "Zucca", description: "Calabaza asada, gorgonzola y nuez.", price: 13.9, vegetarian: true }, { id: "rossi-4", name: "Tiramisú", description: "Mascarpone, café y cacao intenso.", price: 6.8, vegetarian: true }
  ] },
  { id: "nori-club", name: "Nori Club", cuisine: "Japonesa · Sushi", category: "Japonesa", tagline: "Sushi diario, cortes limpios, sabores honestos.", eta: "28–38 min", fee: 1.99, rating: 4.8, reviews: 129, image: bowlImage, accent: "#213E45", menu: [
    { id: "nori-1", name: "Maki salmón", description: "8 piezas de salmón, aguacate y sésamo.", price: 10.9, popular: true }, { id: "nori-2", name: "Tartar de atún", description: "Atún, cítricos, pepino y crujiente de arroz.", price: 13.5 }, { id: "nori-3", name: "Gyozas de verduras", description: "6 piezas, ponzu y aceite de cebollino.", price: 7.9, vegetarian: true }, { id: "nori-4", name: "Mochi de mango", description: "Dos piezas de helado cremoso de mango.", price: 5.9, vegetarian: true }
  ] },
  { id: "brasa-callejera", name: "Brasa Callejera", cuisine: "Hamburguesas · Americana", category: "Hamburguesas", tagline: "Smash burgers y patatas para compartir.", eta: "16–26 min", fee: 1.49, rating: 4.6, reviews: 314, image: heroImage, accent: "#913D2B", menu: [
    { id: "brasa-1", name: "La Clásica", description: "Doble smash, cheddar, pepinillo y salsa de la casa.", price: 12.5, popular: true }, { id: "brasa-2", name: "Crispy chicken", description: "Pollo crujiente, coleslaw, encurtidos y mayo picante.", price: 11.9 }, { id: "brasa-3", name: "Patatas con parmesano", description: "Patatas finas, parmesano, limón y perejil.", price: 5.5, vegetarian: true }, { id: "brasa-4", name: "Cookie caliente", description: "Chocolate negro y sal marina.", price: 4.9, vegetarian: true }
  ] },
  { id: "miga-dulce", name: "Miga Dulce", cuisine: "Desayuno · Pastelería", category: "Desayuno", tagline: "Café de especialidad y bollería recién hecha.", eta: "14–24 min", fee: 0.99, rating: 4.9, reviews: 74, image: pizzaImage, accent: "#B36D35", menu: [
    { id: "miga-1", name: "Tostada de ricotta", description: "Ricotta batida, miel, pistacho y cítricos.", price: 7.9, vegetarian: true, popular: true }, { id: "miga-2", name: "Croissant de almendra", description: "Hojaldre, crema de almendra y azúcar glas.", price: 3.8, vegetarian: true }, { id: "miga-3", name: "Flat white", description: "Café de especialidad y leche texturizada.", price: 2.9, vegetarian: true }, { id: "miga-4", name: "Zumo de naranja", description: "Exprimido al momento.", price: 3.5, vegetarian: true }
  ] }
];

export function findRestaurant(id: string) { return restaurants.find((restaurant) => restaurant.id === id); }

/** Server-only quote calculation. Client totals are intentionally ignored. */
export function buildOrderQuote(restaurantId: string, items: CheckoutLine[]): { restaurant: Restaurant; quote: OrderQuote } {
  const restaurant = findRestaurant(restaurantId);
  if (!restaurant) throw new Error("Restaurante no encontrado");
  if (!items.length) throw new Error("La cesta está vacía");
  const displayLines = items.map((line) => {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) throw new Error("Cantidad no válida");
    const item = restaurant.menu.find((menuItem) => menuItem.id === line.id);
    if (!item) throw new Error("Producto no válido para este restaurante");
    return { name: item.name, quantity: line.quantity, unitCents: Math.round(item.price * 100) };
  });
  const subtotalCents = displayLines.reduce((sum, line) => sum + line.unitCents * line.quantity, 0);
  const deliveryCents = Math.round(restaurant.fee * 100);
  const serviceCents = 79;
  return { restaurant, quote: { subtotalCents, deliveryCents, serviceCents, totalCents: subtotalCents + deliveryCents + serviceCents, displayLines } };
}
