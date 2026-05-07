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
  | "settings";

export type NavigateMode = "push" | "replace";

// ─── Shared Prop Interfaces ────────────────────────────────────────────────

export interface NavigationProps {
  setPage: (page: PageKey, mode?: NavigateMode) => void;
}

export interface AuthProps {
  user: User | null;
  partner: Partner | null;
}