import { test, expect, Page } from '@playwright/test';

async function expectHealthyScreen(page: Page) {
  await expect(page.locator('body')).not.toContainText('NaN');
  await expect(page.locator('body')).not.toContainText('undefined');
  await expect(page.locator('body')).not.toContainText('null');
}

test.describe('FitCircle - botões principais em modo demo', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (error) => {
      throw error;
    });

    await page.goto('/?e2eDemo=1');

    await expect(
      page.getByText(/olá|refeições|restante|calorias/i).first()
    ).toBeVisible();

    await expectHealthyScreen(page);
  });

  test('abas principais funcionam', async ({ page }) => {
    await page.getByTestId('nav-hoje').click();
    await expect(page.getByText(/refeições|restante|calorias/i).first()).toBeVisible();
    await expectHealthyScreen(page);

    await page.getByTestId('nav-plano').click();
    await expect(page.getByText(/plano alimentar/i).first()).toBeVisible();
    await expectHealthyScreen(page);

    await page.getByTestId('nav-circulo').click();
    await expect(page.getByText(/círculo|membros|apoio/i).first()).toBeVisible();
    await expectHealthyScreen(page);

    await page.getByTestId('nav-perfil').click();
    await expect(page.getByText(/editar perfil|peso atual|imc|meta de calorias/i).first()).toBeVisible();
    await expectHealthyScreen(page);
  });

  test('botão central abre opções de refeição e treino', async ({ page }) => {
    await page.getByTestId('nav-add').click();

    await expect(page.getByTestId('quick-add-meal')).toBeVisible();
    await expect(page.getByTestId('quick-add-workout')).toBeVisible();

    await expectHealthyScreen(page);
  });

  test('registrar treino abre modal e salva treino', async ({ page }) => {
    await page.getByTestId('nav-add').click();
    await page.getByTestId('quick-add-workout').click();

    await expect(
      page.getByText(/registrar treino|novo exercício|novo exercicio|salvar treino/i).first()
    ).toBeVisible();

    await page.getByTestId('save-workout').click();

    await expectHealthyScreen(page);
  });

  test('registrar refeição abre lista de refeições', async ({ page }) => {
    await page.getByTestId('nav-add').click();
    await page.getByTestId('quick-add-meal').click();

    await expect(
      page.getByText(/café da manhã|almoço|jantar|lanche/i).first()
    ).toBeVisible();

    await expectHealthyScreen(page);
  });
});