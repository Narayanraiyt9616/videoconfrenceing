export const AVATAR_OPTIONS = [
  { emoji: '🔥', label: 'Firestarter' },
  { emoji: '💀', label: 'Dead Inside' },
  { emoji: '🤡', label: 'Clown King' },
  { emoji: '😈', label: 'Drama Master' },
  { emoji: '🍿', label: 'Popcorn Gang' },
  { emoji: '🌶️', label: 'Mirchi' },
  { emoji: '👑', label: 'Raja Babu' },
  { emoji: '🍕', label: 'Late Eater' },
  { emoji: '🚀', label: 'Rocket Raja' },
  { emoji: '🎭', label: 'Drama Queen' },
  { emoji: '👻', label: 'Ghoster' },
  { emoji: '🐱', label: 'Billi' },
  { emoji: '🦁', label: 'Sher' },
  { emoji: '💣', label: 'Kaleshi Bomb' }
];

export function getRandomAvatar() {
  return AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)].emoji;
}
