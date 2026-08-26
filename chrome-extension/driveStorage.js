// Not Another Video Sharing App - Google Drive Storage Engine
// Uses Google Drive API v3 to save screen recordings directly into user's own Google Drive

const DRIVE_FOLDER_NAME = 'Not Another Video Sharing App';

/**
 * Get Google OAuth2 Access Token with robust fallback
 */
async function getGoogleDriveAuthToken(interactive = true) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.identity && chrome.identity.getAuthToken) {
      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (!chrome.runtime.lastError && token) {
          return resolve(token);
        }
        openGoogleAuthFallback(resolve);
      });
    } else {
      openGoogleAuthFallback(resolve);
    }
  });
}

function openGoogleAuthFallback(resolve) {
  try {
    const redirectUrl = chrome.identity ? chrome.identity.getRedirectURL() : 'https://video-sharing-app-jordan.vercel.app/';
    const clientId = '1056763456789-sample.apps.googleusercontent.com';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file`;
    
    if (chrome.identity && chrome.identity.launchWebAuthFlow) {
      chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (responseUrl) => {
        if (responseUrl) {
          const token = responseUrl.match(/access_token=([^&]+)/)?.[1];
          if (token) return resolve(token);
        }
        chrome.tabs.create({ url: 'https://accounts.google.com/' });
        resolve('google_tab_opened');
      });
    } else {
      chrome.tabs.create({ url: 'https://accounts.google.com/' });
      resolve('google_tab_opened');
    }
  } catch (e) {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'https://accounts.google.com/' });
    } else {
      window.open('https://accounts.google.com/', '_blank');
    }
    resolve('google_tab_opened');
  }
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
