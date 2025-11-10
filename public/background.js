const MARKETPLACE_ORIGINS = [
  "https://www.facebook.com",
  "https://www.craigslist.org",
  "https://www.ebay.com",
  "https://www.ebay.co.uk",
  "https://www.ebay.ca",
  "https://www.etsy.com",
  "https://www.gumtree.com",
];

const isMarketplaceUrl = (urlString) => {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    
    // Check for marketplace patterns
    if (hostname.includes("facebook.com") && url.pathname.includes("/marketplace")) {
      return true;
    }
    if (hostname.includes("craigslist.org")) {
      return true;
    }
    if (hostname.includes("ebay.com") || hostname.includes("ebay.co.uk") || hostname.includes("ebay.ca")) {
      return true;
    }
    if (hostname.includes("etsy.com")) {
      return true;
    }
    if (hostname.includes("gumtree.com")) {
      return true;
    }
    if (hostname.includes("olx.")) {
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
};

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  
  if (isMarketplaceUrl(tab.url)) {
    // Enables the side panel and disables popup on marketplace pages
    await chrome.sidePanel.setOptions({
      tabId,
      path: "sidebar/index.html",
      enabled: true,
    });
    await chrome.action.setPopup({ tabId, popup: "" });
  } else {
    // Disables the side panel and enables popup on all other sites
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false,
    });
    chrome.action.setPopup({ tabId, popup: "popup/index.html" });
  }
});

// Handle save listing messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "SAVE_LISTING") {
    chrome.storage.local.get(["saved_listings"], (result) => {
      const savedListings = result.saved_listings || [];
      savedListings.push(message.listing);
      chrome.storage.local.set({ saved_listings: savedListings }, () => {
        sendResponse({ success: true });
      });
    });
    return true; // Keep channel open for async response
  }
});

// Shows a tutorial when the extension is installed
chrome.runtime.onInstalled.addListener(function (object) {
  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: "https://www.facebook.com/marketplace/" }, function (tab) {
      // Wait for the tab to finish loading before sending the message
      function handleUpdated(tabId, info) {
        if (tabId === tab.id && info.status === "complete") {
          chrome.tabs.sendMessage(tab.id, { action: "SHOW_TUTORIAL" });
          chrome.tabs.onUpdated.removeListener(handleUpdated);
        }
      }
      chrome.tabs.onUpdated.addListener(handleUpdated);
    });
  }
});
