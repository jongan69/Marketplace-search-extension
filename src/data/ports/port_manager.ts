export class PortManager {
  static marketplacePort: chrome.runtime.Port | null = null;

  static async openPort() {
    try {
      const [currentTab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      if (currentTab && currentTab.id) {
        // Close existing port if any
        if (this.marketplacePort) {
          try {
            this.marketplacePort.disconnect();
          } catch (e) {
            // Port might already be disconnected
          }
        }

        const port = chrome.tabs.connect(currentTab.id, { name: "marketplace-port" });
        this.marketplacePort = port;

        // Handle port disconnection
        port.onDisconnect.addListener(() => {
          console.log("Port disconnected");
          this.marketplacePort = null;
        });

        this.marketplacePort.postMessage({ message: "Sidepanel connected" });
        this.marketplacePort.onMessage.addListener((msg) => {
          console.log("content script said: ", msg);
        });
      } else {
        throw new Error("No active tab found");
      }
    } catch (error) {
      console.error("Error opening port:", error);
      this.marketplacePort = null;
      throw error;
    }
  }
}
