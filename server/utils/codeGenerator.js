/**
 * Unique Room Code Generator & Normalizer
 * Format: KAL-XXXX (e.g. KAL-8X92)
 */

import { roomStore } from '../memory/roomStore.js';

const CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // no 0/O/1/I to prevent ambiguity

export function generateRoomCode() {
  let code = '';
  let attempts = 0;

  do {
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    code = `KAL-${randomPart}`;
    attempts++;
  } while (roomStore.hasRoom(code) && attempts < 100);

  return code;
}

export function normalizeRoomCode(input) {
  if (!input || typeof input !== 'string') return '';
  let clean = input.trim().toUpperCase();

  // If a full URL was passed (e.g. https://domain.com/join/KAL-8X92 or /room/KAL-8X92)
  const urlMatch = clean.match(/(?:JOIN|ROOM)\/([A-Z0-9-]+)/i) || clean.match(/(?:JOIN|ROOM|CODE)=([A-Z0-9-]+)/i);
  if (urlMatch && urlMatch[1]) {
    clean = urlMatch[1].trim().toUpperCase();
  }

  // Remove query params or hash
  clean = clean.split(/[?#&]/)[0];

  // Remove non-alphanumerics except hyphen
  clean = clean.replace(/[^A-Z0-9-]/g, '');

  // If user typed without hyphen: e.g. "KAL8X92"
  if (/^KAL[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/i.test(clean)) {
    clean = `KAL-${clean.slice(3)}`;
  }
  // If user typed only the 4-character suffix: e.g. "8X92"
  else if (/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/i.test(clean)) {
    clean = `KAL-${clean}`;
  }

  return clean;
}

export function isValidRoomCode(code) {
  const normalized = normalizeRoomCode(code);
  return /^KAL-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/i.test(normalized);
}
