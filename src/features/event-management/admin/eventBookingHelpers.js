export const BOOKING_MODES = {
  LAB: 'lab',
  ROOM: 'room'
};

export const DEFAULT_BOOKING_MODE = BOOKING_MODES.ROOM;

export const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.Data)) return data.Data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const toDateTimeLocal = (date) => {
  if (!date || Number.isNaN(date.getTime())) return '';
  const pad = (num) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const parseDateTimeLocal = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const startOfDay = (date) => {
  if (!date) return null;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date) => {
  if (!date) return null;
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const combineDateAndTime = (date, timeString) => {
  if (!date || !timeString) return null;
  const [hours, minutes, seconds] = timeString.split(':').map((part) => Number(part));
  const combined = new Date(date);
  combined.setHours(hours || 0, minutes || 0, seconds || 0, 0);
  return combined;
};

export const formatDateDisplay = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const formatTimeDisplay = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const normalizeLab = (lab) => ({
  id: lab?.id ?? lab?.Id ?? '',
  name: lab?.name ?? lab?.Name ?? 'Unnamed Lab',
  location: lab?.location ?? lab?.Location ?? '',
  status: lab?.status ?? lab?.Status ?? 0
});

export const normalizeRoom = (room) => ({
  id: room?.id ?? room?.Id ?? '',
  name: room?.name ?? room?.Name ?? 'Unnamed Room',
  capacity: room?.capacity ?? room?.Capacity ?? 0,
  status: room?.status ?? room?.Status ?? 'Unknown'
});

export const normalizeSlot = (slot) => {
  const id = slot?.id ?? slot?.Id ?? '';
  const dateRaw = slot?.date ?? slot?.Date ?? null;
  const startTimeRaw = slot?.startTime ?? slot?.StartTime ?? null;
  const endTimeRaw = slot?.endTime ?? slot?.EndTime ?? null;
  const timeRange = slot?.timeRange ?? slot?.TimeRange ?? '';
  const eventId = slot?.eventId ?? slot?.EventId ?? null;
  const roomId = slot?.roomId ?? slot?.RoomId ?? slot?.room?.id ?? slot?.Room?.Id ?? null;
  const roomName = slot?.roomName ?? slot?.RoomName ?? slot?.room?.name ?? slot?.Room?.Name ?? '';
  const dayOfWeek = slot?.dayOfWeek ?? slot?.DayOfWeek ?? null;
  const dayOfWeekName = slot?.dayOfWeekName ?? slot?.DayOfWeekName ?? '';
  const slotNumber = slot?.slotNumber ?? slot?.SlotNumber ?? null;

  const dateObj = dateRaw ? new Date(dateRaw) : null;
  const startDateTime = dateObj ? combineDateAndTime(dateObj, startTimeRaw) : null;
  const endDateTime = dateObj ? combineDateAndTime(dateObj, endTimeRaw) : null;

  return {
    id,
    date: dateObj,
    dateFormatted: slot?.dateFormatted ?? slot?.DateFormatted ?? (dateObj ? formatDateDisplay(dateObj) : ''),
    timeRange,
    startDateTime,
    endDateTime,
    eventId,
    roomId,
    roomName,
    dayOfWeek,
    dayOfWeekName,
    slotNumber,
    raw: slot
  };
};

export const groupSlotsByRoom = (slots) => {
  const map = new Map();
  slots.forEach((slot) => {
    const roomId = slot.roomId || 'unknown-room';
    const roomName = slot.roomName || 'Room';
    if (!map.has(roomId)) {
      map.set(roomId, {
        roomId,
        roomName,
        slots: []
      });
    }
    map.get(roomId).slots.push(slot);
  });

  return Array.from(map.values());
};

