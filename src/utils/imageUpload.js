import axios from 'axios';
import {
  isCloudinaryConfigured,
  getCloudinaryUploadUrl,
  getCloudinaryConfig
} from '../config/cloudinary';

/**
 * Image Upload Utilities for Cloudinary
 *
 * This module provides functions to upload, delete, and manage images
 * in Cloudinary Cloud Storage for the FPTU Lab Events application.
 */

// Allowed image file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// Maximum file size: 5MB (as per UC-16 requirements)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Validate image file
 * @param {File} file - The file to validate
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Invalid file type. Please upload JPG, PNG, GIF, or WebP images only.' 
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size exceeds 5MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.` 
    };
  }

  return { valid: true, error: null };
};

/**
 * Generate a unique public ID for Cloudinary
 * @param {string} folder - The folder in Cloudinary (e.g., 'rooms', 'equipment')
 * @returns {string} - The public ID
 */
const generatePublicId = (folder = 'rooms') => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${folder}/${timestamp}_${randomString}`;
};

/**
 * Upload image to Cloudinary with progress tracking
 * @param {File} file - The image file to upload
 * @param {string} folder - The folder in Cloudinary (default: 'rooms')
 * @param {Function} onProgress - Callback for upload progress (0-100)
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export const uploadImage = async (file, folder = 'rooms', onProgress = null) => {
  // Check if Cloudinary is configured
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Please add REACT_APP_CLOUDINARY_CLOUD_NAME and REACT_APP_CLOUDINARY_UPLOAD_PRESET to your environment variables.');
  }

  // Validate the file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    const config = getCloudinaryConfig();
    const uploadUrl = getCloudinaryUploadUrl();

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);
    formData.append('folder', folder);

    // Generate a unique public_id
    const publicId = generatePublicId(folder);
    formData.append('public_id', publicId);

    // Upload to Cloudinary with progress tracking
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    // Return the secure URL
    if (response.data && response.data.secure_url) {
      return response.data.secure_url;
    } else {
      throw new Error('Failed to get image URL from Cloudinary response');
    }
  } catch (error) {
    console.error('Upload error:', error);

    // Provide user-friendly error messages
    let errorMessage = 'Failed to upload image. Please try again.';

    if (error.response) {
      // Cloudinary API error
      errorMessage = error.response.data?.error?.message || 'Upload failed due to server error.';
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error. Please check your internet connection.';
    } else {
      errorMessage = error.message || errorMessage;
    }

    throw new Error(errorMessage);
  }
};

/**
 * Delete an image from Cloudinary
 * Note: Deleting images from Cloudinary requires backend API support
 * as it needs authentication. This function is a placeholder.
 *
 * @param {string} imageUrl - The full URL of the image to delete
 * @returns {Promise<void>}
 */
export const deleteImage = async (imageUrl) => {
  if (!isCloudinaryConfigured()) {
    console.warn('Cloudinary is not configured. Cannot delete image.');
    return;
  }

  if (!imageUrl) {
    return;
  }

  try {
    // Extract public_id from Cloudinary URL
    // Cloudinary URLs have format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');

    if (uploadIndex === -1 || uploadIndex + 2 >= urlParts.length) {
      console.warn('Invalid Cloudinary URL format');
      return;
    }

    // Get public_id (everything after version number, without extension)
    const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
    const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));

    console.log('Image deletion requested for public_id:', publicId);
    console.warn('Note: Cloudinary image deletion requires backend API support with authentication.');

    // TODO: Implement backend API call to delete image
    // Example: await api.deleteCloudinaryImage(publicId);

  } catch (error) {
    // Don't throw error for delete failures, just log them
    console.error('Failed to delete image:', error);
  }
};

/**
 * Check if Cloudinary is available
 * @returns {boolean}
 */
export const isStorageAvailable = () => {
  return isCloudinaryConfigured();
};

/**
 * Get human-readable file size
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Create a preview URL for a file
 * @param {File} file - The file to preview
 * @returns {string} - Object URL for preview
 */
export const createPreviewUrl = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Revoke a preview URL to free memory
 * @param {string} url - The object URL to revoke
 */
export const revokePreviewUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

