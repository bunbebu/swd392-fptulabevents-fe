/**
 * Lab Data Population Script for FPTU Lab Events
 * 
 * This script creates a variety of labs for testing and development.
 * 
 * Usage:
 *   node scripts/populate-labs.js
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
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiI4ZjI2Y2I0Mi00YzNhLTRjOGQtOGUwNC01M2I0Yjc1ZjI4MzgiLCJzdGF0dXMiOiJBY3RpdmUiLCJlbWFpbCI6InBodWNuaHNlMTgyOTMyQGZwdC5lZHUudm4iLCJyb2xlIjoiQWRtaW4iLCJuYW1laWQiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEiLCJuYmYiOjE3NjExNDQzNzksImV4cCI6MTc2MTE0Nzk3OSwiaWF0IjoxNzYxMTQ0Mzc5LCJpc3MiOiJjOWE0NTIyNS1kNGQxLTQxOWItYWQ0NC03YWQzYmVlMzQ3OTEifQ.ry3jz6je8iAB3w6w0jMrNxCKZITmWlbZTLP1KdAjZzc';

// Lab status mapping (from backend LabStatus enum)
const LAB_STATUS = {
  ACTIVE: 0,
  INACTIVE: 1
};

// Sample lab data with variety
const LABS_DATA = [
  {
    name: 'AI & Machine Learning Lab',
    description: 'Specialized laboratory for artificial intelligence and machine learning research. Equipped with high-performance GPUs and deep learning frameworks.',
    location: 'Building A - Floor 3 - Lab 301',
    capacity: 30,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Software Engineering Lab',
    description: 'Modern software development lab with collaborative workspaces and agile development tools.',
    location: 'Building A - Floor 2 - Lab 201',
    capacity: 35,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Cybersecurity Lab',
    description: 'Advanced cybersecurity laboratory with isolated network environments for penetration testing and security research.',
    location: 'Building B - Floor 3 - Lab 303',
    capacity: 25,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Data Science Lab',
    description: 'Data analytics and visualization lab with big data processing capabilities and statistical analysis tools.',
    location: 'Building A - Floor 4 - Lab 401',
    capacity: 28,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Mobile Development Lab',
    description: 'Cross-platform mobile development lab with iOS and Android development environments.',
    location: 'Building B - Floor 2 - Lab 202',
    capacity: 32,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Web Development Lab',
    description: 'Full-stack web development laboratory with modern frameworks and cloud deployment tools.',
    location: 'Building A - Floor 2 - Lab 202',
    capacity: 40,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'IoT & Embedded Systems Lab',
    description: 'Internet of Things laboratory with microcontrollers, sensors, and embedded systems development kits.',
    location: 'Building C - Floor 1 - Lab 101',
    capacity: 20,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Cloud Computing Lab',
    description: 'Cloud infrastructure lab with access to AWS, Azure, and GCP platforms for cloud-native development.',
    location: 'Building B - Floor 4 - Lab 401',
    capacity: 30,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Game Development Lab',
    description: 'Game design and development lab with Unity, Unreal Engine, and VR/AR equipment.',
    location: 'Building C - Floor 2 - Lab 201',
    capacity: 25,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Database Systems Lab',
    description: 'Database management and design lab with SQL and NoSQL database systems.',
    location: 'Building A - Floor 3 - Lab 302',
    capacity: 35,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'DevOps Lab',
    description: 'DevOps and CI/CD laboratory with containerization, orchestration, and automation tools.',
    location: 'Building B - Floor 3 - Lab 301',
    capacity: 28,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Blockchain Lab',
    description: 'Blockchain and distributed systems lab for cryptocurrency and smart contract development.',
    location: 'Building C - Floor 3 - Lab 301',
    capacity: 22,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Computer Vision Lab',
    description: 'Computer vision and image processing laboratory with specialized cameras and GPU clusters.',
    location: 'Building A - Floor 4 - Lab 402',
    capacity: 24,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Network Engineering Lab',
    description: 'Network design and administration lab with routers, switches, and network simulation tools.',
    location: 'Building B - Floor 1 - Lab 101',
    capacity: 30,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'UI/UX Design Lab',
    description: 'User interface and experience design lab with design software and prototyping tools.',
    location: 'Building C - Floor 2 - Lab 202',
    capacity: 26,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Robotics Lab',
    description: 'Robotics and automation laboratory with robotic arms, drones, and control systems.',
    location: 'Building C - Floor 1 - Lab 102',
    capacity: 18,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Quantum Computing Lab',
    description: 'Quantum computing research lab with quantum simulators and access to quantum cloud platforms.',
    location: 'Building A - Floor 5 - Lab 501',
    capacity: 15,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Natural Language Processing Lab',
    description: 'NLP and computational linguistics lab for text analysis and language model development.',
    location: 'Building B - Floor 4 - Lab 402',
    capacity: 25,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Testing & QA Lab',
    description: 'Software testing and quality assurance lab with automated testing frameworks and tools.',
    location: 'Building A - Floor 3 - Lab 303',
    capacity: 30,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Research & Innovation Lab',
    description: 'General-purpose research laboratory for experimental projects and innovation initiatives.',
    location: 'Building C - Floor 3 - Lab 302',
    capacity: 20,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Maintenance Lab (Inactive)',
    description: 'Laboratory currently under maintenance and equipment upgrade. Will reopen next semester.',
    location: 'Building D - Floor 1 - Lab 101',
    capacity: 35,
    status: LAB_STATUS.INACTIVE
  },
  {
    name: 'Legacy Systems Lab (Inactive)',
    description: 'Old computer lab scheduled for renovation. Equipment being transferred to other labs.',
    location: 'Building D - Floor 2 - Lab 201',
    capacity: 40,
    status: LAB_STATUS.INACTIVE
  }
];

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

// Main execution function
async function populateLabs() {
  console.log('🚀 Starting lab data population...\n');

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
    // Create Labs
    console.log('🔬 Creating labs...');
    const createdLabs = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const labData of LABS_DATA) {
      try {
        const lab = await apiRequest('/api/labs', 'POST', labData);
        createdLabs.push(lab);
        successCount++;
        const statusEmoji = labData.status === LAB_STATUS.ACTIVE ? '🟢' : '🔴';
        console.log(`  ${statusEmoji} Created: ${labData.name} (ID: ${lab.id || lab.Id})`);
      } catch (error) {
        failCount++;
        console.error(`  ❌ Failed to create ${labData.name}:`, error.message);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total labs in script:  ${LABS_DATA.length}`);
    console.log(`Successfully created:  ${successCount}`);
    console.log(`Failed to create:      ${failCount}`);
    console.log('='.repeat(60));
    
    if (successCount > 0) {
      console.log('\n📈 Lab Statistics:');
      const activeLabs = LABS_DATA.filter(lab => lab.status === LAB_STATUS.ACTIVE).length;
      const inactiveLabs = LABS_DATA.filter(lab => lab.status === LAB_STATUS.INACTIVE).length;
      console.log(`  🟢 Active labs:   ${activeLabs}`);
      console.log(`  🔴 Inactive labs: ${inactiveLabs}`);
    }
    
    console.log('\n✨ Lab data population completed!\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
populateLabs();

