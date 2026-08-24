'use client';

import { useState, useEffect } from 'react';

export interface MediaDeviceInfoState {
  hasCamera: boolean;
  hasMic: boolean;
  cameras: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];
  selectedCameraId: string;
  selectedMicId: string;
  permissionGranted: boolean;
}

export function useMediaDevices() {
  const [deviceState, setDeviceState] = useState<MediaDeviceInfoState>({
    hasCamera: false,
    hasMic: false,
    cameras: [],
    microphones: [],
    selectedCameraId: '',
    selectedMicId: '',
    permissionGranted: false,
  });

  const checkDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoIn = devices.filter((d) => d.kind === 'videoinput');
      const audioIn = devices.filter((d) => d.kind === 'audioinput');

      setDeviceState({
        hasCamera: videoIn.length > 0,
        hasMic: audioIn.length > 0,
        cameras: videoIn,
        microphones: audioIn,
        selectedCameraId: videoIn[0]?.deviceId || '',
        selectedMicId: audioIn[0]?.deviceId || '',
        permissionGranted: videoIn.some((d) => d.label !== '') || audioIn.some((d) => d.label !== ''),
      });
    } catch (err) {
      console.warn('Error checking media devices:', err);
    }
  };

  useEffect(() => {
    checkDevices();
    navigator.mediaDevices?.addEventListener('devicechange', checkDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', checkDevices);
    };
  }, []);

  return {
    ...deviceState,
    refreshDevices: checkDevices,
  };
}
