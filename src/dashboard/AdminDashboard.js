import React, { useState, useEffect, useRef } from 'react';
import { UserList } from '../features/user-management';
import { RoomList } from '../features/room-management';
import RoomDetail from '../features/room-management/components/RoomDetail';
import { LabList, LabDetail } from '../features/lab-management';
import CreateLab from '../features/lab-management/admin/CreateLab';
import EditLab from '../features/lab-management/admin/EditLab';
import { EditEvent } from '../features/event-management/admin';
import { EventList, EventDetail } from '../features/event-management';
import { NotificationManagement } from '../features/notification-management';
import { ReportManagement } from '../features/reports-management';
import {
  authApi,
  bookingApi,
  userApi,
  labsApi,
  roomsApi,
  equipmentApi,
  eventApi,
  reportsApi
} from '../api';

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
  const [viewingEventId, setViewingEventId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventToast, setEventToast] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const userDropdownRef = useRef(null);

  // Dashboard statistics states
  const [dashboardStats, setDashboardStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    pendingBookings: 0,
    totalUsers: 0,
    totalLabs: 0,
    totalRooms: 0,
    totalEquipment: 0,
    totalEvents: 0,
    totalReports: 0,
    pendingReports: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

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

  // Load dashboard statistics
  useEffect(() => {
    const loadDashboardStats = async () => {
      if (activeTab !== 'dashboard') return;

      setLoadingStats(true);
      try {
        // Fetch all statistics in parallel
        const [
          allBookings,
          allUsers,
          labCount,
          roomCount,
          equipmentCount,
          eventCount,
          pendingReportsData
        ] = await Promise.all([
          bookingApi.getBookings({ page: 1, pageSize: 1000 }).catch(() => []),
          userApi.getAllUsersUnpaged().catch(() => []),
          labsApi.getLabCount().catch(() => 0),
          roomsApi.getRoomCount().catch(() => 0),
          equipmentApi.getEquipmentCount().catch(() => 0),
          eventApi.getEventCount().catch(() => ({ Count: 0 })),
          reportsApi.getPendingReportsCount().catch(() => ({ pendingCount: 0 }))
        ]);

        // Calculate booking statistics
        const totalBookings = Array.isArray(allBookings) ? allBookings.length : 0;
        const activeBookings = Array.isArray(allBookings)
          ? allBookings.filter(b => b.status === 1).length // Status 1 = Approved
          : 0;
        const pendingBookings = Array.isArray(allBookings)
          ? allBookings.filter(b => b.status === 0).length // Status 0 = Pending
          : 0;

        // Extract pending reports count - handle different response formats
        const pendingReportsCount = typeof pendingReportsData === 'number'
          ? pendingReportsData
          : (pendingReportsData?.pendingCount || pendingReportsData?.PendingCount || 0);

        setDashboardStats({
          totalBookings,
          activeBookings,
          pendingBookings,
          totalUsers: Array.isArray(allUsers) ? allUsers.length : 0,
          totalLabs: labCount,
          totalRooms: roomCount,
          totalEquipment: equipmentCount,
          totalEvents: eventCount?.Count || 0,
          totalReports: 0, // Not available from API
          pendingReports: pendingReportsCount
        });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadDashboardStats();
  }, [activeTab]);

  // Load recent bookings for dashboard
  useEffect(() => {
    const loadRecentBookings = async () => {
      if (activeTab !== 'dashboard') return;

      setLoadingBookings(true);
      try {
        // Get recent 5 bookings (page 0, pageSize 5)
        const bookings = await bookingApi.getBookings({
          page: 1, // Frontend uses 1-based, will be converted to 0-based in API
          pageSize: 5
        });

        if (Array.isArray(bookings)) {
          setRecentBookings(bookings);
        }
      } catch (error) {
        console.error('Error loading recent bookings:', error);
      } finally {
        setLoadingBookings(false);
      }
    };

    loadRecentBookings();
  }, [activeTab]);

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
      
      case 'users':
        return (
          <div className="admin-content">
            <UserList />
          </div>
        );
      case 'rooms':
        if (viewingRoomId) {
          return (
            <div className="admin-content">
              <RoomDetail
                roomId={viewingRoomId}
                onNavigateBack={() => setViewingRoomId(null)}
                userRole="Admin"
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
                isAdmin={true}
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
                onEditEvent={(id) => setEditingEventId(id)}
                userRole="Admin"
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
            <ReportManagement />
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
    // Helper function to format date
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } catch {
        return 'N/A';
      }
    };

    // Helper function to get status label and class
    const getStatusInfo = (status) => {
      const statusMap = {
        0: { label: 'Pending', class: 'pending' },
        1: { label: 'Approved', class: 'active' },
        2: { label: 'Rejected', class: 'rejected' },
        3: { label: 'Cancelled', class: 'cancelled' },
        4: { label: 'Completed', class: 'completed' }
      };
      return statusMap[status] || { label: 'Unknown', class: 'unknown' };
    };

    return (
      <div className="dashboard-overview">

        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {displayName}. Manage bookings, users, and platform analytics</p>
          </div>
          <div className="dashboard-actions">
            <button className="btn-secondary" onClick={() => setActiveTab('reports')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
                <path d="M18 17V9"></path>
                <path d="M13 17V5"></path>
                <path d="M8 17v-3"></path>
              </svg>
              View Reports
            </button>
          </div>
        </div>
        
        {loadingStats ? (
          <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>
            <div className="loading-spinner"></div>
            Loading statistics...
          </div>
        ) : (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-content">
                <div className="stat-card-header">
                  <div className="stat-info">
                    <h3>Total Bookings</h3>
                    <p className="stat-number">{dashboardStats.totalBookings}</p>
                    <p className="stat-change">
                      {dashboardStats.pendingBookings > 0 && (
                        <>{dashboardStats.pendingBookings} pending approval</>
                      )}
                    </p>
                  </div>
                  <div className="stat-icon blue">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 2v4"></path>
                      <path d="M16 2v4"></path>
                      <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                      <path d="M3 10h18"></path>
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
                    <p className="stat-number">{dashboardStats.activeBookings}</p>
                    <p className="stat-change">Currently approved</p>
                  </div>
                  <div className="stat-icon green">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-content">
                <div className="stat-card-header">
                  <div className="stat-info">
                    <h3>Total Users</h3>
                    <p className="stat-number">{dashboardStats.totalUsers}</p>
                    <p className="stat-change">Registered accounts</p>
                  </div>
                  <div className="stat-icon purple">
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
                    <h3>Pending Reports</h3>
                    <p className="stat-number">{dashboardStats.pendingReports}</p>
                    <p className="stat-change">
                      {dashboardStats.pendingReports > 0 ? 'Needs attention' : 'All resolved'}
                    </p>
                  </div>
                  <div className="stat-icon yellow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                      <path d="M12 9v4"></path>
                      <path d="M12 17h.01"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="recent-section">
          <div className="recent-header">
            <div className="recent-title">
              <h2>Recent Bookings & Their Status</h2>
              <button className="view-all-btn" onClick={() => setActiveTab('events')}>Manage in Events</button>
            </div>
          </div>

          <div className="recent-content">
            {loadingBookings ? (
              <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>
                <div className="loading-spinner"></div>
                Loading recent bookings...
              </div>
            ) : recentBookings.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                No bookings found
              </div>
            ) : (
              <div className="bookings-list">
                {recentBookings.map(booking => {
                  const statusInfo = getStatusInfo(booking.status);
                  return (
                    <div
                      key={booking.id}
                      className="booking-card"
                      onClick={() => setActiveTab('events')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="booking-info">
                        <div className="booking-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 2v4"></path>
                            <path d="M16 2v4"></path>
                            <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                            <path d="M3 10h18"></path>
                          </svg>
                        </div>
                        <div className="booking-details">
                          <h4>{booking.roomName || 'Unknown Room'}</h4>
                          <p>{booking.userName || 'Unknown User'}</p>
                        </div>
                      </div>
                      <div className="booking-meta">
                        <p className="booking-date">{formatDate(booking.startTime)}</p>
                        <span className={`status-badge ${statusInfo.class}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
            <img src={require('../assets/images/fpt.png')} alt="FPT Logo" className="brand-logo" style={{ objectFit: 'contain' }} />
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
