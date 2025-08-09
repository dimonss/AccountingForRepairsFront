export const DEFAULT_CAMERA_STORAGE_KEY = 'defaultCameraDeviceId';

export function getDefaultCameraDeviceId(): string | null {
  try {
    return localStorage.getItem(DEFAULT_CAMERA_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setDefaultCameraDeviceId(deviceId: string): void {
  try {
    localStorage.setItem(DEFAULT_CAMERA_STORAGE_KEY, deviceId);
  } catch {
    // ignore
  }
}

export function clearDefaultCameraDeviceId(): void {
  try {
    localStorage.removeItem(DEFAULT_CAMERA_STORAGE_KEY);
  } catch {
    // ignore
  }
} 