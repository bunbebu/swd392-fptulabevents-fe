import React, { useState, useEffect, useRef } from 'react';
import { authApi } from '../../api';

function Home({ user: userProp }) {
  const [user, setUser] = useState(userProp);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  // Mock data - will be replaced with API calls later
  const [upcomingBookings] = useState([
    {
      id: '1',
      labName: 'Lab A101',
      location: 'Building A, Floor 1',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '11:00',
      status: 'Approved',
      purpose: 'Project Development'
    },
    {
      id: '2',
      labName: 'Lab B203',
      location: 'Building B, Floor 2',
      date: '2025-10-16',
      startTime: '14:00',
      endTime: '16:00',
      status: 'Pending',
      purpose: 'Team Meeting'
    }
  ]);

  const [upcomingEvents] = useState([
    {
      id: '1',
      title: 'React Workshop',
      organizer: 'Dr. Nguyen Van A',
      date: '2025-10-18',
      time: '13:00 - 16:00',
      location: 'Hall A',
      capacity: 50,
      registered: 35,
      status: 'Registered',
      coverImage: null
    },
    {
      id: '2',
      title: 'AI & Machine Learning Seminar',
      organizer: 'Prof. Tran Thi B',
      date: '2025-10-20',
      time: '09:00 - 12:00',
      location: 'Hall B',
      capacity: 100,
      registered: 78,
      status: 'Open',
      coverImage: null
    }
  ]);

  const [availableLabs] = useState([
    {
      id: '1',
      code: 'LAB-A101',
      name: 'Lab A101',
      location: 'Building A, Floor 1',
      capacity: 30,
      status: 'Available',
      equipment: ['Projector', 'Whiteboard', '30 PCs']
    },
    {
      id: '2',
      code: 'LAB-B203',
      name: 'Lab B203',
      location: 'Building B, Floor 2',
      capacity: 40,
      status: 'Available',
      equipment: ['Smart Board', '40 PCs', 'Sound System']
    },
    {
      id: '3',
      code: 'LAB-C305',
      name: 'Lab C305',
      location: 'Building C, Floor 3',
      capacity: 25,
      status: 'Occupied',
      equipment: ['Projector', '25 PCs']
    }
  ]);

  const [notifications] = useState([
    {
      id: '1',
      type: 'booking',
      title: 'Booking Approved',
      message: 'Your booking for Lab A101 has been approved',
      time: '2 hours ago',
      read: false
    },
    {
      id: '2',
      type: 'event',
      title: 'Event Reminder',
      message: 'React Workshop starts in 3 days',
      time: '5 hours ago',
      read: false
    },
    {
      id: '3',
      type: 'system',
      title: 'System Update',
      message: 'New features available in the booking system',
      time: '1 day ago',
      read: true
    }
  ]);

  // Load user data from storage
  useEffect(() => {
    const storedUser = window.localStorage.getItem('user') || window.sessionStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
  }, []);

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
      window.localStorage.removeItem('accessToken');
      window.localStorage.removeItem('refreshToken');
      window.localStorage.removeItem('user');
      window.sessionStorage.removeItem('accessToken');
      window.sessionStorage.removeItem('refreshToken');
      window.sessionStorage.removeItem('user');
    } catch {}
    window.location.reload();
  };

  // Helper functions
  const getAvatarInitials = (name) => {
    if (!name) return 'U';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  const displayName = user?.fullname || user?.username || 'User';
  const displayEmail = user?.email || 'user@fpt.edu.vn';
  const avatarInitials = getAvatarInitials(displayName);
  const userRole = user?.roles?.[0] || 'Student';
  const isLecturer = user?.roles?.includes('Lecturer') || user?.roles?.includes('Teacher');

  // Navigation tabs - different for Student and Lecturer
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
      id: 'labs',
      label: 'Browse Labs',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      )
    },
    {
      id: 'events',
      label: isLecturer ? 'My Events' : 'Events',
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
      id: 'bookings',
      label: isLecturer ? 'Approvals' : 'My Bookings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          <rect width="20" height="14" x="2" y="6" rx="2"></rect>
        </svg>
      )
    }
  ];

  // Render different content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'labs':
        return renderLabs();
      case 'events':
        return renderEvents();
      case 'bookings':
        return renderBookings();
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="dashboard-overview">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Welcome back, {displayName.split(' ')[0]}! 👋</h1>
          <p>Here's what's happening with your schedule</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn-new-booking">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
            {isLecturer ? 'New Event' : 'New Booking'}
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

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-header">
              <div className="stat-info">
                <h3>Upcoming Bookings</h3>
                <p className="stat-number">{upcomingBookings.length}</p>
                <p className="stat-change">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 7h10v10"></path>
                    <path d="M7 17 17 7"></path>
                  </svg>
                  {upcomingBookings.filter(b => b.status === 'Approved').length} approved
                </p>
              </div>
              <div className="stat-icon blue">
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
                <h3>Registered Events</h3>
                <p className="stat-number">{upcomingEvents.filter(e => e.status === 'Registered').length}</p>
                <p className="stat-change">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 7h10v10"></path>
                    <path d="M7 17 17 7"></path>
                  </svg>
                  {upcomingEvents.length} total events
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
                <h3>Available Labs</h3>
                <p className="stat-number">{availableLabs.filter(l => l.status === 'Available').length}</p>
                <p className="stat-change">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 7h10v10"></path>
                    <path d="M7 17 17 7"></path>
                  </svg>
                  {availableLabs.length} total labs
                </p>
              </div>
              <div className="stat-icon purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-header">
              <div className="stat-info">
                <h3>Notifications</h3>
                <p className="stat-number">{notifications.filter(n => !n.read).length}</p>
                <p className="stat-change">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 7h10v10"></path>
                    <path d="M7 17 17 7"></path>
                  </svg>
                  {notifications.length} total
                </p>
              </div>
              <div className="stat-icon orange">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Upcoming Bookings */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Upcoming Bookings</h2>
            <button className="btn-link" onClick={() => setActiveTab('bookings')}>View All →</button>
          </div>
          <div className="booking-list">
            {upcomingBookings.length === 0 ? (
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  <rect width="20" height="14" x="2" y="6" rx="2"></rect>
                </svg>
                <p>No upcoming bookings</p>
                <button className="btn-primary" onClick={() => setActiveTab('labs')}>Book a Lab</button>
              </div>
            ) : (
              upcomingBookings.map(booking => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <div className="booking-lab">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      </svg>
                      <div>
                        <h3>{booking.labName}</h3>
                        <p className="booking-location">{booking.location}</p>
                      </div>
                    </div>
                    <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="booking-details">
                    <div className="booking-time">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>{booking.date} • {booking.startTime} - {booking.endTime}</span>
                    </div>
                    <div className="booking-purpose">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      <span>{booking.purpose}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Upcoming Events</h2>
            <button className="btn-link" onClick={() => setActiveTab('events')}>View All →</button>
          </div>
          <div className="event-list">
            {upcomingEvents.length === 0 ? (
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2v4"></path>
                  <path d="M16 2v4"></path>
                  <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                  <path d="M3 10h18"></path>
                </svg>
                <p>No upcoming events</p>
              </div>
            ) : (
              upcomingEvents.map(event => (
                <div key={event.id} className="event-card">
                  <div className="event-header">
                    <h3>{event.title}</h3>
                    <span className={`status-badge status-${event.status.toLowerCase()}`}>
                      {event.status}
                    </span>
                  </div>
                  <div className="event-details">
                    <div className="event-info">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span>{event.organizer}</span>
                    </div>
                    <div className="event-info">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>{event.date} • {event.time}</span>
                    </div>
                    <div className="event-info">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>{event.location}</span>
                    </div>
                    <div className="event-capacity">
                      <div className="capacity-bar">
                        <div
                          className="capacity-fill"
                          style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                        ></div>
                      </div>
                      <span className="capacity-text">{event.registered}/{event.capacity} registered</span>
                    </div>
                  </div>
                  {event.status === 'Open' && (
                    <button className="btn-primary btn-sm">Register Now</button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="dashboard-section notifications-section">
        <div className="section-header">
          <h2>Recent Notifications</h2>
          <button className="btn-link">Mark all as read</button>
        </div>
        <div className="notification-list">
          {notifications.slice(0, 3).map(notification => (
            <div key={notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
              <div className={`notification-icon notification-${notification.type}`}>
                {notification.type === 'booking' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
                {notification.type === 'event' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2v4"></path>
                    <path d="M16 2v4"></path>
                    <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                  </svg>
                )}
                {notification.type === 'system' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                )}
              </div>
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className="notification-time">{notification.time}</span>
              </div>
              {!notification.read && <div className="notification-badge"></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLabs = () => (
    <div className="home-content">
      <div className="content-header">
        <div>
          <h1>Browse Labs</h1>
          <p className="subtitle">Find and book available labs for your needs</p>
        </div>
        <button className="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Book a Lab
        </button>
      </div>

      {/* Search and Filters */}
      <div className="table-controls">
        <div className="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input type="text" placeholder="Search labs by name or location..." />
        </div>
        <div className="filter-group">
          <select className="filter-select">
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
          </select>
          <select className="filter-select">
            <option value="">All Buildings</option>
            <option value="A">Building A</option>
            <option value="B">Building B</option>
            <option value="C">Building C</option>
          </select>
          <select className="filter-select">
            <option value="">All Capacities</option>
            <option value="small">Small (1-20)</option>
            <option value="medium">Medium (21-40)</option>
            <option value="large">Large (40+)</option>
          </select>
        </div>
      </div>

      {/* Labs Grid */}
      <div className="labs-grid">
        {availableLabs.map(lab => (
          <div key={lab.id} className="lab-card">
            <div className="lab-card-header">
              <div className="lab-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <span className={`status-badge status-${lab.status.toLowerCase()}`}>
                {lab.status}
              </span>
            </div>
            <h3>{lab.name}</h3>
            <p className="lab-code">{lab.code}</p>
            <div className="lab-details">
              <div className="lab-detail">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>{lab.location}</span>
              </div>
              <div className="lab-detail">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Capacity: {lab.capacity}</span>
              </div>
            </div>
            <div className="lab-equipment">
              <strong>Equipment:</strong>
              <div className="equipment-tags">
                {lab.equipment.map((eq, idx) => (
                  <span key={idx} className="equipment-tag">{eq}</span>
                ))}
              </div>
            </div>
            <div className="lab-actions">
              <button className="btn-secondary btn-sm">View Details</button>
              {lab.status === 'Available' && (
                <button className="btn-primary btn-sm">Book Now</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="home-content">
      <div className="content-header">
        <div>
          <h1>{isLecturer ? 'My Events' : 'Available Events'}</h1>
          <p className="subtitle">
            {isLecturer ? 'Manage your workshops and seminars' : 'Register for workshops and seminars'}
          </p>
        </div>
        {isLecturer && (
          <button className="btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Event
          </button>
        )}
      </div>

      {/* Events List */}
      <div className="events-list-view">
        {upcomingEvents.map(event => (
          <div key={event.id} className="event-card-large">
            <div className="event-image">
              {event.coverImage ? (
                <img src={event.coverImage} alt={event.title} />
              ) : (
                <div className="event-image-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2v4"></path>
                    <path d="M16 2v4"></path>
                    <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                    <path d="M3 10h18"></path>
                  </svg>
                </div>
              )}
            </div>
            <div className="event-content">
              <div className="event-header">
                <div>
                  <h3>{event.title}</h3>
                  <p className="event-organizer">Organized by {event.organizer}</p>
                </div>
                <span className={`status-badge status-${event.status.toLowerCase()}`}>
                  {event.status}
                </span>
              </div>
              <div className="event-meta">
                <div className="event-meta-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{event.date} • {event.time}</span>
                </div>
                <div className="event-meta-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{event.location}</span>
                </div>
                <div className="event-meta-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>{event.registered}/{event.capacity} participants</span>
                </div>
              </div>
              <div className="event-capacity">
                <div className="capacity-bar">
                  <div
                    className="capacity-fill"
                    style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="event-actions">
                <button className="btn-secondary">View Details</button>
                {event.status === 'Open' && !isLecturer && (
                  <button className="btn-primary">Register</button>
                )}
                {event.status === 'Registered' && !isLecturer && (
                  <button className="btn-danger">Cancel Registration</button>
                )}
                {isLecturer && (
                  <>
                    <button className="btn-secondary">Manage Registrations</button>
                    <button className="btn-primary">Edit Event</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="home-content">
      <div className="content-header">
        <div>
          <h1>{isLecturer ? 'Booking Approvals' : 'My Bookings'}</h1>
          <p className="subtitle">
            {isLecturer ? 'Review and approve lab booking requests' : 'View and manage your lab bookings'}
          </p>
        </div>
        {!isLecturer && (
          <button className="btn-primary" onClick={() => setActiveTab('labs')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Booking
          </button>
        )}
      </div>

      {/* Bookings Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Lab</th>
              <th>Date & Time</th>
              <th>Purpose</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {upcomingBookings.map(booking => (
              <tr key={booking.id}>
                <td>
                  <div className="table-cell-main">
                    <strong>{booking.labName}</strong>
                    <span className="table-cell-sub">{booking.location}</span>
                  </div>
                </td>
                <td>
                  <div className="table-cell-main">
                    <strong>{booking.date}</strong>
                    <span className="table-cell-sub">{booking.startTime} - {booking.endTime}</span>
                  </div>
                </td>
                <td>{booking.purpose}</td>
                <td>
                  <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                    {booking.status}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="btn-icon" title="View Details">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                    {!isLecturer && booking.status === 'Pending' && (
                      <button className="btn-icon" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                        </svg>
                      </button>
                    )}
                    {!isLecturer && (
                      <button className="btn-icon btn-icon-danger" title="Cancel">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </button>
                    )}
                    {isLecturer && booking.status === 'Pending' && (
                      <>
                        <button className="btn-sm btn-primary" title="Approve">Approve</button>
                        <button className="btn-sm btn-danger" title="Reject">Reject</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="home-page">
      {/* Modern Header - No Sidebar */}
      <header className="home-header">
        <div className="home-header-content">
          <div className="home-brand">
            <div className="brand-logo">FL</div>
            <div className="brand-text">
              <h3>FPT Lab Events</h3>
              <p className="brand-subtitle">{isLecturer ? 'Lecturer Portal' : 'Student Portal'}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="home-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`home-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* User Section */}
          <div className="home-header-right">
            <button className="home-icon-btn" title="Notifications">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
              </svg>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="home-notification-badge">{notifications.filter(n => !n.read).length}</span>
              )}
            </button>

            <div className="home-user-menu" ref={userDropdownRef}>
              <div
                className="home-user-trigger"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <div className="home-user-avatar">{avatarInitials}</div>
                <div className="home-user-info">
                  <p className="home-user-name">{displayName}</p>
                  <p className="home-user-role">{userRole}</p>
                </div>
                <svg
                  className={`home-dropdown-arrow ${userDropdownOpen ? 'open' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              {userDropdownOpen && (
                <div className="home-user-dropdown">
                  <div className="home-dropdown-header">
                    <p className="home-dropdown-name">{displayName}</p>
                    <p className="home-dropdown-email">{displayEmail}</p>
                  </div>
                  <div className="home-dropdown-divider"></div>
                  <div className="home-dropdown-menu">
                    <div className="home-dropdown-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span>My Profile</span>
                    </div>
                    <div className="home-dropdown-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6"></path>
                      </svg>
                      <span>Settings</span>
                    </div>
                    <div className="home-dropdown-divider"></div>
                    <div className="home-dropdown-item sign-out" onClick={handleLogout}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
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

      {/* Main Content - Full Width */}
      <main className="home-main">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-content">
          <div className="footer-left">
            <div className="footer-brand">
              <div className="brand-logo-small">FL</div>
              <span>FPT Lab Events</span>
            </div>
            <p>© {new Date().getFullYear()} FPT University. All rights reserved.</p>
          </div>
          <div className="footer-right">
            <a href="#help">Help</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;


