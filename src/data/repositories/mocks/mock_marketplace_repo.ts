// src/data/repositories/mocks/mock_marketplace_repo.ts
import { Listing } from "../../../domain/entities/listing";
import { MarketplaceRepo, SearchOptions } from "../../../domain/repositories/marketplace_repo";
import { FetchProgress } from "../../../domain/types/progress";

export class MockMarketplaceRepo implements MarketplaceRepo {
  private mockListings: Listing[] = [
    {
      id: "1",
      title: "Vintage Leather Jacket",
      price: "$150",
      url: "https://example.com/listing/1",
      imageUrl: "https://via.placeholder.com/300",
      location: "New York, NY",
      marketplace: "Facebook Marketplace",
      datePosted: new Date(),
    },
    {
      id: "2",
      title: "MacBook Pro 2019",
      price: "$800",
      url: "https://example.com/listing/2",
      imageUrl: "https://via.placeholder.com/300",
      location: "San Francisco, CA",
      marketplace: "Craigslist",
      datePosted: new Date(),
    },
    {
      id: "3",
      title: "Vintage Camera Collection",
      price: "$250",
      url: "https://example.com/listing/3",
      imageUrl: "https://via.placeholder.com/300",
      location: "Los Angeles, CA",
      marketplace: "eBay",
      datePosted: new Date(),
    },
    {
      id: "4",
      title: "Designer Handbag",
      price: "$200",
      url: "https://example.com/listing/4",
      imageUrl: "https://via.placeholder.com/300",
      location: "Chicago, IL",
      marketplace: "Facebook Marketplace",
      datePosted: new Date(),
    },
    {
      id: "5",
      title: "Bicycle - Mountain Bike",
      price: "$300",
      url: "https://example.com/listing/5",
      imageUrl: "https://via.placeholder.com/300",
      location: "Seattle, WA",
      marketplace: "Craigslist",
      datePosted: new Date(),
    },
  ];

  private progressCallback?: (progress: FetchProgress) => void;
  private abortController?: AbortController;

  setListings(listings: Listing[]) {
    this.mockListings = listings;
  }

  setProgressCallback(callback: (progress: FetchProgress) => void): void {
    this.progressCallback = callback;
  }

  async cancelSearch(): Promise<void> {
    console.log("[MOCK] Cancel search requested");
    this.abortController?.abort();
  }

  async searchListings(query: string, options?: SearchOptions): Promise<Listing[]> {
    console.log("[MOCK] Searching listings:", query, options);

    if (this.progressCallback) {
      const totalPages = 3;
      this.abortController = new AbortController();

      for (let page = 1; page <= totalPages; page++) {
        if (this.abortController.signal.aborted) {
          console.log("[MOCK] Search cancelled");
          throw new Error("Search cancelled");
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        const progress: FetchProgress = {
          currentPage: page,
          totalPages: totalPages,
          processedEmails: Math.min(page * 2, this.mockListings.length),
          totalEmails: this.mockListings.length,
          percentage: Math.round((page / totalPages) * 100),
        };
        this.progressCallback(progress);
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Filter by query if provided
    let results = this.mockListings;
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = this.mockListings.filter(
        (listing) =>
          listing.title.toLowerCase().includes(lowerQuery) ||
          listing.price.toLowerCase().includes(lowerQuery) ||
          listing.location?.toLowerCase().includes(lowerQuery),
      );
    }

    // Apply filters
    if (options?.minPrice) {
      results = results.filter((listing) => {
        const price = parseInt(listing.price.replace(/[^0-9]/g, ""));
        return price >= options.minPrice!;
      });
    }

    if (options?.maxPrice) {
      results = results.filter((listing) => {
        const price = parseInt(listing.price.replace(/[^0-9]/g, ""));
        return price <= options.maxPrice!;
      });
    }

    if (options?.marketplaces && options.marketplaces.length > 0) {
      results = results.filter((listing) =>
        options.marketplaces!.includes(listing.marketplace),
      );
    }

    return results;
  }

  async extractListings(): Promise<Listing[]> {
    console.log("[MOCK] Extracting listings from current page");
    
    if (this.progressCallback) {
      const progress: FetchProgress = {
        currentPage: 1,
        totalPages: 1,
        processedEmails: this.mockListings.length,
        totalEmails: this.mockListings.length,
        percentage: 100,
      };
      this.progressCallback(progress);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    return this.mockListings;
  }

  async openListing(listingId: string, url: string): Promise<void> {
    console.log("[MOCK] Opening listing:", listingId, url);
    return Promise.resolve();
  }

  async saveListing(listing: Listing): Promise<void> {
    console.log("[MOCK] Saving listing:", listing);
    return Promise.resolve();
  }
}

