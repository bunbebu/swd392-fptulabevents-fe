/**
 * Lab Member Data Configuration for FPTU Lab Events
 *
 * This file defines configuration for generating lab member assignments.
 * The actual members will be dynamically created from existing users and labs.
 */

// Member role mapping (backend enum values)
const MEMBER_ROLES = {
  LEAD: 'Lead',           // Lab lead/supervisor
  ASSISTANT: 'Assistant', // Lab assistant
  MEMBER: 'Member'        // Regular member
};

// Member status mapping (backend enum values)
const MEMBER_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive'
};

/**
 * Configuration for how many members to assign per lab
 */
const LAB_MEMBER_CONFIG = {
  // Minimum and maximum members per lab
  minMembersPerLab: 2,
  maxMembersPerLab: 5,

  // Role distribution (percentage)
  roleDistribution: {
    Lead: 0.20,      // 20% of members are leads (typically 1 per lab)
    Assistant: 0.35, // 35% are assistants (1-2 per lab)
    Member: 0.45     // 45% are regular members (1-2 per lab)
  },

  // Status distribution (percentage)
  statusDistribution: {
    Active: 0.90,    // 90% active members
    Inactive: 0.10   // 10% inactive members
  }
};

/**
 * Lab specializations to help match users to appropriate labs
 * (These match the lab names from labs-data.js)
 */
const LAB_SPECIALIZATIONS = [
  'AI & Machine Learning Lab',
  'Software Engineering Lab',
  'Data Science Lab',
  'Cybersecurity Lab',
  'Cloud Computing Lab',
  'Mobile Development Lab',
  'IoT & Embedded Systems Lab',
  'Game Development Lab',
  'Web Development Lab',
  'Database Systems Lab',
  'Network Engineering Lab',
  'DevOps Lab',
  'Blockchain Lab',
  'UI/UX Design Lab',
  'Research & Innovation Lab',
  'Computer Vision Lab',
  'Robotics Lab',
  'Quantum Computing Lab',
  'Natural Language Processing Lab',
  'Testing & QA Lab'
];

/**
 * Helper function to generate member assignments
 * @param {Array} labs - Array of lab objects from API
 * @param {Array} users - Array of user objects from API
 * @returns {Array} Array of member assignment objects
 */
function generateMemberAssignments(labs, users) {
  const assignments = [];
  const usedUserIds = new Set(); // Track used users to avoid duplicates

  // Filter to only active labs and available users
  // Labs: status 0 = Active, 1 = Inactive (or could be undefined for all labs)
  const activeLabs = labs.filter(lab => {
    const status = lab.status ?? lab.Status;
    return status === undefined || status === 0 || status === 'Active';
  });

  const availableUsers = users.filter(user => {
    const status = user.status ?? user.Status;
    return status === undefined || status === 'Active' || status === 0;
  });

  console.log(`   • Active labs: ${activeLabs.length} / ${labs.length}`);
  console.log(`   • Available users: ${availableUsers.length} / ${users.length}`);

  if (activeLabs.length === 0) {
    console.warn('⚠️  No active labs available for assignment');
    return assignments;
  }

  if (availableUsers.length === 0) {
    console.warn('⚠️  No active users available for assignment');
    return assignments;
  }

  // Shuffle users for random assignment
  const shuffledUsers = [...availableUsers].sort(() => Math.random() - 0.5);
  let userIndex = 0;

  activeLabs.forEach(lab => {
    const labId = lab.id || lab.Id;
    const labName = lab.name || lab.Name;

    // Determine number of members for this lab
    const memberCount = Math.floor(
      Math.random() * (LAB_MEMBER_CONFIG.maxMembersPerLab - LAB_MEMBER_CONFIG.minMembersPerLab + 1)
    ) + LAB_MEMBER_CONFIG.minMembersPerLab;

    // Ensure we have at least one lead per lab
    const roles = ['Lead'];

    // Add additional roles based on member count
    for (let i = 1; i < memberCount; i++) {
      const rand = Math.random();
      if (rand < 0.4 && roles.filter(r => r === 'Assistant').length < 2) {
        roles.push('Assistant');
      } else {
        roles.push('Member');
      }
    }

    // Assign users to this lab
    for (let i = 0; i < memberCount && userIndex < shuffledUsers.length; i++) {
      const user = shuffledUsers[userIndex];
      const userId = user.id || user.Id;

      // Skip if user already assigned (optional: allow users in multiple labs)
      // Comment out the next 4 lines if you want users in multiple labs
      if (usedUserIds.has(userId)) {
        userIndex++;
        i--;
        continue;
      }

      // Determine status (mostly active)
      const status = Math.random() < LAB_MEMBER_CONFIG.statusDistribution.Active
        ? MEMBER_STATUS.ACTIVE
        : MEMBER_STATUS.INACTIVE;

      assignments.push({
        labId: labId,
        labName: labName,
        userId: userId,
        userName: user.fullname || user.Fullname || user.username || user.Username,
        userEmail: user.email || user.Email,
        role: roles[i % roles.length],
        status: status
      });

      usedUserIds.add(userId);
      userIndex++;
    }
  });

  return assignments;
}

/**
 * Get statistics about assignments
 */
function getAssignmentStats(assignments) {
  const stats = {
    totalAssignments: assignments.length,
    uniqueUsers: new Set(assignments.map(a => a.userId)).size,
    uniqueLabs: new Set(assignments.map(a => a.labId)).size,
    byRole: {
      Lead: assignments.filter(a => a.role === 'Lead').length,
      Assistant: assignments.filter(a => a.role === 'Assistant').length,
      Member: assignments.filter(a => a.role === 'Member').length
    },
    byStatus: {
      Active: assignments.filter(a => a.status === 'Active').length,
      Inactive: assignments.filter(a => a.status === 'Inactive').length
    },
    avgMembersPerLab: 0
  };

  if (stats.uniqueLabs > 0) {
    stats.avgMembersPerLab = (stats.totalAssignments / stats.uniqueLabs).toFixed(2);
  }

  return stats;
}

module.exports = {
  MEMBER_ROLES,
  MEMBER_STATUS,
  LAB_MEMBER_CONFIG,
  LAB_SPECIALIZATIONS,
  generateMemberAssignments,
  getAssignmentStats
};
