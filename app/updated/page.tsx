import type { Metadata } from "next";
import SpecialListing from "@/components/SpecialListing";

export const revalidate = 1800;
export const metadata: Metadata = {
  title: "Last Update",
  description: "Recently updated MOD APK games and apps.",
  alternates: { canonical: "/updated/" },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  return <SpecialListing slug="updated" page={Math.max(parseInt(page || "1", 10) || 1, 1)} />;
}
