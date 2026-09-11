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
  /** Local download page on this site, e.g. /download/action/slug-123/v1.3.2-apk/ ("" when unavailable) */
  localUrl: string;
  label: string;
  size: string;
}

/** Direct file info parsed from the source's download page. */
export interface ApkDownloadFile {
  /** Absolute URL of the .apk file on the source CDN */
  fileUrl: string;
  filename: string;
  version: string;
  arch: string;
  size: string;
  /** Original download page on the source (fallback link) */
  sourceUrl: string;
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
