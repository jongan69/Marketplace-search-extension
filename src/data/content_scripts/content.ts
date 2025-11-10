// src/data/content_scripts/content.ts
import { BrowserMarketplaceService } from "../services/browser_marketplace_service";
import { PageInteractionService } from "../services/page_interaction_service";
import { Listing } from "../../domain/entities/listing";

let currentAbortController: AbortController | null = null;

// Establish connection with the side panel
chrome.runtime.onConnect.addListener(function (port) {
  console.assert(port.name === "marketplace-port");
  port.postMessage({ message: "Content script connected" });

  port.onMessage.addListener(function (msg) {
    console.log("sidepanel said: ", msg);

    if (msg.action === "SEARCH_LISTINGS") {
      searchListings(port, msg.query, msg.options);
    } else if (msg.action === "EXTRACT_LISTINGS") {
      extractListings(port);
    } else if (msg.action === "OPEN_LISTING") {
      openListing(port, msg.url);
    } else if (msg.action === "SAVE_LISTING") {
      saveListing(port, msg.listing);
    } else if (msg.action === "CANCEL_SEARCH") {
      if (currentAbortController) {
        currentAbortController.abort();
        console.log("Search cancelled by user");
      }
    }
  });
});

async function searchListings(
  port: chrome.runtime.Port,
  query: string,
  options?: any,
) {
  try {
    currentAbortController = new AbortController();

    const listings = await BrowserMarketplaceService.searchListings(
      query,
      options,
    );

    const serialized = listings.map((listing) => ({
      ...listing,
      datePosted: listing.datePosted?.toISOString(),
    }));

    port.postMessage({
      action: "SEARCH_LISTINGS_RESPONSE",
      success: true,
      data: serialized,
    });
  } catch (error) {
    port.postMessage({
      action: "SEARCH_LISTINGS_RESPONSE",
      success: false,
      error: (error as Error).message,
    });
  } finally {
    currentAbortController = null;
  }
}

async function extractListings(port: chrome.runtime.Port) {
  try {
    currentAbortController = new AbortController();

    const listings = await BrowserMarketplaceService.extractListingsFromPage({
      signal: currentAbortController.signal,
    });

    const serialized = listings.map((listing) => ({
      ...listing,
      datePosted: listing.datePosted?.toISOString(),
    }));

    port.postMessage({
      action: "EXTRACT_LISTINGS_RESPONSE",
      success: true,
      data: serialized,
    });
  } catch (error) {
    port.postMessage({
      action: "EXTRACT_LISTINGS_RESPONSE",
      success: false,
      error: (error as Error).message,
    });
  } finally {
    currentAbortController = null;
  }
}

async function openListing(port: chrome.runtime.Port, url: string) {
  try {
    PageInteractionService.openListing(url);
    port.postMessage({
      action: "OPEN_LISTING_RESPONSE",
      success: true,
    });
  } catch (error) {
    port.postMessage({
      action: "OPEN_LISTING_RESPONSE",
      success: false,
      error: (error as Error).message,
    });
  }
}

async function saveListing(port: chrome.runtime.Port, listing: Listing) {
  try {
    // Save to local storage via background script
    chrome.runtime.sendMessage({
      action: "SAVE_LISTING",
      listing,
    });

    port.postMessage({
      action: "SAVE_LISTING_RESPONSE",
      success: true,
    });
  } catch (error) {
    port.postMessage({
      action: "SAVE_LISTING_RESPONSE",
      success: false,
      error: (error as Error).message,
    });
  }
}

// Get current marketplace
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "GET_MARKETPLACE") {
    const marketplace = PageInteractionService.getCurrentMarketplace();
    sendResponse({ result: marketplace });
  }
});

// Show tutorial
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "SHOW_TUTORIAL") {
    PageInteractionService.displayTutorial();
  }
});

// Close tutorial
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "CLOSE_TUTORIAL") {
    PageInteractionService.closeTutorial();
  }
});
