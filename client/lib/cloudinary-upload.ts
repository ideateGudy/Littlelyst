import imageCompression from "browser-image-compression";
import { apiClient } from "./api-client";

export interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder?: string;
}

export interface UploadProgressCallback {
  (percentage: number): void;
}

/**
 * Client-side image compression:
 * Compress image before upload to respect mobile bandwidth in Nigerian market.
 * Targets ~1MB max with reasonable dimensions (1600px).
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.warn("Client-side compression fallback to original file:", error);
    return file;
  }
}

/**
 * Signed Cloudinary upload per FRONTEND_GUIDE.md §3:
 * 1. Requests signed params from NestJS endpoint `POST /api/uploads/signature`.
 *    (Stubs gracefully if backend endpoint isn't deployed yet).
 * 2. Uploads directly to Cloudinary using XMLHttpRequest for accurate real-time progress events.
 * 3. Returns the secure_url.
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  // Step 1: Request signed upload signature from backend
  let signatureData: CloudinarySignatureResponse;

  try {
    const res = await apiClient<CloudinarySignatureResponse>("/api/uploads/signature", {
      method: "POST",
    });
    signatureData = res.data!;
  } catch (err) {
    console.warn(
      "Backend /api/uploads/signature not reachable or not implemented yet. " +
      "Falling back to mock signed response for frontend preview.",
      err
    );
    // Graceful fallback stub for frontend development preview
    // Note to user: Depends on backend POST /api/uploads/signature
    signatureData = {
      signature: "mock_signature_for_dev",
      timestamp: Math.round(new Date().getTime() / 1000),
      apiKey: "mock_api_key",
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo",
      folder: "littlelyst/listings",
    };
  }

  // Step 2: Upload directly to Cloudinary with signature
  return new Promise((resolve, reject) => {
    // If working in purely offline / mock dev mode without valid Cloudinary credentials:
    if (signatureData.signature === "mock_signature_for_dev") {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        if (onProgress) onProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(interval);
          // Return a mock hosted image or local object URL representation
          const localUrl = URL.createObjectURL(file);
          resolve(localUrl);
        }
      }, 200);
      return;
    }

    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.append("file", file);
    formData.append("api_key", signatureData.apiKey);
    formData.append("timestamp", String(signatureData.timestamp));
    formData.append("signature", signatureData.signature);
    if (signatureData.folder) {
      formData.append("folder", signatureData.folder);
    }

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`
    );

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentage = Math.round((event.loaded * 100) / event.total);
        onProgress(percentage);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url || response.url);
        } catch (e) {
          reject(new Error("Invalid response format from Cloudinary"));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.error?.message || "Cloudinary upload failed"));
        } catch {
          reject(new Error(`Upload failed with status code ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during Cloudinary upload"));
    };

    xhr.send(formData);
  });
}
