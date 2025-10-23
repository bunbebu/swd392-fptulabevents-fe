/**
 * Lab Data for FPTU Lab Events
 */

// Lab status mapping (backend LabStatus enum)
const LAB_STATUS = {
  ACTIVE: 0,      // Active
  INACTIVE: 1,    // Inactive
  MAINTENANCE: 2  // Maintenance
};

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
    name: 'Data Science Lab',
    description: 'Advanced data analytics laboratory with big data processing capabilities and visualization tools.',
    location: 'Building B - Floor 4 - Lab 401',
    capacity: 28,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Cybersecurity Lab',
    description: 'Secure environment for cybersecurity training and penetration testing exercises.',
    location: 'Building C - Floor 1 - Lab 101',
    capacity: 25,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Cloud Computing Lab',
    description: 'Cloud infrastructure lab with access to AWS, Azure, and Google Cloud platforms.',
    location: 'Building A - Floor 4 - Lab 402',
    capacity: 32,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Mobile Development Lab',
    description: 'iOS and Android development lab with latest mobile devices and testing equipment.',
    location: 'Building B - Floor 2 - Lab 202',
    capacity: 30,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'IoT & Embedded Systems Lab',
    description: 'Internet of Things laboratory with Arduino, Raspberry Pi, and various sensors.',
    location: 'Building C - Floor 3 - Lab 303',
    capacity: 24,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Game Development Lab',
    description: 'Game design and development studio with Unity, Unreal Engine, and VR equipment.',
    location: 'Building B - Floor 3 - Lab 301',
    capacity: 26,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Web Development Lab',
    description: 'Full-stack web development lab with modern frameworks and deployment tools.',
    location: 'Building A - Floor 2 - Lab 203',
    capacity: 38,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Database Systems Lab',
    description: 'Database administration and design lab with SQL Server, Oracle, MongoDB, and PostgreSQL.',
    location: 'Building C - Floor 2 - Lab 201',
    capacity: 30,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Network Engineering Lab',
    description: 'Networking lab with Cisco routers, switches, and network simulation tools.',
    location: 'Building A - Floor 1 - Lab 102',
    capacity: 22,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'DevOps Lab',
    description: 'CI/CD pipeline lab with Jenkins, Docker, Kubernetes, and automation tools.',
    location: 'Building B - Floor 4 - Lab 403',
    capacity: 28,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Blockchain Lab',
    description: 'Blockchain development and cryptocurrency research laboratory.',
    location: 'Building C - Floor 4 - Lab 401',
    capacity: 20,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'UI/UX Design Lab',
    description: 'User interface and experience design studio with design software and prototyping tools.',
    location: 'Building B - Floor 1 - Lab 103',
    capacity: 24,
    status: LAB_STATUS.ACTIVE
  },
  {
    name: 'Research & Innovation Lab',
    description: 'Multi-purpose research lab for student projects and innovation initiatives.',
    location: 'Building A - Floor 5 - Lab 501',
    capacity: 40,
    status: LAB_STATUS.ACTIVE
  }
];

module.exports = {
  LABS_DATA,
  LAB_STATUS
};

