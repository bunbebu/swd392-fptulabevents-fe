import React, { useState, useEffect, useRef } from 'react';
import { EventList, EventDetail } from '../features/event-management';
import { EditEvent } from '../features/event-management/admin';
import { LabList } from '../features/lab-management';
import { authApi } from '../api';

const LecturerDashboard = ({ user: userProp }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState(userProp);
  const [viewingEventId, setViewingEventId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventToast, setEventToast] = useState(null);
  const userDropdownRef = useRef(null);

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
      id: 'approvals', 
      label: 'Approvals', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          <rect width="20" height="14" x="2" y="6" rx="2"></rect>
        </svg>
      )
    },
    { 
      id: 'events', 
      label: 'Events', 
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
      id: 'labs', 
      label: 'Lab Availability', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9,22 9,12 15,12 15,22"></polyline>
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
      id: 'attendance', 
      label: 'Attendance', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
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
      case 'approvals':
        return (
          <div className="lecturer-content">
            <h2>Booking Approvals</h2>
            <p>Review and approve lab booking requests</p>
            {/* TODO: Implement booking approval management */}
          </div>
        );
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
      case 'labs':
        return (
          <div className="lecturer-content">
            <LabList userRole="Lecturer" />
          </div>
        );
      case 'equipment':
        return (
          <div className="lecturer-content">
            <h2>Equipment Availability</h2>
            <p>View equipment status before approving bookings</p>
            {/* TODO: Implement equipment availability view */}
          </div>
        );
      case 'attendance':
        return (
          <div className="lecturer-content">
            <h2>Attendance Reports</h2>
            <p>Generate and export attendance reports</p>
            {/* TODO: Implement attendance reports */}
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
    const pendingBookings = [
      { id: 1, studentName: 'Nguyen Van A', labName: 'Lab A101', date: '2025-10-15', time: '09:00 - 11:00', purpose: 'Project Development', status: 'Pending' },
      { id: 2, studentName: 'Tran Thi B', labName: 'Lab B203', date: '2025-10-16', time: '14:00 - 16:00', purpose: 'Team Meeting', status: 'Pending' },
      { id: 3, studentName: 'Le Van C', labName: 'Lab C305', date: '2025-10-17', time: '10:00 - 12:00', purpose: 'Research', status: 'Pending' }
    ];

    const myEvents = [
      { id: 1, title: 'React Workshop', date: '2025-10-18', time: '13:00 - 16:00', registered: 35, capacity: 50, status: 'Active' },
      { id: 2, title: 'AI & Machine Learning Seminar', date: '2025-10-20', time: '09:00 - 12:00', registered: 78, capacity: 100, status: 'Active' },
      { id: 3, title: 'Data Science Bootcamp', date: '2025-10-25', time: '08:00 - 17:00', registered: 45, capacity: 60, status: 'Active' }
    ];

    return (
      <div className="dashboard-overview">
        
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Lecturer Dashboard</h1>
            <p>Welcome back, {displayName}. Manage bookings, events, and track attendance</p>
          </div>
          <div className="dashboard-actions">
            <button className="btn-new-booking">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              Create Event
            </button>
            <button className="btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v4"></path>
                <path d="M16 2v4"></path>
                <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                <path d="M3 10h18"></path>
              </svg>
              View Calendar
            </button>
          </div>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-card-header">
                <div className="stat-info">
                  <h3>Pending Approvals</h3>
                  <p className="stat-number">{pendingBookings.length}</p>
                  <p className="stat-change">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 7h10v10"></path>
                      <path d="M7 17 17 7"></path>
                    </svg>
                    Requires your attention
                  </p>
                </div>
                <div className="stat-icon orange">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    <rect width="20" height="14" x="2" y="6" rx="2"></rect>
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
                  <p className="stat-number">{myEvents.length}</p>
                  <p className="stat-change">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 7h10v10"></path>
                      <path d="M7 17 17 7"></path>
                    </svg>
                    All active events
                  </p>
                </div>
                <div className="stat-icon green">
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
                  <h3>Total Participants</h3>
                  <p className="stat-number">{myEvents.reduce((sum, e) => sum + e.registered, 0)}</p>
                  <p className="stat-change">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 7h10v10"></path>
                      <path d="M7 17 17 7"></path>
                    </svg>
                    Across all events
                  </p>
                </div>
                <div className="stat-icon blue">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <p className="stat-number">42</p>
                  <p className="stat-change">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 7h10v10"></path>
                      <path d="M7 17 17 7"></path>
                    </svg>
                    Approved bookings
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
              <div className="feature-icon orange">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  <rect width="20" height="14" x="2" y="6" rx="2"></rect>
                </svg>
              </div>
              <div className="feature-content">
                <h3>Pending Bookings</h3>
                <p>Review and approve lab booking requests from students</p>
              </div>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-card-content">
              <div className="feature-icon green">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2v4"></path>
                  <path d="M16 2v4"></path>
                  <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                  <path d="M3 10h18"></path>
                </svg>
              </div>
              <div className="feature-content">
                <h3>Event Management</h3>
                <p>Create and manage workshops, seminars, and training sessions</p>
              </div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-card-content">
              <div className="feature-icon blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
              </div>
              <div className="feature-content">
                <h3>Attendance Reports</h3>
                <p>Generate and export attendance reports for events</p>
              </div>
            </div>
          </div>
        </div>
        
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    <rect width="20" height="14" x="2" y="6" rx="2"></rect>
                  </svg>
                  <p>No pending bookings</p>
                </div>
              ) : (
                pendingBookings.map(booking => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-info">
                      <div className="booking-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      </div>
                      <div className="booking-details">
                        <h4>{booking.studentName}</h4>
                        <p>{booking.labName}</p>
                        <p className="booking-purpose">{booking.purpose}</p>
                      </div>
                    </div>
                    <div className="booking-meta">
                      <p className="booking-date">{booking.date}</p>
                      <p className="booking-time">{booking.time}</p>
                      <span className={`status-badge ${booking.status.toLowerCase()}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2v4"></path>
                    <path d="M16 2v4"></path>
                    <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                    <path d="M3 10h18"></path>
                  </svg>
                  <p>No active events</p>
                </div>
              ) : (
                myEvents.map(event => (
                  <div key={event.id} className="booking-card">
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
                        <h4>{event.title}</h4>
                        <p>{event.date} • {event.time}</p>
                        <p className="booking-purpose">{event.registered}/{event.capacity} participants</p>
                      </div>
                    </div>
                    <div className="booking-meta">
                      <span className={`status-badge ${event.status.toLowerCase()}`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                ))
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
                  placeholder="Search bookings, events..." 
                  className="search-input"
                />
              </div>
            </div>
            
            <div className="header-right">
              <div className="header-icons">
                <button className="icon-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                  </svg>
                </button>
                <button className="icon-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 1v6m0 6v6"></path>
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

export default LecturerDashboard;

