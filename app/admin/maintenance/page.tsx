"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  HardDrive, 
  ShieldCheck,
  Zap,
  Clock,
  LayoutDashboard
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { MAINTENANCE_CONFIG } from "@/lib/maintenance-config";

export default function MaintenancePage() {
  const [syncing, setSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<any>(null);

  const handleSyncAll = async (scope: "all" | "active" | "history") => {
    if (MAINTENANCE_CONFIG.IS_DEV_LAPTOP) {
       toast({
         title: "Sync Blocked",
         description: "Dev Laptop Mode is active. Cannot connect to network path.",
         variant: "destructive"
       });
       return;
    }

    setSyncing(true);
    setSyncStats(null);
    try {
      const res = await fetch("/api/admin/maintenance/sync-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk sync failed");

      setSyncStats(data);
      toast({
        title: "Sync Complete",
        description: `Processed ${data.processed} documents.`,
      });
    } catch (err: any) {
      toast({
        title: "Sync Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white p-6 md:p-10 space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
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

      {/* Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Sync Controls */}
        <div className="xl:col-span-2 space-y-8">
          <Card className="bg-white/[0.03] border-white/10 backdrop-blur-2xl overflow-hidden relative shadow-2xl">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 opacity-50" />
             <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <RefreshCw className={`w-5 h-5 text-blue-400 ${syncing ? 'animate-spin' : ''}`} />
                        Document Synchronization
                      </CardTitle>
                      <CardDescription className="text-white/40 text-sm">
                        Synchronize LOA documents from Supabase to your local network path.
                      </CardDescription>
                   </div>
                   <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 animate-pulse">
                      Office Network: {MAINTENANCE_CONFIG.IS_DEV_LAPTOP ? 'Dev Restricted' : 'Scanning...'}
                   </Badge>
                </div>
             </CardHeader>
             <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SyncButton 
                    title="Sync Active" 
                    description="Pending & Ready units"
                    icon={<Zap className="w-5 h-5" />}
                    onClick={() => handleSyncAll("active")}
                    loading={syncing}
                    color="from-blue-600/20 to-indigo-600/20"
                  />
                  <SyncButton 
                    title="Sync History" 
                    description="Completed & Archived"
                    icon={<Clock className="w-5 h-5" />}
                    onClick={() => handleSyncAll("history")}
                    loading={syncing}
                    color="from-emerald-600/20 to-teal-600/20"
                  />
                  <SyncButton 
                    title="Sync Everything" 
                    description="Full system backup"
                    icon={<ShieldCheck className="w-5 h-5" />}
                    onClick={() => handleSyncAll("all")}
                    loading={syncing}
                    color="from-purple-600/20 to-pink-600/20"
                  />
                </div>

                {/* Progress Results */}
                {syncStats && (
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                     <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                           <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                           Latest Sync Results
                        </h3>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-black">
                           Task Duration: 1.2s
                        </span>
                     </div>
                     
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard label="Processed" value={syncStats.processed} color="text-blue-400" />
                        <StatCard label="Newly Synced" value={syncStats.synced} color="text-emerald-400" />
                        <StatCard label="Skipped (Exists)" value={syncStats.alreadyExists} color="text-white/40" />
                        <StatCard label="Errors" value={syncStats.errors} color="text-red-400" />
                     </div>

                     {syncStats.errors > 0 && (
                       <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
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

          {/* Configuration Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="bg-white/[0.01] border-white/5 backdrop-blur-md">
                <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-bold text-white/60 flex items-center gap-2 uppercase tracking-widest">
                      <HardDrive className="w-4 h-4" /> Destination Path
                   </CardTitle>
                </CardHeader>
                <CardContent>
                   <code className="text-[11px] bg-white/5 p-3 rounded-lg block border border-white/10 text-emerald-400 font-mono break-all leading-relaxed">
                      {MAINTENANCE_CONFIG.LOCAL_STORAGE_PATH}
                   </code>
                </CardContent>
             </Card>
             <Card className="bg-white/[0.01] border-white/5 backdrop-blur-md">
                <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-bold text-white/60 flex items-center gap-2 uppercase tracking-widest">
                      <Zap className="w-4 h-4" /> Optimization Rules
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                   <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Auto-Sync on Upload</span>
                      <span className="text-emerald-400 font-bold">ACTIVE</span>
                   </div>
                   <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Max Image Width</span>
                      <span className="text-blue-400 font-bold">1024px</span>
                   </div>
                   <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">PDF Processing</span>
                      <span className="text-amber-400 font-bold">PASS-THROUGH</span>
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>

        {/* Sidebar Info */}
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
                  To minimize cloud storage costs and maximize office workflow efficiency, Autoworx uses a 
                  <span className="text-white"> Hybrid Storage Model</span>.
                </p>
                <ul className="space-y-3">
                   <li className="flex gap-3">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                      <div>
                        Photos of vehicle damage are optimized to <b>WebP</b> and stored in the cloud for customer visibility.
                      </div>
                   </li>
                   <li className="flex gap-3">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                      <div>
                        Official LOA documents are kept as <b>PDFs</b> and synchronized to the local office network for archival and printing.
                      </div>
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
                       <p className="text-xs text-muted-foreground font-medium">Contact your system administrator for network connection issues.</p>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

function SyncButton({ title, description, icon, onClick, loading, color }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={loading}
      className={`relative group p-6 rounded-2xl bg-gradient-to-br ${color} border border-white/5 hover:border-white/20 transition-all text-left w-full h-full shadow-lg hover:shadow-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all" />
      <div className="relative z-10 flex flex-col gap-4">
        <div className="p-2.5 bg-white/10 rounded-xl w-fit border border-white/10 shadow-sm group-hover:scale-110 transition-transform">
           {icon}
        </div>
        <div>
          <h3 className="font-bold text-lg text-white group-hover:text-primary-foreground transition-colors">{title}</h3>
          <p className="text-xs text-white/50 font-medium">{description}</p>
        </div>
      </div>
    </button>
  );
}

function StatCard({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-1 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all">
       <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black leading-none">{label}</p>
       <p className={`text-2xl font-black ${color} tracking-tight`}>{value}</p>
    </div>
  );
}
