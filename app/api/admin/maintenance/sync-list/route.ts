import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "all";

    const files: { id: string; url: string; metadata: any }[] = [];

    // 1. Fetch from active appointments
    if (scope === "all" || scope === "active") {
      const { data: activeApts } = await supabase
        .from("appointments")
        .select(`
          id, 
          loa_attachments, 
          loa_attachment, 
          loa_attachment_2,
          vehicle_plate,
          vehicle_model,
          name,
          insurance
        `)
        .not("loa_attachments", "is", null);

      if (activeApts) {
        activeApts.forEach(apt => {
          const urls = Array.from(new Set([
            ...(apt.loa_attachments || []),
            ...(apt.loa_attachment ? [apt.loa_attachment] : []),
            ...(apt.loa_attachment_2 ? [apt.loa_attachment_2] : [])
          ])).filter(Boolean) as string[];

          urls.forEach(url => {
            files.push({ 
              id: apt.id, 
              url,
              metadata: {
                plate: apt.vehicle_plate,
                model: apt.vehicle_model,
                customer: apt.name,
                insurance: apt.insurance
              }
            });
          });
        });
      }
    }

    // 2. Fetch from history
    if (scope === "all" || scope === "history") {
      const { data: historyApts } = await supabase
        .from("appointment_history")
        .select("id, vehicle_plate, vehicle_model, name, insurance, costing");

      if (historyApts) {
        historyApts.forEach(hist => {
          const urls = hist.costing?.loaAttachments || [];
          urls.forEach((url: string) => {
            files.push({ 
              id: hist.id, 
              url,
              metadata: {
                plate: hist.vehicle_plate,
                model: hist.vehicle_model,
                customer: hist.name,
                insurance: hist.insurance
              }
            });
          });
        });
      }
    }

    return NextResponse.json({ files });

  } catch (error: any) {
    console.error("Sync List Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
