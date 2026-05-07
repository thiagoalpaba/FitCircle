import type { FoodItem } from '../data/foods';

export type RestrictionKey =
  | 'sem-lactose'
  | 'sem-ovo'
  | 'sem-gluten'
  | 'vegetariano'
  | 'vegano';

const ANIMAL_KEYWORDS = [
  'frango',
  'patinho',
  'tilápia',
  'atum',
  'carne',
  'sobrecoxa',
  'peixe',
];

export function normalizeRestrictions(list?: string[]) {
  if (!list) return [];
  return list.filter(Boolean).filter((v) => v !== 'nenhuma');
}

export function foodMatchesRestrictions(
  food: FoodItem,
  restrictions: string[] = []
) {
  const active = normalizeRestrictions(restrictions);
  const name = food.name.toLowerCase();

  if (active.includes('sem-lactose') && food.isLactose) return false;
  if (active.includes('sem-ovo') && food.isEgg) return false;
  if (active.includes('sem-gluten') && food.isGluten) return false;

  const hasAnimal = ANIMAL_KEYWORDS.some((k) => name.includes(k));
  const hasAnimalByProduct = !!food.isEgg || !!food.isLactose;

  if (active.includes('vegetariano') && hasAnimal) return false;

  if (active.includes('vegano')) {
    if (hasAnimal) return false;
    if (hasAnimalByProduct) return false;
  }

  return true;
}

export function filterFoodsByRestrictions(
  foods: FoodItem[],
  restrictions: string[] = []
) {
  return foods.filter((food) => foodMatchesRestrictions(food, restrictions));
}