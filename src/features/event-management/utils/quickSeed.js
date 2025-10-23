/**
 * Quick Seed Script for Event Data
 * 
 * This is a standalone script that can be run in the browser console
 * to quickly seed event data without needing to import components.
 * 
 * USAGE IN BROWSER CONSOLE:
 * 
 * 1. Open your app and log in as Admin
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire file into the console
 * 4. Run: quickSeedEvents()
 * 
 * OR use the module import method:
 * 
 * import('./features/event-management/utils/quickSeed.js').then(m => m.quickSeedEvents());
 */

// Sample event data
const QUICK_SEED_EVENTS = [
  {
    title: 'AI & Machine Learning Workshop 2024',
    description: 'Join us for an intensive workshop on AI and Machine Learning fundamentals. Learn about neural networks, deep learning, and practical applications.',
    location: 'Lab A101, Building A',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    status: 0,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Web Development Bootcamp',
    description: 'Comprehensive bootcamp covering HTML, CSS, JavaScript, React, and Node.js.',
    location: 'Lab B202, Building B',
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    status: 0,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Cybersecurity Fundamentals',
    description: 'Learn the basics of cybersecurity, including network security, encryption, and ethical hacking.',
    location: 'Lab C303, Building C',
    startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    status: 0,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Mobile App Development with Flutter',
    description: 'Build cross-platform mobile applications using Flutter and Dart.',
    location: 'Lab A105, Building A',
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    status: 0,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Weekly Coding Club',
    description: 'Join our weekly coding club for collaborative programming and tech discussions.',
    location: 'Lab A102, Building A',
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    status: 0,
    visibility: true,
    recurrenceRule: 'FREQ=WEEKLY;BYDAY=FR'
  }
];

/**
 * Get API base URL from environment or default
 */
function getApiBaseUrl() {
  // Try to get from window config or environment
  if (typeof window !== 'undefined' && window.API_BASE_URL) {
    return window.API_BASE_URL;
  }
  // Default to localhost
  return 'http://localhost:5000';
}

/**
 * Get auth token from localStorage or sessionStorage
 */
function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
}

/**
 * Make API request
 */
async function apiRequest(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const token = getAuthToken();

  if (!token) {
    throw new Error('No authentication token found. Please log in first.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Create a single event
 */
async function createEvent(eventData) {
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

  return await apiRequest('/api/events', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Quick seed function - seeds 5 essential events
 */
export async function quickSeedEvents() {
  console.log('🌱 Quick Seed: Starting to seed events...');
  console.log(`📊 Total events to create: ${QUICK_SEED_EVENTS.length}`);
  
  const results = {
    total: QUICK_SEED_EVENTS.length,
    success: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < QUICK_SEED_EVENTS.length; i++) {
    const event = QUICK_SEED_EVENTS[i];
    try {
      console.log(`📝 [${i + 1}/${QUICK_SEED_EVENTS.length}] Creating: ${event.title}`);
      await createEvent(event);
      results.success++;
      console.log(`✅ Success: ${event.title}`);
    } catch (error) {
      results.failed++;
      const errorMsg = `${event.title}: ${error.message}`;
      results.errors.push(errorMsg);
      console.error(`❌ Failed: ${errorMsg}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SEEDING SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total:   ${results.total}`);
  console.log(`✅ Success: ${results.success}`);
  console.log(`❌ Failed:  ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  ERRORS:');
    results.errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
  }
  
  console.log('='.repeat(60));
  
  return results;
}

/**
 * Seed all events (15 events from the full list)
 */
export async function seedAllEvents() {
  // Import the full list
  try {
    const module = await import('./seedEventData.js');
    return await module.seedEvents();
  } catch (error) {
    console.error('❌ Failed to import full seed data:', error);
    console.log('ℹ️  Falling back to quick seed (5 events)...');
    return await quickSeedEvents();
  }
}

/**
 * Check if user is authenticated
 */
export function checkAuth() {
  const token = getAuthToken();
  if (!token) {
    console.error('❌ Not authenticated! Please log in first.');
    return false;
  }
  console.log('✅ Authentication token found');
  return true;
}

/**
 * Display help information
 */
export function help() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           EVENT DATA SEEDING - QUICK REFERENCE             ║
╚════════════════════════════════════════════════════════════╝

📋 AVAILABLE FUNCTIONS:

  quickSeedEvents()     - Seed 5 essential events (fast)
  seedAllEvents()       - Seed all 15 events (comprehensive)
  checkAuth()           - Check if you're authenticated
  help()                - Show this help message

🚀 QUICK START:

  1. Make sure you're logged in as Admin
  2. Open browser console (F12)
  3. Run: quickSeedEvents()

📝 EXAMPLE USAGE:

  // Check authentication
  checkAuth();

  // Seed 5 quick events
  await quickSeedEvents();

  // Or seed all 15 events
  await seedAllEvents();

⚠️  REQUIREMENTS:

  - Must be logged in as Admin
  - Backend API must be running
  - Valid authentication token required

📖 MORE INFO:

  See README.md in src/features/event-management/utils/
  `);
}

// Auto-display help when loaded
if (typeof window !== 'undefined') {
  console.log('✅ Event seeding utilities loaded!');
  console.log('💡 Type help() for usage instructions');
  console.log('🚀 Quick start: await quickSeedEvents()');
}

// Export for module usage
export default {
  quickSeedEvents,
  seedAllEvents,
  checkAuth,
  help,
  QUICK_SEED_EVENTS
};

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.quickSeedEvents = quickSeedEvents;
  window.seedAllEvents = seedAllEvents;
  window.checkAuth = checkAuth;
  window.eventSeedHelp = help;
}

