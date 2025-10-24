/**
 * Reassign Report Creators Script for FPTU Lab Events
 *
 * This script allows you to reassign report creators with more control.
 * You can specify which users should be assigned as creators, or let the script
 * randomly distribute reports among non-Admin users.
 *
 * Usage:
 *   node scripts/reassign-report-creators.js [options]
 *
 * Options:
 *   --all              Reassign ALL reports (including those already created by users)
 *   --admin-only       Only reassign reports created by Admin users (default)
 *   --dry-run          Show what would be changed without making actual changes
 *   --user-email=...   Assign all reports to a specific user by email
 *   --role=Student     Only assign to users with specific role (Student or Lecturer)
 *
 * Examples:
 *   node scripts/reassign-report-creators.js
 *   node scripts/reassign-report-creators.js --dry-run
 *   node scripts/reassign-report-creators.js --all
 *   node scripts/reassign-report-creators.js --user-email=student@fpt.edu.vn
 *   node scripts/reassign-report-creators.js --role=Student
 *
 * Requirements:
 *   - PostgreSQL database connection
 *   - pg package installed (npm install pg)
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

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  all: args.includes('--all'),
  adminOnly: !args.includes('--all'),
  dryRun: args.includes('--dry-run'),
  userEmail: args.find(arg => arg.startsWith('--user-email='))?.split('=')[1],
  role: args.find(arg => arg.startsWith('--role='))?.split('=')[1]
};

// Helper function to get random element from array
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Main execution function
async function reassignReportCreators() {
  const client = new Client(DB_CONFIG);

  try {
    console.log('🔌 Connecting to database...\n');
    await client.connect();
    console.log('✅ Connected to database successfully!\n');

    // Display options
    console.log('⚙️  Script Options:');
    console.log(`   Mode: ${options.all ? 'Reassign ALL reports' : 'Reassign Admin-created reports only'}`);
    console.log(`   Dry Run: ${options.dryRun ? 'YES (no changes will be made)' : 'NO (changes will be applied)'}`);
    if (options.userEmail) {
      console.log(`   Target User: ${options.userEmail}`);
    }
    if (options.role) {
      console.log(`   Target Role: ${options.role}`);
    }
    console.log('');

    // Step 1: Get target users (non-Admin users or specific user)
    console.log('📋 Fetching target users...\n');
    
    let targetUsers = [];
    
    if (options.userEmail) {
      // Get specific user by email
      const userQuery = `
        SELECT DISTINCT u."Id", u."Fullname", u."Email", r."name" as role_name
        FROM tbl_users u
        INNER JOIN tbl_users_roles ur ON u."Id" = ur."UserId"
        INNER JOIN tbl_roles r ON ur."RoleId" = r."Id"
        WHERE u."Email" = $1 AND u."status" = 0
      `;
      const userResult = await client.query(userQuery, [options.userEmail]);
      
      if (userResult.rows.length === 0) {
        console.error(`❌ ERROR: User with email "${options.userEmail}" not found!`);
        process.exit(1);
      }
      
      targetUsers = userResult.rows;
      console.log(`✅ Found user: ${targetUsers[0].Fullname} (${targetUsers[0].role_name})\n`);
      
    } else {
      // Get all non-Admin users (or filtered by role)
      let usersQuery = `
        SELECT DISTINCT u."Id", u."Fullname", u."Email", r."name" as role_name
        FROM tbl_users u
        INNER JOIN tbl_users_roles ur ON u."Id" = ur."UserId"
        INNER JOIN tbl_roles r ON ur."RoleId" = r."Id"
        WHERE u."status" = 0 AND r."name" != 'Admin'
      `;
      
      if (options.role) {
        usersQuery += ` AND r."name" = '${options.role}'`;
      }
      
      usersQuery += ` ORDER BY u."Fullname"`;
      
      const usersResult = await client.query(usersQuery);
      targetUsers = usersResult.rows;
      
      console.log(`Found ${targetUsers.length} target users`);
      if (options.role) {
        console.log(`  (filtered by role: ${options.role})`);
      }
      console.log('');
    }

    if (targetUsers.length === 0) {
      console.error('❌ ERROR: No target users found!');
      console.log('   Please create some Student or Lecturer users first.\n');
      process.exit(1);
    }

    // Step 2: Get reports to reassign
    console.log('📊 Fetching reports to reassign...\n');
    
    let reportsQuery = `
      SELECT r."Id", r."Title", r."ReporterId", r."Type", r."Status",
             u."Fullname" as reporter_name, role."name" as reporter_role
      FROM tbl_reports r
      INNER JOIN tbl_users u ON r."ReporterId" = u."Id"
      INNER JOIN tbl_users_roles ur ON u."Id" = ur."UserId"
      INNER JOIN tbl_roles role ON ur."RoleId" = role."Id"
    `;
    
    if (options.adminOnly) {
      reportsQuery += ` WHERE role."name" = 'Admin'`;
    }
    
    reportsQuery += ` ORDER BY r."CreatedAt" DESC`;
    
    const reportsResult = await client.query(reportsQuery);
    const reportsToReassign = reportsResult.rows;

    console.log(`Found ${reportsToReassign.length} reports to reassign\n`);

    if (reportsToReassign.length === 0) {
      console.log('✅ No reports need to be reassigned!');
      await client.end();
      return;
    }

    // Step 3: Show preview
    console.log('📋 Preview of changes:');
    console.log('='.repeat(70));
    
    const preview = reportsToReassign.slice(0, 5);
    preview.forEach(report => {
      const newCreator = getRandomElement(targetUsers);
      console.log(`Report: "${report.Title}"`);
      console.log(`  Current: ${report.reporter_name} (${report.reporter_role})`);
      console.log(`  New:     ${newCreator.Fullname} (${newCreator.role_name})`);
      console.log('');
    });
    
    if (reportsToReassign.length > 5) {
      console.log(`... and ${reportsToReassign.length - 5} more reports`);
      console.log('');
    }
    
    console.log('='.repeat(70));
    console.log('');

    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made');
      console.log(`   ${reportsToReassign.length} reports would be reassigned\n`);
      await client.end();
      return;
    }

    // Step 4: Perform the reassignment
    console.log('🔄 Reassigning report creators...\n');
    console.log('='.repeat(70));

    let successCount = 0;
    let failCount = 0;
    const roleStats = {};

    for (const report of reportsToReassign) {
      try {
        // Select new creator
        const newCreator = getRandomElement(targetUsers);
        
        // Update the report
        const updateQuery = `
          UPDATE tbl_reports
          SET "ReporterId" = $1, "LastUpdatedAt" = NOW()
          WHERE "Id" = $2
        `;
        
        await client.query(updateQuery, [newCreator.Id, report.Id]);
        
        successCount++;
        
        // Track stats by role
        roleStats[newCreator.role_name] = (roleStats[newCreator.role_name] || 0) + 1;
        
        console.log(`✅ [${successCount}/${reportsToReassign.length}] "${report.Title}"`);
        console.log(`   ${report.reporter_name} (${report.reporter_role}) → ${newCreator.Fullname} (${newCreator.role_name})`);

      } catch (error) {
        failCount++;
        console.error(`❌ Failed to update "${report.Title}":`, error.message);
      }
    }

    console.log('='.repeat(70));
    console.log('\n📊 REASSIGNMENT SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total reports processed: ${reportsToReassign.length}`);
    console.log(`Successfully reassigned: ${successCount}`);
    if (failCount > 0) {
      console.log(`Failed to reassign:      ${failCount}`);
    }
    console.log('\nReports assigned by role:');
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} reports`);
    });
    console.log('='.repeat(70));

    // Step 5: Verify the changes
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
    
    console.log('Current reports by creator role:');
    verifyResult.rows.forEach(row => {
      const emoji = row.reporter_role === 'Admin' ? '⚠️' : '✅';
      console.log(`  ${emoji} ${row.reporter_role}: ${row.count} reports`);
    });

    console.log('\n✨ Report creator reassignment completed!\n');

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
  reassignReportCreators();
}

module.exports = { reassignReportCreators };

