// Not Another Video Sharing App - Google Drive Storage Engine
// Uses Google Drive API v3 to save screen recordings into user's own Google Drive

const DRIVE_FOLDER_NAME = 'Not Another Video Sharing App';

/**
 * Get Google OAuth2 Access Token using chrome.identity API
 */
async function getGoogleDriveAuthToken(interactive = true) {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.identity) {
      return reject(new Error('chrome.identity API is not available'));
    }
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError || !token) {
        return reject(new Error(chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Google Auth failed'));
      }
      resolve(token);
    });
  });
}

/**
 * Get or create the dedicated folder 'Not Anothe Video Sharing App' in user's Google Drive
 */
async function getOrCreateGoogleDriveFolder(token) {
  // 1. Search for existing folder
  const query = encodeURIComponent(`name = '${DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // 2. Create new folder if not found
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
 * Upload video blob to user's Google Drive folder
 */
async function uploadVideoToGoogleDrive(blob, filename = `recording-${Date.now()}.webm`) {
  try {
    const token = await getGoogleDriveAuthToken(true);
    const folderId = await getOrCreateGoogleDriveFolder(token);

    // 1. Start Resumable Upload Session
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

    // 2. Upload video binary data
    const uploadRes = await fetch(locationUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/webm',
      },
      body: blob,
    });
    const fileData = await uploadRes.json();
    const fileId = fileData.id;

    // 3. Make file public (anyone with link can view)
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });

    const driveViewUrl = `https://drive.google.com/file/d/${fileId}/view`;
    return {
      fileId,
      driveViewUrl,
      fileName: filename,
    };
  } catch (err) {
    console.error('Google Drive upload error:', err);
    throw err;
  }
}
