import { Listing } from "../entities/listing";

export interface StorageRepo {
  /**
   * Stores a list of saved listings (watchlist/favorites).
   *
   * @param listings - An array of listings to store
   */
  storeSavedListings(listings: Listing[]): Promise<void>;

  /**
   * Retrieves all saved listings.
   *
   * @returns A Promise that resolves to an array of saved listings
   */
  readSavedListings(): Promise<Listing[]>;

  /**
   * Deletes listings from saved list.
   *
   * @param listingIds - An array of listing IDs to delete
   */
  deleteSavedListings(listingIds: string[]): Promise<void>;

  /**
   * Stores search history.
   *
   * @param searches - An array of search queries
   */
  storeSearchHistory(searches: string[]): Promise<void>;

  /**
   * Retrieves search history.
   *
   * @returns A Promise that resolves to an array of search queries
   */
  readSearchHistory(): Promise<string[]>;
}
