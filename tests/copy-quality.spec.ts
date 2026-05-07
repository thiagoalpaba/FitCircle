import { test, expect, Page } from '@playwright/test';

async function expectHealthyScreen(page: Page) {
await expect(page.locator('body')).not.toContainText(/\bNaN\b/);
  await expect(page.locator('body')).not.toContainText('undefined');
  await expect(page.locator('body')).not.toContainText('null');
}

test.describe('FitCircle - qualidade textual', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?e2eDemo=1');
    await expect(page.getByText(/olá|refeições|restante|calorias/i).first()).toBeVisible();
    await expectHealthyScreen(page);
  });

  test('não mostra erros comuns de português ou digitação', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();

    const forbiddenPatterns = [
      /unidadees/i,
      /fatiaes/i,
      /colhereses/i,
      /Poca Prot\.?/i,
      /Pouca Prot\.?/i,
      /musculacao/i,
      /hidroginastica/i,
      /Cafe da manha/i,
      /cafe da manhã/i,
      /refeicao/i,
      /proteina principal \(frango\/carne\)/i,
      /caloria\s*$/i,
    ];

    for (const pattern of forbiddenPatterns) {
      expect(bodyText).not.toMatch(pattern);
    }
  });

  test('abas principais não exibem texto quebrado', async ({ page }) => {
    const tabs = ['nav-hoje', 'nav-plano', 'nav-circulo', 'nav-perfil'];

    for (const tab of tabs) {
      await page.getByTestId(tab).click();
      await page.waitForTimeout(300);

      const bodyText = await page.locator('body').innerText();

      expect(bodyText).not.toMatch(/\bNaN\b/);
      expect(bodyText).not.toMatch(/undefined/i);
      expect(bodyText).not.toMatch(/null/i);
      expect(bodyText).not.toMatch(/unidadees/i);
      expect(bodyText).not.toMatch(/Poca Prot/i);
      expect(bodyText).not.toMatch(/Pouca Prot/i);
    }
  });

  test('treinos aparecem com acento e nomes amigáveis', async ({ page }) => {
    await page.getByTestId('nav-add').click();
    await page.getByTestId('quick-add-workout').click();

    const bodyText = await page.locator('body').innerText();

    expect(bodyText).toMatch(/Musculação/i);
    expect(bodyText).toMatch(/Hidroginástica/i);
    expect(bodyText).toMatch(/Pilates/i);
    expect(bodyText).toMatch(/Yoga/i);
    expect(bodyText).toMatch(/Outro treino/i);
    expect(bodyText).not.toMatch(/musculacao/i);
    expect(bodyText).not.toMatch(/hidroginastica/i);
  });
  test('home mostra resumo simples sem saldo líquido ou bruto', async ({ page }) => {
  await page.getByTestId('nav-hoje').click();

  const bodyText = await page.locator('body').innerText();

  expect(bodyText).toMatch(/\bMETA\b/i);
  expect(bodyText).toMatch(/\bCONSUMIDO\b/i);
  expect(bodyText).toMatch(/\bTREINO\b/i);

  expect(bodyText).not.toMatch(/\bBRUTO\b/i);
  expect(bodyText).not.toMatch(/\bSALDO\b/i);
  expect(bodyText).not.toMatch(/SALDO LÍQUIDO/i);
});
});