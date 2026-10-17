import { getMenuItemUnitPrice } from "@/lib/menu";
import { Check, Minus, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  MenuItem,
  MenuModifierGroup,
  ModifierSelection,
  Restaurant,
} from "../../../server/catalog";

const money = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

type ProductCustomizerProps = {
  item: MenuItem;
  restaurant: Restaurant;
  onClose: () => void;
  onAdd: (selections: ModifierSelection[], quantity: number) => void;
};

function initialSelections(item: MenuItem) {
  return Object.fromEntries(
    (item.modifierGroups ?? []).map(group => [group.id, [] as string[]])
  );
}

function groupHint(group: MenuModifierGroup, selectedCount: number) {
  const minimum = group.minSelections ?? 0;
  const maximum = group.maxSelections ?? group.options.length;

  if (selectedCount < minimum) {
    const missing = minimum - selectedCount;
    return `Falta${missing === 1 ? "" : "n"} ${missing} selección${missing === 1 ? "" : "es"}`;
  }

  if (minimum > 0 && maximum === minimum) {
    return `Elige ${minimum} opción${minimum === 1 ? "" : "es"}`;
  }

  return minimum > 0
    ? `Mínimo ${minimum} · máximo ${maximum}`
    : `Opcional · máximo ${maximum}`;
}

export function ProductCustomizer({
  item,
  restaurant,
  onClose,
  onAdd,
}: ProductCustomizerProps) {
  const [selected, setSelected] = useState<Record<string, string[]>>(() =>
    initialSelections(item)
  );
  const [quantity, setQuantity] = useState(1);
  const groups = item.modifierGroups ?? [];
  const selections = useMemo<ModifierSelection[]>(
    () =>
      groups.map(group => ({
        groupId: group.id,
        optionIds: selected[group.id] ?? [],
      })),
    [groups, selected]
  );
  const unitPrice = getMenuItemUnitPrice(item, selections);
  const totalPrice = unitPrice * quantity;
  const isValid = groups.every(group => {
    const count = selected[group.id]?.length ?? 0;
    const minimum = group.minSelections ?? 0;
    const maximum = group.maxSelections ?? group.options.length;
    return count >= minimum && count <= maximum;
  });
  const imageSource = item.image || restaurant?.image;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  const setOption = (group: MenuModifierGroup, optionId: string) => {
    const maximum = group.maxSelections ?? group.options.length;
    const minimum = group.minSelections ?? 0;

    setSelected(current => {
      const currentOptions = current[group.id] ?? [];
      const active = currentOptions.includes(optionId);
      let nextOptions = currentOptions;

      if (active) {
        if (maximum === 1 && minimum > 0) return current;
        nextOptions = currentOptions.filter(id => id !== optionId);
      } else if (maximum === 1) {
        nextOptions = [optionId];
      } else if (currentOptions.length < maximum) {
        nextOptions = [...currentOptions, optionId];
      }

      return { ...current, [group.id]: nextOptions };
    });
  };

  const clearGroup = (groupId: string) =>
    setSelected(current => ({ ...current, [groupId]: [] }));

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end justify-center bg-[#1b211b]/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Personalizar ${item.name}`}
        onMouseDown={event => event.stopPropagation()}
        className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[1.75rem] bg-[#fffdf8] shadow-[0_28px_80px_rgba(20,25,20,.35)] sm:h-[min(780px,92vh)] sm:rounded-[1.75rem]"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-[#e9e1d8] bg-white px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#ffd72e] text-lg font-black text-[#171715] shadow-[3px_3px_0_rgba(220,92,53,.26)]">
              P
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#bd4f2e]">
                Personaliza tu pedido
              </p>
              <h2 className="truncate text-lg font-extrabold tracking-[-.025em] text-[#171715] sm:text-xl">
                {item.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar configurador"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#eee5dd] bg-[#fffdf8] text-[#263229] transition hover:bg-[#fff4be]"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden md:grid md:grid-cols-[minmax(0,1fr)_350px]">
          <main className="min-h-0 overflow-y-auto px-5 py-5 sm:px-7 sm:py-7">
            <div className="mb-6 flex gap-4 rounded-2xl border border-[#eee4da] bg-white p-4 md:hidden">
              {imageSource ? (
                <img
                  src={imageSource}
                  alt={`Imagen de ${item.name}`}
                  className="h-20 w-20 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-[#fff4be] text-xl font-black text-[#bd4f2e]">
                  P
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#718076]">
                  {restaurant.name}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#58665b]">
                  {item.description || "Preparado al momento para tu pedido."}
                </p>
              </div>
            </div>

            <div className="mb-7 max-w-2xl">
              <p className="text-sm leading-relaxed text-[#5e695f]">
                {item.description || "Preparado al momento para tu pedido."}
              </p>
              <p className="mt-3 text-base font-extrabold text-[#171715]">
                {money.format(item.price)}
                <span className="ml-1.5 font-medium text-[#788278]">
                  precio base
                </span>
              </p>
            </div>

            <div className="space-y-7">
              {groups.map(group => {
                const chosen = selected[group.id] ?? [];
                const maximum = group.maxSelections ?? group.options.length;
                const minimum = group.minSelections ?? 0;
                const singleChoice = maximum === 1;
                const hasMissingRequiredSelection = chosen.length < minimum;

                return (
                  <section
                    key={group.id}
                    aria-labelledby={`group-${group.id}`}
                    className="border-b border-[#e8e1d8] pb-6 last:border-b-0"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <h3
                          id={`group-${group.id}`}
                          className="text-xl font-extrabold tracking-[-.025em] text-[#171715]"
                        >
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="mt-1 text-sm leading-relaxed text-[#68746a]">
                            {group.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                          minimum > 0
                            ? "bg-[#fff0d8] text-[#9b4b2b]"
                            : "bg-[#edf3e9] text-[#4d6f4f]"
                        }`}
                      >
                        {minimum > 0 ? "Obligatorio" : "Opcional"}
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#e8e1d8] bg-white">
                      {minimum === 0 && (
                        <button
                          type="button"
                          onClick={() => clearGroup(group.id)}
                          className={`flex w-full items-center justify-between gap-4 border-b border-[#f0ebe5] px-4 py-3.5 text-left transition hover:bg-[#fffaf2] ${
                            chosen.length === 0 ? "bg-[#fff9df]" : ""
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span
                              className={`grid h-5 w-5 shrink-0 place-items-center border-2 ${
                                singleChoice ? "rounded-full" : "rounded-md"
                              } ${
                                chosen.length === 0
                                  ? "border-[#171715] bg-[#171715]"
                                  : "border-[#b9c1b8]"
                              }`}
                            >
                              {chosen.length === 0 && (
                                <Check className="h-3.5 w-3.5 text-white" />
                              )}
                            </span>
                            <span className="text-sm font-bold text-[#263229]">
                              Sin extras
                            </span>
                          </span>
                          <span className="text-xs font-semibold text-[#7a857b]">
                            Incluido
                          </span>
                        </button>
                      )}

                      {group.options.map((option, optionIndex) => {
                        const active = chosen.includes(option.id);
                        const priceLabel = option.price
                          ? `+${money.format(option.price)}`
                          : "Incluido";
                        const isLastOption =
                          optionIndex === group.options.length - 1;

                        return (
                          <button
                            type="button"
                            key={option.id}
                            onClick={() => setOption(group, option.id)}
                            aria-pressed={active}
                            className={`flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition hover:bg-[#fffaf2] ${
                              !isLastOption ? "border-b border-[#f0ebe5]" : ""
                            } ${active ? "bg-[#fff9df]" : ""}`}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span
                                className={`grid h-5 w-5 shrink-0 place-items-center border-2 ${
                                  singleChoice ? "rounded-full" : "rounded-md"
                                } ${
                                  active
                                    ? "border-[#171715] bg-[#171715]"
                                    : "border-[#b9c1b8]"
                                }`}
                              >
                                {active && (
                                  <Check className="h-3.5 w-3.5 text-white" />
                                )}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-bold text-[#263229]">
                                  {option.name}
                                </span>
                                {option.description && (
                                  <span className="mt-0.5 block text-xs text-[#758075]">
                                    {option.description}
                                  </span>
                                )}
                              </span>
                            </span>
                            <span className="shrink-0 text-sm font-extrabold text-[#263229]">
                              {priceLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <p
                      className={`mt-2 text-xs font-semibold ${
                        hasMissingRequiredSelection
                          ? "text-[#b6402b]"
                          : "text-[#778279]"
                      }`}
                    >
                      {groupHint(group, chosen.length)} · {chosen.length}{" "}
                      seleccionada
                      {chosen.length === 1 ? "" : "s"}
                    </p>
                  </section>
                );
              })}
            </div>
          </main>

          <aside className="hidden min-h-0 overflow-y-auto border-l border-[#e9e1d8] bg-[#f8f5ef] p-6 md:block">
            {imageSource ? (
              <img
                src={imageSource}
                alt={`Imagen de ${item.name}`}
                className="aspect-[4/3] w-full rounded-2xl bg-white object-cover shadow-sm"
              />
            ) : (
              <div className="grid aspect-square w-full place-items-center rounded-2xl bg-[radial-gradient(circle_at_16%_15%,rgba(255,255,255,.9),transparent_26%),linear-gradient(135deg,#ffd72e,#f5a94b)] text-5xl font-black text-[#171715] shadow-sm">
                P
              </div>
            )}
            <p className="mt-5 text-xs font-extrabold uppercase tracking-[.14em] text-[#bd4f2e]">
              {restaurant.name}
            </p>
            <h3 className="mt-1 text-2xl font-extrabold tracking-[-.04em] text-[#171715]">
              {item.name}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#667267]">
              {item.description || "Preparado al momento para tu pedido."}
            </p>

            <div className="mt-7 rounded-2xl border border-[#e8e1d8] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-extrabold text-[#263229]">
                  Cantidad
                </span>
                <div className="flex items-center gap-2 rounded-full border border-[#e2dbd2] bg-[#fffdf8] p-1">
                  <button
                    type="button"
                    aria-label="Restar cantidad"
                    onClick={() => setQuantity(value => Math.max(1, value - 1))}
                    className="grid h-8 w-8 place-items-center rounded-full text-[#526056] transition hover:bg-[#f6efe5]"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-5 text-center text-sm font-extrabold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Sumar cantidad"
                    disabled={quantity >= 20}
                    onClick={() =>
                      setQuantity(value => Math.min(20, value + 1))
                    }
                    className="grid h-8 w-8 place-items-center rounded-full bg-[#171715] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <footer className="shrink-0 border-t border-[#e9e1d8] bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-7">
          {!isValid && (
            <p className="mb-2 text-center text-xs font-bold text-[#b6402b]">
              Completa las opciones obligatorias para continuar.
            </p>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-[#e2dbd2] bg-[#fffdf8] p-1 md:hidden">
              <button
                type="button"
                aria-label="Restar cantidad"
                onClick={() => setQuantity(value => Math.max(1, value - 1))}
                className="grid h-8 w-8 place-items-center rounded-full text-[#526056]"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-5 text-center text-sm font-extrabold">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Sumar cantidad"
                disabled={quantity >= 20}
                onClick={() => setQuantity(value => Math.min(20, value + 1))}
                className="grid h-8 w-8 place-items-center rounded-full bg-[#171715] text-white disabled:opacity-35"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              disabled={!isValid}
              onClick={() => onAdd(selections, quantity)}
              className="flex flex-1 items-center justify-between rounded-xl bg-[#171715] px-5 py-3.5 text-[15px] font-extrabold text-[#fffdf8] shadow-[0_6px_0_#bd4f2e] transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-45"
            >
              <span>Añadir {quantity} al carrito</span>
              <span>{money.format(totalPrice)}</span>
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
