import React, { useState, useEffect, useRef } from 'react';
import { authApi, bookingApi, eventApi, notificationApi, reportsApi } from '../../api';
import { getBookingStatusLabel, getBookingStatusColor } from '../../constants/bookingConstants';
import EventList from '../event-management/components/EventList';
import EventDetail from '../event-management/components/EventDetail';
import BookingList from '../booking-management/components/BookingList';
import UserProfile from '../user-management/student/UserProfile';
import UserNotifications from '../notification-management/user/UserNotifications';
import UserReportForm from '../reports-management/user/UserReportForm';
import UserReports from '../reports-management/user/UserReports';

const STATUS_MAP = {
  '0': 'Pending',
  '1': 'Active',
  '2': 'Inactive',
  '3': 'Cancelled',
  '4': 'Completed',
  '5': 'Rejected'
};

const normalizeStatus = (value) => {
  if (value === null || value === undefined) return '';
  const strValue = String(value);
  return STATUS_MAP[strValue] || strValue;
};

function Home({ user: userProp }) {
  const [user, setUser] = useState(userProp);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  
  // Event detail state
  const [viewingEventId, setViewingEventId] = useState(null);
  
  // Featured Events pagination state
  const [featuredEventsPage, setFeaturedEventsPage] = useState(1);
  const featuredEventsPerPage = 9;

  // Data states
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [totalRegisteredEventsCount, setTotalRegisteredEventsCount] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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

  const refreshUnreadCount = React.useCallback(async () => {
    try {
      const count = await notificationApi.getUnreadNotificationCount();
      const normalized =
        typeof count === 'number'
          ? count
          : (count?.count ?? count?.Count ?? count?.unreadCount ?? count?.UnreadCount ?? 0);
      setUnreadCount(normalized);
    } catch (_e) {
      // ignore errors silently
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const t = setInterval(refreshUnreadCount, 60000);
    return () => clearInterval(t);
  }, [refreshUnreadCount]);

  // Reset pagination when events change
  useEffect(() => {
    setFeaturedEventsPage(1);
  }, [upcomingEvents.length]);

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
                setRegisteredEvents([]);
                setTotalRegisteredEventsCount(0);
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
              const eventsWithStatus = enrichEventsWithBookingStatus(events, eventBookings);
              
              // Set total count (all registered events, including past ones)
              setTotalRegisteredEventsCount(eventsWithStatus.length);
              
              // Filter to only show upcoming events (StartDate >= today)
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const upcomingRegisteredEvents = eventsWithStatus.filter(event => {
                if (!event.StartDate) return false;
                const startDate = new Date(event.StartDate);
                return startDate >= today;
              });
              
              upcomingRegisteredEvents.sort((a, b) => {
                const dateA = new Date(a.StartDate || a.startDate);
                const dateB = new Date(b.StartDate || b.startDate);
                return dateA - dateB;
              });
              
              console.log('Total registered events:', eventsWithStatus.length);
              console.log('Upcoming registered events:', upcomingRegisteredEvents.length);
              console.log('=== LOADING REGISTERED EVENTS - END ===');
              
              setRegisteredEvents(upcomingRegisteredEvents);
            } catch (error) {
              console.error('=== ERROR LOADING REGISTERED EVENTS ===');
              console.error('Error details:', error);
              setRegisteredEvents([]);
              setTotalRegisteredEventsCount(0);
            }
          };
          

          // Load active events (sorted by newest first)
          const loadUpcomingEvents = async () => {
            try {
              console.log('Loading active events...');
              // Get all active events (status = 0 for Active)
              const response = await eventApi.getEvents({ status: 0, pageSize: 100 });
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
              
              // Sort by newest first (createdAt descending, then by startDate)
              normalizedEvents.sort((a, b) => {
                // Try to get createdAt from various possible field names
                const aCreatedAt = a.createdAt || a.CreatedAt || a.created_at || a.Created_At || 
                                  (a.originalEvent && (a.originalEvent.createdAt || a.originalEvent.CreatedAt));
                const bCreatedAt = b.createdAt || b.CreatedAt || b.created_at || b.Created_At || 
                                  (b.originalEvent && (b.originalEvent.createdAt || b.originalEvent.CreatedAt));
                
                // If both have createdAt, use it for sorting (newest first)
                if (aCreatedAt && bCreatedAt) {
                  const aDate = new Date(aCreatedAt).getTime();
                  const bDate = new Date(bCreatedAt).getTime();
                  return bDate - aDate; // Descending (newest first)
                }
                
                // If only one has createdAt, prioritize it
                if (aCreatedAt && !bCreatedAt) return -1;
                if (!aCreatedAt && bCreatedAt) return 1;
                
                // Fallback to startDate if createdAt is not available
                const aStartDate = a.startDate || a.StartDate || a.start_date || a.Start_Date || 0;
                const bStartDate = b.startDate || b.StartDate || b.start_date || b.Start_Date || 0;
                const aDate = new Date(aStartDate).getTime();
                const bDate = new Date(bStartDate).getTime();
                
                // Sort descending (newest first)
                return bDate - aDate;
              });
              
              setUpcomingEvents(normalizedEvents);
            } catch (error) {
              console.error('Error loading events:', error);
              setUpcomingEvents([]);
            }
          };

          console.log('About to call Promise.all with loadRegisteredEvents');
          console.log('Will call: loadRegisteredEvents, loadUpcomingEvents, loadNotifications');
          
          await Promise.all([
            loadRegisteredEvents(),
            loadUpcomingEvents(),
            loadNotifications()
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
        const eventsWithStatus = enrichEventsWithBookingStatus(events, eventBookings);
        
        // Set total count (all registered events, including past ones)
        setTotalRegisteredEventsCount(eventsWithStatus.length);
        
        // Sort by start date (upcoming first)
        eventsWithStatus.sort((a, b) => {
          const dateA = new Date(a.StartDate || a.startDate);
          const dateB = new Date(b.StartDate || b.startDate);
          return dateA - dateB;
        });
        
        console.log('Registered events loaded:', eventsWithStatus.length);
        setRegisteredEvents(eventsWithStatus);
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
        setTotalRegisteredEventsCount(0);
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
      const rawList = Array.isArray(response) ? response : (response?.data || response?.Data || []);
      const notifs = rawList.map((item) => ({
        ...item,
        isRead: item.isRead ?? item.IsRead,
        status: item.status ?? item.Status,
        startDate: item.startDate ?? item.StartDate,
        endDate: item.endDate ?? item.EndDate,
        title: item.title ?? item.Title,
        content: item.content ?? item.Content,
        createdAt: item.createdAt ?? item.CreatedAt,
      }));
      setNotifications(notifs);
      // Also update unread count from list as fallback
      const localUnread = notifs.filter(n => !n.isRead).length;
      setUnreadCount((prev) => {
        if (typeof prev === 'number' && prev > localUnread) {
          return prev;
        }
        return localUnread;
      });
      await refreshUnreadCount();
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

  // Status helpers
  const getStatusBadgeClass = (status) => {
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
      case 'Pending':
        return 'status-badge status-pending';
      case 'Active':
        return 'status-badge status-available';
      case 'Inactive':
        return 'status-badge status-unavailable';
      case 'Cancelled':
        return 'status-badge status-maintenance';
      case 'Completed':
        return 'status-badge status-occupied';
      default:
        return 'status-badge unknown';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
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

  const parseBookingStatus = (booking) => {
    if (!booking) return undefined;
    const rawStatus =
      booking.status ??
      booking.Status ??
      booking.bookingStatus ??
      booking.BookingStatus;
    if (rawStatus === undefined || rawStatus === null) return undefined;
    const statusNumber = Number(rawStatus);
    return Number.isNaN(statusNumber) ? undefined : statusNumber;
  };

  const enrichEventsWithBookingStatus = (events = [], eventBookings = []) => {
    if (!Array.isArray(events)) return [];

    const bookingMap = new Map();

    if (Array.isArray(eventBookings)) {
      eventBookings.forEach((booking) => {
        const eventId = booking?.eventId || booking?.EventId;
        if (!eventId) return;

        const status = parseBookingStatus(booking);
        const bookingId = booking?.id || booking?.Id;
        const key = String(eventId).toLowerCase();

        // Prefer keeping the first booking encountered; assume single active booking per event
        if (!bookingMap.has(key)) {
          bookingMap.set(key, {
            status,
            bookingId,
            booking
          });
        }
      });
    }

    return events.map((event) => {
      const eventId = String(event.Id || event.id || '').toLowerCase();
      const info = bookingMap.get(eventId);

      if (!info || info.status === undefined) {
        return {
          ...event,
          BookingStatus: undefined,
          BookingStatusLabel: null,
          BookingStatusColor: undefined,
          BookingId: info?.bookingId,
          BookingData: info?.booking
        };
      }

      return {
        ...event,
        BookingStatus: info.status,
        BookingStatusLabel: getBookingStatusLabel(info.status),
        BookingStatusColor: getBookingStatusColor(info.status),
        BookingId: info.bookingId,
        BookingData: info.booking
      };
    });
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
  ].filter(Boolean);

  // Render different content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
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
            Join events and manage your schedule all in one place
          </p>
          <div className="home-hero-actions">
            <button className="btn-hero-primary" onClick={() => setActiveTab('events')}>
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
            <p className="quick-stat-number">{totalRegisteredEventsCount}</p>
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
            ) : (() => {
              // Calculate pagination
              const totalPages = Math.ceil(upcomingEvents.length / featuredEventsPerPage);
              const startIndex = (featuredEventsPage - 1) * featuredEventsPerPage;
              const endIndex = startIndex + featuredEventsPerPage;
              const currentPageEvents = upcomingEvents.slice(startIndex, endIndex);
              
              return (
                <>
              <div className="home-event-list">
                    {currentPageEvents.map(event => {
                  const normalized = normalizeEvent(event);
                      const eventStatus = normalized.Status || normalized.status;
                      const normalizedStatus = normalizeStatus(eventStatus);
                  return (
                        <div key={normalized.Id} className="home-event-item" style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ position: 'relative', height: 140, background: '#f8fafc' }}>
                            {normalized.ImageUrl || normalized.imageUrl ? (
                              <img src={normalized.ImageUrl || normalized.imageUrl} alt={`${normalized.Title} cover`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>No image</div>
                            )}
                            <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <span className={getStatusBadgeClass(eventStatus)}>{normalizedStatus || 'Unknown'}</span>
                              {normalized.visibility && (
                                <span style={{
                                  padding: '4px 8px',
                                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  color: '#3b82f6',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="2" y1="12" x2="22" y2="12"></line>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                                  Public
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <h3
                                onClick={() => {
                                  setViewingEventId(normalized.Id);
                                  setActiveTab('events');
                                }}
                                style={{
                                  fontSize: 16,
                                  margin: 0,
                                  color: '#0f172a',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  textUnderlineOffset: '2px'
                                }}
                                title="View details"
                              >
                                {normalized.Title}
                              </h3>
                            </div>
                            {(normalized.Description || normalized.description) && (
                              <div className="text-muted small" style={{ color: '#64748b', fontSize: '13px', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {normalized.Description || normalized.description}
                          </div>
                        )}
                            {/* Lecturer info - Only show for Student */}
                            {(normalized.CreatedBy || normalized.createdBy) && userRole === 'Student' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <span style={{ fontWeight: '500' }}>Lecturer: {normalized.CreatedBy || normalized.createdBy || 'Unknown'}</span>
                      </div>
                            )}
                            {/* Date and Time */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', fontSize: '12px', color: '#64748b', flexWrap: 'wrap' }}>
                              {normalized.StartDate || normalized.startDate ? (
                                <>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                      <line x1="16" y1="2" x2="16" y2="6"></line>
                                      <line x1="8" y1="2" x2="8" y2="6"></line>
                                      <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    <span>{formatDate(normalized.StartDate || normalized.startDate)}</span>
                                  </div>
                                  {(normalized.StartDate || normalized.startDate) && (normalized.EndDate || normalized.endDate) && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                                      <span>{formatTime(normalized.StartDate || normalized.startDate)} - {formatTime(normalized.EndDate || normalized.endDate)}</span>
                                    </div>
                                  )}
                                </>
                              ) : null}
                            </div>
                            {/* Lab and Room info */}
                            {(normalized.labName || normalized.LabName || normalized.roomName || normalized.RoomName || (normalized.roomSlots && normalized.roomSlots.length > 0) || (normalized.RoomSlots && normalized.RoomSlots.length > 0)) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                {normalized.labName || normalized.LabName ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#ea580c', fontWeight: '600' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                            </svg>
                                    <span>{normalized.labName || normalized.LabName}</span>
                                  </div>
                                ) : null}
                                {(normalized.roomName || normalized.RoomName || (normalized.roomSlots && normalized.roomSlots.length > 0) || (normalized.RoomSlots && normalized.RoomSlots.length > 0)) && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#1d4ed8', fontWeight: '600' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                    </svg>
                                    <span>
                                      {(() => {
                                        const roomSlots = normalized.roomSlots || normalized.RoomSlots || [];
                                        if (roomSlots.length > 0) {
                                          const roomNames = roomSlots
                                            .map(slot => slot.roomName || slot.RoomName || (slot.room && (slot.room.name || slot.room.Name)) || (slot.Room && (slot.Room.name || slot.Room.Name)))
                                            .filter(Boolean);
                                          const uniqueRooms = [...new Set(roomNames)];
                                          if (uniqueRooms.length === 1) {
                                            return uniqueRooms[0];
                                          } else if (uniqueRooms.length > 1) {
                                            return `${uniqueRooms.length} rooms: ${uniqueRooms.join(', ')}`;
                                          }
                                        }
                                        return normalized.roomName || normalized.RoomName || 'N/A';
                                      })()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Capacity */}
                            {normalized.capacity != null && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="9" cy="7" r="4"></circle>
                                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                <span>Capacity: {normalized.capacity} people</span>
                      </div>
                            )}
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              marginTop: 12,
                              paddingTop: 12,
                              borderTop: '1px solid #e5e7eb',
                              gap: 12
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b', flexShrink: 0 }}>
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                  <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <span style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {normalized.Location || normalized.location || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                    </div>
                  );
                })}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginTop: '24px',
                      padding: '16px 0'
                    }}>
                      <button
                        onClick={() => setFeaturedEventsPage(prev => Math.max(1, prev - 1))}
                        disabled={featuredEventsPage === 1}
                        style={{
                          padding: '8px 16px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          background: featuredEventsPage === 1 ? '#f3f4f6' : '#ffffff',
                          color: featuredEventsPage === 1 ? '#9ca3af' : '#374151',
                          cursor: featuredEventsPage === 1 ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 18l-6-6 6-6"></path>
                        </svg>
                        Previous
                      </button>
                      
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setFeaturedEventsPage(page)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              background: featuredEventsPage === page ? '#2563eb' : '#ffffff',
                              color: featuredEventsPage === page ? '#ffffff' : '#374151',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: featuredEventsPage === page ? '600' : '500',
                              minWidth: '40px'
                            }}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setFeaturedEventsPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={featuredEventsPage === totalPages}
                        style={{
                          padding: '8px 16px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          background: featuredEventsPage === totalPages ? '#f3f4f6' : '#ffffff',
                          color: featuredEventsPage === totalPages ? '#9ca3af' : '#374151',
                          cursor: featuredEventsPage === totalPages ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Next
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6"></path>
                        </svg>
                      </button>
              </div>
            )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="home-quick-actions">
        <h2>Quick Actions</h2>
        <div className="home-action-grid">
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

  const renderEvents = () => {
    if (viewingEventId) {
      return (
        <div className="home-content">
          <EventDetail
            eventId={viewingEventId}
            onNavigateBack={() => setViewingEventId(null)}
          userRole={userRole}
        />
        </div>
      );
    }
    
    return (
    <div className="home-content">
      <EventList 
        userRole={userRole}
        onSelectEvent={(eventId) => {
          console.log('Selected event:', eventId);
        }}
        onViewEvent={(eventId) => {
            setViewingEventId(eventId);
        }}
      />
    </div>
  );
  };

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
                  const bookingStatus = normalized.BookingStatus;
                  const bookingStatusLabel =
                    normalized.BookingStatusLabel ??
                    (bookingStatus !== undefined && bookingStatus !== null
                      ? getBookingStatusLabel(Number(bookingStatus))
                      : null);
                  const bookingStatusColor =
                    normalized.BookingStatusColor ??
                    (bookingStatusLabel ? getBookingStatusColor(Number(bookingStatus)) : undefined);
                  const eventStatus = normalized.Status || normalized.status;
                  const normalizedStatus = normalizeStatus(eventStatus);

                  return (
                    <div key={normalized.Id} className="home-event-item" style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                      {/* Event Image */}
                      <div style={{ position: 'relative', height: 140, background: '#f8fafc' }}>
                        {normalized.ImageUrl || normalized.imageUrl ? (
                          <img src={normalized.ImageUrl || normalized.imageUrl} alt={`${normalized.Title} cover`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>No image</div>
                        )}
                        {/* Event status badge on top of image */}
                        <div style={{ position: 'absolute', top: 8, left: 8 }}>
                          <span className={getStatusBadgeClass(eventStatus)}>{normalizedStatus || 'Unknown'}</span>
                        </div>
                      </div>
                      
                      {/* Event Info */}
                      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {/* Title and Booking Status */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <h3
                            onClick={() => {
                              setViewingEventId(normalized.Id);
                              setActiveTab('events');
                            }}
                            style={{
                              fontSize: 16,
                              margin: 0,
                              color: '#0f172a',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              textUnderlineOffset: '2px',
                              fontWeight: 700,
                              flex: 1,
                              minWidth: 0
                            }}
                            title="View details"
                          >
                            {normalized.Title}
                          </h3>
                          {bookingStatusLabel && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 12px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: bookingStatusColor || '#6b7280',
                                color: '#ffffff',
                                flexShrink: 0
                              }}
                            >
                              {bookingStatusLabel}
                            </span>
                          )}
                        </div>
                        
                        {/* Description */}
                        {(normalized.Description || normalized.description) && (
                          <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {normalized.Description || normalized.description}
                          </div>
                        )}
                        
                        {/* Lecturer info */}
                        {(normalized.CreatedBy || normalized.createdBy) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span style={{ fontWeight: '500' }}>Lecturer: {normalized.CreatedBy || normalized.createdBy || 'Unknown'}</span>
                          </div>
                        )}
                        
                        {/* Date and Time */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', fontSize: '12px', color: '#64748b', flexWrap: 'wrap' }}>
                          {normalized.StartDate || normalized.startDate ? (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                  <line x1="16" y1="2" x2="16" y2="6"></line>
                                  <line x1="8" y1="2" x2="8" y2="6"></line>
                                  <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <span>{formatDate(normalized.StartDate || normalized.startDate)}</span>
                              </div>
                              {(normalized.StartDate || normalized.startDate) && (normalized.EndDate || normalized.endDate) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                  <span>{formatTime(normalized.StartDate || normalized.startDate)} - {formatTime(normalized.EndDate || normalized.endDate)}</span>
                                </div>
                              )}
                            </>
                          ) : null}
                        </div>
                        
                        {/* Lab and Room info */}
                        {(normalized.labName || normalized.LabName || normalized.roomName || normalized.RoomName || (normalized.roomSlots && normalized.roomSlots.length > 0) || (normalized.RoomSlots && normalized.RoomSlots.length > 0)) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                            {normalized.labName || normalized.LabName ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#ea580c', fontWeight: '600' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                </svg>
                                <span>{normalized.labName || normalized.LabName}</span>
                              </div>
                            ) : null}
                            {(normalized.roomName || normalized.RoomName || (normalized.roomSlots && normalized.roomSlots.length > 0) || (normalized.RoomSlots && normalized.RoomSlots.length > 0)) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#1d4ed8', fontWeight: '600' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                                <span>
                                  {(() => {
                                    const roomSlots = normalized.roomSlots || normalized.RoomSlots || [];
                                    if (roomSlots.length > 0) {
                                      const roomNames = roomSlots
                                        .map(slot => slot.roomName || slot.RoomName || (slot.room && (slot.room.name || slot.room.Name)) || (slot.Room && (slot.Room.name || slot.Room.Name)))
                                        .filter(Boolean);
                                      const uniqueRooms = [...new Set(roomNames)];
                                      if (uniqueRooms.length === 1) {
                                        return uniqueRooms[0];
                                      } else if (uniqueRooms.length > 1) {
                                        return `${uniqueRooms.length} rooms: ${uniqueRooms.join(', ')}`;
                                      }
                                    }
                                    return normalized.roomName || normalized.RoomName || 'N/A';
                                  })()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Capacity */}
                        {normalized.capacity != null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            <span>Capacity: {normalized.capacity} people</span>
                          </div>
                        )}
                        
                        {/* Location */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: '1px solid #e5e7eb',
                          gap: 12
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b', flexShrink: 0 }}>
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {normalized.Location || normalized.location || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
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
            <img src={require('../../assets/images/fpt.png')} alt="FPT Logo" className="brand-logo" style={{ objectFit: 'contain' }} />
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
              onMouseEnter={() => {
                setNotificationDropdownOpen(true);
                loadNotifications();
                refreshUnreadCount();
              }}
              onMouseLeave={() => setNotificationDropdownOpen(false)}
              style={{ position: 'relative' }}
            >
              <button 
                className="home-icon-btn" 
                title="Notifications"
                onClick={() => setActiveTab('notifications')}
                style={{ position: 'relative' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                </svg>
                {unreadCount > 0 && (
                  <span
                    className="home-notification-badge"
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
                      boxShadow: '0 0 0 2px #fff',
                      zIndex: 50,
                      pointerEvents: 'none'
                    }}
                  >
                    {unreadCount > 10 ? '10+' : unreadCount}
                  </span>
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