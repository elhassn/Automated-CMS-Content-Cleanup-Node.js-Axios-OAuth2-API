
---

# Sanitized script (save as `remove-url.js`)

//javascript
/**
 * Sanitized version — DO NOT commit real secrets.
 * Use environment variables or a secret manager.
 */

const axios = require('axios');
const qs = require('qs'); // optional, for form encoding
const yargs = require('yargs');

const argv = yargs
  .option('library', { alias: 'l', type: 'string', demandOption: true, description: 'Library (folder) Title' })
  .option('url', { alias: 'u', type: 'string', demandOption: true, description: 'Additional URL to remove' })
  .option('dry-run', { alias: 'd', type: 'boolean', default: true, description: 'Dry run (do not patch)' })
  .argv;

// === Configuration from environment (REDACTED) ===
// Set these in your environment or CI secret store
const authUrl = process.env.AUTH_URL || 'https://REDACTED_AUTH_URL';
const baseUrl = process.env.BASE_URL || 'https://REDACTED_BASE_URL';
const credentials = {
  username: process.env.USERNAME || 'REDACTED_USERNAME',
  password: process.env.PASSWORD || 'REDACTED_PASSWORD',
  grant_type: process.env.GRANT_TYPE || 'password', // consider switching to client_credentials
  client_id: process.env.CLIENT_ID || 'REDACTED_CLIENT_ID',
  client_secret: process.env.CLIENT_SECRET || 'REDACTED_CLIENT_SECRET'
};

async function getAccessToken() {
  const params = new URLSearchParams(credentials);
  const response = await axios.post(authUrl, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 20000
  });
  return response.data.access_token;
}

async function removeAdditionalUrlFromFolder(folderName, additionalUrlToRemove, dryRun = true) {
  try {
    const token = await getAccessToken();
    const authHeader = { Authorization: `Bearer ${token}` };

    // NOTE: encode OData filter values to avoid injection/encoding issues
    const escapedTitle = encodeURIComponent(folderName.replace("'", "''"));
    const libRes = await axios.get(`${baseUrl}/documentlibraries?$filter=Title eq '${escapedTitle}'`, { headers: authHeader });

    const library = libRes.data?.value?.[0];
    if (!library) {
      console.error(`Library "${folderName}" not found.`);
      return;
    }

    const libraryId = library.Id;
    console.log(`Found library "${folderName}" (ID: ${libraryId})`);

    // Pagination might be required for large libraries — example simple call:
    const docsRes = await axios.get(`${baseUrl}/documents?$filter=ParentId eq ${libraryId}`, { headers: authHeader });
    const documents = docsRes.data?.value || [];

    if (documents.length === 0) {
      console.log(`No documents found in library "${folderName}".`);
      return;
    }

    for (const doc of documents) {
      const currentUrls = Array.isArray(doc.Urls) ? doc.Urls : [];
      const currentMediaUrls = Array.isArray(doc.MediaFileUrls) ? doc.MediaFileUrls : [];

      const updatedUrls = currentUrls.filter(url => url !== additionalUrlToRemove);
      const updatedMediaUrls = currentMediaUrls.filter(url => url !== additionalUrlToRemove);

      if (updatedUrls.length !== currentUrls.length || updatedMediaUrls.length !== currentMediaUrls.length) {
        const patchPayload = { Urls: updatedUrls, MediaFileUrls: updatedMediaUrls };

        if (dryRun) {
          console.log(`DRY-RUN: Would patch document "${doc.Title}" (ID: ${doc.Id}) with:`, patchPayload);
        } else {
          try {
            await axios.patch(`${baseUrl}/documents(${doc.Id})`, patchPayload, {
              headers: { ...authHeader, 'Content-Type': 'application/json' },
              timeout: 20000
            });
            console.log(`Patched document "${doc.Title}" (ID: ${doc.Id})`);
          } catch (patchErr) {
            console.error(`Failed to update "${doc.Title}" (ID: ${doc.Id}):`, patchErr.response?.data || patchErr.message);
          }
        }
      } else {
        console.log(`No matching additional URL found in "${doc.Title}" (ID: ${doc.Id})`);
      }
    }

  } catch (error) {
    console.error('Error during cleanup:', error.response?.data || error.message);
  }
}

// Run with cli args
removeAdditionalUrlFromFolder(argv.library, argv.url, argv['dry-run']);
