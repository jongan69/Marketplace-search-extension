import { ListingLine } from "./listingLine";
import { useApp } from "../../../providers/app_provider";
import ListingLineSkeleton from "./listingLineSkeleton";
import { EmptyListings } from "./emptyListings";
import { FetchProgressBar } from "./fetchProgress";

export const ListingsContainer = () => {
  const { filteredListings, loading, searchTerm, fetchProgress, cancelSearch } =
    useApp();

  return (
    <div id="listings">
      {fetchProgress ? (
        <FetchProgressBar progress={fetchProgress} onCancel={cancelSearch} />
      ) : loading ? (
        <>
          {Array.from({ length: 7 }).map((_, i) => (
            <ListingLineSkeleton key={i} />
          ))}
        </>
      ) : filteredListings.length === 0 ? (
        searchTerm ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "var(--text-secondary)",
            }}
          >
            <p>No listings match "{searchTerm}"</p>
          </div>
        ) : (
          <EmptyListings />
        )
      ) : (
        filteredListings.map((listing) => (
          <ListingLine
            key={listing.id}
            listing={listing}
          />
        ))
      )}
    </div>
  );
};

