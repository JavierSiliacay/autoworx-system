import { NextRequest, NextResponse } from "next/server";
import { syncFileToLocal } from "@/lib/storage-utils";

// Force Node.js runtime to use 'fs' (filesystem) modules
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { appointmentId, fileUrl } = await req.json();

    if (!appointmentId || !fileUrl) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    const result = await syncFileToLocal(fileUrl, appointmentId);

    if (result.status === "error") {
        return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("LOA Sync Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
