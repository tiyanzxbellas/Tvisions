import { getSiteUrl } from "@/lib/site";

/** Structured data: helps Google show brand name + search box for "tvision / tiyanzvision". */
export default async function JsonLd() {
  const siteUrl = await getSiteUrl();

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TiyanzVision",
    alternateName: ["TVision", "TVision", "Tiyanz Vision"],
    url: `${siteUrl}/`,
    description:
      "TiyanzVision (TVision) — download free MOD APK games and premium apps (apkmod) for Android.",
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TiyanzVision",
    alternateName: "TVision",
    url: `${siteUrl}/`,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/icons/icon-512.png`,
      width: 512,
      height: 512,
    },
    sameAs: [],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
    </>
  );
}
