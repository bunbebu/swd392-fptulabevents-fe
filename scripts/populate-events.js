/**
 * Event Data Population Script for FPTU Lab Events
 * 
 * This script creates sample events for testing and development.
 * 
 * Usage:
 *   node scripts/populate-events.js
 * 
 * Requirements:
 *   - You must be logged in as an Admin user
 *   - Set your access token in the ADMIN_TOKEN variable below
 */

const API_BASE_URL = 'http://swd392group6.runasp.net';

// ⚠️ IMPORTANT: Replace this with your actual admin access token
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI2MDEzMTFiZS0zYWYyLTRjMTItYjc2Ni1mNTJhMTJlMjdhZjYiLCJzdGF0dXMiOiJBY3RpdmUiLCJlbWFpbCI6InBodWNuaHNlMTgyOTMyQGZwdC5lZHUudm4iLCJyb2xlIjoiQWRtaW4iLCJuYW1laWQiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEiLCJuYmYiOjE3NjExNDIzMTcsImV4cCI6MTc2MTE0NTkxNywiaWF0IjoxNzYxMTQyMzE3LCJpc3MiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEifQ.G7nkfKLBA0gm7xtxBMrL351VFfQVPt35Q6cgiEY2pcw';

// Event status mapping
const EVENT_STATUS = {
  ACTIVE: 0,
  INACTIVE: 1,
  CANCELLED: 2,
  COMPLETED: 3
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
async function populateEvents() {
  console.log('🚀 Starting event data population...\n');

  // Validate token
  if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
    console.error('❌ ERROR: Please set your admin access token in the ADMIN_TOKEN variable!');
    process.exit(1);
  }

  try {
    console.log('📅 Creating events...\n');
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (let i = 0; i < EVENTS_DATA.length; i++) {
      const eventData = EVENTS_DATA[i];
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

        console.log(`📝 [${i + 1}/${EVENTS_DATA.length}] Creating: ${eventData.title}`);
        await apiRequest('/api/events', 'POST', payload);
        successCount++;
        console.log(`✅ Success!\n`);
      } catch (error) {
        failCount++;
        errors.push({ title: eventData.title, error: error.message });
        console.error(`❌ Failed: ${error.message}\n`);
      }
    }

    // Summary
    console.log('='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total events:  ${EVENTS_DATA.length}`);
    console.log(`✅ Success:    ${successCount}`);
    console.log(`❌ Failed:     ${failCount}`);
    console.log('='.repeat(60));

    if (errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.title}: ${err.error}`);
      });
    }

    console.log('\n✨ Event population completed!\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
populateEvents();

