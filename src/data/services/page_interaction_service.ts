/**
 * Service class for interacting with marketplace pages (must be used within content script).
 * Provides methods to interact with marketplace pages.
 */
export class PageInteractionService {
  /**
   * Opens a listing in a new tab.
   */
  static openListing(url: string): void {
    window.open(url, "_blank");
  }

  /**
   * Gets the current marketplace name from the page.
   */
  static getCurrentMarketplace(): string | null {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes("facebook.com") && window.location.pathname.includes("/marketplace")) {
      return "Facebook Marketplace";
    }
    if (hostname.includes("craigslist.org")) {
      return "Craigslist";
    }
    if (hostname.includes("ebay.com") || hostname.includes("ebay.co.uk") || hostname.includes("ebay.ca")) {
      return "eBay";
    }
    if (hostname.includes("etsy.com")) {
      return "Etsy";
    }
    if (hostname.includes("gumtree.com")) {
      return "Gumtree";
    }
    if (hostname.includes("olx.")) {
      return "OLX";
    }
    
    return null;
  }

  static displayTutorial() {
    // Create an iframe element
    const iframe = document.createElement("iframe");
    iframe.id = "marketplace-search-tutorial";
    iframe.src = chrome.runtime.getURL("tutorial/index.html");

    // Style the iframe as a modal
    iframe.setAttribute("allowtransparency", "true");
    iframe.style.backgroundColor = "transparent";
    iframe.style.position = "fixed";
    iframe.style.top = "50%";
    iframe.style.left = "50%";
    iframe.style.transform = "translate(-50%, -50%)";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.zIndex = "10000";

    // Append the iframe to the document body
    document.body.appendChild(iframe);
  }

  static closeTutorial() {
    const iframe = document.getElementById("marketplace-search-tutorial");
    iframe?.remove();
  }
}
