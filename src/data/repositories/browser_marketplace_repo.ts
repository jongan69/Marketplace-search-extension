import { Listing } from "../../domain/entities/listing";
import { MarketplaceRepo, SearchOptions } from "../../domain/repositories/marketplace_repo";
import { FetchProgress } from "../../domain/types/progress";
import { PortManager } from "../ports/port_manager";

export class BrowserMarketplaceRepo implements MarketplaceRepo {
  private onProgressCallback?: (progress: FetchProgress) => void;

  setProgressCallback(callback: (progress: FetchProgress) => void): void {
    this.onProgressCallback = callback;
  }

  async cancelSearch(): Promise<void> {
    const port = PortManager.marketplacePort;
    if (!port) return Promise.reject("Port not connected");
    port.postMessage({ action: "CANCEL_SEARCH" });
    return Promise.resolve();
  }

  async searchListings(query: string, options?: SearchOptions): Promise<Listing[]> {
    const port = PortManager.marketplacePort;
    if (!port) return Promise.reject("Port not connected");

    port.postMessage({ 
      action: "SEARCH_LISTINGS",
      query,
      options 
    });

    return await new Promise<Listing[]>((resolve, reject) => {
      const listener = (msg: any) => {
        if (msg.action === "SEARCH_PROGRESS" && this.onProgressCallback) {
          this.onProgressCallback(msg.progress);
        } else if (msg.action === "SEARCH_LISTINGS_RESPONSE") {
          port.onMessage.removeListener(listener);

          if (msg.success) {
            const listings = msg.data as Listing[];
            resolve(listings);
          } else {
            console.error(
              `Error searching listings from content script: ${msg.error}`,
            );
            reject(new Error(msg.error));
          }
        }
      };
      port.onMessage.addListener(listener);
    });
  }

  async extractListings(): Promise<Listing[]> {
    const port = PortManager.marketplacePort;
    if (!port) {
      // Try to reconnect
      await PortManager.openPort();
      const newPort = PortManager.marketplacePort;
      if (!newPort) {
        throw new Error("Unable to connect to content script. Please refresh the page and try again.");
      }
    }

    const activePort = PortManager.marketplacePort!;
    activePort.postMessage({ action: "EXTRACT_LISTINGS" });

    return await new Promise<Listing[]>((resolve, reject) => {
      const timeout = setTimeout(() => {
        activePort.onMessage.removeListener(listener);
        reject(new Error("Extract listings timed out. Make sure you're on a supported marketplace page."));
      }, 30000); // 30 second timeout

      const listener = (msg: any) => {
        if (msg.action === "EXTRACT_PROGRESS" && this.onProgressCallback) {
          this.onProgressCallback(msg.progress);
        } else if (msg.action === "EXTRACT_LISTINGS_RESPONSE") {
          clearTimeout(timeout);
          activePort.onMessage.removeListener(listener);

          if (msg.success) {
            const listings = msg.data as Listing[];
            resolve(listings);
          } else {
            console.error(
              `Error extracting listings from content script: ${msg.error}`,
            );
            reject(new Error(msg.error || "Failed to extract listings"));
          }
        }
      };
      activePort.onMessage.addListener(listener);
    });
  }

  async openListing(_listingId: string, url: string): Promise<void> {
    chrome.tabs.create({ url });
    return Promise.resolve();
  }

  async saveListing(listing: Listing): Promise<void> {
    const port = PortManager.marketplacePort;
    if (!port) return Promise.reject("Port not connected");

    port.postMessage({
      action: "SAVE_LISTING",
      listing,
    });

    return await new Promise<void>((resolve, reject) => {
      const listener = (msg: any) => {
        if (msg.action === "SAVE_LISTING_RESPONSE") {
          port.onMessage.removeListener(listener);

          if (msg.success) {
            resolve();
          } else {
            console.error(
              `Error saving listing from content script: ${msg.error}`,
            );
            reject(new Error(msg.error));
          }
        }
      };
      port.onMessage.addListener(listener);
    });
  }
}

