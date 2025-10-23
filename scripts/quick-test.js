/**
 * Quick Test - Verify Backend Fixes
 * Tests if Labs, Events, and Notifications can be created
 */

const API_BASE_URL = 'http://swd392group6.runasp.net';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiIxY2MwZmJhYS01NGUwLTQzOGEtYjAyOS04OWEzNzlhMTFmY2MiLCJzdGF0dXMiOiJBY3RpdmUiLCJlbWFpbCI6InBodWNuaHNlMTgyOTMyQGZwdC5lZHUudm4iLCJyb2xlIjoiQWRtaW4iLCJuYW1laWQiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEiLCJuYmYiOjE3NjEyMTExNTAsImV4cCI6MTc2MTIxNDc1MCwiaWF0IjoxNzYxMjExMTUwLCJpc3MiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEifQ.aUOTKDL9bYzifzdR5Omu-R-MrnMPwKCfqY-XSsyD7PE';

async function testAPI(endpoint, method, body, name) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${name}: SUCCESS`);
      return { success: true, data };
    } else {
      console.log(`❌ ${name}: FAILED - ${response.status} ${JSON.stringify(data)}`);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runQuickTest() {
  console.log('🧪 Quick Test - Backend Fixes\n');

  // Test 1: Create Lab
  const labResult = await testAPI('/api/labs', 'POST', {
    Name: 'Test Lab',
    Description: 'Quick test',
    Location: 'Test Building',
    Capacity: 10,
    Status: 0,
    RoomId: null
  }, 'Create Lab');

  // Test 2: Create Event
  const eventResult = await testAPI('/api/events', 'POST', {
    Title: 'Test Event',
    Description: 'Quick test',
    StartDate: new Date(Date.now() + 86400000).toISOString(),
    EndDate: new Date(Date.now() + 90000000).toISOString(),
    Location: 'Test Lab',
    Status: 0,
    Visibility: true,
    RecurrenceRule: null
  }, 'Create Event');

  // Test 3: Create Notification
  const notifResult = await testAPI('/api/notifications/admin', 'POST', {
    Title: 'Test Notification',
    Content: 'Quick test',
    TargetGroup: 'All',
    StartDate: new Date().toISOString(),
    EndDate: new Date(Date.now() + 86400000).toISOString()
  }, 'Create Notification');

  console.log('\n📊 Results:');
  console.log(`Labs: ${labResult.success ? '✅' : '❌'}`);
  console.log(`Events: ${eventResult.success ? '✅' : '❌'}`);
  console.log(`Notifications: ${notifResult.success ? '✅' : '❌'}`);

  if (labResult.success || eventResult.success || notifResult.success) {
    console.log('\n⚠️  Note: Backend team needs to deploy the fixes for all tests to pass!');
  }
}

runQuickTest();

