import type { FoodItem } from './foods';

export const FOOD_ALIASES: Record<string, string> = {
  'pao frances': 'Pão francês',
  'pão frances': 'Pão francês',
  'pao francês': 'Pão francês',
  'pão francês': 'Pão francês',
  'pao integral': 'Pão integral',
  'pão integral': 'Pão integral',

  'cafe': 'Café sem açúcar',
  'café': 'Café sem açúcar',
  'cafe sem acucar': 'Café sem açúcar',
  'café sem açúcar': 'Café sem açúcar',

  'mantega': 'Manteiga',
  'manteiga': 'Manteiga',
  'requeijao': 'Requeijão light',
  'requeijão': 'Requeijão light',
  'cuzcuz': 'Cuscuz de milho',
  'cuscuz': 'Cuscuz de milho',
  'cuscuz milho': 'Cuscuz de milho',
  'macarrao': 'Macarrão integral',
  'macarrão': 'Macarrão integral',
  'frango grelhdo': 'Peito de Frango grelhado',
  'frango grelhado': 'Peito de Frango grelhado',
  'frango': 'Peito de Frango grelhado',
  'carne moida': 'Patinho moído',
  'carne moída': 'Patinho moído',
  'batata doce': 'Batata-doce cozida',

  'nescau': 'Achocolatado',
  'toddy': 'Achocolatado',
  'achocolatado': 'Achocolatado',
  'whey': 'Whey Protein',
  'whey protein': 'Whey Protein',
};

export function normalizeFoodText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function resolveFoodAlias(value: string) {
  const normalized = normalizeFoodText(value);
  return FOOD_ALIASES[normalized] ?? null;
}

export function resolveFoodName(value: string, foods: FoodItem[]) {
  const raw = value.trim();

  if (!raw) return null;

  const alias = resolveFoodAlias(raw);

  if (alias) return alias;

  const normalized = normalizeFoodText(raw);

  const exact = foods.find(food => normalizeFoodText(food.name) === normalized);
  if (exact) return exact.name;

  const partial = foods.find(food => {
    const foodName = normalizeFoodText(food.name);
    return foodName.includes(normalized) || normalized.includes(foodName);
  });

  return partial?.name ?? null;
}