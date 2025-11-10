// src/presentation/providers/app_provider.tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { Listing } from "../../domain/entities/listing";
import { ChromeLocalStorageRepo } from "../../data/repositories/chrome_local_storage_repo";
import { BrowserMarketplaceRepo } from "../../data/repositories/browser_marketplace_repo";
import { ChromePageInteractionRepo } from "../../data/repositories/chrome_page_interaction_repo";
import { MarketplaceRepo } from "../../domain/repositories/marketplace_repo";
import { FetchProgress } from "../../domain/types/progress";
import { StorageRepo } from "../../domain/repositories/storage_repo";
import { PageInteractionRepo } from "../../domain/repositories/page_interaction_repo";
import { PortManager } from "../../data/ports/port_manager";

// Mock repositories
import { MockMarketplaceRepo } from "../../data/repositories/mocks/mock_marketplace_repo";
import { MockStorageRepo } from "../../data/repositories/mocks/mock_storage_repo";
import { MockPageInteractionRepo } from "../../data/repositories/mocks/mock_page_interaction_repo";

type AppContextType = {
  listings: Listing[];
  savedListings: Listing[];
  selectedListings: Record<string, boolean>;
  loading: boolean;
  searchListings: (query: string, options?: any) => Promise<void>;
  extractListings: () => Promise<void>;
  setSelectedListings: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  clearSelectedListings: () => void;
  openListing: (listing: Listing) => Promise<void>;
  saveListing: (listing: Listing) => Promise<void>;
  getMarketplace: () => Promise<string | null>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredListings: Listing[];
  fetchProgress: FetchProgress | null;
  cancelSearch: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [selectedListings, setSelectedListings] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [fetchProgress, setFetchProgress] = useState<FetchProgress | null>(
    null,
  );

  // - REPOS -
  const useMock = import.meta.env.VITE_USE_MOCK === "true";

  const marketplaceRepo: MarketplaceRepo = useMemo(() => {
    const repo = useMock ? new MockMarketplaceRepo() : new BrowserMarketplaceRepo();

    // Set up progress callback for both mock and production
    if (repo.setProgressCallback) {
      repo.setProgressCallback((progress) => {
        setFetchProgress(progress);
      });
    }
    return repo;
  }, [useMock]);

  const storageRepo: StorageRepo = useMemo(
    () => (useMock ? new MockStorageRepo() : new ChromeLocalStorageRepo()),
    [useMock],
  );
  const pageInteractionRepo: PageInteractionRepo = useMemo(
    () =>
      useMock ? new MockPageInteractionRepo() : new ChromePageInteractionRepo(),
    [useMock],
  );

  // - METHODS -

  const extractListings = useCallback(async () => {
    setLoading(true);
    setFetchProgress(null);
    try {
      // Ensure port is connected
      if (!PortManager.marketplacePort) {
        await PortManager.openPort();
      }
      
      const extracted = await marketplaceRepo.extractListings();
      setListings(extracted);
    } catch (error) {
      console.error("Error extracting listings:", error);
      // Show error to user - you might want to add a toast/notification system
      alert(`Failed to extract listings: ${(error as Error).message}. Make sure you're on a supported marketplace page.`);
    } finally {
      setLoading(false);
      setFetchProgress(null);
    }
  }, [marketplaceRepo]);

  const searchListings = useCallback(
    async (query: string, options?: any) => {
      setLoading(true);
      setFetchProgress(null);
      try {
        const results = await marketplaceRepo.searchListings(query, options);
        setListings(results);
        
        // Save to search history
        const history = await storageRepo.readSearchHistory();
        const updatedHistory = [...history.filter(h => h !== query), query];
        await storageRepo.storeSearchHistory(updatedHistory);
      } finally {
        setLoading(false);
        setFetchProgress(null);
      }
    },
    [marketplaceRepo, storageRepo],
  );

  const cancelSearch = useCallback(() => {
    if (marketplaceRepo.cancelSearch) {
      marketplaceRepo.cancelSearch();
    }
    setFetchProgress(null);
  }, [marketplaceRepo]);

  const clearSelectedListings = useCallback(() => {
    setSelectedListings({});
  }, []);

  const openListing = useCallback(
    async (listing: Listing) => {
      await marketplaceRepo.openListing(listing.id, listing.url);
    },
    [marketplaceRepo],
  );

  const saveListing = useCallback(
    async (listing: Listing) => {
      await marketplaceRepo.saveListing(listing);
      const updated = await storageRepo.readSavedListings();
      setSavedListings(updated);
    },
    [marketplaceRepo, storageRepo],
  );

  const getMarketplace = useCallback(async (): Promise<string | null> => {
    const marketplace = await pageInteractionRepo.getCurrentMarketplace();
    return marketplace;
  }, [pageInteractionRepo]);

  // Add filtered listings computation
  const filteredListings = useMemo(() => {
    if (!searchTerm.trim()) {
      return listings;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return listings.filter((listing) => {
      const matchesTitle = listing.title.toLowerCase().includes(lowerSearchTerm);
      const matchesPrice = listing.price.toLowerCase().includes(lowerSearchTerm);
      const matchesLocation = listing.location?.toLowerCase().includes(lowerSearchTerm);
      const matchesMarketplace = listing.marketplace.toLowerCase().includes(lowerSearchTerm);
      return matchesTitle || matchesPrice || matchesLocation || matchesMarketplace;
    });
  }, [listings, searchTerm]);

  // Automatically load saved listings when the component mounts
  useEffect(() => {
    (async () => {
      const saved = await storageRepo.readSavedListings();
      setSavedListings(saved);
    })();
  }, [storageRepo]);

  return (
    <AppContext.Provider
      value={{
        listings,
        savedListings,
        selectedListings,
        loading,
        searchListings,
        extractListings,
        setSelectedListings,
        clearSelectedListings,
        openListing,
        saveListing,
        getMarketplace,
        searchTerm,
        setSearchTerm,
        filteredListings,
        fetchProgress,
        cancelSearch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
