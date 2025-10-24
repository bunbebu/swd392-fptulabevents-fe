/**
 * Fix Report Creators Script for FPTU Lab Events
 *
 * This script updates existing reports in the database to ensure that
 * the person who creates the report is a User (Student or Lecturer) instead of an Admin.
 *
 * Usage:
 *   node scripts/fix-report-creators.js
 *
 * Requirements:
 *   - PostgreSQL database connection
 *   - pg package installed (npm install pg)
 *
 * What this script does:
 *   1. Connects to the database
 *   2. Finds all reports created by Admin users
 *   3. Randomly assigns these reports to Student or Lecturer users
 *   4. Updates the ReporterId field in the database
 *
 * Notes:
 *   - This script directly modifies the database
 *   - Make sure to backup your database before running this script
 *   - The script will preserve all other report data (status, admin responses, etc.)
 */

const { Client } = require('pg');

// Database connection configuration
const DB_CONFIG = {
  user: 'postgres.zcjwdnfetlillmsrokve',
  password: 'MNam123@z',
  host: 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
};

// Helper function to get random element from array
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Main execution function
async function fixReportCreators() {
  const client = new Client(DB_CONFIG);

  try {
    console.log('🔌 Connecting to database...\n');
    await client.connect();
    console.log('✅ Connected to database successfully!\n');

    // Step 1: Get all users with their roles
    console.log('📋 Fetching users and their roles...\n');

    const usersQuery = `
      SELECT DISTINCT u."Id", u."Fullname", u."Email", r."name" as role_name
      FROM tbl_users u
      INNER JOIN tbl_users_roles ur ON u."Id" = ur."UserId"
      INNER JOIN tbl_roles r ON ur."RoleId" = r."Id"
      ORDER BY u."Fullname"
    `;

    const usersResult = await client.query(usersQuery);

    // Separate users by role
    const adminUsers = [];
    const nonAdminUsers = [];

    usersResult.rows.forEach(user => {
      if (user.role_name === 'Admin') {
        adminUsers.push(user);
      } else {
        nonAdminUsers.push(user);
      }
    });

    console.log(`Found ${adminUsers.length} Admin users`);
    console.log(`Found ${nonAdminUsers.length} non-Admin users (Students/Lecturers)\n`);

    if (nonAdminUsers.length === 0) {
      console.error('❌ ERROR: No Student or Lecturer users found in the database!');
      console.log('   Please create some Student or Lecturer users first.\n');
      process.exit(1);
    }

    // Step 2: Get all reports created by Admin users
    console.log('📊 Checking reports created by Admin users...\n');
    
    const adminUserIds = adminUsers.map(u => u.Id);
    
    const reportsQuery = `
      SELECT r."Id", r."Title", r."ReporterId", u."Fullname" as reporter_name, role."name" as reporter_role
      FROM tbl_reports r
      INNER JOIN tbl_users u ON r."ReporterId" = u."Id"
      INNER JOIN tbl_users_roles ur ON u."Id" = ur."UserId"
      INNER JOIN tbl_roles role ON ur."RoleId" = role."Id"
      WHERE role."name" = 'Admin'
      ORDER BY r."CreatedAt" DESC
    `;
    
    const reportsResult = await client.query(reportsQuery);
    const adminCreatedReports = reportsResult.rows;

    console.log(`Found ${adminCreatedReports.length} reports created by Admin users\n`);

    if (adminCreatedReports.length === 0) {
      console.log('✅ All reports are already created by non-Admin users!');
      console.log('   No changes needed.\n');
      await client.end();
      return;
    }

    // Step 3: Update reports to be created by non-Admin users
    console.log('🔄 Updating report creators...\n');
    console.log('='.repeat(70));

    let successCount = 0;
    let failCount = 0;

    for (const report of adminCreatedReports) {
      try {
        // Randomly select a non-Admin user
        const newCreator = getRandomElement(nonAdminUsers);
        
        // Update the report
        const updateQuery = `
          UPDATE tbl_reports
          SET "ReporterId" = $1, "LastUpdatedAt" = NOW()
          WHERE "Id" = $2
        `;
        
        await client.query(updateQuery, [newCreator.Id, report.Id]);
        
        successCount++;
        console.log(`✅ Updated: "${report.Title}"`);
        console.log(`   Old creator: ${report.reporter_name} (${report.reporter_role})`);
        console.log(`   New creator: ${newCreator.Fullname} (${newCreator.role_name})`);
        console.log('');

      } catch (error) {
        failCount++;
        console.error(`❌ Failed to update "${report.Title}":`, error.message);
        console.log('');
      }
    }

    console.log('='.repeat(70));
    console.log('\n📊 UPDATE SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total reports found:     ${adminCreatedReports.length}`);
    console.log(`Successfully updated:    ${successCount}`);
    if (failCount > 0) {
      console.log(`Failed to update:        ${failCount}`);
    }
    console.log('='.repeat(70));

    // Step 4: Verify the changes
    console.log('\n🔍 Verifying changes...\n');
    
    const verifyQuery = `
      SELECT role."name" as reporter_role, COUNT(*) as count
      FROM tbl_reports r
      INNER JOIN tbl_users u ON r."ReporterId" = u."Id"
      INNER JOIN tbl_users_roles ur ON u."Id" = ur."UserId"
      INNER JOIN tbl_roles role ON ur."RoleId" = role."Id"
      GROUP BY role."name"
      ORDER BY role."name"
    `;
    
    const verifyResult = await client.query(verifyQuery);
    
    console.log('Reports by creator role:');
    verifyResult.rows.forEach(row => {
      const emoji = row.reporter_role === 'Admin' ? '⚠️' : '✅';
      console.log(`  ${emoji} ${row.reporter_role}: ${row.count} reports`);
    });

    console.log('\n✨ Report creator fix completed!\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.\n');
  }
}

// Run the script
if (require.main === module) {
  fixReportCreators();
}

module.exports = { fixReportCreators };

