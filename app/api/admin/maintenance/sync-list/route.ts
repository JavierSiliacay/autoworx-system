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

    const files: { id: string; url: string; type: "LOA" | "PHOTO"; metadata: any }[] = [];
    const bucket = "damage-images";
    const baseUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}`;

    // 1. Fetch from active appointments
    if (scope === "all" || scope === "active") {
      const { data: activeApts } = await supabase
        .from("appointments")
        .select(`
          id, 
          estimate_number,
          loa_attachments, 
          loa_attachment, 
          loa_attachment_2,
          damage_images,
          vehicle_plate,
          vehicle_model,
          name,
          insurance
        `);

      if (activeApts) {
        activeApts.forEach(apt => {
          const meta = {
            id: apt.estimate_number || apt.id, // Prefer estimate number for folder naming
            plate: apt.vehicle_plate,
            model: apt.vehicle_model,
            customer: apt.name,
            insurance: apt.insurance
          };

          // LOA URLs
          const loaUrls = Array.from(new Set([
            ...(apt.loa_attachments || []),
            ...(apt.loa_attachment ? [apt.loa_attachment] : []),
            ...(apt.loa_attachment_2 ? [apt.loa_attachment_2] : [])
          ])).filter(Boolean) as string[];

          loaUrls.forEach(url => files.push({ id: apt.id, url, type: "LOA", metadata: meta }));

          // Damage Photo URLs (corrected column name & absolute URL construction)
          const photoUrls = (apt.damage_images || []).filter(Boolean) as string[];

          photoUrls.forEach(url => {
            // Only prepend if it doesn't look like a full URL
            const finalUrl = url.startsWith("http") ? url : `${baseUrl}/${url}`;
            files.push({ id: apt.id, url: finalUrl, type: "PHOTO", metadata: meta });
          });
        });
      }
    }

    // 2. Fetch from history
    if (scope === "all" || scope === "history") {
      const { data: historyApts } = await supabase
        .from("appointment_history")
        .select("id, estimate_number, vehicle_plate, vehicle_model, name, insurance, costing");

      if (historyApts) {
        historyApts.forEach(hist => {
          const meta = {
            id: hist.estimate_number || hist.id,
            plate: hist.vehicle_plate,
            model: hist.vehicle_model,
            customer: hist.name,
            insurance: hist.insurance
          };

          // LOA URLs from costing
          const loaUrls = hist.costing?.loaAttachments || [];

          loaUrls.forEach((url: string) => {
            const finalUrl = url.startsWith("http") ? url : `${baseUrl}/${url}`;
            files.push({ id: hist.id, url: finalUrl, type: "LOA", metadata: meta });
          });

          // Damage Photo URLs (try both naming conventions & absolute URL construction)
          const photoUrls = hist.costing?.damage_images || hist.costing?.damagePhotos || hist.costing?.damageImages || [];

          photoUrls.forEach((url: string) => {
            const finalUrl = url.startsWith("http") ? url : `${baseUrl}/${url}`;
            files.push({ id: hist.id, url: finalUrl, type: "PHOTO", metadata: meta });
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
