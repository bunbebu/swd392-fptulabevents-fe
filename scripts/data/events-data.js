/**
 * Events Data for FPTU Lab Events
 */

// Event status mapping (backend EventStatus enum)
const EVENT_STATUS = {
  ACTIVE: 0,      // Active - Đang hoạt động
  INACTIVE: 1,    // Inactive - Không hoạt động
  CANCELLED: 2,   // Cancelled - Đã hủy
  COMPLETED: 3    // Completed - Đã hoàn thành
};

const EVENTS_DATA = [
  {
    title: 'AI & Machine Learning Workshop 2024',
    description: 'Join us for an intensive workshop on AI and Machine Learning fundamentals. Learn about neural networks, deep learning, and practical applications. Hands-on coding sessions included with real-world datasets.',
    location: 'AI Research Lab - Building B - Floor 4 - Room B401',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Hackathon 2024: Build the Future',
    description: '48-hour coding marathon where students compete to build innovative solutions. Prizes worth $10,000. Free food, mentorship, and networking opportunities with industry leaders.',
    location: 'Innovation Hub - Building C - Floor 3 - Room C301',
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Cybersecurity Fundamentals Training',
    description: 'Learn the basics of cybersecurity, ethical hacking, and network security. Hands-on labs covering penetration testing, vulnerability assessment, and security best practices.',
    location: 'Cybersecurity Lab - Building C - Floor 1 - Room C101',
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Cloud Computing with AWS Certification Prep',
    description: 'Prepare for AWS Solutions Architect certification. Covers EC2, S3, Lambda, RDS, and more. Includes practice exams and hands-on labs in our cloud computing lab.',
    location: 'Cloud Computing Lab - Building A - Floor 4 - Room A401',
    startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Mobile App Development Bootcamp',
    description: 'Intensive bootcamp covering iOS and Android development. Learn Swift, Kotlin, React Native, and Flutter. Build and deploy your first mobile app.',
    location: 'Mobile Dev Lab - Building B - Floor 2 - Room B201',
    startDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Game Development with Unity & Unreal Engine',
    description: 'Create your first 3D game! Learn game design principles, Unity/Unreal Engine basics, C# scripting, and game physics. VR development session included.',
    location: 'Game Dev Studio - Building C - Floor 2 - Room C201',
    startDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Data Science & Analytics Masterclass',
    description: 'Master data analysis with Python, Pandas, NumPy, and visualization libraries. Work with real datasets and learn machine learning basics.',
    location: 'Computer Lab Gamma - Building A - Floor 3 - Room A301',
    startDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'DevOps & CI/CD Pipeline Workshop',
    description: 'Learn modern DevOps practices. Hands-on with Docker, Kubernetes, Jenkins, GitLab CI/CD, and infrastructure as code with Terraform.',
    location: 'Computer Lab Alpha - Building A - Floor 2 - Room A201',
    startDate: new Date(Date.now() + 49 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 49 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Blockchain & Smart Contracts Development',
    description: 'Introduction to blockchain technology, Ethereum, Solidity programming, and DApp development. Build your first smart contract.',
    location: 'Computer Lab Beta - Building A - Floor 2 - Room A202',
    startDate: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'UI/UX Design Thinking Workshop',
    description: 'Learn user-centered design principles, wireframing, prototyping with Figma, and usability testing. Create a complete design portfolio project.',
    location: 'Multimedia Studio - Building B - Floor 1 - Room B101',
    startDate: new Date(Date.now() + 63 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 63 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'IoT & Embedded Systems Project Day',
    description: 'Build IoT projects with Arduino and Raspberry Pi. Learn sensor integration, MQTT protocol, and cloud connectivity. Showcase your projects.',
    location: 'IoT Workshop - Building B - Floor 3 - Room B301',
    startDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Full-Stack Web Development Bootcamp',
    description: 'Complete web development course covering HTML, CSS, JavaScript, React, Node.js, Express, and MongoDB. Build and deploy a full-stack application.',
    location: 'Computer Lab Alpha - Building A - Floor 2 - Room A201',
    startDate: new Date(Date.now() + 77 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 79 * 24 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Tech Career Fair 2024',
    description: 'Meet recruiters from top tech companies. Bring your resume, portfolio, and be ready for on-spot interviews. Career counseling sessions available.',
    location: 'Innovation Hub - Building C - Floor 3 - Room C301',
    startDate: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Python Programming for Beginners',
    description: 'Start your programming journey with Python. Learn syntax, data structures, OOP, and build practical projects. No prior experience required.',
    location: 'Computer Lab Beta - Building A - Floor 2 - Room A202',
    startDate: new Date(Date.now() + 91 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 91 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Database Design & SQL Mastery',
    description: 'Master database design, normalization, SQL queries, stored procedures, and performance optimization. Work with MySQL, PostgreSQL, and MongoDB.',
    location: 'Computer Lab Gamma - Building A - Floor 3 - Room A301',
    startDate: new Date(Date.now() + 98 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 98 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Agile & Scrum Project Management',
    description: 'Learn agile methodologies, Scrum framework, sprint planning, and team collaboration. Prepare for Scrum Master certification.',
    location: 'Innovation Hub - Building C - Floor 3 - Room C301',
    startDate: new Date(Date.now() + 105 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 105 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Network Engineering Certification Workshop',
    description: 'Prepare for CCNA certification. Covers routing, switching, network security, and troubleshooting. Hands-on labs with Cisco equipment.',
    location: 'Network Lab - Building A - Floor 1 - Room A101',
    startDate: new Date(Date.now() + 112 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 112 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Software Testing & Quality Assurance',
    description: 'Learn manual and automated testing, test case design, Selenium, JUnit, and continuous testing in CI/CD pipelines.',
    location: 'Computer Lab Alpha - Building A - Floor 2 - Room A201',
    startDate: new Date(Date.now() + 119 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 119 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Tech Talk: Industry Leaders Series',
    description: 'Hear from successful tech entrepreneurs and industry leaders. Q&A session, networking, and career advice. Special guest speakers from Google, Microsoft, and Amazon.',
    location: 'Innovation Hub - Building C - Floor 3 - Room C301',
    startDate: new Date(Date.now() + 126 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 126 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  },
  {
    title: 'Student Project Showcase 2024',
    description: 'Present your innovative projects to faculty, industry experts, and fellow students. Best projects win prizes and potential funding opportunities.',
    location: 'Innovation Hub - Building C - Floor 3 - Room C301',
    startDate: new Date(Date.now() + 133 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 133 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    status: EVENT_STATUS.ACTIVE,
    visibility: true,
    recurrenceRule: null
  }
];

module.exports = {
  EVENTS_DATA,
  EVENT_STATUS
};

