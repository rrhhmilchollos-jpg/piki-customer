import { getMenuItemUnitPrice } from "@/lib/menu";
import { Check, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { MenuItem, ModifierSelection } from "../../../server/catalog";

const money = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

type ProductCustomizerProps = {
  item: MenuItem;
  onClose: () => void;
  onAdd: (selections: ModifierSelection[]) => void;
};

function initialSelections(item: MenuItem) {
  return Object.fromEntries(
    (item.modifierGroups ?? []).map(group => [group.id, [] as string[]])
  );
}

export function ProductCustomizer({
  item,
  onClose,
  onAdd,
}: ProductCustomizerProps) {
  const [selected, setSelected] = useState<Record<string, string[]>>(() =>
    initialSelections(item)
  );
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
  const isValid = groups.every(group => {
    const count = selected[group.id]?.length ?? 0;
    const minimum = group.minSelections ?? 0;
    const maximum = group.maxSelections ?? group.options.length;
    return count >= minimum && count <= maximum;
  });

  const setOption = (
    groupId: string,
    optionId: string,
    maxSelections: number
  ) => {
    setSelected(current => {
      const currentOptions = current[groupId] ?? [];
      const isSelected = currentOptions.includes(optionId);
      const nextOptions = isSelected
        ? currentOptions.filter(id => id !== optionId)
        : maxSelections === 1
          ? [optionId]
          : currentOptions.length >= maxSelections
            ? currentOptions
            : [...currentOptions, optionId];
      return { ...current, [groupId]: nextOptions };
    });
  };

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end justify-center bg-[#171715]/50 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={onClose}
    >
      <section
        aria-label={`Personalizar ${item.name}`}
        role="dialog"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-xl overflow-hidden rounded-t-[2rem] bg-[#FFFDF5] shadow-2xl sm:rounded-[2rem]"
        onMouseDown={event => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#ece2d8] px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#dc5c35]">
              Personaliza tu pedido
            </p>
            <h2 className="mt-1 font-display text-3xl font-semibold tracking-[-.05em] text-[#171715]">
              {item.name}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-[#68746a]">
              {item.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#e5dbd0] bg-white text-[#171715]"
            aria-label="Cerrar configurador"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="max-h-[calc(92vh-190px)] overflow-y-auto px-5 py-5 sm:px-7">
          {groups.length === 0 ? (
            <p className="rounded-2xl bg-white p-4 text-sm text-[#68746a]">
              Este producto se añade tal cual a la cesta.
            </p>
          ) : (
            <div className="space-y-6">
              {groups.map(group => {
                const chosen = selected[group.id] ?? [];
                const maximum = group.maxSelections ?? group.options.length;
                const minimum = group.minSelections ?? 0;
                return (
                  <fieldset
                    key={group.id}
                    className="overflow-hidden rounded-2xl border border-[#e8ded4] bg-white"
                  >
                    <legend className="sr-only">{group.name}</legend>
                    <div className="border-b border-[#f0e9e1] bg-[#fffaf3] px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-extrabold text-[#263229]">
                          {group.name}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${minimum > 0 ? "bg-[#FFF4BE] text-[#171715]" : "bg-[#eef3ec] text-[#536657]"}`}
                        >
                          {minimum > 0 ? "Obligatorio" : "Opcional"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#68746a]">
                        {group.description ??
                          `Elige hasta ${maximum} opción${maximum === 1 ? "" : "es"}.`}
                      </p>
                    </div>
                    <div className="p-2">
                      {minimum === 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSelected(current => ({
                              ...current,
                              [group.id]: [],
                            }))
                          }
                          className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${chosen.length === 0 ? "bg-[#fff7d9] text-[#171715]" : "hover:bg-[#faf6f0] text-[#536056]"}`}
                        >
                          <span
                            className={`grid h-5 w-5 place-items-center rounded-full border-2 ${chosen.length === 0 ? "border-[#171715] bg-[#171715] text-white" : "border-[#c6c1ba] bg-white"}`}
                          >
                            {chosen.length === 0 && (
                              <Check className="h-3 w-3" />
                            )}
                          </span>
                          <span className="font-semibold">No añadir</span>
                        </button>
                      )}
                      {group.options.map(option => {
                        const active = chosen.includes(option.id);
                        return (
                          <button
                            type="button"
                            key={option.id}
                            onClick={() =>
                              setOption(group.id, option.id, maximum)
                            }
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${active ? "bg-[#fff7d9] text-[#171715]" : "hover:bg-[#faf6f0] text-[#536056]"}`}
                          >
                            <span
                              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${active ? "border-[#171715] bg-[#171715] text-white" : "border-[#c6c1ba] bg-white"}`}
                            >
                              {active && <Check className="h-3 w-3" />}
                            </span>
                            <span className="min-w-0 flex-1 font-semibold">
                              {option.name}
                            </span>
                            <span className="shrink-0 font-extrabold">
                              {option.price
                                ? `+${money.format(option.price)}`
                                : "Incluido"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
            </div>
          )}
        </div>

        <footer className="border-t border-[#ece2d8] bg-[#FFFDF5] p-5 sm:px-7">
          {!isValid && (
            <p className="mb-3 text-xs font-bold text-[#bc4d2d]">
              Completa las opciones obligatorias para continuar.
            </p>
          )}
          <button
            type="button"
            disabled={!isValid}
            onClick={() => onAdd(selections)}
            className="flex w-full items-center justify-between rounded-xl bg-[#171715] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Añadir a la cesta
            </span>
            <span>{money.format(unitPrice)}</span>
          </button>
        </footer>
      </section>
    </div>
  );
}
