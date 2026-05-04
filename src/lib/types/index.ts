// ─── Core Entity Types ─────────────────────────────────────────────────────
import type { Timestamp } from "firebase/firestore";
export interface User {
  uid?: string;
  name: string;
  nickname: string;
  avatar: string;
  code: string;

  email?: string;
  bondId?: string;

  online?: boolean;
  lastSeen?: Timestamp | null;
  createdAt?: Timestamp | null;
}

export interface Partner {
  uid?: string;
  name: string;
  nickname: string;
  avatar: string;
  code: string;

  email?: string;
  bondId?: string;

  online?: boolean;
  lastSeen?: Timestamp | null;
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
  createdAt?: any;
}

export interface StoryEvent {
  id: string;
  date: string;
  emoji: string;
  title: string;
  desc: string;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  createdAt?: Timestamp | null;
}

export interface WeatherData {
  icon: string;
  desc: string;
  temp: number;
  humidity: number;
  wind: number;
}
export interface Bond {
  user1Uid?: string;
  user2Uid?: string | null;
  reunionDate?: string;
  quote1?: string;
  quote2?: string;
  nicknames?: Record<string, string>;
  weatherCities?: Record<string, string>;
  currentMoods?: Record<
    string,
    {
      emoji: string;
      label: string;
    }
  >;
}

// ─── Page / Navigation Types ───────────────────────────────────────────────

export type PageKey =
  | "landing"
  | "login"
  | "dashboard"
  | "weather"
  | "movies"
  | "chat"
  | "story"
  | "settings"
  | "games";

// ─── App State (top-level shape) ───────────────────────────────────────────

export interface AppState {
  page: PageKey;
  user: User | null;
  partner: Partner | null;
  reunionDate: string;
}

// ─── Shared Prop Interfaces ────────────────────────────────────────────────

export interface NavigationProps {
  setPage: (page: PageKey) => void;
}

export interface AuthProps {
  user: User | null;
  partner: Partner | null;
}

export interface FullAuthProps extends AuthProps {
  setUser: (user: User | null) => void;
  setPartner: (partner: Partner | null) => void;
}