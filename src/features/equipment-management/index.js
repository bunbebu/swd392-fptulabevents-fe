// Equipment Management Feature Exports

// Common components (both Admin and Lecturer can access)
export { default as EquipmentList } from './components/EquipmentList';
export { default as EquipmentDetail } from './components/EquipmentDetail';

// Admin-only components
export { default as EquipmentManagement } from './admin/EquipmentManagement';
export { default as EquipmentForm } from './admin/EquipmentForm';
export { default as EditEquipment } from './admin/EditEquipment';
export { default as EquipmentStatusForm } from './admin/EquipmentStatusForm';

// Lecturer-only components
export { default as EquipmentAvailability } from './lecture/EquipmentAvailability';

// Re-export API for convenience
export { equipmentApi } from '../../api';

