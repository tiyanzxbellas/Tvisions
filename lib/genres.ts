import type { Genre } from "./types";

/** Game genres (parent category: Games) */
export const GAME_GENRES: Genre[] = [
  { id: 3, name: "Action", slug: "action", count: 1756 },
  { id: 4, name: "Adventure", slug: "adventure", count: 876 },
  { id: 5, name: "Arcade", slug: "arcade", count: 714 },
  { id: 6, name: "Board", slug: "board", count: 152 },
  { id: 7, name: "Card", slug: "card", count: 60 },
  { id: 8, name: "Casino", slug: "casino", count: 2 },
  { id: 9, name: "Casual", slug: "casual", count: 316 },
  { id: 10, name: "Educational", slug: "educational", count: 82 },
  { id: 3296, name: "Music", slug: "music", count: 34 },
  { id: 122, name: "Other", slug: "other", count: 142 },
  { id: 13, name: "Puzzle", slug: "puzzle", count: 542 },
  { id: 14, name: "Racing", slug: "racing", count: 440 },
  { id: 15, name: "Role Playing", slug: "role-playing", count: 800 },
  { id: 16, name: "Simulation", slug: "simulation", count: 1119 },
  { id: 17, name: "Sports", slug: "sports", count: 334 },
  { id: 18, name: "Strategy", slug: "strategy", count: 665 },
  { id: 19, name: "Trivia", slug: "trivia", count: 14 },
  { id: 20, name: "Word", slug: "word", count: 28 },
];

/** App categories (parent category: App) */
export const APP_CATS: Genre[] = [
  { id: 14185, name: "Art & Design", slug: "art-design", count: 13 },
  { id: 22, name: "Books & Reference", slug: "books-reference", count: 11 },
  { id: 23, name: "Business", slug: "business", count: 21 },
  { id: 24, name: "Comics", slug: "comics", count: 4 },
  { id: 25, name: "Communication", slug: "communication", count: 65 },
  { id: 26, name: "Education", slug: "education", count: 69 },
  { id: 27, name: "Entertainment", slug: "entertainment", count: 81 },
  { id: 29, name: "Health & Fitness", slug: "health-fitness", count: 23 },
  { id: 31, name: "Lifestyle", slug: "lifestyle", count: 11 },
  { id: 32, name: "Media & Video", slug: "media-video", count: 85 },
  { id: 34, name: "Music & Audio", slug: "music-audio", count: 91 },
  { id: 71, name: "Other", slug: "other", count: 69 },
  { id: 36, name: "Personalization", slug: "personalization", count: 198 },
  { id: 37, name: "Photography", slug: "photography", count: 96 },
  { id: 38, name: "Productivity", slug: "productivity", count: 78 },
  { id: 40, name: "Social", slug: "social", count: 26 },
  { id: 72, name: "System", slug: "system", count: 39 },
  { id: 42, name: "Tools", slug: "tools", count: 373 },
  { id: 7518, name: "Video Players & Editors", slug: "video-players-editors", count: 59 },
];

export const SPECIAL_PAGES: Record<string, { title: string; subtitle: string }> = {
  "best-new-releases": { title: "Best New Releases", subtitle: "APK terbaru pilihan editor" },
  "popular-games": { title: "Popular Games", subtitle: "Game paling banyak diunduh" },
  updated: { title: "Last Update", subtitle: "Baru saja diperbarui" },
  "top-100-games": { title: "TOP 100 Games", subtitle: "100 game terbaik minggu ini" },
};

export function genreName(kind: "games" | "app", slug: string): string {
  const list = kind === "games" ? GAME_GENRES : APP_CATS;
  const g = list.find((x) => x.slug === slug);
  if (g) return g.name;
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
