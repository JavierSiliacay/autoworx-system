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
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { MAINTENANCE_CONFIG } from "@/lib/maintenance-config";

/* ─── helpers ──────────────────────────────────────────────────────────────── */

function sanitize(text: string) {
  return (text || "").replace(/[\\/:*?"<>|]/g, "").trim().toUpperCase();
}

function buildFileName(meta: any, originalUrl: string): string {
  const plate     = sanitize(meta?.plate     || "NO-PLATE");
  const model     = sanitize(meta?.model     || "NO-MODEL");
  const customer  = sanitize(meta?.customer  || "UNKNOWN");
  const insurance = sanitize(meta?.insurance || "CASH");
  const rawPart   = originalUrl.split("/").pop()?.split("?")[0] ?? "";
  const uniqueId  = rawPart.split("-").pop()?.split(".")[0] ?? Math.random().toString(36).substring(7);
  const ext       = rawPart.split(".").pop() ?? "pdf";
  return `${plate} ${model} ${customer} ${insurance}_${uniqueId}.${ext}`;
}

/* ─── page ─────────────────────────────────────────────────────────────────── */

export default function MaintenancePage() {
  const [dirHandle,  setDirHandle]  = useState<any>(null);
  const [folderName, setFolderName] = useState<string>("");
  const [isReady,    setIsReady]    = useState(false);
  const [restoring,  setRestoring]  = useState(true);   // true only while IndexedDB check runs
  const [syncing,    setSyncing]    = useState(false);
  const [syncStats,  setSyncStats]  = useState<any>(null);
  const [fsSupported, setFsSupported] = useState(true);

  /* ── Rehydrate persisted handle on mount ───────────────────────────────── */
  useEffect(() => {
    async function restore() {
      // Feature-detect
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
            setFolderName((valid as any).name ?? "Office Folder");
            setIsReady(true);
          } else {
            // Permission revoked — notify once and let user reconnect
            toast({
              title: "Folder access expired",
              description: "Your previously connected folder lost permission. Please reconnect.",
              variant: "destructive",
            });
          }
        }
      } catch {
        // Silent — IndexedDB unavailable in some private-mode browsers
      } finally {
        setRestoring(false);
      }
    }
    restore();
  }, []);

  /* ── handlers ──────────────────────────────────────────────────────────── */
  const handleSelectFolder = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
      const { saveFolderHandle } = await import("@/lib/folder-store");
      await saveFolderHandle(handle);
      setDirHandle(handle);
      setFolderName(handle.name ?? "Office Folder");
      setIsReady(true);
      setSyncStats(null);
      toast({ title: "Folder connected", description: `"${handle.name}" will stay connected across refreshes and navigation.` });
    } catch {
      toast({ title: "Selection cancelled", description: "No folder was selected.", variant: "destructive" });
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
    toast({ title: "Folder disconnected", description: "You can reconnect at any time." });
  };

  const handleSyncAll = async (scope: "active" | "history" | "all") => {
    if (!dirHandle) {
      toast({ title: "No folder connected", description: "Please connect your office folder first.", variant: "destructive" });
      return;
    }
    setSyncing(true);
    const stats = { processed: 0, synced: 0, alreadyExists: 0, errors: 0, details: [] as any[] };
    setSyncStats(null);

    try {
      const res = await fetch(`/api/admin/maintenance/sync-list?scope=${scope}`);
      const { files } = await res.json();
      if (!res.ok) throw new Error("Failed to fetch sync list");

      for (const item of files) {
        stats.processed++;
        try {
          const fileName = buildFileName(item.metadata, item.url);
          try { await dirHandle.getFileHandle(fileName); stats.alreadyExists++; continue; } catch { /* not found */ }
          const blob     = await (await fetch(item.url)).blob();
          const fh       = await dirHandle.getFileHandle(fileName, { create: true });
          const writable = await fh.createWritable();
          await writable.write(blob);
          await writable.close();
          stats.synced++;
        } catch (err: any) {
          stats.errors++;
          stats.details.push({ id: item.id, error: err.message });
        }
        if (stats.processed % 5 === 0) setSyncStats({ ...stats });
      }

      setSyncStats({ ...stats });
      toast({
        title: stats.errors === 0 ? "Sync complete" : "Sync finished with errors",
        description: `${stats.synced} saved · ${stats.alreadyExists} skipped · ${stats.errors} errors`,
        variant: stats.errors > 0 ? "destructive" : "default",
      });
    } catch (err: any) {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  /* ── badge ── */
  const badgeClass = !fsSupported
    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
    : isReady
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]"
    : "bg-white/5 text-white/40 border-white/10";

  const badgeLabel = !fsSupported
    ? "Use Chrome / Edge"
    : isReady
    ? "Connected"
    : restoring
    ? "Checking..."
    : "Not Connected";

  /* ── render ── */
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white p-6 md:p-10 space-y-8 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-xl border border-primary/30 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
              <Database className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              System Maintenance
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl text-lg font-medium">
            Manage your hybrid storage architecture and synchronize official documents with the office network.
          </p>
        </div>
        <Link href="/admin/dashboard">
          <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all gap-2 backdrop-blur-xl">
            <LayoutDashboard className="w-4 h-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="xl:col-span-2 space-y-8">
          <Card className="bg-white/[0.03] border-white/10 backdrop-blur-2xl overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 opacity-50" />

            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <RefreshCw className={`w-5 h-5 text-blue-400 ${syncing ? "animate-spin" : ""}`} />
                    Document Synchronization
                  </CardTitle>
                  <CardDescription className="text-white/40 text-sm">
                    Synchronize LOA documents from Supabase to your local network path.
                  </CardDescription>
                </div>
                <Badge variant="outline" className={`px-3 py-1 shrink-0 transition-all duration-500 ${badgeClass}`}>
                  Office Network: {badgeLabel}
                </Badge>
              </div>

              {/* ── Folder connection row ── */}
              <div className="mt-4 flex items-center gap-3 flex-wrap min-h-[32px]">

                {/* Always show the connect button if not ready */}
                {!isReady && (
                  <Button
                    onClick={handleSelectFolder}
                    variant="outline"
                    size="sm"
                    disabled={!fsSupported || restoring}
                    className="bg-primary/10 border-primary/20 hover:bg-primary/20 text-xs font-bold gap-2 text-primary shadow-lg shadow-primary/5 disabled:opacity-50"
                  >
                    {restoring
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Checking...</>
                      : <><HardDrive className="w-3 h-3" /> Select Office Sync Folder</>
                    }
                  </Button>
                )}

                {/* Connected state */}
                {isReady && (
                  <>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-bold bg-emerald-500/5 px-3 py-1.5 rounded-full border border-emerald-500/10">
                      <FolderCheck className="w-3 h-3" />
                      {folderName || "Office Folder"}
                      <span className="text-emerald-500/50 font-normal ml-0.5">— connected</span>
                    </div>
                    <button onClick={handleSelectFolder} className="text-[10px] text-white/30 hover:text-white/70 underline transition-colors">
                      Change
                    </button>
                    <button onClick={handleDisconnect} className="flex items-center gap-1 text-[10px] text-red-400/60 hover:text-red-400 transition-colors">
                      <FolderX className="w-3 h-3" /> Disconnect
                    </button>
                  </>
                )}

                {/* Browser warning inline */}
                {!fsSupported && (
                  <span className="text-[11px] text-amber-400/80 font-medium">
                    Open this page in Google Chrome or Microsoft Edge to use folder sync.
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SyncButton title="Sync Active"     description="Pending & Ready units"  icon={<Zap className="w-5 h-5" />}         onClick={() => handleSyncAll("active")}  loading={syncing} color="from-blue-600/20 to-indigo-600/20" />
                <SyncButton title="Sync History"    description="Completed & Archived"   icon={<Clock className="w-5 h-5" />}       onClick={() => handleSyncAll("history")} loading={syncing} color="from-emerald-600/20 to-teal-600/20" />
                <SyncButton title="Sync Everything" description="Full system backup"     icon={<ShieldCheck className="w-5 h-5" />} onClick={() => handleSyncAll("all")}     loading={syncing} color="from-purple-600/20 to-pink-600/20" />
              </div>

              {syncStats && (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Latest Sync Results
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Processed"        value={syncStats.processed}     color="text-blue-400"    />
                    <StatCard label="Newly Synced"     value={syncStats.synced}         color="text-emerald-400" />
                    <StatCard label="Skipped (Exists)" value={syncStats.alreadyExists} color="text-white/40"    />
                    <StatCard label="Errors"           value={syncStats.errors}         color="text-red-400"     />
                  </div>
                  {syncStats.errors > 0 && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" /> Error Details
                      </p>
                      <div className="max-h-[150px] overflow-y-auto space-y-1 pr-2">
                        {syncStats.details.map((d: any, i: number) => (
                          <div key={i} className="text-[10px] font-mono text-red-300 opacity-80 grid grid-cols-1 md:grid-cols-2 gap-2 border-b border-red-500/10 pb-1">
                            <span className="truncate">Ref: {d.id}</span>
                            <span className="text-right italic">{d.error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Config cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/[0.01] border-white/5 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-white/60 flex items-center gap-2 uppercase tracking-widest">
                  <HardDrive className="w-4 h-4" /> Recommended Office Path
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <code className="text-[11px] bg-white/5 p-3 rounded-lg block border border-white/10 text-emerald-400 font-mono break-all leading-relaxed">
                  {MAINTENANCE_CONFIG.LOCAL_STORAGE_PATH}
                </code>
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                    * Files are saved as:<br />
                    <span className="text-emerald-500/80 not-italic font-mono">[PLATE] [MODEL] [CUSTOMER] [INSURANCE]_[ID].pdf</span>
                  </p>
                  <p className="text-[10px] text-amber-400 leading-relaxed font-bold border-t border-white/5 pt-2">
                    NOTE: Your folder selection is remembered across refreshes. Use "Disconnect" to clear it.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.01] border-white/5 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-white/60 flex items-center gap-2 uppercase tracking-widest">
                  <Zap className="w-4 h-4" /> Optimization Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Auto-Sync on Upload",       value: "ACTIVE",       color: "text-emerald-400" },
                  { label: "Folder Persists on Reload", value: "ENABLED",      color: "text-emerald-400" },
                  { label: "Skip Existing Files",       value: "ENABLED",      color: "text-emerald-400" },
                  { label: "Max Image Width",           value: "1024px",       color: "text-blue-400"    },
                  { label: "PDF Processing",            value: "PASS-THROUGH", color: "text-amber-400"   },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">{label}</span>
                    <span className={`${color} font-bold`}>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT – Sidebar */}
        <div className="space-y-8">
          <Card className="bg-gradient-to-br from-[#1e1b4b]/40 to-[#0f172a]/40 border-indigo-500/20 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Storage Philosophy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-white/70 leading-relaxed font-medium">
              <p>
                Autoworx uses a <span className="text-white">Hybrid Storage Model</span> to minimize
                cloud costs and maximize office workflow efficiency.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                  <div>Damage photos are optimized to <b>WebP</b> and stored in the cloud for customer visibility.</div>
                </li>
                <li className="flex gap-3">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                  <div>LOA documents are synced to the <b>local office network</b> for archival and printing.</div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 group cursor-help transition-all hover:bg-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Need Help?</h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    Contact your system administrator for network connection issues.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── sub-components ───────────────────────────────────────────────────────── */

function SyncButton({ title, description, icon, onClick, loading, color }: {
  title: string; description: string; icon: React.ReactNode;
  onClick: () => void; loading: boolean; color: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`relative group p-6 rounded-2xl bg-gradient-to-br ${color} border border-white/5 hover:border-white/20 transition-all text-left w-full h-full shadow-lg hover:shadow-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all" />
      <div className="relative z-10 flex flex-col gap-4">
        <div className="p-2.5 bg-white/10 rounded-xl w-fit border border-white/10 shadow-sm group-hover:scale-110 transition-transform">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
        </div>
        <div>
          <h3 className="font-bold text-lg text-white">{title}</h3>
          <p className="text-xs text-white/50 font-medium">{description}</p>
        </div>
      </div>
    </button>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black leading-none">{label}</p>
      <p className={`text-2xl font-black ${color} tracking-tight`}>{value}</p>
    </div>
  );
}
