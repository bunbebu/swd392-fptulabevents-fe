import React from 'react';
import RoomList from '../components/RoomList';

/**
 * Room Management Component - Admin Only
 * 
 * Full CRUD operations for room management
 * 
 * Related User Stories:
 * - US-09: Admin - Manage labs and equipment (High Priority, Approved)
 * 
 * Related Use Cases:
 * - UC-10: Manage Rooms (Admin) - High Priority
 * - UC-40: Room Status Update (Admin) - Medium Priority
 */
const RoomManagement = () => {
  return <RoomList />;
};

export default RoomManagement;
