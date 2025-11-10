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
    const { onProgress, signal } = options;

    // Detect marketplace
    const marketplace = this._detectMarketplace();
    console.log("[MarketplaceService] Detected marketplace:", marketplace);
    
    if (!marketplace) {
      console.warn("[MarketplaceService] No marketplace detected, trying generic extraction");
    }

    // Wait for listings to load
    await this._waitForListingsToLoad(marketplace, signal);

    // Extract listings based on marketplace
    const listings: Listing[] = [];
    
    try {
      switch (marketplace) {
        case "facebook":
          listings.push(...await this._extractFacebookListings(options));
          break;
        case "craigslist":
          listings.push(...await this._extractCraigslistListings(options));
          break;
        case "ebay":
          listings.push(...await this._extractEbayListings(options));
          break;
        default:
          // Generic extraction attempt
          listings.push(...await this._extractGenericListings(options));
      }

      // If no listings found with specific method, try generic as fallback
      if (listings.length === 0 && marketplace) {
        console.log("[MarketplaceService] No listings found with specific method, trying generic extraction");
        listings.push(...await this._extractGenericListings(options));
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

  private static async _extractFacebookListings(options: FetchOptions = {}): Promise<Listing[]> {
    const listings: Listing[] = [];
    const { signal } = options;
    const seenUrls = new Set<string>();

    // Facebook Marketplace uses links with /marketplace/item/ in the href
    // These links are usually inside containers that have the listing info
    const listingLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(
      'a[href*="/marketplace/item/"]'
    )).filter(link => {
      const href = link.href;
      // Filter out duplicate URLs and non-item URLs
      if (seenUrls.has(href) || !href.includes('/marketplace/item/')) {
        return false;
      }
      seenUrls.add(href);
      return true;
    });

    console.log(`[MarketplaceService] Found ${listingLinks.length} Facebook Marketplace links`);

    if (listingLinks.length === 0) {
      console.log("[MarketplaceService] No Facebook listings found");
      return listings;
    }

    // Extract data from each listing
    listingLinks.forEach((link, index) => {
      if (signal?.aborted) return;

      // Find the container that holds this listing's information
      // Facebook listings are usually in a parent container with the image, title, price, etc.
      let container: Element | null = link;
      let attempts = 0;
      const maxAttempts = 10; // Look further up the tree
      
      while (container && attempts < maxAttempts) {
        container = container.parentElement;
        attempts++;
        if (!container) break;
        
        // Look for containers that have both image and text content
        const hasImage = container.querySelector('img');
        const hasText = container.textContent?.trim() && container.textContent.trim().length > 10;
        
        // Also check for common Facebook Marketplace container patterns
        const hasMarketplaceStructure = 
          container.querySelector('a[href*="/marketplace/item/"]') ||
          container.querySelector('span[dir="auto"]') ||
          container.getAttribute('role') === 'article';
        
        if ((hasImage && hasText) || (hasMarketplaceStructure && hasText)) break;
      }

      const item = container || link;

      // Extract title - try multiple strategies
      let title = "No title";
      
      // Strategy 1: Check link's aria-label or title attribute
      const ariaLabel = link.getAttribute('aria-label') || link.getAttribute('title');
      if (ariaLabel && ariaLabel.length > 5 && !ariaLabel.match(/^[$€£¥]\s*\d+/)) {
        title = ariaLabel.trim();
      }
      
      // Strategy 2: Look for spans with dir="auto" that are NOT prices
      if (title === "No title") {
        const titleSpans = Array.from(item.querySelectorAll('span[dir="auto"]'))
          .map(span => span.textContent?.trim())
          .filter(text => {
            if (!text || text.length < 5 || text.length > 200) return false;
            // Exclude prices
            if (/^[$€£¥]\s*\d+/.test(text)) return false;
            // Exclude common UI text
            if (/^(Free|Sold|Pending|Share|Save|Report|Facebook Marketplace)$/i.test(text)) return false;
            // Exclude social metrics
            if (/^\d+[km]?\s*(likes?|comments?|shares?)$/i.test(text)) return false;
            // Exclude location-only text (usually short)
            if (text.length < 10 && /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(text)) return false;
            return true;
          });
        
        // Prefer longer text as it's more likely to be a title
        title = titleSpans.sort((a, b) => (b?.length || 0) - (a?.length || 0))[0] || titleSpans[0] || title;
      }
      
      // Strategy 3: Look for headings (h1-h4)
      if (title === "No title") {
        const heading = item.querySelector('h1, h2, h3, h4');
        if (heading) {
          const headingText = heading.textContent?.trim();
          if (headingText && headingText.length > 5 && !headingText.match(/^[$€£¥]\s*\d+/)) {
            title = headingText;
          }
        }
      }
      
      // Strategy 4: Use link text if it's meaningful
      if (title === "No title") {
        const linkText = link.textContent?.trim();
        if (linkText && linkText.length > 5 && !linkText.match(/^[$€£¥]\s*\d+/) && linkText !== "Facebook Marketplace") {
          title = linkText;
        }
      }
      
      // Strategy 5: Look for divs with role="heading" or aria-label
      if (title === "No title") {
        const headingDiv = item.querySelector('[role="heading"], [aria-label]');
        if (headingDiv) {
          const headingText = headingDiv.getAttribute('aria-label') || headingDiv.textContent?.trim();
          if (headingText && headingText.length > 5 && !headingText.match(/^[$€£¥]\s*\d+/)) {
            title = headingText;
          }
        }
      }
      
      // Strategy 6: Analyze all text content and find the longest non-price, non-UI text
      if (title === "No title") {
        const allTextElements = Array.from(item.querySelectorAll('span, div, p, h1, h2, h3, h4'))
          .map(el => el.textContent?.trim())
          .filter(text => {
            if (!text || text.length < 5) return false;
            // Exclude prices
            if (/^[$€£¥]\s*\d+/.test(text)) return false;
            // Exclude common UI text
            if (/^(Free|Sold|Pending|Share|Save|Report|Facebook Marketplace|Marketplace)$/i.test(text)) return false;
            // Exclude social metrics
            if (/^\d+[km]?\s*(likes?|comments?|shares?)$/i.test(text)) return false;
            // Exclude very short location names
            if (text.length < 10 && /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(text)) return false;
            // Exclude dates
            if (/\d+\s*(hours?|days?|weeks?|months?)\s*ago/i.test(text)) return false;
            return true;
          });
        
        // Sort by length and take the longest (most likely to be title)
        const sortedTexts = allTextElements.sort((a, b) => (b?.length || 0) - (a?.length || 0));
        if (sortedTexts.length > 0 && sortedTexts[0] && sortedTexts[0].length > 5) {
          title = sortedTexts[0];
        }
      }
      
      // Strategy 7: Extract from link's closest text sibling or parent text
      if (title === "No title") {
        // Try to find text that's a sibling or in a nearby container
        let current: Element | null = link.parentElement;
        let depth = 0;
        while (current && depth < 3) {
          const siblings = Array.from(current.children)
            .filter(child => child !== link && child !== link.parentElement)
            .map(child => child.textContent?.trim())
            .filter(text => text && text.length > 5 && !text.match(/^[$€£¥]\s*\d+/));
          
          if (siblings.length > 0) {
            const candidate = siblings.sort((a, b) => (b?.length || 0) - (a?.length || 0))[0];
            if (candidate && candidate.length > 5 && candidate !== "Facebook Marketplace") {
              title = candidate;
              break;
            }
          }
          current = current.parentElement;
          depth++;
        }
      }

      // Extract price - look for currency symbols and numbers
      let priceText = "Price not available";
      const priceMatch = item.textContent?.match(/[$€£¥]\s*(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)/);
      if (priceMatch) {
        priceText = priceMatch[0].trim();
      } else {
        // Try finding price in spans
        const priceSpans = Array.from(item.querySelectorAll('span'))
          .map(span => span.textContent?.trim())
          .find(text => text && /^[$€£¥]\s*\d+/.test(text));
        if (priceSpans) {
          priceText = priceSpans;
        }
      }

      // Extract image - Facebook listings have images with specific attributes
      const imgEl = item.querySelector('img[src*="scontent"], img[src*="fbcdn"], img[src*="marketplace"]') as HTMLImageElement;
      let imageUrl = imgEl?.src;
      
      // Try to get higher resolution image
      if (imgEl) {
        // Facebook sometimes stores the full image URL in data attributes
        imageUrl = imgEl.getAttribute('data-src') || 
                  imgEl.getAttribute('data-img') || 
                  imgEl.src;
      }

      // Extract location - Facebook shows location near listings
      let location: string | undefined;
      const locationText = item.textContent?.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*·/);
      if (locationText) {
        location = locationText[1];
      }

      // Extract date posted if available
      let datePosted: Date | undefined;
      const dateText = item.textContent?.match(/(\d+\s*(?:hours?|days?|weeks?|months?)\s*ago)/i);
      if (dateText) {
        // Simple date parsing (could be improved)
        const now = new Date();
        const match = dateText[1].match(/(\d+)\s*(hour|day|week|month)/i);
        if (match) {
          const value = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          const date = new Date(now);
          if (unit.includes('hour')) date.setHours(date.getHours() - value);
          else if (unit.includes('day')) date.setDate(date.getDate() - value);
          else if (unit.includes('week')) date.setDate(date.getDate() - value * 7);
          else if (unit.includes('month')) date.setMonth(date.getMonth() - value);
          datePosted = date;
        }
      }

      // Validate that we have a meaningful listing
      if (title && title !== "No title" && link.href) {
        listings.push({
          id: `fb_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title,
          price: priceText,
          url: link.href,
          imageUrl,
          location,
          marketplace: "Facebook Marketplace",
          datePosted,
        });
      } else {
        // Log when we skip a listing due to missing title
        console.warn(`[MarketplaceService] Skipped listing ${index}: title="${title}", url="${link.href}"`);
      }
    });

    console.log(`[MarketplaceService] Extracted ${listings.length} Facebook listings`);
    return listings;
  }

  private static async _extractCraigslistListings(options: FetchOptions = {}): Promise<Listing[]> {
    const listings: Listing[] = [];
    const { signal } = options;
    const items = document.querySelectorAll('.result-row, .result-info, .cl-search-result');
    
    items.forEach((item, index) => {
      if (signal?.aborted) return;

      const titleEl = item.querySelector('.result-title, a.result-title, .cl-app-anchor');
      const priceEl = item.querySelector('.result-price, .price');
      const linkEl = item.querySelector('a');
      const imgEl = item.querySelector('img');
      const dateEl = item.querySelector('.result-date, time');
      const locationEl = item.querySelector('.result-hood, .nearby');

      const title = titleEl?.textContent?.trim() || "No title";
      const price = priceEl?.textContent?.trim() || "Price not available";
      const url = linkEl ? (linkEl as HTMLAnchorElement).href : window.location.href;
      const imageUrl = imgEl ? (imgEl as HTMLImageElement).src : undefined;
      const location = locationEl?.textContent?.trim();

      let datePosted: Date | undefined;
      if (dateEl) {
        const dateText = dateEl.getAttribute('datetime') || dateEl.textContent?.trim();
        if (dateText) {
          const parsed = new Date(dateText);
          if (!isNaN(parsed.getTime())) {
            datePosted = parsed;
          }
        }
      }

      if (title && title !== "No title") {
        listings.push({
          id: `cl_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title,
          price,
          url,
          imageUrl,
          location,
          marketplace: "Craigslist",
          datePosted,
        });
      }
    });

    return listings;
  }

  private static async _extractEbayListings(options: FetchOptions = {}): Promise<Listing[]> {
    const listings: Listing[] = [];
    const { signal } = options;
    const items = document.querySelectorAll('.s-item, [class*="srp-results"] .s-item, [class*="ebay-item"]');
    
    items.forEach((item, index) => {
      if (signal?.aborted) return;

      const titleEl = item.querySelector('.s-item__title, .s-item__link, [class*="title"]');
      const priceEl = item.querySelector('.s-item__price, [class*="price"]');
      const linkEl = item.querySelector('a.s-item__link, a[href*="/itm/"]');
      const imgEl = item.querySelector('img.s-item__image, img[class*="image"]');
      const locationEl = item.querySelector('.s-item__location, [class*="location"]');
      const dateEl = item.querySelector('.s-item__time, time');

      const title = titleEl?.textContent?.trim() || "No title";
      // eBay titles sometimes have "New listing" prefix - clean it up
      const cleanTitle = title.replace(/^New listing\s*/i, '').trim();
      
      const price = priceEl?.textContent?.trim() || "Price not available";
      const url = linkEl ? (linkEl as HTMLAnchorElement).href : window.location.href;
      const imageUrl = imgEl ? (imgEl as HTMLImageElement).src : undefined;
      const location = locationEl?.textContent?.trim();

      let datePosted: Date | undefined;
      if (dateEl) {
        const dateText = dateEl.getAttribute('datetime') || dateEl.textContent?.trim();
        if (dateText) {
          const parsed = new Date(dateText);
          if (!isNaN(parsed.getTime())) {
            datePosted = parsed;
          }
        }
      }

      if (cleanTitle && cleanTitle !== "No title") {
        listings.push({
          id: `ebay_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: cleanTitle,
          price,
          url,
          imageUrl,
          location,
          marketplace: "eBay",
          datePosted,
        });
      }
    });

    return listings;
  }

  private static async _extractGenericListings(options: FetchOptions = {}): Promise<Listing[]> {
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
    const { signal } = options;
    
    allItems.slice(0, maxItems).forEach((item, index) => {
      if (signal?.aborted) return;
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
        const priceMatch = text.match(/[$€£]\s*\d+[\d,.]*/);
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
      
      // Extract location if available
      let location: string | undefined;
      const locationMatch = item.textContent?.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
      if (locationMatch && locationMatch[1].length > 2 && locationMatch[1].length < 50) {
        location = locationMatch[1];
      }

      // Filter out items that are clearly not listings
      if (title && 
          title !== "No title" && 
          title.length > 5 && 
          title.length < 200 &&
          !title.includes("Sign in") &&
          !title.includes("Create account") &&
          !title.includes("Cookie") &&
          !title.match(/^(Home|About|Contact|Privacy|Terms|Login|Sign Up)$/i)) {
        listings.push({
          id: `generic_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title,
          price: priceText || "Price not available",
          url: linkEl ? (linkEl as HTMLAnchorElement).href : window.location.href,
          imageUrl: imgEl ? (imgEl as HTMLImageElement).src : undefined,
          location,
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

  private static async _waitForListingsToLoad(marketplace: string | null, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const timeout = 10000; // 10 seconds
      
      const checkInterval = setInterval(() => {
        if (signal?.aborted) {
          clearInterval(checkInterval);
          resolve();
          return;
        }

        let hasResults = false;
        
        if (marketplace === "facebook") {
          // Facebook Marketplace listings
          hasResults = document.querySelectorAll('a[href*="/marketplace/item/"]').length > 0;
        } else if (marketplace === "craigslist") {
          // Craigslist listings
          hasResults = document.querySelectorAll('.result-row, .result-info, .cl-search-result').length > 0;
        } else if (marketplace === "ebay") {
          // eBay listings
          hasResults = document.querySelectorAll('.s-item, [class*="srp-results"]').length > 0;
        } else {
          // Generic check
          hasResults = document.querySelectorAll(
            'article, [class*="item"], [class*="listing"], [class*="product"], a[href*="/item"], a[href*="/product"]'
          ).length > 0;
        }
        
        if (hasResults || Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 300);
    });
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

