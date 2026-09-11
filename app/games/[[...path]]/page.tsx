import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CatalogListing from "@/components/CatalogListing";
import DetailView from "@/components/DetailView";
import { getDetail, getRelated } from "@/lib/source";
import { genreName } from "@/lib/genres";

export const revalidate = 1800;

type Props = {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{ page?: string }>;
};

type Resolved =
  | { type: "listing"; genre: null; page: number }
  | { type: "genre"; genre: string; page: number }
  | { type: "detail"; id: string; slugPath: string }
  | { type: "notfound" };

function resolve(path: string[] | undefined, page: number): Resolved {
  const segs = path || [];
  if (segs.length === 0) return { type: "listing", genre: null, page };
  if (segs[0] === "page" && segs[1]) {
    return { type: "listing", genre: null, page: parseInt(segs[1], 10) || 1 };
  }
  const last = segs[segs.length - 1];
  const m = last.match(/-(\d+)$/);
  if (m) return { type: "detail", id: m[1], slugPath: `/games/${segs.join("/")}/` };
  if (segs.length === 1) return { type: "genre", genre: segs[0], page };
  return { type: "notfound" };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path } = await params;
  const r = resolve(path, 1);
  if (r.type === "detail") {
    const d = await getDetail(r.id, r.slugPath).catch(() => null);
    if (!d) return { title: "APK not found" };
    const t = `Download ${d.title} ${d.version} ${d.mod} APK`.trim();
    const desc =
      `Download ${d.title} ${d.version} ${d.mod} APK free for Android on TiyanzVision. ${d.genreName} game by ${d.developer}.`.trim();
    return {
      title: t,
      description: desc,
      alternates: { canonical: r.slugPath },
      openGraph: {
        title: t,
        description: desc,
        url: r.slugPath,
        type: "article",
        images: d.icon ? [{ url: d.icon, alt: d.title }] : undefined,
      },
      twitter: {
        card: "summary",
        title: t,
        description: desc,
        images: d.icon ? [d.icon] : undefined,
      },
    };
  }
  if (r.type === "genre") {
    const name = genreName("games", r.genre);
    return {
      title: `${name} Games — Free MOD APK`,
      description: `Download best ${name} games MOD APK free for Android on TiyanzVision.`,
      alternates: { canonical: `/games/${r.genre}/` },
    };
  }
  return {
    title: "Free APK Games for Android",
    description: "Download free MOD APK games for Android of any genre on TiyanzVision.",
    alternates: { canonical: "/games/" },
  };
}

export default async function GamesPage({ params, searchParams }: Props) {
  const [{ path }, { page: pageStr }] = await Promise.all([params, searchParams]);
  const page = Math.max(parseInt(pageStr || "1", 10) || 1, 1);
  const r = resolve(path, page);

  if (r.type === "notfound") notFound();
  if (r.type === "detail") {
    const [detail, related] = await Promise.all([
      getDetail(r.id, r.slugPath).catch(() => null),
      getRelated(r.slugPath).catch(() => []),
    ]);
    if (!detail) notFound();
    return <DetailView detail={detail} related={related} kindLabel="Games" kindPath="/games/" />;
  }
  return <CatalogListing kind="games" genre={r.type === "genre" ? r.genre : null} page={r.page} />;
}
