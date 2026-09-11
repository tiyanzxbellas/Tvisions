import type { Metadata } from "next";
import SpecialListing from "@/components/SpecialListing";

export const revalidate = 1800;
export const metadata: Metadata = {
  title: "Best New Releases",
  description: "Best new MOD APK releases, hand-picked by editors.",
  alternates: { canonical: "/best-new-releases/" },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  return <SpecialListing slug="best-new-releases" page={Math.max(parseInt(page || "1", 10) || 1, 1)} />;
}
