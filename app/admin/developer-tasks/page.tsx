"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { 
  Loader2, Plus, Clock, CheckCircle2, PlayCircle, AlertCircle,
  Code2, Trash2, Calendar, User, ExternalLink, Rocket, Sparkles, Wand2, FileText,
  MessageSquare, Heart, ThumbsUp, Flame, Eye, ChevronLeft, RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { isDeveloperEmail } from "@/lib/auth";

interface TaskComment {
  id: string;
  task_id: string;
  author_email: string;
  content: string;
  created_at: string;
}

interface TaskReaction {
  id: string;
  task_id: string;
  user_email: string;
  reaction_type: string;
  created_at: string;
}

interface DeveloperTask {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  priority: string;
  status: "Pending" | "Ongoing Fix" | "For Testing" | "Completed" | "Archived";
  created_by: string;
  created_at: string;
  started_at: string | null;
  testing_at: string | null;
  completed_at: string | null;
  archived_at: string | null;
  updated_at: string;
}

const REACTIONS = ['👍', '❤️', '🔥', '👀'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; animate?: boolean }> = {
  "Pending":     { label: "Pending",     color: "text-slate-400",  bg: "bg-slate-500/20",  border: "border-slate-500/30" },
  "Ongoing Fix": { label: "Ongoing Fix", color: "text-amber-400",  bg: "bg-amber-500/20",  border: "border-amber-500/40", animate: true },
  "For Testing": { label: "For Testing", color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/40", animate: true },
  "Completed":   { label: "Completed",   color: "text-green-400",  bg: "bg-green-500/20",  border: "border-green-500/40" },
  "Archived":    { label: "Archived",    color: "text-zinc-500",   bg: "bg-zinc-700/20",   border: "border-zinc-600/30" },
  // Legacy aliases — existing DB rows use these older values
  "Ongoing":     { label: "Ongoing Fix", color: "text-amber-400",  bg: "bg-amber-500/20",  border: "border-amber-500/40", animate: true },
  "Done":        { label: "Completed",   color: "text-green-400",  bg: "bg-green-500/20",  border: "border-green-500/40" },
};

// Normalize old status strings so comparisons work consistently
function normalizeStatus(status: string): string {
  if (status === "Ongoing") return "Ongoing Fix";
  if (status === "Done")    return "Completed";
  return status;
}

function StatusBadge({ status: rawStatus, size = "sm" }: { status: string; size?: "sm" | "xs" }) {
  const status   = normalizeStatus(rawStatus);
  const cfg      = STATUS_CONFIG[status] ?? STATUS_CONFIG["Pending"];
  const isOngoing = status === "Ongoing Fix";
  const isTesting = status === "For Testing";

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border font-medium",
      cfg.bg, cfg.border, cfg.color,
      size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"
    )}>
      {/* animated dot / spinner per status */}
      {isOngoing && (
        <span className="relative flex h-2 w-2">
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", "bg-amber-400")} />
          <span className={cn("relative inline-flex rounded-full h-2 w-2", "bg-amber-400")} />
        </span>
      )}
      {isTesting && (
        <Loader2 className="w-2.5 h-2.5 animate-spin" />
      )}
      {!isOngoing && !isTesting && status === "Pending" && (
        <Clock className="w-2.5 h-2.5" />
      )}
      {status === "Completed" && (
        <CheckCircle2 className="w-2.5 h-2.5" />
      )}
      {status === "Archived" && (
        <span className="w-2 h-2 rounded-full bg-zinc-500" />
      )}
      {cfg.label}
    </span>
  );
}

export default function DeveloperTasksPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<DeveloperTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const [selectedTask, setSelectedTask] = useState<DeveloperTask | null>(null);
  
  const userEmail = session?.user?.email || "";
  const isDeveloper = isDeveloperEmail(userEmail);

  const [newTask, setNewTask] = useState({
    description: "",
    type: "New Feature",
    category: "System Enhancements",
    priority: "Medium",
    customType: "",
  });

  const [comments, setComments] = useState<TaskComment[]>([]);
  const [reactions, setReactions] = useState<TaskReaction[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [pendingArchiveTaskId, setPendingArchiveTaskId] = useState<string | null>(null);
  const [pendingGlobalRefresh, setPendingGlobalRefresh] = useState(false);

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishForm, setPublishForm] = useState({
    isOpen: false,
    version: "v1.1.0",
    title: "",
    summary: ""
  });
  const [releaseHistory, setReleaseHistory] = useState<any[]>([]);

  const loadSystemUpdates = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/system-updates");
      if (response.ok) {
        const data = await response.json();
        setReleaseHistory(data);
        if (data && data.length > 0 && data[0].version) {
          const latestVersion = data[0].version;
          const match = latestVersion.match(/v(\d+)\.(\d+)\.(\d+)/);
          if (match) {
            const nextVersion = `v${match[1]}.${match[2]}.${parseInt(match[3]) + 1}`;
            setPublishForm(prev => ({ ...prev, version: nextVersion }));
          }
        }
      }
    } catch (error) {
      console.error("Error loading system updates:", error);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch("/api/developer/tasks");
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/admin");
    } else if (sessionStatus === "authenticated") {
      loadTasks();
      loadSystemUpdates();
      
      const supabase = createClient();
      const channel = supabase
        .channel('developer-tasks-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'developer_tasks' }, () => { loadTasks(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments' }, () => { if(selectedTask) loadComments(selectedTask.id); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'task_reactions' }, () => { if(selectedTask) loadReactions(selectedTask.id); })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [sessionStatus, router, loadTasks, loadSystemUpdates, selectedTask]);

  const loadComments = async (taskId: string) => {
    try {
      const res = await fetch(`/api/developer/tasks/comments?taskId=${taskId}`);
      if (res.ok) {
        setComments(await res.json());
      }
    } catch (e) { console.error(e); }
  };

  const loadReactions = async (taskId: string) => {
    try {
      const res = await fetch(`/api/developer/tasks/reactions?taskId=${taskId}`);
      if (res.ok) {
        setReactions(await res.json());
      }
    } catch (e) { console.error(e); }
  };

  const selectTask = (task: DeveloperTask) => {
    setSelectedTask(task);
    loadComments(task.id);
    loadReactions(task.id);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.description) return;
    setIsSubmittingTask(true);
    try {
      const taskType = newTask.type === "Other" ? (newTask.customType || "Other") : newTask.type;
      const response = await fetch("/api/developer/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask.description.length > 200 ? newTask.description.slice(0, 200) + "..." : newTask.description,
          description: newTask.description,
          type: taskType,
          category: newTask.category,
          priority: newTask.priority
        }),
      });
      if (response.ok) {
        setNewTask({ description: "", type: "New Feature", category: "System Enhancements", priority: "Medium", customType: "" });
        toast({ title: "Task Created", description: "Request sent to the developer dashboard." });
        loadTasks();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const updateTaskStatus = async (id: string, status: string) => {
    if (status === "Archived" && pendingArchiveTaskId !== id) {
      setPendingArchiveTaskId(id);
      return;
    }

    try {
      const response = await fetch("/api/developer/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (response.ok) {
        toast({ title: `Task moved to ${status}` });
        loadTasks();
        if (selectedTask?.id === id) setSelectedTask({ ...selectedTask, status } as DeveloperTask);
      }
    } catch (error) { console.error(error); } finally {
      setPendingArchiveTaskId(null);
    }
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const res = await fetch("/api/developer/tasks/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: selectedTask.id, content: newComment })
      });
      if (res.ok) {
        setNewComment("");
        loadComments(selectedTask.id);
      }
    } catch (e) { console.error(e); } finally { setIsSubmittingComment(false); }
  };

  const toggleReaction = async (reactionType: string) => {
    if (!selectedTask) return;
    try {
      const res = await fetch("/api/developer/tasks/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: selectedTask.id, reactionType })
      });
      if (res.ok) {
        loadReactions(selectedTask.id);
      }
    } catch (e) { console.error(e); }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    try {
      const response = await fetch("/api/developer/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: publishForm.version,
          title: publishForm.title,
          summary: publishForm.summary
        }),
      });

      if (response.ok) {
        toast({ title: "Update Published! 🚀", description: "Admins will see the 'What's New' modal on their next visit." });
        setPublishForm({ ...publishForm, isOpen: false, version: "", title: "", summary: "" });
        loadTasks();
      } else {
        const error = await response.json();
        toast({ title: "Publish Failed", description: error.error, variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  };

  if (sessionStatus === "loading" || isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const filteredTasks = tasks.filter(t => filter === "All" || t.status === filter);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 max-w-7xl mx-auto space-y-6">
      <AlertDialog open={!!pendingArchiveTaskId} onOpenChange={(open) => !open && setPendingArchiveTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure that this task or announcement is done?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingArchiveTaskId && updateTaskStatus(pendingArchiveTaskId, "Archived")}>Confirm Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={pendingGlobalRefresh} onOpenChange={setPendingGlobalRefresh}>
        <AlertDialogContent className="bg-slate-900 border border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-400 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Force Global Refresh?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will instantly prompt all currently active admins to refresh their system. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                try {
                  const res = await fetch('/api/developer/global-refresh', { method: 'POST' })
                  if (res.ok) {
                    toast({ title: "Global Refresh Triggered", description: "All connected admins will be prompted to refresh." })
                  } else {
                    toast({ title: "Error", description: "Failed to trigger global refresh.", variant: "destructive" })
                  }
                } catch (e) {
                  toast({ title: "Error", description: "Network error triggering global refresh.", variant: "destructive" })
                }
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              Yes, Force Refresh
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-600/30">
            <Code2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Developer Tasks & Requests</h1>
            <p className="text-slate-400 text-sm">Manage system updates, bug fixes, and feature requests</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => {
              if (!isDeveloper) {
                toast({ 
                  title: "Access Denied", 
                  description: "You're not authorized to do this feature and only the developer can proceed with this.", 
                  variant: "destructive" 
                });
                return;
              }
              setPendingGlobalRefresh(true);
            }}
            className="bg-white/5 hover:bg-white/10 border border-white/20 text-blue-400 h-10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Force Refresh
          </Button>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white">
              <SelectItem value="All">All Tasks</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Ongoing Fix">Ongoing Fix</SelectItem>
              <SelectItem value="For Testing">For Testing</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Task List and Creation */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Request
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <Textarea 
                placeholder="Describe the issue or feature..."
                value={newTask.description}
                onChange={e => setNewTask({...newTask, description: e.target.value})}
                className="bg-black/50 border-white/10 focus:border-blue-500 text-sm resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <Select value={newTask.category} onValueChange={(v) => setNewTask({...newTask, category: v})}>
                  <SelectTrigger className="bg-black/50 border-white/10 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white text-xs">
                    <SelectItem value="Bug Reports">Bug Reports</SelectItem>
                    <SelectItem value="Feature Requests">Feature Requests</SelectItem>
                    <SelectItem value="System Enhancements">System Enhancements</SelectItem>
                    <SelectItem value="UI/UX Improvements">UI/UX Improvements</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({...newTask, priority: v})}>
                  <SelectTrigger className="bg-black/50 border-white/10 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white text-xs">
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isSubmittingTask || !newTask.description} className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs">
                {isSubmittingTask ? <Loader2 className="w-3 h-3 animate-spin" /> : "Submit Request"}
              </Button>
            </form>
          </div>

          {isDeveloper && (
            <>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                <h3 className="text-sm font-semibold text-purple-400 uppercase flex items-center gap-2">
                  <Rocket className="w-4 h-4" /> Publish Release
                </h3>
                <form onSubmit={handlePublish} className="space-y-3">
                  <Input placeholder="Version (e.g. v1.2.0)" value={publishForm.version} onChange={e => setPublishForm({...publishForm, version: e.target.value})} className="bg-black/50 border-white/10 text-xs h-8" required />
                  <Input placeholder="Release Title" value={publishForm.title} onChange={e => setPublishForm({...publishForm, title: e.target.value})} className="bg-black/50 border-white/10 text-xs h-8" required />
                  <Textarea placeholder="Release Summary..." value={publishForm.summary} onChange={e => setPublishForm({...publishForm, summary: e.target.value})} className="bg-black/50 border-white/10 text-xs resize-none" required />
                  <Button type="submit" disabled={isPublishing} className="w-full bg-purple-600 hover:bg-purple-700 h-8 text-xs">
                    {isPublishing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Publish to Admins"}
                  </Button>
                </form>
              </div>

              {releaseHistory.length > 0 && (
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Recent Releases
                  </h3>
                  <div className="space-y-3">
                    {releaseHistory.slice(0, 5).map((release) => (
                      <div key={release.id} className="border-l-2 border-purple-500 pl-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-400">{release.version}</span>
                          <span className="text-[10px] text-slate-500">{formatDistanceToNow(new Date(release.published_at), { addSuffix: true })}</span>
                        </div>
                        <p className="text-xs font-medium text-white mt-1 truncate">{release.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar space-y-2 pr-2">
            {filteredTasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => selectTask(task)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/10",
                  selectedTask?.id === task.id ? "bg-white/10 border-blue-500/50" : "bg-white/5 border-white/10"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold text-blue-400">{task.category}</span>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full",
                    task.priority === 'Critical' ? "bg-red-500/20 text-red-400" :
                    task.priority === 'High' ? "bg-orange-500/20 text-orange-400" :
                    task.priority === 'Medium' ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"
                  )}>{task.priority}</span>
                </div>
                <h4 className="text-sm text-slate-200 font-medium whitespace-pre-wrap">{task.description}</h4>
                <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500">
                  <StatusBadge status={task.status} size="xs" />
                  <span>{formatDistanceToNow(new Date(task.created_at))} ago</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Task Details and Chat */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl flex flex-col h-[80vh] overflow-hidden">
          {selectedTask ? (
            <>
              {/* Task Header */}
              <div className="p-6 border-b border-white/10 bg-black/20">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{selectedTask.title}</h2>
                    <p className="text-xs text-slate-400 mt-1">Requested by {selectedTask.created_by}</p>
                  </div>
                  <div className="flex gap-2">
                    {REACTIONS.map(r => {
                      const count = reactions.filter(rx => rx.reaction_type === r).length;
                      const userReacted = reactions.some(rx => rx.reaction_type === r && rx.user_email === userEmail);
                      return (
                        <button 
                          key={r} onClick={() => toggleReaction(r)}
                          className={cn("px-2 py-1 text-xs rounded-full border transition", userReacted ? "bg-blue-600/30 border-blue-500 text-white" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10")}
                        >
                          {r} {count > 0 && count}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap bg-black/40 p-4 rounded-lg border border-white/5">{selectedTask.description}</p>
                
                {/* Status Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5 flex-wrap">
                  <span className="text-xs text-slate-500 mr-2">Workflow:</span>
                  {["Pending", "Ongoing Fix", "For Testing", "Completed", "Archived"].map((s) => {
                    const cfg = STATUS_CONFIG[s];
                    const isActive = normalizeStatus(selectedTask.status) === s;
                    const isOngoing = s === "Ongoing Fix";
                    const isTesting = s === "For Testing";
                    return (
                      <button
                        key={s}
                        onClick={() => updateTaskStatus(selectedTask.id, s)}
                        className={cn(
                          "h-7 px-3 text-[11px] font-medium rounded-full border transition-all flex items-center gap-1.5",
                          isActive
                            ? cn(cfg.bg, cfg.border, cfg.color, "shadow-sm")
                            : "bg-transparent border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
                        )}
                      >
                        {isActive && isOngoing && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                          </span>
                        )}
                        {isActive && isTesting && <Loader2 className="w-3 h-3 animate-spin" />}
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {comments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                    <MessageSquare className="w-8 h-8 mb-2" />
                    <p className="text-sm">No comments yet. Start the discussion!</p>
                  </div>
                ) : (
                  comments.map(c => {
                    const isMe = c.author_email === userEmail;
                    return (
                      <div key={c.id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                        <span className="text-[10px] text-slate-500 mb-1">{c.author_email.split('@')[0]} • {formatDistanceToNow(new Date(c.created_at))} ago</span>
                        <div className={cn("px-4 py-2 rounded-2xl text-sm", isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white/10 text-slate-200 rounded-bl-none")}>
                          {c.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t border-white/10 bg-black/20">
                <form onSubmit={postComment} className="flex gap-2">
                  <Input 
                    placeholder="Type a comment or question..." 
                    value={newComment} onChange={e => setNewComment(e.target.value)}
                    className="bg-black/50 border-white/10"
                  />
                  <Button type="submit" disabled={!newComment.trim() || isSubmittingComment} className="bg-blue-600 hover:bg-blue-700">
                    {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Code2 className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a task from the left to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
