import { authenticatedTest as test, expect } from '../src/fixtures';

test.describe('Inventory / Product Catalog', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await expect(inventoryPage.page).toHaveURL(/inventory\.html/);
  });

  test('should display 6 products', async ({ inventoryPage }) => {
    const count = await inventoryPage.getProductCount();
    expect(count).toBe(6);
  });

  test('should add a product to cart', async ({ inventoryPage }) => {
    await inventoryPage.addProductToCart('Sauce Labs Backpack');

    const cartCount = await inventoryPage.getCartCount();
    expect(cartCount).toBe(1);
  });

  test('should add multiple products to cart', async ({ inventoryPage }) => {
    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.addProductToCart('Sauce Labs Bike Light');

    const cartCount = await inventoryPage.getCartCount();
    expect(cartCount).toBe(2);
  });

  test('should remove a product from cart', async ({ inventoryPage }) => {
    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.removeProductFromCart('Sauce Labs Backpack');

    const cartCount = await inventoryPage.getCartCount();
    expect(cartCount).toBe(0);
  });

  test('should sort products by price low to high', async ({
    inventoryPage,
  }) => {
    await inventoryPage.sortBy('lohi');
    const prices = await inventoryPage.getProductPrices();

    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  test('should sort products by price high to low', async ({
    inventoryPage,
  }) => {
    await inventoryPage.sortBy('hilo');
    const prices = await inventoryPage.getProductPrices();

    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });

  test('should sort products by name A to Z', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('az');
    const names = await inventoryPage.getProductNames();
    const sorted = [...names].sort();

    expect(names).toEqual(sorted);
  });
});
