/**
 * Report Population Script for FPTU Lab Events
 *
 * This script creates sample reports for testing and development.
 * Reports can be created by users (students/lecturers) and managed by admins.
 *
 * Usage:
 *   node scripts/populate-reports.js
 *
 * Requirements:
 *   - You must be logged in as a User (Student or Lecturer)
 *   - Set your access token in the USER_TOKEN variable below
 *   - Optionally set an ADMIN_TOKEN to add admin responses to reports
 *
 * How to get your token:
 *   1. Login to the application
 *   2. Open browser DevTools (F12)
 *   3. Go to Application/Storage > Local Storage
 *   4. Copy the value of 'accessToken'
 *   5. Paste it in the USER_TOKEN variable below
 *
 * Notes:
 *   - Reports can only be created via the user endpoint (POST /api/reports/user)
 *   - Admin responses can be added via the admin endpoint (PUT /api/reports/admin/{id}/status)
 *   - The script will create reports with different statuses and types
 */

const { REPORTS_DATA, REPORT_TYPE, REPORT_STATUS } = require('./data/reports-data.js');

const API_BASE_URL = 'http://swd392group6.runasp.net';

// ⚠️ IMPORTANT: Replace these with your actual tokens
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiJmMzcxMjEzMy02ZGQ2LTRhYTYtODcxZS1lMzFhOGVhOWQxZjEiLCJzdGF0dXMiOiJBY3RpdmUiLCJlbWFpbCI6InBodWNuaHNlMTgyOTMyQGZwdC5lZHUudm4iLCJyb2xlIjoiQWRtaW4iLCJuYW1laWQiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEiLCJuYmYiOjE3NjEyOTQwOTcsImV4cCI6MTc2MTI5NzY5NywiaWF0IjoxNzYxMjk0MDk3LCJpc3MiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEifQ.vm2q9PYbZpBZmKg2bky4vAtPds3GdIFd9-wWTfYWumk';  // Required: for creating reports
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiJmMzcxMjEzMy02ZGQ2LTRhYTYtODcxZS1lMzFhOGVhOWQxZjEiLCJzdGF0dXMiOiJBY3RpdmUiLCJlbWFpbCI6InBodWNuaHNlMTgyOTMyQGZwdC5lZHUudm4iLCJyb2xlIjoiQWRtaW4iLCJuYW1laWQiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEiLCJuYmYiOjE3NjEyOTQwOTcsImV4cCI6MTc2MTI5NzY5NywiaWF0IjoxNzYxMjk0MDk3LCJpc3MiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEifQ.vm2q9PYbZpBZmKg2bky4vAtPds3GdIFd9-wWTfYWumk'; // Optional: for adding admin responses

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', body = null, token = USER_TOKEN) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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

// Helper function to get status emoji
function getStatusEmoji(status) {
  switch (status) {
    case REPORT_STATUS.OPEN: return '🆕';
    case REPORT_STATUS.IN_PROGRESS: return '🔄';
    case REPORT_STATUS.RESOLVED: return '✅';
    case REPORT_STATUS.CLOSED: return '🔒';
    default: return '❓';
  }
}

// Helper function to get type emoji
function getTypeEmoji(type) {
  return type === REPORT_TYPE.LAB ? '🏢' : '💻';
}

// Helper function to calculate date
function calculateDate(daysAgo) {
  if (!daysAgo && daysAgo !== 0) return null;
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

// Main execution function
async function populateReports() {
  console.log('📋 Starting report population...\n');

  // Validate user token
  if (USER_TOKEN === 'YOUR_USER_TOKEN_HERE') {
    console.error('❌ ERROR: Please set your user access token in the USER_TOKEN variable!');
    console.log('\nHow to get your token:');
    console.log('1. Login to the application as a User (Student or Lecturer)');
    console.log('2. Open browser DevTools (F12)');
    console.log('3. Go to Application/Storage > Local Storage');
    console.log('4. Copy the value of "accessToken"');
    console.log('5. Paste it in the USER_TOKEN variable in this script\n');
    process.exit(1);
  }

  const hasAdminToken = ADMIN_TOKEN !== 'YOUR_ADMIN_TOKEN_HERE';

  if (!hasAdminToken) {
    console.log('⚠️  WARNING: ADMIN_TOKEN not set. Reports will be created but admin responses will not be added.');
    console.log('   To add admin responses, set the ADMIN_TOKEN variable and re-run the script.\n');
  }

  try {
    console.log('📝 Creating reports...\n');

    let successCount = 0;
    let failCount = 0;
    const stats = {
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      lab: 0,
      equipment: 0
    };

    const createdReports = []; // Store created report IDs for admin updates

    // Step 1: Create all reports as OPEN
    for (const reportData of REPORTS_DATA) {
      try {
        // Transform to backend format (PascalCase) for creating report
        const payload = {
          Title: reportData.title,
          Description: reportData.description,
          Type: reportData.type,
          ImageUrl: reportData.imageUrl
        };

        // Create report via user endpoint
        const result = await apiRequest('/api/reports/user', 'POST', payload, USER_TOKEN);

        // Extract report ID from response
        const reportId = result?.id || result?.Id || result?.reportId || result?.ReportId;

        if (reportId) {
          createdReports.push({
            id: reportId,
            ...reportData
          });
          successCount++;

          // Update stats
          stats.lab += reportData.type === REPORT_TYPE.LAB ? 1 : 0;
          stats.equipment += reportData.type === REPORT_TYPE.EQUIPMENT ? 1 : 0;

          const typeEmoji = getTypeEmoji(reportData.type);
          const typeName = reportData.type === REPORT_TYPE.LAB ? 'Lab' : 'Equipment';

          console.log(`  ✅ ${typeEmoji} [${typeName}] Created: ${reportData.title}`);
        } else {
          throw new Error('Report ID not found in response');
        }

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        failCount++;
        console.error(`  ❌ Failed to create "${reportData.title}":`, error.message);
      }
    }

    console.log(`\n📝 Created ${successCount} reports. Now updating statuses...\n`);

    // Step 2: Update report statuses via admin endpoint (if admin token is available)
    if (hasAdminToken && createdReports.length > 0) {
      let updateSuccessCount = 0;
      let updateFailCount = 0;

      for (const report of createdReports) {
        // Only update if status is not OPEN
        if (report.status !== REPORT_STATUS.OPEN) {
          try {
            // Prepare admin update payload
            const updatePayload = {
              Status: report.status
            };

            // Add admin response if provided
            if (report.adminResponse) {
              updatePayload.AdminResponse = report.adminResponse;
            }

            // Add resolved date if status is RESOLVED or CLOSED and resolvedDaysAgo is set
            if ((report.status === REPORT_STATUS.RESOLVED || report.status === REPORT_STATUS.CLOSED) &&
                report.resolvedDaysAgo !== null && report.resolvedDaysAgo !== undefined) {
              updatePayload.ResolvedAt = calculateDate(report.resolvedDaysAgo);
            }

            // Update via admin endpoint
            await apiRequest(`/api/reports/admin/${report.id}/status`, 'PUT', updatePayload, ADMIN_TOKEN);

            updateSuccessCount++;
            stats.open += report.status === REPORT_STATUS.OPEN ? 1 : 0;
            stats.inProgress += report.status === REPORT_STATUS.IN_PROGRESS ? 1 : 0;
            stats.resolved += report.status === REPORT_STATUS.RESOLVED ? 1 : 0;
            stats.closed += report.status === REPORT_STATUS.CLOSED ? 1 : 0;

            const statusEmoji = getStatusEmoji(report.status);
            const statusName = ['Open', 'In Progress', 'Resolved', 'Closed'][report.status];

            console.log(`  ✅ ${statusEmoji} Updated to [${statusName}]: ${report.title}`);

            // Small delay
            await new Promise(resolve => setTimeout(resolve, 100));

          } catch (error) {
            updateFailCount++;
            console.error(`  ❌ Failed to update "${report.title}":`, error.message);
          }
        } else {
          // Count OPEN reports that weren't updated
          stats.open++;
        }
      }

      console.log(`\n📝 Updated ${updateSuccessCount} report statuses.`);
      if (updateFailCount > 0) {
        console.log(`❌ Failed to update ${updateFailCount} reports.`);
      }
    } else if (!hasAdminToken) {
      // All reports remain OPEN if no admin token
      stats.open = successCount;
      console.log('⚠️  Skipped status updates (no admin token provided).');
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 REPORT POPULATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total reports created: ${successCount}/${REPORTS_DATA.length}`);
    if (failCount > 0) {
      console.log(`Failed to create:       ${failCount}`);
    }
    console.log('\nBy Type:');
    console.log(`  🏢 Lab:       ${stats.lab}`);
    console.log(`  💻 Equipment: ${stats.equipment}`);

    if (hasAdminToken) {
      console.log('\nBy Status:');
      console.log(`  🆕 Open:        ${stats.open}`);
      console.log(`  🔄 In Progress: ${stats.inProgress}`);
      console.log(`  ✅ Resolved:    ${stats.resolved}`);
      console.log(`  🔒 Closed:      ${stats.closed}`);
    } else {
      console.log('\nBy Status:');
      console.log(`  🆕 Open:        ${stats.open} (all reports)`);
      console.log('\n💡 TIP: Set ADMIN_TOKEN to add admin responses and update report statuses.');
    }

    console.log('='.repeat(70));
    console.log('\n✨ Report population completed!\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
populateReports();
