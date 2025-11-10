export interface PageInteractionRepo {
  /**
   * Gets the current marketplace name from the active tab.
   *
   * @returns A Promise that resolves to the marketplace name or null
   */
  getCurrentMarketplace(): Promise<string | null>;
}
