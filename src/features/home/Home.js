import React, { useState, useEffect, useRef } from 'react';
import { authApi, bookingApi, eventApi, labsApi, notificationApi, reportsApi } from '../../api';
import LabList from '../lab-management/components/LabList';
import LabDetail from '../lab-management/components/LabDetail';
import EventList from '../event-management/components/EventList';
import BookingList from '../booking-management/components/BookingList';
import UserProfile from '../user-management/student/UserProfile';
import UserNotifications from '../notification-management/user/UserNotifications';
import UserReportForm from '../reports-management/user/UserReportForm';
import UserReports from '../reports-management/user/UserReports';

function Home({ user: userProp }) {
  const [user, setUser] = useState(userProp);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  
  // Lab detail state
  const [selectedLabId, setSelectedLabId] = useState(null);

  // Data states
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [availableLabs, setAvailableLabs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Loading states
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
    console.log('=== useEffect triggered ===');
    console.log('User:', user);
    console.log('Active tab:', activeTab);
    
    if (!user) {
      console.log('Waiting for user to load...');
      return;
    }
    
    console.log('Tab changed to:', activeTab, 'User:', user);
    
    if (activeTab === 'dashboard') {
      console.log('Loading dashboard data...');
      
      // Load all dashboard data
      const loadDashboardData = async () => {
        try {
          setLoadingData(true);
          console.log('Calling loadDashboardData - will call loadUpcomingBookings');
          
          // Load registered events (events user has registered for)
          const loadRegisteredEvents = async () => {
            try {
              console.log('=== LOADING REGISTERED EVENTS - START ===');
              console.log('User Id:', user?.id);
              
              if (!user?.id) {
                console.log('No user ID found - cannot load registered events');
                return;
              }
              
              console.log('Calling bookingApi.getBookings with userId:', user.id);
              
              const response = await bookingApi.getBookings({
                userId: user.id,
                pageSize: 100
              });

              console.log('Booking API response:', response);
              
              const bookings = Array.isArray(response) ? response : (response?.data || []);
              
              console.log('Parsed bookings:', bookings);
              
              // Filter bookings that have EventId (event registrations)
              const eventBookings = bookings.filter(booking => {
                const eventId = booking.eventId || booking.EventId;
                return eventId != null && eventId !== '';
              });
              
              console.log('Event bookings found:', eventBookings.length);
              
              // Get unique event IDs
              const eventIds = [...new Set(eventBookings.map(b => b.eventId || b.EventId))];
              console.log('Unique event IDs:', eventIds);
              
              // Load event details for each event ID
              const eventsPromises = eventIds.map(async (eventId) => {
                try {
                  const event = await eventApi.getEventById(eventId);
                  return normalizeEvent(event);
                } catch (error) {
                  console.error(`Error loading event ${eventId}:`, error);
                  return null;
                }
              });
              
              const events = (await Promise.all(eventsPromises)).filter(e => e != null);
              
              // Filter to only show upcoming events (StartDate >= today)
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const upcomingRegisteredEvents = events.filter(event => {
                if (!event.StartDate) return false;
                const startDate = new Date(event.StartDate);
                return startDate >= today;
              });
              
              console.log('Registered events:', upcomingRegisteredEvents.length);
              console.log('=== LOADING REGISTERED EVENTS - END ===');
              
              setRegisteredEvents(upcomingRegisteredEvents);
            } catch (error) {
              console.error('=== ERROR LOADING REGISTERED EVENTS ===');
              console.error('Error details:', error);
              setRegisteredEvents([]);
            }
          };
          
          // Load available labs
          const loadAvailableLabs = async () => {
            try {
              const userRoleCheck = user?.roles?.[0] || 'Student';
              const isLecturerCheck = user?.roles?.includes('Lecturer') || user?.roles?.includes('Teacher');
              
              console.log('Loading available labs for user role:', userRoleCheck);
              
              // Try available labs endpoint first, fallback to regular labs if it fails
              if (isLecturerCheck || userRoleCheck === 'Student') {
                try {
                  const response = await labsApi.getAvailableLabs();
                  console.log('Available labs API response:', response);
                  const labs = Array.isArray(response) ? response : (response?.data || response?.Data || []);
                  console.log('Parsed available labs:', labs);
                  setAvailableLabs(labs);
                } catch (availableError) {
                  // If available labs endpoint fails, try regular labs endpoint as fallback
                  console.warn('Available labs endpoint failed, trying regular labs endpoint:', availableError.message);
                  try {
                    const response = await labsApi.getLabs({ pageSize: 10 });
                    const labs = Array.isArray(response) ? response : (response?.data || response?.Data || []);
                    console.log('Using regular labs endpoint, parsed labs:', labs);
                    setAvailableLabs(labs);
                  } catch (fallbackError) {
                    console.error('Error loading labs (both endpoints failed):', fallbackError);
                    setAvailableLabs([]);
                  }
                }
              } else {
                // Admin users use regular labs endpoint
                const response = await labsApi.getLabs({ pageSize: 10 });
                console.log('Labs API response:', response);
                const labs = Array.isArray(response) ? response : (response?.data || response?.Data || []);
                console.log('Parsed labs:', labs);
                setAvailableLabs(labs);
              }
            } catch (error) {
              console.error('Error loading labs:', error);
              setAvailableLabs([]);
            }
          };

          // Load upcoming events
          const loadUpcomingEvents = async () => {
            try {
              console.log('Loading upcoming events...');
              const response = await eventApi.getUpcomingEvents();
              console.log('Events API response:', response);
              
              let eventData = [];
              if (Array.isArray(response)) {
                eventData = response;
              } else if (response?.data && Array.isArray(response.data)) {
                eventData = response.data;
              } else if (response?.Data && Array.isArray(response.Data)) {
                eventData = response.Data;
              }
              
              console.log('Parsed events:', eventData);
              
              const normalizedEvents = eventData.map(event => normalizeEvent(event));
              
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const upcoming = normalizedEvents.filter(event => {
                if (!event.StartDate) return false;
                const startDate = new Date(event.StartDate);
                return startDate >= today;
              });
              
              setUpcomingEvents(upcoming.slice(0, 5));
            } catch (error) {
              console.error('Error loading events:', error);
              setUpcomingEvents([]);
            }
          };

          console.log('About to call Promise.all with loadUpcomingBookings');
          console.log('Will call: loadUpcomingBookings, loadUpcomingEvents, loadNotifications, loadAvailableLabs');
          
          await Promise.all([
            loadRegisteredEvents(),
            loadUpcomingEvents(),
            loadNotifications(),
            loadAvailableLabs()
          ]);
          console.log('Promise.all completed');
        } catch (error) {
          console.error('Error loading dashboard data:', error);
        } finally {
          setLoadingData(false);
        }
      };
      
      loadDashboardData();
    } else if (activeTab === 'bookings') {
      console.log('Loading bookings tab data...');
      loadBookingsData();
    } else if (activeTab === 'events') {
      loadEventsData();
    } else if (activeTab === 'labs') {
      loadLabsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load bookings data (for students: registered events, for lecturers/admins: bookings)
  const loadBookingsData = async () => {
    try {
      setLoadingData(true);
      if (!user?.id) {
        console.log('No user ID found for bookings tab');
        return;
      }
      
      // For students, load registered events
      if (userRole === 'Student' || (!isAdmin && !isLecturer)) {
        console.log('Loading registered events for user:', user.id);
        
        const response = await bookingApi.getBookings({
          userId: user.id,
          pageSize: 100
        });

        console.log('Bookings API response:', response);
        
        const bookings = Array.isArray(response) ? response : (response?.data || []);
        
        // Filter bookings that have EventId (event registrations)
        const eventBookings = bookings.filter(booking => {
          const eventId = booking.eventId || booking.EventId;
          return eventId != null && eventId !== '';
        });
        
        console.log('Event bookings found:', eventBookings.length);
        
        // Get unique event IDs
        const eventIds = [...new Set(eventBookings.map(b => b.eventId || b.EventId))];
        console.log('Unique event IDs:', eventIds);
        
        // Load event details for each event ID
        const eventsPromises = eventIds.map(async (eventId) => {
          try {
            const event = await eventApi.getEventById(eventId);
            return normalizeEvent(event);
          } catch (error) {
            console.error(`Error loading event ${eventId}:`, error);
            return null;
          }
        });
        
        const events = (await Promise.all(eventsPromises)).filter(e => e != null);
        
        // Sort by start date (upcoming first)
        events.sort((a, b) => {
          const dateA = new Date(a.StartDate || a.startDate);
          const dateB = new Date(b.StartDate || b.startDate);
          return dateA - dateB;
        });
        
        console.log('Registered events loaded:', events.length);
        setRegisteredEvents(events);
      } else {
        // For lecturers/admins, load bookings
        console.log('Loading all bookings for user:', user.id);
        
        const response = await bookingApi.getBookings({
          userId: user.id,
          pageSize: 50
        });

        console.log('Bookings tab API response:', response);
        
        const bookings = Array.isArray(response) ? response : (response?.data || []);
        
        console.log('Parsed bookings for tab:', bookings);
        console.log('Number of bookings:', bookings.length);
      }
    } catch (error) {
      console.error('Error loading bookings/registered events:', error);
      if (userRole === 'Student' || (!isAdmin && !isLecturer)) {
        setRegisteredEvents([]);
      }
    } finally {
      setLoadingData(false);
    }
  };

  // Load events data
  const loadEventsData = async () => {
    try {
      setLoadingData(true);
      console.log('Loading all events for events tab...');
      const response = await eventApi.getUpcomingEvents();
      console.log('Events tab API response:', response);
      
      // Handle different response formats (same as EventList)
      let eventData = [];
      if (Array.isArray(response)) {
        eventData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        eventData = response.data;
      } else if (response?.Data && Array.isArray(response.Data)) {
        eventData = response.Data;
      }
      
      console.log('Events tab parsed events:', eventData);
      
      // Normalize event data to handle both Title/title properties
      const normalizedEvents = eventData.map(event => normalizeEvent(event));
      
      console.log('Events tab normalized events:', normalizedEvents);
      setUpcomingEvents(normalizedEvents);
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
      const userRoleCheck = user?.roles?.[0] || 'Student';
      const isLecturerCheck = user?.roles?.includes('Lecturer') || user?.roles?.includes('Teacher');
      
      console.log('Loading labs data for user role:', userRoleCheck);
      
      // Try available labs endpoint first, fallback to regular labs if it fails
      if (isLecturerCheck || userRoleCheck === 'Student') {
        try {
          const response = await labsApi.getAvailableLabs();
          console.log('Available labs data API response:', response);
          const labs = Array.isArray(response) ? response : (response?.data || response?.Data || []);
          console.log('Parsed available labs data:', labs);
          setAvailableLabs(labs);
        } catch (availableError) {
          // If available labs endpoint fails, try regular labs endpoint as fallback
          console.warn('Available labs endpoint failed, trying regular labs endpoint:', availableError.message);
          try {
            const response = await labsApi.getLabs({ pageSize: 20 });
            const labs = Array.isArray(response) ? response : (response?.data || response?.Data || []);
            console.log('Using regular labs endpoint, parsed labs data:', labs);
            setAvailableLabs(labs);
          } catch (fallbackError) {
            console.error('Error loading labs data (both endpoints failed):', fallbackError);
            setAvailableLabs([]);
          }
        }
      } else {
        // Admin users use regular labs endpoint
        const response = await labsApi.getLabs({ pageSize: 20 });
        console.log('Labs data API response:', response);
        const labs = Array.isArray(response) ? response : (response?.data || response?.Data || []);
        console.log('Parsed labs data:', labs);
        setAvailableLabs(labs);
      }
    } catch (error) {
      console.error('Error loading labs:', error);
      setAvailableLabs([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Toast notification system
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
  };

  // Load notifications
  const loadNotifications = async () => {
    try {
      if (!user?.id) return;
      
      const response = await notificationApi.getUserNotifications({ pageSize: 10 });
      const notifs = Array.isArray(response) ? response : (response?.data || []);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  // Handle report submission
  const handleReportSubmit = async (reportData) => {
    try {
      setReportLoading(true);
      await reportsApi.createReport(reportData);
      setShowReportModal(false);
      showToast('Report created successfully!', 'success');
    } catch (error) {
      console.error('Error creating report:', error);
      showToast('Failed to create report. Please try again.', 'error');
    } finally {
      setReportLoading(false);
    }
  };

  // Status helpers (removed unused getStatusLabel)

  // Removed unused getStatusBadgeClass

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

  // Helper function to normalize event data (handle both Title/title)
  const normalizeEvent = (event) => {
    return {
      ...event,
      Id: event.Id || event.id,
      Title: event.Title || event.title || 'Untitled Event',
      Description: event.Description || event.description,
      Location: event.Location || event.location,
      StartDate: event.StartDate || event.startDate,
      EndDate: event.EndDate || event.endDate,
      Status: event.Status || event.status,
      CreatedBy: event.CreatedBy || event.createdBy,
      ImageUrl: event.ImageUrl || event.imageUrl
    };
  };

  const displayName = user?.fullname || user?.username || 'User';
  const displayEmail = user?.email || 'user@fpt.edu.vn';
  const avatarInitials = getAvatarInitials(displayName);
  const userRole = user?.roles?.[0] || 'Student';
  const isLecturer = user?.roles?.includes('Lecturer') || user?.roles?.includes('Teacher');
  const isAdmin = user?.roles?.includes('Admin');

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
      label: isLecturer ? 'Approvals' : 'Registered Events',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2v4"></path>
          <path d="M16 2v4"></path>
          <rect width="18" height="18" x="3" y="4" rx="2"></rect>
          <path d="M3 10h18"></path>
          <path d="M8 14h.01"></path>
          <path d="M12 14h.01"></path>
          <path d="M16 14h.01"></path>
          <path d="M8 18h.01"></path>
          <path d="M12 18h.01"></path>
          <path d="M16 18h.01"></path>
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
      id: 'reports',
      label: 'My Reports',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
          <line x1="4" y1="22" x2="4" y2="15"></line>
        </svg>
      )
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
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
      case 'notifications':
        return renderNotifications();
      case 'reports':
        return renderReports();
      case 'profile':
        return renderProfile();
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
              <path d="M8 2v4"></path>
              <path d="M16 2v4"></path>
              <rect width="18" height="18" x="3" y="4" rx="2"></rect>
              <path d="M3 10h18"></path>
              <path d="M8 14h.01"></path>
              <path d="M12 14h.01"></path>
              <path d="M16 14h.01"></path>
              <path d="M8 18h.01"></path>
              <path d="M12 18h.01"></path>
              <path d="M16 18h.01"></path>
            </svg>
          </div>
          <div className="quick-stat-content">
            <p className="quick-stat-number">{registeredEvents.length}</p>
            <p className="quick-stat-label">Events I've Registered</p>
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
            <p className="quick-stat-number">{notifications.filter(n => !n.isRead).length}</p>
            <p className="quick-stat-label">New Notifications</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="home-content-grid">
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
                {upcomingEvents.slice(0, 10).map(event => {
                  const normalized = normalizeEvent(event);
                  return (
                    <div key={normalized.Id} className="home-event-item">
                      <div className="home-event-image">
                        {normalized.ImageUrl ? (
                          <img src={normalized.ImageUrl} alt={normalized.Title} />
                        ) : (
                          <div className="home-event-image-placeholder">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                              <circle cx="9" cy="9" r="2"></circle>
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                            </svg>
                            <span>No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="home-event-info">
                        <h4>{normalized.Title}</h4>
                        <p className="home-event-date">
                          <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          {formatDate(normalized.StartDate)} • {formatTime(normalized.StartDate)} - {formatTime(normalized.EndDate)}
                        </p>
                        {normalized.Location && (
                          <p className="home-event-location">
                            <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            {normalized.Location}
                          </p>
                        )}
                        {normalized.Description && (
                          <p className="home-event-description">{normalized.Description.substring(0, 100)}...</p>
                        )}
                      </div>
                      <button className="btn-register" onClick={() => setActiveTab('events')}>
                        View Details
                      </button>
                    </div>
                  );
                })}
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

  const renderLabs = () => {
    if (selectedLabId) {
      return (
        <LabDetail 
          labId={selectedLabId}
          onNavigateBack={() => setSelectedLabId(null)}
          isAdmin={isAdmin}
          userRole={userRole}
        />
      );
    }
    
    return (
      <div className="home-content">
        <LabList 
          userRole={userRole}
          onViewLab={(labId) => {
            setSelectedLabId(labId);
          }}
        />
      </div>
    );
  };

  const renderEvents = () => (
    <div className="home-content">
      <EventList 
        userRole={userRole}
        onSelectEvent={(eventId) => {
          console.log('Selected event:', eventId);
        }}
        onViewEvent={(eventId) => {
          console.log('View event:', eventId);
        }}
      />
    </div>
  );

  const renderBookings = () => {
    // For students, show registered events
    if (userRole === 'Student' || (!isAdmin && !isLecturer)) {
      return (
        <div className="home-content">
          <div className="room-list-container">
            <div className="room-list-header">
              <h2>My Registered Events</h2>
              <p>Events you have registered to attend</p>
            </div>
            
            {loadingData ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                Loading registered events...
              </div>
            ) : registeredEvents.length === 0 ? (
              <div className="home-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="4rem" height="4rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2v4"></path>
                  <path d="M16 2v4"></path>
                  <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                  <path d="M3 10h18"></path>
                </svg>
                <h3>No Registered Events</h3>
                <p>You haven't registered for any events yet</p>
                <button className="btn-primary" onClick={() => setActiveTab('events')}>Browse Events</button>
              </div>
            ) : (
              <div className="home-event-list">
                {registeredEvents.map(event => {
                  const normalized = normalizeEvent(event);
                  return (
                    <div key={normalized.Id} className="home-event-item">
                      <div className="home-event-image">
                        {normalized.ImageUrl ? (
                          <img src={normalized.ImageUrl} alt={normalized.Title} />
                        ) : (
                          <div className="home-event-image-placeholder">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                              <circle cx="9" cy="9" r="2"></circle>
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                            </svg>
                            <span>No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="home-event-info">
                        <h4>{normalized.Title}</h4>
                        <p className="home-event-date">
                          <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          {formatDate(normalized.StartDate)} • {formatTime(normalized.StartDate)} - {formatTime(normalized.EndDate)}
                        </p>
                        {normalized.Location && (
                          <p className="home-event-location">
                            <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            {normalized.Location}
                          </p>
                        )}
                        {normalized.Description && (
                          <p className="home-event-description">{normalized.Description.substring(0, 150)}...</p>
                        )}
                      </div>
                      <button className="btn-register" onClick={() => setActiveTab('events')}>
                        View Details
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // For lecturers/admins, show booking list
    return (
      <div className="home-content">
        <BookingList
          userRole={userRole}
          userId={user?.id}
          onViewBooking={(bookingId) => {
            console.log('View booking:', bookingId);
          }}
        />
      </div>
    );
  };

  const renderNotifications = () => (
    <div className="home-content">
      <UserNotifications />
    </div>
  );

  const renderReports = () => (
    <div className="home-content">
      <UserReports />
    </div>
  );

  const renderProfile = () => (
    <UserProfile
      onNavigateBack={() => setActiveTab('dashboard')}
    />
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
            <button 
              className="home-icon-btn" 
              title="Create Report"
              onClick={() => setShowReportModal(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                <line x1="4" y1="22" x2="4" y2="15"></line>
              </svg>
            </button>

            <div 
              className="notification-dropdown-container" 
              ref={notificationDropdownRef}
              onMouseEnter={() => setNotificationDropdownOpen(true)}
              onMouseLeave={() => setNotificationDropdownOpen(false)}
            >
              <button 
                className="home-icon-btn" 
                title="Notifications"
                onClick={() => setActiveTab('notifications')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                </svg>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="home-notification-badge">{notifications.filter(n => !n.isRead).length}</span>
                )}
              </button>
              
              {notificationDropdownOpen && notifications.length > 0 && (
                <div className="notification-dropdown">
                  <div className="notification-dropdown-header">
                    <h3>Notifications</h3>
                    <button 
                      className="notification-dropdown-close"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotificationDropdownOpen(false);
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div className="notification-dropdown-list">
                    {notifications.slice(0, 5).map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`notification-dropdown-item ${!notification.isRead ? 'unread' : ''}`}
                        onClick={async () => {
                          if (!notification.isRead) {
                            try {
                              await notificationApi.markNotificationAsRead(notification.id);
                              await loadNotifications();
                            } catch (error) {
                              console.error('Error marking notification as read:', error);
                              await loadNotifications();
                            }
                          }
                          setActiveTab('notifications');
                          setNotificationDropdownOpen(false);
                        }}
                      >
                        <div className="notification-dropdown-content">
                          <h4>{notification.title}</h4>
                          <p>{notification.content?.substring(0, 60)}...</p>
                          <span className="notification-dropdown-time">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        {!notification.isRead && (
                          <span className="notification-dropdown-dot"></span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="notification-dropdown-footer">
                    <button onClick={() => {
                      setActiveTab('notifications');
                      setNotificationDropdownOpen(false);
                    }}>
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

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
                    <div className="home-dropdown-item" onClick={() => {
                      setActiveTab('profile');
                      setUserDropdownOpen(false);
                    }}>
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

      {/* Toast Notification */}
      {toast && (
        <div 
          className="table-notification"
          style={{
            backgroundColor: toast.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: toast.type === 'success' ? '#065f46' : '#dc2626',
            border: toast.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
            padding: '12px 16px',
            borderRadius: '8px',
            margin: '20px',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 10000,
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {toast.type === 'success' ? (
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            ) : (
              <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            )}
          </svg>
          {toast.message}
        </div>
      )}

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
}

export default Home;