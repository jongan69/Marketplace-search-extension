import { PageInteractionRepo } from "../../domain/repositories/page_interaction_repo";

export class ChromePageInteractionRepo implements PageInteractionRepo {
  async getCurrentMarketplace(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId === undefined) {
          reject("No active tab.");
          return;
        }

        chrome.tabs.sendMessage(
          tabId,
          { action: "GET_MARKETPLACE" },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(
                "Could not get marketplace:",
                chrome.runtime.lastError,
              );
              reject(chrome.runtime.lastError.message);
            } else {
              resolve(response.result);
            }
          },
        );
      });
    });
  }
}
