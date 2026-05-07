import { test, expect, Page } from '@playwright/test';

async function expectHealthyScreen(page: Page) {
  await expect(page.locator('body')).not.toContainText(/\bNaN\b/);
  await expect(page.locator('body')).not.toContainText(/\bundefined\b/i);
  await expect(page.locator('body')).not.toContainText(/\bnull\b/i);
}

function getMealSection(bodyText: string, mealName: string) {
  const mealHeadings = [
    'Café da manhã',
    'Lanche da manhã',
    'Almoço',
    'Lanche da tarde',
    'Jantar',
    'Ceia',
  ];

  const start = bodyText.indexOf(mealName);

  if (start === -1) return '';

  const possibleEnds = mealHeadings
    .filter((heading) => heading !== mealName)
    .map((heading) => bodyText.indexOf(heading, start + mealName.length))
    .filter((index) => index > start);

  const end = possibleEnds.length > 0 ? Math.min(...possibleEnds) : bodyText.length;

  return bodyText.slice(start, end);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

test.describe('FitCircle - qualidade do plano alimentar', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (error) => {
      throw error;
    });

    await page.goto('/?e2eDemo=1');

    await expect(
      page.getByText(/olá|refeições|restante|calorias/i).first()
    ).toBeVisible();

    await page.getByTestId('nav-plano').click();

    await expect(
      page.getByText(/plano alimentar|meu plano|café da manhã|almoço|jantar/i).first()
    ).toBeVisible();

    await expectHealthyScreen(page);
  });

  test('não mostra remendos genéricos de proteína', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('Proteína Principal (Frango/Carne)');
    await expect(page.locator('body')).not.toContainText('Refeição Proteica Balanceada');
    await expect(page.locator('body')).not.toContainText('Pouca Prot.');
    await expect(page.locator('body')).not.toContainText('Poca Prot.');
  });

  test('não mostra whey em almoço ou jantar', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();

    const lunchSection = getMealSection(bodyText, 'Almoço');
    const dinnerSection = getMealSection(bodyText, 'Jantar');

    expect(lunchSection).not.toMatch(/whey protein/i);
    expect(lunchSection).not.toMatch(/achocolatado/i);

    expect(dinnerSection).not.toMatch(/whey protein/i);
    expect(dinnerSection).not.toMatch(/achocolatado/i);
  });

  test('não mostra porções absurdas conhecidas', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();

    expect(bodyText).not.toMatch(/Pão integral\s+3\s+fatias/i);
    expect(bodyText).not.toMatch(/Ovo de galinha\s+4\s+unidades/i);
    expect(bodyText).not.toMatch(/Requeijão light\s+4\s+colheres/i);
    expect(bodyText).not.toMatch(/Manteiga\s+4\s+pontas/i);
    expect(bodyText).not.toMatch(/Whey Protein\s+100g/i);
    expect(bodyText).not.toMatch(/Morango\s+33/i);
    expect(bodyText).not.toMatch(/Salada verde\s+\d+g/i);
    expect(bodyText).not.toMatch(/Legumes variados\s+[6-9]\d{2}g/i);
    expect(bodyText).not.toMatch(/Batata inglesa cozida\s+[4-9]\d{2}g/i);
    expect(bodyText).not.toMatch(/Manteiga\s+(1[1-9]|[2-9]\d|\d{3,})g/i);
    expect(bodyText).not.toMatch(/Requeijão light\s+(3[1-9]|[4-9]\d|\d{3,})g/i);
    expect(bodyText).not.toMatch(/Whey Protein\s+(4[1-9]|[5-9]\d|\d{3,})g/i);
  });

  test('café da manhã não sugere frango por padrão nem manteiga exagerada', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();

    const breakfastSection = getMealSection(bodyText, 'Café da manhã');

    expect(breakfastSection).toMatch(/Café da manhã/i);

    expect(breakfastSection).not.toMatch(/Peito de Frango/i);
    expect(breakfastSection).not.toMatch(/frango desfiado/i);
    expect(breakfastSection).not.toMatch(/Manteiga\s+(1[1-9]|[2-9]\d|\d{3,})g/i);
  });

  test('almoço e jantar têm alguma proteína principal real', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();

    const proteins = [
      'frango',
      'patinho',
      'tilápia',
      'atum',
      'carne',
      'ovo',
      'tofu',
      'lentilha',
      'grão-de-bico',
      'proteína de soja',
    ];

    const lunchSection = normalize(getMealSection(bodyText, 'Almoço'));
    const dinnerSection = normalize(getMealSection(bodyText, 'Jantar'));

    expect(proteins.some((protein) => lunchSection.includes(normalize(protein)))).toBeTruthy();
    expect(proteins.some((protein) => dinnerSection.includes(normalize(protein)))).toBeTruthy();
  });

  test('almoço e jantar não exibem salada com gramatura absurda', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();

    const lunchSection = getMealSection(bodyText, 'Almoço');
    const dinnerSection = getMealSection(bodyText, 'Jantar');

    expect(lunchSection).not.toMatch(/Salada verde\s+\d+g/i);
    expect(dinnerSection).not.toMatch(/Salada verde\s+\d+g/i);

    expect(lunchSection).not.toMatch(/Legumes variados\s+[6-9]\d{2}g/i);
    expect(dinnerSection).not.toMatch(/Legumes variados\s+[6-9]\d{2}g/i);
  });

  test('badges do plano fazem sentido básico', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();

    expect(bodyText).not.toMatch(/Poca Prot\./i);
    expect(bodyText).not.toMatch(/Pouca Prot\./i);
    expect(bodyText).not.toMatch(/Menos proteína/i);

    const lines = bodyText.split('\n').map(line => line.trim()).filter(Boolean);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (/leve/i.test(line)) {
        const nearby = lines.slice(i, i + 8).join(' ');
        expect(nearby).not.toMatch(/[6-9]\d{2}\s*CALORIAS/i);
      }
    }
  });

  test('não mostra títulos duplicados na mesma refeição', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();

    const mealHeadings = [
      'Café da manhã',
      'Lanche da manhã',
      'Almoço',
      'Lanche da tarde',
      'Jantar',
      'Ceia',
    ];

    const ignoredUppercaseLines = [
      'OPÇÕES GERADAS',
      'RECOMENDADA',
      'COMPLETA',
      'SIMPLES',
      'LEVE',
      'CALORIAS',
      'SUGESTÃO ALTERNATIVA',
      'DICA DE SUCESSO',
      'MEUS OBJETIVOS',
      'PLANO ALIMENTAR',
      'AJUSTAR',
      'HOJE',
      'PLANO',
      'CÍRCULO',
      'PERFIL',
      'TROCAR OPÇÃO',
    ];

    for (const meal of mealHeadings) {
      const section = getMealSection(bodyText, meal);
      if (!section) continue;

      const optionTitles = section
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => {
          const upper = line.toUpperCase();

          if (upper !== line) return false;
          if (/^\d+$/.test(line)) return false;

          return !ignoredUppercaseLines.some((ignored) => upper.includes(ignored));
        });

      const normalized = optionTitles.map((title) =>
        normalize(title)
      );

      const unique = new Set(normalized);

      expect(unique.size).toBe(normalized.length);
    }
  });
});