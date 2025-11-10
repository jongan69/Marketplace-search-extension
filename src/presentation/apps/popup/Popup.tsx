import "./Popup.css";

const supportLink = "https://example.com/support";
const version = "1.0.0";

const PopupApp = () => {
  const openMarketplace = () => {
    window.open("https://www.facebook.com/marketplace/", "_blank");
  };

  return (
    <div className="popup-content">
      <h2>Marketplace Search</h2>
      <p>Search across multiple second-hand marketplaces to find the best deals!</p>

      <button
        className="open-marketplace-button"
        onClick={openMarketplace}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "16px auto",
        }}
      >
        <span style={{ marginRight: "8px" }}>🛒</span>
        Open Marketplace
      </button>

      <div className="popupLinks">
        <p>
          <strong>How it works:</strong> Visit a marketplace site (Facebook Marketplace, 
          Craigslist, eBay, etc.) and use the side panel to search and save listings.
        </p>
        <div className="spacer"></div>
        <p>
          <strong>Need help?</strong>{" "}
          <a href={supportLink} target="_blank" rel="noopener noreferrer">
            Contact Us
          </a>
        </p>
        <div className="spacer"></div>
      </div>

      <div className="version-info">
        <p>Version {version}</p>
      </div>
    </div>
  );
};

export default PopupApp;
