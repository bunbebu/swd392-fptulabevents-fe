/**
 * Test script to check lab members API response structure
 */

const API_BASE_URL = 'http://swd392group6.runasp.net';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiIxMDI1MzVhMC1iMGZkLTRlYzYtOTZkYy0zMWQxOTY1ZTg1YWUiLCJzdGF0dXMiOiJBY3RpdmUiLCJlbWFpbCI6InBodWNuaHNlMTgyOTMyQGZwdC5lZHUudm4iLCJyb2xlIjoiQWRtaW4iLCJuYW1laWQiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEiLCJuYmYiOjE3NjEyNzM1MTAsImV4cCI6MTc2MTI3NzExMCwiaWF0IjoxNzYxMjczNTEwLCJpc3MiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEifQ.tOCbc86JEw6oOWF-eeqS_LbJRQR5p4tOgCkUBMqyR8c';

async function apiRequest(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    }
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return data?.Data || data?.data || data;
}

async function testLabMembersAPI() {
  console.log('🧪 Testing Lab Members API Response Structure\n');

  try {
    // Get first lab
    console.log('1️⃣ Fetching labs...');
    const labs = await apiRequest('/api/labs');
    const labArray = Array.isArray(labs) ? labs : (labs.items || labs.Items || []);

    if (labArray.length === 0) {
      console.log('❌ No labs found!');
      return;
    }

    // Find a lab with members
    let labWithMembers = null;
    let memberArray = [];

    console.log('2️⃣ Searching for labs with members...');
    for (const lab of labArray.slice(0, 10)) {  // Check first 10 labs
      const labId = lab.Id || lab.id;
      const labName = lab.Name || lab.name;

      const members = await apiRequest(`/api/labs/${labId}/members`);
      const tempMembers = Array.isArray(members) ? members : (members.items || members.Items || []);

      if (tempMembers.length > 0) {
        labWithMembers = lab;
        memberArray = tempMembers;
        console.log(`✓ Found lab with ${tempMembers.length} members: ${labName} (${labId})\n`);
        break;
      }
    }

    if (memberArray.length === 0) {
      console.log('❌ No members found in any lab! Run populate-lab-members.js first.\n');
      return;
    }

    // Show first member structure
    console.log('3️⃣ First member response structure:');
    console.log('━'.repeat(60));
    console.log(JSON.stringify(memberArray[0], null, 2));
    console.log('━'.repeat(60));

    // Show all member fields
    console.log('\n4️⃣ All members summary:');
    memberArray.forEach((member, index) => {
      console.log(`\nMember ${index + 1}:`);
      console.log('  Fields available:', Object.keys(member).join(', '));

      // Try different field name variations
      const name = member.userName || member.UserName || member.name || member.Name || 'N/A';
      const email = member.userEmail || member.UserEmail || member.email || member.Email || 'N/A';
      const username = member.username || member.Username || 'N/A';
      const userId = member.userId || member.UserId || 'N/A';

      console.log(`  Name: ${name}`);
      console.log(`  Email: ${email}`);
      console.log(`  Username: ${username}`);
      console.log(`  UserId: ${userId}`);
    });

    // If we have userId but no user details, suggest fetching user info
    const firstMember = memberArray[0];
    const hasUserDetails = firstMember.userName || firstMember.UserName || firstMember.name;

    if (!hasUserDetails && (firstMember.userId || firstMember.UserId)) {
      console.log('\n⚠️  API returns userId but not user details.');
      console.log('   Need to fetch user info separately via /api/users/{userId}');

      // Try to fetch user details
      const userId = firstMember.userId || firstMember.UserId;
      console.log(`\n5️⃣ Fetching user details for userId: ${userId}`);

      try {
        const user = await apiRequest(`/api/users/${userId}`);
        console.log('✓ User details:');
        console.log(JSON.stringify(user, null, 2));
      } catch (err) {
        console.log('✗ Failed to fetch user:', err.message);
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testLabMembersAPI();
