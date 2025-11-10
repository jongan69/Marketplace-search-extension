import "./listingLine.css";
import { useApp } from "../../../providers/app_provider";
import { Listing } from "../../../../domain/entities/listing";

interface ListingLineProps {
  listing: Listing;
}

export const ListingLine = ({ listing }: ListingLineProps) => {
  const { selectedListings, setSelectedListings, openListing } = useApp();

  const selectLine = () => {
    setSelectedListings((prev) => {
      const newSelected = { ...prev };
      if (!newSelected[listing.id]) {
        newSelected[listing.id] = true;
      } else {
        delete newSelected[listing.id];
      }
      return newSelected;
    });
  };

  const handleClick = () => {
    openListing(listing);
  };

  return (
    <div
      className={
        selectedListings[listing.id]
          ? "listing-line listing-line-real selected"
          : "listing-line listing-line-real"
      }
    >
      <div className="begin">
        <div>
          <input
            type="checkbox"
            onChange={selectLine}
            checked={Boolean(selectedListings[listing.id])}
          />
        </div>
        {listing.imageUrl && (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="listing-image"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className="listing-details" onClick={handleClick}>
          <span className="listing-title">{listing.title}</span>
          <span className="listing-price">{listing.price}</span>
          {listing.location && (
            <span className="listing-location">{listing.location}</span>
          )}
          <span className="listing-marketplace">{listing.marketplace}</span>
        </div>
      </div>
    </div>
  );
};

