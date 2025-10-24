/**
 * Check Database Script
 * Quick script to check the current state of the database
 */

const { Client } = require('pg');

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

async function checkDatabase() {
  const client = new Client(DB_CONFIG);

  try {
    console.log('🔌 Connecting to database...\n');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Check users
    console.log('👥 USERS:');
    console.log('='.repeat(70));
    const usersQuery = `
      SELECT u."Id", u."Fullname", u."Email", u."Username"
      FROM tbl_users u
      ORDER BY u."CreatedAt" DESC
      LIMIT 10
    `;
    const usersResult = await client.query(usersQuery);
    console.log(`Total users found: ${usersResult.rows.length}`);
    usersResult.rows.forEach((user, i) => {
      console.log(`${i + 1}. ${user.Fullname} (${user.Email})`);
    });
    console.log('');

    // Check roles
    console.log('🎭 ROLES:');
    console.log('='.repeat(70));
    const rolesQuery = `SELECT * FROM tbl_roles ORDER BY "name"`;
    const rolesResult = await client.query(rolesQuery);
    console.log(`Total roles found: ${rolesResult.rows.length}`);
    rolesResult.rows.forEach((role, i) => {
      console.log(`${i + 1}. ${role.name} - ${role.description}`);
    });
    console.log('');

    // Check user-role mappings
    console.log('🔗 USER-ROLE MAPPINGS:');
    console.log('='.repeat(70));
    const mappingsQuery = `
      SELECT u."Fullname", r."name" as role_name
      FROM tbl_users_roles ur
      INNER JOIN tbl_users u ON ur."UserId" = u."Id"
      INNER JOIN tbl_roles r ON ur."RoleId" = r."Id"
      ORDER BY u."Fullname", r."name"
    `;
    const mappingsResult = await client.query(mappingsQuery);
    console.log(`Total mappings found: ${mappingsResult.rows.length}`);
    mappingsResult.rows.forEach((mapping, i) => {
      console.log(`${i + 1}. ${mapping.Fullname} → ${mapping.role_name}`);
    });
    console.log('');

    // Check reports
    console.log('📋 REPORTS:');
    console.log('='.repeat(70));
    const reportsQuery = `
      SELECT r."Id", r."Title", r."ReporterId"
      FROM tbl_reports r
      ORDER BY r."CreatedAt" DESC
      LIMIT 10
    `;
    const reportsResult = await client.query(reportsQuery);
    console.log(`Total reports found: ${reportsResult.rows.length}`);
    reportsResult.rows.forEach((report, i) => {
      console.log(`${i + 1}. ${report.Title}`);
      console.log(`   Reporter ID: ${report.ReporterId}`);
    });
    console.log('');

    // Check reports with creator info
    console.log('📊 REPORTS WITH CREATOR INFO:');
    console.log('='.repeat(70));
    const reportsWithCreatorQuery = `
      SELECT r."Title", u."Fullname" as creator_name, u."Email" as creator_email
      FROM tbl_reports r
      LEFT JOIN tbl_users u ON r."ReporterId" = u."Id"
      ORDER BY r."CreatedAt" DESC
      LIMIT 10
    `;
    const reportsWithCreatorResult = await client.query(reportsWithCreatorQuery);
    console.log(`Reports with creator info: ${reportsWithCreatorResult.rows.length}`);
    reportsWithCreatorResult.rows.forEach((report, i) => {
      console.log(`${i + 1}. ${report.Title}`);
      console.log(`   Creator: ${report.creator_name || 'NULL'} (${report.creator_email || 'NULL'})`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.\n');
  }
}

checkDatabase();

