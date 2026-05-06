import { test, expect, Page } from '@playwright/test';

async function expectHealthyScreen(page: Page) {
  await expect(page.locator('body')).not.toContainText('NaN');
  await expect(page.locator('body')).not.toContainText('undefined');
  await expect(page.locator('body')).not.toContainText('null');
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

    const lunchIndex = bodyText.toLowerCase().indexOf('almoço');
    const dinnerIndex = bodyText.toLowerCase().indexOf('jantar');

    if (lunchIndex !== -1 && dinnerIndex !== -1) {
      const lunchToDinner = bodyText.slice(lunchIndex, dinnerIndex);
      expect(lunchToDinner).not.toMatch(/whey protein/i);
      expect(lunchToDinner).not.toMatch(/achocolatado/i);
    }

    if (dinnerIndex !== -1) {
      const dinnerSection = bodyText.slice(dinnerIndex);
      expect(dinnerSection).not.toMatch(/whey protein/i);
      expect(dinnerSection).not.toMatch(/achocolatado/i);
    }
  });

  test('não mostra porções absurdas conhecidas', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/Pão integral\s+3\s+fatias/i);
    expect(bodyText).not.toMatch(/Ovo de galinha\s+3\s+unidades/i);
    expect(bodyText).not.toMatch(/Requeijão light\s+4\s+colheres/i);
    expect(bodyText).not.toMatch(/Manteiga\s+4\s+pontas/i);
    expect(bodyText).not.toMatch(/Whey Protein\s+100g/i);
    expect(bodyText).not.toMatch(/Morango\s+33/i);
    expect(bodyText).not.toMatch(/Salada verde\s+\d+g/i);
    expect(bodyText).not.toMatch(/Legumes variados\s+[6-9]\d{2}g/i);
    expect(bodyText).not.toMatch(/Batata inglesa cozida\s+[4-9]\d{2}g/i);
  });

  test('almoço e jantar têm alguma proteína principal real', async ({ page }) => {
    const bodyText = (await page.locator('body').innerText()).toLowerCase();
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

    const lunchIndex = bodyText.indexOf('almoço');
    const dinnerIndex = bodyText.indexOf('jantar');

    if (lunchIndex !== -1 && dinnerIndex !== -1) {
      const lunchSection = bodyText.slice(lunchIndex, dinnerIndex);
      expect(proteins.some((protein) => lunchSection.includes(protein))).toBeTruthy();
    }

    if (dinnerIndex !== -1) {
      const dinnerSection = bodyText.slice(dinnerIndex);
      expect(proteins.some((protein) => dinnerSection.includes(protein))).toBeTruthy();
    }
  });
});

