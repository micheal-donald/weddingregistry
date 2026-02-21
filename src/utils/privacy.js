const EMOJIS = [
  '✨', '🌸', '🦋', '💝', '🌟', '🕊️', '🌿', '🎀', '🌈', '🍓',
  '🍀', '💎', '🌙', '☀️', '🌻', '🍃', '🥂', '💍', '🧸', '🍭',
  '🧁', '🍪', '🍩', '🍫', '🍯', '🥞', '🎈', '🎨', '🧩', '🚀',
  '🐱', '🐶', '🦊', '🐼', '🐨', '🐝', '🐧', '🦉', '🦄'
];

export function formatGuestName(name) {
  if (!name) return 'Someone special';
  const trimmed = name.trim();
  if (!trimmed) return 'Someone special';

  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = ((hash << 5) - hash) + trimmed.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);

  const firstLetter = trimmed.charAt(0).toUpperCase();
  const emoji = EMOJIS[hash % EMOJIS.length];

  return `${firstLetter}. ${emoji}`;
}
