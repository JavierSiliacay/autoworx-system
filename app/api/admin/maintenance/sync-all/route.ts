import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncFileToLocal } from "@/lib/storage-utils";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const { scope = "all" } = await req.json();
    
    const results = {
      processed: 0,
      synced: 0,
      alreadyExists: 0,
      errors: 0,
      details: [] as any[]
    };

    // 1. Fetch LOAs from appointments table
    if (scope === "all" || scope === "active") {
      const { data: activeApts } = await supabase
        .from("appointments")
        .select("id, loa_attachments, loa_attachment, loa_attachment_2")
        .not("loa_attachments", "is", null);

      if (activeApts) {
        for (const apt of activeApts) {
          const loaUrls = Array.from(new Set([
            ...(apt.loa_attachments || []),
            ...(apt.loa_attachment ? [apt.loa_attachment] : []),
            ...(apt.loa_attachment_2 ? [apt.loa_attachment_2] : [])
          ])).filter(Boolean) as string[];

          for (const url of loaUrls) {
            results.processed++;
            const syncResult = await syncFileToLocal(url, apt.id);
            if (syncResult.status === "success") {
              if (syncResult.message.includes("Already")) results.alreadyExists++;
              else results.synced++;
            } else if (syncResult.status === "error") {
              results.errors++;
              results.details.push({ id: apt.id, error: syncResult.message, url });
            } else if (syncResult.status === "offline") {
              results.errors++;
              results.details.push({ id: apt.id, error: "NETWORK OFFLINE", url });
              // Early exit if network is unreachable
              return NextResponse.json({ ...results, message: "Sync aborted: Office Network unreachable" }, { status: 503 });
            }
          }
        }
      }
    }

    // 2. Fetch LOAs from history table
    if (scope === "all" || scope === "history") {
      const { data: historyApts } = await supabase
        .from("appointment_history")
        .select("id, costing");

      if (historyApts) {
        for (const hist of historyApts) {
          const loaUrls = hist.costing?.loaAttachments || [];
          for (const url of loaUrls) {
            results.processed++;
            const syncResult = await syncFileToLocal(url, hist.id);
            if (syncResult.status === "success") {
              if (syncResult.message.includes("Already")) results.alreadyExists++;
              else results.synced++;
            } else if (syncResult.status === "error") {
              results.errors++;
              results.details.push({ id: hist.id, error: syncResult.message, url });
            } else if (syncResult.status === "offline") {
                results.errors++;
                results.details.push({ id: hist.id, error: "NETWORK OFFLINE", url });
                return NextResponse.json({ ...results, message: "Sync aborted: Office Network unreachable" }, { status: 503 });
            }
          }
        }
      }
    }

    return NextResponse.json({
      message: "Sync process completed",
      ...results
    });

  } catch (error: any) {
    console.error("Bulk Sync Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
