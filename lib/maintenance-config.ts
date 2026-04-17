/**
 * Autoworx Maintenance & Storage Configuration
 * Use this file to toggle system-wide features and manage local network storage paths.
 */

export const MAINTENANCE_CONFIG = {
  // --- LOCAL DOCUMENT SYNC ---
  
  // The network path (UNC) where LOA documents should be backed up.
  // Note: We use double backslashes for JS strings.
  LOCAL_STORAGE_PATH: "\\\\ADMIN\\autoworx repair estimate\\LOA Documents",
  
  // When enabled, the app will try to copy LOAs from Supabase to the local network path automatically.
  ENABLE_AUTO_LOA_SYNC: true,
  
  // Set this to true if you are developing on a laptop AWAY from the office network.
  // This prevents the app from hanging while trying to find the \\ADMIN path.
  IS_DEV_LAPTOP: false, 
  
  // Re-verify existing records even if they are marked as synced.
  STRICT_REPAIR_SYNC: false,

  // --- IMAGE OPTIMIZATION ---
  
  // Maximum width for all uploads to keep them under 100KB.
  MAX_IMAGE_WIDTH: 1024,
  
  // WebP quality for compression.
  WEBP_QUALITY: 80,
};

export const IS_MAINTENANCE_MODE = false;

export type MaintenanceConfig = typeof MAINTENANCE_CONFIG;
