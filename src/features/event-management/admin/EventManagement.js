import React from 'react';
import EventList from '../components/EventList';

/**
 * Event Management Component - Admin Only
 *
 * Main entry point for event management
 * Renders the EventList component with admin capabilities
 *
 * Related Use Cases:
 * - UC-XX: Manage Events (Admin)
 */
const EventManagement = () => {
  return <EventList />;
};

export default EventManagement;

