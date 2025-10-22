/**
 * Equipment Constants
 * 
 * Defines equipment types and status options based on backend enums
 * 
 * Backend Reference:
 * - EquipmentType enum: SWD392-BE\FPTU Lab Events\DomainLayer\Enum\EquipmentType.cs
 * - EquipmentStatus enum: SWD392-BE\FPTU Lab Events\DomainLayer\Enum\EquipmentStatus.cs
 */

/**
 * Equipment Type Options
 * Maps to backend EquipmentType enum (0-6)
 */
export const EQUIPMENT_TYPE_OPTIONS = [
  { value: 0, label: 'Computer' },      // Máy tính
  { value: 1, label: 'Projector' },     // Máy chiếu
  { value: 2, label: 'Printer' },       // Máy in
  { value: 3, label: 'Scanner' },       // Máy scan
  { value: 4, label: 'Network' },       // Thiết bị mạng
  { value: 5, label: 'Audio' },         // Thiết bị âm thanh
  { value: 6, label: 'Other' }          // Khác
];

/**
 * Equipment Status Options
 * Maps to backend EquipmentStatus enum (0-4)
 */
export const EQUIPMENT_STATUS_OPTIONS = [
  { value: 0, label: 'Available' },     // Có sẵn
  { value: 1, label: 'In Use' },        // Đang sử dụng
  { value: 2, label: 'Maintenance' },   // Bảo trì
  { value: 3, label: 'Broken' },        // Hỏng
  { value: 4, label: 'Unavailable' }    // Không khả dụng
];

/**
 * Get equipment type label by value
 * @param {number} value - Equipment type value (0-6)
 * @returns {string} Equipment type label
 */
export const getEquipmentTypeLabel = (value) => {
  const type = EQUIPMENT_TYPE_OPTIONS.find(t => t.value === parseInt(value));
  return type ? type.label : `Type ${value}`;
};

/**
 * Get equipment status label by value
 * @param {number|string} value - Equipment status value (0-4) or string
 * @returns {string} Equipment status label
 */
export const getEquipmentStatusLabel = (value) => {
  // Handle string values (from backend response)
  if (typeof value === 'string') {
    return value;
  }
  
  const status = EQUIPMENT_STATUS_OPTIONS.find(s => s.value === parseInt(value));
  return status ? status.label : `Status ${value}`;
};

/**
 * Get equipment type value by label
 * @param {string} label - Equipment type label
 * @returns {number} Equipment type value
 */
export const getEquipmentTypeValue = (label) => {
  const type = EQUIPMENT_TYPE_OPTIONS.find(t => t.label === label);
  return type ? type.value : 0;
};

/**
 * Get equipment status value by label
 * @param {string} label - Equipment status label
 * @returns {number} Equipment status value
 */
export const getEquipmentStatusValue = (label) => {
  if (label === undefined || label === null) return 0;
  // Normalize: accept values like "InUse" or "In Use" (case-insensitive)
  const normalized = String(label).replace(/\s+/g, '').toLowerCase();
  const status = EQUIPMENT_STATUS_OPTIONS.find(
    s => s.label.replace(/\s+/g, '').toLowerCase() === normalized
  );
  return status ? status.value : 0;
};

