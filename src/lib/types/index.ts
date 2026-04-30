// ─── Core Entity Types ─────────────────────────────────────────────────────

export interface User {
  name: string;
  nickname: string;
  avatar: string;
  code: string;
}

export interface Partner {
  name: string;
  nickname: string;
  avatar: string;
  code: string;
}

export interface Movie {
  id: number;
  title: string;
  year: number;
  genre: string;
  emoji: string;
  watched: boolean;
  rating: number;
}

export interface StoryEvent {
  id: number;
  date: string;
  emoji: string;
  title: string;
  desc: string;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  createdAt?: any;
}

export interface WeatherData {
  icon: string;
  desc: string;
  temp: number;
  humidity: number;
  wind: number;
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
  | "settings";

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