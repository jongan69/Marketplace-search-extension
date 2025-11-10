import { Listing } from "../../domain/entities/listing";
import { StorageRepo } from "../../domain/repositories/storage_repo";

const SAVED_LISTINGS_KEY = "saved_listings";
const SEARCH_HISTORY_KEY = "search_history";
const MAX_SEARCH_HISTORY = 50;

export class ChromeLocalStorageRepo implements StorageRepo {
  async storeSavedListings(listings: Listing[]): Promise<void> {
    await chrome.storage.local.set({
      [SAVED_LISTINGS_KEY]: listings,
    });
  }

  async readSavedListings(): Promise<Listing[]> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(SAVED_LISTINGS_KEY).then((result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        const listings = result[SAVED_LISTINGS_KEY] || [];
        resolve(listings);
      });
    });
  }

  async deleteSavedListings(listingIds: string[]): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(SAVED_LISTINGS_KEY, (result) => {
        const savedListings = result[SAVED_LISTINGS_KEY] || [];
        const updatedListings = savedListings.filter(
          (listing: Listing) => !listingIds.includes(listing.id),
        );
        chrome.storage.local.set(
          { [SAVED_LISTINGS_KEY]: updatedListings },
          () => {
            console.log("Updated saved listings in local storage.");
            resolve();
          },
        );
      });
    });
  }

  async storeSearchHistory(searches: string[]): Promise<void> {
    // Keep only the most recent searches
    const limitedSearches = searches.slice(-MAX_SEARCH_HISTORY);
    await chrome.storage.local.set({
      [SEARCH_HISTORY_KEY]: limitedSearches,
    });
  }

  async readSearchHistory(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(SEARCH_HISTORY_KEY).then((result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        const history = result[SEARCH_HISTORY_KEY] || [];
        resolve(history);
      });
    });
  }
}
