/**
 * Represents a marketplace listing with its details and metadata.
 *
 * @property {string} id - Unique identifier for the listing
 * @property {string} title - Title of the listing
 * @property {string} price - Price of the item
 * @property {string} url - URL to the listing page
 * @property {string} imageUrl - URL to the listing image
 * @property {string} location - Location of the item
 * @property {string} marketplace - Name of the marketplace (e.g., "Facebook Marketplace", "Craigslist")
 * @property {Date} datePosted - Date when the listing was posted
 * @property {string} description - Description of the item (optional)
 */
export interface Listing {
  id: string;
  title: string;
  price: string;
  url: string;
  imageUrl?: string;
  location?: string;
  marketplace: string;
  datePosted?: Date;
  description?: string;
}

