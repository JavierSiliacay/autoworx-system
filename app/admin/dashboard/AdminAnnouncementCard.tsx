"use client";

import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { X, MessageSquare, Loader2, Clock, CheckCircle2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { getUserIdentity } from "@/lib/auth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const REACTIONS = ['👍', '❤️', '🔥', '👀'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; animate?: boolean }> = {
  "Pending":     { label: "Pending",     color: "text-slate-400",  bg: "bg-slate-500/20",  border: "border-slate-500/30" },
  "Ongoing Fix": { label: "Ongoing Fix", color: "text-amber-400",  bg: "bg-amber-500/20",  border: "border-amber-500/40", animate: true },
  "For Testing": { label: "For Testing", color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/40", animate: true },
  "Completed":   { label: "Completed",   color: "text-green-400",  bg: "bg-green-500/20",  border: "border-green-500/40" },
  "Archived":    { label: "Archived",    color: "text-zinc-500",   bg: "bg-zinc-700/20",   border: "border-zinc-600/30" },
};

function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "xs" }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["Pending"];
  const isOngoing = status === "Ongoing Fix";
  const isTesting = status === "For Testing";

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border font-medium",
      cfg.bg, cfg.border, cfg.color,
      size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"
    )}>
      {isOngoing && (
        <span className="relative flex h-2 w-2">
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", "bg-amber-400")} />
          <span className={cn("relative inline-flex rounded-full h-2 w-2", "bg-amber-400")} />
        </span>
      )}
      {isTesting && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
      {!isOngoing && !isTesting && status === "Pending" && <Clock className="w-2.5 h-2.5" />}
      {status === "Completed" && <CheckCircle2 className="w-2.5 h-2.5" />}
      {status === "Archived" && <span className="w-2 h-2 rounded-full bg-zinc-500" />}
      {cfg.label}
    </span>
  );
}

export function AdminAnnouncementCard({ 
  announcement, 
  userEmail, 
  canDelete, 
  onDelete, 
  onUpdate 
}: { 
  announcement: any;
  userEmail: string | undefined | null;
  canDelete: boolean;
  onDelete: (id: string) => void;
  onUpdate: () => void;
}) {
  const { toast } = useToast();
  const [reactions, setReactions] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);

  useEffect(() => {
    loadReactions();
    if (showComments) {
      loadComments();
    }
  }, [showComments, announcement.id]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`announcement_${announcement.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcement_reactions', filter: `announcement_id=eq.${announcement.id}` }, () => {
        loadReactions();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcement_comments', filter: `announcement_id=eq.${announcement.id}` }, () => {
        if (showComments) loadComments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [announcement.id, showComments]);

  const loadReactions = async () => {
    const res = await fetch(`/api/announcements/reactions?announcementId=${announcement.id}`);
    if (res.ok) setReactions(await res.json());
  };

  const loadComments = async () => {
    const res = await fetch(`/api/announcements/comments?announcementId=${announcement.id}`);
    if (res.ok) setComments(await res.json());
  };

  const toggleReaction = async (reactionType: string) => {
    if (!userEmail) return;
    const res = await fetch("/api/announcements/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcementId: announcement.id, reactionType })
    });
    if (res.ok) loadReactions();
  };

  const submitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/announcements/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId: announcement.id, content: newComment.trim() })
      });
      if (res.ok) {
        setNewComment("");
        loadComments();
      } else {
        throw new Error("Failed to post comment");
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to post comment", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (status === "Archived" && !pendingArchiveId) {
      setPendingArchiveId(announcement.id);
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: announcement.id, status })
      });
      if (res.ok) {
        onUpdate();
        toast({ title: "Success", description: "Status updated" });
      } else {
        throw new Error("Update failed");
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      setIsUpdatingStatus(false);
      setPendingArchiveId(null);
    }
  };

  return (
    <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl relative group flex flex-col gap-3">
      
      <AlertDialog open={!!pendingArchiveId} onOpenChange={(open) => !open && setPendingArchiveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure that this task or announcement is done?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => updateStatus("Archived")}>Confirm Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 rounded-l-xl" />
      
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary/60">
            From: {announcement.author_name}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(announcement.created_at))} ago
          </span>
        </div>
        <StatusBadge status={announcement.status || "Pending"} size="xs" />
      </div>
      
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
        {announcement.content}
      </p>

      {/* Action Bar (Reactions & Comments Toggle) */}
      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-primary/10">
        <TooltipProvider>
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-full border border-white/5">
            {REACTIONS.map(r => {
              const specificReactions = reactions.filter(x => x.reaction_type === r);
              const count = specificReactions.length;
              const hasReacted = specificReactions.some(x => x.user_email === userEmail);
              
              const buttonContent = (
                <button
                  key={r}
                  onClick={() => toggleReaction(r)}
                  className={cn(
                    "px-2 py-1 text-xs rounded-full transition-all flex items-center gap-1 hover:bg-white/10",
                    hasReacted && "bg-white/10 scale-110"
                  )}
                >
                  {r} {count > 0 && <span className="text-[10px] text-slate-300">{count}</span>}
                </button>
              );

              if (count === 0) return buttonContent;

              return (
                <Tooltip key={r} delayDuration={100}>
                  <TooltipTrigger asChild>
                    {buttonContent}
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-900 border-slate-800 text-slate-300">
                    <div className="flex flex-col gap-1.5 py-1">
                      {specificReactions.map((reaction, idx) => {
                        const { name, role } = getUserIdentity(reaction.user_email);
                        return (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-slate-200">{name}</span>
                            <span className="text-[10px] text-slate-500">({role})</span>
                          </div>
                        );
                      })}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors ml-auto"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {comments.length > 0 ? `${comments.length} Comments` : "Reply"}
        </button>
      </div>

      {/* Developer Workflow Status Actions */}
      {canDelete && (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {["Pending", "Ongoing Fix", "For Testing", "Completed", "Archived"].map((s) => {
            const isActive = (announcement.status || "Pending") === s;
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={isUpdatingStatus}
                className={cn(
                  "h-6 px-2 text-[10px] font-medium rounded-full border transition-all",
                  isActive
                    ? cn(cfg.bg, cfg.border, cfg.color, "shadow-sm")
                    : "bg-transparent border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="mt-2 flex flex-col gap-3 bg-black/20 p-3 rounded-lg border border-primary/10">
          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
            {comments.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-2">No comments yet</div>
            ) : (
              comments.map(c => (
                <div key={c.id} className="flex flex-col">
                  <span className="text-[10px] text-slate-500 mb-0.5">
                    {c.author_email?.split('@')[0]} • {formatDistanceToNow(new Date(c.created_at))} ago
                  </span>
                  <div className="text-xs text-slate-300 bg-white/5 p-2 rounded-md">
                    {c.content}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="relative mt-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submitComment()}
              placeholder="Write a reply..."
              className="w-full bg-black/40 border border-white/10 rounded-full pl-3 pr-10 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
            />
            <button
              onClick={submitComment}
              disabled={isSubmitting || !newComment.trim()}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-primary/70 hover:text-primary disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {canDelete && (
        <button
          onClick={async () => {
            if (confirm("Delete this announcement?")) {
              await onDelete(announcement.id);
            }
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:bg-red-500/10 rounded bg-background/80 backdrop-blur"
          title="Delete Announcement"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
