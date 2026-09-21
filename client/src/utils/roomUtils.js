/**
 * Room Code Utilities & Normalization
 * Standard format: KAL-XXXX (e.g. KAL-8X92)
 */

export function normalizeRoomCode(input) {
  if (!input || typeof input !== 'string') return '';
  let clean = input.trim().toUpperCase();

  // If a full URL was pasted (e.g. https://videoconfrenceing.vercel.app/join/KAL-8X92 or /room/KAL-8X92)
  const urlMatch = clean.match(/(?:JOIN|ROOM)\/([A-Z0-9-]+)/i) || clean.match(/(?:JOIN|ROOM|CODE)=([A-Z0-9-]+)/i);
  if (urlMatch && urlMatch[1]) {
    clean = urlMatch[1].trim().toUpperCase();
  }

  // Remove any query params or hash remnants if still attached
  clean = clean.split(/[?#&]/)[0];

  // Remove non-alphanumerics except hyphen
  clean = clean.replace(/[^A-Z0-9-]/g, '');

  // If user typed 7 characters without hyphen (e.g. "KAL8X92")
  if (/^KAL[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/i.test(clean)) {
    clean = `KAL-${clean.slice(3)}`;
  }
  // If user typed only the 4-character suffix (e.g. "8X92")
  else if (/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/i.test(clean)) {
    clean = `KAL-${clean}`;
  }

  return clean;
}

export function isValidRoomCode(input) {
  const normalized = normalizeRoomCode(input);
  return /^KAL-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/i.test(normalized);
}
