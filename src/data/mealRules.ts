export const PORTION_LIMITS: Record<string, { min?: number; max: number; unit?: string }> = {
  // Café da manhã
  'Pão francês': { max: 1, unit: 'unidade' },
  'Pão integral': { max: 2, unit: 'fatias' },
  'Tapioca (goma)': { min: 30, max: 50, unit: 'g' },
  'Aveia em flocos': { min: 20, max: 40, unit: 'g' },
  'Cuscuz de milho': { min: 80, max: 150, unit: 'g' },
  'Manteiga': { min: 5, max: 8, unit: 'g' },
  'Requeijão light': { min: 15, max: 30, unit: 'g' },
  'Queijo minas frescal': { min: 30, max: 60, unit: 'g' },
  'Ovo de galinha': { min: 1, max: 2, unit: 'unidades' },

  // Suplementos
  'Whey Protein': { min: 20, max: 40, unit: 'g' },
  'Achocolatado': { min: 10, max: 20, unit: 'g' },

  // Almoço/jantar
  'Arroz branco cozido': { min: 80, max: 150, unit: 'g' },
  'Arroz integral cozido': { min: 80, max: 150, unit: 'g' },
  'Feijão preto cozido': { min: 80, max: 120, unit: 'g' },
  'Feijão carioca cozido': { min: 80, max: 120, unit: 'g' },
  'Batata inglesa cozida': { min: 120, max: 250, unit: 'g' },
  'Batata-doce cozida': { min: 100, max: 220, unit: 'g' },
  'Inhame cozido': { min: 100, max: 220, unit: 'g' },
  'Macarrão integral': { min: 100, max: 180, unit: 'g' },

  // Proteínas principais
  'Peito de Frango grelhado': { min: 100, max: 200, unit: 'g' },
  'Frango grelhado': { min: 100, max: 200, unit: 'g' },
  'Patinho moído': { min: 100, max: 180, unit: 'g' },
  'Tilápia grelhada': { min: 120, max: 220, unit: 'g' },
  'Atum em lata (água)': { min: 80, max: 120, unit: 'g' },

  // Vegetarianos/veganos
  'Tofu grelhado': { min: 120, max: 200, unit: 'g' },
  'Lentilha cozida': { min: 100, max: 180, unit: 'g' },
  'Grão-de-bico cozido': { min: 100, max: 180, unit: 'g' },
  'Proteína de soja': { min: 60, max: 120, unit: 'g' },

  // Vegetais
  'Legumes variados': { min: 100, max: 250, unit: 'g' },
  'Brócolis cozido': { min: 80, max: 200, unit: 'g' },
};

export const MAIN_MEAL_PROTEINS = [
  'Peito de Frango grelhado',
  'Frango grelhado',
  'Patinho moído',
  'Tilápia grelhada',
  'Carne magra grelhada',
  'Atum em lata (água)',
  'Ovo de galinha',
  'Tofu grelhado',
  'Lentilha cozida',
  'Grão-de-bico cozido',
  'Proteína de soja',
];

export const SUPPLEMENTS = [
  'Whey Protein',
  'Achocolatado',
];

export const BREAKFAST_ONLY_OR_COMPLEMENTARY = [
  'Café sem açúcar',
  'Achocolatado',
  'Whey Protein',
  'Manteiga',
  'Requeijão light',
];

export const FREE_PORTION_FOODS = [
  'Salada verde',
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function sanitizeOptionQtyText(qty: string) {
  let text = qty;

  // Salada deve aparecer como livre, não em gramas.
  text = text.replace(/Salada verde\s+\d+\s*g/gi, 'Salada verde à vontade');

  // Morango não deve aparecer como 33 unidades.
  text = text.replace(/Morango\s+\d+\s+unidades?/gi, 'Morango 150g');

  Object.entries(PORTION_LIMITS).forEach(([foodName, limit]) => {
    const escapedFood = escapeRegExp(foodName);

    // Limite para gramas: "Whey Protein 100g" -> "Whey Protein 40g"
    text = text.replace(
      new RegExp(`(${escapedFood}\\s+)(\\d+)(\\s*g)`, 'gi'),
      (_match, prefix, qtyValue, suffix) => {
        const n = Number(qtyValue);

        if (!Number.isFinite(n)) return `${prefix}${qtyValue}${suffix}`;

        const capped = Math.min(n, limit.max);

        return `${prefix}${capped}${suffix}`;
      }
    );

    // Limite para unidades: "Ovo de galinha 3 unidades" -> "Ovo de galinha 2 unidades"
    text = text.replace(
      new RegExp(`(${escapedFood}\\s+)(\\d+)(\\s+unidades?)`, 'gi'),
      (_match, prefix, qtyValue, suffix) => {
        const n = Number(qtyValue);

        if (!Number.isFinite(n)) return `${prefix}${qtyValue}${suffix}`;

        const capped = Math.min(n, limit.max);

        return `${prefix}${capped}${suffix}`;
      }
    );

    // Limite para fatias: "Pão integral 3 fatias" -> "Pão integral 2 fatias"
    text = text.replace(
      new RegExp(`(${escapedFood}\\s+)(\\d+)(\\s+fatias?)`, 'gi'),
      (_match, prefix, qtyValue, suffix) => {
        const n = Number(qtyValue);

        if (!Number.isFinite(n)) return `${prefix}${qtyValue}${suffix}`;

        const capped = Math.min(n, limit.max);

        return `${prefix}${capped}${suffix}`;
      }
    );

    // Limite para colheres: "Requeijão light 4 colheres..." -> limite pelo max configurado
    text = text.replace(
      new RegExp(`(${escapedFood}\\s+)(\\d+)(\\s+colheres?[^+\\n]*)`, 'gi'),
      (_match, prefix, qtyValue, suffix) => {
        const n = Number(qtyValue);

        if (!Number.isFinite(n)) return `${prefix}${qtyValue}${suffix}`;

        // Para colher, usar limite visual mais conservador.
        const maxSpoons = foodName === 'Requeijão light' ? 2 : 1;
        const capped = Math.min(n, maxSpoons);

        return `${prefix}${capped}${suffix}`;
      }
    );
  });

  // Higiene textual de plurais errados.
  text = text.replace(/unidadees/gi, 'unidades');
  text = text.replace(/fatiaes/gi, 'fatias');
  text = text.replace(/colher(es)?s/gi, 'colheres');

  return text;
}