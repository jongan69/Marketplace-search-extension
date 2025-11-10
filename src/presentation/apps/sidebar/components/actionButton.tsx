import "./actionButton.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { useModal } from "../providers/modalContext";
import { useApp } from "../../../providers/app_provider";

export const ActionButton = ({ id }: { id: string }) => {
  const text: string = id == "save-button" ? "Save" : "Open";
  const icon: IconProp = id == "save-button" ? faBookmark : faExternalLinkAlt;
  const { selectedListings, listings } = useApp();
  const { setModal } = useModal();

  const handleClick = () => {
    const selectedListingIds: string[] = Object.keys(selectedListings).filter(
      (id) => selectedListings[id]
    );
    
    if (selectedListingIds.length > 0) {
      const selectedListingsData = listings.filter((listing) =>
        selectedListingIds.includes(listing.id)
      );
      
      if (id === "save-button") {
        setModal({
          action: "save",
          type: "confirm",
          extras: {
            listingsNum: selectedListingIds.length,
            listings: selectedListingsData,
          },
        });
      } else {
        // Open listings
        selectedListingsData.forEach((listing) => {
          window.open(listing.url, "_blank");
        });
      }
    } else {
      setModal({ type: "no-listing" });
    }
  };

  return (
    <button
      id={id}
      className="action-button"
      aria-label={text}
      onClick={handleClick}
    >
      <FontAwesomeIcon icon={icon} className="i" />
      {text}
    </button>
  );
};
