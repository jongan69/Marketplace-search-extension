import { useApp } from "../../../providers/app_provider";
import "./emptyListings.css";

export const EmptyListings = () => {
  const { extractListings } = useApp();
  return (
    <div className="e-container">
      <div className="e-card">
        <h2 className="e-title">No listings yet</h2>
        <p className="e-subtitle">Extract listings from the current page to get started</p>
        <div className="e-buttons">
          <button
            id="extract-listings"
            className="btn"
            onClick={() => extractListings()}
          >
            Extract Listings
          </button>
        </div>
      </div>
    </div>
  );
};

