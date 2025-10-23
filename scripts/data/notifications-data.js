/**
 * Notifications Data for FPTU Lab Events
 */

// Target group mapping (backend expects strings)
const TARGET_GROUPS = {
  ALL: 'All',
  STUDENT: 'Student',
  LECTURER: 'Lecturer'
};

const NOTIFICATIONS_DATA = [
  // Active notifications for all users
  {
    title: 'Welcome to FPTU Lab Events System 2024',
    content: 'Welcome to the upgraded FPTU Lab Events Management System! We\'ve added new features including enhanced room booking, equipment tracking, and event management. Explore the new dashboard and let us know your feedback.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'System Maintenance Scheduled',
    content: 'The FPTU Lab Events system will undergo scheduled maintenance on Sunday, 3:00 AM - 6:00 AM. During this time, the system may be temporarily unavailable. We apologize for any inconvenience.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'New AI Research Lab Now Available',
    content: 'We\'re excited to announce the opening of our new AI Research Lab in Building B, Floor 4. The lab features 30 high-performance workstations with RTX 4090 GPUs and a dedicated GPU cluster server. Book your sessions now!',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Hackathon 2024 Registration Open',
    content: 'Registration is now open for Hackathon 2024: Build the Future! Join us for a 48-hour coding marathon with prizes worth $10,000. Limited spots available. Register at the Innovation Hub or through the events page.',
    targetGroup: TARGET_GROUPS.STUDENT,
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Lab Equipment Maintenance Notice',
    content: 'All computer labs will undergo routine equipment maintenance this weekend. Some workstations may be temporarily unavailable. We appreciate your patience as we ensure all equipment is in optimal condition.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'New Booking Policy for Labs',
    content: 'Important: New lab booking policy effective immediately. Students can now book labs up to 2 weeks in advance. Maximum booking duration is 4 hours per session. Please cancel bookings you cannot attend to allow others to use the facilities.',
    targetGroup: TARGET_GROUPS.STUDENT,
    startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Faculty Training: New Lab Management Features',
    content: 'Dear Lecturers, we\'re hosting a training session on the new lab management features including bulk booking, equipment reservation, and student attendance tracking. Session scheduled for next Tuesday at 2:00 PM in the Innovation Hub.',
    targetGroup: TARGET_GROUPS.LECTURER,
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Cloud Computing Lab Expansion',
    content: 'Great news! Our Cloud Computing Lab has been expanded with additional workstations and upgraded cloud platform access. Now supporting AWS, Azure, Google Cloud, and Oracle Cloud. Perfect for your cloud certification preparation.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Tech Career Fair 2024 - Save the Date',
    content: 'Mark your calendars! Tech Career Fair 2024 is coming in 3 months. Top tech companies will be recruiting. Start preparing your resume and portfolio. Career counseling sessions available at the Student Services office.',
    targetGroup: TARGET_GROUPS.STUDENT,
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Equipment Damage Reporting',
    content: 'If you notice any damaged or malfunctioning equipment during your lab session, please report it immediately through the system or contact lab staff. Your cooperation helps us maintain quality facilities for everyone.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Free Workshop Series Starting Next Week',
    content: 'Join our free workshop series covering AI/ML, Cybersecurity, Cloud Computing, and more! All workshops are hands-on with expert instructors. Check the events page for the complete schedule and registration details.',
    targetGroup: TARGET_GROUPS.STUDENT,
    startDate: new Date(Date.now()).toISOString(),
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Lab Access Hours Extended',
    content: 'Good news! Lab access hours have been extended. Computer labs are now open Monday-Friday 7:00 AM - 10:00 PM, and Saturday-Sunday 9:00 AM - 6:00 PM. Make the most of your learning time!',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Research Project Funding Available',
    content: 'Lecturers: Research project funding applications are now open. Priority given to projects utilizing our new AI Research Lab and Innovation Hub. Deadline for applications: end of this month. Contact Research Office for details.',
    targetGroup: TARGET_GROUPS.LECTURER,
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Student Project Showcase Registration',
    content: 'Calling all students! Register your innovative projects for the Student Project Showcase 2024. Winners receive prizes and potential funding. Showcase your work to industry experts and faculty. Registration closes in 2 weeks.',
    targetGroup: TARGET_GROUPS.STUDENT,
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'VR Equipment Now Available',
    content: 'New VR equipment is now available in the Game Dev Studio! Includes Oculus Quest 3, HTC Vive Pro 2, and PlayStation VR2. Perfect for game development and VR application projects. Book your session through the equipment reservation system.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Lab Safety Guidelines Update',
    content: 'Important: Lab safety guidelines have been updated. Please review the new guidelines posted in each lab and on the website. Key updates include food/drink policy, equipment handling procedures, and emergency protocols.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Guest Lecture: Industry Expert Series',
    content: 'Don\'t miss our Industry Expert Series! This month featuring speakers from Google, Microsoft, and Amazon. Topics include career development, emerging technologies, and industry trends. Open to all students and faculty.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Semester Break Lab Schedule',
    content: 'Attention: During semester break, lab hours will be reduced. Most labs will be open Monday-Friday 9:00 AM - 5:00 PM. Some specialized labs may have limited availability. Check the schedule before planning your visit.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'New Software Licenses Available',
    content: 'We\'ve acquired new software licenses for all labs! Now available: JetBrains Suite, Adobe Creative Cloud, Autodesk Suite, and more. Access credentials available through your student/faculty portal.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Lab Assistant Positions Open',
    content: 'We\'re hiring lab assistants! Great opportunity for students to gain experience and earn while studying. Responsibilities include equipment maintenance, user support, and lab monitoring. Apply through the Student Employment Office.',
    targetGroup: TARGET_GROUPS.STUDENT,
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Feedback Survey - Help Us Improve',
    content: 'Your opinion matters! Please take 5 minutes to complete our lab facilities feedback survey. Your input helps us improve equipment, services, and overall experience. Survey link available on the homepage. Thank you!',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Certification Exam Preparation Resources',
    content: 'New certification prep resources available! Access practice exams, study guides, and video tutorials for AWS, Azure, CCNA, CompTIA, and more. Available in the library and through online portal.',
    targetGroup: TARGET_GROUPS.STUDENT,
    startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Innovation Hub Collaboration Spaces',
    content: 'The Innovation Hub now offers dedicated collaboration spaces for team projects. Features include smart boards, video conferencing, and flexible seating. Perfect for group work and project meetings. Book through the room reservation system.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Lab Booking Reminder System',
    content: 'New feature: Automatic booking reminders! You\'ll now receive email and in-app notifications 24 hours and 1 hour before your scheduled lab session. Update your notification preferences in your profile settings.',
    targetGroup: TARGET_GROUPS.ALL,
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Research Collaboration Opportunities',
    content: 'Lecturers: Looking for student collaborators for your research projects? Post your opportunities on the Research Board in the Innovation Hub. Students: Check the board regularly for exciting research opportunities!',
    targetGroup: TARGET_GROUPS.LECTURER,
    startDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
  }
];

module.exports = {
  NOTIFICATIONS_DATA,
  TARGET_GROUPS
};

