/**
 * Reset and Populate All Data Script for FPTU Lab Events
 * 
 * This script:
 * 1. Deletes ALL existing data (rooms, equipment, events, notifications, labs)
 * 2. Keeps user data intact
 * 3. Creates fresh new data for all features
 * 
 * Usage:
 *   node scripts/reset-and-populate-all.js
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
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiJlNzMwYjllMi1lMzM0LTRkZDAtYjU4OS1hNzJlODNhNzc3OGQiLCJzdGF0dXMiOiJBY3RpdmUiLCJlbWFpbCI6InBodWNuaHNlMTgyOTMyQGZwdC5lZHUudm4iLCJyb2xlIjoiQWRtaW4iLCJuYW1laWQiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEiLCJuYmYiOjE3NjExODk5NjMsImV4cCI6MTc2MTE5MzU2MywiaWF0IjoxNzYxMTg5OTYzLCJpc3MiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEifQ.Ka3iu-nOXt0atwVRv0CIfZo6z-DpO3F2nE6ZMpOSHDY';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    }
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return await response.json();
}

// ============================================================================
// DELETE FUNCTIONS
// ============================================================================

async function deleteAllNotifications() {
  console.log('\n🗑️  Deleting all notifications...');
  try {
    const response = await apiRequest('/api/notifications/admin/all?pageSize=1000');
    const notifications = response?.data || response || [];

    let successCount = 0;
    let failCount = 0;

    for (const notification of notifications) {
      try {
        await apiRequest(`/api/notifications/admin/${notification.id}`, 'DELETE');
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`  ❌ Failed to delete notification ${notification.id}:`, error.message);
      }
    }

    console.log(`  ✅ Deleted ${successCount} notifications (${failCount} failed)`);
    return successCount;
  } catch (error) {
    console.error('  ❌ Error fetching notifications:', error.message);
    return 0;
  }
}

async function deleteAllEvents() {
  console.log('\n🗑️  Deleting all events...');
  try {
    const response = await apiRequest('/api/events?page=1&pageSize=1000');
    const events = response?.data || response || [];
    
    let successCount = 0;
    let failCount = 0;

    for (const event of events) {
      try {
        await apiRequest(`/api/events/${event.id}`, 'DELETE', { ConfirmDeletion: true });
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`  ❌ Failed to delete event ${event.id}:`, error.message);
      }
    }

    console.log(`  ✅ Deleted ${successCount} events (${failCount} failed)`);
    return successCount;
  } catch (error) {
    console.error('  ❌ Error fetching events:', error.message);
    return 0;
  }
}

async function deleteAllEquipment() {
  console.log('\n🗑️  Deleting all equipment...');
  try {
    const response = await apiRequest('/api/equipments?page=1&pageSize=1000');
    const equipment = response?.data || response || [];
    
    let successCount = 0;
    let failCount = 0;

    for (const item of equipment) {
      try {
        await apiRequest(`/api/equipments/${item.id}`, 'DELETE');
        successCount++;
        if (successCount % 20 === 0) {
          console.log(`  ⏳ Deleted ${successCount}/${equipment.length} equipment...`);
        }
      } catch (error) {
        failCount++;
      }
    }

    console.log(`  ✅ Deleted ${successCount} equipment (${failCount} failed)`);
    return successCount;
  } catch (error) {
    console.error('  ❌ Error fetching equipment:', error.message);
    return 0;
  }
}

async function deleteAllRooms() {
  console.log('\n🗑️  Deleting all rooms...');
  try {
    const response = await apiRequest('/api/rooms?page=1&pageSize=1000');
    const rooms = response?.data || response || [];
    
    let successCount = 0;
    let failCount = 0;

    for (const room of rooms) {
      try {
        await apiRequest(`/api/rooms/${room.id}`, 'DELETE');
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`  ❌ Failed to delete room ${room.id}:`, error.message);
      }
    }

    console.log(`  ✅ Deleted ${successCount} rooms (${failCount} failed)`);
    return successCount;
  } catch (error) {
    console.error('  ❌ Error fetching rooms:', error.message);
    return 0;
  }
}

async function deleteAllLabs() {
  console.log('\n🗑️  Deleting all labs...');
  try {
    const response = await apiRequest('/api/labs?page=1&pageSize=1000');
    const labs = response?.data || response || [];
    
    let successCount = 0;
    let failCount = 0;

    for (const lab of labs) {
      try {
        await apiRequest(`/api/labs/${lab.id}`, 'DELETE', { ConfirmDeletion: true });
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`  ❌ Failed to delete lab ${lab.id}:`, error.message);
      }
    }

    console.log(`  ✅ Deleted ${successCount} labs (${failCount} failed)`);
    return successCount;
  } catch (error) {
    console.error('  ❌ Error fetching labs:', error.message);
    return 0;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🚀 FPTU Lab Events - Reset and Populate All Data');
  console.log('='.repeat(60));

  // Validate token
  if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
    console.error('\n❌ ERROR: Please set your admin access token in the ADMIN_TOKEN variable!');
    console.log('\nHow to get your token:');
    console.log('1. Login to the application as Admin');
    console.log('2. Open browser DevTools (F12)');
    console.log('3. Go to Application/Storage > Local Storage');
    console.log('4. Copy the value of "accessToken"');
    console.log('5. Paste it in the ADMIN_TOKEN variable in this script\n');
    process.exit(1);
  }

  try {
    // PHASE 1: DELETE ALL EXISTING DATA
    console.log('\n📋 PHASE 1: DELETING ALL EXISTING DATA');
    console.log('='.repeat(60));
    console.log('⚠️  This will delete all rooms, equipment, events, notifications, and labs');
    console.log('⚠️  User data will be preserved');
    
    const deleteStats = {
      notifications: await deleteAllNotifications(),
      events: await deleteAllEvents(),
      equipment: await deleteAllEquipment(),
      rooms: await deleteAllRooms(),
      labs: await deleteAllLabs()
    };

    console.log('\n📊 DELETION SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Notifications deleted: ${deleteStats.notifications}`);
    console.log(`Events deleted:        ${deleteStats.events}`);
    console.log(`Equipment deleted:     ${deleteStats.equipment}`);
    console.log(`Rooms deleted:         ${deleteStats.rooms}`);
    console.log(`Labs deleted:          ${deleteStats.labs}`);
    console.log('='.repeat(60));

    // PHASE 2: CREATE NEW DATA
    console.log('\n📋 PHASE 2: CREATING NEW DATA');
    console.log('='.repeat(60));
    console.log('⏳ Loading data generation modules...\n');

    const createStats = {
      rooms: 0,
      equipment: 0,
      events: 0,
      notifications: 0,
      labs: 0
    };

    // Create Labs
    console.log('🔬 Creating labs...');
    const { LABS_DATA } = require('./data/labs-data.js');
    for (const labData of LABS_DATA) {
      try {
        // Transform to backend format (PascalCase)
        const payload = {
          Name: labData.name,
          Description: labData.description || '',
          Location: labData.location || '',
          Capacity: labData.capacity,
          Status: labData.status !== undefined ? labData.status : 0,
          RoomId: labData.roomId || null
        };
        await apiRequest('/api/labs', 'POST', payload);
        createStats.labs++;
      } catch (error) {
        console.error(`  ❌ Failed to create lab ${labData.name}:`, error.message);
      }
    }
    console.log(`  ✅ Created ${createStats.labs} labs\n`);

    // Create Rooms
    console.log('🏢 Creating rooms...');
    const { ROOMS_DATA } = require('./data/rooms-equipment-data.js');
    const createdRooms = [];
    for (const roomData of ROOMS_DATA) {
      try {
        const room = await apiRequest('/api/rooms', 'POST', roomData);
        createdRooms.push(room);
        createStats.rooms++;
      } catch (error) {
        console.error(`  ❌ Failed to create room ${roomData.name}:`, error.message);
      }
    }
    console.log(`  ✅ Created ${createStats.rooms} rooms\n`);

    // Create Equipment
    console.log('🔧 Creating equipment...');
    const { generateEquipmentData } = require('./data/rooms-equipment-data.js');
    const roomIds = createdRooms.map(room => room.id || room.Id);
    const equipmentData = generateEquipmentData(roomIds);

    for (const equipment of equipmentData) {
      try {
        await apiRequest('/api/equipments', 'POST', equipment);
        createStats.equipment++;
        if (createStats.equipment % 20 === 0) {
          console.log(`  ⏳ Created ${createStats.equipment}/${equipmentData.length} equipment...`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to create ${equipment.name}:`, error.message);
      }
    }
    console.log(`  ✅ Created ${createStats.equipment} equipment\n`);

    // Create Events
    console.log('📅 Creating events...');
    const { EVENTS_DATA } = require('./data/events-data.js');
    for (const eventData of EVENTS_DATA) {
      try {
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
        createStats.events++;
      } catch (error) {
        console.error(`  ❌ Failed to create event ${eventData.title}:`, error.message);
      }
    }
    console.log(`  ✅ Created ${createStats.events} events\n`);

    // Create Notifications
    console.log('🔔 Creating notifications...');
    const { NOTIFICATIONS_DATA } = require('./data/notifications-data.js');
    for (const notificationData of NOTIFICATIONS_DATA) {
      try {
        const payload = {
          Title: notificationData.title,
          Content: notificationData.content,
          TargetGroup: notificationData.targetGroup,
          StartDate: notificationData.startDate,
          EndDate: notificationData.endDate
        };
        await apiRequest('/api/notifications/admin', 'POST', payload);
        createStats.notifications++;
      } catch (error) {
        console.error(`  ❌ Failed to create notification ${notificationData.title}:`, error.message);
      }
    }
    console.log(`  ✅ Created ${createStats.notifications} notifications\n`);

    // FINAL SUMMARY
    console.log('\n📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log('DELETED:');
    console.log(`  Notifications: ${deleteStats.notifications}`);
    console.log(`  Events:        ${deleteStats.events}`);
    console.log(`  Equipment:     ${deleteStats.equipment}`);
    console.log(`  Rooms:         ${deleteStats.rooms}`);
    console.log(`  Labs:          ${deleteStats.labs}`);
    console.log('\nCREATED:');
    console.log(`  Labs:          ${createStats.labs}`);
    console.log(`  Rooms:         ${createStats.rooms}`);
    console.log(`  Equipment:     ${createStats.equipment}`);
    console.log(`  Events:        ${createStats.events}`);
    console.log(`  Notifications: ${createStats.notifications}`);
    console.log('='.repeat(60));
    console.log('\n✅ All done! Database has been reset and populated with fresh data.\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main();

