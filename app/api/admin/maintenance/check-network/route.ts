import { NextResponse } from "next/server";
import { checkNetwork } from "@/lib/storage-utils";

export const runtime = "nodejs";

export async function GET() {
  const isOnline = checkNetwork();
  return NextResponse.json({ online: isOnline });
}
