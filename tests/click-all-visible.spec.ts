import { test, expect, Page } from '@playwright/test';

async function expectHealthyScreen(page: Page) {
  await expect(page.locator('body')).not.toContainText('NaN');
  await expect(page.locator('body')).not.toContainText('undefined');
  await expect(page.locator('body')).not.toContainText('null');
}

test.describe('FitCircle - botões críticos', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (error) => {
      throw error;
    });

    await page.goto('/?e2eDemo=1');
    await expect(page.getByText(/olá|refeições|restante|calorias/i).first()).toBeVisible();
    await expectHealthyScreen(page);
  });

  test('botões da navegação inferior funcionam', async ({ page }) => {
    await page.getByTestId('nav-hoje').click();
    await expect(page.getByText(/refeições/i).first()).toBeVisible();
    await expectHealthyScreen(page);

    await page.getByTestId('nav-plano').click();
    await expect(page.getByText(/plano alimentar/i).first()).toBeVisible();
    await expectHealthyScreen(page);

    await page.getByTestId('nav-circulo').click();
    await expect(page.getByText(/círculo|apoio|membros/i).first()).toBeVisible();
    await expectHealthyScreen(page);

    await page.getByTestId('nav-perfil').click();
    await expect(page.getByText(/perfil|editar perfil|peso atual|imc/i).first()).toBeVisible();
    await expectHealthyScreen(page);
  });

  test('botão central abre registrar refeição', async ({ page }) => {
    await page.getByTestId('nav-add').click();
    await expect(page.getByTestId('quick-add-meal')).toBeVisible();

    await page.getByTestId('quick-add-meal').click();

    await expect(
      page.getByText(/café da manhã|almoço|jantar|lanche/i).first()
    ).toBeVisible();

    await expectHealthyScreen(page);
  });

  test('botão central abre registrar treino', async ({ page }) => {
    await page.getByTestId('nav-add').click();
    await expect(page.getByTestId('quick-add-workout')).toBeVisible();

    await page.getByTestId('quick-add-workout').click();

    await expect(
      page.getByText(/novo exercício|registrar treino|salvar treino/i).first()
    ).toBeVisible();

    await expectHealthyScreen(page);
  });

  test('plano abre ajuste sem quebrar', async ({ page }) => {
    await page.getByTestId('nav-plano').click();

    await page.getByRole('button', { name: /ajustar/i }).click();

    await expect(
      page.getByText(/ajustar plano|perfil alimentar|não quero no plano|favoritos/i).first()
    ).toBeVisible();

    await expectHealthyScreen(page);
  });

  test('perfil abre edição sem quebrar', async ({ page }) => {
    await page.getByTestId('nav-perfil').click();

    const editButton = page.getByRole('button', { name: /editar perfil/i }).first();

    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();

      await expect(
        page.getByText(/editar perfil|nome|peso|altura|foto/i).first()
      ).toBeVisible();

      await expectHealthyScreen(page);
    }
  });
});