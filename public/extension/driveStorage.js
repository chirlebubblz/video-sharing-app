// Not Another Video Sharing App - Google Drive Storage Engine
// Uses Google Drive API v3 to save screen recordings directly into user's own Google Drive

const DRIVE_FOLDER_NAME = 'Not Another Video Sharing App';

/**
 * Get Google OAuth2 Access Token using native Chrome Extension OAuth2 identity API
 */
async function getGoogleDriveAuthToken(interactive = true) {
  return new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.identity && chrome.identity.getAuthToken) {
      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (token && !chrome.runtime.lastError) {
          return resolve(token);
        }
        const err = chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Google Auth failed';
        console.warn('Native Chrome AuthToken Notice:', err);
        reject(new Error(err));
      });
    } else {
      reject(new Error('chrome.identity API is not available'));
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
