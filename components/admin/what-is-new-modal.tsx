"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  Rocket, 
  Zap, 
  Bug, 
  Wrench,
  PartyPopper
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemUpdate {
  id: string;
  version: string;
  title: string;
  summary: string;
  change_details: any[];
  published_at: string;
}

export function WhatIsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [update, setUpdate] = useState<SystemUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkUpdate() {
      try {
        const response = await fetch("/api/admin/system-updates/latest");
        if (response.ok) {
          const latestUpdate = await response.json();
          if (latestUpdate) {
            const lastSeenId = localStorage.getItem("last_seen_update_id");
            if (lastSeenId !== latestUpdate.id) {
              setUpdate(latestUpdate);
              setIsOpen(true);
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
  }, []);

  const handleClose = () => {
    if (update) {
      localStorage.setItem("last_seen_update_id", update.id);
    }
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Bug Fix": return <Bug className="w-3.5 h-3.5 text-red-400" />;
      case "New Feature": return <Rocket className="w-3.5 h-3.5 text-blue-400" />;
      case "Improvement": return <Zap className="w-3.5 h-3.5 text-purple-400" />;
      case "Utility": return <Wrench className="w-3.5 h-3.5 text-orange-400" />;
      default: return <ChevronRight className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  if (!update) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[550px] bg-slate-950 border-white/10 text-white p-0 overflow-hidden shadow-2xl">
        {/* Animated Banner */}
        <div className="h-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
            
            <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                    <PartyPopper className="w-8 h-8 text-white animate-bounce" />
                </div>
                <div className="px-3 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-[0.2em]">
                    Version {update.version}
                </div>
            </div>
        </div>

        <div className="p-8 space-y-6">
            <DialogHeader>
                <DialogTitle className="text-3xl font-black tracking-tight text-center bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    {update.title}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-center text-base font-medium">
                    {update.summary || "Major system improvements and new features are here!"}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                    <Sparkles className="w-3 h-3" /> 
                    Changes in this version
                </div>
                
                <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {update.change_details?.map((task: any, idx: number) => (
                        <div 
                            key={idx} 
                            className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-1">
                                    {getIcon(task.type)}
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm font-bold text-slate-200 leading-tight">
                                        {task.title || task.description}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium">
                                        {task.type} • Verified by Developer
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <DialogFooter className="p-6 bg-slate-900/50 border-t border-white/5 sm:justify-center">
            <Button 
                onClick={handleClose}
                className="w-full sm:w-[200px] bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 gap-2"
            >
                <CheckCircle2 className="w-5 h-5" />
                Got it, let's go!
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
