# Automated-CMS-Content-Cleanup-Node.js-Axios-OAuth2-API
Node.js utility that connects to a CMS OData API, finds a document library (folder) by title, and removes a specific additional URL from all documents in that library.

# CMS-docs-url-cleaner

**Purpose.**  
Utility script to remove a specific additional URL from all documents within a named document library (folder) via CMS-like OData API.

> ⚠️ **Important:** This script performs destructive updates. Always run in dry-run mode and have backups before running on production.

---

## Features

- Authenticate via OAuth2 (password grant shown as example — replace with a safer grant flow in production)
- Find a document library by title
- List documents in that library
- Remove matches from `Urls` and `MediaFileUrls` arrays
- Patch documents that need changes
- Console logging for operations and failures

---

## Getting started

### Requirements

- Node.js (v14+ recommended)
- `npm install` to install dependencies (`axios`, optionally `dotenv`)

### Installation

```bash
git clone <your-repo-url>
cd CMS-docs-url-cleaner
npm install

