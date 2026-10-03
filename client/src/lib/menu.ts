import type { MenuItem, ModifierSelection } from "../../../server/catalog";

export function normaliseSelections(
  selections: ModifierSelection[]
): ModifierSelection[] {
  return selections
    .filter(selection => selection.optionIds.length > 0)
    .map(selection => ({
      groupId: selection.groupId,
      optionIds: [...selection.optionIds].sort(),
    }))
    .sort((left, right) => left.groupId.localeCompare(right.groupId));
}

export function selectionKey(itemId: string, selections: ModifierSelection[]) {
  return `${itemId}:${JSON.stringify(normaliseSelections(selections))}`;
}

export function selectedOptionNames(
  item: MenuItem,
  selections: ModifierSelection[]
) {
  return normaliseSelections(selections).flatMap(selection => {
    const group = item.modifierGroups?.find(
      candidate => candidate.id === selection.groupId
    );
    if (!group) return [];
    return selection.optionIds.flatMap(optionId => {
      const option = group.options.find(candidate => candidate.id === optionId);
      return option ? [option.name] : [];
    });
  });
}

export function getMenuItemUnitPrice(
  item: MenuItem,
  selections: ModifierSelection[]
) {
  const addOns = normaliseSelections(selections).reduce((sum, selection) => {
    const group = item.modifierGroups?.find(
      candidate => candidate.id === selection.groupId
    );
    if (!group) return sum;
    return (
      sum +
      selection.optionIds.reduce((groupSum, optionId) => {
        const option = group.options.find(
          candidate => candidate.id === optionId
        );
        return groupSum + (option?.price ?? 0);
      }, 0)
    );
  }, 0);

  return item.price + addOns;
}
