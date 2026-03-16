import { test, expect } from '../src/fixtures';
import { users } from '../src/data/users';

test.describe('Authentication', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should login successfully with valid credentials', async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.login(users.standard.username, users.standard.password);

    await expect(inventoryPage.page).toHaveURL(/inventory\.html/);
  });

  test('should show error for locked out user', async ({ loginPage }) => {
    await loginPage.login(users.locked.username, users.locked.password);

    expect(await loginPage.isErrorVisible()).toBe(true);
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('locked out');
  });

  test('should show error with invalid credentials', async ({ loginPage }) => {
    await loginPage.login('invalid_user', 'wrong_password');

    expect(await loginPage.isErrorVisible()).toBe(true);
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Username and password do not match');
  });

  test('should show error with empty credentials', async ({ loginPage }) => {
    await loginPage.login('', '');

    expect(await loginPage.isErrorVisible()).toBe(true);
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Username is required');
  });

  test('should logout successfully', async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.login(users.standard.username, users.standard.password);
    await inventoryPage.logout();

    await expect(loginPage.page).toHaveURL('/');
  });
});
