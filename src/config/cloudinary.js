/**
 * Cloudinary Configuration
 * 
 * This file provides configuration for Cloudinary image uploads.
 * Cloudinary is used for Cloud Storage to upload room and equipment images.
 * 
 * Environment Variables Required:
 * - REACT_APP_CLOUDINARY_CLOUD_NAME
 * - REACT_APP_CLOUDINARY_UPLOAD_PRESET
 * 
 * Optional (for signed uploads):
 * - REACT_APP_CLOUDINARY_API_KEY
 */

// Cloudinary configuration from environment variables
// Fallback values for development (remove in production for better security)
const cloudinaryConfig = {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dih5ygh0s',
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'fptu_lab_events',
  apiKey: process.env.REACT_APP_CLOUDINARY_API_KEY || '454597673411692', // Optional
};

// Debug: Log configuration on load (disable in production)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Cloudinary Configuration:');
  console.log('  Cloud Name:', cloudinaryConfig.cloudName);
  console.log('  Upload Preset:', cloudinaryConfig.uploadPreset);
  console.log('  API Key:', cloudinaryConfig.apiKey);
  console.log('  Is Configured:', !!(cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset));
  console.log('  From ENV:', {
      cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
      uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
    });
}

/**
 * Check if Cloudinary is properly configured
 * @returns {boolean}
 */
export const isCloudinaryConfigured = () => {
  return !!(cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset);
};

/**
 * Get Cloudinary upload URL
 * @returns {string}
 */
export const getCloudinaryUploadUrl = () => {
  if (!cloudinaryConfig.cloudName) {
    throw new Error('Cloudinary cloud name is not configured');
  }
  return `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
};

/**
 * Get Cloudinary configuration
 * @returns {Object}
 */
export const getCloudinaryConfig = () => {
  return { ...cloudinaryConfig };
};

export default cloudinaryConfig;

