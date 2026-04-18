"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  ShieldCheck,
  Zap,
  Clock,
  LayoutDashboard,
  FolderCheck,
  FolderX,
  Loader2,
  Camera,
  FolderTree,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { MAINTENANCE_CONFIG } from "@/lib/maintenance-config";

/* ─── helpers ──────────────────────────────────────────────────────────────── */

function sanitize(text: string) {
  return (text || "").replace(/[\\/:*?"<>|]/g, "").trim().toUpperCase();
}

/** [PLATE] [MODEL] [CUSTOMER] [INSURANCE]_[ID].pdf */
function buildLOAFileName(meta: any, originalUrl: string): string {
  const plate     = sanitize(meta?.plate     || "NO-PLATE");
  const model     = sanitize(meta?.model     || "NO-MODEL");
  const customer  = sanitize(meta?.customer  || "UNKNOWN");
  const insurance = sanitize(meta?.insurance || "CASH");
  const rawPart   = originalUrl.split("/").pop()?.split("?")[0] ?? "";
  const uniqueId  = rawPart.split("-").pop()?.split(".")[0] ?? Math.random().toString(36).substring(7);
  const ext       = rawPart.split(".").pop() ?? "pdf";
  return `${plate} ${model} ${customer} ${insurance}_${uniqueId}.${ext}`;
}

/** [ID] [PLATE] [MODEL] [INSURANCE] [CUSTOMER] */
function buildUnitFolderName(meta: any): string {
  const id        = (meta?.id || "NO-ID").substring(0, 11);
  const plate     = sanitize(meta?.plate     || "NO-PLATE");
  const model     = sanitize(meta?.model     || "NO-MODEL");
  const insurance = sanitize(meta?.insurance || "CASH");
  const customer  = sanitize(meta?.customer  || "UNKNOWN");
  return `${id} ${plate} ${model} ${insurance} ${customer}`.trim();
}

function getPhotoFileName(url: string, index: number): string {
  const rawPart = url.split("/").pop()?.split("?")[0] ?? "";
  const ext = rawPart.split(".").pop() ?? "webp";
  return `photo_${index + 1}.${ext}`;
}

/* ─── main page ────────────────────────────────────────────────────────────── */

export default function MaintenancePage() {
  const [dirHandle,  setDirHandle]  = useState<any>(null);
  const [folderName, setFolderName] = useState<string>("");
  const [isReady,    setIsReady]    = useState(false);
  const [restoring,  setRestoring]  = useState(true);
  const [syncing,    setSyncing]    = useState(false);
  const [syncStats,  setSyncStats]  = useState<any>(null);
  const [fsSupported, setFsSupported] = useState(true);

  /* ── mount ── */
  useEffect(() => {
    async function restore() {
      if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
        setFsSupported(false);
        setRestoring(false);
        return;
      }
      try {
        const { loadFolderHandle, validateFolderHandle } = await import("@/lib/folder-store");
        const saved = await loadFolderHandle();
        if (saved) {
          const valid = await validateFolderHandle(saved);
          if (valid) {
            setDirHandle(valid);
            setFolderName((valid as any).name);
            setIsReady(true);
          } else {
            toast({ title: "Session Expired", description: "Folder access needs a quick reconnect.", variant: "destructive" });
          }
        }
      } catch { /* silent */ } finally {
        setRestoring(false);
      }
    }
    restore();
  }, []);

  /* ── handlers ── */
  const handleSelectFolder = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
      const { saveFolderHandle } = await import("@/lib/folder-store");
      await saveFolderHandle(handle);
      setDirHandle(handle);
      setFolderName(handle.name);
      setIsReady(true);
      setSyncStats(null);
      toast({ title: "Root Connected", description: `Linked to ${handle.name}. Subfolders will be auto-created.` });
    } catch {
      toast({ title: "Selection cancelled", description: "No folder selected.", variant: "destructive" });
    }
  };

  const handleDisconnect = async () => {
    try {
      const { clearFolderHandle } = await import("@/lib/folder-store");
      await clearFolderHandle();
    } catch { /* ignore */ }
    setDirHandle(null);
    setFolderName("");
    setIsReady(false);
    setSyncStats(null);
    toast({ title: "Disconnected", description: "Storage access cleared." });
  };

  const handleSyncAll = async (scope: "active" | "history" | "all") => {
    if (!dirHandle) {
      toast({ title: "Not Connected", description: "Select the root office folder first.", variant: "destructive" });
      return;
    }
    setSyncing(true);
    const stats = { processed: 0, synced: 0, alreadyExists: 0, errors: 0, details: [] as any[] };
    setSyncStats(null);

    try {
      const res = await fetch(`/api/admin/maintenance/sync-list?scope=${scope}`);
      const { files } = await res.json();
      if (!res.ok) throw new Error("API failed to provide sync list");

      // 1. Prepare Base Directories
      const loaDir   = await dirHandle.getDirectoryHandle("LOA Documents", { create: true });
      const photoDir = await dirHandle.getDirectoryHandle("Damage Photos", { create: true });

      // Track photo indices per unit to name them photo_1, photo_2...
      const photoCounters: Record<string, number> = {};

      for (const item of files) {
        stats.processed++;
        try {
          if (item.type === "LOA") {
            const fileName = buildLOAFileName(item.metadata, item.url);
            try { await loaDir.getFileHandle(fileName); stats.alreadyExists++; continue; } catch { /* next */ }
            const blob     = await (await fetch(item.url)).blob();
            const fh       = await loaDir.getFileHandle(fileName, { create: true });
            const writable = await fh.createWritable();
            await writable.write(blob);
            await writable.close();
            stats.synced++;
          } 
          else if (item.type === "PHOTO") {
            const unitFolderName = buildUnitFolderName(item.metadata);
            const unitDir = await photoDir.getDirectoryHandle(unitFolderName, { create: true });
            
            // Name it photo_N based on count for this unit
            if (!photoCounters[unitFolderName]) photoCounters[unitFolderName] = 0;
            const fileName = getPhotoFileName(item.url, photoCounters[unitFolderName]);
            photoCounters[unitFolderName]++;

            try { await unitDir.getFileHandle(fileName); stats.alreadyExists++; continue; } catch { /* next */ }
            const blob     = await (await fetch(item.url)).blob();
            const fh       = await unitDir.getFileHandle(fileName, { create: true });
            const writable = await fh.createWritable();
            await writable.write(blob);
            await writable.close();
            stats.synced++;
          }
        } catch (err: any) {
          stats.errors++;
          stats.details.push({ id: item.id, error: err.message });
        }
        if (stats.processed % 10 === 0) setSyncStats({ ...stats });
      }

      setSyncStats({ ...stats });
      toast({ 
        title: "Sync Finished", 
        description: `Synced ${stats.synced} files. ${stats.alreadyExists} already up-to-date.`,
        variant: stats.errors > 0 ? "destructive" : "default" 
      });
    } catch (err: any) {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  /* ── badge logic ── */
  const badgeClass = !fsSupported ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : isReady ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-white/40 border-white/10";
  const badgeLabel = !fsSupported ? "Browser Unsupported" : isReady ? "Connected" : restoring ? "Restoring..." : "Not Connected";

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white p-6 md:p-10 space-y-8 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-xl border border-primary/30 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
              <Database className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent uppercase">
              Hybrid Sync Manager
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl text-lg font-medium">
            Archiving system files and high-res damage photos to the office network.
          </p>
        </div>
        <Link href="/admin/dashboard">
          <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 transition-all gap-2 backdrop-blur-xl">
            <LayoutDashboard className="w-4 h-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-8">
          <Card className="bg-white/[0.03] border-white/10 backdrop-blur-2xl overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-emerald-500 to-indigo-500 opacity-50" />
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className="flex items-center gap-2">
                      <FolderTree className={`w-5 h-5 text-blue-400 ${syncing ? "animate-pulse" : ""}`} />
                      Root Folder Archive
                    </div>
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] normal-case tracking-normal">
                      select: {MAINTENANCE_CONFIG.LOCAL_STORAGE_PATH}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-white/40 text-sm">
                    All LOA Docs and Damage Photos will be mirrored to your local office share.
                  </CardDescription>
                </div>
                <Badge variant="outline" className={`px-3 py-1 shrink-0 ${badgeClass}`}>
                  Office Network: {badgeLabel}
                </Badge>
              </div>

              <div className="mt-4 flex items-center gap-3 flex-wrap min-h-[32px]">
                {!isReady && (
                  <Button onClick={handleSelectFolder} variant="outline" size="sm" disabled={!fsSupported || restoring} className="bg-primary/10 border-primary/20 hover:bg-primary/20 text-xs font-bold gap-2 text-primary shadow-lg shadow-primary/5">
                    {restoring ? <><Loader2 className="w-3 h-3 animate-spin" /> Identifying Connection...</> : <><HardDrive className="w-3 h-3" /> Select Root Sync Folder</>}
                  </Button>
                )}
                {isReady && (
                  <>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-bold bg-emerald-500/5 px-3 py-1.5 rounded-full border border-emerald-500/10">
                      <FolderCheck className="w-3 h-3" />
                      {folderName}
                      <span className="text-emerald-500/50 font-normal ml-0.5">— verified local storage</span>
                    </div>
                    <button onClick={handleSelectFolder} className="text-[10px] text-white/30 hover:text-white/70 underline transition-colors">Change</button>
                    <button onClick={handleDisconnect} className="flex items-center gap-1 text-[10px] text-red-400/60 hover:text-red-400 transition-colors"><FolderX className="w-3 h-3" /> Disconnect</button>
                  </>
                )}
                {!fsSupported && <span className="text-[11px] text-amber-400/80 font-medium whitespace-nowrap">Requires Google Chrome or Microsoft Edge.</span>}
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SyncButton title="Click here to Sync LoA in Active Appointments"     description="Incoming & Ongoing"  icon={<Zap className="w-5 h-5" />}         onClick={() => handleSyncAll("active")}  loading={syncing} color="from-blue-600/20 to-indigo-600/20" />
                <SyncButton title="Click here to Sync LoA in History"    description="Archived Records"   icon={<Clock className="w-5 h-5" />}       onClick={() => handleSyncAll("history")} loading={syncing} color="from-emerald-600/20 to-teal-600/20" />
                <SyncButton title="Click here to all Sync Damage Photos and LoA"   description="Full Bulk Backup"   icon={<ShieldCheck className="w-5 h-5" />} onClick={() => handleSyncAll("all")}     loading={syncing} color="from-purple-600/20 to-pink-600/20" />
              </div>

              {syncStats && (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Syncing Progress
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Total Processed" value={syncStats.processed}     color="text-blue-400" />
                    <StatCard label="Newly Saved"    value={syncStats.synced}        color="text-emerald-400" />
                    <StatCard label="Up-to-date"     value={syncStats.alreadyExists} color="text-white/40" />
                    <StatCard label="Failed"         value={syncStats.errors}        color="text-red-400" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/[0.01] border-white/5 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-white/60 flex items-center gap-2 uppercase tracking-widest"><Camera className="w-4 h-4" /> Media Organization</CardTitle>
              </CardHeader>
              <CardContent className="text-[11px] text-muted-foreground space-y-3 font-medium">
                <p>LOAs are stored in a flat list for fast access. Damage photos are organized into unit-specific folders:</p>
                <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-[10px] text-emerald-500/80 leading-relaxed overflow-x-auto whitespace-nowrap">
                  /Damage Photos/<br />
                  &nbsp;&nbsp;/[ID] [PLATE] [MODEL] [INSURANCE] [CUSTOMER]/<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;photo_1.webp<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;photo_2.webp
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.01] border-white/5 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-white/60 flex items-center gap-2 uppercase tracking-widest"><Zap className="w-4 h-4" /> System Optimized</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[ 
                  { label: "Photo Archival", value: "ORGANIZED", color: "text-emerald-400" },
                  { label: "Duplicate Skipping", value: "ENABLED", color: "text-emerald-400" },
                  { label: "Root Folder Persistence", value: "ACTIVE", color: "text-emerald-400" },
                  { label: "Batch Concurrency", value: "10 FILES", color: "text-blue-400" }
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
                    <span className="text-white/30">{label}</span>
                    <span className={color}>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <Card className="bg-gradient-to-br from-[#1e1b4b]/40 to-[#0f172a]/40 border-indigo-500/20 overflow-hidden">
            <CardHeader><CardTitle className="text-lg font-bold flex items-center gap-2"><RefreshCw className="w-5 h-5 text-indigo-400" /> Local Mirror Goal</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm text-white/70 leading-relaxed font-medium">
              <p>The <b>Hybrid Sync Manager</b> mirror cloud data to your local office storage.</p>
              <ul className="space-y-3">
                <li className="flex gap-3"><div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]" /><div>Creates a fast searchable local archive of all repair documents.</div></li>
                <li className="flex gap-3"><div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]" /><div>Reduces internet bandwidth and cloud storage costs by utilizing your local HDD capacity.</div></li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SyncButton({ title, description, icon, onClick, loading, color }: any) {
  return (
    <button onClick={onClick} disabled={loading} className={`relative group p-6 rounded-2xl bg-gradient-to-br ${color} border border-white/5 hover:border-white/20 transition-all text-left w-full h-full disabled:opacity-50`}>
      <div className="relative z-10 flex flex-col gap-4">
        <div className="p-2.5 bg-white/10 rounded-xl w-fit border border-white/10">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}</div>
        <div>
          <h3 className="font-bold text-lg text-white">{title}</h3>
          <p className="text-xs text-white/50 font-medium">{description}</p>
        </div>
      </div>
    </button>
  );
}

function StatCard({ label, value, color }: any) {
  return (
    <div className="space-y-1 p-4 rounded-xl bg-white/5 border border-white/5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black leading-none">{label}</p>
      <p className={`text-2xl font-black ${color} tracking-tight`}>{value}</p>
    </div>
  );
}
