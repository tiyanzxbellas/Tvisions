export interface ApkItem {
  id: string;
  title: string;
  /** local path, e.g. /games/action/gorebox-27-134397/ */
  url: string;
  /** original absolute URL on the source site */
  originalUrl: string;
  icon: string;
  version: string;
  mod: string;
}

export interface DownloadLink {
  url: string;
  label: string;
  size: string;
}

export interface ApkDetail extends ApkItem {
  descriptionHtml: string;
  info: { label: string; value: string }[];
  googlePlayUrl: string;
  downloads: DownloadLink[];
  screenshots: string[];
  rating: string;
  ratingVotes: string;
  workPercent: string;
  workVoices: string;
  updated: string;
  genreName: string;
  genreUrl: string;
  developer: string;
  packageName: string;
}

export interface HomeSection {
  title: string;
  moreUrl: string;
  moreLabel: string;
  items: ApkItem[];
}

export interface PagedResult {
  items: ApkItem[];
  page: number;
  totalPages: number;
  title: string;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
  count: number;
}
