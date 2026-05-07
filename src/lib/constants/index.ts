import type { Movie, StoryEvent, PageKey } from "../types";

// ─── Avatar Options ────────────────────────────────────────────────────────

export const AVATARS = [
  "💜",
  "🌸",
  "🌙",
  "⭐",
  "🦋",
  "🌺",
  "💫",
  "🌻",
  "🍀",
  "🌈",
  "☁️",
  "🔮",
  "🌊",
  "🦄",
] as const;

// ─── Default Seed Data ─────────────────────────────────────────────────────
// Keep these only if MovieVaultPage / OurStoryPage still use fallback data.

export const DEFAULT_MOVIES: Movie[] = [
  {
    id: "1",
    title: "Amelie",
    year: 2001,
    genre: "Romance",
    emoji: "🎭",
    watched: true,
    rating: 5,
  },
  {
    id: "2",
    title: "La La Land",
    year: 2016,
    genre: "Musical",
    emoji: "🎸",
    watched: true,
    rating: 5,
  },
  {
    id: "3",
    title: "Your Name",
    year: 2016,
    genre: "Anime",
    emoji: "✨",
    watched: false,
    rating: 0,
  },
  {
    id: "4",
    title: "The Notebook",
    year: 2004,
    genre: "Romance",
    emoji: "📓",
    watched: false,
    rating: 0,
  },
];

export const DEFAULT_STORY: StoryEvent[] = [
  {
    id: "1",
    date: "2022-03-14",
    emoji: "💫",
    title: "The Day We Met",
    desc: "Eyes met across a crowded room. The world paused for just a moment.",
  },
  {
    id: "2",
    date: "2022-04-01",
    emoji: "🌸",
    title: "First Date",
    desc: "A sunset walk. Nervous laughs. Time stood perfectly still.",
  },
  {
    id: "3",
    date: "2022-06-15",
    emoji: "💜",
    title: "First 'I Love You'",
    desc: "Three words that changed everything.",
  },
  {
    id: "4",
    date: "2023-01-01",
    emoji: "🌙",
    title: "New Year Together",
    desc: "Counting down in each other's arms. The best start to a year.",
  },
];

// ─── Navigation Definitions ────────────────────────────────────────────────

export const NAV_LINKS = [
  { label: "Home", page: "dashboard" },
  { label: "Our Story", page: "story" },
  { label: "Chat", page: "chat" },
] satisfies Array<{
  label: string;
  page: PageKey;
}>;

export const DASHBOARD_CARDS = [
  {
    page: "weather",
    icon: "🌤",
    tag: "LIVE",
    title: "Weather",
    desc: "See each other's skies. Feel the distance through shared weather.",
  },
  {
    page: "movies",
    icon: "🎬",
    tag: "TOGETHER",
    title: "Movie Vault",
    desc: "Your watchlist, your memories, your cinematic journey.",
  },
  {
    page: "chat",
    icon: "💬",
    tag: "ALWAYS",
    title: "Chat",
    desc: "Soft messages, floating thoughts, words that feel like a hug.",
  },
  {
    page: "story",
    icon: "📖",
    tag: "FOREVER",
    title: "Our Story",
    desc: "Every chapter of your love story, beautifully preserved.",
  },
  {
    page: "games",
    icon: "🎮",
    tag: "TALLY",
    title: "Game Scores",
    desc: "Keep score of every tiny competition between you two.",
  },
  {
    page: "music",
    icon: "🎧",
    tag: "SOUNDTRACK",
    title: "Music",
    desc: "Save playlists, Spotify jams, and songs that feel like you two.",
  },
] satisfies Array<{
  page: PageKey;
  icon: string;
  tag: string;
  title: string;
  desc: string;
}>;

// ─── Petal Animation Data ──────────────────────────────────────────────────

export const PETAL_SHAPES = [
  "M0,-20 Q8,-10 0,0 Q-8,-10 0,-20",
  "M0,-18 Q10,-8 5,2 Q0,8 -5,2 Q-10,-8 0,-18",
  "M0,-22 Q12,-14 8,0 Q4,10 0,4 Q-4,10 -8,0 Q-12,-14 0,-22",
  "M0,-16 C6,-12 10,-4 8,4 C6,10 -6,10 -8,4 C-10,-4 -6,-12 0,-16",
] as const;

export const PETAL_COLORS = [
  "rgba(251,113,133,0.55)",
  "rgba(240,171,252,0.5)",
  "rgba(192,132,252,0.45)",
  "rgba(254,205,211,0.4)",
  "rgba(216,180,254,0.45)",
  "rgba(249,168,212,0.5)",
] as const;