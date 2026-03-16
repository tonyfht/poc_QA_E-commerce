import { authenticatedTest as test, expect } from '../src/fixtures';
import { checkoutData } from '../src/data/users';

test.describe('Shopping Cart & Checkout Flow', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await expect(inventoryPage.page).toHaveURL(/inventory\.html/);
    // Add products before each test
    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.addProductToCart('Sauce Labs Bike Light');
  });

  test('should show correct items in cart', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.goToCart();

    const itemCount = await cartPage.getItemCount();
    expect(itemCount).toBe(2);

    const names = await cartPage.getItemNames();
    expect(names).toContain('Sauce Labs Backpack');
    expect(names).toContain('Sauce Labs Bike Light');
  });

  test('should remove item from cart', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.goToCart();
    await cartPage.removeItem('Sauce Labs Backpack');

    const itemCount = await cartPage.getItemCount();
    expect(itemCount).toBe(1);
  });

  test('should complete full checkout flow', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.goToCart();
    await cartPage.checkout();

    // Step 1: Fill checkout info
    await expect(inventoryPage.page).toHaveURL(/checkout-step-one/);
    await checkoutPage.fillCheckoutInfo(checkoutData.valid);
    await checkoutPage.continue();

    // Step 2: Review order
    await expect(inventoryPage.page).toHaveURL(/checkout-step-two/);
    const total = await checkoutPage.getTotal();
    expect(total).toContain('Total:');

    // Step 3: Confirm order
    await checkoutPage.finish();
    await expect(inventoryPage.page).toHaveURL(/checkout-complete/);

    const confirmation = await checkoutPage.getConfirmationMessage();
    expect(confirmation).toBe('Thank you for your order!');
  });

  test('should navigate back to inventory from cart', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.goToCart();
    await cartPage.continueShopping();

    await expect(inventoryPage.page).toHaveURL(/inventory\.html/);
  });
});
