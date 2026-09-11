import type { ApkItem } from "@/lib/types";
import ApkCard from "./ApkCard";

export default function ListingGrid({ items }: { items: ApkItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6 xl:grid-cols-8">
      {items.map((item, i) => (
        <ApkCard key={item.id} item={item} index={i} />
      ))}
    </div>
  );
}
