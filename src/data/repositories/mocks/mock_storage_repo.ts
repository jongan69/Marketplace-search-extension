import { StorageRepo } from "../../../domain/repositories/storage_repo";
import { Listing } from "../../../domain/entities/listing";

export class MockStorageRepo implements StorageRepo {
  private mockSavedListings: Listing[] = [];
  private mockSearchHistory: string[] = [];

  setSavedListings(listings: Listing[]) {
    this.mockSavedListings = listings;
  }

  setSearchHistory(searches: string[]) {
    this.mockSearchHistory = searches;
  }

  async storeSavedListings(listings: Listing[]): Promise<void> {
    console.log("[MOCK] Storing saved listings");
    this.mockSavedListings = listings;
    return Promise.resolve();
  }

  async readSavedListings(): Promise<Listing[]> {
    console.log("[MOCK] Reading saved listings");
    return Promise.resolve(this.mockSavedListings);
  }

  async deleteSavedListings(listingIds: string[]): Promise<void> {
    console.log("[MOCK] Deleting saved listings:", listingIds);
    this.mockSavedListings = this.mockSavedListings.filter(
      (listing) => !listingIds.includes(listing.id),
    );
    return Promise.resolve();
  }

  async storeSearchHistory(searches: string[]): Promise<void> {
    console.log("[MOCK] Storing search history");
    this.mockSearchHistory = searches;
    return Promise.resolve();
  }

  async readSearchHistory(): Promise<string[]> {
    console.log("[MOCK] Reading search history");
    return Promise.resolve(this.mockSearchHistory);
  }
}
