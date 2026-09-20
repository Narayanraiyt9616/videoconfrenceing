/**
 * Unique Room Code Generator
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

export function isValidRoomCode(code) {
  if (!code || typeof code !== 'string') return false;
  return /^KAL-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/i.test(code.trim());
}
