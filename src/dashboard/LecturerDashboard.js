import React, { useState, useEffect, useRef } from 'react';
import { EventList, EventDetail } from '../features/event-management';
import { EditEvent } from '../features/event-management/admin';
import { EquipmentList } from '../features/equipment-management';
import LecturerReportsManagement from '../features/reports-management/lecturer/LecturerReportsManagement';
import LecturerNotifications from '../features/notification-management/lecturer/LecturerNotifications';
import { authApi, bookingApi, eventApi, labsApi, roomsApi, equipmentApi, reportsApi, notificationApi } from '../api';
import UserReportForm from '../features/reports-management/user/UserReportForm';

const LecturerDashboard = ({ user: userProp }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState(userProp);
  const [viewingEventId, setViewingEventId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventToast, setEventToast] = useState(null);
  const userDropdownRef = useRef(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Dashboard data states
  const [pendingBookings, setPendingBookings] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [bookingNames, setBookingNames] = useState({}); // Store user and room names
  const [dashboardStats, setDashboardStats] = useState({
    pendingApprovals: 0,
    myEventsCount: 0,
    totalParticipants: 0,
    approvedBookingsThisMonth: 0,
    totalLabs: 0,
    totalRooms: 0,
    availableEquipment: 0,
    unreadNotifications: 0,
    myReportsCount: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Helper function to generate avatar initials
  const getAvatarInitials = (name) => {
    if (!name) return 'LC';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };


  // Get user display information with fallbacks
  const displayName = user?.fullname || user?.username || 'Lecturer';
  const displayEmail = user?.email || 'lecturer@fpt.edu.vn';
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

  // Load dashboard statistics and data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (activeTab !== 'dashboard') return;

      setLoadingStats(true);
      try {
        // Fetch data in parallel with count APIs
        const [
          allBookings,
          allEvents,
          labCount,
          roomCount,
          equipmentCount,
          notificationCount,
          reportCount
        ] = await Promise.all([
          bookingApi.getBookings({ page: 1, pageSize: 1000 }).catch((error) => {
            console.error('Error fetching bookings:', error);
            return [];
          }),
          eventApi.getEvents({ page: 0, pageSize: 1000 }).catch(() => []),
          labsApi.getLabCount().catch(() => 0),
          roomsApi.getRoomCount().catch(() => 0),
          equipmentApi.getAvailableEquipmentCount().catch(() => 0),
          notificationApi.getUnreadNotificationCount().catch(() => ({ count: 0 })),
          reportsApi.getUserReportsCount().catch(() => ({ count: 0 }))
        ]);

        // Filter pending bookings (Status 0 = Pending)
        console.log('All bookings:', allBookings);
        console.log('Bookings length:', Array.isArray(allBookings) ? allBookings.length : 'Not an array');
        
        const pendingBookingsList = Array.isArray(allBookings)
          ? allBookings.filter(b => {
              console.log('Booking status:', b.status, 'Type:', typeof b.status);
              console.log('Booking data:', b); // Log full booking data
              return b.status === 0 || b.status === '0' || b.status === 'Pending';
            }).slice(0, 5) // Get first 5 pending
          : [];
          
        console.log('Pending bookings:', pendingBookingsList);

        // Filter events created by current lecturer
        const lecturerEvents = Array.isArray(allEvents)
          ? allEvents.filter(e => {
              const eventCreator = e.createdBy || e.CreatedBy || '';
              const creatorLc = String(eventCreator || '').toLowerCase();
              const possibleMatches = [
                user?.fullname,
                user?.username,
                user?.email
              ]
              .filter(Boolean)
              .map(v => String(v).toLowerCase());
              // Backend returns CreatedBy as Fullname; match against fullname/username/email
              return possibleMatches.includes(creatorLc);
            })
          : [];

        // Calculate active events
        const activeEvents = lecturerEvents.filter(e => {
          const status = e.status || e.Status;
          return status === 'Active' || status === 0 || String(status).toLowerCase() === 'active';
        });

        // Calculate total participants from bookings count
        const totalParticipants = activeEvents.reduce((sum, event) => {
          return sum + (event.bookingCount || event.BookingCount || 0);
        }, 0);

        // Calculate approved bookings this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const approvedThisMonth = Array.isArray(allBookings)
          ? allBookings.filter(b => {
              if (b.status !== 1) return false; // Status 1 = Approved
              const bookingDate = new Date(b.createdAt || b.CreatedAt);
              return bookingDate >= startOfMonth;
            }).length
          : 0;

        setPendingBookings(pendingBookingsList);
        setMyEvents(activeEvents.slice(0, 10)); // Show first 10 events
        
        // Booking data already includes UserName and RoomName from backend
        const namesMap = {};
        for (const booking of pendingBookingsList) {
          const bookingId = booking.id || booking.Id;
          const userName = booking.userName || booking.UserName || 'Student Booking';
          const roomName = booking.roomName || booking.RoomName || 'Unknown Room';
          
          namesMap[bookingId] = { 
            userName, 
            roomName 
          };
        }
        setBookingNames(namesMap);
        
        setDashboardStats({
          pendingApprovals: pendingBookingsList.length,
          myEventsCount: activeEvents.length,
          totalParticipants,
          approvedBookingsThisMonth: approvedThisMonth,
          totalLabs: labCount,
          totalRooms: roomCount,
          availableEquipment: equipmentCount,
          unreadNotifications: notificationCount?.count || notificationCount?.Count || 0,
          myReportsCount: reportCount?.count || reportCount?.Count || 0
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadDashboardData();
  }, [activeTab, user]);

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

  const loadRecentNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const list = await notificationApi.getUserNotifications({ page: 1, pageSize: 10 });
      const items = Array.isArray(list) ? list : (list?.data || list?.Data || []);
      setRecentNotifications(items);
    } catch (e) {
      setRecentNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const refreshUnreadCount = async () => {
    try {
      const count = await notificationApi.getUnreadNotificationCount();
      setUnreadCount(typeof count === 'number' ? count : (count?.count || count?.Count || 0));
    } catch (_e) {
      // ignore
    }
  };

  useEffect(() => {
    refreshUnreadCount();
    // Optionally refresh every 60s
    const t = setInterval(refreshUnreadCount, 60000);
    return () => clearInterval(t);
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

  const handleReportSubmit = async (reportData) => {
    try {
      setReportLoading(true);
      await reportsApi.createReport(reportData);
      setShowReportModal(false);
      setActiveTab('reports');
    } catch (_e) {
      setShowReportModal(false);
    } finally {
      setReportLoading(false);
    }
  };

  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="9" x="3" y="3" rx="1"></rect>
          <rect width="7" height="5" x="14" y="3" rx="1"></rect>
          <rect width="7" height="9" x="14" y="12" rx="1"></rect>
          <rect width="7" height="5" x="3" y="16" rx="1"></rect>
        </svg>
      )
    },
    
    { 
      id: 'events', 
      label: 'Events', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2v4"></path>
          <path d="M16 2v4"></path>
          <rect width="1.125rem" height="1.125rem" x="3" y="4" rx="2"></rect>
          <path d="M3 10h18"></path>
        </svg>
      )
    },

    { 
      id: 'equipment', 
      label: 'Equipment', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      )
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
      )
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      
      case 'events':
        if (editingEventId) {
          return (
            <div className="lecturer-content">
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
            <div className="lecturer-content">
              <EventDetail
                eventId={viewingEventId}
                onNavigateBack={() => setViewingEventId(null)}
                onEditEvent={(id) => setEditingEventId(id)}
              />
            </div>
          );
        }
        return (
          <div className="lecturer-content">
            <EventList
              userRole="Lecturer"
              onViewEvent={(eventId) => setViewingEventId(eventId)}
              onEditEvent={(eventId) => setEditingEventId(eventId)}
              initialToast={eventToast}
              onToastShown={() => setEventToast(null)}
            />
          </div>
        );

      case 'equipment':
        return (
          <div className="lecturer-content">
            <EquipmentList userRole="Lecturer" />
          </div>
        );

      case 'reports':
        return (
          <div className="lecturer-content">
            <LecturerReportsManagement />
          </div>
        );
      case 'notifications':
        return (
          <div className="lecturer-content">
            <LecturerNotifications />
          </div>
        );
      case 'settings':
        return (
          <div className="lecturer-content">
            <h2>Settings</h2>
            <p>Manage your preferences and notification settings</p>
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

    // Helper function to format time range
    const formatTimeRange = (startDate, endDate) => {
      if (!startDate || !endDate) return 'N/A';
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';

        const startTime = start.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        const endTime = end.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        return `${startTime} - ${endTime}`;
      } catch {
        return 'N/A';
      }
    };

    return (
      <div className="dashboard-overview">
        
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Lecturer Dashboard</h1>
            <p>Welcome back, {displayName}. Manage bookings, events, and track attendance</p>
          </div>
          <div className="dashboard-actions">
            <button className="btn-new-booking">
              <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              Create Event
            </button>
            <button className="btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v4"></path>
                <path d="M16 2v4"></path>
                <rect width="1.125rem" height="1.125rem" x="3" y="4" rx="2"></rect>
                <path d="M3 10h18"></path>
              </svg>
              View Calendar
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
                    <h3>Pending Approvals</h3>
                    <p className="stat-number">{dashboardStats.pendingApprovals}</p>
                    <p className="stat-change">
                      <svg xmlns="http://www.w3.org/2000/svg" width="0.75rem" height="0.75rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 7h10v10"></path>
                        <path d="M7 17 17 7"></path>
                      </svg>
                      Requires your attention
                    </p>
                  </div>
                  <div className="stat-icon orange">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect>
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                      <path d="M9 14l2 2 4-4"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-content">
                <div className="stat-card-header">
                  <div className="stat-info">
                    <h3>My Events</h3>
                    <p className="stat-number">{dashboardStats.myEventsCount}</p>
                    <p className="stat-change">
                      <svg xmlns="http://www.w3.org/2000/svg" width="0.75rem" height="0.75rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 7h10v10"></path>
                        <path d="M7 17 17 7"></path>
                      </svg>
                      All active events
                    </p>
                  </div>
                  <div className="stat-icon green">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 2v4"></path>
                      <path d="M16 2v4"></path>
                      <rect width="1.125rem" height="1.125rem" x="3" y="4" rx="2"></rect>
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
                    <h3>Total Participants</h3>
                    <p className="stat-number">{dashboardStats.totalParticipants}</p>
                  <p className="stat-change">
                    <svg xmlns="http://www.w3.org/2000/svg" width="0.75rem" height="0.75rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 7h10v10"></path>
                      <path d="M7 17 17 7"></path>
                    </svg>
                    Across all events
                  </p>
                </div>
                <div className="stat-icon blue">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
            <div className="stat-card">
              <div className="stat-card-content">
                <div className="stat-card-header">
                  <div className="stat-info">
                    <h3>This Month</h3>
                    <p className="stat-number">{dashboardStats.approvedBookingsThisMonth}</p>
                    <p className="stat-change">
                      <svg xmlns="http://www.w3.org/2000/svg" width="0.75rem" height="0.75rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 7h10v10"></path>
                        <path d="M7 17 17 7"></path>
                      </svg>
                      Approved bookings
                    </p>
                  </div>
                  <div className="stat-icon purple">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                      <polyline points="16 7 22 7 22 13"></polyline>
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
              <h2>Pending Booking Approvals</h2>
              <button className="view-all-btn" onClick={() => setActiveTab('approvals')}>View All</button>
            </div>
          </div>
          
          <div className="recent-content">
            <div className="bookings-list">
              {pendingBookings.length === 0 ? (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" width="3rem" height="3rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    <rect width="20" height="14" x="2" y="6" rx="2"></rect>
                  </svg>
                  <p>No pending bookings</p>
                </div>
              ) : (
                pendingBookings.slice(0, 5).map(booking => {
                  const bookingId = booking.id || booking.Id;
                  const startTime = booking.startTime || booking.StartTime;
                  const endTime = booking.endTime || booking.EndTime;
                  const purpose = booking.purpose || booking.Purpose || 'No purpose specified';

                  // Get names from state
                  const names = bookingNames[bookingId] || { userName: 'Loading...', roomName: 'Loading...' };

                  return (
                    <div key={bookingId} className="booking-card">
                      <div className="booking-info">
                        <div className="booking-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="1.25rem" height="1.25rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                        </div>
                        <div className="booking-details">
                          <h4>{names.userName}</h4>
                          <p>{names.roomName}</p>
                          <p className="booking-purpose">{purpose}</p>
                        </div>
                      </div>
                      <div className="booking-meta">
                        <p className="booking-date">{formatDate(startTime)}</p>
                        <p className="booking-time">{formatTimeRange(startTime, endTime)}</p>
                        <span className="status-badge pending">
                          Pending
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="recent-section">
          <div className="recent-header">
            <div className="recent-title">
              <h2>My Active Events</h2>
              <button className="view-all-btn" onClick={() => setActiveTab('events')}>View All</button>
            </div>
          </div>
          
          <div className="recent-content">
            <div className="bookings-list">
              {myEvents.length === 0 ? (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" width="3rem" height="3rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2v4"></path>
                    <path d="M16 2v4"></path>
                    <rect width="1.125rem" height="1.125rem" x="3" y="4" rx="2"></rect>
                    <path d="M3 10h18"></path>
                  </svg>
                  <p>No active events</p>
                </div>
              ) : (
                myEvents.map(event => {
                  const eventId = event.id || event.Id;
                  const title = event.title || event.Title || 'Untitled Event';
                  const startDate = event.startDate || event.StartDate;
                  const endDate = event.endDate || event.EndDate;
                  const location = event.location || event.Location || 'N/A';
                  const bookingCount = event.bookingCount || event.BookingCount || 0;
                  const status = event.status || event.Status || 'Unknown';

                  return (
                    <div key={eventId} className="booking-card">
                      <div className="booking-info">
                        <div className="booking-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="1.25rem" height="1.25rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 2v4"></path>
                            <path d="M16 2v4"></path>
                            <rect width="1.125rem" height="1.125rem" x="3" y="4" rx="2"></rect>
                            <path d="M3 10h18"></path>
                          </svg>
                        </div>
                        <div className="booking-details">
                          <h4>{title}</h4>
                          <p>{formatDate(startDate)} • {formatTimeRange(startDate, endDate)}</p>
                          <p className="booking-purpose">{location} • {bookingCount} participants</p>
                        </div>
                      </div>
                      <div className="booking-meta">
                        <span className={`status-badge ${typeof status === 'string' ? status.toLowerCase() : 'active'}`}>
                          {typeof status === 'string' ? status : 'Active'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
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
        <svg xmlns="http://www.w3.org/2000/svg" width="1.375rem" height="1.375rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>

          <div className="sidebar-brand">
            <img src={require('../assets/images/fpt.png')} alt="FPT Logo" className="brand-logo" style={{ objectFit: 'contain' }} />
            <div className="brand-text">
              <h3>FPT Lab Events</h3>
              <p>LECTURER PORTAL</p>
            </div>
          </div>
          
          <div className="sidebar-nav-section">
            <div className="section-label">LECTURER</div>
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
                <p className="user-role">Lecturer</p>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
                <input 
                  type="text" 
                  placeholder="Search bookings, events..." 
                  className="search-input"
                />
              </div>
            </div>
            
            <div className="header-right">
              <div className="header-icons">
                <button 
                  className="icon-btn"
                  title="Create Report"
                  onClick={() => setShowReportModal(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                    <line x1="4" y1="22" x2="4" y2="15"></line>
                  </svg>
                </button>
                <div 
                  className="icon-btn notification-wrapper" 
                  onMouseEnter={() => { setNotificationDropdownOpen(true); loadRecentNotifications(); refreshUnreadCount(); }}
                  onMouseLeave={() => setNotificationDropdownOpen(false)}
                  onClick={() => { setActiveTab('notifications'); }}
                  style={{ position: 'relative', cursor: 'pointer' }}
                  title="Notifications"
                  role="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                  </svg>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: '#ef4444',
                        color: '#fff',
                        borderRadius: '9999px',
                        minWidth: '18px',
                        height: '18px',
                        lineHeight: '18px',
                        padding: '0 5px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        boxShadow: '0 0 0 2px #fff'
                      }}
                      aria-label={`${unreadCount} unread notifications`}
                    >
                      {unreadCount > 10 ? '10+' : unreadCount}
                    </span>
                  )}
                  {notificationDropdownOpen && (
                    <div 
                      className="notification-dropdown" 
                      style={{
                        position: 'absolute',
                        top: '110%',
                        right: 0,
                        width: '20rem',
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
                        zIndex: 20
                      }}
                    >
                      <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                        <strong>Notifications</strong>
                      </div>
                      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                        {loadingNotifications ? (
                          <div style={{ padding: '12px', color: '#64748b' }}>Loading...</div>
                        ) : recentNotifications.length === 0 ? (
                          <div style={{ padding: '12px', color: '#64748b' }}>No notifications</div>
                        ) : (
                          recentNotifications.map((n) => {
                            const id = n.id || n.Id;
                            const title = n.title || n.Title || 'Notification';
                            const content = n.content || n.Content || '';
                            const startDate = n.startDate || n.StartDate;
                            const status = n.status || n.Status;
                            const dateStr = startDate ? new Date(startDate).toLocaleString() : '';
                            return (
                              <div key={id} style={{ padding: '10px 12px', borderBottom: '1px solid #f8fafc' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{dateStr}</span>
                                </div>
                                {content && (
                                  <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {content}
                                  </div>
                                )}
                                {status && (
                                  <div style={{ marginTop: 6, fontSize: '0.7rem', color: '#475569' }}>{String(status)}</div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div style={{ padding: '8px', borderTop: '1px solid #f1f5f9' }}>
                        <button 
                          className="btn-secondary" 
                          onClick={() => setActiveTab('notifications')} 
                          style={{ width: '100%' }}
                        >
                          View all
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="header-user" ref={userDropdownRef} onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
                <div className="user-details">
                  <div className="user-info-header">
                    <p className="user-name">{displayName}</p>
                    <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`dropdown-arrow ${userDropdownOpen ? 'open' : ''}`}>
                      <path d="m6 9 6 6 6-6"></path>
                    </svg>
                  </div>
                  <p className="user-role">Lecturer</p>
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>Profile</span>
                      </div>
                      <div className="dropdown-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        <span>Settings</span>
                      </div>
                      <div className="dropdown-item sign-out" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Report Form Modal */}
      {showReportModal && (
        <UserReportForm
          onSubmit={handleReportSubmit}
          onCancel={() => setShowReportModal(false)}
          loading={reportLoading}
        />
      )}
    </div>
  );
};

export default LecturerDashboard;

