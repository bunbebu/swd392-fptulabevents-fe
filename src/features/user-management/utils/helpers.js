// User Management Utility Functions

/**
 * Format user ID for display (show first 8 characters)
 * @param {string} id - User UUID
 * @returns {string} Formatted ID
 */
export const formatUserId = (id) => {
  if (!id) return 'N/A';
  return `${id.substring(0, 8)}...`;
};

/**
 * Get status display properties
 * @param {string} status - User status
 * @returns {Object} Status display properties
 */
export const getStatusDisplay = (status) => {
  const statusMap = {
    'active': {
      label: 'Active',
      className: 'active',
      color: '#155724',
      bgColor: '#d4edda'
    },
    'inactive': {
      label: 'Inactive',
      className: 'inactive',
      color: '#721c24',
      bgColor: '#f8d7da'
    },
    'locked': {
      label: 'Locked',
      className: 'locked',
      color: '#856404',
      bgColor: '#fff3cd'
    }
  };

  const normalizedStatus = status?.toLowerCase() || 'unknown';
  return statusMap[normalizedStatus] || {
    label: status || 'Unknown',
    className: 'unknown',
    color: '#383d41',
    bgColor: '#e2e3e5'
  };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
export const validatePassword = (password) => {
  const minLength = 6;
  const hasMinLength = password.length >= minLength;
  
  return {
    isValid: hasMinLength,
    errors: hasMinLength ? [] : [`Password must have at least ${minLength} characters`]
  };
};

/**
 * Format roles for display
 * @param {Array} roles - Array of roles
 * @returns {string} Formatted roles string
 */
export const formatRoles = (roles) => {
  if (!roles || !Array.isArray(roles)) return 'N/A';
  return roles.join(', ');
};

/**
 * Check if user has admin role
 * @param {Array} roles - Array of user roles
 * @returns {boolean} Has admin role
 */
export const isAdmin = (roles) => {
  if (!roles || !Array.isArray(roles)) return false;
  return roles.some(role => role.toLowerCase() === 'admin');
};

/**
 * Get available roles for selection
 * @returns {Array} Available roles
 */
export const getAvailableRoles = () => {
  return ['Admin', 'User', 'Student', 'Teacher'];
};

/**
 * Get available status options
 * @returns {Array} Available status options
 */
export const getStatusOptions = () => {
  return [
    { value: 'Active', label: 'Active', description: 'User can login and use the system' },
    { value: 'Inactive', label: 'Inactive', description: 'User cannot login' },
    { value: 'Locked', label: 'Locked', description: 'Account locked due to violation or security' }
  ];
};

/**
 * Debounce function for search inputs
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Generate pagination info
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {number} totalItems - Total number of items
 * @param {number} pageSize - Items per page
 * @returns {Object} Pagination info
 */
export const getPaginationInfo = (currentPage, totalPages, totalItems, pageSize) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  
  return {
    startItem,
    endItem,
    totalItems,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    pageInfo: `Showing ${startItem}-${endItem} of ${totalItems} items`
  };
};
