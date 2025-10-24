/**
 * Fix Lab Members Roles Script
 *
 * This script updates the role and status of existing lab members
 * to create a more realistic distribution
 *
 * Usage:
 *   node scripts/fix-lab-members-roles.js
 */

const API_BASE_URL = 'http://swd392group6.runasp.net';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiIxMDI1MzVhMC1iMGZkLTRlYzYtOTZkYy0zMWQxOTY1ZTg1YWUiLCJzdGF0dXMiOiJBY3RpdmUiLCJlbWFpbCI6InBodWNuaHNlMTgyOTMyQGZwdC5lZHUudm4iLCJyb2xlIjoiQWRtaW4iLCJuYW1laWQiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEiLCJuYmYiOjE3NjEyNzM1MTAsImV4cCI6MTc2MTI3NzExMCwiaWF0IjoxNzYxMjczNTEwLCJpc3MiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEifQ.tOCbc86JEw6oOWF-eeqS_LbJRQR5p4tOgCkUBMqyR8c';

// Role mapping
const ROLES = {
  LEAD: 0,
  ASSISTANT: 1,
  MEMBER: 2
};

// Status mapping
const STATUS = {
  ACTIVE: 0,
  INACTIVE: 1
};

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

async function fixLabMembersRoles() {
  console.log('🔧 Fixing Lab Members Roles...\n');

  try {
    // Get all labs
    console.log('1️⃣ Fetching labs...');
    const labs = await apiRequest('/api/labs');
    const labArray = Array.isArray(labs) ? labs : (labs.items || labs.Items || []);
    console.log(`   ✓ Found ${labArray.length} labs\n`);

    let totalUpdated = 0;
    let totalFailed = 0;

    // Process each lab
    for (const lab of labArray) {
      const labId = lab.Id || lab.id;
      const labName = lab.Name || lab.name;

      // Get members
      const members = await apiRequest(`/api/labs/${labId}/members`);
      const memberArray = Array.isArray(members) ? members : (members.items || members.Items || []);

      if (memberArray.length === 0) {
        console.log(`⊘ ${labName}: No members`);
        continue;
      }

      console.log(`\n📋 ${labName} (${memberArray.length} members):`);

      // Assign roles: first = Lead, second = Assistant, rest = Members
      // Some random inactive status
      for (let i = 0; i < memberArray.length; i++) {
        const member = memberArray[i];
        const memberId = member.id || member.Id;
        const memberName = member.fullname || member.Fullname || 'Unknown';

        // Determine role based on position
        let role, roleLabel;
        if (i === 0) {
          role = ROLES.LEAD;
          roleLabel = 'Lead';
        } else if (i === 1 && memberArray.length > 2) {
          role = ROLES.ASSISTANT;
          roleLabel = 'Assistant';
        } else {
          role = ROLES.MEMBER;
          roleLabel = 'Member';
        }

        // 90% active, 10% inactive
        const status = Math.random() < 0.9 ? STATUS.ACTIVE : STATUS.INACTIVE;
        const statusLabel = status === STATUS.ACTIVE ? 'Active' : 'Inactive';

        try {
          await apiRequest(`/api/labs/${labId}/members/${memberId}`, 'PATCH', {
            Role: role,
            Status: status
          });

          const roleEmoji = role === ROLES.LEAD ? '👑' : role === ROLES.ASSISTANT ? '🤝' : '👤';
          const statusEmoji = status === STATUS.ACTIVE ? '🟢' : '🔴';
          console.log(`   ${roleEmoji}${statusEmoji} ${memberName} → ${roleLabel} (${statusLabel})`);
          totalUpdated++;
        } catch (error) {
          console.error(`   ❌ Failed to update ${memberName}:`, error.message);
          totalFailed++;
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total updated:  ${totalUpdated}`);
    console.log(`Total failed:   ${totalFailed}`);
    console.log('='.repeat(60));
    console.log('\n✨ Done! Refresh the browser to see changes.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

fixLabMembersRoles();
