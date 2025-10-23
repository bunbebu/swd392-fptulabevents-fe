/**
 * Notification Population Script for FPTU Lab Events
 * 
 * This script creates sample notifications for testing and development.
 * Notifications are standalone and don't depend on other data.
 * 
 * Usage:
 *   node scripts/populate-notifications.js
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
const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE';

// Target groups for notifications
const TARGET_GROUPS = {
  ALL: 'All',
  LECTURER: 'Lecturer',
  STUDENT: 'Student'
};

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
  {
    title: 'Faculty Meeting: Lab Resource Planning',
    content: 'All lecturers are invited to attend the lab resource planning meeting next Friday at 2:00 PM in Conference Room A. We will discuss lab allocation for the upcoming semester.',
    targetGroup: TARGET_GROUPS.LECTURER,
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString()
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
  {
    title: 'Exam Period Lab Reservations',
    content: 'During the exam period, priority will be given to exam-related lab bookings. Please book early and specify if your booking is exam-related.',
    targetGroup: TARGET_GROUPS.STUDENT,
    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Free Coding Bootcamp This Weekend',
    content: 'Join our free weekend coding bootcamp! Topics include Web Development, Mobile Apps, and Cloud Computing. Refreshments will be provided. Register at the Student Services office.',
    targetGroup: TARGET_GROUPS.STUDENT,
    startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
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
  {
    title: 'Software License Renewal',
    content: 'All software licenses will be renewed next month. If you need any specific software installed in the labs, please submit your request to the IT department.',
    targetGroup: TARGET_GROUPS.LECTURER,
    startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString()
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
  },
  {
    title: 'Lab Inspection Completed',
    content: 'The annual lab safety inspection has been completed. All labs have passed the inspection. Thank you for maintaining a safe and clean environment.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
];

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

// Helper function to determine notification status
function getNotificationStatus(startDate, endDate) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) return 'Scheduled';
  if (now > end) return 'Expired';
  return 'Active';
}

// Main execution function
async function populateNotifications() {
  console.log('🔔 Starting notification population...\n');

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
    console.log('📝 Creating notifications...\n');
    
    let successCount = 0;
    let failCount = 0;
    const stats = {
      active: 0,
      scheduled: 0,
      expired: 0,
      all: 0,
      lecturer: 0,
      student: 0
    };

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
        successCount++;
        
        // Determine status
        const status = getNotificationStatus(notificationData.startDate, notificationData.endDate);
        
        // Update stats
        if (status === 'Active') stats.active++;
        if (status === 'Scheduled') stats.scheduled++;
        if (status === 'Expired') stats.expired++;
        if (notificationData.targetGroup === TARGET_GROUPS.ALL) stats.all++;
        if (notificationData.targetGroup === TARGET_GROUPS.LECTURER) stats.lecturer++;
        if (notificationData.targetGroup === TARGET_GROUPS.STUDENT) stats.student++;
        
        // Status emoji
        const statusEmoji = status === 'Active' ? '🟢' : status === 'Scheduled' ? '🔵' : '⚫';
        const targetEmoji = notificationData.targetGroup === TARGET_GROUPS.ALL ? '👥' : 
                           notificationData.targetGroup === TARGET_GROUPS.LECTURER ? '👨‍🏫' : '👨‍🎓';
        
        console.log(`  ✅ ${statusEmoji} ${targetEmoji} [${status}] [${notificationData.targetGroup}]: ${notificationData.title}`);
      } catch (error) {
        failCount++;
        console.error(`  ❌ Failed to create "${notificationData.title}":`, error.message);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 NOTIFICATION POPULATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total notifications created: ${successCount}/${NOTIFICATIONS_DATA.length}`);
    if (failCount > 0) {
      console.log(`Failed to create:            ${failCount}`);
    }
    console.log('\nBy Status:');
    console.log(`  🟢 Active:    ${stats.active}`);
    console.log(`  🔵 Scheduled: ${stats.scheduled}`);
    console.log(`  ⚫ Expired:   ${stats.expired}`);
    console.log('\nBy Target Group:');
    console.log(`  👥 All:       ${stats.all}`);
    console.log(`  👨‍🏫 Lecturer:  ${stats.lecturer}`);
    console.log(`  👨‍🎓 Student:   ${stats.student}`);
    console.log('='.repeat(70));
    console.log('\n✨ Notification population completed!\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
populateNotifications();

