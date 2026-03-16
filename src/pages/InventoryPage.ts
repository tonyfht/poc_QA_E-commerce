import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class InventoryPage extends BasePage {
  private readonly productList: Locator;
  private readonly cartIcon: Locator;
  private readonly cartBadge: Locator;
  private readonly sortDropdown: Locator;
  private readonly burgerMenu: Locator;
  private readonly logoutLink: Locator;

  constructor(page: Page) {
    super(page);
    this.productList = page.locator('.inventory_item');
    this.cartIcon = page.locator('[data-test="shopping-cart-link"]');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.burgerMenu = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.locator('#logout_sidebar_link');
  }

  async isOnInventoryPage(): Promise<boolean> {
    return this.page.url().includes('/inventory.html');
  }

  async getProductCount(): Promise<number> {
    return this.productList.count();
  }

  async getProductNames(): Promise<string[]> {
    return this.productList.locator('.inventory_item_name').allInnerTexts();
  }

  async getProductPrices(): Promise<number[]> {
    const priceTexts = await this.productList
      .locator('.inventory_item_price')
      .allInnerTexts();
    return priceTexts.map((price) => parseFloat(price.replace('$', '')));
  }

  async addProductToCart(productName: string): Promise<void> {
    const product = this.productList.filter({
      hasText: productName,
    });
    await product.locator('button').click();
  }

  async removeProductFromCart(productName: string): Promise<void> {
    const product = this.productList.filter({ hasText: productName });
    await product.locator('button').click();
  }

  async getCartCount(): Promise<number> {
    const isVisible = await this.cartBadge.isVisible();
    if (!isVisible) return 0;
    const text = await this.cartBadge.innerText();
    return parseInt(text, 10);
  }

  async sortBy(
    option: 'az' | 'za' | 'lohi' | 'hilo'
  ): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  async goToCart(): Promise<void> {
    await this.cartIcon.click();
  }

  async logout(): Promise<void> {
    await this.burgerMenu.click();
    await this.logoutLink.click();
  }
}
