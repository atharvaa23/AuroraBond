import type { Movie, StoryEvent, PageKey, DashboardCard, ThemeKey } from "../types";

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

// ─── Theme Options ─────────────────────────────────────────────────────────

export const THEME_OPTIONS = [
  {
    key: "aurora",
    label: "Aurora",
    desc: "Soft blue, purple, and pink glow with petals.",
  },
  {
    key: "moonlight",
    label: "Moonlight",
    desc: "Dark night, silver moon, stars, and calm glow.",
  },
  {
    key: "breeze",
    label: "Breeze",
    desc: "Airy cyan, soft clouds, and floating wind streaks.",
  },
  {
    key: "ocean",
    label: "Ocean",
    desc: "Deep blue, cyan calm, waves, and bubbles.",
  },
  {
    key: "rose",
    label: "Rose",
    desc: "Warm pink, romantic blush, and soft hearts.",
  },
  {
    key: "cosmic",
    label: "Cosmic",
    desc: "Dark violet, galaxy purple, and star dust.",
  },
  {
    key: "forest",
    label: "Forest",
    desc: "Emerald green, soft night, and firefly glow.",
  },
  {
    key: "sunset",
    label: "Sunset",
    desc: "Orange, rose, and warm evening glow.",
  },
] satisfies Array<{
  key: ThemeKey;
  label: string;
  desc: string;
}>;

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
  {
    page: "memories",
    icon: "💌",
    tag: "MEMORY JAR",
    title: "Memory Jar",
    desc: "Save tiny moments, inside jokes, and soft memories that belong only to you two.",
  },
  {
    page: "bucket",
    icon: "🪣",
    tag: "DREAMS",
    title: "Bucket List",
    desc: "Plan everything you both want to do together, one little dream at a time.",
  },
] satisfies DashboardCard[];

// ─── Footer Quotes ─────────────────────────────────────────────────────────

export const FOOTER_QUOTES = [
  "Some bonds do not need distance to prove they are real.",
  "Love is not always loud. Sometimes it is a saved message, a remembered date, and a tiny goodnight.",
  "Two people, one little universe, and a thousand soft moments in between.",
  "Every day apart is still a day you are choosing each other.",
  "The sweetest love stories are built in tiny details.",
] as const;

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