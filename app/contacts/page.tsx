import type { Metadata } from "next";
import { Mail, Send, MessageCircle } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Contact",
  alternates: { canonical: "/contacts/" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl pb-4">
      <Breadcrumbs items={[{ label: "Contact" }]} />
      <Reveal>
        <h1 className="flex items-center gap-3 font-display text-2xl font-black sm:text-3xl">
          <span className="h-9 w-1.5 rounded-full bg-gradient-to-b from-neon to-royal shadow-[0_0_16px_rgba(34,255,136,0.6)]" />
          Contact Us
        </h1>
        <p className="mt-2 text-sm text-slate-400">Questions, takedown requests or partnership? Reach us anytime.</p>
      </Reveal>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Mail, t: "Email", d: "hello@example.com" },
          { icon: Send, t: "Telegram", d: "@tiyanzvision" },
          { icon: MessageCircle, t: "Response", d: "within 24–48h" },
        ].map((c, i) => (
          <Reveal key={c.t} delay={i * 0.08}>
            <div className="card-neon flex flex-col items-center gap-2 rounded-2xl p-6 text-center">
              <c.icon className="h-8 w-8 text-neon" />
              <span className="font-display font-bold">{c.t}</span>
              <span className="text-sm text-slate-400">{c.d}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
