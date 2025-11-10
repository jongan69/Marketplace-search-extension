# Marketplace Search - Chrome Extension

A Chrome extension that helps you search across multiple second-hand marketplaces to find the best deals on items you're looking for.

## 🎯 Project Overview

Marketplace Search addresses the challenge of finding items across multiple second-hand marketplace platforms. Instead of manually searching each marketplace separately, this extension allows you to search and compare listings from Facebook Marketplace, Craigslist, eBay, Etsy, Gumtree, OLX, and more - all from one convenient side panel.

## ⚡ Key Features

- **Multi-Marketplace Search**: Search across multiple platforms simultaneously
- **Listing Extraction**: Automatically extract listings from marketplace pages
- **Save to Watchlist**: Save interesting listings for later review
- **Price Comparison**: Compare prices across different marketplaces
- **Chrome Side Panel UI**: Modern, responsive interface built with React and TypeScript
- **Smart Filtering**: Filter by price range, location, and marketplace

## 🛠️ Technical Architecture

### Frontend Stack

- **React 19** with **TypeScript** for type-safe component development
- **Vite** for fast development builds and hot module replacement
- **Chrome Extensions Manifest V3** for modern extension capabilities

### APIs & Integration

- **Chrome Extensions API** for side panel, content scripts, and background processes
- **Chrome Storage API** for efficient local data caching
- **Content Scripts** for extracting listings from marketplace pages

### Supported Marketplaces

- Facebook Marketplace
- Craigslist
- eBay (US, UK, CA)
- Etsy
- Gumtree
- OLX (Poland, Portugal, Romania)

## 🔒 Security & Privacy

- **Zero external data storage** - all processing happens client-side for privacy
- **Local storage only** - your saved listings stay on your device
- **No tracking** - we don't track your searches or browsing habits

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `bun install`
3. Build the extension: `bun run build`
4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

## 📝 Development

- `bun run dev` - Start development server with mock data
- `bun run build` - Build for production
- `bun run lint` - Run linters
- `bun run test` - Run tests

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

See LICENSE file for details.
# Marketplace-search-extension
