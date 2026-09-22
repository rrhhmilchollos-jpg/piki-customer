from pathlib import Path
p = Path('/home/ubuntu/mesago-delivery/client/src/pages/Partners.tsx')
text = p.read_text()
text = text.replace('  const { data: liveOrders = [], refetch: refetchOrders } = trpc.order.feed.useQuery({ statuses: ["placed", "accepted", "ready"] }, { refetchInterval: 5000 });', '  const { data: liveOrders = [], refetch: refetchOrders } = trpc.order.feed.useQuery({ statuses: ["placed", "accepted", "ready"] }, { refetchInterval: 5000 });\n  const createStore = trpc.partner.createStore.useMutation();')
old = '''    const key = "manduca-partner-drafts";
    const previous = JSON.parse(localStorage.getItem(key) || "[]") as unknown[];
    localStorage.setItem(key, JSON.stringify([...previous, { name: newName.trim(), cuisine: newCuisine, status, menu: items, createdAt: Date.now() }]));
    toast.success("Establecimiento guardado", { description: "Queda listo para revisión del gerente de zona." });
    setShowNew(false); setNewName(""); setItems([emptyMenuItem]);'''
new = '''    createStore.mutate({ name: newName.trim(), cuisine: newCuisine, address: "Pendiente de completar", items: items.map((item) => ({ name: item.name.trim(), description: item.description, priceCents: Math.round(Number(item.price) * 100) })) }, { onSuccess: () => { toast.success("Establecimiento guardado", { description: "Queda listo para revisión del gerente de zona." }); setShowNew(false); setNewName(""); setItems([emptyMenuItem]); }, onError: () => toast.error("No se pudo guardar el establecimiento") });'''
text = text.replace(old, new)
text = text.replace('onClick={saveNew} className="mt-7 flex w-full', 'onClick={saveNew} disabled={createStore.isPending} className="mt-7 flex w-full')
text = text.replace('<Save className="h-4 w-4" /> Guardar para revisión', '<Save className="h-4 w-4" /> {createStore.isPending ? "Guardando…" : "Guardar para revisión"}')
p.write_text(text)
