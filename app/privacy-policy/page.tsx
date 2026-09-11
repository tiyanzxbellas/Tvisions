import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy-policy/" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl pb-4">
      <Breadcrumbs items={[{ label: "Privacy Policy" }]} />
      <Reveal className="rounded-3xl border border-white/10 bg-panel/60 p-6 sm:p-8">
        <h1 className="font-display text-2xl font-black">Privacy Policy</h1>
        <div className="prose-neon mt-4 text-sm">
          <p>This is a fan-made demo website for educational purposes. We do not collect personal data beyond what is strictly necessary for the site to function.</p>
          <p><strong>Log data.</strong> Like most websites, our hosting provider may collect anonymous log data (IP address, browser type, visited pages) for security and analytics.</p>
          <p><strong>Cookies.</strong> We may use basic cookies to remember your preferences. No advertising or cross-site tracking cookies are used by us directly.</p>
          <p><strong>Third parties.</strong> Download buttons redirect to external sources. Their privacy practices are governed by their own policies.</p>
          <p><strong>Contact.</strong> For any privacy questions, reach us via the Contact page.</p>
        </div>
      </Reveal>
    </div>
  );
}
