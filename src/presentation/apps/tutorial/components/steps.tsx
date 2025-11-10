import { SuccessIcon } from "./successIcon";

/**
 * Returns the appropriate asset URL depending on the environment.
 *
 * In a Chrome extension environment, it uses `chrome.runtime.getURL` to resolve the asset path.
 * Otherwise, it falls back to the raw path or a provided development path.
 *
 * @param prodPath - The path to the asset in the production (extension) environment.
 * @param devPath - (Optional) The path to the asset in the development environment.
 * @returns The resolved asset URL for the current environment.
 */
export const getAssetUrl = (prodPath: string, devPath?: string) => {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(prodPath);
  }
  return devPath ?? prodPath;
};

const openSidePanel = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.sidePanel.open({
      tabId: tabs[0]?.id,
    } as chrome.sidePanel.OpenOptions);
  });
};

const closeTutorial = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab && tab.id !== undefined) {
      chrome.tabs.sendMessage(tab.id, {
        action: "CLOSE_TUTORIAL",
      });
    }
  });
};

export const WelcomeStep = ({ onNext }: { onNext: () => void }) => {
  return (
    <div className="step">
      <img
        src={getAssetUrl("images/icon-128.png", "../../../images/icon-128.png")}
        alt="Welcome"
        className="logo"
        height="100"
      />
      <h2 className="tutorial-header">Welcome to Marketplace Search!</h2>
      <p className="tutorial-note">Search across multiple second-hand marketplaces to find the best deals.</p>
      <button className="tutorial-btn" onClick={onNext}>
        Get started
      </button>
    </div>
  );
};

export const Step1 = ({ onNext }: { onNext: () => void }) => {
  return (
    <div className="step">
      <h2 className="tutorial-header">
        Visit a marketplace site and click the extension icon
      </h2>
      <p className="tutorial-note">
        Supported marketplaces: Facebook Marketplace, Craigslist, eBay, Etsy, Gumtree, OLX
      </p>
      <img
        src={getAssetUrl("assets/extension-button.png")}
        alt="Extension icon demo"
        className="tutorial-gif"
        width={400}
      />
      <button className="tutorial-btn" onClick={onNext}>
        Next
      </button>
    </div>
  );
};

export const Step2 = ({ onNext }: { onNext: () => void }) => {
  return (
    <div className="step">
      <h2 className="tutorial-header">Extract listings from the page</h2>
      <p className="tutorial-note">
        Click "Extract Listings" to find all items on the current marketplace page.
      </p>
      <div style={{
        width: "400px",
        height: "300px",
        backgroundColor: "#f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "8px",
        margin: "20px auto",
        border: "2px dashed #ccc"
      }}>
        <p style={{ color: "#666", textAlign: "center" }}>
          📋 Extract Listings Button<br />
          (Screenshot/GIF placeholder)
        </p>
      </div>
      <button className="tutorial-btn" onClick={onNext}>
        Next
      </button>
    </div>
  );
};

export const Step3 = ({ onNext }: { onNext: () => void }) => {
  return (
    <div className="step">
      <h2 className="tutorial-header">
        Save listings or open them in new tabs
      </h2>
      <p className="tutorial-note">
        Select listings and use "Save" to add them to your watchlist, or "Open" to view them in new tabs.
      </p>
      <div style={{
        width: "400px",
        height: "300px",
        backgroundColor: "#f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "8px",
        margin: "20px auto",
        border: "2px dashed #ccc"
      }}>
        <p style={{ color: "#666", textAlign: "center" }}>
          💾 Save & Open Actions<br />
          (Screenshot/GIF placeholder)
        </p>
      </div>
      <button className="tutorial-btn" onClick={onNext}>
        Next
      </button>
    </div>
  );
};

export const Success = () => {
  return (
    <div className="step" style={{ height: "200px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ height: "10px" }}></div>
        <h2
          className="tutorial-header"
          style={{ display: "flex", alignItems: "center", gap: "10px" }}
        >
          <SuccessIcon />
          You're all set!
        </h2>
      </div>
      <div style={{ height: "20px" }}></div>
      <p className="tutorial-note">You're ready to search marketplaces and find great deals!</p>

      <button
        className="tutorial-btn"
        onClick={() => {
          openSidePanel();
          closeTutorial();
        }}
      >
        Get Started
      </button>

      <div style={{ height: "10px" }}></div>
    </div>
  );
};
