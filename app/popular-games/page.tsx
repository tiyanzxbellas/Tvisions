import type { Metadata } from "next";
import SpecialListing from "@/components/SpecialListing";

export const revalidate = 1800;
export const metadata: Metadata = {
  title: "Popular Games",
  description: "Most popular MOD APK games downloaded this week.",
  alternates: { canonical: "/popular-games/" },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  return <SpecialListing slug="popular-games" page={Math.max(parseInt(page || "1", 10) || 1, 1)} />;
}
