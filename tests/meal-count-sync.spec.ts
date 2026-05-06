import { test, expect, Page } from '@playwright/test';

async function expectHealthyScreen(page: Page) {
  await expect(page.locator('body')).not.toContainText(/\bNaN\b/);
  await expect(page.locator('body')).not.toContainText(/\bundefined\b/i);
  await expect(page.locator('body')).not.toContainText(/\bnull\b/i);
}

test.describe('FitCircle - sincronização de refeições', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?e2eDemo=1');

    await expect(
      page.getByText(/olá|refeições|restante|calorias/i).first()
    ).toBeVisible();

    await expectHealthyScreen(page);
  });

  test('mudar quantidade de refeições no perfil atualiza a aba Plano', async ({ page }) => {
    await page.getByTestId('nav-perfil').click();

    const editButton = page.getByRole('button', { name: /editar perfil/i }).first();

    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
    }

    const sixMealsButton = page.getByRole('button', { name: /^6$/ }).first();

    await expect(sixMealsButton).toBeVisible();
    await sixMealsButton.click();

    const saveButton = page.getByRole('button', { name: /salvar|confirmar|atualizar/i }).first();

    if (await saveButton.isVisible().catch(() => false)) {
      await saveButton.click();
    }

    await page.getByTestId('nav-plano').click();

    const bodyText = await page.locator('body').innerText();

    expect(bodyText).toMatch(/Café da manhã/i);
    expect(bodyText).toMatch(/Lanche da manhã/i);
    expect(bodyText).toMatch(/Almoço/i);
    expect(bodyText).toMatch(/Lanche da tarde/i);
    expect(bodyText).toMatch(/Jantar/i);
    expect(bodyText).toMatch(/Ceia/i);

    await expectHealthyScreen(page);
  });
});