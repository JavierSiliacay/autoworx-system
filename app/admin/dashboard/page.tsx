"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import {
  Wrench,
  LogOut,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Car,
  User,
  RefreshCw,
  Trash2,
  Settings2,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, X, Plus, DollarSign, Receipt, ImageIcon, Archive, History, FileText, Download } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { VEHICLE_BRANDS, REPAIR_STATUS_OPTIONS, REPAIR_PARTS, COST_ITEM_TYPES, type RepairStatus, type CostItem, type CostingData, type CostItemType } from "@/lib/constants"
import { getRepairStatusInfo } from "@/lib/appointment-tracking"
import { ImageZoomModal } from "@/components/ui/image-zoom-modal"

// Database response interface (snake_case from Supabase)
interface AppointmentDB {
  id: string
  tracking_code: string
  name: string
  email: string
  phone: string
  vehicle_make: string
  vehicle_model: string
  vehicle_year: string
  vehicle_plate: string
  service: string
  preferred_date: string
  message: string
  status: "pending" | "contacted" | "completed"
  created_at: string
  repair_status?: RepairStatus
  current_repair_part?: string
  status_updated_at?: string
  costing?: CostingData
  damage_images?: string[]
  orcr_image?: string
}

// Frontend interface (camelCase)
interface Appointment {
  id: string
  trackingCode: string
  name: string
  email: string
  phone: string
  vehicleMake: string
  vehicleModel: string
  vehicleYear: string
  vehiclePlate: string
  service: string
  preferredDate: string
  message: string
  status: "pending" | "contacted" | "completed"
  createdAt: string
  repairStatus?: RepairStatus
  currentRepairPart?: string
  statusUpdatedAt?: string
  costing?: CostingData
  damageImages?: string[]
  orcrImage?: string
}

// History interface
interface HistoryRecord {
  id: string
  original_id: string
  tracking_code: string
  name: string
  email: string
  phone: string
  vehicle_make: string
  vehicle_model: string
  vehicle_year: string
  vehicle_plate: string
  service: string
  preferred_date: string
  message: string
  final_status: string
  repair_status: string
  current_repair_part: string
  costing: CostingData
  original_created_at: string
  completed_at: string
  archived_at: string
  archived_reason: string
}

// Helper to convert DB response to frontend format
function dbToFrontend(apt: AppointmentDB): Appointment {
  return {
    id: apt.id,
    trackingCode: apt.tracking_code,
    name: apt.name,
    email: apt.email,
    phone: apt.phone,
    vehicleMake: apt.vehicle_make,
    vehicleModel: apt.vehicle_model,
    vehicleYear: apt.vehicle_year,
    vehiclePlate: apt.vehicle_plate,
    service: apt.service,
    preferredDate: apt.preferred_date,
    message: apt.message,
    status: apt.status,
    createdAt: apt.created_at,
    repairStatus: apt.repair_status,
    currentRepairPart: apt.current_repair_part,
    statusUpdatedAt: apt.status_updated_at,
    costing: apt.costing,
    damageImages: apt.damage_images,
    orcrImage: apt.orcr_image,
  }
}

const statusConfig = {
  pending: {
    label: "Pending",
    icon: AlertCircle,
    variant: "secondary" as const,
  },
  contacted: {
    label: "Contacted",
    icon: Phone,
    variant: "outline" as const,
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    variant: "default" as const,
  },
}

const dateRanges = [
  { label: "All Time", value: "all" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
]

const vehicleBrands = VEHICLE_BRANDS

export default function AdminDashboard() {
  const router = useRouter()
  const { status, data: session } = useSession()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filter, setFilter] = useState<"all" | "pending" | "contacted" | "completed">("all")
  const [vehicleBrandFilter, setVehicleBrandFilter] = useState<string>("all")
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [zoomModalOpen, setZoomModalOpen] = useState(false)
  const [zoomImages, setZoomImages] = useState<string[]>([])
  const [zoomInitialIndex, setZoomInitialIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<"appointments" | "history">("appointments")
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [archiveAppointmentId, setArchiveAppointmentId] = useState<string | null>(null)
  const [archiveReason, setArchiveReason] = useState("")

  // History search, filter, and sort states
  const [historySearchQuery, setHistorySearchQuery] = useState<string>("")
  const [historyServiceFilter, setHistoryServiceFilter] = useState<string>("all")
  const [historyDateRangeFilter, setHistoryDateRangeFilter] = useState<string>("all")
  const [historySortBy, setHistorySortBy] = useState<"latest" | "oldest" | "status" | "name">("latest")

  // Custom repair part input states
  const [useCustomRepairPart, setUseCustomRepairPart] = useState<Record<string, boolean>>({})

  const loadAppointments = useCallback(async () => {
    try {
      const response = await fetch("/api/appointments")
      if (response.ok) {
        const data = await response.json() as AppointmentDB[]
        const converted = data.map(dbToFrontend)
        setAppointments(converted)
      }
    } catch (error) {
      console.error("Error loading appointments:", error)
    }
    setIsLoading(false)
  }, [])

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true)
    try {
      const response = await fetch("/api/history")
      if (response.ok) {
        const data = await response.json() as HistoryRecord[]
        setHistoryRecords(data)
      }
    } catch (error) {
      console.error("Error loading history:", error)
    }
    setIsLoadingHistory(false)
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin")
      return
    }
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/admin")
      return
    }

    if (status === "authenticated") loadAppointments()
  }, [router, loadAppointments, status, session?.user?.role])

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin" })
  }

  const updateStatus = async (id: string, newStatus: "pending" | "contacted" | "completed") => {
    const updated = appointments.map((apt) =>
      apt.id === id ? { ...apt, status: newStatus } : apt
    )
    setAppointments(updated)

    await fetch("/api/appointments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    })
  }

  const updateRepairStatus = async (id: string, repairStatus: RepairStatus) => {
    const statusUpdatedAt = new Date().toISOString()
    const updated = appointments.map((apt) =>
      apt.id === id
        ? {
          ...apt,
          repairStatus,
          statusUpdatedAt,
        }
        : apt
    )
    setAppointments(updated)

    await fetch("/api/appointments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, repairStatus, statusUpdatedAt }),
    })
  }

  const updateCurrentRepairPart = async (id: string, currentRepairPart: string) => {
    const statusUpdatedAt = new Date().toISOString()
    const updated = appointments.map((apt) =>
      apt.id === id
        ? {
          ...apt,
          currentRepairPart,
          statusUpdatedAt,
        }
        : apt
    )
    setAppointments(updated)

    await fetch("/api/appointments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, currentRepairPart, statusUpdatedAt }),
    })
  }

  const deleteAppointment = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this appointment? This cannot be undone.")) {
      return
    }
    const updated = appointments.filter((apt) => apt.id !== id)
    setAppointments(updated)

    await fetch("/api/appointments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
  }

  const openArchiveModal = (id: string) => {
    setArchiveAppointmentId(id)
    setArchiveReason("")
    setArchiveModalOpen(true)
  }

  const archiveAppointment = async () => {
    if (!archiveAppointmentId) return

    try {
      const response = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: archiveAppointmentId,
          reason: archiveReason || "Archived by admin",
        }),
      })

      if (response.ok) {
        setAppointments((prev) => prev.filter((apt) => apt.id !== archiveAppointmentId))
        setArchiveModalOpen(false)
        setArchiveAppointmentId(null)
        setArchiveReason("")
        // Refresh history if on history tab
        if (activeTab === "history") {
          loadHistory()
        }
      }
    } catch (error) {
      console.error("Error archiving appointment:", error)
    }
  }

  const deleteHistoryRecord = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this history record?")) {
      return
    }

    try {
      await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      setHistoryRecords((prev) => prev.filter((record) => record.id !== id))
    } catch (error) {
      console.error("Error deleting history record:", error)
    }
  }

  const updateCosting = async (id: string, costing: CostingData) => {
    const updatedCosting = {
      ...costing,
      updatedAt: new Date().toISOString(),
    }
    const updated = appointments.map((apt) =>
      apt.id === id
        ? {
          ...apt,
          costing: updatedCosting,
        }
        : apt
    )
    setAppointments(updated)

    await fetch("/api/appointments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, costing: updatedCosting }),
    })
  }

  const addCostItem = (appointmentId: string, type: CostItemType) => {
    const appointment = appointments.find((apt) => apt.id === appointmentId)
    const currentCosting = appointment?.costing || {
      items: [],
      subtotal: 0,
      discount: 0,
      discountType: "fixed" as const,
      vatEnabled: false,
      vatAmount: 0,
      total: 0,
      notes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const newItem: CostItem = {
      id: `item-${Date.now()}`,
      type,
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }

    const newCosting: CostingData = {
      ...currentCosting,
      items: [...currentCosting.items, newItem],
    }

    updateCosting(appointmentId, newCosting)
  }

  const calculateTotal = (subtotal: number, discount: number, discountType: "fixed" | "percentage", vatEnabled: boolean) => {
    const discountAmount = discountType === "percentage"
      ? (subtotal * discount) / 100
      : discount
    const afterDiscount = Math.max(0, subtotal - discountAmount)
    const vatAmount = vatEnabled ? afterDiscount * 0.12 : 0
    const total = afterDiscount + vatAmount
    return { discountAmount, vatAmount, total }
  }

  const updateCostItem = (appointmentId: string, itemId: string, updates: Partial<CostItem>) => {
    const appointment = appointments.find((apt) => apt.id === appointmentId)
    if (!appointment?.costing) return

    const updatedItems = appointment.costing.items.map((item) => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates }
        updatedItem.total = updatedItem.quantity * updatedItem.unitPrice
        return updatedItem
      }
      return item
    })

    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0)
    const { vatAmount, total } = calculateTotal(
      subtotal,
      appointment.costing.discount,
      appointment.costing.discountType,
      appointment.costing.vatEnabled ?? false
    )

    updateCosting(appointmentId, {
      ...appointment.costing,
      items: updatedItems,
      subtotal,
      vatAmount,
      total,
    })
  }

  const removeCostItem = (appointmentId: string, itemId: string) => {
    const appointment = appointments.find((apt) => apt.id === appointmentId)
    if (!appointment?.costing) return

    const updatedItems = appointment.costing.items.filter((item) => item.id !== itemId)
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0)
    const { vatAmount, total } = calculateTotal(
      subtotal,
      appointment.costing.discount,
      appointment.costing.discountType,
      appointment.costing.vatEnabled ?? false
    )

    updateCosting(appointmentId, {
      ...appointment.costing,
      items: updatedItems,
      subtotal,
      vatAmount,
      total,
    })
  }

  const updateDiscount = (appointmentId: string, discount: number, discountType: "fixed" | "percentage") => {
    const appointment = appointments.find((apt) => apt.id === appointmentId)
    if (!appointment?.costing) return

    const { vatAmount, total } = calculateTotal(
      appointment.costing.subtotal,
      discount,
      discountType,
      appointment.costing.vatEnabled ?? false
    )

    updateCosting(appointmentId, {
      ...appointment.costing,
      discount,
      discountType,
      vatAmount,
      total,
    })
  }

  const toggleVat = (appointmentId: string, vatEnabled: boolean) => {
    const appointment = appointments.find((apt) => apt.id === appointmentId)
    if (!appointment?.costing) return

    const { vatAmount, total } = calculateTotal(
      appointment.costing.subtotal,
      appointment.costing.discount,
      appointment.costing.discountType,
      vatEnabled
    )

    updateCosting(appointmentId, {
      ...appointment.costing,
      vatEnabled,
      vatAmount,
      total,
    })
  }

  const updateCostingNotes = (appointmentId: string, notes: string) => {
    const appointment = appointments.find((apt) => apt.id === appointmentId)
    if (!appointment?.costing) return

    updateCosting(appointmentId, {
      ...appointment.costing,
      notes,
    })
  }

  const toggleCardExpanded = (id: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const isInDateRange = (dateString: string, range: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)

    switch (range) {
      case "week":
        return diffDays <= 7
      case "month":
        return diffDays <= 30
      case "year":
        return diffDays <= 365
      default:
        return true
    }
  }

  const filteredAppointments = appointments.filter((apt) => {
    // Status filter
    if (filter !== "all" && apt.status !== filter) return false
    // Vehicle brand filter
    if (vehicleBrandFilter !== "all" && apt.vehicleMake !== vehicleBrandFilter) return false
    // Date range filter
    if (!isInDateRange(apt.createdAt, dateRangeFilter)) return false
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesName = apt.name.toLowerCase().includes(query)
      const matchesEmail = apt.email.toLowerCase().includes(query)
      const matchesPhone = apt.phone.includes(query)
      const matchesPlate = apt.vehiclePlate.toLowerCase().includes(query)
      const matchesBrand = apt.vehicleMake.toLowerCase().includes(query)
      const matchesTrackingCode = apt.trackingCode.toLowerCase().includes(query)
      if (!matchesName && !matchesEmail && !matchesPhone && !matchesPlate && !matchesBrand && !matchesTrackingCode) return false
    }
    return true
  })

  const stats = {
    total: appointments.length,
    pending: appointments.filter((apt) => apt.status === "pending").length,
    contacted: appointments.filter((apt) => apt.status === "contacted").length,
    completed: appointments.filter((apt) => apt.status === "completed").length,
    pendingInspection: appointments.filter((apt) => apt.repairStatus === "pending_inspection" || !apt.repairStatus).length,
  }

  // History filtering and sorting
  const filteredAndSortedHistory = historyRecords
    .filter((record) => {
      // Date range filter
      if (!isInDateRange(record.original_created_at, historyDateRangeFilter)) return false

      // Service filter
      if (historyServiceFilter !== "all" && record.service !== historyServiceFilter) return false

      // Search filter
      if (historySearchQuery.trim()) {
        const query = historySearchQuery.toLowerCase()
        const matchesTrackingCode = record.tracking_code?.toLowerCase().includes(query)
        const matchesName = record.name?.toLowerCase().includes(query)
        const matchesEmail = record.email?.toLowerCase().includes(query)
        const matchesPhone = record.phone?.includes(query)
        const matchesPlate = record.vehicle_plate?.toLowerCase().includes(query)
        const matchesMake = record.vehicle_make?.toLowerCase().includes(query)
        const matchesModel = record.vehicle_model?.toLowerCase().includes(query)

        if (!matchesTrackingCode && !matchesName && !matchesEmail && !matchesPhone && !matchesPlate && !matchesMake && !matchesModel) {
          return false
        }
      }

      return true
    })
    .sort((a, b) => {
      switch (historySortBy) {
        case "latest":
          return new Date(b.original_created_at).getTime() - new Date(a.original_created_at).getTime()
        case "oldest":
          return new Date(a.original_created_at).getTime() - new Date(b.original_created_at).getTime()
        case "name":
          return (a.name || "").localeCompare(b.name || "")
        case "status":
          return (a.final_status || "").localeCompare(b.final_status || "")
        default:
          return 0
      }
    })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                  <Wrench className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-lg font-bold tracking-tight text-primary">
                    AUTOWORX
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground -mt-1">
                    Admin Panel
                  </span>
                </div>
              </Link>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="bg-transparent">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Requests</div>
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="text-2xl font-bold text-blue-500">{stats.contacted}</div>
            <div className="text-sm text-muted-foreground">Contacted</div>
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="p-4 bg-card rounded-xl border border-orange-500/30 col-span-2 lg:col-span-1">
            <div className="text-2xl font-bold text-orange-500">{stats.pendingInspection}</div>
            <div className="text-sm text-muted-foreground">Pending Inspection</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("appointments")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "appointments"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            <FileText className="w-4 h-4 inline-block mr-2" />
            Active Appointments ({appointments.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("history")
              if (historyRecords.length === 0) {
                loadHistory()
              }
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            <History className="w-4 h-4 inline-block mr-2" />
            History ({historyRecords.length})
          </button>
        </div>

        {activeTab === "appointments" && (
          <div>
            {/* Toolbar */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-serif text-2xl font-bold text-foreground">Appointment Requests</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.pending} pending request{stats.pending !== 1 ? "s" : ""} waiting for your attention
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={loadAppointments} className="bg-transparent">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, plate, brand, or tracking code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 w-full"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={vehicleBrandFilter} onValueChange={setVehicleBrandFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Vehicle Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {vehicleBrands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Appointments List */}
            {filteredAppointments.length === 0 ? (
              <div className="p-12 bg-card rounded-xl border border-border text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-foreground">No appointments yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Appointment requests from the booking form will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => {
                  const status = statusConfig[appointment.status]
                  const repairStatusInfo = getRepairStatusInfo(appointment.repairStatus)
                  const isExpanded = expandedCards.has(appointment.id)

                  return (
                    <div
                      key={appointment.id}
                      className="bg-card rounded-xl border border-border overflow-hidden"
                    >
                      {/* Main Card Content */}
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          {/* Main Info */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="font-semibold text-foreground">{appointment.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-muted-foreground">
                                    Tracking: <span className="font-mono text-primary">{appointment.trackingCode}</span>
                                  </p>
                                  <Link
                                    href={`/track?code=${appointment.trackingCode}`}
                                    target="_blank"
                                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                                  >
                                    View live
                                    <ArrowUpRight className="w-2.5 h-2.5" />
                                  </Link>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                <Badge variant={status.variant}>
                                  <status.icon className="w-3 h-3 mr-1" />
                                  {status.label}
                                </Badge>
                                {appointment.repairStatus && (
                                  <Badge
                                    variant="outline"
                                    className={`${repairStatusInfo.bgColor} ${repairStatusInfo.borderColor} ${repairStatusInfo.color} bg-transparent`}
                                  >
                                    <Settings2 className="w-3 h-3 mr-1" />
                                    {repairStatusInfo.label}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-4 h-4 shrink-0" />
                                <a href={`tel:${appointment.phone}`} className="hover:text-foreground">
                                  {appointment.phone}
                                </a>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="w-4 h-4 shrink-0" />
                                <a href={`mailto:${appointment.email}`} className="hover:text-foreground truncate">
                                  {appointment.email}
                                </a>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Car className="w-4 h-4 shrink-0" />
                                <span>
                                  {appointment.vehicleYear} {appointment.vehicleMake}{" "}
                                  {appointment.vehicleModel}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="font-mono font-semibold text-foreground">{appointment.vehiclePlate}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-primary" />
                                <span className="text-foreground">{appointment.service}</span>
                              </div>
                              {appointment.currentRepairPart && (
                                <div className="flex items-center gap-2">
                                  <Settings2 className="w-4 h-4 text-orange-500" />
                                  <span className="text-orange-500 font-medium">Working on: {appointment.currentRepairPart}</span>
                                </div>
                              )}
                              {appointment.preferredDate && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  <span>Preferred: {appointment.preferredDate}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>Submitted: {formatDate(appointment.createdAt)}</span>
                              </div>
                            </div>

                            {appointment.statusUpdatedAt && (
                              <div className="text-xs text-muted-foreground">
                                Repair status last updated: {formatDate(appointment.statusUpdatedAt)}
                              </div>
                            )}

                            {appointment.message && (
                              <div className="p-3 bg-secondary rounded-lg">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                  <User className="w-3 h-3" />
                                  Additional Details
                                </div>
                                <p className="text-sm text-foreground">{appointment.message}</p>
                              </div>
                            )}

                            {/* Damage Images */}
                            {appointment.damageImages && appointment.damageImages.length > 0 && (
                              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 mb-2">
                                  <ImageIcon className="w-3 h-3" />
                                  Damage Photos ({appointment.damageImages.length})
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                  {appointment.damageImages.map((image, index) => (
                                    <div key={index} className="flex flex-col gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setZoomImages(appointment.damageImages || [])
                                          setZoomInitialIndex(index)
                                          setZoomModalOpen(true)
                                        }}
                                        className="relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors cursor-zoom-in"
                                      >
                                        <img
                                          src={image || "/placeholder.svg"}
                                          alt={`Damage photo ${index + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] py-0.5 text-center">
                                          {index + 1}
                                        </div>
                                      </button>
                                      <a
                                        href={image}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-amber-600 hover:underline text-center"
                                      >
                                        Full Size
                                      </a>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-2">
                                  Click to zoom or "Full Size" to download
                                </p>
                              </div>
                            )}

                            {/* ORCR Image */}
                            {appointment.orcrImage && (
                              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 mb-2">
                                  <ImageIcon className="w-3 h-3" />
                                  ORCR (Official Receipt/Certificate of Registration)
                                </div>
                                <div className="max-w-md mx-auto">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setZoomImages([appointment.orcrImage!])
                                      setZoomInitialIndex(0)
                                      setZoomModalOpen(true)
                                    }}
                                    className="relative aspect-[3/2] rounded-lg overflow-hidden border-2 border-blue-500/50 hover:border-blue-500 transition-colors cursor-zoom-in w-full"
                                  >
                                    <img
                                      src={appointment.orcrImage}
                                      alt="ORCR Document"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 text-center font-medium">
                                      ORCR Document - Click to Zoom
                                    </div>
                                  </button>
                                  <a
                                    href={appointment.orcrImage}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    <Download className="w-3 h-3" />
                                    Download ORCR
                                  </a>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                                  Click image to zoom or download for verification
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Status Actions */}
                          <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant={appointment.status === "pending" ? "default" : "outline"}
                              onClick={() => updateStatus(appointment.id, "pending")}
                              disabled={appointment.status === "pending"}
                              className={appointment.status === "pending" ? "" : "bg-transparent"}
                            >
                              Pending
                            </Button>
                            <Button
                              size="sm"
                              variant={appointment.status === "contacted" ? "default" : "outline"}
                              onClick={() => updateStatus(appointment.id, "contacted")}
                              disabled={appointment.status === "contacted"}
                              className={appointment.status === "contacted" ? "" : "bg-transparent"}
                            >
                              Contacted
                            </Button>
                            <Button
                              size="sm"
                              variant={appointment.status === "completed" ? "default" : "outline"}
                              onClick={() => updateStatus(appointment.id, "completed")}
                              disabled={appointment.status === "completed"}
                              className={appointment.status === "completed" ? "" : "bg-transparent"}
                            >
                              Completed
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 border-amber-500/30 bg-transparent"
                              onClick={() => openArchiveModal(appointment.id)}
                            >
                              <Archive className="w-4 h-4 mr-1" />
                              Archive
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 hover:text-red-400 hover:bg-red-500/10 border-red-500/30 bg-transparent"
                              onClick={() => deleteAppointment(appointment.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Repair Status Control Panel - Expandable */}
                      <div className="border-t border-border">
                        <button
                          onClick={() => toggleCardExpanded(appointment.id)}
                          className="w-full px-6 py-3 flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Settings2 className="w-4 h-4" />
                            Repair Status Controls
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-6 pb-6 pt-2 space-y-4 bg-secondary/30">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Repair Status Dropdown */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                  Overall Vehicle Status
                                </label>
                                <Select
                                  value={appointment.repairStatus || ""}
                                  onValueChange={(value) => updateRepairStatus(appointment.id, value as RepairStatus)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select repair status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {REPAIR_STATUS_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Current Part Being Repaired */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                  Current Part Being Repaired
                                </label>
                                {!useCustomRepairPart[appointment.id] ? (
                                  <Select
                                    value={appointment.currentRepairPart || ""}
                                    onValueChange={(value) => {
                                      if (value === "custom") {
                                        setUseCustomRepairPart((prev) => ({ ...prev, [appointment.id]: true }))
                                        updateCurrentRepairPart(appointment.id, "")
                                      } else {
                                        updateCurrentRepairPart(appointment.id, value)
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select part" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {REPAIR_PARTS.map((part) => (
                                        <SelectItem key={part} value={part}>
                                          {part}
                                        </SelectItem>
                                      ))}
                                      <SelectItem value="custom">
                                        ✏️ Enter custom part
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div className="flex gap-2">
                                    <Input
                                      value={appointment.currentRepairPart || ""}
                                      onChange={(e) => {
                                        const updated = appointments.map((apt) =>
                                          apt.id === appointment.id
                                            ? { ...apt, currentRepairPart: e.target.value }
                                            : apt
                                        )
                                        setAppointments(updated)
                                      }}
                                      onBlur={() => {
                                        if (appointment.currentRepairPart?.trim()) {
                                          fetch("/api/appointments", {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                              id: appointment.id,
                                              currentRepairPart: appointment.currentRepairPart,
                                            }),
                                          }).catch(console.error)
                                        }
                                      }}
                                      placeholder="Enter repair part"
                                      className="flex-1"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setUseCustomRepairPart((prev) => ({ ...prev, [appointment.id]: false }))
                                        updateCurrentRepairPart(appointment.id, "")
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Current Status Display */}
                            {appointment.repairStatus && (
                              <div className={`p-4 rounded-lg ${repairStatusInfo.bgColor} ${repairStatusInfo.borderColor} border`}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${repairStatusInfo.color.replace("text-", "bg-")}`} />
                                  <span className={`font-medium ${repairStatusInfo.color}`}>
                                    {repairStatusInfo.label}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {repairStatusInfo.description}
                                </p>
                              </div>
                            )}

                            {/* Costing Section */}
                            <div className="pt-4 border-t border-border">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <Receipt className="w-4 h-4 text-green-500" />
                                  <h4 className="font-semibold text-foreground">Cost Breakdown</h4>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  {COST_ITEM_TYPES.map((type) => (
                                    <Button
                                      key={type.value}
                                      size="sm"
                                      variant="outline"
                                      onClick={() => addCostItem(appointment.id, type.value)}
                                      className="bg-transparent text-xs"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      {type.label}
                                    </Button>
                                  ))}
                                </div>
                              </div>

                              {/* Cost Items List */}
                              {appointment.costing?.items && appointment.costing.items.length > 0 ? (
                                <div className="space-y-3">
                                  {appointment.costing.items.map((item) => (
                                    <div key={item.id} className="p-3 bg-background rounded-lg border border-border">
                                      <div className="flex items-start gap-3">
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-3">
                                          <div className="sm:col-span-2">
                                            <label className="text-xs text-muted-foreground mb-1 block">
                                              {COST_ITEM_TYPES.find(t => t.value === item.type)?.label} Description
                                            </label>
                                            <Input
                                              value={item.description}
                                              onChange={(e) => updateCostItem(appointment.id, item.id, { description: e.target.value })}
                                              placeholder="Enter description..."
                                              className="h-8 text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-muted-foreground mb-1 block">Qty</label>
                                            <Input
                                              type="number"
                                              min="1"
                                              value={item.quantity}
                                              onChange={(e) => updateCostItem(appointment.id, item.id, { quantity: parseInt(e.target.value) || 1 })}
                                              className="h-8 text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-muted-foreground mb-1 block">Unit Price</label>
                                            <Input
                                              type="number"
                                              min="0"
                                              step="0.01"
                                              value={item.unitPrice}
                                              onChange={(e) => updateCostItem(appointment.id, item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                                              className="h-8 text-sm"
                                            />
                                          </div>
                                          <div className="flex items-end justify-between">
                                            <div>
                                              <label className="text-xs text-muted-foreground mb-1 block">Total</label>
                                              <p className="font-mono font-semibold text-foreground h-8 flex items-center">
                                                P{item.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                              </p>
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => removeCostItem(appointment.id, item.id)}
                                              className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                            >
                                              <X className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Discount & Total */}
                                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">Subtotal</span>
                                      <span className="font-mono font-semibold text-foreground">
                                        P{(appointment.costing?.subtotal || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm text-muted-foreground">Discount</span>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={appointment.costing?.discount || 0}
                                        onChange={(e) => updateDiscount(appointment.id, parseFloat(e.target.value) || 0, appointment.costing?.discountType || "fixed")}
                                        className="h-8 text-sm w-24"
                                      />
                                      <Select
                                        value={appointment.costing?.discountType || "fixed"}
                                        onValueChange={(value) => updateDiscount(appointment.id, appointment.costing?.discount || 0, value as "fixed" | "percentage")}
                                      >
                                        <SelectTrigger className="w-24 h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="fixed">Fixed (P)</SelectItem>
                                          <SelectItem value="percentage">Percent (%)</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={appointment.costing?.vatEnabled || false}
                                          onChange={(e) => toggleVat(appointment.id, e.target.checked)}
                                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-muted-foreground">Add 12% VAT</span>
                                      </label>
                                      {appointment.costing?.vatEnabled && (
                                        <span className="font-mono text-sm text-foreground ml-auto">
                                          +P{(appointment.costing?.vatAmount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-green-500/30">
                                      <span className="font-semibold text-foreground flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-green-500" />
                                        Total {appointment.costing?.vatEnabled && <span className="text-xs font-normal text-muted-foreground">(VAT inclusive)</span>}
                                      </span>
                                      <span className="font-mono text-xl font-bold text-green-500">
                                        P{(appointment.costing?.total || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Notes */}
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Notes (visible to customer)</label>
                                    <textarea
                                      value={appointment.costing?.notes || ""}
                                      onChange={(e) => updateCostingNotes(appointment.id, e.target.value)}
                                      placeholder="Add any notes about the costing..."
                                      className="w-full h-20 px-3 py-2 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="p-6 bg-background rounded-lg border border-dashed border-border text-center">
                                  <Receipt className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-sm text-muted-foreground">
                                    No cost items added yet. Click the buttons above to add services, parts, labor, or custom items.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            {/* History Toolbar - Search, Filter, Sort */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by tracking code, name, email, phone, plate, or vehicle..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="pl-10 pr-10 w-full"
                />
                {historySearchQuery && (
                  <button
                    onClick={() => setHistorySearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filters and Sort */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={historyServiceFilter} onValueChange={setHistoryServiceFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Service Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    <SelectItem value="Full Service">Full Service</SelectItem>
                    <SelectItem value="Oil Change">Oil Change</SelectItem>
                    <SelectItem value="Brake Service">Brake Service</SelectItem>
                    <SelectItem value="Tire Replacement">Tire Replacement</SelectItem>
                    <SelectItem value="Engine Repair">Engine Repair</SelectItem>
                    <SelectItem value="Transmission Repair">Transmission Repair</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={historyDateRangeFilter} onValueChange={setHistoryDateRangeFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={historySortBy} onValueChange={(value) => setHistorySortBy(value as typeof historySortBy)}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="name">Owner Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                Found {filteredAndSortedHistory.length} record{filteredAndSortedHistory.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* History Records */}
            {filteredAndSortedHistory.length === 0 ? (
              <div className="p-12 bg-card rounded-xl border border-border text-center">
                <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-foreground">No history records found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {historyRecords.length === 0
                    ? "No completed repairs archived yet."
                    : "Try adjusting your search or filters."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedHistory.map((record) => (
                  <div key={record.id} className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        {/* Main Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-foreground">{record.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                Tracking: <span className="font-mono text-primary">{record.tracking_code}</span>
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <Badge variant="default">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-4 h-4 shrink-0" />
                              <a href={`tel:${record.phone}`} className="hover:text-foreground">
                                {record.phone}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="w-4 h-4 shrink-0" />
                              <a href={`mailto:${record.email}`} className="hover:text-foreground truncate">
                                {record.email}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Car className="w-4 h-4 shrink-0" />
                              <span>
                                {record.vehicle_year} {record.vehicle_make}{" "}
                                {record.vehicle_model}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="font-mono font-semibold text-foreground">{record.vehicle_plate}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Wrench className="w-4 h-4 text-primary" />
                              <span className="text-foreground">{record.service}</span>
                            </div>
                            {record.preferred_date && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>Preferred: {record.preferred_date}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>Submitted: {formatDate(record.original_created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>Completed: {formatDate(record.completed_at)}</span>
                            </div>
                          </div>

                          {record.message && (
                            <div className="p-3 bg-secondary rounded-lg">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <User className="w-3 h-3" />
                                Additional Details
                              </div>
                              <p className="text-sm text-foreground">{record.message}</p>
                            </div>
                          )}

                          {/* Cost Estimation */}
                          {record.costing && (
                            <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20 space-y-2">
                              <div className="flex items-center gap-2 mb-3">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-semibold text-foreground">Final Cost Estimation</span>
                              </div>

                              {record.costing.items && record.costing.items.length > 0 && (
                                <div className="space-y-1 text-sm">
                                  <div className="text-xs text-muted-foreground font-medium">Items:</div>
                                  {record.costing.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                      <span className="text-muted-foreground">{item.description}</span>
                                      <span className="font-mono font-semibold text-foreground">
                                        P{item.total?.toLocaleString("en-PH", { minimumFractionDigits: 2 }) || "0.00"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="pt-2 border-t border-green-500/20 space-y-1 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Subtotal</span>
                                  <span className="font-mono font-semibold">
                                    P{record.costing.subtotal?.toLocaleString("en-PH", { minimumFractionDigits: 2 }) || "0.00"}
                                  </span>
                                </div>

                                {record.costing.discount > 0 && (
                                  <div className="flex justify-between items-center text-orange-500">
                                    <span>Discount ({record.costing.discountType === "percentage" ? `${record.costing.discount}%` : "Fixed"})</span>
                                    <span className="font-mono font-semibold">
                                      -P{(
                                        record.costing.discountType === "percentage"
                                          ? (record.costing.subtotal * record.costing.discount) / 100
                                          : record.costing.discount
                                      ).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                )}

                                {record.costing.vatEnabled && (
                                  <div className="flex justify-between items-center text-blue-500">
                                    <span>VAT (12%)</span>
                                    <span className="font-mono font-semibold">
                                      +P{record.costing.vatAmount?.toLocaleString("en-PH", { minimumFractionDigits: 2 }) || "0.00"}
                                    </span>
                                  </div>
                                )}

                                <div className="flex justify-between items-center pt-2 border-t border-green-500/30 font-semibold text-foreground">
                                  <span>Total</span>
                                  <span className="font-mono text-lg text-green-600">
                                    P{record.costing.total?.toLocaleString("en-PH", { minimumFractionDigits: 2 }) || "0.00"}
                                  </span>
                                </div>
                              </div>

                              {record.costing.notes && (
                                <div className="pt-2 text-xs text-muted-foreground border-t border-green-500/20 italic">
                                  {record.costing.notes}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 border-red-500/30 bg-transparent"
                            onClick={() => deleteHistoryRecord(record.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Image Zoom Modal */}
      <ImageZoomModal
        images={zoomImages}
        initialIndex={zoomInitialIndex}
        isOpen={zoomModalOpen}
        onClose={() => setZoomModalOpen(false)}
      />

      {/* Archive Confirmation Modal */}
      {archiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Archive className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Archive Appointment</h3>
                <p className="text-sm text-muted-foreground">Move to history without images</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              This will archive the appointment record to history. Images will be deleted to save storage space. This action cannot be undone.
            </p>
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-foreground">Reason (optional)</label>
              <textarea
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="e.g., Service completed, Customer no-show..."
                className="w-full h-20 px-3 py-2 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setArchiveModalOpen(false)
                  setArchiveAppointmentId(null)
                  setArchiveReason("")
                }}
                className="bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={archiveAppointment}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
