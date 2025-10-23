import React, { useState, useEffect, useRef } from 'react';
import { authApi, bookingApi, eventApi, roomsApi, labsApi, notificationApi } from '../../api';

function Home({ user: userProp }) {
  const [user, setUser] = useState(userProp);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  // Data states
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [availableLabs, setAvailableLabs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

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

  // Load dashboard data
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    } else if (activeTab === 'bookings') {
      loadBookingsData();
    } else if (activeTab === 'events') {
      loadEventsData();
    } else if (activeTab === 'labs') {
      loadLabsData();
    }
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

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoadingData(true);
      await Promise.all([
        loadUpcomingBookings(),
        loadUpcomingEvents(),
        loadNotifications(),
        loadAvailableLabs()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Load available labs
  const loadAvailableLabs = async () => {
    try {
      const response = await labsApi.getLabs({ pageSize: 10 });
      const labs = Array.isArray(response) ? response : (response?.data || []);
      setAvailableLabs(labs);
    } catch (error) {
      console.error('Error loading labs:', error);
      setAvailableLabs([]);
    }
  };

  // Load upcoming bookings
  const loadUpcomingBookings = async () => {
    try {
      if (!user?.Id) return;
      
      const fromDate = new Date();
      const toDate = new Date();
      toDate.setDate(toDate.getDate() + 7); // Next 7 days
      
      const response = await bookingApi.getBookings({
        userId: user.Id,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        pageSize: 5
      });

      const bookings = Array.isArray(response) ? response : (response?.data || []);
      setUpcomingBookings(bookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setUpcomingBookings([]);
    }
  };

  // Load upcoming events
  const loadUpcomingEvents = async () => {
    try {
      const response = await eventApi.getUpcomingEvents();
      const events = Array.isArray(response) ? response : (response?.data || []);
      setUpcomingEvents(events.slice(0, 5)); // Limit to 5 for dashboard
    } catch (error) {
      console.error('Error loading events:', error);
      setUpcomingEvents([]);
    }
  };

  // Load bookings data
  const loadBookingsData = async () => {
    try {
      setLoadingData(true);
      if (!user?.Id) return;
      
      const response = await bookingApi.getBookings({
        userId: user.Id,
        pageSize: 50
      });

      const bookings = Array.isArray(response) ? response : (response?.data || []);
      setUpcomingBookings(bookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setUpcomingBookings([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Load events data
  const loadEventsData = async () => {
    try {
      setLoadingData(true);
      const response = await eventApi.getUpcomingEvents();
      const events = Array.isArray(response) ? response : (response?.data || []);
      setUpcomingEvents(events);
    } catch (error) {
      console.error('Error loading events:', error);
      setUpcomingEvents([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Load labs data
  const loadLabsData = async () => {
    try {
      setLoadingData(true);
      const response = await labsApi.getLabs({ pageSize: 20 });
      const labs = Array.isArray(response) ? response : (response?.data || []);
      setAvailableLabs(labs);
    } catch (error) {
      console.error('Error loading labs:', error);
      setAvailableLabs([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Load notifications
  const loadNotifications = async () => {
    try {
      if (!user?.Id) return;
      
      const response = await notificationApi.getUserNotifications({ pageSize: 10 });
      const notifs = Array.isArray(response) ? response : (response?.data || []);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  // Status helpers
  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'Pending': 'status-pending',
      'Approved': 'status-approved',
      'Rejected': 'status-rejected',
      'Cancelled': 'status-cancelled',
      'Active': 'status-active',
      'Inactive': 'status-inactive',
      'Completed': 'status-completed'
    };
    return statusMap[status] || 'status-pending';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

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
    // Redirect to home page instead of reload to avoid callback route issues
    window.location.href = '/';
  }

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
      label: 'Home',
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
      id: 'labs',
      label: 'Labs',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      )
    },
    {
      id: 'events',
      label: isLecturer ? 'My Events' : 'Events',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="home-dashboard">
      {/* Hero Section */}
      <div className="home-hero">
        <div className="home-hero-content">
          <h1 className="home-hero-title">
            Welcome back, <span className="home-hero-name">{displayName.split(' ')[0]}</span>! 👋
          </h1>
          <p className="home-hero-subtitle">
            Book labs, join events, and manage your schedule all in one place
          </p>
          <div className="home-hero-actions">
            <button className="btn-hero-primary" onClick={() => setActiveTab('labs')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="1.25rem" height="1.25rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              Book a Lab Now
            </button>
            <button className="btn-hero-secondary" onClick={() => setActiveTab('events')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v4"></path>
                <path d="M16 2v4"></path>
                <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                <path d="M3 10h18"></path>
              </svg>
              View Events
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="home-quick-stats">
        <div className="quick-stat-card">
          <div className="quick-stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="2rem" height="2rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              <rect width="20" height="14" x="2" y="6" rx="2"></rect>
            </svg>
          </div>
          <div className="quick-stat-content">
            <p className="quick-stat-number">{upcomingBookings.length}</p>
            <p className="quick-stat-label">Upcoming Bookings</p>
          </div>
        </div>

        <div className="quick-stat-card">
          <div className="quick-stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="2rem" height="2rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v4"></path>
              <path d="M16 2v4"></path>
              <rect width="18" height="18" x="3" y="4" rx="2"></rect>
              <path d="M3 10h18"></path>
            </svg>
          </div>
          <div className="quick-stat-content">
            <p className="quick-stat-number">{upcomingEvents.length}</p>
            <p className="quick-stat-label">Upcoming Events</p>
          </div>
        </div>

        <div className="quick-stat-card">
          <div className="quick-stat-icon purple">
            <svg xmlns="http://www.w3.org/2000/svg" width="2rem" height="2rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div className="quick-stat-content">
            <p className="quick-stat-number">{availableLabs.length}</p>
            <p className="quick-stat-label">Available Labs</p>
          </div>
        </div>

        <div className="quick-stat-card">
          <div className="quick-stat-icon orange">
            <svg xmlns="http://www.w3.org/2000/svg" width="2rem" height="2rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
            </svg>
          </div>
          <div className="quick-stat-content">
            <p className="quick-stat-number">{notifications.filter(n => !n.IsRead).length}</p>
            <p className="quick-stat-label">New Notifications</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="home-content-grid">
        {/* Upcoming Bookings Section */}
        <div className="home-content-card">
          <div className="home-content-card-header">
            <div>
              <h2>Your Upcoming Bookings</h2>
              <p>Manage your lab reservations</p>
            </div>
            <button className="btn-view-all" onClick={() => setActiveTab('bookings')}>
              View All →
            </button>
          </div>
          <div className="home-content-card-body">
            {loadingData ? (
              <div className="home-loading">
                <p>Loading bookings...</p>
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="home-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="4rem" height="4rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  <rect width="20" height="14" x="2" y="6" rx="2"></rect>
                </svg>
                <h3>No Upcoming Bookings</h3>
                <p>You don't have any bookings scheduled yet</p>
                <button className="btn-primary" onClick={() => setActiveTab('labs')}>Book a Lab</button>
              </div>
            ) : (
              <div className="home-booking-list">
                {upcomingBookings.slice(0, 3).map(booking => (
                  <div key={booking.Id} className="home-booking-item">
                    <div className="home-booking-info">
                      <div className="home-booking-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        </svg>
                      </div>
                      <div>
                        <h4>{booking.RoomName}</h4>
                        <p>{formatDate(booking.StartTime)} • {formatTime(booking.StartTime)} - {formatTime(booking.EndTime)}</p>
                      </div>
                    </div>
                    <span className={`status-badge ${getStatusBadgeClass(booking.Status)}`}>
                      {booking.Status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div className="home-content-card">
          <div className="home-content-card-header">
            <div>
              <h2>Featured Events</h2>
              <p>Discover workshops and seminars</p>
            </div>
            <button className="btn-view-all" onClick={() => setActiveTab('events')}>
              View All →
            </button>
          </div>
          <div className="home-content-card-body">
            {loadingData ? (
              <div className="home-loading">
                <p>Loading events...</p>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="home-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="4rem" height="4rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2v4"></path>
                  <path d="M16 2v4"></path>
                  <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                  <path d="M3 10h18"></path>
                </svg>
                <h3>No Upcoming Events</h3>
                <p>Check back later for new events</p>
              </div>
            ) : (
              <div className="home-event-list">
                {upcomingEvents.slice(0, 3).map(event => (
                  <div key={event.Id} className="home-event-item">
                    <div className="home-event-info">
                      <h4>{event.Title}</h4>
                      <p>{formatDate(event.StartDate)} • {formatTime(event.StartDate)} - {formatTime(event.EndDate)}</p>
                      {event.Location && <p className="home-event-location">{event.Location}</p>}
                    </div>
                    <button className="btn-register">Register</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="home-quick-actions">
        <h2>Quick Actions</h2>
        <div className="home-action-grid">
          <div className="home-action-card" onClick={() => setActiveTab('labs')}>
            <div className="home-action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="2rem" height="2rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h3>Browse Labs</h3>
            <p>Find and book available labs</p>
          </div>

          <div className="home-action-card" onClick={() => setActiveTab('events')}>
            <div className="home-action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="2rem" height="2rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v4"></path>
                <path d="M16 2v4"></path>
                <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                <path d="M3 10h18"></path>
              </svg>
            </div>
            <h3>Join Events</h3>
            <p>Register for workshops and seminars</p>
          </div>

          <div className="home-action-card" onClick={() => setActiveTab('bookings')}>
            <div className="home-action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="2rem" height="2rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                <rect width="20" height="14" x="2" y="6" rx="2"></rect>
              </svg>
            </div>
            <h3>My Bookings</h3>
            <p>View and manage your reservations</p>
          </div>

          <div className="home-action-card">
            <div className="home-action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="2rem" height="2rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <h3>Help & Support</h3>
            <p>Get assistance and guidance</p>
          </div>
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
          <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Book a Lab
        </button>
      </div>

      {/* Search and Filters */}
      <div className="table-controls">
        <div className="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input type="text" placeholder="Search labs by name or location..." />
        </div>
      </div>

      {/* Labs Grid */}
      <div className="labs-grid">
        {loadingData ? (
          <div className="empty-state">
            <p>Loading labs...</p>
          </div>
        ) : availableLabs.length === 0 ? (
          <div className="empty-state">
            <p>No labs available</p>
          </div>
        ) : (
          availableLabs.map(lab => (
            <div key={lab.Id} className="lab-card">
              <div className="lab-card-header">
                <div className="lab-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <span className={`status-badge status-${lab.Status.toLowerCase()}`}>
                  {lab.Status}
                </span>
              </div>
              <h3>{lab.Name}</h3>
              <p className="lab-code">{lab.Location}</p>
              <div className="lab-details">
                <div className="lab-detail">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{lab.Location}</span>
                </div>
                <div className="lab-detail">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>Capacity: {lab.Capacity}</span>
                </div>
              </div>
              <div className="lab-actions">
                <button className="btn-secondary btn-sm">View Details</button>
                {lab.Status === 'Active' && (
                  <button className="btn-primary btn-sm">Book Now</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="home-content">
      <div className="content-header">
        <div>
          <h1>Available Events</h1>
          <p className="subtitle">Register for workshops and seminars</p>
        </div>
      </div>

      {/* Events List */}
      <div className="events-list-view">
        {loadingData ? (
          <div className="empty-state">
            <p>Loading events...</p>
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="empty-state">
            <p>No upcoming events</p>
          </div>
        ) : (
          upcomingEvents.map(event => (
            <div key={event.Id} className="event-card-large">
              <div className="event-content">
                <div className="event-header">
                  <div>
                    <h3>{event.Title}</h3>
                    <p className="event-organizer">Organized by {event.CreatedBy}</p>
                  </div>
                  <span className={`status-badge status-${event.Status.toLowerCase()}`}>
                    {event.Status}
                  </span>
                </div>
                <div className="event-meta">
                  <div className="event-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>{formatDate(event.StartDate)} • {formatTime(event.StartDate)} - {formatTime(event.EndDate)}</span>
                  </div>
                  {event.Location && (
                    <div className="event-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>{event.Location}</span>
                    </div>
                  )}
                </div>
                <div className="event-actions">
                  <button className="btn-secondary">View Details</button>
                  <button className="btn-primary">Register</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="home-content">
      <div className="content-header">
        <div>
          <h1>My Bookings</h1>
          <p className="subtitle">View and manage your lab bookings</p>
        </div>
        <button className="btn-primary" onClick={() => setActiveTab('labs')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Booking
        </button>
      </div>

      {/* Bookings Table */}
      <div className="data-table-container">
        {loadingData ? (
          <div className="empty-state">
            <p>Loading bookings...</p>
          </div>
        ) : upcomingBookings.length === 0 ? (
          <div className="empty-state">
            <p>No bookings found</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Date & Time</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {upcomingBookings.map(booking => (
                <tr key={booking.Id}>
                  <td>
                    <div className="table-cell-main">
                      <strong>{booking.RoomName}</strong>
                      <span className="table-cell-sub">{booking.Location}</span>
                    </div>
                  </td>
                  <td>
                    <div className="table-cell-main">
                      <strong>{formatDate(booking.StartTime)}</strong>
                      <span className="table-cell-sub">{formatTime(booking.StartTime)} - {formatTime(booking.EndTime)}</span>
                    </div>
                  </td>
                  <td>{booking.Purpose || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(booking.Status)}`}>
                      {booking.Status}
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
                      {booking.Status === 'Pending' && (
                        <button className="btn-icon" title="Cancel">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="home-notification-badge">{notifications.filter(n => !n.isRead).length}</span>
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
                  width="1rem"
                  height="1rem"
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span>My Profile</span>
                    </div>
                    <div className="home-dropdown-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6"></path>
                      </svg>
                      <span>Settings</span>
                    </div>
                    <div className="home-dropdown-divider"></div>
                    <div className="home-dropdown-item sign-out" onClick={handleLogout}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          © {new Date().getFullYear()} FPT Lab Events. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Home;