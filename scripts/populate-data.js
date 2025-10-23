/**
 * Data Population Script for FPTU Lab Events
 * 
 * This script creates a variety of rooms and equipment for testing and development.
 * 
 * Usage:
 *   node scripts/populate-data.js
 * 
 * Requirements:
 *   - You must be logged in as an Admin user
 *   - Set your access token in the ADMIN_TOKEN variable below
 * 
 * How to get your token:
 *   1. Login to the application as Admin
 *   2. Open browser DevTools (F12)
 *   3. Go to Application/Storage > Local Storage
 *   4. Copy the value of 'accessToken'
 *   5. Paste it in the ADMIN_TOKEN variable below
 */

const API_BASE_URL = 'http://swd392group6.runasp.net';

// ⚠️ IMPORTANT: Replace this with your actual admin access token
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI0ZGI0NGQwOS0yZTVmLTQ3YWMtOTk0NC01MTE5MmVkZGY4OTUiLCJzdGF0dXMiOiJBY3RpdmUiLCJlbWFpbCI6InBodWNuaHNlMTgyOTMyQGZwdC5lZHUudm4iLCJyb2xlIjoiQWRtaW4iLCJuYW1laWQiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEiLCJuYmYiOjE3NjExNDE0MTksImV4cCI6MTc2MTE0NTAxOSwiaWF0IjoxNzYxMTQxNDE5LCJpc3MiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEifQ.ZqJSIeVtVcVoWEckTArchD6o1Ci_JDm-qbFfyta4CnQ';

// Sample room data with variety
const ROOMS_DATA = [
  {
    name: 'Computer Lab 1',
    description: 'Main computer laboratory with 40 workstations, equipped with latest software development tools',
    location: 'Building A - Floor 2 - Room 201',
    capacity: 40,
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800'
  },
  {
    name: 'Computer Lab 2',
    description: 'Secondary computer lab with high-performance machines for data science and AI courses',
    location: 'Building A - Floor 2 - Room 202',
    capacity: 35,
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800'
  },
  {
    name: 'Computer Lab 3',
    description: 'Specialized lab for network and security courses with advanced networking equipment',
    location: 'Building A - Floor 3 - Room 301',
    capacity: 30,
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800'
  },
  {
    name: 'Multimedia Lab',
    description: 'Creative lab with video editing stations, graphics tablets, and professional audio equipment',
    location: 'Building B - Floor 1 - Room 105',
    capacity: 25,
    imageUrl: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800'
  },
  {
    name: 'Conference Room A',
    description: 'Large conference room with video conferencing system and presentation equipment',
    location: 'Building C - Floor 1 - Room 101',
    capacity: 50,
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'
  },
  {
    name: 'Conference Room B',
    description: 'Medium-sized meeting room ideal for team discussions and small presentations',
    location: 'Building C - Floor 1 - Room 102',
    capacity: 20,
    imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800'
  },
  {
    name: 'Lecture Hall 1',
    description: 'Large lecture hall with tiered seating and advanced AV system',
    location: 'Building D - Floor 1 - Room 101',
    capacity: 100,
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800'
  },
  {
    name: 'Lecture Hall 2',
    description: 'Modern lecture hall with interactive whiteboard and recording capabilities',
    location: 'Building D - Floor 2 - Room 201',
    capacity: 80,
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800'
  },
  {
    name: 'Innovation Lab',
    description: 'Collaborative workspace for innovation projects with flexible seating and prototyping tools',
    location: 'Building E - Floor 1 - Room 110',
    capacity: 30,
    imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800'
  },
  {
    name: 'Study Room 1',
    description: 'Quiet study room for individual or small group work',
    location: 'Library - Floor 2 - Room 201',
    capacity: 10,
    imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800'
  }
];

// Equipment types mapping (from equipmentConstants.js)
const EQUIPMENT_TYPES = {
  COMPUTER: 0,
  PROJECTOR: 1,
  PRINTER: 2,
  SCANNER: 3,
  NETWORK: 4,
  AUDIO: 5,
  OTHER: 6
};

// Event status mapping (from eventConstants.js)
const EVENT_STATUS = {
  ACTIVE: 0,
  INACTIVE: 1,
  CANCELLED: 2,
  COMPLETED: 3
};

// Target groups for notifications
const TARGET_GROUPS = {
  ALL: 'All',
  LECTURER: 'Lecturer',
  STUDENT: 'Student'
};

// Sample event data
const EVENTS_DATA = [
  {
    title: 'AI & Machine Learning Workshop 2024',
    description: 'Join us for an intensive workshop on AI and Machine Learning fundamentals. Learn about neural networks, deep learning, and practical applications. Hands-on coding sessions included.',
    location: 'Lab A101, Building A',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Web Development Bootcamp',
    description: 'Comprehensive bootcamp covering HTML, CSS, JavaScript, React, and Node.js. Perfect for beginners and intermediate developers.',
    location: 'Lab B202, Building B',
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Cybersecurity Fundamentals',
    description: 'Learn the basics of cybersecurity, including network security, encryption, ethical hacking, and best practices for secure coding.',
    location: 'Lab C303, Building C',
    startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Mobile App Development with Flutter',
    description: 'Build cross-platform mobile applications using Flutter and Dart. Learn UI design, state management, and API integration.',
    location: 'Lab A105, Building A',
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Cloud Computing with AWS',
    description: 'Introduction to Amazon Web Services (AWS). Learn about EC2, S3, Lambda, and cloud architecture best practices.',
    location: 'Lab D401, Building D',
    startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Weekly Coding Club',
    description: 'Join our weekly coding club for collaborative programming, code reviews, and tech discussions. All skill levels welcome!',
    location: 'Lab A102, Building A',
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: 'FREQ=WEEKLY;BYDAY=FR'
  },
  {
    title: 'Database Design Workshop',
    description: 'Completed workshop on database design principles, SQL optimization, and NoSQL databases.',
    location: 'Lab B201, Building B',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.COMPLETED,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Git & GitHub Masterclass',
    description: 'Completed masterclass on version control with Git and GitHub. Covered branching, merging, pull requests, and collaboration.',
    location: 'Lab C301, Building C',
    startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.COMPLETED,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'IoT Development Workshop',
    description: 'This workshop was cancelled due to equipment unavailability. Will be rescheduled.',
    location: 'Lab D402, Building D',
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.CANCELLED,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Blockchain & Cryptocurrency Seminar',
    description: 'Draft event: Seminar on blockchain technology and cryptocurrency. Details to be finalized.',
    location: 'Lab A103, Building A',
    startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.INACTIVE,
    visibility: false,
    recurrenceRule: null
  },
  {
    title: 'Data Science & Analytics Workshop',
    description: 'Learn data analysis, visualization, and machine learning with Python. Hands-on projects with real datasets.',
    location: 'Lab B203, Building B',
    startDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'DevOps & CI/CD Pipeline',
    description: 'Introduction to DevOps practices, Docker, Kubernetes, Jenkins, and automated deployment pipelines.',
    location: 'Lab C302, Building C',
    startDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'UI/UX Design Principles',
    description: 'Learn user interface and user experience design principles. Figma, prototyping, and user research techniques.',
    location: 'Lab A104, Building A',
    startDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Software Testing & QA',
    description: 'Comprehensive guide to software testing, including unit testing, integration testing, and test automation.',
    location: 'Lab D403, Building D',
    startDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Agile & Scrum Methodology',
    description: 'Learn Agile development practices and Scrum framework. Sprint planning, daily standups, and retrospectives.',
    location: 'Lab B204, Building B',
    startDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  }
];

// Sample notification data
const NOTIFICATIONS_DATA = [
  // Active notifications for all users
  {
    title: 'Welcome to FPTU Lab Events System',
    content: 'Welcome to the FPTU Lab Events Management System! This platform helps you manage lab bookings, equipment, and events efficiently. Please explore the features and contact support if you need assistance.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Started 7 days ago
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Ends in 30 days
  },
  {
    title: 'System Maintenance Scheduled',
    content: 'The system will undergo scheduled maintenance on Saturday, 8:00 AM - 12:00 PM. During this time, some features may be temporarily unavailable. We apologize for any inconvenience.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'New Equipment Available in Computer Lab 1',
    content: 'We have added 10 new high-performance workstations in Computer Lab 1. These machines are equipped with the latest software development tools and are available for booking.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  },

  // Notifications for Lecturers
  {
    title: 'Lab Booking Policy Update',
    content: 'Dear Lecturers, please note that lab bookings must be made at least 24 hours in advance. Last-minute bookings may not be approved. For urgent requests, please contact the admin team directly.',
    targetGroup: TARGET_GROUPS.LECTURER,
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'New Event Management Features',
    content: 'We have added new features to the event management system. You can now create recurring events, add multiple rooms to an event, and export event reports. Check out the updated documentation for more details.',
    targetGroup: TARGET_GROUPS.LECTURER,
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Equipment Maintenance Schedule',
    content: 'All equipment in Computer Labs 1-3 will undergo routine maintenance next week. Please plan your lab sessions accordingly. Maintenance schedule: Monday-Wednesday, 2:00 PM - 5:00 PM.',
    targetGroup: TARGET_GROUPS.LECTURER,
    startDate: new Date(Date.now()).toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Semester Planning Reminder',
    content: 'Please submit your lab booking requests for the upcoming semester by the end of this month. Early submissions help us allocate resources more efficiently.',
    targetGroup: TARGET_GROUPS.LECTURER,
    startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
  },

  // Notifications for Students
  {
    title: 'Lab Access Hours Extended',
    content: 'Good news! Lab access hours have been extended. Computer Labs are now open from 7:00 AM to 10:00 PM on weekdays. Weekend hours remain 9:00 AM - 6:00 PM.',
    targetGroup: TARGET_GROUPS.STUDENT,
    startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Upcoming Workshop: AI & Machine Learning',
    content: 'Join us for an intensive workshop on AI and Machine Learning fundamentals next week! Learn about neural networks, deep learning, and practical applications. Register now as seats are limited.',
    targetGroup: TARGET_GROUPS.STUDENT,
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Lab Equipment Usage Guidelines',
    content: 'Please remember to follow lab equipment usage guidelines: 1) Do not install unauthorized software, 2) Report any equipment issues immediately, 3) Clean up your workspace before leaving. Thank you for your cooperation!',
    targetGroup: TARGET_GROUPS.STUDENT,
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Study Room Booking Now Available',
    content: 'You can now book study rooms through the system! Study rooms are perfect for group projects and exam preparation. Bookings can be made up to 7 days in advance.',
    targetGroup: TARGET_GROUPS.STUDENT,
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
  },

  // Scheduled notifications (future)
  {
    title: 'Upcoming Holiday Lab Closure',
    content: 'All labs will be closed during the upcoming holiday period (Dec 24 - Jan 2). Please plan your projects accordingly. Emergency access can be requested through the admin team.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'New Semester Registration Opens',
    content: 'Registration for next semester lab sessions will open in two weeks. Make sure to register early to secure your preferred time slots.',
    targetGroup: TARGET_GROUPS.STUDENT,
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },

  // Expired notifications (for testing)
  {
    title: 'Previous System Update Completed',
    content: 'The system update that was scheduled for last week has been completed successfully. All new features are now available. Thank you for your patience.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Workshop Registration Closed',
    content: 'Registration for the Database Design Workshop has been closed. Thank you to all participants! Look forward to our next workshop.',
    targetGroup: TARGET_GROUPS.STUDENT,
    startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Function to generate equipment data
function generateEquipmentData(roomIds) {
  const equipment = [];
  
  // Computers for Computer Labs
  const computerLabRooms = roomIds.slice(0, 3); // First 3 rooms are computer labs
  computerLabRooms.forEach((roomId, labIndex) => {
    const labNumber = labIndex + 1;
    const computerCount = [40, 35, 30][labIndex];
    
    for (let i = 1; i <= computerCount; i++) {
      equipment.push({
        name: `Desktop Computer ${labNumber}-${String(i).padStart(2, '0')}`,
        description: `Dell OptiPlex 7090 - Intel i7, 16GB RAM, 512GB SSD`,
        serialNumber: `PC-LAB${labNumber}-${String(i).padStart(3, '0')}`,
        type: EQUIPMENT_TYPES.COMPUTER,
        imageUrl: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400',
        roomId: roomId
      });
    }
  });

  // Multimedia Lab Equipment
  if (roomIds[3]) {
    for (let i = 1; i <= 25; i++) {
      equipment.push({
        name: `Multimedia Workstation ${String(i).padStart(2, '0')}`,
        description: `HP Z4 Workstation - Intel Xeon, 32GB RAM, NVIDIA RTX 3060`,
        serialNumber: `MM-WS-${String(i).padStart(3, '0')}`,
        type: EQUIPMENT_TYPES.COMPUTER,
        imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400',
        roomId: roomIds[3]
      });
    }
  }

  // Projectors for all rooms
  roomIds.forEach((roomId, index) => {
    equipment.push({
      name: `Projector ${index + 1}`,
      description: `Epson EB-2250U - 5000 Lumens, WUXGA, 3LCD Technology`,
      serialNumber: `PROJ-${String(index + 1).padStart(3, '0')}`,
      type: EQUIPMENT_TYPES.PROJECTOR,
      imageUrl: 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?w=400',
      roomId: roomId
    });
  });

  // Printers
  const printerRooms = [roomIds[0], roomIds[1], roomIds[2], roomIds[3]]; // Labs and multimedia room
  printerRooms.forEach((roomId, index) => {
    if (roomId) {
      equipment.push({
        name: `Laser Printer ${index + 1}`,
        description: `HP LaserJet Pro M404dn - Monochrome, Duplex, Network`,
        serialNumber: `PRINT-${String(index + 1).padStart(3, '0')}`,
        type: EQUIPMENT_TYPES.PRINTER,
        imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400',
        roomId: roomId
      });
    }
  });

  // Scanners
  if (roomIds[0] && roomIds[1]) {
    equipment.push({
      name: 'Document Scanner 1',
      description: 'Fujitsu ScanSnap iX1600 - High-speed document scanner',
      serialNumber: 'SCAN-001',
      type: EQUIPMENT_TYPES.SCANNER,
      imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400',
      roomId: roomIds[0]
    });
    
    equipment.push({
      name: 'Document Scanner 2',
      description: 'Canon imageFORMULA DR-C225 II - Compact document scanner',
      serialNumber: 'SCAN-002',
      type: EQUIPMENT_TYPES.SCANNER,
      imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400',
      roomId: roomIds[1]
    });
  }

  // Network Equipment
  roomIds.forEach((roomId, index) => {
    equipment.push({
      name: `Network Switch ${index + 1}`,
      description: `Cisco Catalyst 2960-X - 48 Port Gigabit Switch`,
      serialNumber: `NET-SW-${String(index + 1).padStart(3, '0')}`,
      type: EQUIPMENT_TYPES.NETWORK,
      imageUrl: 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400',
      roomId: roomId
    });
  });

  // Audio Equipment for Conference Rooms and Lecture Halls
  const audioRooms = [roomIds[4], roomIds[5], roomIds[6], roomIds[7]]; // Conference rooms and lecture halls
  audioRooms.forEach((roomId, index) => {
    if (roomId) {
      equipment.push({
        name: `Audio System ${index + 1}`,
        description: `Professional PA System with wireless microphones and speakers`,
        serialNumber: `AUDIO-${String(index + 1).padStart(3, '0')}`,
        type: EQUIPMENT_TYPES.AUDIO,
        imageUrl: 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=400',
        roomId: roomId
      });
      
      equipment.push({
        name: `Wireless Microphone Set ${index + 1}`,
        description: `Shure BLX288/PG58 Dual Wireless Microphone System`,
        serialNumber: `MIC-${String(index + 1).padStart(3, '0')}`,
        type: EQUIPMENT_TYPES.AUDIO,
        imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400',
        roomId: roomId
      });
    }
  });

  // Other Equipment
  if (roomIds[8]) { // Innovation Lab
    equipment.push({
      name: '3D Printer',
      description: 'Ultimaker S5 - Professional 3D Printer',
      serialNumber: 'OTHER-3DP-001',
      type: EQUIPMENT_TYPES.OTHER,
      imageUrl: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=400',
      roomId: roomIds[8]
    });
    
    equipment.push({
      name: 'Whiteboard Camera',
      description: 'Kaptivo Whiteboard Camera System',
      serialNumber: 'OTHER-WBC-001',
      type: EQUIPMENT_TYPES.OTHER,
      imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400',
      roomId: roomIds[8]
    });
  }

  return equipment;
}

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const text = await response.text();
  
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`API Error (${response.status}): ${JSON.stringify(data)}`);
  }

  return data?.Data || data?.data || data;
}

// Main execution function
async function populateData() {
  console.log('🚀 Starting data population...\n');

  // Validate token
  if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
    console.error('❌ ERROR: Please set your admin access token in the ADMIN_TOKEN variable!');
    console.log('\nHow to get your token:');
    console.log('1. Login to the application as Admin');
    console.log('2. Open browser DevTools (F12)');
    console.log('3. Go to Application/Storage > Local Storage');
    console.log('4. Copy the value of "accessToken"');
    console.log('5. Paste it in the ADMIN_TOKEN variable in this script\n');
    process.exit(1);
  }

  try {
    // Step 1: Create Rooms
    console.log('📍 Creating rooms...');
    const createdRooms = [];
    
    for (const roomData of ROOMS_DATA) {
      try {
        const room = await apiRequest('/api/rooms', 'POST', roomData);
        createdRooms.push(room);
        console.log(`  ✅ Created: ${roomData.name} (ID: ${room.id || room.Id})`);
      } catch (error) {
        console.error(`  ❌ Failed to create ${roomData.name}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully created ${createdRooms.length} rooms\n`);

    // Step 2: Create Equipment
    console.log('🔧 Creating equipment...');
    const roomIds = createdRooms.map(room => room.id || room.Id);
    const equipmentData = generateEquipmentData(roomIds);
    
    let successCount = 0;
    let failCount = 0;

    for (const equipment of equipmentData) {
      try {
        await apiRequest('/api/equipments', 'POST', equipment);
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`  ⏳ Created ${successCount}/${equipmentData.length} equipment...`);
        }
      } catch (error) {
        failCount++;
        console.error(`  ❌ Failed to create ${equipment.name}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully created ${successCount} equipment items`);
    if (failCount > 0) {
      console.log(`⚠️  Failed to create ${failCount} equipment items`);
    }

    // Step 3: Create Events
    console.log('\n📅 Creating events...');
    let eventSuccessCount = 0;
    let eventFailCount = 0;

    for (const eventData of EVENTS_DATA) {
      try {
        // Transform to backend format
        const payload = {
          Title: eventData.title,
          Description: eventData.description || '',
          StartDate: eventData.startDate,
          EndDate: eventData.endDate,
          Location: eventData.location || '',
          Status: eventData.status !== undefined ? eventData.status : 0,
          Visibility: eventData.visibility !== undefined ? eventData.visibility : true,
          RecurrenceRule: eventData.recurrenceRule || null
        };

        await apiRequest('/api/events', 'POST', payload);
        eventSuccessCount++;
        console.log(`  ✅ Created: ${eventData.title}`);
      } catch (error) {
        eventFailCount++;
        console.error(`  ❌ Failed to create ${eventData.title}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully created ${eventSuccessCount} events`);
    if (eventFailCount > 0) {
      console.log(`⚠️  Failed to create ${eventFailCount} events`);
    }

    // Step 4: Create Notifications
    console.log('\n🔔 Creating notifications...');
    let notificationSuccessCount = 0;
    let notificationFailCount = 0;

    for (const notificationData of NOTIFICATIONS_DATA) {
      try {
        // Transform to backend format (PascalCase)
        const payload = {
          Title: notificationData.title,
          Content: notificationData.content,
          TargetGroup: notificationData.targetGroup,
          StartDate: notificationData.startDate,
          EndDate: notificationData.endDate
        };

        await apiRequest('/api/notifications/admin', 'POST', payload);
        notificationSuccessCount++;

        // Show status based on dates
        const now = new Date();
        const start = new Date(notificationData.startDate);
        const end = new Date(notificationData.endDate);
        let status = 'Active';
        if (now < start) status = 'Scheduled';
        if (now > end) status = 'Expired';

        console.log(`  ✅ Created [${status}] [${notificationData.targetGroup}]: ${notificationData.title}`);
      } catch (error) {
        notificationFailCount++;
        console.error(`  ❌ Failed to create ${notificationData.title}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully created ${notificationSuccessCount} notifications`);
    if (notificationFailCount > 0) {
      console.log(`⚠️  Failed to create ${notificationFailCount} notifications`);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Rooms created:         ${createdRooms.length}/${ROOMS_DATA.length}`);
    console.log(`Equipment created:     ${successCount}/${equipmentData.length}`);
    console.log(`Events created:        ${eventSuccessCount}/${EVENTS_DATA.length}`);
    console.log(`Notifications created: ${notificationSuccessCount}/${NOTIFICATIONS_DATA.length}`);
    console.log('='.repeat(50));
    console.log('\n✨ Data population completed!\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
populateData();

