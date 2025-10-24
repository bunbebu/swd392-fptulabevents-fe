/**
 * Booking Constants
 * 
 * Constants for booking status, filters, and helper functions
 * Based on backend BookingStatus enum:
 * - 0: Pending
 * - 1: Approved
 * - 2: Rejected
 * - 3: Cancelled
 * - 4: Completed
 */

export const BOOKING_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
  CANCELLED: 3,
  COMPLETED: 4
};

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.PENDING]: 'Pending',
  [BOOKING_STATUS.APPROVED]: 'Approved',
  [BOOKING_STATUS.REJECTED]: 'Rejected',
  [BOOKING_STATUS.CANCELLED]: 'Cancelled',
  [BOOKING_STATUS.COMPLETED]: 'Completed'
};

export const BOOKING_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: BOOKING_STATUS.PENDING, label: 'Pending' },
  { value: BOOKING_STATUS.APPROVED, label: 'Approved' },
  { value: BOOKING_STATUS.REJECTED, label: 'Rejected' },
  { value: BOOKING_STATUS.CANCELLED, label: 'Cancelled' },
  { value: BOOKING_STATUS.COMPLETED, label: 'Completed' }
];

export const BOOKING_STATUS_COLORS = {
  [BOOKING_STATUS.PENDING]: '#FFA500',    // Orange
  [BOOKING_STATUS.APPROVED]: '#28a745',   // Green
  [BOOKING_STATUS.REJECTED]: '#dc3545',   // Red
  [BOOKING_STATUS.CANCELLED]: '#6c757d',  // Gray
  [BOOKING_STATUS.COMPLETED]: '#007bff'   // Blue
};

/**
 * Get booking status label
 * @param {number} status - Status code
 * @returns {string} Status label
 */
export const getBookingStatusLabel = (status) => {
  return BOOKING_STATUS_LABELS[status] || 'Unknown';
};

/**
 * Get booking status color
 * @param {number} status - Status code
 * @returns {string} Color hex code
 */
export const getBookingStatusColor = (status) => {
  return BOOKING_STATUS_COLORS[status] || '#6c757d';
};

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatBookingDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format date for input fields (datetime-local)
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date for input
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Check if booking can be approved
 * @param {number} status - Current status
 * @returns {boolean}
 */
export const canApproveBooking = (status) => {
  return status === BOOKING_STATUS.PENDING;
};

/**
 * Check if booking can be rejected
 * @param {number} status - Current status
 * @returns {boolean}
 */
export const canRejectBooking = (status) => {
  return status === BOOKING_STATUS.PENDING;
};

/**
 * Check if booking can be cancelled
 * @param {number} status - Current status
 * @returns {boolean}
 */
export const canCancelBooking = (status) => {
  return status === BOOKING_STATUS.PENDING || status === BOOKING_STATUS.APPROVED;
};

/**
 * Check if booking can be deleted
 * @param {number} status - Current status
 * @returns {boolean}
 */
export const canDeleteBooking = (status) => {
  return status === BOOKING_STATUS.PENDING || 
         status === BOOKING_STATUS.REJECTED || 
         status === BOOKING_STATUS.CANCELLED;
};

/**
 * Get duration in hours
 * @param {string} startTime - Start time ISO string
 * @param {string} endTime - End time ISO string
 * @returns {number} Duration in hours
 */
export const getBookingDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal
};

