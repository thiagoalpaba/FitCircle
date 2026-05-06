export const FOOD_ALIASES: Record<string, string> = {
  // pão
  'pao frances': 'Pão francês',
  'pão frances': 'Pão francês',
  'pao francês': 'Pão francês',
  'pao integral': 'Pão integral',

  // café
  'cafe': 'Café sem açúcar',
  'café': 'Café sem açúcar',
  'cafe sem acucar': 'Café sem açúcar',
  'café sem açúcar': 'Café sem açúcar',

  // erros comuns
  'mantega': 'Manteiga',
  'requeijao': 'Requeijão light',
  'cuzcuz': 'Cuscuz de milho',
  'cuscuz': 'Cuscuz de milho',
  'cuscuz milho': 'Cuscuz de milho',
  'macarrao': 'Macarrão integral',
  'macarrão': 'Macarrão integral',
  'frango grelhdo': 'Frango grelhado',
  'carne moida': 'Patinho moído',
  'batata doce': 'Batata-doce cozida',

  // marcas/termos comuns
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