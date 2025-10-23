import React, { useState, useEffect, useRef } from 'react';
import { UserList } from '../features/user-management';
import { EquipmentList, EquipmentDetail } from '../features/equipment-management';
import EditEquipment from '../features/equipment-management/admin/EditEquipment';
import { RoomList } from '../features/room-management';
import RoomDetail from '../features/room-management/components/RoomDetail';
import { LabList, LabDetail } from '../features/lab-management';
import CreateLab from '../features/lab-management/admin/CreateLab';
import EditLab from '../features/lab-management/admin/EditLab';
import { EditEvent } from '../features/event-management/admin';
import { EventList, EventDetail } from '../features/event-management';
import { NotificationManagement } from '../features/notification-management';
import { authApi } from '../api';

const AdminDashboard = ({ user: userProp }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState(userProp);
  const [viewingRoomId, setViewingRoomId] = useState(null);
  const [viewingLabId, setViewingLabId] = useState(null);
  const [creatingLab, setCreatingLab] = useState(false);
  const [editingLabId, setEditingLabId] = useState(null);
  const [labToast, setLabToast] = useState(null);
  const [viewingEquipmentId, setViewingEquipmentId] = useState(null);
  const [editingEquipmentId, setEditingEquipmentId] = useState(null);
  const [equipmentToast, setEquipmentToast] = useState(null);
  const [viewingEventId, setViewingEventId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventToast, setEventToast] = useState(null);
  const userDropdownRef = useRef(null);

  // Helper function to generate avatar initials
  const getAvatarInitials = (name) => {
    if (!name) return 'SA';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  // Get user display information with fallbacks
  const displayName = user?.fullname || user?.username || 'Admin';
  const displayEmail = user?.email || 'admin@fpt.edu.vn';
  const avatarInitials = getAvatarInitials(displayName);

  // Load user data from storage if not provided as prop
  useEffect(() => {
    if (!user) {
      const storedUser = window.localStorage.getItem('user') || window.sessionStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user data:', error);
        }
      }
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    try {
      // Clear both storages to be safe
      window.localStorage.removeItem('accessToken');
      window.localStorage.removeItem('refreshToken');
      window.localStorage.removeItem('user');
      window.sessionStorage.removeItem('accessToken');
      window.sessionStorage.removeItem('refreshToken');
      window.sessionStorage.removeItem('user');
    } catch {}
    // Redirect to home page instead of reload to avoid callback route issues
    window.location.href = '/';
  };

  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="9" x="3" y="3" rx="1"></rect>
          <rect width="7" height="5" x="14" y="3" rx="1"></rect>
          <rect width="7" height="9" x="14" y="12" rx="1"></rect>
          <rect width="7" height="5" x="3" y="16" rx="1"></rect>
        </svg>
      )
    },
    { 
      id: 'bookings', 
      label: 'Bookings', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2v4"></path>
          <path d="M16 2v4"></path>
          <rect width="18" height="18" x="3" y="4" rx="2"></rect>
          <path d="M3 10h18"></path>
        </svg>
      )
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <circle cx="9" cy="7" r="4"></circle>
        </svg>
      )
    },
    { 
      id: 'equipment', 
      label: 'Equipment', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      )
    },
    {
      id: 'rooms',
      label: 'Rooms',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9,22 9,12 15,12 15,22"></polyline>
        </svg>
      )
    },
    {
      id: 'labs',
      label: 'Labs',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 2v17.5A2.5 2.5 0 0 1 6.5 22v0A2.5 2.5 0 0 1 4 19.5V2"></path>
          <path d="M20 2v17.5a2.5 2.5 0 0 1-2.5 2.5v0a2.5 2.5 0 0 1-2.5-2.5V2"></path>
          <path d="M3 2h18"></path>
          <path d="M9 16H4"></path>
          <path d="M20 16h-5"></path>
        </svg>
      )
    },
    {
      id: 'events',
      label: 'Events',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
          <line x1="16" x2="16" y1="2" y2="6"></line>
          <line x1="8" x2="8" y1="2" y2="6"></line>
          <line x1="3" x2="21" y1="10" y2="10"></line>
        </svg>
      )
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
        </svg>
      )
    },
    { 
      id: 'permissions', 
      label: 'Permissions', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
          <circle cx="12" cy="16" r="1"></circle>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      )
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
          <path d="M18 17V9"></path>
          <path d="M13 17V5"></path>
          <path d="M8 17v-3"></path>
        </svg>
      )
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      )
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'bookings':
        return (
          <div className="admin-content">
            <h2>Booking Management</h2>
            <p>Manage and approve lab booking requests</p>
            {/* TODO: Implement booking management */}
          </div>
        );
      case 'users':
        return (
          <div className="admin-content">
            <UserList />
          </div>
        );
      case 'equipment':
        if (editingEquipmentId) {
          return (
            <div className="admin-content">
              <EditEquipment
                equipmentId={editingEquipmentId}
                onNavigateBack={() => setEditingEquipmentId(null)}
                onSuccess={() => {
                  setEditingEquipmentId(null);
                  setEquipmentToast({ message: 'Equipment updated successfully!', type: 'success' });
                }}
              />
            </div>
          );
        }
        if (viewingEquipmentId) {
          return (
            <div className="admin-content">
              <EquipmentDetail
                equipmentId={viewingEquipmentId}
                onNavigateBack={() => setViewingEquipmentId(null)}
              />
            </div>
          );
        }
        return (
          <div className="admin-content">
            <EquipmentList 
              userRole="Admin" 
              onViewEquipment={(equipmentId) => setViewingEquipmentId(equipmentId)}
              onEditEquipment={(equipmentId) => setEditingEquipmentId(equipmentId)}
              initialToast={equipmentToast}
              onToastShown={() => setEquipmentToast(null)}
            />
          </div>
        );
      case 'rooms':
        if (viewingRoomId) {
          return (
            <div className="admin-content">
              <RoomDetail
                roomId={viewingRoomId}
                onNavigateBack={() => setViewingRoomId(null)}
              />
            </div>
          );
        }
        return (
          <div className="admin-content">
            <RoomList
              userRole="Admin"
              onViewRoom={(roomId) => setViewingRoomId(roomId)}
            />
          </div>
        );
      case 'labs':
        if (creatingLab) {
          return (
            <div className="admin-content">
              <CreateLab
                onNavigateBack={() => setCreatingLab(false)}
                onSuccess={() => {
                  setCreatingLab(false);
                  setLabToast({ message: 'Lab created successfully!', type: 'success' });
                }}
              />
            </div>
          );
        }
        if (editingLabId) {
          return (
            <div className="admin-content">
              <EditLab
                labId={editingLabId}
                onNavigateBack={() => setEditingLabId(null)}
                onSuccess={() => {
                  setEditingLabId(null);
                  setLabToast({ message: 'Lab updated successfully!', type: 'success' });
                }}
              />
            </div>
          );
        }
        if (viewingLabId) {
          return (
            <div className="admin-content">
              <LabDetail
                labId={viewingLabId}
                onNavigateBack={() => setViewingLabId(null)}
              />
            </div>
          );
        }
        return (
          <div className="admin-content">
            <LabList 
              userRole="Admin" 
              onViewLab={(labId) => setViewingLabId(labId)}
              onCreateLab={() => setCreatingLab(true)}
              onEditLab={(labId) => setEditingLabId(labId)}
              initialToast={labToast}
              onToastShown={() => setLabToast(null)}
            />
          </div>
        );
      case 'events':
        if (editingEventId) {
          return (
            <div className="admin-content">
              <EditEvent
                eventId={editingEventId}
                onNavigateBack={() => setEditingEventId(null)}
                onSuccess={() => {
                  setEditingEventId(null);
                  setEventToast({ message: 'Event updated successfully!', type: 'success' });
                }}
              />
            </div>
          );
        }
        if (viewingEventId) {
          return (
            <div className="admin-content">
              <EventDetail
                eventId={viewingEventId}
                onNavigateBack={() => setViewingEventId(null)}
              />
            </div>
          );
        }
        return (
          <div className="admin-content">
            <EventList 
              userRole="Admin" 
              onViewEvent={(eventId) => setViewingEventId(eventId)}
              onEditEvent={(eventId) => setEditingEventId(eventId)}
              initialToast={eventToast}
              onToastShown={() => setEventToast(null)}
            />
          </div>
        );
      case 'notifications':
        return (
          <div className="admin-content">
            <NotificationManagement />
          </div>
        );
      case 'permissions':
        return (
          <div className="admin-content">
            <h2>Permission Matrix</h2>
            <p>Configure user permissions and access levels</p>
            {/* TODO: Implement permission management */}
          </div>
        );
      case 'reports':
        return (
          <div className="admin-content">
            <h2>Reports & Analytics</h2>
            <p>Generate usage reports and analytics</p>
            {/* TODO: Implement reports */}
          </div>
        );
      case 'settings':
        return (
          <div className="admin-content">
            <h2>System Settings</h2>
            <p>Configure system-wide settings</p>
            {/* TODO: Implement settings */}
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => {
    const recentBookings = [
      { id: 1, name: 'John Doe', email: 'john@fpt.edu.vn', date: '9/27/2025', status: 'Active' },
      { id: 2, name: 'Jane Smith', email: 'jane@fpt.edu.vn', date: '9/26/2025', status: 'Active' },
      { id: 3, name: 'Mike Johnson', email: 'mike@fpt.edu.vn', date: '9/25/2025', status: 'Pending' },
      { id: 4, name: 'Sarah Wilson', email: 'sarah@fpt.edu.vn', date: '9/24/2025', status: 'Active' },
      { id: 5, name: 'David Brown', email: 'david@fpt.edu.vn', date: '9/23/2025', status: 'Active' }
    ];

    return (
      <div className="dashboard-overview">
        
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {displayName}. Manage bookings, users, and platform analytics</p>
          </div>
          <div className="dashboard-actions">
            <button className="btn-new-booking">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              New Booking
            </button>
            <button className="btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Manage Plans
            </button>
          </div>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-card-header">
                <div className="stat-info">
                  <h3>Total Bookings</h3>
                  <p className="stat-number">48</p>
                  <p className="stat-change">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 7h10v10"></path>
                      <path d="M7 17 17 7"></path>
                    </svg>
                    +12% from last month
                  </p>
                </div>
                <div className="stat-icon blue">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-card-header">
                <div className="stat-info">
                  <h3>Active Bookings</h3>
                  <p className="stat-number">1</p>
                  <p className="stat-change">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 7h10v10"></path>
                      <path d="M7 17 17 7"></path>
                    </svg>
                    +8% from last month
                  </p>
                </div>
                <div className="stat-icon green">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-card-header">
                <div className="stat-info">
                  <h3>Total Revenue</h3>
                  <p className="stat-number">$29.99</p>
                  <p className="stat-change">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 7h10v10"></path>
                      <path d="M7 17 17 7"></path>
                    </svg>
                    +15% from last month
                  </p>
                </div>
                <div className="stat-icon yellow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" x2="12" y1="2" y2="22"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-card-header">
                <div className="stat-info">
                  <h3>Monthly Revenue</h3>
                  <p className="stat-number">$29.99</p>
                  <p className="stat-change">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 7h10v10"></path>
                      <path d="M7 17 17 7"></path>
                    </svg>
                    +22% from last month
                  </p>
                </div>
                <div className="stat-icon purple">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                    <polyline points="16 7 22 7 22 13"></polyline>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="feature-cards">
          <div className="feature-card">
            <div className="feature-card-content">
              <div className="feature-icon blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="feature-content">
                <h3>Manage Bookings</h3>
                <p>View and manage all bookings and their status</p>
              </div>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-card-content">
              <div className="feature-icon purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" x2="12" y1="20" y2="10"></line>
                  <line x1="18" x2="18" y1="20" y2="4"></line>
                  <line x1="6" x2="6" y1="20" y2="16"></line>
                </svg>
              </div>
              <div className="feature-content">
                <h3>Room Management</h3>
                <p>Configure rooms and equipment</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="recent-section">
          <div className="recent-header">
            <div className="recent-title">
              <h2>Recent Bookings & Their Status</h2>
              <button className="view-all-btn" onClick={() => setActiveTab('bookings')}>View All</button>
            </div>
          </div>
          
          <div className="recent-content">
            <div className="bookings-list">
              {recentBookings.map(booking => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-info">
                    <div className="booking-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    <div className="booking-details">
                      <h4>{booking.name}</h4>
                      <p>{booking.email}</p>
                    </div>
                  </div>
                  <div className="booking-meta">
                    <p className="booking-date">{booking.date}</p>
                    <span className={`status-badge ${booking.status.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-page">
      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="20" y1="12" y2="12"></line>
          <line x1="4" x2="20" y1="6" y2="6"></line>
          <line x1="4" x2="20" y1="18" y2="18"></line>
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-background"></div>
        
        <div className="sidebar-content">
          <button 
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>

          <div className="sidebar-brand">
            <div className="brand-logo">FL</div>
            <div className="brand-text">
              <h3>FPT Lab Events</h3>
              <p>ADMIN PANEL</p>
            </div>
          </div>
          
          <div className="sidebar-nav-section">
            <div className="section-label">ADMIN</div>
        <nav className="sidebar-nav">
          {tabs.map(tab => (
                <div
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
                  <div className="nav-item-content">
                    <div className="nav-icon">{tab.icon}</div>
              <span className="nav-label">{tab.label}</span>
                  </div>
                </div>
          ))}
        </nav>
      </div>
      
          <div className="sidebar-user">
            <div className="user-profile">
              <div className="user-avatar">{avatarInitials}</div>
              <div className="user-info">
                <p className="user-name">{displayName}</p>
                <p className="user-role">Administrator</p>
              </div>
              <button className="logout-btn" onClick={async () => {
                try {
                  await authApi.logout();
                } catch {}
                const storage = window.localStorage.getItem('accessToken') ? window.localStorage : window.sessionStorage;
                storage.removeItem('accessToken');
                storage.removeItem('refreshToken');
                storage.removeItem('user');
                // Redirect to home page instead of reload to avoid callback route issues
                window.location.href = '/';
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" x2="9" y1="12" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-content">
            <div className="header-left">
              <div className="header-search">
                <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
                <input 
                  type="text" 
                  placeholder="Search bookings, users, rooms..." 
                  className="search-input"
                />
              </div>
            </div>
            
            <div className="header-right">
              <div className="header-icons">
                <button className="icon-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2"></path>
                    <path d="M12 20v2"></path>
                    <path d="m4.93 4.93 1.41 1.41"></path>
                    <path d="m17.66 17.66 1.41 1.41"></path>
                    <path d="M2 12h2"></path>
                    <path d="M20 12h2"></path>
                    <path d="m6.34 17.66-1.41 1.41"></path>
                    <path d="m19.07 4.93-1.41 1.41"></path>
                  </svg>
                </button>
                <button className="icon-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.268 21a2 2 0 0 0 3.464 0"></path>
                    <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>
                  </svg>
                </button>
                <button className="icon-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
              
              <div className="header-user" ref={userDropdownRef} onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
                <div className="user-details">
                  <div className="user-info-header">
                    <p className="user-name">{displayName}</p>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`dropdown-arrow ${userDropdownOpen ? 'open' : ''}`}>
                      <path d="m6 9 6 6 6-6"></path>
                    </svg>
                  </div>
                  <p className="user-role">Administrator</p>
                </div>
                <div className="user-avatar-small">{avatarInitials}</div>
                
                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <p className="dropdown-name">{displayName}</p>
                      <p className="dropdown-email">{displayEmail}</p>
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-menu">
                      <div className="dropdown-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>Profile</span>
                      </div>
                      <div className="dropdown-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        <span>Settings</span>
                      </div>
                      <div className="dropdown-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="20" x2="18" y2="10"></line>
                          <line x1="12" y1="20" x2="12" y2="4"></line>
                          <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                        <span>Reports</span>
                      </div>
                      <div className="dropdown-item sign-out" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" x2="9" y1="12" y2="12"></line>
                        </svg>
                        <span>Sign out</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="admin-content">
          <div className="content-wrapper">
        {renderContent()}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="admin-footer">
          <div className="footer-content">
            © 2025 FPT Lab Events. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminDashboard;
