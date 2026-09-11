import type { Metadata } from "next";
import SpecialListing from "@/components/SpecialListing";

export const revalidate = 1800;
export const metadata: Metadata = {
  title: "TOP 100 Games",
  description: "Top 100 best MOD APK games of all time.",
  alternates: { canonical: "/top-100-games/" },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  return <SpecialListing slug="top-100-games" page={Math.max(parseInt(page || "1", 10) || 1, 1)} />;
}
