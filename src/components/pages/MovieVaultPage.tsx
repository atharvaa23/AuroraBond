"use client";

import { useState } from "react";
import type { Movie } from "../../lib/types";
import { DEFAULT_MOVIES } from "../../lib/constants";
import { useStorage } from "../../lib/hooks";
import { PetalCanvas } from "../ui/PetalCanvas";

const MOVIE_CSS = `
  .movie-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
  .movie-card {
    background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-md);
    overflow: hidden; cursor: pointer; transition: all 0.3s; backdrop-filter: blur(20px);
  }
  .movie-card:hover { transform: translateY(-4px); border-color: var(--border-glow); }
  .movie-poster { height: 120px; display: flex; align-items: center; justify-content: center; font-size: 48px; background: rgba(255,255,255,0.03); }
  .movie-info { padding: 16px; }
  .movie-title { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
  .movie-meta { font-size: 12px; color: var(--muted); margin-bottom: 8px; }
  .movie-status { font-size: 11px; letter-spacing: 1px; }
  .movie-status.watched { color: #86efac; }
  .movie-status.pending { color: var(--aurora1); }
`;

interface AddMovieModalProps {
  onAdd: (movie: Omit<Movie, "id" | "watched" | "rating">) => void;
  onClose: () => void;
}

function AddMovieModal({ onAdd, onClose }: AddMovieModalProps) {
  const [form, setForm] = useState({
    title: "",
    year: new Date().getFullYear(),
    genre: "Romance",
    emoji: "🎬",
  });

  const handleAdd = () => {
    if (!form.title.trim()) return;
    onAdd(form);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Add a Movie</div>

        {(
          [
            { label: "Title",  key: "title", type: "text",   ph: "Movie title…" },
            { label: "Year",   key: "year",  type: "number", ph: ""             },
            { label: "Genre",  key: "genre", type: "text",   ph: "Romance, Comedy…" },
            { label: "Emoji",  key: "emoji", type: "text",   ph: "🎬"           },
          ] as const
        ).map(({ label, key, type, ph }) => (
          <div className="input-wrap" key={key}>
            <label className="input-label">{label}</label>
            <input
              className="input-field"
              type={type}
              placeholder={ph}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary btn-confirm" onClick={handleAdd}>Add to Vault</button>
        </div>
      </div>
    </div>
  );
}

interface MovieCardProps {
  movie: Movie;
  onToggleWatched: (id: number) => void;
  onSetRating: (id: number, rating: number) => void;
  onRemove: (id: number) => void;
}

function MovieCardComponent({ movie, onToggleWatched, onSetRating, onRemove }: MovieCardProps) {
  return (
    <div className="movie-card" onClick={() => !movie.watched && onToggleWatched(movie.id)}>
      <div className="movie-poster">{movie.emoji}</div>
      <div className="movie-info">
        <div className="movie-title">{movie.title}</div>
        <div className="movie-meta">{movie.year} · {movie.genre}</div>

        {movie.watched && (
          <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className="star"
                style={{ opacity: s <= movie.rating ? 1 : 0.3 }}
                onClick={(e) => { e.stopPropagation(); onSetRating(movie.id, s); }}
              >
                ★
              </span>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {movie.watched ? (
            <div className="movie-status watched">✓ Watched</div>
          ) : (
            <div className="movie-status pending">♡ Pending — click to mark watched</div>
          )}
          <span
            style={{ cursor: "pointer", fontSize: 11, color: "var(--muted)", textDecoration: "underline" }}
            onClick={(e) => { e.stopPropagation(); onRemove(movie.id); }}
          >
            remove
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * MovieVaultPage
 * ──────────────
 * Owns: movie list state, add/remove/rate/toggle logic.
 * Does NOT own: user identity (anonymous vault), navigation.
 *
 * Firebase-ready: swap useStorage for a Firestore collection keyed to bond ID.
 * Ratings + watched status sync in real-time for both partners.
 */
export function MovieVaultPage() {
  const [movies, setMovies] = useStorage<Movie[]>("ab_movies", DEFAULT_MOVIES);
  const [showAdd, setShowAdd] = useState(false);

  const addMovie = (data: Omit<Movie, "id" | "watched" | "rating">) => {
    setMovies([...movies, { ...data, id: Date.now(), watched: false, rating: 0 }]);
    setShowAdd(false);
  };
  const toggleWatched = (id: number) =>
    setMovies(movies.map((m) => (m.id === id ? { ...m, watched: !m.watched } : m)));
  const setRating = (id: number, rating: number) =>
    setMovies(movies.map((m) => (m.id === id ? { ...m, rating } : m)));
  const removeMovie = (id: number) =>
    setMovies(movies.filter((m) => m.id !== id));

  const watched = movies.filter((m) => m.watched);
  const pending = movies.filter((m) => !m.watched);

  return (
    <>
      <style>{MOVIE_CSS}</style>
      <div className="page">
        <div className="aurora-bg" />
        <PetalCanvas />

        <div className="inner-wrap" style={{ maxWidth: 1000 }}>
          <div className="page-title">Movie <span>Vault</span></div>
          <div className="page-sub">Your shared cinematic universe — one film at a time.</div>

          <button className="add-btn" onClick={() => setShowAdd(true)}>+ Add Movie</button>

          {/* Watched */}
          <div style={{ marginBottom: 16 }}>
            <span className="section-label">Watched together ({watched.length})</span>
          </div>
          <div className="movie-grid" style={{ marginBottom: 32 }}>
            {watched.map((m) => (
              <MovieCardComponent
                key={m.id}
                movie={m}
                onToggleWatched={toggleWatched}
                onSetRating={setRating}
                onRemove={removeMovie}
              />
            ))}
          </div>

          {/* Watchlist */}
          <div style={{ marginBottom: 16 }}>
            <span className="section-label">Watch list ({pending.length})</span>
          </div>
          <div className="movie-grid">
            {pending.map((m) => (
              <MovieCardComponent
                key={m.id}
                movie={m}
                onToggleWatched={toggleWatched}
                onSetRating={setRating}
                onRemove={removeMovie}
              />
            ))}
          </div>
        </div>

        {showAdd && <AddMovieModal onAdd={addMovie} onClose={() => setShowAdd(false)} />}
      </div>
    </>
  );
}