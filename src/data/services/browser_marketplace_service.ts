// src/data/services/browser_marketplace_service.ts

import { Listing } from "../../domain/entities/listing";
import { FetchProgress } from "../../domain/types/progress";
import { SearchOptions } from "../../domain/repositories/marketplace_repo";

export interface FetchOptions {
  onProgress?: (progress: FetchProgress) => void;
  signal?: AbortSignal;
}

/**
 * Service class that implements browser-specific marketplace operations.
 * Provides methods to extract listings from marketplace pages.
 * All methods here must be run in the content script to work properly.
 */
export class BrowserMarketplaceService {
  /**
   * Detects the current marketplace and extracts listings from the page.
   */
  static async extractListingsFromPage(
    options: FetchOptions = {},
  ): Promise<Listing[]> {
    const { onProgress } = options;

    // Detect marketplace
    const marketplace = this._detectMarketplace();
    console.log("[MarketplaceService] Detected marketplace:", marketplace);
    
    if (!marketplace) {
      console.warn("[MarketplaceService] No marketplace detected, trying generic extraction");
    }

    // Extract listings based on marketplace
    const listings: Listing[] = [];
    
    try {
      switch (marketplace) {
        case "facebook":
          listings.push(...this._extractFacebookListings());
          break;
        case "craigslist":
          listings.push(...this._extractCraigslistListings());
          break;
        case "ebay":
          listings.push(...this._extractEbayListings());
          break;
        default:
          // Generic extraction attempt
          listings.push(...this._extractGenericListings());
      }

      // If no listings found with specific method, try generic as fallback
      if (listings.length === 0 && marketplace) {
        console.log("[MarketplaceService] No listings found with specific method, trying generic extraction");
        listings.push(...this._extractGenericListings());
      }

      console.log(`[MarketplaceService] Extracted ${listings.length} listings`);

      if (onProgress) {
        onProgress({
          currentPage: 1,
          totalPages: 1,
          processedEmails: listings.length,
          totalEmails: listings.length,
          percentage: 100,
        });
      }

      return listings;
    } catch (error) {
      console.error("Error extracting listings:", error);
      throw error;
    }
  }

  /**
   * Searches for listings on the current marketplace page.
   */
  static async searchListings(
    query: string,
    _options?: SearchOptions,
  ): Promise<Listing[]> {
    const marketplace = this._detectMarketplace();
    if (!marketplace) {
      throw new Error("Not on a supported marketplace page");
    }

    // Perform search based on marketplace
    await this._performSearch(query, marketplace);

    // Wait for results to load
    await this._waitForResults();

    // Extract listings
    return await this.extractListingsFromPage();
  }

  private static _detectMarketplace(): string | null {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes("facebook.com") && window.location.pathname.includes("/marketplace")) {
      return "facebook";
    }
    if (hostname.includes("craigslist.org")) {
      return "craigslist";
    }
    if (hostname.includes("ebay.com") || hostname.includes("ebay.co.uk") || hostname.includes("ebay.ca")) {
      return "ebay";
    }
    if (hostname.includes("etsy.com")) {
      return "etsy";
    }
    if (hostname.includes("gumtree.com")) {
      return "gumtree";
    }
    if (hostname.includes("olx.")) {
      return "olx";
    }
    
    return null;
  }

  private static _extractFacebookListings(): Listing[] {
    const listings: Listing[] = [];
    // Try multiple Facebook Marketplace selectors
    const selectors = [
      '[data-testid="marketplace-search-result"]',
      '[href*="/marketplace/item/"]',
      'a[href*="/marketplace/item/"]',
      '[role="article"] a[href*="/marketplace"]',
    ];

    let items: NodeListOf<Element> | null = null;
    for (const selector of selectors) {
      items = document.querySelectorAll(selector);
      if (items.length > 0) {
        console.log(`[MarketplaceService] Found ${items.length} items with selector: ${selector}`);
        break;
      }
    }

    if (!items || items.length === 0) {
      console.log("[MarketplaceService] No Facebook listings found with any selector");
      return listings;
    }
    
    items.forEach((item, index) => {
      // Try multiple title selectors
      const titleEl = item.querySelector('span[dir="auto"]') || 
                     item.querySelector('[class*="title"]') ||
                     item.querySelector('h2, h3') ||
                     item.querySelector('span[class*="text"]');
      
      // Try multiple price selectors
      const priceEl = item.querySelector('[class*="price"]') ||
                     item.querySelector('[class*="Price"]') ||
                     item.querySelector('[class*="cost"], [class*="Cost"]');
      
      // Also try to find price in text content
      let priceText = priceEl?.textContent?.trim();
      if (!priceText) {
        const text = item.textContent || '';
        const priceMatch = text.match(/[\$€£]\s*\d+[\d,.]*/);
        if (priceMatch) {
          priceText = priceMatch[0];
        }
      }
      
      // Find link
      const linkEl = item.closest('a') || item.querySelector('a[href*="/marketplace"]');
      
      // Find image
      const imgEl = item.querySelector('img');
      
      const title = titleEl?.textContent?.trim() || 
                   (linkEl as HTMLElement)?.textContent?.trim() ||
                   "No title";
      
      if (title && title !== "No title" && linkEl) {
        listings.push({
          id: `fb_${index}_${Date.now()}`,
          title,
          price: priceText || "Price not available",
          url: (linkEl as HTMLAnchorElement).href || window.location.href,
          imageUrl: imgEl ? (imgEl as HTMLImageElement).src : undefined,
          marketplace: "Facebook Marketplace",
        });
      }
    });

    return listings;
  }

  private static _extractCraigslistListings(): Listing[] {
    const listings: Listing[] = [];
    const items = document.querySelectorAll('.result-row, .result-info');
    
    items.forEach((item, index) => {
      const titleEl = item.querySelector('.result-title, a.result-title');
      const priceEl = item.querySelector('.result-price');
      const linkEl = item.querySelector('a');
      
      if (titleEl) {
        listings.push({
          id: `cl_${index}_${Date.now()}`,
          title: titleEl.textContent?.trim() || "No title",
          price: priceEl?.textContent?.trim() || "Price not available",
          url: linkEl ? (linkEl as HTMLAnchorElement).href : window.location.href,
          marketplace: "Craigslist",
        });
      }
    });

    return listings;
  }

  private static _extractEbayListings(): Listing[] {
    const listings: Listing[] = [];
    const items = document.querySelectorAll('.s-item, [class*="srp-results"] .s-item');
    
    items.forEach((item, index) => {
      const titleEl = item.querySelector('.s-item__title, .s-item__link');
      const priceEl = item.querySelector('.s-item__price');
      const linkEl = item.querySelector('a');
      const imgEl = item.querySelector('img');
      
      if (titleEl) {
        listings.push({
          id: `ebay_${index}_${Date.now()}`,
          title: titleEl.textContent?.trim() || "No title",
          price: priceEl?.textContent?.trim() || "Price not available",
          url: linkEl ? (linkEl as HTMLAnchorElement).href : window.location.href,
          imageUrl: imgEl ? (imgEl as HTMLImageElement).src : undefined,
          marketplace: "eBay",
        });
      }
    });

    return listings;
  }

  private static _extractGenericListings(): Listing[] {
    const listings: Listing[] = [];
    // Generic extraction - try multiple strategies
    const strategies = [
      // Strategy 1: Common listing containers
      () => document.querySelectorAll('article, [class*="item"], [class*="listing"], [class*="product"], [class*="card"]'),
      // Strategy 2: Links that might be listings
      () => document.querySelectorAll('a[href*="/item"], a[href*="/product"], a[href*="/listing"]'),
      // Strategy 3: Grid items
      () => document.querySelectorAll('[class*="grid"] > *, [class*="Grid"] > *'),
      // Strategy 4: Any anchor with image and text
      () => {
        const links = document.querySelectorAll('a');
        return Array.from(links).filter(link => {
          const hasImg = link.querySelector('img');
          const hasText = link.textContent?.trim() && link.textContent.trim().length > 10;
          return hasImg && hasText;
        });
      },
    ];

    let allItems: Element[] = [];
    for (const strategy of strategies) {
      try {
        const items = strategy();
        const itemArray = items instanceof NodeList ? Array.from(items) : items;
        if (itemArray.length > 0) {
          console.log(`[MarketplaceService] Generic extraction found ${itemArray.length} potential items`);
          allItems = itemArray;
          break;
        }
      } catch (e) {
        console.warn("[MarketplaceService] Strategy failed:", e);
      }
    }

    // Limit to reasonable number to avoid performance issues
    const maxItems = Math.min(allItems.length, 50);
    
    allItems.slice(0, maxItems).forEach((item, index) => {
      // Try multiple title selectors
      const titleEl = item.querySelector('h1, h2, h3, h4') ||
                     item.querySelector('[class*="title"], [class*="Title"]') ||
                     item.querySelector('[class*="name"], [class*="Name"]') ||
                     (item.tagName === 'A' ? item : null);
      
      // Try multiple price selectors
      const priceEl = item.querySelector('[class*="price"], [class*="Price"]') ||
                     item.querySelector('[class*="cost"], [class*="Cost"]');
      
      // Also try to find price in text content
      let priceText = priceEl?.textContent?.trim();
      if (!priceText) {
        const text = item.textContent || '';
        const priceMatch = text.match(/[\$€£]\s*\d+[\d,.]*/);
        if (priceMatch) {
          priceText = priceMatch[0];
        }
      }
      
      // Find link
      const linkEl = item.tagName === 'A' ? item : item.querySelector('a');
      
      // Find image
      const imgEl = item.querySelector('img');
      
      const title = titleEl?.textContent?.trim() || 
                   (item as HTMLElement)?.textContent?.trim() ||
                   "No title";
      
      // Filter out items that are clearly not listings
      if (title && 
          title !== "No title" && 
          title.length > 5 && 
          title.length < 200 &&
          !title.includes("Sign in") &&
          !title.includes("Create account") &&
          !title.includes("Cookie")) {
        listings.push({
          id: `generic_${index}_${Date.now()}`,
          title,
          price: priceEl?.textContent?.trim() || "Price not available",
          url: linkEl ? (linkEl as HTMLAnchorElement).href : window.location.href,
          imageUrl: imgEl ? (imgEl as HTMLImageElement).src : undefined,
          marketplace: this._detectMarketplace() || "Unknown",
        });
      }
    });

    console.log(`[MarketplaceService] Generic extraction returned ${listings.length} listings`);
    return listings;
  }

  private static async _performSearch(query: string, _marketplace: string): Promise<void> {
    // This would need to be implemented per marketplace
    // For now, we'll try to find and fill search inputs
    const searchInput = document.querySelector<HTMLInputElement>(
      'input[type="search"], input[name*="search"], input[placeholder*="search" i], input[aria-label*="search" i]'
    );
    
    if (searchInput) {
      searchInput.value = query;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Try to submit the form
      const form = searchInput.closest('form');
      if (form) {
        const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"], input[type="submit"]');
        if (submitButton) {
          submitButton.click();
        } else {
          searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        }
      }
    }
  }

  private static async _waitForResults(timeout = 5000): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        // Check if results have loaded (this is marketplace-specific)
        const hasResults = document.querySelectorAll('[class*="result"], [class*="item"], [class*="listing"]').length > 0;
        
        if (hasResults || Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 200);
    });
  }
}

