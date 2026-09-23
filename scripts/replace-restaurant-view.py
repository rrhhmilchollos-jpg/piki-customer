from pathlib import Path

path = Path('/home/ubuntu/piki-customer/client/src/pages/Home.tsx')
s = path.read_text()
start = s.index('      {selectedRestaurant &&')
end = s.index('\n\n      {cartOpen', start)
replacement = '''      {selectedRestaurant && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-[#FFFDF5]">
          <div className="mx-auto min-h-full max-w-7xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ece3d9] bg-[#FFFDF5]/95 px-4 py-3 backdrop-blur sm:px-8">
              <button onClick={() => setSelectedRestaurant(null)} className="inline-flex items-center gap-2 rounded-full border border-[#e5dbd0] bg-white px-4 py-2 text-sm font-extrabold" aria-label="Volver a restaurantes"><ArrowLeft className="h-4 w-4" /> Restaurantes</button>
              <div className="hidden text-center sm:block"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">Carta de PIKI</p><p className="font-display text-xl font-semibold">{selectedRestaurant.name}</p></div>
              <button onClick={() => setCartOpen(true)} className="relative inline-flex items-center gap-2 rounded-full bg-[#171715] px-4 py-2 text-sm font-extrabold text-white"><ShoppingBag className="h-4 w-4" /> Cesta {cartCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#FFD72E] px-1 text-[10px] text-[#171715]">{cartCount}</span>}</button>
            </div>
            <div className="grid lg:grid-cols-[1.05fr_.95fr]">
              <div className="relative h-72 overflow-hidden lg:sticky lg:top-[61px] lg:h-[calc(100vh-61px)]">
                <img src={selectedRestaurant.image} alt={`Imagen de ${selectedRestaurant.name}`} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#171715]/80 via-transparent to-black/10" />
                <div className="absolute bottom-0 left-0 p-6 text-white sm:p-10"><p className="mb-2 text-sm font-bold text-[#FFE88A]">{selectedRestaurant.cuisine}</p><h1 className="font-display text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">{selectedRestaurant.name}</h1><div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold"><span className="flex items-center gap-1"><Star className="h-4 w-4 fill-[#f9b43d] text-[#f9b43d]" /> {selectedRestaurant.rating.toFixed(1)} ({selectedRestaurant.reviews})</span><span>·</span><span>{selectedRestaurant.eta}</span><span>·</span><span>{selectedRestaurant.fee === 0 ? "Envío gratis" : `Envío ${money.format(selectedRestaurant.fee)}`}</span></div></div>
              </div>
              <div className="bg-[#FFFDF5] px-4 py-6 sm:px-8 sm:py-10 lg:px-12">
                <p className="max-w-2xl text-base leading-relaxed text-[#647166]">{selectedRestaurant.tagline}</p>
                <div className="mt-8 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">Menú completo</p><h2 className="mt-1 font-display text-3xl font-semibold tracking-[-.04em]">Todo lo que puedes pedir</h2></div><span className="rounded-full bg-[#FFF2AD] px-3 py-1 text-xs font-bold text-[#171715]">Entrega sostenible</span></div>
                <div className="mt-6 space-y-3">{selectedRestaurant.menu.map((item) => { const quantity = cart.find((line) => line.item.id === item.id)?.quantity ?? 0; return <article key={item.id} className="flex gap-4 rounded-2xl border border-[#ebe1d7] bg-white p-4 shadow-[0_4px_12px_rgba(61,49,36,.03)]"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-extrabold">{item.name}</h3>{item.popular && <span className="rounded-full bg-[#ffe6dc] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#c14f2d]">Top</span>}{item.vegetarian && <Leaf className="h-3.5 w-3.5 text-[#4f883c]" />}</div><p className="mt-1 text-sm leading-relaxed text-[#68746a]">{item.description}</p><p className="mt-2 text-sm font-extrabold text-[#263229]">{money.format(item.price)}</p></div>{quantity ? <QuantityControl quantity={quantity} onChange={(next) => changeQuantity(item.id, next)} /> : <button onClick={() => addItem(selectedRestaurant, item)} className="grid h-10 w-10 shrink-0 place-items-center self-center rounded-full bg-[#171715] text-white transition hover:bg-black active:scale-95" aria-label={`Añadir ${item.name}`}><Plus className="h-5 w-5" /></button>}</article>; })}</div>
                {cartCount > 0 && <div className="mt-8 rounded-2xl border border-[#e8ded4] bg-white p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#dc5c35]">Tu pedido</p><p className="mt-1 text-sm font-extrabold">{cartCount} productos · {money.format(total)}</p></div><button onClick={() => { setSelectedRestaurant(null); setCartOpen(true); }} className="rounded-full bg-[#FFD72E] px-4 py-2 text-sm font-extrabold text-[#171715]">Ver cesta</button></div></div>}
              </div>
            </div>
          </div>
        </div>
      )}'''
path.write_text(s[:start] + replacement + s[end:])
print('restaurant-view-replaced')
