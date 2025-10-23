/**
 * Event Constants
 * 
 * Defines event status options based on backend enums
 * 
 * Backend Reference:
 * - EventStatus enum: SWD392-BE\FPTU Lab Events\DomainLayer\Enum\EventStatus.cs
 */

/**
 * Event Status Options
 * Maps to backend EventStatus enum (0-3)
 */
export const EVENT_STATUS_OPTIONS = [
  { value: 0, label: 'Active' },      // Đang hoạt động
  { value: 1, label: 'Inactive' },    // Không hoạt động
  { value: 2, label: 'Cancelled' },   // Đã hủy
  { value: 3, label: 'Completed' }    // Đã hoàn thành
];

/**
 * Get event status label by value
 * @param {number|string} value - Event status value (0-3) or string
 * @returns {string} Event status label
 */
export const getEventStatusLabel = (value) => {
  // Handle string values (from backend response)
  if (typeof value === 'string') {
    return value;
  }
  
  const status = EVENT_STATUS_OPTIONS.find(s => s.value === parseInt(value));
  return status ? status.label : `Status ${value}`;
};

/**
 * Get event status value by label
 * @param {string} label - Event status label
 * @returns {number} Event status value
 */
export const getEventStatusValue = (label) => {
  if (label === undefined || label === null) return 0;
  // Normalize: case-insensitive comparison
  const normalized = String(label).toLowerCase();
  const status = EVENT_STATUS_OPTIONS.find(
    s => s.label.toLowerCase() === normalized
  );
  return status ? status.value : 0;
};

