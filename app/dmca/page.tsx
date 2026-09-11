import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "DMCA",
  alternates: { canonical: "/dmca/" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl pb-4">
      <Breadcrumbs items={[{ label: "DMCA" }]} />
      <Reveal className="rounded-3xl border border-white/10 bg-panel/60 p-6 sm:p-8">
        <h1 className="font-display text-2xl font-black">DMCA Notice</h1>
        <div className="prose-neon mt-4 text-sm">
          <p><strong>No files are hosted on TiyanzVision servers</strong> — all download buttons redirect to external third-party sources.</p>
          <p>All trademarks, game titles and app names belong to their respective owners. Content shown here is for demonstration and educational purposes only.</p>
          <p>If you are a copyright holder and believe that any content infringes your rights, please contact us via the Contact page with the exact URL and proof of ownership, and we will remove the link promptly.</p>
        </div>
      </Reveal>
    </div>
  );
}
