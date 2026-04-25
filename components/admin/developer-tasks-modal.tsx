"use client";

import { useState, useEffect, useCallback } from "react";
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
  Loader2, 
  Plus, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  AlertCircle,
  Code2,
  Trash2,
  Calendar,
  User,
  ExternalLink,
  Rocket,
  Sparkles,
  Wand2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface DeveloperTask {
  id: string;
  title: string;
  description: string;
  type: "Bug Fix" | "New Feature" | "Improvement" | "Utility" | "Other" | string;
  status: "Pending" | "Ongoing" | "Done";
  created_by: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

interface DeveloperTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  isDeveloper: boolean;
}

export function DeveloperTasksModal({
  isOpen,
  onClose,
  userEmail,
  isDeveloper,
}: DeveloperTasksModalProps) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<DeveloperTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<string>("All");
  
  const [newTask, setNewTask] = useState({
    description: "",
    type: "New Feature",
    customType: "",
  });

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishForm, setPublishForm] = useState({
    isOpen: false,
    version: "",
    title: "",
    summary: ""
  });

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
    if (isOpen) {
      loadTasks();
      
      // Setup Real-time subscription
      const supabase = createClient();
      const channel = supabase
        .channel('developer-tasks-realtime')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'developer_tasks' },
          () => {
            loadTasks(); // Simple refresh for real-time
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, loadTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.description) return;

    setIsSubmitting(true);
    try {
      const taskType = newTask.type === "Other" ? (newTask.customType || "Other (Custom)") : newTask.type;
      
      const response = await fetch("/api/developer/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask.description.slice(0, 100), // Use first 100 chars as title
          description: newTask.description,
          type: taskType
        }),
      });

      if (response.ok) {
        setNewTask({ description: "", type: "New Feature", customType: "" });
        toast({
          title: "Task Created",
          description: "Request sent to the developer dashboard.",
        });
        loadTasks();
      }
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTaskStatus = async (id: string, status: "Pending" | "Ongoing" | "Done") => {
    try {
      const response = await fetch("/api/developer/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        toast({
          title: `Task moved to ${status}`,
          description: status === "Ongoing" ? "Happy coding! 🚀" : "Great job! ✅",
        });
        loadTasks();
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const deleteTask = async (id: string) => {
    if (!window.confirm("Delete this request permanent?")) return;
    try {
      const response = await fetch("/api/developer/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        toast({ title: "Task Deleted" });
        loadTasks();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const handleGenerateWithAI = async () => {
    const unpublishedDoneTasks = tasks.filter(t => t.status === "Done" && !(t as any).update_id);
    if (unpublishedDoneTasks.length === 0) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/developer/generate-release-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: unpublishedDoneTasks }),
      });

      if (response.ok) {
        const data = await response.json();
        setPublishForm(prev => ({
          ...prev,
          title: data.title || prev.title,
          summary: data.summary || prev.summary
        }));
        toast({ title: "AI Generated! ✨", description: "Release notes have been drafted based on your tasks." });
      }
    } catch (error) {
      console.error("Error generating notes:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const incrementVersion = (current: string, tasksToPublish: DeveloperTask[]) => {
    try {
      // Remove 'v' if present
      const clean = current.replace(/^v/, '');
      const parts = clean.split('.').map(Number);
      
      if (parts.length !== 3 || parts.some(isNaN)) return `v${current}.1`;

      let [major, minor, patch] = parts;

      // Determine bump type
      const hasFeatures = tasksToPublish.some(t => t.type === "New Feature");
      
      if (hasFeatures) {
        minor += 1;
        patch = 0;
      } else {
        patch += 1;
      }

      return `v${major}.${minor}.${patch}`;
    } catch {
      return "v1.0.0";
    }
  };

  const prepareRelease = async () => {
    const unpublishedDoneTasks = tasks.filter(t => t.status === "Done" && !(t as any).update_id);
    
    if (unpublishedDoneTasks.length === 0) {
      toast({ title: "Nothing to publish", description: "All completed tasks are already published.", variant: "destructive" });
      return;
    }

    try {
      // 1. Fetch latest version
      const res = await fetch("/api/admin/system-updates/latest");
      const latestUpdate = await res.json();
      const currentVersion = latestUpdate?.version || "1.0.0";
      
      // 2. Suggest new version
      const suggestedVersion = incrementVersion(currentVersion, unpublishedDoneTasks);
      
      setPublishForm({
        ...publishForm,
        isOpen: true,
        version: suggestedVersion,
        title: "",
        summary: ""
      });
    } catch (error) {
      console.error("Error preparing release:", error);
      setPublishForm({ ...publishForm, isOpen: true, version: "v1.0.0" });
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    const unpublishedDoneTasks = tasks.filter(t => t.status === "Done" && !(t as any).update_id);
    
    if (unpublishedDoneTasks.length === 0) {
      toast({ title: "Nothing to publish", description: "All completed tasks are already published.", variant: "destructive" });
      return;
    }

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
      console.error("Error publishing update:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredTasks = tasks.filter(task => 
    filter === "All" ? true : task.status === filter
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "Ongoing": return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "Done": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Bug Fix": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "New Feature": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Improvement": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "Utility": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-hidden flex flex-col bg-slate-950 border-white/10 text-white p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-600/30">
                <Code2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">Developer Tasks</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Manage system updates, bug fixes, and feature requests for Javier.
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[130px] bg-white/5 border-white/10 h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="All">All Tasks</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Done">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 min-h-0 custom-scrollbar">
          {/* Publish Update Section (Developer Only) */}
          {isDeveloper && (
            <section className="animate-in slide-in-from-top-4 duration-500">
              {!publishForm.isOpen ? (
                <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 p-4 rounded-xl border border-blue-500/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Rocket className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-blue-100">
                        {tasks.filter(t => t.status === "Done" && !(t as any).update_id).length === 0 ? "System Synchronized" : "Ready to Publish Update?"}
                      </h4>
                      <p className="text-xs text-blue-400 font-medium">
                        {tasks.filter(t => t.status === "Done" && !(t as any).update_id).length === 0 
                          ? "All completed tasks have been published to the team."
                          : `You have ${tasks.filter(t => t.status === "Done" && !(t as any).update_id).length} completed tasks ready for release.`}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={prepareRelease}
                    size="sm" 
                    disabled={tasks.filter(t => t.status === "Done" && !(t as any).update_id).length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 disabled:bg-slate-800 disabled:text-slate-500"
                  >
                    {tasks.filter(t => t.status === "Done" && !(t as any).update_id).length === 0 ? "System Up to Date" : "Prepare Release"}
                  </Button>
                </div>
              ) : (
                <div className="bg-slate-900 border border-blue-500/50 rounded-xl p-6 space-y-6 shadow-2xl shadow-blue-900/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black tracking-tight text-blue-400 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Release New Update
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        onClick={handleGenerateWithAI}
                        disabled={isGenerating}
                        className="h-8 bg-purple-600/10 border-purple-500/20 text-purple-400 hover:bg-purple-600 hover:text-white transition-all gap-2"
                      >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                        {isGenerating ? "Analyzing..." : "Suggest with AI"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setPublishForm({...publishForm, isOpen: false})} className="text-slate-500 h-8">Cancel</Button>
                    </div>
                  </div>

                  <form onSubmit={handlePublish} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Version Tag</Label>
                            <Input 
                                placeholder="v1.2.0" 
                                value={publishForm.version}
                                onChange={(e) => setPublishForm({...publishForm, version: e.target.value})}
                                required
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="sm:col-span-2 space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Release Title</Label>
                            <Input 
                                placeholder="The Performance Update" 
                                value={publishForm.title}
                                onChange={(e) => setPublishForm({...publishForm, title: e.target.value})}
                                required
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Release Summary (Optional)</Label>
                        <Textarea 
                            placeholder="A brief summary of what's new..." 
                            value={publishForm.summary}
                            onChange={(e) => setPublishForm({...publishForm, summary: e.target.value})}
                            className="bg-white/5 border-white/10 resize-none h-20"
                        />
                    </div>
                    <Button 
                        type="submit" 
                        disabled={isPublishing} 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 gap-2 shadow-lg shadow-blue-600/20"
                    >
                        {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Rocket className="w-5 h-5" /> Publish to all Admins</>}
                    </Button>
                  </form>
                </div>
              )}
            </section>
          )}

          {/* Create Task Section (Admin Only - though here all authorized share it) */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create New Request
            </h3>
            <form onSubmit={handleCreateTask} className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
              <div className="space-y-3">
                <Textarea 
                  placeholder="Task description (e.g. Add dark mode to reports, fix the alignment in dashboard...)" 
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="bg-transparent border-white/10 focus:border-blue-500 transition-colors min-h-[100px] w-full resize-none"
                />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-white/5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto flex-1">
                    <div className="w-full sm:w-[200px]">
                      <Select 
                        value={newTask.type} 
                        onValueChange={(val: any) => setNewTask({...newTask, type: val})}
                      >
                        <SelectTrigger className="bg-slate-900/50 border-white/10 h-10 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                          <SelectItem value="Bug Fix">Bug Fix</SelectItem>
                          <SelectItem value="New Feature">New Feature</SelectItem>
                          <SelectItem value="Improvement">Improvement</SelectItem>
                          <SelectItem value="Utility">Utility</SelectItem>
                          <SelectItem value="Other">Other (Custom)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newTask.type === "Other" && (
                      <Input 
                        placeholder="Specify type..." 
                        value={newTask.customType}
                        onChange={(e) => setNewTask({...newTask, customType: e.target.value})}
                        className="bg-slate-900/50 border-white/10 h-10 text-xs flex-1 min-w-[150px]"
                      />
                    )}
                  </div>

                  <Button type="submit" disabled={isSubmitting || !newTask.description} className="w-full sm:w-[140px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 h-10">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request Task"}
                  </Button>
                </div>
              </div>
            </form>
          </section>

          {/* Tasks List */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Activities
            </h3>
            
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center opacity-50">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Loading developer queue...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="py-20 text-center bg-white/5 rounded-xl border border-dashed border-white/10">
                <p className="text-slate-500">No tasks found in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={cn(
                      "group relative bg-white/5 border border-white/10 rounded-xl p-4 transition-all hover:bg-white/[0.07] hover:border-white/20",
                      task.status === "Ongoing" && "border-blue-500/50 bg-blue-500/[0.02]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", getTypeColor(task.type))}>
                            {task.type.toUpperCase()}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                            {getStatusIcon(task.status)}
                            {task.status}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-200">{task.description}</h4>
                        <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {task.created_by.split('@')[0]}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                          </div>
                          {task.started_at && (
                            <div className="flex items-center gap-1 text-blue-400/80">
                              <PlayCircle className="w-3 h-3" /> Started {formatDistanceToNow(new Date(task.started_at), { addSuffix: true })}
                            </div>
                          )}
                          {task.completed_at && (
                            <div className="flex items-center gap-1 text-green-400/80">
                              <CheckCircle2 className="w-3 h-3" /> Done {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isDeveloper && (
                          <>
                            {task.status === "Pending" && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => updateTaskStatus(task.id, "Ongoing")}
                                className="h-8 bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white"
                              >
                                Start Work
                              </Button>
                            )}
                            {task.status === "Ongoing" && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => updateTaskStatus(task.id, "Done")}
                                className="h-8 bg-green-600/10 border-green-500/20 text-green-400 hover:bg-green-600 hover:text-white"
                              >
                                Complete
                              </Button>
                            )}
                            {task.status === "Done" && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => updateTaskStatus(task.id, "Pending")}
                                className="h-8 text-slate-400 opacity-50 group-hover:opacity-100"
                              >
                                Restore
                              </Button>
                            )}
                          </>
                        )}
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => deleteTask(task.id)}
                          className="h-8 w-8 text-red-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="p-4 bg-slate-900/50 border-t border-white/5 text-[10px] text-slate-500 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Synchronization Active
            </div>
            <div>
                Tasks or tickets for Javier
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
