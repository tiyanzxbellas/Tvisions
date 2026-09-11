import { NextResponse } from "next/server";
import { suggest } from "@/lib/source";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json([]);
  const data = await suggest(q);
  return NextResponse.json(data);
}
