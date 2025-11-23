/**
 * ImageUpload Component
 * Reusable image upload component with drag & drop support
 *
 * Features:
 * - Drag & drop file upload
 * - Click to select file
 * - Image preview
 * - Upload progress
 * - File size validation (max 5MB)
 * - Image format validation (jpg, png, gif, webp, svg)
 * - Loading state
 * - Error handling
 */

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { uploadImage } from '@/api/services/uploadService';

export interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  onError?: (error: string) => void;
  label?: string;
  description?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onError,
  label,
  description,
  maxSizeMB = 5,
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/)) {
      onError?.('يرجى اختيار صورة بصيغة JPG, PNG, GIF, WEBP, أو SVG');
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      onError?.(`حجم الصورة يجب أن لا يتجاوز ${maxSizeMB}MB`);
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      setIsUploading(true);
      const response = await uploadImage(file);
      onChange(response.url);
      setPreview(response.url);
    } catch (error) {
      onError?.('فشل رفع الصورة. يرجى المحاولة مرة أخرى');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-[var(--text-primary)]">{label}</label>
      )}

      <div
        className={`relative border-2 border-dashed rounded-lg transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-[var(--border-color)] bg-[var(--bg-primary)]'
        } ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary-400'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {preview ? (
          <div className="relative p-4">
            <img
              src={preview}
              alt="معاينة"
              className="max-h-48 mx-auto rounded-lg object-contain"
            />
            {!disabled && !isUploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="text-sm text-[var(--text-secondary)]">جاري رفع الصورة...</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary-100 rounded-full">
                    <Upload className="w-8 h-8 text-primary-600" />
                  </div>
                </div>
                <p className="text-sm text-[var(--text-primary)] font-medium mb-1">
                  اسحب الصورة هنا أو اضغط للاختيار
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  JPG, PNG, GIF, WEBP, SVG (حد أقصى {maxSizeMB}MB)
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-[var(--text-secondary)]">{description}</p>
      )}
    </div>
  );
}
