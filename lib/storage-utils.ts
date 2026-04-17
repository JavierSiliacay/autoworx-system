import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { MAINTENANCE_CONFIG } from "./maintenance-config";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * Syncs a single file from Supabase storage to the local network path.
 * Returns information about the sync result.
 */
export async function syncFileToLocal(fileUrl: string, appointmentId: string) {
  try {
    // 1. Connectivity Check
    if (MAINTENANCE_CONFIG.IS_DEV_LAPTOP) {
       return { status: "skipped", message: "Dev Laptop Mode: Sync disabled." };
    }

    const baseDir = MAINTENANCE_CONFIG.LOCAL_STORAGE_PATH;
    
    // Check if the network path is reachable
    if (!fs.existsSync(baseDir)) {
      return { status: "offline", message: "Office Network unreachable." };
    }

    // 2. Parse URL to get storage path
    const url = new URL(fileUrl);
    const parts = url.pathname.split("/public/damage-images/");
    if (parts.length < 2) return { status: "error", message: "Invalid file URL format" };
    
    const storagePath = parts[1];
    const fileName = storagePath.split("/").pop() || `doc-${Date.now()}.pdf`;
    
    // 3. Check if already exists locally
    const targetPath = path.join(baseDir, fileName);
    if (fs.existsSync(targetPath)) {
        return { status: "success", message: "Already backed up locally.", localPath: targetPath };
    }

    // 4. Download and Save
    const { data: blob, error: dlError } = await supabase.storage
      .from("damage-images")
      .download(storagePath);

    if (dlError || !blob) throw new Error(`Download failed: ${dlError?.message}`);

    const buffer = Buffer.from(await blob.arrayBuffer());
    
    // Ensure folder exists (again, just in case)
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

    fs.writeFileSync(targetPath, buffer);

    return { 
        status: "success", 
        message: "Successfully synced.",
        localPath: targetPath,
        fileName
    };

  } catch (error: any) {
    console.error(`Sync error for ${fileUrl}:`, error.message);
    return { status: "error", message: error.message };
  }
}
