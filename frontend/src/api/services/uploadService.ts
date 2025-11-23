/**
 * Upload Service
 * API service for file uploads
 */

import apiClient from '../apiClient';

export interface UploadResponse {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
}

/**
 * Upload an image file
 * POST /upload/image
 * @param file - Image file to upload
 * @returns Upload response with file URL
 */
export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post<UploadResponse>({
    url: '/upload/image',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
