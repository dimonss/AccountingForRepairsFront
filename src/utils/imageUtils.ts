// Generate UUID for photo filenames
export const generateUUID = (): string => {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers
  return 'xxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Compress image to target size (2MB by default)
export const compressImage = (
  file: File | string, 
  maxSizeBytes: number = 2 * 1024 * 1024, // 2MB
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions (keep aspect ratio)
      let { width, height } = img;
      const maxDimension = 1920; // Max width or height
      
      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try different quality levels to meet size requirement
      let currentQuality = quality;
      let compressed = canvas.toDataURL('image/jpeg', currentQuality);
      
      // Estimate size (base64 is ~33% larger than binary)
      let estimatedSize = (compressed.length * 3) / 4;
      
      // Reduce quality if still too large
      while (estimatedSize > maxSizeBytes && currentQuality > 0.1) {
        currentQuality -= 0.1;
        compressed = canvas.toDataURL('image/jpeg', currentQuality);
        estimatedSize = (compressed.length * 3) / 4;
      }

      console.log(`📸 Image compressed: ${Math.round(estimatedSize / 1024)}KB, quality: ${Math.round(currentQuality * 100)}%`);
      resolve(compressed);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Handle both File objects and base64 strings
    if (typeof file === 'string') {
      img.src = file;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    }
  });
};

// Get file size from base64 string
export const getBase64Size = (base64: string): number => {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  
  // Calculate size (base64 is ~33% larger than binary)
  const sizeInBytes = (base64Data.length * 3) / 4;
  
  // Account for padding
  const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
  return sizeInBytes - padding;
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}; 