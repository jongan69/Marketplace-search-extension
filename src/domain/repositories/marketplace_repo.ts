import { Listing } from "../entities/listing";
import { FetchProgress } from "../types/progress";

/**
 * Repository interface for managing marketplace search operations.
 * Provides a consistent API for searching across different marketplace platforms.
 */
export interface MarketplaceRepo {
  /**
   * Searches for listings across marketplaces based on a search query.
   *
   * @param query - The search query string
   * @param options - Optional search parameters (marketplaces, price range, location, etc.)
   * @returns A Promise that resolves to an array of Listing objects.
   */
  searchListings(
    query: string,
    options?: SearchOptions,
  ): Promise<Listing[]>;

  /**
   * Extracts listings from the current marketplace page.
   *
   * @returns A Promise that resolves to an array of Listing objects from the current page.
   */
  extractListings(): Promise<Listing[]>;

  /**
   * Opens a listing in a new tab.
   *
   * @param listingId - The ID of the listing to open
   * @param url - The URL of the listing
   * @returns A Promise that resolves when the listing is opened.
   */
  openListing(listingId: string, url: string): Promise<void>;

  /**
   * Saves a listing to watchlist/favorites.
   *
   * @param listing - The listing to save
   * @returns A Promise that resolves when the listing is saved.
   */
  saveListing(listing: Listing): Promise<void>;

  /**
   * Sets a callback function to receive progress updates during search operations.
   *
   * @param callback - Function called with progress updates
   */
  setProgressCallback?(callback: (progress: FetchProgress) => void): void;

  /**
   * Cancels any ongoing search operation.
   *
   * @returns A promise that resolves when the operation is cancelled
   */
  cancelSearch?(): Promise<void>;
}

export interface SearchOptions {
  marketplaces?: string[];
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  maxResults?: number;
  sortBy?: "price" | "date" | "relevance";
}

