import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import OrderForm from "@/components/OrderForm";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Order Table — Request an APK",
  description: "Request a game or app MOD APK and we will publish it soon.",
  alternates: { canonical: "/request/" },
};

export default function RequestPage() {
  return (
    <div className="mx-auto max-w-3xl pb-4">
      <Breadcrumbs items={[{ label: "Order table" }]} />
      <Reveal>
        <h1 className="flex items-center gap-3 font-display text-2xl font-black sm:text-3xl">
          <span className="h-9 w-1.5 rounded-full bg-gradient-to-b from-neon to-royal shadow-[0_0_16px_rgba(34,255,136,0.6)]" />
          Order Table
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Can&apos;t find your favorite game or app? Fill the form below and our team will upload it as soon as possible.
        </p>
      </Reveal>
      <Reveal delay={0.1} className="mt-6 rounded-3xl border border-white/10 bg-panel/60 p-5 sm:p-8">
        <OrderForm />
      </Reveal>
    </div>
  );
}
