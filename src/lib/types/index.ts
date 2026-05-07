import type { Timestamp } from "firebase/firestore";

// ─── Core Entity Types ─────────────────────────────────────────────────────

export interface User {
  uid?: string;
  name: string;
  nickname: string;
  avatar: string;
  code: string;

  email?: string;
  bondId?: string;

  // Kept for compatibility, but real online/typing status should use:
  // bonds/{bondId}/presence/{uid}
  online?: boolean;
  lastSeen?: Timestamp | null;

  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Partner {
  uid?: string;
  name: string;
  nickname: string;
  avatar: string;
  code: string;

  email?: string;
  bondId?: string;

  // Kept for compatibility, but real online/typing status should use:
  // bonds/{bondId}/presence/{uid}
  online?: boolean;
  lastSeen?: Timestamp | null;

  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface BondMood {
  emoji: string;
  label: string;
}

export interface Bond {
  user1Uid?: string;
  user2Uid?: string | null;
  code?: string;

  reunionDate?: string;
  quote1?: string;
  quote2?: string;

  theme?: ThemeKey;

  nicknames?: Record<string, string>;
  weatherCities?: Record<string, string>;
  currentMoods?: Record<string, BondMood>;
}

export interface Presence {
  isOnline?: boolean;
  typing?: boolean;
  lastSeen?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  createdAt?: Timestamp | null;
}

export interface Movie {
  id: string;
  title: string;
  year: number;
  genre: string;
  emoji: string;
  watched: boolean;
  rating: number;
  createdAt?: Timestamp | null;
}

export interface StoryEvent {
  id: string;
  date: string;
  emoji: string;
  title: string;
  desc: string;
  createdAt?: Timestamp | null;
}

export interface WeatherData {
  icon: string;
  desc: string;
  temp: number;
  humidity: number;
  wind: number;
}

export interface GameCounter {
  id: string;
  title: string;
  scores: Record<string, number>;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface MusicLink {
  id: string;
  title: string;
  url: string;
  type: string;
  note?: string;
  addedBy: string;
  createdAt?: Timestamp | null;
}

export interface MemoryItem {
  id: string;
  text: string;
  createdBy: string;
  authorName: string;
  authorAvatar: string;
  createdAt?: Timestamp | null;
}

export interface BucketItem {
  id: string;
  text: string;
  done: boolean;
  createdBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

// ─── Page / Navigation Types ───────────────────────────────────────────────

export type PageKey =
  | "landing"
  | "login"
  | "dashboard"
  | "weather"
  | "movies"
  | "chat"
  | "games"
  | "music"
  | "story"
  | "settings"
  | "memories"
  | "bucket";

export type NavigateMode = "push" | "replace";

export type ThemeKey =
  | "aurora"
  | "moonlight"
  | "breeze"
  | "ocean"
  | "rose"
  | "cosmic"
  | "forest"
  | "sunset";

export interface DashboardCard {
  page: PageKey;
  icon: string;
  tag: string;
  title: string;
  desc: string;
}

// ─── Shared Prop Interfaces ────────────────────────────────────────────────

export interface NavigationProps {
  setPage: (page: PageKey, mode?: NavigateMode) => void;
}

export interface AuthProps {
  user: User | null;
  partner: Partner | null;
}