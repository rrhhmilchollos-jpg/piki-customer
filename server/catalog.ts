export type MenuModifierOption = {
  id: string;
  name: string;
  price: number;
  description?: string;
};

export type MenuModifierGroup = {
  id: string;
  name: string;
  description?: string;
  minSelections?: number;
  maxSelections?: number;
  options: MenuModifierOption[];
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  vegetarian?: boolean;
  popular?: boolean;
  modifierGroups?: MenuModifierGroup[];
};

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  category: string;
  tagline: string;
  eta: string;
  fee: number;
  rating: number;
  reviews: number;
  promoted?: boolean;
  image: string;
  accent: string;
  menu: MenuItem[];
};

export type ModifierSelection = {
  groupId: string;
  optionIds: string[];
};

export type CheckoutLine = {
  id: string;
  quantity: number;
  selections?: ModifierSelection[];
};

export type QuotedSelection = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  unitCents: number;
};

export type OrderQuote = {
  subtotalCents: number;
  deliveryCents: number;
  serviceCents: number;
  totalCents: number;
  displayLines: Array<{
    itemId: string;
    name: string;
    quantity: number;
    unitCents: number;
    selections: QuotedSelection[];
  }>;
};

const heroImage = "/manus-storage/mesago-hero_6c5f0245.jpg";
const bowlImage = "/manus-storage/mesago-bowl_0c8f947b.jpg";
const pizzaImage = "/manus-storage/mesago-pizza_52125c0e.jpg";

/**
 * Reference retail prices: the non-promotional Xàtiva Glovo menu checked on 2026-10-03.
 * These are configurable option prices, never client-provided amounts.
 */
const mealAddOns: MenuModifierGroup[] = [
  {
    id: "side",
    name: "Añade un complemento",
    description: "Opcional · puedes elegir uno",
    maxSelections: 1,
    options: [
      { id: "fries", name: "Patatas fritas con salsa", price: 2.7 },
      { id: "bravas", name: "Patatas bravas con salsa", price: 3.45 },
      { id: "deluxe", name: "Patatas deluxe con salsa", price: 3.45 },
      { id: "nuggets", name: "Nuggets de pollo (5 uds.)", price: 6.2 },
    ],
  },
  {
    id: "drink",
    name: "Añade una bebida",
    description: "Opcional · puedes elegir una",
    maxSelections: 1,
    options: [
      { id: "water-small", name: "Agua pequeña", price: 1.35 },
      { id: "coca-cola", name: "Coca-Cola", price: 2.1 },
      { id: "coca-cola-zero", name: "Coca-Cola Zero", price: 2.1 },
      { id: "fanta-orange", name: "Fanta Naranja", price: 2.1 },
      { id: "nestea-lemon", name: "Nestea Limón", price: 2.35 },
      { id: "aquarius", name: "Aquarius", price: 2.35 },
    ],
  },
];

export const restaurants: Restaurant[] = [
  {
    id: "kfc-xativa",
    name: "KFC XATIVA QA",
    cuisine: "Pollo · Americana",
    category: "Pollo",
    tagline: "Pedido de validación operativa PIKI en Xàtiva.",
    eta: "20–30 min",
    fee: 2.99,
    rating: 4.5,
    reviews: 0,
    promoted: true,
    image: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=1200&q=80",
    accent: "#D71920",
    menu: [
      { id: "kfc-bucket", name: "Bucket de pollo crujiente", description: "Piezas de pollo crujiente estilo KFC.", price: 14.95, popular: true },
      { id: "kfc-burger", name: "Burger de pollo", description: "Filete de pollo crujiente, lechuga y salsa.", price: 8.95 },
      { id: "kfc-wings", name: "Alitas picantes", description: "Alitas de pollo con salsa picante.", price: 7.95 },
      { id: "kfc-fries", name: "Patatas clásicas", description: "Patatas crujientes.", price: 3.25, vegetarian: true },
    ],
  },
  {
    id: "solera",
    name: "Solera Cocina Viva",
    cuisine: "Mediterránea · Tapas",
    category: "Mediterránea",
    tagline: "Producto local, fuego lento y mucho verde.",
    eta: "18–28 min",
    fee: 2.99,
    rating: 4.8,
    reviews: 182,
    promoted: true,
    image: heroImage,
    accent: "#315B3F",
    menu: [
      {
        id: "solera-1",
        name: "Berenjena ahumada",
        description: "Miel de romero, yogur cítrico y avellana.",
        price: 9.5,
        vegetarian: true,
        popular: true,
        modifierGroups: mealAddOns,
      },
      {
        id: "solera-2",
        name: "Pollo al limón",
        description: "Patatas bravas, alioli suave y hierbas frescas.",
        price: 13.9,
        modifierGroups: mealAddOns,
      },
      {
        id: "solera-3",
        name: "Ensalada de tomate",
        description: "Tomate de temporada, stracciatella y albahaca.",
        price: 10.5,
        vegetarian: true,
        modifierGroups: mealAddOns,
      },
      {
        id: "solera-4",
        name: "Tarta vasca",
        description: "Queso cremoso, sal marina y aceite de oliva.",
        price: 6.5,
        vegetarian: true,
        modifierGroups: mealAddOns,
      },
    ],
  },
  {
    id: "taller-verde",
    name: "Taller Verde",
    cuisine: "Vegana · Bowls",
    category: "Vegana",
    tagline: "Bowls que viajan bien y saben mejor.",
    eta: "22–32 min",
    fee: 2.99,
    rating: 4.9,
    reviews: 96,
    image: bowlImage,
    accent: "#5D7C3D",
    menu: [
      {
        id: "verde-1",
        name: "Bowl umami",
        description: "Arroz integral, shiitake, edamame y sésamo tostado.",
        price: 12.9,
        vegetarian: true,
        popular: true,
        modifierGroups: mealAddOns,
      },
      {
        id: "verde-2",
        name: "Bowl de temporada",
        description: "Verduras asadas, boniato y salsa tahini-limón.",
        price: 11.9,
        vegetarian: true,
        modifierGroups: mealAddOns,
      },
      {
        id: "verde-3",
        name: "Hummus de remolacha",
        description: "Pan plano tibio, crudités y za’atar.",
        price: 7.5,
        vegetarian: true,
        modifierGroups: mealAddOns,
      },
      {
        id: "verde-4",
        name: "Té melocotón",
        description: "Té negro infusionado con melocotón natural.",
        price: 3.2,
        vegetarian: true,
        modifierGroups: mealAddOns,
      },
    ],
  },
  {
    id: "forno-rossi",
    name: "Forno Rossi",
    cuisine: "Pizza · Italiana",
    category: "Pizza",
    tagline: "Masa de 48 horas, borde alto, sin prisa.",
    eta: "25–35 min",
    fee: 2.99,
    rating: 4.7,
    reviews: 241,
    promoted: true,
    image: pizzaImage,
    accent: "#B84A2F",
    menu: [
      {
        id: "rossi-1",
        name: "Margherita DOP",
        description: "Tomate San Marzano, fior di latte y albahaca.",
        price: 11.9,
        vegetarian: true,
        popular: true,
        modifierGroups: mealAddOns,
      },
      {
        id: "rossi-2",
        name: "Diavola",
        description: "Salami picante, mozzarella y miel de chile.",
        price: 13.5,
        modifierGroups: mealAddOns,
      },
      {
        id: "rossi-3",
        name: "Zucca",
        description: "Calabaza asada, gorgonzola y nuez.",
        price: 13.9,
        vegetarian: true,
        modifierGroups: mealAddOns,
      },
      {
        id: "rossi-4",
        name: "Tiramisú",
        description: "Mascarpone, café y cacao intenso.",
        price: 6.8,
        vegetarian: true,
        modifierGroups: mealAddOns,
      },
    ],
  },
  {
    id: "nori-club",
    name: "Nori Club",
    cuisine: "Japonesa · Sushi",
    category: "Japonesa",
    tagline: "Sushi diario, cortes limpios, sabores honestos.",
    eta: "28–38 min",
    fee: 2.99,
    rating: 4.8,
    reviews: 129,
    image: bowlImage,
    accent: "#213E45",
    menu: [
      {
        id: "nori-1",
        name: "Maki salmón",
        description: "8 piezas de salmón, aguacate y sésamo.",
        price: 10.9,
        popular: true,
        modifierGroups: mealAddOns,
      },
      {
        id: "nori-2",
        name: "Tartar de atún",
        description: "Atún, cítricos, pepino y crujiente de arroz.",
        price: 13.5,
        modifierGroups: mealAddOns,
      },
      {
        id: "nori-3",
        name: "Gyozas de verduras",
        description: "6 piezas, ponzu y aceite de cebollino.",
        price: 7.9,
        vegetarian: true,
        modifierGroups: mealAddOns,
      },
      {
        id: "nori-4",
        name: "Mochi de mango",
        description: "Dos piezas de helado cremoso de mango.",
        price: 5.9,
        vegetarian: true,
        modifierGroups: mealAddOns,
      },
    ],
  },
  {
    id: "brasa-callejera",
    name: "Brasa Callejera",
    cuisine: "Hamburguesas · Americana",
    category: "Hamburguesas",
    tagline: "Smash burgers y patatas para compartir.",
    eta: "16–26 min",
    fee: 2.99,
    rating: 4.6,
    reviews: 314,
    image: heroImage,
    accent: "#913D2B",
    menu: [
      {
        id: "brasa-1",
        name: "La Clásica",
        description: "Doble smash, cheddar, pepinillo y salsa de la casa.",
        price: 12.5,
        popular: true,
        modifierGroups: mealAddOns,
      },
      {
        id: "brasa-2",
        name: "Crispy chicken",
        description: "Pollo crujiente, coleslaw, encurtidos y mayo picante.",
        price: 11.9,
        modifierGroups: mealAddOns,
      },
      {
        id: "brasa-3",
        name: "Patatas con parmesano",
        description: "Patatas finas, parmesano, limón y perejil.",
        price: 5.5,
        vegetarian: true,
        modifierGroups: mealAddOns,
      },
      {
        id: "brasa-4",
        name: "Cookie caliente",
        description: "Chocolate negro y sal marina.",
        price: 4.9,
        vegetarian: true,
        modifierGroups: mealAddOns,
      },
    ],
  },
  {
    id: "miga-dulce",
    name: "Miga Dulce",
    cuisine: "Desayuno · Pastelería",
    category: "Desayuno",
    tagline: "Café de especialidad y bollería recién hecha.",
    eta: "14–24 min",
    fee: 2.99,
    rating: 4.9,
    reviews: 74,
    image: pizzaImage,
    accent: "#B36D35",
    menu: [
      {
        id: "miga-1",
        name: "Tostada de ricotta",
        description: "Ricotta batida, miel, pistacho y cítricos.",
        price: 7.9,
        vegetarian: true,
        popular: true,
        modifierGroups: mealAddOns,
      },
      {
        id: "miga-2",
        name: "Croissant de almendra",
        description: "Hojaldre, crema de almendra y azúcar glas.",
        price: 3.8,
        vegetarian: true,
        modifierGroups: mealAddOns,
      },
      {
        id: "miga-3",
        name: "Flat white",
        description: "Café de especialidad y leche texturizada.",
        price: 2.9,
        vegetarian: true,
        modifierGroups: mealAddOns,
      },
      {
        id: "miga-4",
        name: "Zumo de naranja",
        description: "Exprimido al momento.",
        price: 3.5,
        vegetarian: true,
        modifierGroups: mealAddOns,
      },
    ],
  },
];

export function findRestaurant(id: string) {
  return restaurants.find(restaurant => restaurant.id === id);
}

function toCents(amount: number) {
  return Math.round(amount * 100);
}

function resolveSelections(
  item: MenuItem,
  selections: ModifierSelection[] = []
): QuotedSelection[] {
  const groups = item.modifierGroups ?? [];
  const receivedGroups = new Set<string>();
  const resolved: QuotedSelection[] = [];

  for (const selection of selections) {
    if (receivedGroups.has(selection.groupId))
      throw new Error("Grupo de opciones repetido");
    receivedGroups.add(selection.groupId);

    const group = groups.find(candidate => candidate.id === selection.groupId);
    if (!group)
      throw new Error("Grupo de opciones no válido para este producto");

    const optionIds = selection.optionIds ?? [];
    if (new Set(optionIds).size !== optionIds.length)
      throw new Error("Opción repetida");
    const maximum = group.maxSelections ?? group.options.length;
    if (optionIds.length > maximum)
      throw new Error(
        `Puedes elegir hasta ${maximum} opción${maximum === 1 ? "" : "es"} en ${group.name}`
      );

    for (const optionId of optionIds) {
      const option = group.options.find(candidate => candidate.id === optionId);
      if (!option) throw new Error("Opción no válida para este producto");
      resolved.push({
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        optionName: option.name,
        unitCents: toCents(option.price),
      });
    }
  }

  for (const group of groups) {
    const selectedCount = resolved.filter(
      selection => selection.groupId === group.id
    ).length;
    const minimum = group.minSelections ?? 0;
    const maximum = group.maxSelections ?? group.options.length;
    if (selectedCount < minimum)
      throw new Error(
        `Selecciona al menos ${minimum} opción${minimum === 1 ? "" : "es"} en ${group.name}`
      );
    if (selectedCount > maximum)
      throw new Error(
        `Puedes elegir hasta ${maximum} opción${maximum === 1 ? "" : "es"} en ${group.name}`
      );
  }

  return resolved;
}

/** Server-only quote calculation. Client totals and option prices are intentionally ignored. */
export function buildOrderQuote(
  restaurantId: string,
  items: CheckoutLine[]
): { restaurant: Restaurant; quote: OrderQuote } {
  const restaurant = findRestaurant(restaurantId);
  if (!restaurant) throw new Error("Restaurante no encontrado");
  if (!items.length) throw new Error("La cesta está vacía");

  const displayLines = items.map(line => {
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > 20
    )
      throw new Error("Cantidad no válida");
    const item = restaurant.menu.find(menuItem => menuItem.id === line.id);
    if (!item) throw new Error("Producto no válido para este restaurante");

    const selections = resolveSelections(item, line.selections);
    const unitCents =
      toCents(item.price) +
      selections.reduce((sum, selection) => sum + selection.unitCents, 0);
    const optionSummary = selections
      .map(selection => selection.optionName)
      .join(" · ");

    return {
      itemId: item.id,
      name: optionSummary ? `${item.name} · ${optionSummary}` : item.name,
      quantity: line.quantity,
      unitCents,
      selections,
    };
  });

  const subtotalCents = displayLines.reduce(
    (sum, line) => sum + line.unitCents * line.quantity,
    0
  );
  const deliveryCents = toCents(restaurant.fee);
  const serviceCents = 79;

  return {
    restaurant,
    quote: {
      subtotalCents,
      deliveryCents,
      serviceCents,
      totalCents: subtotalCents + deliveryCents + serviceCents,
      displayLines,
    },
  };
}
