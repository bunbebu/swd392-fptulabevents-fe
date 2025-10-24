/**
 * Reports Data for FPTU Lab Events
 * Sample report data for testing and development
 */

// Report type mapping (backend enum)
const REPORT_TYPE = {
  LAB: 0,        // Lab-related issues
  EQUIPMENT: 1   // Equipment-related issues
};

// Report status mapping (backend enum)
const REPORT_STATUS = {
  OPEN: 0,        // Newly created, not yet reviewed
  IN_PROGRESS: 1, // Being investigated/worked on
  RESOLVED: 2,    // Issue has been resolved
  CLOSED: 3       // Issue closed (may or may not be resolved)
};

const REPORTS_DATA = [
  // Lab-related reports
  {
    title: 'Air Conditioning Not Working in Lab A101',
    description: 'The air conditioning system in Computer Lab A101 has been malfunctioning for the past 3 days. The room temperature is too high, making it uncomfortable for students during lab sessions. Please check the AC unit and fix it as soon as possible.',
    type: REPORT_TYPE.LAB,
    imageUrl: null,
    status: REPORT_STATUS.OPEN,
    createdDaysAgo: 2
  },
  {
    title: 'Broken Door Lock in Lab B203',
    description: 'The door lock in Lab B203 is broken and cannot be locked properly. This is a security concern as expensive equipment is stored in this lab. The lock needs to be replaced urgently.',
    type: REPORT_TYPE.LAB,
    imageUrl: null,
    status: REPORT_STATUS.IN_PROGRESS,
    createdDaysAgo: 5,
    adminResponse: 'We have contacted the maintenance team. A technician will visit the lab tomorrow to assess and replace the lock.',
    resolvedDaysAgo: null
  },
  {
    title: 'Flickering Lights in Lab C305',
    description: 'Multiple fluorescent lights in Lab C305 are flickering constantly. This is causing eye strain for students during long coding sessions. Some lights appear to be near the end of their lifespan.',
    type: REPORT_TYPE.LAB,
    imageUrl: null,
    status: REPORT_STATUS.RESOLVED,
    createdDaysAgo: 10,
    adminResponse: 'All flickering lights have been replaced with new LED panels. The issue has been resolved. Thank you for reporting this.',
    resolvedDaysAgo: 3
  },
  {
    title: 'Insufficient Power Outlets in Lab D102',
    description: 'Lab D102 only has 15 power outlets but can accommodate 30 students. Students have to share outlets or use extension cords, which is not ideal. Please consider installing additional power outlets.',
    type: REPORT_TYPE.LAB,
    imageUrl: null,
    status: REPORT_STATUS.OPEN,
    createdDaysAgo: 1
  },
  {
    title: 'Whiteboard Markers Missing in Lab A205',
    description: 'The whiteboard in Lab A205 has no markers or eraser. This makes it difficult for lecturers to explain concepts during class. Please stock the lab with whiteboard supplies.',
    type: REPORT_TYPE.LAB,
    imageUrl: null,
    status: REPORT_STATUS.RESOLVED,
    createdDaysAgo: 7,
    adminResponse: 'We have restocked Lab A205 with whiteboard markers (black, blue, red) and erasers. A monthly supply check has been scheduled.',
    resolvedDaysAgo: 5
  },
  {
    title: 'Noisy Ventilation System in Lab B104',
    description: 'The ventilation system in Lab B104 produces a loud humming noise that is very distracting during lectures and exams. Students have complained about difficulty concentrating.',
    type: REPORT_TYPE.LAB,
    imageUrl: null,
    status: REPORT_STATUS.IN_PROGRESS,
    createdDaysAgo: 4,
    adminResponse: 'Maintenance team is investigating the ventilation issue. Initial assessment suggests the fan bearings may need lubrication or replacement.',
    resolvedDaysAgo: null
  },
  {
    title: 'Water Leak in Lab C201',
    description: 'There is a water leak from the ceiling in the back corner of Lab C201. It appears to be from the air conditioning drainage system. This is damaging the floor tiles and could potentially damage nearby equipment.',
    type: REPORT_TYPE.LAB,
    imageUrl: null,
    status: REPORT_STATUS.RESOLVED,
    createdDaysAgo: 15,
    adminResponse: 'The AC drainage pipe was clogged and has been cleared. Damaged floor tiles have been replaced. Regular AC maintenance has been scheduled to prevent future issues.',
    resolvedDaysAgo: 10
  },
  {
    title: 'Broken Chairs in Lab A303',
    description: 'At least 5 chairs in Lab A303 have broken wheels or loose backrests. These chairs are unsafe and uncomfortable for students during long lab sessions. Please replace or repair them.',
    type: REPORT_TYPE.LAB,
    imageUrl: null,
    status: REPORT_STATUS.OPEN,
    createdDaysAgo: 3
  },
  {
    title: 'Poor Wi-Fi Signal in Lab D401',
    description: 'The Wi-Fi signal in Lab D401 is very weak and frequently disconnects. This is affecting students\' ability to access online resources and submit assignments. Please check the Wi-Fi access point in this area.',
    type: REPORT_TYPE.LAB,
    imageUrl: null,
    status: REPORT_STATUS.IN_PROGRESS,
    createdDaysAgo: 6,
    adminResponse: 'IT team is investigating. We have identified that the Wi-Fi access point coverage is insufficient for this area. A new access point installation is being planned.',
    resolvedDaysAgo: null
  },
  {
    title: 'Dusty Environment in Lab B305',
    description: 'Lab B305 appears to not have been cleaned properly in weeks. There is visible dust on desks, keyboards, and equipment. This is unhygienic and could affect equipment performance.',
    type: REPORT_TYPE.LAB,
    imageUrl: null,
    status: REPORT_STATUS.RESOLVED,
    createdDaysAgo: 8,
    adminResponse: 'Deep cleaning has been performed in Lab B305. We have also updated the cleaning schedule to ensure all labs are thoroughly cleaned weekly.',
    resolvedDaysAgo: 6
  },

  // Equipment-related reports
  {
    title: 'Monitor Displaying Distorted Colors - Workstation A101-12',
    description: 'The monitor at workstation 12 in Lab A101 is displaying distorted colors (everything has a pink/purple tint). This makes it impossible to do any color-sensitive work like graphic design or photo editing.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.OPEN,
    createdDaysAgo: 1
  },
  {
    title: 'Keyboard Keys Not Responding - Workstation B203-08',
    description: 'Several keys on the keyboard at workstation 8 in Lab B203 are not responding (Q, W, E, R, T keys). This makes it very difficult to code or type anything. The keyboard needs to be replaced.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.RESOLVED,
    createdDaysAgo: 5,
    adminResponse: 'The faulty keyboard has been replaced with a new one. The old keyboard has been sent for disposal. Thank you for reporting.',
    resolvedDaysAgo: 3
  },
  {
    title: 'Mouse Not Working - Workstation C305-15',
    description: 'The mouse at workstation 15 in Lab C305 is completely non-responsive. I tried changing USB ports but it still does not work. Please replace it.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.RESOLVED,
    createdDaysAgo: 4,
    adminResponse: 'New mouse has been installed at this workstation.',
    resolvedDaysAgo: 2
  },
  {
    title: 'Computer Won\'t Boot - Workstation D102-05',
    description: 'The computer at workstation 5 in Lab D102 displays a "No Bootable Device" error and will not start Windows. This workstation has been unusable for several days.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.IN_PROGRESS,
    createdDaysAgo: 7,
    adminResponse: 'IT team has diagnosed a hard drive failure. We are installing a new SSD and will restore the standard lab image. Expected completion: 2 days.',
    resolvedDaysAgo: null
  },
  {
    title: 'Slow Computer Performance - Workstation A205-20',
    description: 'The computer at workstation 20 in Lab A205 is extremely slow. It takes 10+ minutes to boot and applications freeze frequently. This makes it nearly impossible to complete lab work on time.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.OPEN,
    createdDaysAgo: 2
  },
  {
    title: 'Projector Not Displaying - Lab B104',
    description: 'The projector in Lab B104 is not displaying any image. The power light is on but the screen remains black. I have checked all cables and they appear to be connected properly.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.IN_PROGRESS,
    createdDaysAgo: 3,
    adminResponse: 'Technician has inspected the projector. The lamp appears to have burned out. A replacement lamp has been ordered and should arrive within 3-5 business days.',
    resolvedDaysAgo: null
  },
  {
    title: 'Headphones Not Working - Workstation C201-11',
    description: 'The headphone jack at workstation 11 in Lab C201 produces no sound. This is problematic for multimedia and audio-related coursework. Please check the audio output.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.RESOLVED,
    createdDaysAgo: 6,
    adminResponse: 'The issue was caused by disabled audio drivers. Drivers have been reinstalled and the audio is now working properly.',
    resolvedDaysAgo: 4
  },
  {
    title: 'Cracked Monitor Screen - Workstation A303-07',
    description: 'The monitor at workstation 7 in Lab A303 has a large crack on the screen (appears to be impact damage). While it still displays, the crack is distracting and could get worse. Replacement needed.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.OPEN,
    createdDaysAgo: 1
  },
  {
    title: 'Graphics Card Issues - Workstation D401-18',
    description: 'Workstation 18 in Lab D401 shows graphical glitches and artifacts on screen. When running 3D applications or games, the system crashes with a "Display driver stopped responding" error.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.IN_PROGRESS,
    createdDaysAgo: 8,
    adminResponse: 'We have updated the graphics drivers, but the issue persists. This indicates possible hardware failure. A replacement graphics card has been requested.',
    resolvedDaysAgo: null
  },
  {
    title: 'USB Ports Not Working - Workstation B305-14',
    description: 'None of the front USB ports on workstation 14 in Lab B305 are working. Students cannot connect USB drives or other peripherals. Only the rear ports work, which are difficult to access.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.RESOLVED,
    createdDaysAgo: 12,
    adminResponse: 'The front USB panel cable was loose. It has been reconnected and all ports are now functioning normally.',
    resolvedDaysAgo: 9
  },
  {
    title: 'Printer Paper Jam - Lab A101 Printer',
    description: 'The printer in Lab A101 has a recurring paper jam issue. Every few prints, it jams and displays an error. This is causing delays when students need to print documents or reports.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.IN_PROGRESS,
    createdDaysAgo: 4,
    adminResponse: 'Maintenance has cleaned the printer rollers and replaced the paper tray. We are monitoring to see if the issue recurs.',
    resolvedDaysAgo: null
  },
  {
    title: 'Blue Screen Errors - Workstation C305-22',
    description: 'Workstation 22 in Lab C305 frequently crashes with blue screen errors (BSOD). The error codes vary but it happens multiple times per hour, making the computer unreliable for lab work.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.OPEN,
    createdDaysAgo: 5
  },
  {
    title: 'No Internet Connection - Workstation A205-03',
    description: 'Workstation 3 in Lab A205 cannot connect to the internet. The network icon shows "No Internet Access". Other workstations in the same lab are working fine, so it appears to be a problem with this specific machine.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.RESOLVED,
    createdDaysAgo: 3,
    adminResponse: 'The network adapter driver was corrupted. We have reinstalled the driver and the internet connection is now working.',
    resolvedDaysAgo: 1
  },
  {
    title: 'Missing Software - Workstation D102-25',
    description: 'Workstation 25 in Lab D102 is missing several required software packages including Visual Studio, IntelliJ IDEA, and Adobe Creative Suite. These are needed for coursework.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.IN_PROGRESS,
    createdDaysAgo: 2,
    adminResponse: 'We are installing the missing software. This workstation appears to have been reimaged recently and the software installation was incomplete. Will be resolved today.',
    resolvedDaysAgo: null
  },
  {
    title: 'Overheating Laptop - Innovation Hub Laptop #7',
    description: 'Laptop #7 from the Innovation Hub loan program gets extremely hot during use and the fan is very loud. It sometimes shuts down unexpectedly, possibly due to thermal protection.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.OPEN,
    createdDaysAgo: 6
  },
  {
    title: 'Webcam Not Detected - Workstation B203-16',
    description: 'The webcam on workstation 16 in Lab B203 is not being detected by the system. This is needed for online meetings and video conferencing assignments. Device Manager shows no webcam device.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.RESOLVED,
    createdDaysAgo: 9,
    adminResponse: 'The webcam USB cable was disconnected internally. We have opened the case and reconnected it. The webcam is now working properly.',
    resolvedDaysAgo: 7
  },
  {
    title: 'Scanner Not Scanning - Lab C201 All-in-One Printer',
    description: 'The scanner function on the all-in-one printer in Lab C201 is not working. When trying to scan, it displays "Scanner Error" or "Scanner Busy". The print function works fine.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.OPEN,
    createdDaysAgo: 4
  },
  {
    title: 'VR Headset Controllers Not Pairing - Game Dev Studio',
    description: 'The controllers for Oculus Quest 3 headset #2 in the Game Dev Studio will not pair with the headset. Students cannot use this VR equipment for their game development projects.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.IN_PROGRESS,
    createdDaysAgo: 3,
    adminResponse: 'Controllers have been reset and batteries replaced. We are attempting to re-pair them. If unsuccessful, we may need to request warranty replacement.',
    resolvedDaysAgo: null
  },
  {
    title: 'Microphone Static Noise - Recording Studio Equipment',
    description: 'The Blue Yeti microphone in the Recording Studio produces constant static noise in recordings. This makes it unsuitable for podcast or voice-over projects. The mic may need cleaning or replacement.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.RESOLVED,
    createdDaysAgo: 11,
    adminResponse: 'The issue was caused by a faulty USB cable. The cable has been replaced and the microphone now records clearly without any static.',
    resolvedDaysAgo: 8
  },
  {
    title: '3D Printer Nozzle Clogged - Innovation Hub',
    description: 'The Creality 3D printer in the Innovation Hub has a clogged nozzle. Print jobs fail partway through and the filament is not extruding properly. The printer needs maintenance.',
    type: REPORT_TYPE.EQUIPMENT,
    imageUrl: null,
    status: REPORT_STATUS.IN_PROGRESS,
    createdDaysAgo: 5,
    adminResponse: 'The nozzle has been removed and is being cleaned. We are also performing general maintenance on the printer. Expected downtime: 1-2 days.',
    resolvedDaysAgo: null
  }
];

module.exports = {
  REPORTS_DATA,
  REPORT_TYPE,
  REPORT_STATUS
};
