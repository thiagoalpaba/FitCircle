import { test, expect, Page } from '@playwright/test';

async function expectNoBrokenText(page: Page) {
  await expect(page.locator('body')).not.toContainText('NaN');
  await expect(page.locator('body')).not.toContainText('undefined');
  await expect(page.locator('body')).not.toContainText('null');
}

async function clickIfVisible(page: Page, name: RegExp) {
  const button = page.getByRole('button', { name }).first();

  if (await button.isVisible().catch(() => false)) {
    await button.click();
    await page.waitForTimeout(300);
    await expectNoBrokenText(page);
    return true;
  }

  return false;
}

test.describe('FitCircle - smoke test geral', () => {
  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();
    await expectNoBrokenText(page);

    // Guarda os erros na própria página para checar depois.
    await page.exposeFunction('__getErrors', () => errors);
  });

  test('abre o app sem quebrar', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    await expectNoBrokenText(page);
  });

  test('fluxo inicial: começar jornada, validação de login e demo', async ({ page }) => {
    await clickIfVisible(page, /começar jornada/i);

  await expect(page.getByRole('heading', { name: /bem-vindo de volta/i })).toBeVisible();
  
    // Testa botão entrar sem preencher.
    await clickIfVisible(page, /^entrar$/i);

    // Deve aparecer alguma mensagem de erro/validação.
    await expect(
      page.getByText(/preencha|senha|e-mail|válido|digite/i).first()
    ).toBeVisible();

    await expectNoBrokenText(page);
  });

  test('botão de criar conta abre tela de cadastro e permite voltar', async ({ page }) => {
    await clickIfVisible(page, /começar jornada/i);
    await clickIfVisible(page, /criar agora/i);

    await expect(page.getByText(/criar|conta|nome|senha/i).first()).toBeVisible();

    // Voltar para login, se existir.
    await clickIfVisible(page, /entrar agora/i);

    await expectNoBrokenText(page);
  });
});