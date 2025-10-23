/**
 * Rooms and Equipment Data for FPTU Lab Events
 */

// Equipment type mapping
const EQUIPMENT_TYPES = {
  COMPUTER: 0,
  PROJECTOR: 1,
  PRINTER: 2,
  SCANNER: 3,
  WHITEBOARD: 4,
  OTHER: 5
};

// Room status mapping
const ROOM_STATUS = {
  AVAILABLE: 0,
  OCCUPIED: 1,
  MAINTENANCE: 2
};

const ROOMS_DATA = [
  {
    name: 'Computer Lab Alpha',
    description: 'High-performance computing lab with 45 workstations, dual monitors, and latest development tools',
    location: 'Building A - Floor 2 - Room A201',
    capacity: 45,
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800'
  },
  {
    name: 'Computer Lab Beta',
    description: 'Advanced programming lab with 40 workstations, specialized for software engineering courses',
    location: 'Building A - Floor 2 - Room A202',
    capacity: 40,
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800'
  },
  {
    name: 'Computer Lab Gamma',
    description: 'Data science and analytics lab with 35 high-spec machines and GPU acceleration',
    location: 'Building A - Floor 3 - Room A301',
    capacity: 35,
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800'
  },
  {
    name: 'Multimedia Studio',
    description: 'Creative studio with video editing workstations, audio equipment, and green screen',
    location: 'Building B - Floor 1 - Room B101',
    capacity: 20,
    imageUrl: 'https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=800'
  },
  {
    name: 'Network Lab',
    description: 'Networking laboratory with Cisco equipment, servers, and network simulation tools',
    location: 'Building A - Floor 1 - Room A101',
    capacity: 25,
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800'
  },
  {
    name: 'Innovation Hub',
    description: 'Collaborative workspace for hackathons, group projects, and innovation activities',
    location: 'Building C - Floor 3 - Room C301',
    capacity: 50,
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'
  },
  {
    name: 'AI Research Lab',
    description: 'Specialized AI/ML lab with GPU clusters, deep learning frameworks, and research tools',
    location: 'Building B - Floor 4 - Room B401',
    capacity: 30,
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800'
  },
  {
    name: 'Mobile Dev Lab',
    description: 'Mobile application development lab with iOS and Android devices for testing',
    location: 'Building B - Floor 2 - Room B201',
    capacity: 28,
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800'
  },
  {
    name: 'Game Dev Studio',
    description: 'Game development studio with VR equipment, gaming PCs, and motion capture',
    location: 'Building C - Floor 2 - Room C201',
    capacity: 24,
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800'
  },
  {
    name: 'Cloud Computing Lab',
    description: 'Cloud infrastructure lab with access to AWS, Azure, GCP, and containerization tools',
    location: 'Building A - Floor 4 - Room A401',
    capacity: 32,
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800'
  },
  {
    name: 'Cybersecurity Lab',
    description: 'Secure environment for ethical hacking, penetration testing, and security research',
    location: 'Building C - Floor 1 - Room C101',
    capacity: 22,
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800'
  },
  {
    name: 'IoT Workshop',
    description: 'Internet of Things lab with Arduino, Raspberry Pi, sensors, and embedded systems',
    location: 'Building B - Floor 3 - Room B301',
    capacity: 26,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800'
  }
];

// Function to generate equipment data based on room IDs
function generateEquipmentData(roomIds) {
  const equipment = [];
  
  if (!roomIds || roomIds.length === 0) {
    console.warn('⚠️  No room IDs provided for equipment generation');
    return equipment;
  }

  // Computer Labs (first 3 rooms) - Desktop Computers
  const computerLabRooms = roomIds.slice(0, 3);
  const computerCounts = [45, 40, 35];
  
  computerLabRooms.forEach((roomId, labIndex) => {
    const labName = ['Alpha', 'Beta', 'Gamma'][labIndex];
    const computerCount = computerCounts[labIndex];
    
    for (let i = 1; i <= computerCount; i++) {
      equipment.push({
        name: `Desktop PC ${labName}-${String(i).padStart(2, '0')}`,
        description: `Dell OptiPlex 7090 - Intel i7-11700, 32GB RAM, 1TB NVMe SSD, RTX 3060`,
        serialNumber: `PC-${labName.toUpperCase()}-${String(i).padStart(3, '0')}`,
        type: EQUIPMENT_TYPES.COMPUTER,
        imageUrl: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400',
        roomId: roomId
      });
    }

    // Projectors for computer labs
    equipment.push({
      name: `Projector ${labName}`,
      description: `Epson EB-2250U - 5000 Lumens, WUXGA, Wireless`,
      serialNumber: `PROJ-${labName.toUpperCase()}-001`,
      type: EQUIPMENT_TYPES.PROJECTOR,
      imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400',
      roomId: roomId
    });

    // Whiteboards
    equipment.push({
      name: `Interactive Whiteboard ${labName}`,
      description: `Smart Board MX Series - 75" 4K Interactive Display`,
      serialNumber: `WB-${labName.toUpperCase()}-001`,
      type: EQUIPMENT_TYPES.WHITEBOARD,
      imageUrl: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=400',
      roomId: roomId
    });
  });

  // Multimedia Studio (room 4)
  if (roomIds[3]) {
    for (let i = 1; i <= 20; i++) {
      equipment.push({
        name: `Multimedia Workstation ${String(i).padStart(2, '0')}`,
        description: `iMac Pro - 27" 5K, Intel Xeon W, 64GB RAM, Radeon Pro Vega 64`,
        serialNumber: `MM-WS-${String(i).padStart(3, '0')}`,
        type: EQUIPMENT_TYPES.COMPUTER,
        imageUrl: 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?w=400',
        roomId: roomIds[3]
      });
    }

    equipment.push({
      name: 'Professional Camera Kit',
      description: 'Sony A7S III with lenses and accessories',
      serialNumber: 'CAM-MM-001',
      type: EQUIPMENT_TYPES.OTHER,
      imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400',
      roomId: roomIds[3]
    });

    equipment.push({
      name: '4K Video Projector',
      description: 'Sony VPL-VW325ES - 4K HDR, 1500 Lumens',
      serialNumber: 'PROJ-MM-001',
      type: EQUIPMENT_TYPES.PROJECTOR,
      imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400',
      roomId: roomIds[3]
    });
  }

  // Network Lab (room 5)
  if (roomIds[4]) {
    for (let i = 1; i <= 25; i++) {
      equipment.push({
        name: `Network Workstation ${String(i).padStart(2, '0')}`,
        description: `HP EliteDesk 800 G8 - Intel i5-11500, 16GB RAM, 512GB SSD`,
        serialNumber: `NET-WS-${String(i).padStart(3, '0')}`,
        type: EQUIPMENT_TYPES.COMPUTER,
        imageUrl: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400',
        roomId: roomIds[4]
      });
    }

    equipment.push({
      name: 'Cisco Router Rack',
      description: 'Cisco ISR 4000 Series Routers (x10)',
      serialNumber: 'NET-ROUTER-001',
      type: EQUIPMENT_TYPES.OTHER,
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
      roomId: roomIds[4]
    });

    equipment.push({
      name: 'Network Switch Rack',
      description: 'Cisco Catalyst 9300 Series Switches (x8)',
      serialNumber: 'NET-SWITCH-001',
      type: EQUIPMENT_TYPES.OTHER,
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
      roomId: roomIds[4]
    });
  }

  // Innovation Hub (room 6)
  if (roomIds[5]) {
    for (let i = 1; i <= 30; i++) {
      equipment.push({
        name: `Collaboration Laptop ${String(i).padStart(2, '0')}`,
        description: `Dell XPS 15 - Intel i7-11800H, 16GB RAM, 512GB SSD`,
        serialNumber: `HUB-LAP-${String(i).padStart(3, '0')}`,
        type: EQUIPMENT_TYPES.COMPUTER,
        imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
        roomId: roomIds[5]
      });
    }

    equipment.push({
      name: 'Large Format Display',
      description: 'Samsung The Wall - 146" MicroLED Display',
      serialNumber: 'HUB-DISPLAY-001',
      type: EQUIPMENT_TYPES.OTHER,
      imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400',
      roomId: roomIds[5]
    });

    equipment.push({
      name: '3D Printer',
      description: 'Ultimaker S5 Pro Bundle - Dual Extrusion',
      serialNumber: 'HUB-3DP-001',
      type: EQUIPMENT_TYPES.OTHER,
      imageUrl: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=400',
      roomId: roomIds[5]
    });
  }

  // AI Research Lab (room 7)
  if (roomIds[6]) {
    for (let i = 1; i <= 30; i++) {
      equipment.push({
        name: `AI Workstation ${String(i).padStart(2, '0')}`,
        description: `Custom Build - AMD Threadripper 3990X, 128GB RAM, RTX 4090, 2TB NVMe`,
        serialNumber: `AI-WS-${String(i).padStart(3, '0')}`,
        type: EQUIPMENT_TYPES.COMPUTER,
        imageUrl: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400',
        roomId: roomIds[6]
      });
    }

    equipment.push({
      name: 'GPU Cluster Server',
      description: 'NVIDIA DGX A100 - 8x A100 GPUs, 640GB GPU Memory',
      serialNumber: 'AI-GPU-001',
      type: EQUIPMENT_TYPES.OTHER,
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
      roomId: roomIds[6]
    });
  }

  return equipment;
}

module.exports = {
  ROOMS_DATA,
  generateEquipmentData,
  EQUIPMENT_TYPES,
  ROOM_STATUS
};

