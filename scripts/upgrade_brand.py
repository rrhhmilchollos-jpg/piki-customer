from pathlib import Path

root = Path('/home/ubuntu/mesago-delivery')
for rel in ['client/src/App.tsx', 'client/src/pages/Home.tsx', 'client/src/components/AccountHub.tsx', 'client/index.html', 'client/public/manifest.json', 'client/src/index.css']:
    p = root / rel
    text = p.read_text()
    text = text.replace('MesaGo', 'Manduca').replace('mesago', 'manduca').replace('MESAGO', 'MANDUCA')
    p.write_text(text)

home = root / 'client/src/pages/Home.tsx'
text = home.read_text()
text = text.replace('import { trpc } from "@/lib/trpc";', 'import { trpc } from "@/lib/trpc";\nimport AccountHub from "@/components/AccountHub";')
text = text.replace('import {\n  ArrowLeft,', 'import {\n  ArrowLeft,\n  Heart,')
text = text.replace('function RestaurantCard({ restaurant, onOpen }: { restaurant: Restaurant; onOpen: (restaurant: Restaurant) => void }) {', 'function RestaurantCard({ restaurant, onOpen }: { restaurant: Restaurant; onOpen: (restaurant: Restaurant) => void }) {')
needle = '<div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-transparent" />'
replacement = needle + '''\n          <button onClick={(event) => { event.stopPropagation(); const key = "manduca-favorites"; const saved = JSON.parse(localStorage.getItem(key) || "[]") as string[]; const next = saved.includes(restaurant.id) ? saved.filter((id) => id !== restaurant.id) : [...saved, restaurant.id]; localStorage.setItem(key, JSON.stringify(next)); toast.success(next.includes(restaurant.id) ? "Guardado en favoritos" : "Eliminado de favoritos"); }} aria-label="Guardar restaurante" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#d95737] shadow-sm transition hover:scale-105"><Heart className="h-4 w-4" /></button>'''
text = text.replace(needle, replacement, 1)
text = text.replace('setTracking({ ...order, stage: "confirmed" });', 'setTracking({ ...order, stage: "confirmed" });\n          const historyKey = "manduca-history";\n          const previousHistory = JSON.parse(localStorage.getItem(historyKey) || "[]") as Array<{ id: string; restaurant: string; total: number; createdAt: number }>;\n          localStorage.setItem(historyKey, JSON.stringify([{ id: order.id, restaurant: order.restaurant, total, createdAt: order.createdAt }, ...previousHistory].slice(0, 20)));')
text = text.replace('      <footer className=', '      <AccountHub />\n\n      <footer className=')
home.write_text(text)

app = root / 'client/src/App.tsx'
app.write_text(app.read_text().replace('MesaGo', 'Manduca'))
