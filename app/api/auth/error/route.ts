import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const error = searchParams.get("error") || "Unknown"
  const callbackUrl = searchParams.get("callbackUrl") || ""

  const target = new URL("/admin/error", req.url)
  target.searchParams.set("error", error)
  if (callbackUrl) {
    target.searchParams.set("callbackUrl", callbackUrl)
  }

  return NextResponse.redirect(target)
}
