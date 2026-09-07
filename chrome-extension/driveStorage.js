// Not Another Video Sharing App - Google Drive Storage Engine
// Uses Google Drive API v3 to save screen recordings directly into user's own Google Drive

const DRIVE_FOLDER_NAME = 'Not Another Video Sharing App';
const GOOGLE_CLIENT_ID = '249176329339-hkqrh9peqatudb35fqiurcjkeblncba6.apps.googleusercontent.com';

/**
 * Get Google OAuth2 Access Token using launchWebAuthFlow (Web App Client ID) with token caching
 */
async function getGoogleDriveAuthToken(interactive = true) {
  // 1. Check local cache first
  const cached = await new Promise((res) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['google_drive_token', 'token_expiry'], res);
    } else {
      res({});
    }
  });

  if (cached.google_drive_token && cached.token_expiry && cached.token_expiry > Date.now()) {
    return cached.google_drive_token;
  }

  // 2. Perform Web Auth Flow (optimized for Web Application Client IDs)
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.identity) {
      return reject(new Error('chrome.identity API is not available in this context'));
    }

    const redirectUri = chrome.identity.getRedirectURL(); // e.g. https://ojgpfmmhbkncnllkbmnglggicgllnbdb.chromiumapp.org/
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
      `&response_type=token` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent('https://www.googleapis.com/auth/drive.file')}` +
      `&prompt=consent`;

    if (chrome.identity.launchWebAuthFlow) {
      chrome.identity.launchWebAuthFlow(
        { url: authUrl, interactive },
        (responseUrl) => {
          if (chrome.runtime.lastError || !responseUrl) {
            const err = chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Google sign-in was canceled';
            console.warn('launchWebAuthFlow notice:', err);

            // Fallback: try native getAuthToken
            if (chrome.identity.getAuthToken) {
              chrome.identity.getAuthToken({ interactive }, (token) => {
                if (token && !chrome.runtime.lastError) {
                  return resolve(token);
                }
                reject(new Error(err));
              });
            } else {
              reject(new Error(err));
            }
            return;
          }

          try {
            // Response URL format: https://<id>.chromiumapp.org/#access_token=ya29...&token_type=Bearer&expires_in=3599
            const urlObj = new URL(responseUrl);
            const rawParams = urlObj.hash ? urlObj.hash.substring(1) : urlObj.search.substring(1);
            const params = new URLSearchParams(rawParams);
            const token = params.get('access_token');
            const expiresIn = parseInt(params.get('expires_in') || '3599', 10);

            if (token) {
              const expiry = Date.now() + (expiresIn - 60) * 1000;
              chrome.storage.local.set({ google_drive_token: token, token_expiry: expiry });
              resolve(token);
            } else {
              reject(new Error('No access token returned in response: ' + responseUrl));
            }
          } catch (parseErr) {
            reject(parseErr);
          }
        }
      );
    } else if (chrome.identity.getAuthToken) {
      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (token && !chrome.runtime.lastError) {
          return resolve(token);
        }
        const err = chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Google sign-in canceled';
        reject(new Error(err));
      });
    } else {
      reject(new Error('No compatible Chrome identity OAuth method found'));
    }
  });
}

/**
 * Get or create the dedicated folder 'Not Another Video Sharing App' in user's Google Drive
 */
async function getOrCreateGoogleDriveFolder(token) {
  const query = encodeURIComponent(`name = '${DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: DRIVE_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Upload video blob to user's Google Drive folder & configure readily shareable permissions
 */
async function uploadVideoToGoogleDrive(blob, filename = `recording-${Date.now()}.webm`) {
  try {
    const token = await getGoogleDriveAuthToken(true);
    if (!token) {
      throw new Error('Google Drive authorization required');
    }
    const folderId = await getOrCreateGoogleDriveFolder(token);

    const metadata = {
      name: filename,
      parents: [folderId],
      mimeType: 'video/webm',
    };

    const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    const locationUrl = initRes.headers.get('Location');
    if (!locationUrl) {
      throw new Error('Could not get Google Drive upload location');
    }

    const uploadRes = await fetch(locationUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/webm',
      },
      body: blob,
    });
    const fileData = await uploadRes.json();
    const fileId = fileData.id;

    // Make file public (anyone with link can view & download!)
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
        allowFileDiscovery: false,
      }),
    });

    const driveViewUrl = `https://drive.google.com/file/d/${fileId}/view`;
    const driveDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    return {
      fileId,
      driveViewUrl,
      driveDownloadUrl,
      fileName: filename,
    };
  } catch (err) {
    console.error('Google Drive upload error:', err);
    throw err;
  }
}
