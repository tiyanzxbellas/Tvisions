import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DownloadPageView from "@/components/DownloadPageView";
import { ORIGIN, getDetail, getDownloadFile, getRestPost, toLocal } from "@/lib/source";

export const revalidate = 1800;

type Props = {
  params: Promise<{ path?: string[] }>;
};

/**
 * Accepts /download/<version>/, /download/<slug>-<id>/<version>/,
 * or /download/<genre>/<slug>-<id>/<version>/ — the slug carries the post id.
 */
function resolve(segs: string[]): { id: string; version: string } | null {
  if (segs.length < 2) return null;
  const version = segs[segs.length - 1];
  if (!version || version === "page") return null;
  const slugSeg = segs.slice(0, -1).find((s) => /-\d+$/.test(s));
  if (!slugSeg) return null;
  const id = slugSeg.match(/-(\d+)$/)?.[1] || "";
  return id ? { id, version } : null;
}

async function load(id: string) {
  const post = await getRestPost(id).catch(() => null);
  const detailPath = post ? toLocal(post.link) : null;
  return { post, detailPath };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path } = await params;
  const r = resolve((path || []).filter(Boolean));
  if (!r) return { title: "Download" };
  const { post } = await load(r.id);
  const name = post
    ? post.title.rendered.replace(/&#8211;|&ndash;/g, "–").replace(/\s*APK\s*$/i, "")
    : "APK";
  const ver = r.version.replace(/-apk$/i, "");
  return {
    title: `Download ${name} ${ver} APK`,
    description: `Download ${name} ${ver} APK free untuk Android — langsung tanpa timer.`,
    robots: { index: false, follow: true },
  };
}

export default async function DownloadPage({ params }: Props) {
  const { path } = await params;
  const segs = (path || []).filter(Boolean);
  const r = resolve(segs);
  if (!r) notFound();

  const { detailPath } = await load(r.id);
  if (!detailPath) notFound();

  const [detail, file] = await Promise.all([
    getDetail(r.id, detailPath).catch(() => null),
    getDownloadFile(r.id, r.version).catch(() => null),
  ]);

  const fallbackUrl =
    file?.sourceUrl || `${ORIGIN}${detailPath}download/${r.version}/`;

  return (
    <DownloadPageView
      id={r.id}
      version={r.version}
      detail={detail}
      file={file}
      detailUrl={detailPath}
      fallbackUrl={fallbackUrl}
    />
  );
}
