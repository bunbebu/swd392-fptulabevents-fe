/**
 * Lab Member Data Population Script for FPTU Lab Events
 *
 * This script assigns users as members to existing labs in the system.
 *
 * Usage:
 *   node scripts/populate-lab-members.js
 *
 * Requirements:
 *   - You must be logged in as an Admin user
 *   - Set your access token in the ADMIN_TOKEN variable below
 *   - Labs must already exist in the system (run populate-labs.js first)
 *   - Users must already exist in the system
 *
 * How to get your token:
 *   1. Login to the application as Admin
 *   2. Open browser DevTools (F12)
 *   3. Go to Application/Storage > Local Storage
 *   4. Copy the value of 'accessToken'
 *   5. Paste it in the ADMIN_TOKEN variable below
 */

const { generateMemberAssignments, getAssignmentStats } = require('./data/lab-members-data');

const API_BASE_URL = 'http://swd392group6.runasp.net';

// ⚠️ IMPORTANT: Replace this with your actual admin access token
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiIxMDI1MzVhMC1iMGZkLTRlYzYtOTZkYy0zMWQxOTY1ZTg1YWUiLCJzdGF0dXMiOiJBY3RpdmUiLCJlbWFpbCI6InBodWNuaHNlMTgyOTMyQGZwdC5lZHUudm4iLCJyb2xlIjoiQWRtaW4iLCJuYW1laWQiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEiLCJuYmYiOjE3NjEyNzM1MTAsImV4cCI6MTc2MTI3NzExMCwiaWF0IjoxNzYxMjczNTEwLCJpc3MiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEifQ.tOCbc86JEw6oOWF-eeqS_LbJRQR5p4tOgCkUBMqyR8c';

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

// Fetch all labs from the system
async function fetchLabs() {
  console.log('📋 Fetching all labs from the system...');
  try {
    // Try without pagination first (to get all labs)
    const labs = await apiRequest('/api/labs');
    const labArray = Array.isArray(labs) ? labs : (labs.items || labs.Items || []);
    console.log(`   ✓ Found ${labArray.length} labs in the system`);
    return labArray;
  } catch (error) {
    console.error('   ✗ Failed to fetch labs:', error.message);
    throw error;
  }
}

// Fetch all users from the system
async function fetchUsers() {
  console.log('👥 Fetching all users from the system...');
  try {
    // Try to get all users without pagination
    const users = await apiRequest('/api/users');
    const userArray = Array.isArray(users) ? users : (users.items || users.Items || []);
    console.log(`   ✓ Found ${userArray.length} users in the system`);
    return userArray;
  } catch (error) {
    console.error('   ✗ Failed to fetch users:', error.message);
    throw error;
  }
}

// Add a member to a lab
async function addMemberToLab(labId, userId) {
  const payload = {
    UserId: userId
  };
  return await apiRequest(`/api/labs/${labId}/members`, 'POST', payload);
}

// Update a lab member's role and status
async function updateLabMember(labId, memberId, role, status) {
  // Convert string role to number
  const roleMap = {
    'Lead': 0,
    'Assistant': 1,
    'Member': 2
  };

  // Convert string status to number
  const statusMap = {
    'Active': 0,
    'Inactive': 1
  };

  const payload = {
    Role: typeof role === 'string' ? roleMap[role] : role,
    Status: typeof status === 'string' ? statusMap[status] : status
  };

  return await apiRequest(`/api/labs/${labId}/members/${memberId}`, 'PATCH', payload);
}

// Main execution function
async function populateLabMembers() {
  console.log('🚀 Starting lab member data population...\n');

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
    // Step 1: Fetch existing labs and users
    const labs = await fetchLabs();
    const users = await fetchUsers();

    if (labs.length === 0) {
      console.error('\n❌ No labs found in the system!');
      console.log('Please run "node scripts/populate-labs.js" first to create labs.\n');
      process.exit(1);
    }

    if (users.length === 0) {
      console.error('\n❌ No users found in the system!');
      console.log('Please ensure there are users in the system before running this script.\n');
      process.exit(1);
    }

    // Step 2: Generate member assignments
    console.log('\n🔄 Generating member assignments...');
    const assignments = generateMemberAssignments(labs, users);

    if (assignments.length === 0) {
      console.error('\n❌ No assignments could be generated!');
      console.log('This might happen if there are no active labs or users.\n');
      process.exit(1);
    }

    console.log(`   ✓ Generated ${assignments.length} member assignments`);

    // Display assignment preview
    const stats = getAssignmentStats(assignments);
    console.log('\n📊 Assignment Statistics:');
    console.log(`   • Total assignments: ${stats.totalAssignments}`);
    console.log(`   • Unique users involved: ${stats.uniqueUsers}`);
    console.log(`   • Labs with members: ${stats.uniqueLabs}`);
    console.log(`   • Average members per lab: ${stats.avgMembersPerLab}`);
    console.log('\n   Role Distribution:');
    console.log(`   • Lead: ${stats.byRole.Lead}`);
    console.log(`   • Assistant: ${stats.byRole.Assistant}`);
    console.log(`   • Member: ${stats.byRole.Member}`);
    console.log('\n   Status Distribution:');
    console.log(`   • Active: ${stats.byStatus.Active}`);
    console.log(`   • Inactive: ${stats.byStatus.Inactive}`);

    // Step 3: Create lab members
    console.log('\n👨‍🔬 Adding members to labs...');
    let successCount = 0;
    let failCount = 0;
    const createdMembers = [];

    for (const assignment of assignments) {
      try {
        // Add member to lab
        const member = await addMemberToLab(assignment.labId, assignment.userId);
        const memberId = member.id || member.Id;

        // Update role and status
        try {
          await updateLabMember(assignment.labId, memberId, assignment.role, assignment.status);
        } catch (updateError) {
          console.log(`   ⚠️  Added but failed to update role/status: ${assignment.userName}`);
        }

        createdMembers.push({ ...assignment, memberId });
        successCount++;

        const roleEmoji = assignment.role === 'Lead' ? '👑' : assignment.role === 'Assistant' ? '🤝' : '👤';
        const statusEmoji = assignment.status === 'Active' ? '🟢' : '🔴';
        console.log(`   ${roleEmoji}${statusEmoji} ${assignment.userName} → ${assignment.labName} (${assignment.role})`);
      } catch (error) {
        failCount++;
        console.error(`   ❌ Failed to add ${assignment.userName} to ${assignment.labName}:`, error.message);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total assignments attempted:  ${assignments.length}`);
    console.log(`Successfully created:         ${successCount}`);
    console.log(`Failed to create:             ${failCount}`);
    console.log('='.repeat(70));

    if (successCount > 0) {
      console.log('\n✅ Lab member data population completed successfully!');

      // Group by lab for summary
      const byLab = createdMembers.reduce((acc, m) => {
        if (!acc[m.labName]) acc[m.labName] = [];
        acc[m.labName].push(m);
        return acc;
      }, {});

      console.log('\n📋 Members by Lab:');
      Object.entries(byLab).forEach(([labName, members]) => {
        console.log(`\n   ${labName} (${members.length} members):`);
        members.forEach(m => {
          const roleIcon = m.role === 'Lead' ? '👑' : m.role === 'Assistant' ? '🤝' : '👤';
          console.log(`      ${roleIcon} ${m.userName} (${m.role}) - ${m.status}`);
        });
      });
    }

    console.log('\n✨ Script completed!\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    if (error.message.includes('401')) {
      console.log('\n💡 This is an authentication error. Please check:');
      console.log('   1. Your token is correct and not expired');
      console.log('   2. You are logged in as an Admin user');
      console.log('   3. The token has proper permissions\n');
    }
    process.exit(1);
  }
}

// Run the script
populateLabMembers();
