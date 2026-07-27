"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Printer,
  Calendar as CalendarIcon,
  Search,
  User,
  Users,
  Award,
  TrendingUp,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  PlusCircle,
  Percent,
  Sparkles,
  AlertCircle,
  UserPlus,
  Check,
  Flame,
  Shield,
  Crosshair,
  Handshake,
  HeartHandshake,
  Medal,
  Gem,
  Star,
  Crown,
  Trophy,
  PawPrint,
  Wrench
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { generateAccessoriesJobPDF } from "@/lib/generate-pdf"

export interface AssigneeShare {
  name: string
  percentage: number
}

export interface AccessoriesJobLog {
  id: string
  department: string
  unit: string
  plate_number: string
  assured_client: string
  date_started: string
  date_completed: string
  scope_of_works: string
  dept_head: string
  assignees: AssigneeShare[]
  created_at?: string
  created_by?: string
}

const AVATAR_COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", 
  "bg-cyan-500", "bg-blue-500", "bg-indigo-500", "bg-violet-500", 
  "bg-fuchsia-500", "bg-pink-500", "bg-rose-500"
]

export const getAvatarColor = (name: string) => {
  if (!name) return "bg-slate-500"
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export const getInitials = (name: string) => {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export const getMilestoneBadges = (totalUnits: number) => {
  const badges = []
  if (totalUnits >= 90) badges.push({ id: "mythic", icon: <Crown className="w-5 h-5 text-white" />, iconSmall: <Crown className="w-3 h-3 text-white" />, title: "Mythic Tier", desc: "90+ Units Completed", color: "bg-purple-600 border-purple-500 text-white" })
  if (totalUnits >= 80) badges.push({ id: "legend", icon: <Award className="w-5 h-5 text-white" />, iconSmall: <Award className="w-3 h-3 text-white" />, title: "Legend Tier", desc: "80+ Units Completed", color: "bg-yellow-500 border-yellow-400 text-white" })
  if (totalUnits >= 70) badges.push({ id: "grandmaster", icon: <Trophy className="w-5 h-5 text-white" />, iconSmall: <Trophy className="w-3 h-3 text-white" />, title: "Grandmaster Tier", desc: "70+ Units Completed", color: "bg-red-600 border-red-500 text-white" })
  if (totalUnits >= 60) badges.push({ id: "master", icon: <Star className="w-5 h-5 text-white" />, iconSmall: <Star className="w-3 h-3 text-white" />, title: "Master Tier", desc: "60+ Units Completed", color: "bg-orange-500 border-orange-400 text-white" })
  if (totalUnits >= 50) badges.push({ id: "diamond", icon: <Gem className="w-5 h-5 text-white" />, iconSmall: <Gem className="w-3 h-3 text-white" />, title: "Diamond Tier", desc: "50+ Units Completed", color: "bg-cyan-500 border-cyan-400 text-white" })
  if (totalUnits >= 40) badges.push({ id: "platinum", icon: <Medal className="w-5 h-5 text-white" />, iconSmall: <Medal className="w-3 h-3 text-white" />, title: "Platinum Tier", desc: "40+ Units Completed", color: "bg-slate-400 border-slate-300 text-white" })
  if (totalUnits >= 30) badges.push({ id: "gold", icon: <Medal className="w-5 h-5 text-amber-950" />, iconSmall: <Medal className="w-3 h-3 text-amber-950" />, title: "Gold Tier", desc: "30+ Units Completed", color: "bg-amber-400 border-amber-300 text-amber-950" })
  if (totalUnits >= 20) badges.push({ id: "silver", icon: <Medal className="w-5 h-5 text-zinc-900" />, iconSmall: <Medal className="w-3 h-3 text-zinc-900" />, title: "Silver Tier", desc: "20+ Units Completed", color: "bg-zinc-300 border-zinc-200 text-zinc-900" })
  if (totalUnits >= 10) badges.push({ id: "bronze", icon: <Medal className="w-5 h-5 text-white" />, iconSmall: <Medal className="w-3 h-3 text-white" />, title: "Bronze Tier", desc: "10+ Units Completed", color: "bg-orange-700 border-orange-600 text-white" })
  if (totalUnits >= 1) badges.push({ id: "iron", icon: <Medal className="w-5 h-5 text-stone-200" />, iconSmall: <Medal className="w-3 h-3 text-stone-200" />, title: "Iron Tier", desc: "1+ Units Completed", color: "bg-stone-700 border-stone-600 text-stone-100" })
  
  return badges.reverse() // Display lowest tier first, up to highest
}

export const getBehavioralBadges = (staff: { totalJobs: number, totalShareUnits: number, jobs: any[], name: string }) => {
  const badges: any[] = []
  
  if (staff.totalJobs === 0) return badges

  const averageShare = (staff.totalShareUnits / staff.totalJobs) * 100

  if (averageShare <= 40 && staff.totalJobs >= 10) {
    badges.push({
      id: "team-player",
      title: "The Team Player",
      desc: `Collaborated on ${staff.totalJobs} units!`,
      icon: <Handshake className="w-5 h-5 text-white" />,
      color: "bg-blue-600 border-blue-500",
      iconSmall: <Handshake className="w-3 h-3 text-white" />
    })
  }

  const soloJobs = staff.jobs.filter(j => {
    const share = (j.assignees || []).find((a: any) => a.name.toUpperCase() === staff.name.toUpperCase())?.percentage || 0
    return share === 100
  }).length

  // Lone Wolf takes priority over Specialist since it's a higher tier of solo work
  if (averageShare > 80 && staff.totalJobs >= 5) {
    badges.push({
      id: "lone-wolf",
      title: "The Lone Wolf",
      desc: `Completed ${staff.totalJobs} units mostly solo.`,
      icon: <PawPrint className="w-5 h-5 text-white" />,
      color: "bg-slate-800 border-slate-700",
      iconSmall: <PawPrint className="w-3 h-3 text-white" />
    })
  } else if (soloJobs >= 3) {
    badges.push({
      id: "specialist",
      title: "The Specialist",
      desc: `Mastered ${soloJobs} units entirely solo (100%).`,
      icon: <Wrench className="w-5 h-5 text-white" />,
      color: "bg-purple-600 border-purple-500",
      iconSmall: <Wrench className="w-3 h-3 text-white" />
    })
  }

  const assistJobs = staff.jobs.filter(j => {
    const share = (j.assignees || []).find((a: any) => a.name.toUpperCase() === staff.name.toUpperCase())?.percentage || 0
    return share > 0 && share <= 20
  }).length

  if (assistJobs >= 15) {
    badges.push({
      id: "ultimate-assist",
      title: "The Ultimate Assist",
      desc: `Provided crucial help on ${assistJobs} units!`,
      icon: <HeartHandshake className="w-5 h-5 text-white" />,
      color: "bg-pink-600 border-pink-500",
      iconSmall: <HeartHandshake className="w-3 h-3 text-white" />
    })
  }

  if (staff.totalJobs >= 20) {
    badges.push({
      id: "workhorse",
      title: "The Workhorse",
      desc: `Incredible activity touching ${staff.totalJobs} units!`,
      icon: <Flame className="w-5 h-5 text-white" />,
      color: "bg-emerald-600 border-emerald-500",
      iconSmall: <Flame className="w-3 h-3 text-white" />
    })
  }

  return badges
}

const COMMON_STAFF = ["Norello", "Aldos", "Ronnel", "Cabañez", "Jarry", "Raymund"]

export function AccessoriesJobLogs() {
  const { toast } = useToast()
  const [jobLogs, setJobLogs] = useState<AccessoriesJobLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  const [activeTab, setActiveTab] = useState<"logs" | "performance">("logs")
  const [searchQuery, setSearchQuery] = useState("")
  const [periodFilter, setPeriodFilter] = useState<"all" | "monthly" | "yearly">("all")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'))
  const [selectedSlips, setSelectedSlips] = useState<string[]>([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBadgeGuideOpen, setIsBadgeGuideOpen] = useState(false)
  const [viewingProfileName, setViewingProfileName] = useState<string | null>(null)
  const [viewingSlip, setViewingSlip] = useState<AccessoriesJobLog | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    department: string
    unit: string
    plate_number: string
    assured_client: string
    date_started: string
    date_completed: string
    scope_of_works: string
    dept_head: string
    assignees: AssigneeShare[]
  }>({
    department: "ACCESSORIES",
    unit: "",
    plate_number: "",
    assured_client: "",
    date_started: new Date().toISOString().split("T")[0],
    date_completed: new Date().toISOString().split("T")[0],
    scope_of_works: "",
    dept_head: "Cabañez",
    assignees: [
      { name: "Norello", percentage: 30 },
      { name: "Aldos", percentage: 30 },
      { name: "Ronnel", percentage: 40 }
    ]
  })

  useEffect(() => {
    fetchJobLogs()
  }, [])

  const fetchJobLogs = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/parts/accessories-jobs")
      if (res.ok) {
        const data = await res.json()
        setJobLogs(data)
      } else {
        fallbackToLocal()
      }
    } catch (e) {
      console.error("Fetch error:", e)
      fallbackToLocal()
    } finally {
      setIsLoading(false)
    }
  }

  const fallbackToLocal = () => {
    const local = localStorage.getItem("accessories_job_logs_local")
    const parsed = local ? JSON.parse(local) : []
    if (parsed.length >= 10) {
      setJobLogs(parsed)
    } else {
      const samples = [
        { id: crypto.randomUUID(), unit: "Toyota Hilux", plate_number: "ABC 123", assured_client: "Ryan Doe", date_started: "2026-07-20", date_completed: "2026-07-22", scope_of_works: "Install bedliner\nTint windows", assignees: [{name: "Norello", percentage: 50}, {name: "Aldos", percentage: 50}], department: "ACCESSORIES", dept_head: "Cabañez", created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), unit: "Honda Civic", plate_number: "XYZ 987", assured_client: "Jane Smith", date_started: "2026-07-21", date_completed: "2026-07-23", scope_of_works: "Audio system upgrade\nReverse camera installation", assignees: [{name: "Ronnel", percentage: 100}], department: "ACCESSORIES", dept_head: "Cabañez", created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), unit: "Ford Ranger", plate_number: "RNG 001", assured_client: "Mike Johnson", date_started: "2026-07-15", date_completed: "2026-07-18", scope_of_works: "Install bullbar\nLED light bars", assignees: [{name: "Norello", percentage: 40}, {name: "Jarry", percentage: 60}], department: "ACCESSORIES", dept_head: "Cabañez", created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), unit: "Mitsubishi Montero", plate_number: "MNT 555", assured_client: "Sarah Connor", date_started: "2026-07-18", date_completed: "2026-07-21", scope_of_works: "Seat covers\nDashcam installation", assignees: [{name: "Aldos", percentage: 100}], department: "ACCESSORIES", dept_head: "Cabañez", created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), unit: "Nissan Navara", plate_number: "NAV 222", assured_client: "Bruce Wayne", date_started: "2026-07-10", date_completed: "2026-07-14", scope_of_works: "Step boards\nRoof rack", assignees: [{name: "Raymund", percentage: 50}, {name: "Ronnel", percentage: 50}], department: "ACCESSORIES", dept_head: "Cabañez", created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), unit: "Toyota Fortuner", plate_number: "FRT 999", assured_client: "Bambang", date_started: "2026-07-22", date_completed: "2026-07-24", scope_of_works: "Deep cleaning\nCeramic coating", assignees: [{name: "Norello", percentage: 33}, {name: "Aldos", percentage: 33}, {name: "Ronnel", percentage: 34}], department: "ACCESSORIES", dept_head: "Cabañez", created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), unit: "Isuzu D-Max", plate_number: "DMX 111", assured_client: "Peter Parker", date_started: "2026-07-05", date_completed: "2026-07-08", scope_of_works: "Canopy installation", assignees: [{name: "Jarry", percentage: 100}], department: "ACCESSORIES", dept_head: "Cabañez", created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), unit: "Suzuki Jimny", plate_number: "JMN 444", assured_client: "Tony Stark", date_started: "2026-07-12", date_completed: "2026-07-15", scope_of_works: "Offroad tires\nSuspension lift", assignees: [{name: "Raymund", percentage: 100}], department: "ACCESSORIES", dept_head: "Cabañez", created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), unit: "Mitsubishi Strada", plate_number: "STR 777", assured_client: "Natasha Romanoff", date_started: "2026-07-19", date_completed: "2026-07-20", scope_of_works: "Window tinting", assignees: [{name: "Aldos", percentage: 100}], department: "ACCESSORIES", dept_head: "Cabañez", created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), unit: "Toyota Wigo", plate_number: "WIG 333", assured_client: "Steve Rogers", date_started: "2026-07-23", date_completed: "2026-07-24", scope_of_works: "Basic accessories package (mats, covers)", assignees: [{name: "Norello", percentage: 50}, {name: "Ronnel", percentage: 50}], department: "ACCESSORIES", dept_head: "Cabañez", created_at: new Date().toISOString() }
      ]
      setJobLogs(samples)
      localStorage.setItem("accessories_job_logs_local", JSON.stringify(samples))
    }
  }

  const handleAddAssignee = (staffName = "") => {
    if (staffName && formData.assignees.some(a => a.name.toLowerCase() === staffName.toLowerCase())) {
      toast({ title: "Already added", description: `${staffName} is already in the assignee list.` })
      return
    }
    setFormData(prev => ({
      ...prev,
      assignees: [...prev.assignees, { name: staffName, percentage: 0 }]
    }))
  }

  const handleRemoveAssignee = (index: number) => {
    setFormData(prev => ({
      ...prev,
      assignees: prev.assignees.filter((_, i) => i !== index)
    }))
  }

  const handleAssigneeChange = (index: number, field: "name" | "percentage", value: string | number) => {
    setFormData(prev => {
      const updated = [...prev.assignees]
      if (field === "name") {
        updated[index].name = value as string
      } else {
        updated[index].percentage = Math.max(0, Math.min(100, Number(value) || 0))
      }
      return { ...prev, assignees: updated }
    })
  }

  const totalPercentage = formData.assignees.reduce((acc, curr) => acc + (curr.percentage || 0), 0)

  const handleOpenNewModal = () => {
    setEditingId(null)
    setHasAttemptedSubmit(false)
    setFormData({
      department: "ACCESSORIES",
      unit: "",
      plate_number: "",
      assured_client: "",
      date_started: new Date().toISOString().split("T")[0],
      date_completed: new Date().toISOString().split("T")[0],
      scope_of_works: "",
      dept_head: "Cabañez",
      assignees: [
        { name: "Norello", percentage: 30 },
        { name: "Aldos", percentage: 30 },
        { name: "Ronnel", percentage: 40 }
      ]
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (log: AccessoriesJobLog) => {
    setEditingId(log.id)
    setHasAttemptedSubmit(false)
    setFormData({
      department: log.department || "ACCESSORIES",
      unit: log.unit || "",
      plate_number: log.plate_number || "",
      assured_client: log.assured_client || "",
      date_started: log.date_started || "",
      date_completed: log.date_completed || "",
      scope_of_works: log.scope_of_works || "",
      dept_head: log.dept_head || "Cabañez",
      assignees: Array.isArray(log.assignees) ? log.assignees : []
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    setHasAttemptedSubmit(true)
    if (!formData.unit.trim()) {
      toast({ title: "Validation Error", description: "Unit model is required (e.g. FORTUNER).", variant: "destructive" })
      return
    }
    if (!formData.plate_number.trim()) {
      toast({ title: "Validation Error", description: "Plate number is required (e.g. NBV 1524).", variant: "destructive" })
      return
    }
    if (!formData.scope_of_works.trim()) {
      toast({ title: "Validation Error", description: "Scope of works is required.", variant: "destructive" })
      return
    }
    
    if (formData.assignees.length > 0 && totalPercentage !== 100) {
      toast({ title: "Validation Error", description: `Total work share contribution must equal exactly 100%. (Current: ${totalPercentage}%)`, variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      let savedLog: AccessoriesJobLog

      if (editingId) {
        const res = await fetch("/api/parts/accessories-jobs", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...formData })
        })

        if (!res.ok) throw new Error("API update failed")
        savedLog = await res.json()

        setJobLogs(prev => prev.map(l => l.id === editingId ? savedLog : l))
      } else {
        const res = await fetch("/api/parts/accessories-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        })

        if (!res.ok) {
          savedLog = {
            id: crypto.randomUUID(),
            ...formData,
            created_at: new Date().toISOString()
          }
          const updated = [savedLog, ...jobLogs]
          setJobLogs(updated)
          localStorage.setItem("accessories_job_logs_local", JSON.stringify(updated))
        } else {
          savedLog = await res.json()
          setJobLogs(prev => [savedLog, ...prev])
        }
      }

      toast({ title: "Success", description: `Accessories job slip saved for ${formData.unit} (${formData.plate_number}).` })
      setIsModalOpen(false)
    } catch (e: any) {
      console.error("Save error:", e)
      const fallbackLog: AccessoriesJobLog = {
        id: editingId || crypto.randomUUID(),
        ...formData,
        created_at: new Date().toISOString()
      }
      const updated = editingId
        ? jobLogs.map(l => l.id === editingId ? fallbackLog : l)
        : [fallbackLog, ...jobLogs]
      setJobLogs(updated)
      localStorage.setItem("accessories_job_logs_local", JSON.stringify(updated))
      toast({ title: "Saved Locally", description: `Job log recorded locally.` })
      setIsModalOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, unitStr: string) => {
    if (!window.confirm(`Are you sure you want to delete the job record for ${unitStr}?`)) return

    try {
      await fetch(`/api/parts/accessories-jobs?id=${id}`, { method: "DELETE" })
    } catch (e) {
      console.error("Delete error:", e)
    }

    const updated = jobLogs.filter(l => l.id !== id)
    setJobLogs(updated)
    localStorage.setItem("accessories_job_logs_local", JSON.stringify(updated))
    toast({ title: "Deleted", description: "Record removed successfully." })
  }

  const handleToggleSlipSelection = (id: string) => {
    setSelectedSlips(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id)
      return [...prev, id]
    })
  }

  const handleBulkPrint = () => {
    if (selectedSlips.length === 0) {
      toast({ title: "Print Requirement", description: "Please select at least 1 job slip to proceed with printing.", variant: "destructive" })
      return
    }

    const logsToPrint = jobLogs.filter(l => selectedSlips.includes(l.id))
    
    const htmlContent = generateAccessoriesJobPDF(logsToPrint)
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({ title: "Popup Blocked", description: "Please allow popups to print the job slip.", variant: "destructive" })
      return
    }

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      setSelectedSlips([])
    }, 500)
  }

  const filteredLogs = useMemo(() => {
    return jobLogs.filter(log => {
      if (searchQuery.trim()) {
        const queryTokens = searchQuery.toLowerCase().split(/\s+/)
        const matchesAllTokens = queryTokens.every(token => {
          const matchesUnit = log.unit.toLowerCase().includes(token)
          const matchesPlate = log.plate_number.toLowerCase().includes(token)
          const matchesAssured = (log.assured_client || "").toLowerCase().includes(token)
          const matchesScope = log.scope_of_works.toLowerCase().includes(token)
          const matchesAssignee = (log.assignees || []).some(a => a.name.toLowerCase().includes(token))
          return matchesUnit || matchesPlate || matchesAssured || matchesScope || matchesAssignee
        })
        if (!matchesAllTokens) return false
      }

      if (periodFilter === "monthly") {
        if (!log.date_completed) return false
        const [year, month] = log.date_completed.split("-")
        if (year !== selectedYear || month !== selectedMonth) return false
      } else if (periodFilter === "yearly") {
        if (!log.date_completed) return false
        const [year] = log.date_completed.split("-")
        if (year !== selectedYear) return false
      }

      return true
    })
  }, [jobLogs, searchQuery, periodFilter, selectedYear, selectedMonth])

  const staffPerformance = useMemo(() => {
    const statsMap: Record<string, { name: string, totalJobs: number, totalShareUnits: number, jobs: AccessoriesJobLog[] }> = {}

    filteredLogs.forEach(log => {
      if (Array.isArray(log.assignees)) {
        log.assignees.forEach(a => {
          if (a.name && a.name.trim()) {
            const key = a.name.trim().toUpperCase()
            if (!statsMap[key]) {
              statsMap[key] = { name: a.name.trim(), totalJobs: 0, totalShareUnits: 0, jobs: [] }
            }
            statsMap[key].totalJobs += 1
            statsMap[key].totalShareUnits += (Number(a.percentage) || 0) / 100
            statsMap[key].jobs.push(log)
          }
        })
      }
    })

    return Object.values(statsMap).sort((a, b) => b.totalShareUnits - a.totalShareUnits)
  }, [filteredLogs])

  return (
    <div className="space-y-6 text-slate-900">
      {/* HEADER BANNER */}
      <div className="bg-[#0f172a] text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Badge className="bg-red-600 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Accessories Dept
            </Badge>
            <h2 className="text-2xl font-black tracking-tight text-white">Job Completion & Performance Log</h2>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">
            Manual completed unit slips, assignee work contribution splits, and staff leaderboard
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Sub-Tab Selector */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "logs"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Job Slips ({filteredLogs.length})
            </button>
            <button
              onClick={() => setActiveTab("performance")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "performance"
                  ? "bg-amber-500 text-slate-950 font-black shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Staff Leaderboard ({staffPerformance.length})
            </button>
            <button
              onClick={() => setIsBadgeGuideOpen(true)}
              className="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 text-yellow-500 hover:text-yellow-400 hover:bg-slate-700/50"
            >
              <Trophy className="w-3.5 h-3.5" />
              Badges Guide
            </button>
          </div>

          <Button onClick={handleOpenNewModal} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold gap-2 shadow-md shrink-0">
            <Plus className="w-4 h-4" />
            Log New Job Slip
          </Button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search unit, plate #, assured, scope, assignee..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 !bg-white border-slate-300 !text-slate-900 placeholder:text-slate-400 text-xs font-semibold h-10 shadow-xs focus-visible:ring-2 focus-visible:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span>Filter Period:</span>
          </div>

          <Select value={periodFilter} onValueChange={(v: any) => setPeriodFilter(v)}>
            <SelectTrigger className="w-[130px] !bg-white border-slate-300 !text-slate-900 text-xs font-bold h-10 shadow-xs focus:ring-2 focus:ring-blue-600">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 z-[100]">
              <SelectItem value="all" className="font-medium cursor-pointer !text-slate-900 hover:bg-slate-100">All-Time</SelectItem>
              <SelectItem value="monthly" className="font-medium cursor-pointer !text-slate-900 hover:bg-slate-100">Monthly</SelectItem>
              <SelectItem value="yearly" className="font-medium cursor-pointer !text-slate-900 hover:bg-slate-100">Yearly</SelectItem>
            </SelectContent>
          </Select>

          {periodFilter === "monthly" && (
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="w-[85px] !bg-white border-slate-300 !text-slate-900 text-xs font-bold h-10 shadow-xs"
                placeholder="Year"
              />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[115px] !bg-white border-slate-300 !text-slate-900 text-xs font-bold h-10 shadow-xs">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 z-[100]">
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = String(i + 1).padStart(2, '0')
                    const date = new Date(2026, i, 1)
                    return <SelectItem key={m} value={m} className="cursor-pointer !text-slate-900 hover:bg-slate-100 font-medium">{date.toLocaleString('en-US', { month: 'short' })}</SelectItem>
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {periodFilter === "yearly" && (
            <Input
              type="number"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-[85px] !bg-white border-slate-300 !text-slate-900 text-xs font-bold h-10 shadow-xs"
              placeholder="Year"
            />
          )}
        </div>
      </div>

      {/* BULK PRINT ACTION BAR */}
      {selectedSlips.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl flex items-center justify-between shadow-sm my-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-blue-800 text-sm font-bold">
            <Printer className="w-4 h-4" />
            <span>{selectedSlips.length} slip(s) selected for printing</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedSlips([])} className="text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 text-xs h-8">
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleBulkPrint} 
              disabled={selectedSlips.length === 0}
              className={`text-xs font-bold h-8 shadow-sm ${selectedSlips.length > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-300 text-white cursor-not-allowed'}`}
            >
              Print {selectedSlips.length} Slip{selectedSlips.length > 1 ? 's' : ''} (2 Copies Each)
            </Button>
          </div>
        </div>
      )}

      {/* TAB 1: JOB SLIPS */}
      {activeTab === "logs" && (
        <div>
          {isLoading ? (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="font-bold text-sm">Loading Accessories Job Slips...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">No Accessories Job Slips Logged</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                  {searchQuery ? `No matching records found for "${searchQuery}".` : "Start by logging completed vehicle unit works for Accessories & Parts staff."}
                </p>
              </div>
              <Button onClick={handleOpenNewModal} className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold gap-2 shadow-md">
                <Plus className="w-4 h-4" />
                Log New Accessories Slip
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLogs.map(log => (
                <div key={log.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 hover:shadow-md transition-shadow relative flex flex-col justify-between group">
                  <div className="space-y-3">
                    {/* Header: Unit & Dates */}
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <Badge className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1">
                          {log.department || 'ACCESSORIES'}
                        </Badge>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{log.unit}</h4>
                        <div className="inline-block mt-1 font-mono font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {log.plate_number}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Date Finished</span>
                        <span className="text-xs font-mono font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{log.date_completed}</span>
                      </div>
                    </div>

                    {/* Assured */}
                    {log.assured_client && (
                      <div className="text-xs text-slate-600">
                        <span className="font-bold text-slate-800">Assured / Client:</span> <span className="font-semibold text-slate-900">{log.assured_client}</span>
                      </div>
                    )}

                    {/* Scope of Works */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                      <span className="font-black text-slate-800 block uppercase text-[10px] tracking-wider mb-1">Scope of Works:</span>
                      <p className="text-slate-700 line-clamp-3 leading-relaxed whitespace-pre-wrap font-medium">{log.scope_of_works}</p>
                    </div>

                    {/* Assignees & Percentage Shares */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-600" /> Assignee Contribution Shares:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(log.assignees || []).map((a, idx) => (
                          <button
                            key={idx} 
                            onClick={(e) => { e.stopPropagation(); setViewingProfileName(a.name); }}
                            className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-300 font-bold pr-2.5 py-0.5 rounded-full flex items-center gap-1.5 text-slate-800 shadow-2xs transition-colors cursor-pointer"
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black ${getAvatarColor(a.name)} shadow-inner`}>
                              {getInitials(a.name)}
                            </div>
                            <span className="pl-0.5">{a.name}</span>
                            <span className="font-mono font-black text-blue-700 bg-white px-1.5 py-0.5 rounded-full border border-blue-200 text-[10px] ml-0.5">
                              {a.percentage}%
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Signature */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Dept Head: <strong className="text-slate-900 font-bold">{log.dept_head || 'Cabañez'}</strong>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button 
                        size="sm" 
                        variant={selectedSlips.includes(log.id) ? "default" : "outline"}
                        onClick={() => handleToggleSlipSelection(log.id)} 
                        title="Select for Bulk Printing" 
                        className={`h-8 text-xs font-bold gap-1 transition-all ${
                          selectedSlips.includes(log.id) 
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md ring-2 ring-blue-600 ring-offset-1" 
                            : "!bg-white border-blue-200 !text-blue-700 hover:!bg-blue-50"
                        }`}
                      >
                        <Printer className="w-3.5 h-3.5" /> 
                        {selectedSlips.includes(log.id) ? "Selected for Print" : "Select to Print"}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleOpenEditModal(log)} title="Edit Record" className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(log.id, `${log.unit} (${log.plate_number})`)} title="Delete Record" className="h-8 w-8 text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STAFF PERFORMANCE */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          {/* KPI STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-blue-100 rounded-xl text-blue-700">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Active Accessories Staff</span>
                <h3 className="text-3xl font-black text-slate-900">{staffPerformance.length}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-emerald-100 rounded-xl text-emerald-700">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Total Job Slips Logged</span>
                <h3 className="text-3xl font-black text-slate-900">{filteredLogs.length}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-amber-100 rounded-xl text-amber-800">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Total Work Contribution Units</span>
                <h3 className="text-3xl font-black text-slate-900 font-mono">
                  {staffPerformance.reduce((acc, curr) => acc + curr.totalShareUnits, 0).toFixed(1)} Units
                </h3>
              </div>
            </div>
          </div>

          {/* EMPLOYEE OF THE MONTH SPOTLIGHT */}
          {periodFilter === "monthly" && staffPerformance.length > 0 && (
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-[3px] rounded-2xl shadow-lg mb-6 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-slate-950 rounded-xl p-6 relative overflow-hidden flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="absolute -top-10 -right-10 p-4 opacity-10 pointer-events-none rotate-12">
                  <Award className="w-64 h-64 text-amber-400" />
                </div>
                
                <div className="w-24 h-24 bg-gradient-to-br from-amber-300 to-amber-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.3)] z-10 shrink-0 border-4 border-slate-900">
                  <span className="text-5xl">👑</span>
                </div>
                
                <div className="z-10 flex-1">
                  <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 font-black text-[10px] uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-2 border border-amber-500/30">
                    Employee of the Month
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight mb-1">{staffPerformance[0].name}</h2>
                  <p className="text-slate-400 font-medium text-sm">
                    Outstanding performance! Delivered a massive <strong className="text-amber-400 font-mono text-lg">{staffPerformance[0].totalShareUnits.toFixed(1)}</strong> equivalent full units this month across {staffPerformance[0].totalJobs} vehicles.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STAFF SCORECARD CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {staffPerformance.map((staff, idx) => (
              <div key={staff.name} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 relative shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-4">
                    <div className="relative cursor-pointer" onClick={() => setViewingProfileName(staff.name)}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-sm font-black text-white ${getAvatarColor(staff.name)}`}>
                        {getInitials(staff.name)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-sm font-black ${
                        idx === 0 ? "bg-amber-400 text-amber-950 ring-2 ring-white" : 
                        idx === 1 ? "bg-slate-300 text-slate-800 ring-2 ring-white" : 
                        idx === 2 ? "bg-orange-300 text-orange-950 ring-2 ring-white" : 
                        "bg-slate-800 text-white ring-2 ring-white"
                      }`}>
                        {idx === 0 ? "👑" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </div>
                    </div>
                    <div className="cursor-pointer group" onClick={() => setViewingProfileName(staff.name)}>
                      <h4 className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors text-lg leading-tight flex items-center gap-1.5">
                        {staff.name}
                        {getBehavioralBadges(staff).map(b => (
                          <Tooltip key={b.id}>
                            <TooltipTrigger asChild>
                              <span 
                                onClick={(e) => { e.stopPropagation(); setIsBadgeGuideOpen(true); }}
                                className={`text-[10px] ${b.color} text-white px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm cursor-pointer flex items-center justify-center hover:scale-110 transition-transform`}
                              >
                                {b.iconSmall}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent><strong className="block">{b.title}</strong>{b.desc}</TooltipContent>
                          </Tooltip>
                        ))}
                        {(() => {
                          const milestones = getMilestoneBadges(staff.totalShareUnits)
                          return milestones.map(milestone => (
                            <Tooltip key={milestone.id}>
                              <TooltipTrigger asChild>
                                <span 
                                  onClick={(e) => { e.stopPropagation(); setIsBadgeGuideOpen(true); }}
                                  className={`text-[10px] ${milestone.color} px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm cursor-pointer flex items-center justify-center hover:scale-110 transition-transform`}
                                >
                                  {milestone.iconSmall}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent><strong className="block">{milestone.title}</strong>{milestone.desc}</TooltipContent>
                            </Tooltip>
                          ))
                        })()}
                      </h4>
                      <span className="text-xs font-semibold text-slate-500">Accessories Specialist</span>
                    </div>
                  </div>
                  <Badge className={`font-mono font-extrabold text-xs px-2.5 py-1 ${idx === 0 ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
                    {staff.totalShareUnits.toFixed(1)} Units
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Vehicle Slips:</span>
                    <strong className="text-slate-900 font-mono font-extrabold text-sm">{staff.totalJobs} Slips</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Avg Share / Job:</span>
                    <strong className="text-blue-700 font-mono font-extrabold text-sm">
                      {staff.totalJobs > 0 ? ((staff.totalShareUnits / staff.totalJobs) * 100).toFixed(0) : 0}%
                    </strong>
                  </div>
                </div>

                {/* Monthly Target Progress */}
                {periodFilter === "monthly" && (
                  <div className="space-y-1.5 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Monthly Target (5 Units)</span>
                      <span className="text-xs font-mono font-black text-slate-700">
                        {Math.min((staff.totalShareUnits / 5) * 100, 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${staff.totalShareUnits >= 5 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                        style={{ width: `${Math.min((staff.totalShareUnits / 5) * 100, 100)}%` }}
                      />
                    </div>
                    {staff.totalShareUnits >= 5 && (
                      <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1 animate-pulse">
                        <CheckCircle2 className="w-3 h-3" /> Target Reached!
                      </p>
                    )}
                  </div>
                )}

                {/* Units List */}
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">Completed Vehicles Breakdown:</span>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {staff.jobs.map(job => {
                      const share = (job.assignees || []).find(a => a.name.toUpperCase() === staff.name.toUpperCase())?.percentage || 0
                      return (
                        <div 
                          key={job.id} 
                          onClick={() => setViewingSlip(job)}
                          className="flex items-center justify-between text-xs p-2 bg-slate-100 hover:bg-blue-100 hover:ring-1 hover:ring-blue-300 cursor-pointer transition-colors rounded-lg font-medium text-slate-800"
                        >
                          <span className="font-bold text-slate-900">{job.unit} <span className="font-mono text-slate-500 font-normal">({job.plate_number})</span></span>
                          <span className="font-mono font-black text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">{share}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW / EDIT JOB SLIP MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-white border-slate-200 shadow-2xl p-6 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-slate-900">
              <FileText className="w-5 h-5 text-blue-600" />
              {editingId ? "Edit Accessories Job Slip" : "Log New Accessories Job Slip"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Record completed unit works for Accessories & Parts Department. Matches the official paper job slip layout.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-extrabold uppercase text-slate-700">Department</Label>
                <Input
                  value={formData.department}
                  onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g. ACCESSORIES"
                  className="mt-1 uppercase !bg-white border-slate-300 !text-slate-900 font-bold shadow-xs focus:!bg-white"
                />
              </div>
              <div>
                <Label className="text-xs font-extrabold uppercase text-slate-700">Dept Head</Label>
                <Input
                  value={formData.dept_head}
                  onChange={e => setFormData(prev => ({ ...prev, dept_head: e.target.value }))}
                  placeholder="e.g. Cabañez"
                  className="mt-1 !bg-white border-slate-300 !text-slate-900 font-bold shadow-xs focus:!bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-extrabold uppercase text-slate-700">Unit Model *</Label>
                <Input
                  value={formData.unit}
                  onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="e.g. FORTUNER"
                  className="mt-1 font-black uppercase !bg-white border-slate-300 !text-slate-900 h-11 shadow-xs focus:!bg-white"
                />
              </div>
              <div>
                <Label className="text-xs font-extrabold uppercase text-slate-700">Plate # *</Label>
                <Input
                  value={formData.plate_number}
                  onChange={e => setFormData(prev => ({ ...prev, plate_number: e.target.value }))}
                  placeholder="e.g. NBV 1524"
                  className="mt-1 font-mono font-black uppercase !bg-white border-slate-300 !text-slate-900 h-11 shadow-xs focus:!bg-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-extrabold uppercase text-slate-700">Assured / Client Name</Label>
              <Input
                value={formData.assured_client}
                onChange={e => setFormData(prev => ({ ...prev, assured_client: e.target.value }))}
                placeholder="e.g. Bambang"
                className="mt-1 !bg-white border-slate-300 !text-slate-900 shadow-xs focus:!bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-extrabold uppercase text-slate-700">Date Started *</Label>
                <Input
                  type="date"
                  value={formData.date_started}
                  onChange={e => setFormData(prev => ({ ...prev, date_started: e.target.value }))}
                  className="mt-1 !bg-white border-slate-300 !text-slate-900 font-bold shadow-xs focus:!bg-white cursor-pointer"
                />
              </div>
              <div>
                <Label className="text-xs font-extrabold uppercase text-slate-700">Date Completed *</Label>
                <Input
                  type="date"
                  value={formData.date_completed}
                  onChange={e => setFormData(prev => ({ ...prev, date_completed: e.target.value }))}
                  className="mt-1 !bg-white border-slate-300 !text-slate-900 font-bold shadow-xs focus:!bg-white cursor-pointer"
                />
              </div>
            </div>

            {/* DYNAMIC ASSIGNEES SECTION */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" /> Assignees & Work Share Contribution (%)
                  </Label>
                  <p className="text-[11px] text-slate-500">Assign staff & set percentage contribution for this vehicle unit</p>
                </div>
                <Badge
                  className={`font-mono text-xs px-3 py-1 font-bold ${
                    totalPercentage === 100 || !hasAttemptedSubmit
                      ? "bg-emerald-600 text-white"
                      : "bg-red-600 text-white animate-pulse"
                  }`}
                >
                  Total: {totalPercentage}%
                </Badge>
              </div>

              {/* Quick Add Staff Badges */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Quick Add:</span>
                {COMMON_STAFF.map(staff => (
                  <button
                    key={staff}
                    type="button"
                    onClick={() => handleAddAssignee(staff)}
                    className="text-[11px] font-bold bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-300 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 text-slate-700"
                  >
                    <UserPlus className="w-3 h-3 text-blue-600" /> + {staff}
                  </button>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                {formData.assignees.map((assignee, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                    <Input
                      placeholder="Assignee Staff Name"
                      value={assignee.name}
                      onChange={e => handleAssigneeChange(idx, "name", e.target.value)}
                      className="flex-1 text-xs !bg-white border-slate-300 font-bold !text-slate-900 focus:!bg-white"
                    />
                    <div className="flex items-center gap-1 w-[120px]">
                      <Input
                        type="number"
                        placeholder="%"
                        value={assignee.percentage}
                        onChange={e => handleAssigneeChange(idx, "percentage", e.target.value)}
                        className={`text-xs font-mono font-black !bg-white focus:!bg-white ${
                          totalPercentage === 100 || !hasAttemptedSubmit
                            ? "border-slate-300 text-blue-700 focus:border-blue-500" 
                            : "border-red-400 text-red-600 focus:border-red-600 focus:ring-red-200"
                        }`}
                      />
                      <span className={`text-xs font-black ${totalPercentage === 100 || !hasAttemptedSubmit ? "text-slate-700" : "text-red-600"}`}>%</span>
                    </div>
                    {formData.assignees.length > 1 && (
                      <Button size="icon" variant="ghost" onClick={() => handleRemoveAssignee(idx)} className="h-8 w-8 text-red-500 hover:bg-red-50">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" size="sm" onClick={() => handleAddAssignee("")} className="gap-1.5 text-xs w-full border-dashed border-slate-300 font-bold !text-slate-800 !bg-white hover:!bg-slate-100 shadow-xs">
                <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                Add Custom Staff Member
              </Button>
            </div>

            {/* Scope of Works */}
            <div>
              <Label className="text-xs font-extrabold uppercase text-slate-700">Scope of Works *</Label>
              <Textarea
                rows={3}
                value={formData.scope_of_works}
                onChange={e => setFormData(prev => ({ ...prev, scope_of_works: e.target.value }))}
                placeholder="e.g. Remove and install Rear Bumper, Front Bumper, Radiator Grille, Foglamp"
                className="mt-1 text-xs !bg-white border-slate-300 !text-slate-900 font-medium leading-relaxed focus:!bg-white"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200 mt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="font-bold border-slate-300 !bg-white !text-slate-800 hover:!bg-slate-100 shadow-xs">Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold gap-2 px-5">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {editingId ? "Update Accessories Slip" : "Save Accessories Slip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW JOB SLIP MODAL */}
      <Dialog open={!!viewingSlip} onOpenChange={(open) => !open && setViewingSlip(null)}>
        <DialogContent className="max-w-xl bg-white border-slate-200 shadow-2xl p-6 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-slate-900">
              <FileText className="w-5 h-5 text-blue-600" />
              Job Slip Details
            </DialogTitle>
          </DialogHeader>
          
          {viewingSlip && (
            <div className="space-y-4 mt-2">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <Badge className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1">
                    {viewingSlip.department || 'ACCESSORIES'}
                  </Badge>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{viewingSlip.unit}</h4>
                  <div className="inline-block mt-1 font-mono font-black text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {viewingSlip.plate_number}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Date Finished</span>
                  <span className="text-sm font-mono font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{viewingSlip.date_completed}</span>
                </div>
              </div>

              {viewingSlip.assured_client && (
                <div className="text-sm text-slate-600 border-b border-slate-100 pb-4">
                  <span className="font-bold text-slate-800">Assured / Client:</span> <span className="font-semibold text-slate-900">{viewingSlip.assured_client}</span>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-sm">
                <span className="font-black text-slate-800 block uppercase text-[10px] tracking-wider mb-2">Scope of Works:</span>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">{viewingSlip.scope_of_works}</p>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-xs uppercase font-black tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" /> Assignee Contribution Shares:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(viewingSlip.assignees || []).map((a, idx) => (
                    <button
                      key={idx} 
                      onClick={() => setViewingProfileName(a.name)}
                      className="text-sm bg-slate-100 hover:bg-slate-200 border border-slate-300 font-bold pr-3 py-1 rounded-full flex items-center gap-2 text-slate-800 shadow-2xs transition-colors cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black ${getAvatarColor(a.name)} shadow-inner`}>
                        {getInitials(a.name)}
                      </div>
                      <span className="pl-0.5">{a.name}</span>
                      <span className="font-mono font-black text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200 text-xs ml-0.5">
                        {a.percentage}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-2">
                <span className="text-xs font-semibold text-slate-500">
                  Dept Head: <strong className="text-slate-900 font-bold">{viewingSlip.dept_head || 'Cabañez'}</strong>
                </span>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button onClick={() => setViewingSlip(null)} variant="outline" className="w-full font-bold">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* STAFF PROFILE MODAL */}
      <Dialog open={!!viewingProfileName} onOpenChange={(open) => !open && setViewingProfileName(null)}>
        <DialogContent className="max-w-md bg-white border-slate-200 shadow-2xl p-0 text-slate-900 overflow-hidden [&>button]:text-white [&>button]:opacity-100 hover:[&>button]:opacity-80 [&>button]:bg-white/10 hover:[&>button]:bg-white/20 [&>button]:p-1.5 [&>button]:rounded-full [&>button]:border [&>button]:border-white/20">
          {(() => {
            const profileStats = staffPerformance.find(s => s.name === viewingProfileName)
            if (!profileStats) return <div className="p-8 text-center text-slate-500 font-bold">Loading...</div>
            
            return (
              <>
                <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                  <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl shadow-xl font-black text-white ${getAvatarColor(profileStats.name)} border-4 border-slate-800 relative z-10`}>
                    {getInitials(profileStats.name)}
                  </div>
                  <h2 className="text-2xl font-black text-white mt-4 relative z-10 tracking-tight">{profileStats.name}</h2>
                  <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-1 relative z-10">Accessories Specialist</p>
                </div>
                
                <div className="p-6 space-y-6 bg-slate-50">
                  {/* Badges */}
                  <div className="flex justify-center gap-3 -mt-10 relative z-20">
                    {getBehavioralBadges(profileStats).map(b => (
                      <Tooltip key={b.id}>
                        <TooltipTrigger asChild>
                          <div 
                            onClick={() => setIsBadgeGuideOpen(true)}
                            className={`${b.color} border-2 text-white w-10 h-10 flex items-center justify-center rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform`}
                          >
                            {b.icon}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent><strong className="block">{b.title}</strong>{b.desc}</TooltipContent>
                      </Tooltip>
                    ))}
                    {(() => {
                      const milestones = getMilestoneBadges(profileStats.totalShareUnits)
                      return milestones.map(milestone => (
                        <Tooltip key={milestone.id}>
                          <TooltipTrigger asChild>
                            <div 
                              onClick={() => setIsBadgeGuideOpen(true)}
                              className={`${milestone.color} border-2 w-10 h-10 flex items-center justify-center rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform`}
                            >
                              {milestone.icon}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><strong className="block">{milestone.title}</strong>{milestone.desc}</TooltipContent>
                        </Tooltip>
                      ))
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-1">Total Unit Slips</span>
                      <strong className="text-slate-900 font-mono font-black text-2xl block">{profileStats.totalJobs}</strong>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-1">Total Contribution</span>
                      <strong className="text-blue-600 font-mono font-black text-2xl block">{profileStats.totalShareUnits.toFixed(1)} <span className="text-sm">Units</span></strong>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-3 border-b border-slate-100 pb-2">Recent Activity (Last 5)</span>
                    <div className="space-y-2">
                      {profileStats.jobs.slice(0, 5).map(job => {
                        const share = (job.assignees || []).find(a => a.name.toUpperCase() === profileStats.name.toUpperCase())?.percentage || 0
                        return (
                          <div key={job.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                            <span className="font-bold text-slate-800">{job.unit} <span className="font-mono text-slate-400 font-normal">({job.date_completed})</span></span>
                            <span className="font-mono font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{share}%</span>
                          </div>
                        )
                      })}
                      {profileStats.jobs.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-2 font-medium">No recent activity found.</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
      {/* GAMIFICATION BADGES GUIDE MODAL */}
      <Dialog open={isBadgeGuideOpen} onOpenChange={setIsBadgeGuideOpen}>
        <DialogContent className="max-w-2xl bg-slate-50 border-slate-200 shadow-2xl text-slate-900 p-0 overflow-hidden [&>button]:text-white hover:[&>button]:text-slate-200 hover:[&>button]:bg-white/10">
          <div className="p-6 bg-slate-900 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <Trophy className="w-12 h-12 text-yellow-500 mb-3 drop-shadow-sm relative z-10" />
            <h2 className="text-2xl font-black text-white tracking-tight relative z-10">Gamification Badges Guide</h2>
            <p className="text-slate-400 text-sm mt-1 text-center max-w-md font-medium relative z-10">
              Unlock these exclusive badges by hitting volume milestones and collaborating with your team!
            </p>
          </div>
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-8 bg-slate-50">
            
            {/* PLAYSTYLE BADGES */}
            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-slate-400" /> Playstyle Badges
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-4 hover:border-blue-400 transition-colors shadow-sm hover:shadow">
                  <div className="bg-blue-600 border-2 border-blue-500 text-white w-10 h-10 shrink-0 flex items-center justify-center rounded-full shadow-md"><Handshake className="w-5 h-5"/></div>
                  <div>
                    <strong className="block text-slate-900 font-extrabold">The Team Player</strong>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Collaborate on at least 10 units with an average share of 40% or less.</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-4 hover:border-slate-400 transition-colors shadow-sm hover:shadow">
                  <div className="bg-slate-800 border-2 border-slate-700 text-white w-10 h-10 shrink-0 flex items-center justify-center rounded-full shadow-md"><PawPrint className="w-5 h-5"/></div>
                  <div>
                    <strong className="block text-slate-900 font-extrabold">The Lone Wolf</strong>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Complete at least 5 units mostly solo (average share &gt; 80%).</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-4 hover:border-purple-400 transition-colors shadow-sm hover:shadow">
                  <div className="bg-purple-600 border-2 border-purple-500 text-white w-10 h-10 shrink-0 flex items-center justify-center rounded-full shadow-md"><Wrench className="w-5 h-5"/></div>
                  <div>
                    <strong className="block text-slate-900 font-extrabold">The Specialist</strong>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Master at least 3 units entirely solo (100% share).</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-4 hover:border-pink-400 transition-colors shadow-sm hover:shadow">
                  <div className="bg-pink-600 border-2 border-pink-500 text-white w-10 h-10 shrink-0 flex items-center justify-center rounded-full shadow-md"><HeartHandshake className="w-5 h-5"/></div>
                  <div>
                    <strong className="block text-slate-900 font-extrabold">The Ultimate Assist</strong>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Provide crucial help on at least 15 units with a &le; 20% share.</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-start gap-4 sm:col-span-2 hover:border-emerald-400 transition-colors shadow-sm hover:shadow">
                  <div className="bg-emerald-600 border-2 border-emerald-500 text-white w-10 h-10 shrink-0 flex items-center justify-center rounded-full shadow-md"><Flame className="w-5 h-5"/></div>
                  <div>
                    <strong className="block text-slate-900 font-extrabold">The Workhorse</strong>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Incredible overall activity! Touch at least 20 separate vehicles.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* MILESTONE RANKS */}
            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-slate-400" /> Milestone Ranks
              </h3>
              <div className="space-y-2">
                {[
                  { color: "bg-purple-600 border-purple-500", icon: <Crown className="w-5 h-5 text-white"/>, title: "Mythic Tier", req: "90+ Units", desc: "The absolute pinnacle of performance and consistency." },
                  { color: "bg-yellow-500 border-yellow-400", icon: <Award className="w-5 h-5 text-white"/>, title: "Legend Tier", req: "80+ Units", desc: "A legendary level of contribution and effort." },
                  { color: "bg-red-600 border-red-500", icon: <Trophy className="w-5 h-5 text-white"/>, title: "Grandmaster Tier", req: "70+ Units", desc: "Unrivaled mastery over the accessories department." },
                  { color: "bg-orange-500 border-orange-400", icon: <Star className="w-5 h-5 text-white"/>, title: "Master Tier", req: "60+ Units", desc: "Demonstrated exceptional skill and volume." },
                  { color: "bg-cyan-500 border-cyan-400", icon: <Gem className="w-5 h-5 text-white"/>, title: "Diamond Tier", req: "50+ Units", desc: "Flawless output over a long period." },
                  { color: "bg-slate-400 border-slate-300", icon: <Medal className="w-5 h-5 text-white"/>, title: "Platinum Tier", req: "40+ Units", desc: "Highly valuable, premium tier performance." },
                  { color: "bg-amber-400 border-amber-300", icon: <Medal className="w-5 h-5 text-amber-950"/>, title: "Gold Tier", req: "30+ Units", desc: "Setting the gold standard for your peers." },
                  { color: "bg-zinc-300 border-zinc-200", icon: <Medal className="w-5 h-5 text-zinc-900"/>, title: "Silver Tier", req: "20+ Units", desc: "Strong, dependable, and consistent work." },
                  { color: "bg-orange-700 border-orange-600", icon: <Medal className="w-5 h-5 text-white"/>, title: "Bronze Tier", req: "10+ Units", desc: "Earning your first stripes on the floor." },
                  { color: "bg-stone-700 border-stone-600", icon: <Medal className="w-5 h-5 text-stone-200"/>, title: "Iron Tier", req: "1+ Units", desc: "The journey begins. Forged your first unit!" },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow hover:border-slate-300 transition-all cursor-default">
                    <div className={`${m.color} border-2 w-10 h-10 shrink-0 flex items-center justify-center rounded-full shadow-md`}>
                      {m.icon}
                    </div>
                    <div className="flex-1">
                      <strong className="text-slate-900 block text-sm font-extrabold">{m.title}</strong>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">{m.desc}</p>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
                      {m.req}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
