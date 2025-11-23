import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly uploadsDir = './uploads/app-assets';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get public URL for uploaded file
   * @param filename - Name of the uploaded file
   * @returns Public URL to access the file
   */
  getFileUrl(filename: string): string {
    // Use relative path - will work with any domain
    // Frontend will make requests to the same backend domain it's configured for
    return `/uploads/app-assets/${filename}`;
  }

  /**
   * Delete a file from uploads directory
   * @param filename - Name of the file to delete
   */
  async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadsDir, filename);
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore errors if file doesn't exist
      console.error('Failed to delete file:', error);
    }
  }

  /**
   * Extract filename from URL
   * @param url - Full URL to the file
   * @returns Filename only
   */
  extractFilenameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/');
      return parts[parts.length - 1];
    } catch {
      return null;
    }
  }
}
