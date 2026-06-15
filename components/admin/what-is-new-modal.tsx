"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Rocket, 
  Zap, 
  Bug, 
  Wrench,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface SystemUpdate {
  id: string;
  version: string;
  title: string;
  summary: string;
  change_details: any[];
  published_at: string;
}

const getChangeIcon = (type: string) => {
  switch (type) {
    case "Bug Fix":
      return { icon: <Bug className="w-4 h-4" />, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
    case "New Feature":
      return { icon: <Rocket className="w-4 h-4" />, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
    case "Improvement":
      return { icon: <Zap className="w-4 h-4" />, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" };
    case "Utility":
      return { icon: <Wrench className="w-4 h-4" />, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" };
    default:
      return { icon: <ChevronRight className="w-4 h-4" />, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" };
  }
};

export function WhatIsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [update, setUpdate] = useState<SystemUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkUpdate() {
      try {
        const response = await fetch("/api/admin/system-updates/latest", { cache: "no-store" });
        if (response.ok) {
          const latestUpdate = await response.json();
          if (latestUpdate) {
            const lastSeenId = localStorage.getItem("last_seen_update_id");
            if (lastSeenId !== latestUpdate.id) {
              const publishedAt = new Date(latestUpdate.published_at || new Date());
              const daysOld = (new Date().getTime() - publishedAt.getTime()) / (1000 * 3600 * 24);
              if (!lastSeenId && daysOld > 7) {
                localStorage.setItem("last_seen_update_id", latestUpdate.id);
                localStorage.setItem("update_notified_id", latestUpdate.id);
              } else {
                setUpdate(latestUpdate);
                setIsOpen(true);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error checking for updates:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkUpdate();

    const supabase = createClient();
    const channel = supabase
      .channel("system_updates_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "system_updates" }, () => {
        checkUpdate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleClose = () => {
    if (update) {
      localStorage.setItem("last_seen_update_id", update.id);
    }
    setIsOpen(false);
  };

  if (!update) return null;

  const hasChanges = update.change_details && update.change_details.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl bg-transparent [&>button]:hidden">
        {/* Outer card */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "oklch(0.13 0.01 250)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(29,78,216,0.15)",
          }}
        >
          {/* Top racing stripe */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px] z-20"
            style={{ background: "linear-gradient(90deg, #f97316 0%, #1d4ed8 50%, #f97316 100%)" }}
          />

          {/* ── HEADER ── */}
          <div
            className="relative flex flex-col items-center justify-center pt-10 pb-7 px-8 overflow-hidden"
            style={{ background: "linear-gradient(160deg, oklch(0.19 0.025 260) 0%, oklch(0.15 0.01 250) 100%)" }}
          >
            {/* Grid texture */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            {/* Glow blobs */}
            <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full opacity-15 blur-3xl" style={{ background: "#f97316" }} />
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-15 blur-3xl" style={{ background: "#1d4ed8" }} />

            {/* Logo container */}
            <div
              className="relative z-10 flex items-center justify-center w-[72px] h-[72px] rounded-2xl mb-4 shadow-xl"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <Image
                src="/autoworxlogo.webp"
                alt="Autoworx"
                width={52}
                height={52}
                className="object-contain"
              />
            </div>

            {/* Version badge */}
            <div
              className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
              style={{
                background: "rgba(29, 78, 216, 0.2)",
                border: "1px solid rgba(29, 78, 216, 0.35)",
              }}
            >
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                System Update · {update.version}
              </span>
            </div>

            {/* Title */}
            <h2 className="relative z-10 text-[1.25rem] font-black text-white text-center leading-snug max-w-[380px]">
              {update.title}
            </h2>
          </div>

          {/* Separator */}
          <div className="flex items-center px-8">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
            <div className="w-2 h-2 rounded-full mx-3 shrink-0" style={{ background: "#f97316", boxShadow: "0 0 8px #f97316" }} />
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
          </div>

          {/* ── BODY ── */}
          <div className="px-8 py-6 space-y-5">

            {/* Summary — smart bullet parser */}
            {update.summary && (() => {
              // Split on bullet char or newline, then clean up empty entries
              const bullets = update.summary
                .split(/\n|•/)
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0);

              // If only one segment (no bullets found) just show as a paragraph
              if (bullets.length <= 1) {
                return (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3 h-3" /> Release Notes
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">{update.summary}</p>
                  </div>
                );
              }

              return (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1.5 mb-3">
                    <Sparkles className="w-3 h-3" /> Release Notes
                  </p>
                  <ul className="space-y-2">
                    {bullets.map((point: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span
                          className="mt-[6px] shrink-0 w-1.5 h-1.5 rounded-full"
                          style={{ background: "#f97316", boxShadow: "0 0 6px #f97316aa" }}
                        />
                        <span className="text-sm text-slate-300 leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}

            {/* Changes */}
            {hasChanges && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-3 h-3" />
                  Changes in this release
                </p>
                <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {update.change_details.map((task: any, idx: number) => {
                    const { icon, color, bg, border } = getChangeIcon(task.type);
                    return (
                      <div
                        key={idx}
                        className={cn("flex items-start gap-3 p-3 rounded-xl border transition-colors hover:brightness-110", bg, border)}
                      >
                        <div className={cn("mt-0.5 shrink-0", color)}>{icon}</div>
                        <div>
                          <p className="text-sm font-semibold text-slate-200 leading-snug">
                            {task.title || task.description}
                          </p>
                          {task.type && (
                            <p className={cn("text-[10px] mt-0.5 font-medium", color)}>{task.type}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── FOOTER ── */}
          <div className="px-8 pb-8 pt-1 flex flex-col items-center gap-3">
            <Button
              onClick={handleClose}
              className="w-full h-11 font-bold rounded-xl text-sm gap-2 text-white border-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #1e40af, #2563eb)",
                boxShadow: "0 4px 20px rgba(37,99,235,0.4)",
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Got it, let&apos;s go!
            </Button>
            <p className="text-[10px] text-slate-700 font-medium tracking-wide">
              Autoworx Repairs &amp; Gen. Merchandise
            </p>
          </div>

          {/* Bottom racing stripe */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, #f97316, #1d4ed8, transparent)" }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
