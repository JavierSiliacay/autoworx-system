"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { createClient } from "@/lib/supabase/client"
import { useToast, toast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { isAuthorizedAdminEmail, isDeveloperEmail } from "@/lib/auth"
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
  ShieldCheck,
  Search,
  X,
  Plus,
  Save,
  DollarSign,
  Receipt,
  ImageIcon,
  Archive,
  History as HistoryIcon,
  FileText,
  Download,
  ChevronRight,
  ChevronLeft,
  Megaphone,
  Send,
  Heart,
  Package,
  LayoutDashboard,
  Monitor,
  Check,
  FileUp,
  PlusCircle,
  FileCheck,
  Copy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SERVICES, VEHICLE_BRANDS, REPAIR_STATUS_OPTIONS, REPAIR_PARTS, COST_ITEM_TYPES, COST_ITEM_CATEGORIES, COMMON_UNITS, type RepairStatus, type CostItem, type CostingData, type CostItemType } from "@/lib/constants"
import { getRepairStatusInfo, generateTrackingCode } from "@/lib/appointment-tracking"
import { generateTrackingPDF, generateGatepassPDF, type GatepassData } from "@/lib/generate-pdf"
import { ImageZoomModal } from "@/components/ui/image-zoom-modal"
import { AIAnalystDialog } from "@/components/ai/ai-analyst-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn, compressImage } from "@/lib/utils"

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
  vehicle_color: string
  chassis_number: string
  engine_number: string
  assignee_driver: string
  service: string
  preferred_date: string
  message: string
  status: "pending" | "contacted" | "completed" | "confirm"
  created_at: string
  repair_status?: RepairStatus
  current_repair_part?: string
  status_updated_at?: string
  costing?: CostingData
  damage_images?: string[]
  orcr_image?: string
  orcr_image_2?: string
  insurance?: string
  estimate_number?: string
  paul_notes?: string
  service_advisor?: string
  loa_attachment?: string
  loa_attachment_2?: string
  loa_attachments?: string[]
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
  vehicleColor: string
  chassisNumber: string
  engineNumber: string
  assigneeDriver: string
  service: string
  message: string
  status: "pending" | "contacted" | "completed" | "confirm"
  createdAt: string
  repairStatus?: RepairStatus
  currentRepairPart?: string
  statusUpdatedAt?: string
  costing?: CostingData
  damageImages?: string[]
  orcrImage?: string
  orcrImage2?: string
  insurance?: string
  estimateNumber?: string
  paulNotes?: string
  serviceAdvisor?: string
  updatedAt?: string
  source?: 'active' | 'history'
  loaAttachment?: string
  loaAttachment2?: string
  loaAttachments?: string[]
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
  insurance?: string
  estimate_number?: string
  paul_notes?: string
}

interface Announcement {
  id: string
  content: string
  author_name: string
  author_email: string
  created_at: string
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
    vehicleColor: apt.vehicle_color,
    chassisNumber: apt.chassis_number,
    engineNumber: apt.engine_number,
    assigneeDriver: apt.assignee_driver,
    service: apt.service,
    message: apt.message,
    status: apt.status,
    createdAt: apt.created_at,
    repairStatus: apt.repair_status,
    currentRepairPart: apt.current_repair_part,
    statusUpdatedAt: apt.status_updated_at,
    costing: apt.costing,
    damageImages: apt.damage_images,
    orcrImage: apt.orcr_image,
    orcrImage2: apt.orcr_image_2,
    insurance: apt.insurance,
    estimateNumber: apt.estimate_number,
    paulNotes: apt.paul_notes,
    serviceAdvisor: apt.service_advisor,
    updatedAt: apt.status_updated_at || apt.created_at,
    loaAttachment: apt.loa_attachment || apt.costing?.loaAttachment,
    loaAttachment2: apt.loa_attachment_2 || apt.costing?.loaAttachment2,
    loaAttachments: apt.loa_attachments || apt.costing?.loaAttachments || []
  }
}

// Helper to normalize strings for search (remove whitespace, casing, and separators)
const normalizeString = (str: string) => {
  if (!str) return ""
  return str.toLowerCase().replace(/[\s\-\.\/\,]/g, "")
}

const MONTHS = [
  { full: "january", short: "jan", index: 0, variations: ["january"] },
  { full: "february", short: "feb", index: 1, variations: ["february", "feburary", "feb"] },
  { full: "march", short: "mar", index: 2, variations: ["march", "mar"] },
  { full: "april", short: "apr", index: 3, variations: ["april", "apr"] },
  { full: "may", short: "may", index: 4, variations: ["may"] },
  { full: "june", short: "jun", index: 5, variations: ["june", "jun"] },
  { full: "july", short: "jul", index: 6, variations: ["july", "jul"] },
  { full: "august", short: "aug", index: 7, variations: ["august", "aug"] },
  { full: "september", short: "sep", index: 8, variations: ["september", "sept", "sep"] },
  { full: "october", short: "oct", index: 9, variations: ["october", "oct"] },
  { full: "november", short: "nov", index: 10, variations: ["november", "nov"] },
  { full: "december", short: "dec", index: 11, variations: ["december", "dec"] },
]

const getMatchedMonth = (query: string) => {
  const norm = query.toLowerCase().trim()
  if (norm.length < 3) return null
  return MONTHS.find(m =>
    m.variations.some(v => v.includes(norm) || norm.includes(v))
  )
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
  confirm: {
    label: "Confirm",
    icon: CheckCircle2,
    variant: "default" as const,
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
  const { toast } = useToast()

  // Track the last selected category to auto-fill new items
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [focusNewItem, setFocusNewItem] = useState<string | null>(null)

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filter, setFilter] = useState<string>("all")
  const [vehicleBrandFilter, setVehicleBrandFilter] = useState<string>("all")
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isGatepassModalOpen, setIsGatepassModalOpen] = useState(false)
  const [gatepassData, setGatepassData] = useState<GatepassData>({
    clientName: "",
    unitModel: "",
    plateNo: "",
    color: "",
    insurance: "",
    invoiceNo: "",
    orNo: "",
    joNo: "",
    amount: 0,
    cashier: "",
    serviceAdvisor: "",
    note: "",
    date: new Date().toLocaleDateString("en-PH", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  })
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [zoomModalOpen, setZoomModalOpen] = useState(false)
  const [zoomImages, setZoomImages] = useState<string[]>([])
  const [zoomInitialIndex, setZoomInitialIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<"appointments" | "history" | "recommendations">("appointments")
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const isDeveloperUser = isDeveloperEmail(session?.user?.email)
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

  // Appointment Editing states
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
  const [isSubmittingCopy, setIsSubmittingCopy] = useState(false)
  const [copyFormData, setCopyFormData] = useState<any>({
    name: "",
    email: "",
    phone: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehiclePlate: "",
    vehicleColor: "",
    chassisNumber: "",
    engineNumber: "",
    assigneeDriver: "",
    service: "",
    message: "",
    insurance: "",
    serviceAdvisor: "",
    damageImages: [],
    orcrImage: "",
    orcrImage2: "",
  })
  const [copyDamageFiles, setCopyDamageFiles] = useState<File[]>([])
  const [copyOrcrFile, setCopyOrcrFile] = useState<File | null>(null)
  const [copyOrcrFile2, setCopyOrcrFile2] = useState<File | null>(null)
  const [widenedItems, setWidenedItems] = useState<Set<string>>(new Set())

  const toggleWidenItem = (itemId: string) => {
    setWidenedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  // Announcement states
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState("")
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false)

  // Trash / History States
  const [showDeletedHistory, setShowDeletedHistory] = useState(false)
  const [deletedAppointments, setDeletedAppointments] = useState<Appointment[]>([])
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false)

  const [selectedDownloadAppointment, setSelectedDownloadAppointment] = useState<Appointment | null>(null)
  const [isElectron, setIsElectron] = useState(false)
  const [isUploadingLOA, setIsUploadingLOA] = useState<Record<string, boolean>>({})

  // Refs for stabilizing typing and real-time updates
  const costingDebounceRef = useRef<Record<string, any>>({})
  const lastStateUpdateRef = useRef<Record<string, number>>({})

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

  const loadAnnouncements = useCallback(async () => {
    try {
      const response = await fetch("/api/announcements")
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      }
    } catch (error) {
      console.error("Error loading announcements:", error)
    }
  }, [])

  const loadDeletedAppointments = useCallback(async () => {
    setIsLoadingDeleted(true)
    try {
      const [appointmentsRes, historyRes] = await Promise.all([
        fetch("/api/appointments?deleted=true"),
        fetch("/api/history?deleted=true")
      ])

      let combined: Appointment[] = []

      if (appointmentsRes.ok) {
        const data = await appointmentsRes.json() as AppointmentDB[]
        const mapped = data.map(dbToFrontend).map(a => ({ ...a, source: 'active' as const }))
        combined = [...combined, ...mapped]
      }

      if (historyRes.ok) {
        const data = await historyRes.json() as any[]
        // History items need mapping to Appointment structure
        const mapped = data.map((h: any) => ({
          id: h.id,
          trackingCode: h.tracking_code,
          name: h.name,
          email: h.email,
          phone: h.phone,
          vehicleMake: h.vehicle_make,
          vehicleModel: h.vehicle_model,
          vehicleYear: h.vehicle_year,
          vehiclePlate: h.vehicle_plate,
          vehicleColor: h.vehicle_color,
          chassisNumber: h.chassis_number,
          engineNumber: h.engine_number,
          assigneeDriver: h.assignee_driver,
          service: h.service,
          preferredDate: h.preferred_date,
          message: h.message,
          status: h.final_status || "completed", // usually completed if in history
          repairStatus: h.repair_status,
          currentRepairPart: h.current_repair_part,
          createdAt: h.original_created_at,
          statusUpdatedAt: h.deleted_at || h.archived_at, // Use deleted_at for sorting
          costing: h.costing,
          insurance: h.insurance,
          estimateNumber: h.estimate_number,
          paulNotes: h.paul_notes,
          source: 'history' as const
        }))
        combined = [...combined, ...mapped]
      }

      // Sort by deleted time (most recent first)
      combined.sort((a, b) => new Date(b.statusUpdatedAt || b.updatedAt || 0).getTime() - new Date(a.statusUpdatedAt || a.updatedAt || 0).getTime())

      setDeletedAppointments(combined)
    } catch (error) {
      console.error("Error loading deleted appointments:", error)
      toast({
        title: "Error",
        description: "Failed to load trash history.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingDeleted(false)
    }
  }, [toast, loadAppointments])

  const loadRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true)
    try {
      const response = await fetch("/api/developer/recommendations")
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data)
      }
    } catch (error) {
      console.error("Error loading recommendations:", error)
    }
    setIsLoadingRecommendations(false)
  }, [])

  const updateRecommendation = async (id: string, updates: any) => {
    try {
      const response = await fetch("/api/developer/recommendations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })
      if (response.ok) {
        setRecommendations((prev) =>
          prev.map((rec) => (rec.id === id ? { ...rec, ...updates } : rec))
        )
      }
    } catch (error) {
      console.error("Error updating recommendation:", error)
    }
  }

  const deleteRecommendation = async (id: string) => {
    if (!window.confirm("Delete this recommendation?")) return
    try {
      const response = await fetch("/api/developer/recommendations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (response.ok) {
        setRecommendations((prev) => prev.filter((rec) => rec.id !== id))
      }
    } catch (error) {
      console.error("Error deleting recommendation:", error)
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin")
      return
    }
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/admin")
      return
    }

    if (status === "authenticated") {
      loadAppointments()
      loadAnnouncements()
      loadHistory()
      loadDeletedAppointments()
      if (isDeveloperUser) {
        loadRecommendations()
      }
      setIsElectron(typeof window !== 'undefined' && !!(window as any).electron)
    }
  }, [router, loadAppointments, loadAnnouncements, loadHistory, loadDeletedAppointments, loadRecommendations, status, session?.user?.role, isDeveloperUser])

  // Real-time updates subscription
  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "admin") return

    const supabase = createClient()

    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newApt = dbToFrontend(payload.new as AppointmentDB)

            // Audio Notification
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3")
            audio.play().catch(e => console.log("Audio notification blocked by browser settings", e))

            // Toast Notification
            const { dismiss } = toast({
              title: "New Booking Received!",
              description: `${newApt.name} just booked a ${newApt.service} service.`,
              className: "bg-primary text-primary-foreground border-none",
              action: (
                <ToastAction altText="Dismiss" className="border-white/20 hover:bg-white/10 text-white" onClick={() => dismiss()}>
                  OK
                </ToastAction>
              ),
            })

            setAppointments((prev) => [newApt, ...prev])
          }
          else if (payload.eventType === 'UPDATE') {
            const updatedApt = dbToFrontend(payload.new as AppointmentDB)
            setAppointments((prev) => {
              const now = Date.now()
              // Guard: If we recently updated this specific appointment locally, 
              // ignore the server's update for a few seconds to prevent cursor jumps and state flickering.
              if (lastStateUpdateRef.current[updatedApt.id] && now - lastStateUpdateRef.current[updatedApt.id] < 3000) {
                return prev
              }
              return prev.map(apt => apt.id === updatedApt.id ? updatedApt : apt)
            })
          }
          else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id
            setAppointments((prev) => prev.filter(apt => apt.id !== deletedId))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [status, session?.user?.role, toast])

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin" })
  }

  const updateStatus = async (id: string, newStatus: "pending" | "contacted" | "completed" | "confirm") => {
    if (newStatus === "completed") {
      const confirmed = window.confirm("Are you sure that this unit is completed?")
      if (!confirmed) return
    }
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
    if (repairStatus === "completed_ready") {
      const confirmed = window.confirm("Are you sure that this unit is completed and ready for pickup?")
      if (!confirmed) return
    }
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

  const handleLOAUpload = async (appointmentId: string, file: File) => {
    setIsUploadingLOA((prev) => ({ ...prev, [appointmentId]: true }))
    try {
      // 1. Compress only if it's an image
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        try {
          fileToUpload = await compressImage(file)
        } catch (err) {
          console.warn("Compression failed, uploading original:", err)
        }
      }

      // 2. Upload to Supabase Storage
      const supabase = createClient()
      const fileExt = fileToUpload.name.split('.').pop()
      const fileName = `loa-${appointmentId}-${Date.now()}.${fileExt}`
      const filePath = `damage-images/${fileName}`

      const { data, error } = await supabase.storage
        .from("damage-images")
        .upload(filePath, fileToUpload)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from("damage-images")
        .getPublicUrl(filePath)

      // 3. Update appointment costing with loaAttachments array
      const appointment = appointments.find(a => a.id === appointmentId)
      if (appointment) {
        // Handle migration/merging of old fields into the new array
        const currentLOAs = appointment.loaAttachments || [];
        // Extract from old fields if they exist and aren't in the array yet
        const legacyLOAs = [appointment.loaAttachment, appointment.loaAttachment2].filter(Boolean) as string[];
        const combinedLOAs = Array.from(new Set([...currentLOAs, ...legacyLOAs, publicUrl]));

        const updatedCosting = {
          ...(appointment.costing || {
            items: [],
            subtotal: 0,
            discount: 0,
            discountType: "fixed",
            vatEnabled: false,
            vatAmount: 0,
            total: 0,
            notes: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as CostingData),
          loaAttachments: combinedLOAs,
          updatedAt: new Date().toISOString()
        }

        const updated = appointments.map((apt) =>
          apt.id === appointmentId
            ? {
              ...apt,
              costing: updatedCosting,
              loaAttachments: combinedLOAs,
              repairStatus: 'insurance_approved' as RepairStatus,
              statusUpdatedAt: new Date().toISOString()
            }
            : apt
        )
        setAppointments(updated)

        await fetch("/api/appointments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: appointmentId,
            costing: updatedCosting,
            loaAttachments: combinedLOAs,
            repairStatus: 'insurance_approved',
            statusUpdatedAt: new Date().toISOString()
          }),
        })
      }

      toast({
        title: "LOA Attached",
        description: "The Letter of Authorization has been uploaded and attached.",
      })
    } catch (error: any) {
      console.error("LOA upload error:", error)
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Could not upload LOA file.",
      })
    } finally {
      setIsUploadingLOA((prev) => ({ ...prev, [appointmentId]: false }))
    }
  }

  const handleRemoveLOA = async (appointmentId: string, urlToRemove: string) => {
    if (!confirm("Are you sure you want to remove this LOA attachment?")) return;

    try {
      const appointment = appointments.find(a => a.id === appointmentId)
      if (appointment) {
        const currentLOAs = appointment.loaAttachments || [];
        const updatedLOAs = currentLOAs.filter(url => url !== urlToRemove);

        const updatedCosting = {
          ...(appointment.costing || {
            items: [],
            subtotal: 0,
            discount: 0,
            discountType: "fixed",
            vatEnabled: false,
            vatAmount: 0,
            total: 0,
            notes: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as CostingData),
          loaAttachments: updatedLOAs,
          updatedAt: new Date().toISOString()
        }

        const updated = appointments.map((apt) =>
          apt.id === appointmentId
            ? {
              ...apt,
              costing: updatedCosting,
              loaAttachments: updatedLOAs,
            }
            : apt
        )
        setAppointments(updated)

        await fetch("/api/appointments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: appointmentId,
            costing: updatedCosting,
            loaAttachments: updatedLOAs,
            // Also nullify legacy fields if this was one of them
            loaAttachment: urlToRemove === appointment.loaAttachment ? null : undefined,
            loaAttachment2: urlToRemove === appointment.loaAttachment2 ? null : undefined,
          }),
        })

        toast({
          title: "LOA Removed",
          description: "The Letter of Authorization attachment has been removed.",
        })
      }
    } catch (error: any) {
      console.error("Error removing LOA:", error)
      toast({
        variant: "destructive",
        title: "Remove Failed",
        description: "Could not remove the LOA attachment.",
      })
    }
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

  const softDeleteAppointment = async (id: string) => {
    if (!window.confirm("Are you sure you want to move this appointment to Trash?")) {
      return
    }

    // Optimistic update
    setAppointments((prev) => prev.filter((apt) => apt.id !== id))

    try {
      const response = await fetch("/api/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, deletedAt: new Date().toISOString() }),
      })

      if (response.ok) {
        toast({
          title: "Moved to Trash",
          description: "Appointment has been moved to Delete History.",
        })
        loadDeletedAppointments() // Refresh trash
      } else {
        // Revert on failure (simplified)
        loadAppointments()
        toast({
          title: "Error",
          description: "Failed to delete appointment.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting appointment:", error)
    }
  }

  // Helper to distinguish source
  const restoreAppointment = async (appointment: Appointment & { source?: 'active' | 'history' }) => {
    if (!window.confirm("Restore this appointment?")) {
      return
    }

    setDeletedAppointments((prev) => prev.filter((apt) => apt.id !== appointment.id))

    try {
      let endpoint = "/api/appointments"
      if (appointment.source === 'history') {
        endpoint = "/api/history"
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appointment.id, deletedAt: null }),
      })

      if (response.ok) {
        toast({
          title: "Restored",
          description: "Appointment restored successfully.",
        })
        if (appointment.source === 'history') {
          loadHistory()
        } else {
          loadAppointments()
        }
      }
    } catch (error) {
      console.error("Error restoring appointment:", error)
    }
  }

  const permanentDeleteAppointment = async (appointment: Appointment & { source?: 'active' | 'history' }) => {
    if (!window.confirm("PERMANENTLY DELETE? This cannot be undone.")) {
      return
    }

    setDeletedAppointments((prev) => prev.filter((apt) => apt.id !== appointment.id))

    try {
      let endpoint = "/api/appointments?permanent=true"
      if (appointment.source === 'history') {
        endpoint = "/api/history?permanent=true"
      }

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appointment.id }),
      })

      if (response.ok) {
        toast({
          title: "Deleted Permanently",
          description: "Record has been removed from database.",
        })
      }
    } catch (error) {
      console.error("Error permanently deleting:", error)
    }
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
    if (!window.confirm("Are you sure you want to move this history record to Trash?")) {
      return
    }

    try {
      await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      setHistoryRecords((prev) => prev.filter((record) => record.id !== id))
      toast({
        title: "Moved to Trash",
        description: "History record moved to Delete History."
      })
    } catch (error) {
      console.error("Error deleting history record:", error)
    }
  }

  const updateCosting = (id: string, costing: CostingData, immediate = false) => {
    // Track that we are manually updating this record
    lastStateUpdateRef.current[id] = Date.now()

    const updatedCosting = {
      ...costing,
      updatedAt: new Date().toISOString(),
    }

    // 1. Update local state immediately for snappy UI
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, costing: updatedCosting } : apt))
    )

    // 2. Synchronize with backend (Immediate or Debounced)
    const syncWithBackend = async () => {
      try {
        await fetch("/api/appointments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, costing: updatedCosting }),
        })
      } catch (error) {
        console.error("Failed to sync costing to backend:", error)
      }
    }

    // Clear existing timer if any
    if (costingDebounceRef.current[id]) {
      clearTimeout(costingDebounceRef.current[id])
    }

    if (immediate) {
      syncWithBackend()
    } else {
      // Debounce the network request by 1 second to allow smooth typing
      costingDebounceRef.current[id] = setTimeout(syncWithBackend, 1000)
    }
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment({ ...appointment })
    setIsEditModalOpen(true)
  }

  const saveEditedAppointment = async () => {
    if (!editingAppointment) return

    try {
      const response = await fetch("/api/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAppointment.id,
          name: editingAppointment.name,
          email: editingAppointment.email,
          phone: editingAppointment.phone,
          vehicleMake: editingAppointment.vehicleMake,
          vehicleModel: editingAppointment.vehicleModel,
          vehicleYear: editingAppointment.vehicleYear,
          vehiclePlate: editingAppointment.vehiclePlate,
          vehicleColor: editingAppointment.vehicleColor,
          chassisNumber: editingAppointment.chassisNumber,
          engineNumber: editingAppointment.engineNumber,
          assigneeDriver: editingAppointment.assigneeDriver,
          service: editingAppointment.service,
          message: editingAppointment.message,
          insurance: editingAppointment.insurance,
          serviceAdvisor: editingAppointment.serviceAdvisor,
        }),
      })

      if (response.ok) {
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === editingAppointment.id ? editingAppointment : apt))
        )
        setIsEditModalOpen(false)
        setEditingAppointment(null)
        const { dismiss } = toast({
          title: "Appointment Updated",
          description: "Customer details have been successfully updated.",
          action: (
            <ToastAction altText="Dismiss" onClick={() => dismiss()}>
              OK
            </ToastAction>
          ),
        })
      }
    } catch (error) {
      console.error("Error saving appointment:", error)
      const { dismiss } = toast({
        title: "Update Failed",
        description: "There was an error saving the changes.",
        variant: "destructive",
        action: (
          <ToastAction altText="Dismiss" onClick={() => dismiss()}>
            OK
          </ToastAction>
        ),
      })
    }
  }

  const handleDownloadFullReport = (appointment: Appointment) => {
    // Download immediately using existing S/A
    const savedSA = appointment.costing?.serviceAdvisor || appointment.serviceAdvisor || "N/A"
    const savedDelivery = appointment.costing?.deliveryDate

    toast({
      title: "Downloading Report...",
      description: `Service Advisor: ${savedSA}`,
    })

    handlePrintReport(appointment, {
      serviceAdvisor: savedSA,
      deliveryDate: savedDelivery?.toString() || ""
    })
  }

  const handleGenerateGatepass = (appointment: Appointment) => {
    setGatepassData({
      clientName: appointment.name || "",
      unitModel: `${appointment.vehicleYear} ${appointment.vehicleMake} ${appointment.vehicleModel}`.trim(),
      plateNo: appointment.vehiclePlate || "",
      color: appointment.vehicleColor || "",
      insurance: appointment.insurance || "",
      invoiceNo: "",
      orNo: "",
      joNo: appointment.estimateNumber || "",
      amount: appointment.costing?.total || 0,
      cashier: "",
      serviceAdvisor: appointment.costing?.serviceAdvisor || appointment.serviceAdvisor || "Paul D. Suazo",
      note: "",
      date: new Date().toLocaleDateString("en-PH", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    })
    setIsGatepassModalOpen(true)
  }

  const handleDownloadGatepass = async () => {
    const filename = `Gatepass ${gatepassData.plateNo} ${gatepassData.clientName}`.trim()
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups to print the gatepass.",
        variant: "destructive"
      })
      return
    }

    printWindow.document.write(`
      <html>
        <head><title>${filename}</title></head>
        <body style="font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb;">
          <div style="text-align: center; padding: 40px; border-radius: 12px; background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <div style="width: 40px; height: 40px; border: 4px solid #1a5f9c; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <h2 style="color: #111827; margin: 0 0 8px 0; font-size: 18px;">Generating Gatepass</h2>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Preparing the 2-in-1 printout for Sir Paul...</p>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
          </div>
        </body>
      </html>
    `)

    try {
      const htmlContent = await generateGatepassPDF(gatepassData)
      printWindow.document.open()
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
      }, 800)
      setIsGatepassModalOpen(false)
    } catch (error) {
      console.error("Gatepass Error:", error)
      printWindow.close()
      toast({
        title: "Generation Failed",
        description: "Could not create the gatepass PDF.",
        variant: "destructive"
      })
    }
  }


  const handlePrintReport = async (
    appointment: Appointment,
    overrides?: { serviceAdvisor?: string, deliveryDate?: string }
  ) => {
    // 1. Format professional filename for the document title
    const currentEstimateNumber = appointment.estimateNumber || "PENDING";
    const unitModel = `${appointment.vehicleYear} ${appointment.vehicleMake} ${appointment.vehicleModel}`.trim();
    const parts = [
      currentEstimateNumber,
      appointment.vehiclePlate,
      unitModel,
      appointment.insurance,
      appointment.name
    ].filter(part => part && part.toString().trim() !== "" && part.toString().toUpperCase() !== "N/A");

    const filename = parts.join(" ");

    // 2. Open window IMMEDIATELY to satisfy browser security & prevent blocks
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site to view the high-quality report.",
        variant: "destructive",
      });
      return;
    }

    // 3. Open window with organization-friendly title
    printWindow.document.write(`
      <html>
        <head><title>${filename}</title></head>
        <body style="font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb;">
          <div style="text-align: center; padding: 40px; border-radius: 12px; background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <div style="width: 40px; height: 40px; border: 4px solid #1a5f9c; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <h2 style="color: #111827; margin: 0 0 8px 0; font-size: 18px;">Generating Report</h2>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Please wait while we prepare your high-quality PDF...</p>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
          </div>
        </body>
      </html>
    `);

    try {
      let finalEstimateNumber = appointment.estimateNumber;

      // 4. Generate estimate number if missing
      if (!finalEstimateNumber) {
        const response = await fetch("/api/appointments/generate-estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId: appointment.id }),
        });
        if (response.ok) {
          const data = await response.json();
          finalEstimateNumber = data.estimateNumber;
          setAppointments(prev => prev.map(apt =>
            apt.id === appointment.id ? { ...apt, estimateNumber: finalEstimateNumber } : apt
          ));
        }
      }

      // 5. Generate high-quality HTML content using the organizational filename
      // Pass the extra data (S/A and Delivery Date) - use overrides if provided
      const pdfOptions = {
        serviceAdvisor: overrides?.serviceAdvisor || "N/A",
        deliveryDate: overrides?.deliveryDate || ""
      }

      const htmlContent = await generateTrackingPDF(
        { ...appointment, estimateNumber: finalEstimateNumber },
        'admin',
        filename,
        pdfOptions
      );

      // 6. Write to the new window and trigger print
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Give images and layout 800ms to settle for peak quality
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 800);

    } catch (error: any) {
      console.error("Print Error:", error);
      if (printWindow) {
        printWindow.document.body.innerHTML = `<div style="color: red; padding: 20px;">Error generating report: ${error.message}</div>`;
      }
      toast({
        title: "Generation Failed",
        description: "Could not create the high-quality report.",
        variant: "destructive",
      });
    }
  };


  const handleCopyAppointment = (appointment: Appointment) => {
    setCopyFormData({
      name: appointment.name || "",
      email: appointment.email || "",
      phone: appointment.phone || "",
      vehicleMake: appointment.vehicleMake || "",
      vehicleModel: appointment.vehicleModel || "",
      vehicleYear: appointment.vehicleYear || "",
      vehiclePlate: appointment.vehiclePlate || "",
      vehicleColor: appointment.vehicleColor || "",
      chassisNumber: appointment.chassisNumber || "",
      engineNumber: appointment.engineNumber || "",
      assigneeDriver: appointment.assigneeDriver || "",
      service: appointment.service || "",
      message: appointment.message || "",
      insurance: appointment.insurance || "",
      serviceAdvisor: appointment.serviceAdvisor || "",
      damageImages: appointment.damageImages || [],
      orcrImage: appointment.orcrImage || "",
      orcrImage2: appointment.orcrImage2 || "",
    })
    setCopyDamageFiles([])
    setCopyOrcrFile(null)
    setCopyOrcrFile2(null)
    setIsCopyModalOpen(true)
  }

  const saveCopyAppointment = async () => {
    setIsSubmittingCopy(true)
    try {
      const trackingCode = generateTrackingCode()
      let finalDamageImages = [...copyFormData.damageImages]
      let finalOrcrImage = copyFormData.orcrImage
      let finalOrcrImage2 = copyFormData.orcrImage2

      const supabase = createClient()

      // Upload new damage photos if any
      if (copyDamageFiles.length > 0) {
        const uploadPromises = copyDamageFiles.map(async (file) => {
          let fileToUpload: Blob = file
          if (file.type.startsWith('image/')) {
            try {
              fileToUpload = await compressImage(file, 1024, 0.6)
            } catch (err) {
              console.warn('Compression failed, uploading original:', err)
            }
          }

          const fileExt = file.name.split(".").pop()
          const fileName = `${trackingCode}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

          const { data, error } = await supabase.storage
            .from("damage-images")
            .upload(fileName, fileToUpload)

          if (error) throw error

          const { data: { publicUrl } } = supabase.storage
            .from("damage-images")
            .getPublicUrl(data.path)

          return publicUrl
        })

        const newUrls = await Promise.all(uploadPromises)
        finalDamageImages = [...finalDamageImages, ...newUrls]
      }

      // Upload new ORCR 1 if pending
      if (copyOrcrFile) {
        let fileToUpload: Blob = copyOrcrFile
        if (copyOrcrFile.type.startsWith('image/')) {
          try {
            fileToUpload = await compressImage(copyOrcrFile, 1024, 0.6)
          } catch (err) {
            console.warn('Compression failed, uploading original:', err)
          }
        }
        const fileExt = copyOrcrFile.name.split(".").pop()
        const fileName = `${trackingCode}/orcr-${Date.now()}.${fileExt}`
        const { data, error } = await supabase.storage.from("damage-images").upload(fileName, fileToUpload)
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from("damage-images").getPublicUrl(data.path)
        finalOrcrImage = publicUrl
      }

      // Upload new ORCR 2 if pending
      if (copyOrcrFile2) {
        let fileToUpload: Blob = copyOrcrFile2
        if (copyOrcrFile2.type.startsWith('image/')) {
          try {
            fileToUpload = await compressImage(copyOrcrFile2, 1024, 0.6)
          } catch (err) {
            console.warn('Compression failed, uploading original:', err)
          }
        }
        const fileExt = copyOrcrFile2.name.split(".").pop()
        const fileName = `${trackingCode}/orcr2-${Date.now()}.${fileExt}`
        const { data, error } = await supabase.storage.from("damage-images").upload(fileName, fileToUpload)
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from("damage-images").getPublicUrl(data.path)
        finalOrcrImage2 = publicUrl
      }

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingCode,
          ...copyFormData,
          damageImages: finalDamageImages,
          orcrImage: finalOrcrImage,
          orcrImage2: finalOrcrImage2,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `New appointment created with tracking code: ${trackingCode}`,
        })
        setIsCopyModalOpen(false)
        loadAppointments()
      } else {
        const err = await response.json()
        throw new Error(err.error || "Failed to create appointment")
      }
    } catch (error: any) {
      console.error("Error copying appointment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to copy appointment",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingCopy(false)
    }
  }

  const handleCopyImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const fileList = Array.from(files)
    setCopyDamageFiles(prev => [...prev, ...fileList])
  }

  const handleCopyOrcrUpload = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (slot === 1) setCopyOrcrFile(file)
    else setCopyOrcrFile2(file)
  }

  // Focus effect for new items
  useEffect(() => {
    if (focusNewItem) {
      // slight delay to allow render
      setTimeout(() => {
        const element = document.getElementById(`description-${focusNewItem}`)
        if (element) {
          element.focus()
          // set cursor to end if needed, though mostly empty
        }
        setFocusNewItem(null)
      }, 100)
    }
  }, [focusNewItem])

  const addCostItem = (appointmentId: string, type: CostItemType, category?: string) => {
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

    // Determine category: Explicit > Last Selected > Default (undefined)
    // Only inherit for service_labor type items where category makes sense
    let finalCategory = category;
    if (!finalCategory && type === 'service_labor' && selectedCategory) {
      finalCategory = selectedCategory;
    }

    // Update the state if we are explicitly setting a category (e.g. from future UI)
    if (category) {
      setSelectedCategory(category);
    }

    const newItem: CostItem = {
      id: `item-${Date.now()}`,
      type,
      category: finalCategory,
      description: "",
      quantity: 1,
      unit: "PC",
      unitPrice: 0,
      total: 0,
    }

    const newCosting: CostingData = {
      ...currentCosting,
      items: [...currentCosting.items, newItem],
    }

    updateCosting(appointmentId, newCosting, true)
    setFocusNewItem(newItem.id)
  }

  const calculateTotal = (subtotal: number, discount: number, discountType: "fixed" | "percentage", vatEnabled: boolean) => {
    const discountAmount = discountType === "percentage"
      ? (subtotal * discount) / 100
      : discount
    const afterDiscount = Math.max(0, subtotal - discountAmount)
    const vatAmount = vatEnabled ? Math.round(afterDiscount * 0.12 * 100) / 100 : 0
    const total = Math.round((afterDiscount + vatAmount) * 100) / 100
    return {
      discountAmount: Math.round(discountAmount * 100) / 100,
      vatAmount,
      total
    }
  }

  const updateCostItem = (appointmentId: string, itemId: string, updates: Partial<CostItem>, immediate = false) => {
    const appointment = appointments.find((apt) => apt.id === appointmentId)
    if (!appointment?.costing) return

    const updatedItems = appointment.costing.items.map((item) => {
      if (item.id === itemId) {
        // Track category changes if needed (though UI handles global state now)
        if (updates.category) {
          setSelectedCategory(updates.category);
        }

        const updatedItem = { ...item, ...updates }
        updatedItem.total = Math.round(updatedItem.quantity * updatedItem.unitPrice * 100) / 100
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
    }, immediate)
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
    }, true)
  }

  const updateDiscount = (appointmentId: string, discount: number, discountType: "fixed" | "percentage", immediate = false) => {
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
    }, immediate)
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
    }, true)
  }

  const updateCostingNotes = (appointmentId: string, notes: string) => {
    const appointment = appointments.find((apt) => apt.id === appointmentId)
    if (!appointment?.costing) return

    updateCosting(appointmentId, {
      ...appointment.costing,
      notes,
    }, false)
  }

  const updateDeliveryDate = (appointmentId: string, deliveryDate: string) => {
    const appointment = appointments.find((apt) => apt.id === appointmentId)
    if (!appointment?.costing) return

    updateCosting(appointmentId, {
      ...appointment.costing,
      deliveryDate,
    }, false)
  }

  const setIncludePaulSignature = (appointmentId: string, include: boolean) => {
    const appointment = appointments.find((apt) => apt.id === appointmentId)
    if (!appointment?.costing) return

    updateCosting(appointmentId, {
      ...appointment.costing,
      includePaulSignature: include,
    }, true)
  }

  const setIncludeAlfredSignature = (appointmentId: string, include: boolean) => {
    const appointment = appointments.find((apt) => apt.id === appointmentId)
    if (!appointment?.costing) return

    updateCosting(appointmentId, {
      ...appointment.costing,
      includeAlfredSignature: include,
    }, true)
  }

  const updatePaulNotes = (appointmentId: string, notes: string) => {
    // Track that we are manually updating this record
    lastStateUpdateRef.current[appointmentId] = Date.now()

    // 1. Update local state immediately
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === appointmentId ? { ...apt, paulNotes: notes } : apt))
    )

    // 2. Sync with backend (debounced)
    const syncWithBackend = async () => {
      try {
        await fetch("/api/appointments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: appointmentId, paulNotes: notes }),
        })
      } catch (error) {
        console.error("Failed to sync Paul's notes:", error)
      }
    }

    if (costingDebounceRef.current[`paul-${appointmentId}`]) {
      clearTimeout(costingDebounceRef.current[`paul-${appointmentId}`])
    }
    costingDebounceRef.current[`paul-${appointmentId}`] = setTimeout(syncWithBackend, 1000)
  }

  const toggleCardExpanded = (id: string) => {
    setExpandedCards((prev) => {
      const isExpanded = prev.has(id)
      // Preference: Only one expanded at a time
      return isExpanded ? new Set() : new Set([id])
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
    // Unified Status filter
    if (filter !== "all") {
      if (filter === "pending_inspection") {
        // Specific logic for Pending Inspection (includes null/undefined as per stats)
        if (apt.repairStatus && apt.repairStatus !== "pending_inspection") return false
      } else if (filter === "waiting_for_approval") {
        // Specific logic for Waiting for Approval (groups all waiting statuses)
        const waitingStatuses = ["waiting_for_client_approval", "waiting_for_insurance"]
        if (!apt.repairStatus || !waitingStatuses.includes(apt.repairStatus)) return false
      } else if (["pending", "contacted", "completed"].includes(filter)) {
        // Standard Appointment Status
        if (apt.status !== filter) return false
      }
    }
    // Vehicle brand filter
    if (vehicleBrandFilter !== "all" && apt.vehicleMake !== vehicleBrandFilter) return false
    // Date range filter
    if (!isInDateRange(apt.createdAt, dateRangeFilter)) return false
    // Search filter
    if (searchQuery.trim()) {
      const normalizedQuery = normalizeString(searchQuery)
      const matchedMonth = getMatchedMonth(searchQuery)

      const checkMonth = (dateStr?: string) => {
        if (!dateStr) return false
        const d = new Date(dateStr)
        return d.getMonth() === matchedMonth?.index
      }

      const matchesMonth = matchedMonth ? (checkMonth(apt.createdAt) || checkMonth(apt.statusUpdatedAt)) : false

      const matchesName = normalizeString(apt.name).includes(normalizedQuery)
      const matchesEmail = normalizeString(apt.email).includes(normalizedQuery)
      const matchesPhone = normalizeString(apt.phone).includes(normalizedQuery)
      const matchesPlate = normalizeString(apt.vehiclePlate).includes(normalizedQuery)
      const matchesBrand = normalizeString(apt.vehicleMake).includes(normalizedQuery)
      const matchesModel = normalizeString(apt.vehicleModel).includes(normalizedQuery)
      const matchesTrackingCode = normalizeString(apt.trackingCode).includes(normalizedQuery)
      const matchesMessage = normalizeString(apt.message).includes(normalizedQuery)

      const matchesEstimateNumber = normalizeString(apt.estimateNumber || "").includes(normalizedQuery)
      const matchesInsurance = normalizeString(apt.insurance || "").includes(normalizedQuery)

      if (!matchesName && !matchesEmail && !matchesPhone && !matchesPlate && !matchesBrand && !matchesModel && !matchesTrackingCode && !matchesMessage && !matchesEstimateNumber && !matchesInsurance && !matchesMonth) return false
    }
    return true
  })

  const getMatchCategories = (apt: Appointment, query: string) => {
    if (!query.trim()) return []
    const categories: Set<string> = new Set()
    const normQuery = normalizeString(query)
    const matchedMonth = getMatchedMonth(query)

    const checkMonth = (dateStr?: string) => {
      if (!dateStr || !matchedMonth) return false
      const d = new Date(dateStr)
      return d.getMonth() === matchedMonth.index
    }

    // Insurance Category
    if (normalizeString(apt.insurance || "").includes(normQuery) || (matchedMonth && !!apt.insurance && checkMonth(apt.createdAt))) {
      categories.add("Insurance")
    }

    // Estimates Category
    if (normalizeString(apt.estimateNumber || "").includes(normQuery) || (matchedMonth && !!apt.estimateNumber && checkMonth(apt.createdAt))) {
      categories.add("Estimates")
    }

    // Vehicle Status Category
    if (
      normalizeString(apt.repairStatus || "").includes(normQuery) ||
      normalizeString(apt.trackingCode).includes(normQuery) ||
      checkMonth(apt.statusUpdatedAt)
    ) {
      categories.add("Vehicle Status")
    }

    return Array.from(categories)
  }

  const stats = {
    total: appointments.length,
    pending: appointments.filter((apt) => apt.status === "pending").length,
    contacted: appointments.filter((apt) => apt.status === "contacted").length,
    completed: appointments.filter((apt) => apt.status === "completed").length,
    pendingInspection: appointments.filter((apt) => apt.repairStatus === "pending_inspection" || !apt.repairStatus).length,
    waitingForApproval: appointments.filter((apt) => apt.repairStatus === "waiting_for_insurance" || apt.repairStatus === "waiting_for_client_approval").length,
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
        const normalizedQuery = normalizeString(historySearchQuery)
        const matchedMonth = getMatchedMonth(historySearchQuery)

        const checkMonth = (dateStr?: string) => {
          if (!dateStr || !matchedMonth) return false
          const d = new Date(dateStr)
          return d.getMonth() === matchedMonth.index
        }

        const matchesMonth = matchedMonth ? (checkMonth(record.original_created_at) || checkMonth(record.completed_at)) : false

        const matchesTrackingCode = normalizeString(record.tracking_code).includes(normalizedQuery)
        const matchesName = normalizeString(record.name).includes(normalizedQuery)
        const matchesEmail = normalizeString(record.email).includes(normalizedQuery)
        const matchesPhone = normalizeString(record.phone).includes(normalizedQuery)
        const matchesPlate = normalizeString(record.vehicle_plate).includes(normalizedQuery)
        const matchesMake = normalizeString(record.vehicle_make).includes(normalizedQuery)
        const matchesModel = normalizeString(record.vehicle_model).includes(normalizedQuery)

        const matchesInsurance = normalizeString(record.insurance || "").includes(normalizedQuery)
        const matchesEstimateNumber = normalizeString(record.estimate_number || "").includes(normalizedQuery)

        if (!matchesTrackingCode && !matchesName && !matchesEmail && !matchesPhone && !matchesPlate && !matchesMake && !matchesModel && !matchesInsurance && !matchesEstimateNumber && !matchesMonth) {
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

            {/* Center Teleport Button */}
            <div className="hidden md:flex items-center bg-muted/50 p-1 rounded-full border border-border">
              <Button variant="secondary" size="sm" className="rounded-full shadow-sm">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Office / Admin
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Link href="/admin/parts">
                <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-primary transition-all">
                  <Package className="w-4 h-4 mr-2" />
                  Parts Room
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {!isElectron && (
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.1)] transition-all"
                  onClick={() => {
                    window.open('https://drive.google.com/file/d/1QKgR1ooGJLMrUXAh5ZGtSOPnnAKMz4mW/view?usp=sharing', '_blank');

                    toast({
                      title: "Redirecting to Download",
                      description: "Opening Google Drive. Once downloaded, extract the ZIP and run 'electron.exe'.",
                    })
                  }}
                >
                  <Monitor className="w-4 h-4" />
                  <span className="hidden lg:inline">Get Windows App</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout} className="bg-transparent">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground font-medium">Total Requests</div>
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-sm text-muted-foreground font-medium">Pending</div>
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="text-2xl font-bold text-blue-500">{stats.contacted}</div>
            <div className="text-sm text-muted-foreground font-medium">Contacted</div>
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <div className="text-sm text-muted-foreground font-medium">Completed</div>
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="text-2xl font-bold text-orange-500">{stats.pendingInspection}</div>
            <div className="text-sm text-muted-foreground font-medium">Pending Inspection</div>
          </div>
          <div className="p-4 bg-card rounded-xl border border-primary/30">
            <div className="text-2xl font-bold text-primary">{stats.waitingForApproval}</div>
            <div className="text-sm text-muted-foreground font-medium">Waiting for Approval</div>
          </div>
        </div>

        {/* Announcements Section */}
        {announcements.length > 0 && (
          <div className="mb-8 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <Megaphone className="w-5 h-5 fill-primary/10" />
                <h2 className="font-serif text-xl font-bold">Admin Announcements</h2>
              </div>
              {(session?.user?.email === "paulsuazo64@gmail.com" || session?.user?.email === "autoworxcagayan2025@gmail.com" || isDeveloperEmail(session?.user?.email)) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAnnouncementModalOpen(true)}
                  className="h-8 gap-2 border-primary/20 hover:bg-primary/5"
                >
                  <Plus className="w-4 h-4" />
                  New Announcement
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-4 bg-primary/5 border border-primary/10 rounded-xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/30" />
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary/60">
                      From: {ann.author_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(ann.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
                    {ann.content}
                  </p>
                  {(session?.user?.email === "paulsuazo64@gmail.com" || session?.user?.email === "autoworxcagayan2025@gmail.com" || isDeveloperEmail(session?.user?.email)) && (
                    <button
                      onClick={async () => {
                        if (confirm("Delete this announcement?")) {
                          await fetch(`/api/announcements?id=${ann.id}`, { method: "DELETE" })
                          loadAnnouncements()
                        }
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:bg-red-500/10 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {announcements.length === 0 && (session?.user?.email === "paulsuazo64@gmail.com" || session?.user?.email === "autoworxcagayan2025@gmail.com" || isDeveloperEmail(session?.user?.email)) && (
          <div className="mb-8 p-6 bg-primary/5 border border-dashed border-primary/20 rounded-xl text-center">
            <Megaphone className="w-8 h-8 mx-auto text-primary/40 mb-3" />
            <h3 className="font-semibold text-primary/80">No current announcements</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Use this section to broadcast messages to all administrators.
            </p>
            <Button
              size="sm"
              onClick={() => setIsAnnouncementModalOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Post First Announcement
            </Button>
          </div>
        )}

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
              setShowDeletedHistory(false)
              if (historyRecords.length === 0) {
                loadHistory()
              }
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "history" && !showDeletedHistory
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            <HistoryIcon className="w-4 h-4 inline-block mr-2" />
            History ({historyRecords.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("history")
              setShowDeletedHistory(true)
              loadDeletedAppointments()
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "history" && showDeletedHistory
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            <Trash2 className="w-4 h-4 inline-block mr-2" />
            Delete History ({deletedAppointments.length})
          </button>

          {isDeveloperUser && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("recommendations")
                loadRecommendations()
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "recommendations"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              <Heart className="w-4 h-4 inline-block mr-2" />
              Developer Hub ({recommendations.length})
            </button>
          )}
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
                <div className="flex items-center gap-2">
                  <AIAnalystDialog />
                  <Button variant="outline" size="sm" onClick={loadAppointments} className="bg-transparent">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, plate, brand, tracking code, insurance, or estimate #..."
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

              {/* Search Result Summary Feedack */}
              {searchQuery.trim() && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                  <p className="text-sm font-bold text-primary">
                    {filteredAppointments.length === 0
                      ? `No results found for "${searchQuery}"`
                      : `${filteredAppointments.length} result${filteredAppointments.length !== 1 ? 's' : ''} for "${searchQuery}"`}
                  </p>
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending Request</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="pending_inspection">Pending Inspection</SelectItem>
                    <SelectItem value="waiting_for_approval">Waiting for Approval</SelectItem>
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
                {searchQuery.trim() ? (
                  <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                ) : (
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                )}
                <h3 className="font-semibold text-foreground">
                  {searchQuery.trim() ? "No results found" : "No appointments yet"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery.trim()
                    ? `No records found matching "${searchQuery}" in this view.`
                    : "Appointment requests from the booking form will appear here."}
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
                      className="bg-card rounded-xl border border-border overflow-hidden mb-2"
                    >
                      {/* Folder Header */}
                      <div
                        onClick={() => toggleCardExpanded(appointment.id)}
                        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-primary"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm uppercase">
                          <span className="font-mono font-bold text-primary">
                            {appointment.estimateNumber || "NO-ESTIMATE"}
                          </span>
                          <span className="font-bold text-foreground">
                            {appointment.vehiclePlate}
                          </span>
                          <span className="text-muted-foreground">
                            {appointment.vehicleMake} {appointment.vehicleModel}
                          </span>
                          {appointment.insurance && (
                            <span className="text-emerald-600 font-medium px-2 py-0.5 bg-emerald-500/10 rounded-full text-xs">
                              {appointment.insurance}
                            </span>
                          )}
                          <span className="font-medium text-foreground">
                            {appointment.name}
                          </span>
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                          <Badge variant={status.variant} className="mr-2">
                            {status.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Expanded Full Unit Details */}
                      {isExpanded && (
                        <div className="border-t border-border animate-in slide-in-from-top-2 duration-200">
                          <div className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                              {/* Main Info */}
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-3">
                                      <h3 className="font-semibold text-foreground">{appointment.name}</h3>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopyAppointment(appointment)}
                                        className="h-7 px-2 text-[10px] gap-1.5 border-primary/30 hover:bg-primary/5 shadow-sm"
                                      >
                                        <Copy className="w-3 h-3 text-primary" />
                                        Copy & New Appointment
                                      </Button>
                                    </div>
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
                                    {searchQuery.trim() && getMatchCategories(appointment, searchQuery).map(cat => (
                                      <Badge key={cat} variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[9px] h-4">
                                        {cat}
                                      </Badge>
                                    ))}
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
                                  <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
                                    <span className="font-mono font-semibold text-foreground">{appointment.vehiclePlate}</span>
                                    {appointment.vehicleColor && (
                                      <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                                        {appointment.vehicleColor}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {(appointment.chassisNumber || appointment.engineNumber || appointment.assigneeDriver) && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 text-xs border-l-2 border-primary/20 pl-3">
                                    {appointment.chassisNumber && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-muted-foreground">Chassis:</span>
                                        <span className="font-medium">{appointment.chassisNumber}</span>
                                      </div>
                                    )}
                                    {appointment.engineNumber && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-muted-foreground">Engine:</span>
                                        <span className="font-medium">{appointment.engineNumber}</span>
                                      </div>
                                    )}
                                    {appointment.assigneeDriver && (
                                      <div className="flex items-center gap-1.5 sm:col-span-2">
                                        <span className="text-muted-foreground">Assignee/Driver:</span>
                                        <span className="font-medium">{appointment.assigneeDriver}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

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

                                {/* ORCR Images */}
                                {(appointment.orcrImage || appointment.orcrImage2) && (
                                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 mb-2 font-bold uppercase tracking-wider">
                                      <ImageIcon className="w-3 h-3" />
                                      Official Documents (OR/CR)
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                      {appointment.orcrImage && (
                                        <div className="space-y-1 w-[140px]">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const images = [appointment.orcrImage!];
                                              if (appointment.orcrImage2) images.push(appointment.orcrImage2);
                                              setZoomImages(images);
                                              setZoomInitialIndex(0);
                                              setZoomModalOpen(true);
                                            }}
                                            className="relative aspect-[3/2] rounded-md overflow-hidden border border-blue-500/30 hover:border-blue-500 transition-all group cursor-zoom-in w-full shadow-sm"
                                          >
                                            <img
                                              src={appointment.orcrImage}
                                              alt="ORCR Photo 1"
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] py-0.5 text-center font-bold">
                                              PHOTO 1 - CLICK TO ZOOM
                                            </div>
                                          </button>
                                          <a
                                            href={appointment.orcrImage}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-1 text-[8px] text-blue-600 font-bold hover:underline"
                                          >
                                            <Download className="w-2 h-2" /> DOWNLOAD
                                          </a>
                                        </div>
                                      )}
                                      {appointment.orcrImage2 && (
                                        <div className="space-y-1 w-[140px]">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const images = [];
                                              if (appointment.orcrImage) images.push(appointment.orcrImage);
                                              images.push(appointment.orcrImage2!);
                                              setZoomImages(images);
                                              setZoomInitialIndex(images.length - 1);
                                              setZoomModalOpen(true);
                                            }}
                                            className="relative aspect-[3/2] rounded-md overflow-hidden border border-blue-500/30 hover:border-blue-500 transition-all group cursor-zoom-in w-full shadow-sm"
                                          >
                                            <img
                                              src={appointment.orcrImage2}
                                              alt="ORCR Photo 2"
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] py-0.5 text-center font-bold">
                                              PHOTO 2 - CLICK TO ZOOM
                                            </div>
                                          </button>
                                          <a
                                            href={appointment.orcrImage2}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-1 text-[8px] text-blue-600 font-bold hover:underline"
                                          >
                                            <Download className="w-2 h-2" /> DOWNLOAD
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {/* Insurance Info */}
                                {appointment.insurance && (
                                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                    <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                                      <Badge className="w-4 h-4 p-0 flex items-center justify-center bg-emerald-500">
                                        <ShieldCheck className="w-2.5 h-2.5" />
                                      </Badge>
                                      Insurance Information
                                    </div>
                                    <div className="mt-1">
                                      <p className="text-xs text-muted-foreground">Provider</p>
                                      <p className="text-sm font-semibold text-foreground italic">
                                        {appointment.insurance}
                                      </p>
                                    </div>
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
                                {appointment.service === "Rent A Car" && (
                                  <Button
                                    size="sm"
                                    variant={appointment.status === "confirm" ? "default" : "outline"}
                                    onClick={() => updateStatus(appointment.id, "confirm")}
                                    disabled={appointment.status === "confirm"}
                                    className={appointment.status === "confirm" ? "" : "bg-transparent"}
                                  >
                                    Confirm
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 border-blue-500/30 bg-transparent"
                                  onClick={() => handleEditAppointment(appointment)}
                                >
                                  <Settings2 className="w-4 h-4 mr-1" />
                                  Edit
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
                                  onClick={() => softDeleteAppointment(appointment.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete (Trash)
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-primary hover:text-primary/80 border-primary/30 bg-transparent"
                                  onClick={() => handleDownloadFullReport(appointment)}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  {appointment.status === 'pending' ? 'Appointment Confirmation' : 'Download Full Report'}
                                </Button>
                                {appointment.status === 'completed' && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:scale-[1.02]"
                                    onClick={() => handleGenerateGatepass(appointment)}
                                  >
                                    <FileCheck className="w-4 h-4 mr-1" />
                                    Generate Gatepass
                                  </Button>
                                )}
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
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
                                        {REPAIR_STATUS_OPTIONS.filter(opt => {
                                          const isInsuranceExclude = ['waiting_for_insurance', 'insurance_approved'].includes(opt.value);
                                          const isConfirmExclude = opt.value === 'confirm' && appointment.service !== 'Rent A Car';
                                          return !isInsuranceExclude && !isConfirmExclude;
                                        }).map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Insurance Monitoring UI */}
                                  <div className="space-y-3">
                                    {(() => {
                                      const isWaiting = appointment.repairStatus === 'waiting_for_insurance' || appointment.repairStatus === 'insurance_approved' || appointment.repairStatus === 'completed_ready';
                                      const isApproved = appointment.repairStatus === 'insurance_approved' || appointment.repairStatus === 'completed_ready';
                                      const isCompleted = appointment.repairStatus === 'completed_ready';

                                      return (
                                        <>
                                          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            Insurance Monitoring (Admin Only)
                                          </label>
                                          <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border/50 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />

                                            <div className="flex flex-1 items-center justify-between gap-2 max-w-full">
                                              {/* Waiting Approval */}
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className={cn(
                                                  "h-auto flex flex-col gap-1.5 py-2 px-3 border transition-all flex-1 min-w-0",
                                                  isWaiting ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 shadow-sm" : "bg-muted/10 border-muted text-muted-foreground opacity-60 hover:opacity-100"
                                                )}
                                                onClick={() => updateRepairStatus(appointment.id, 'waiting_for_insurance')}
                                              >
                                                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm", isWaiting ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>
                                                  {isWaiting ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-tight truncate w-full">Waiting Approval</span>
                                              </Button>

                                              <ChevronRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />

                                              {/* Approved Step */}
                                              <div className="flex-1 min-w-0">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className={cn(
                                                    "h-auto w-full flex flex-col gap-1.5 py-2 px-3 border transition-all relative overflow-hidden",
                                                    isApproved ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 shadow-sm" : "bg-muted/10 border-muted text-muted-foreground opacity-60 hover:opacity-100"
                                                  )}
                                                  onClick={() => {
                                                    if (!appointment.loaAttachment) {
                                                      document.getElementById(`loa-upload-${appointment.id}`)?.click();
                                                    } else {
                                                      updateRepairStatus(appointment.id, 'insurance_approved');
                                                    }
                                                  }}
                                                >
                                                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm", isApproved ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>
                                                    {isApproved ? <Check className="w-3.5 h-3.5" /> : (isUploadingLOA[appointment.id] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />)}
                                                  </div>
                                                  <span className="text-[9px] font-black uppercase tracking-tight truncate w-full">Approved by Ins.</span>
                                                  {appointment.loaAttachment && <div className="absolute top-0 right-0 bg-emerald-500 text-[8px] text-white px-1 font-bold">LOA</div>}
                                                </Button>
                                              </div>

                                              <ChevronRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />

                                              {/* Completed Step */}
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className={cn(
                                                  "h-auto flex flex-col gap-1.5 py-2 px-3 border transition-all flex-1 min-w-0",
                                                  isCompleted ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 shadow-sm" : "bg-muted/10 border-muted text-muted-foreground opacity-60 hover:opacity-100"
                                                )}
                                                onClick={() => updateRepairStatus(appointment.id, 'completed_ready')}
                                              >
                                                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm", isCompleted ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>
                                                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-tight truncate w-full">Completed</span>
                                              </Button>
                                            </div>
                                          </div>

                                          {/* LOA Actions - Unlimited Array Support */}
                                          <div className="flex flex-col gap-3 min-h-[20px] w-full mt-1">
                                            {/* List of current LOAs */}
                                            {(() => {
                                              const allLOAs = Array.from(new Set([
                                                ...(appointment.loaAttachments || []),
                                                ...(appointment.loaAttachment ? [appointment.loaAttachment] : []),
                                                ...(appointment.loaAttachment2 ? [appointment.loaAttachment2] : [])
                                              ])).filter(Boolean) as string[];

                                              return allLOAs.length > 0 ? (
                                                <div className="space-y-2">
                                                  {allLOAs.map((url, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 w-full bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                                                      <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-700">
                                                        <FileCheck className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-bold uppercase tracking-tight">LOA {idx + 1}</span>
                                                      </div>

                                                      <div className="flex items-center gap-2 ml-auto">
                                                        {url.toLowerCase().endsWith('.pdf') ? (
                                                          <a
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                                                          >
                                                            <FileText className="w-3 h-3" /> View
                                                          </a>
                                                        ) : (
                                                          <button
                                                            onClick={() => {
                                                              setZoomImages([url]);
                                                              setZoomInitialIndex(0);
                                                              setZoomModalOpen(true);
                                                            }}
                                                            className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                                                          >
                                                            <Search className="w-3 h-3" /> Preview
                                                          </button>
                                                        )}

                                                        <div className="w-[1px] h-3 bg-border" />

                                                        <button
                                                          onClick={() => handleRemoveLOA(appointment.id, url)}
                                                          className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors cursor-pointer"
                                                        >
                                                          <Trash2 className="w-3 h-3" /> Remove
                                                        </button>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <p className="text-[10px] text-muted-foreground italic">No LOA attachment found. Click &apos;Approved&apos; to upload.</p>
                                              );
                                            })()}

                                            {/* Upload Trigger */}
                                            <div className="flex items-center justify-between w-full border-t border-dashed border-border pt-2 mt-1">
                                              <p className="text-[9px] text-muted-foreground italic flex items-center gap-1">
                                                <PlusCircle className="w-3 h-3" /> Need more LOAs?
                                              </p>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-[9px] font-bold border-dashed border-emerald-500/40 text-emerald-600 hover:bg-emerald-50"
                                                onClick={() => document.getElementById(`loa-upload-${appointment.id}`)?.click()}
                                              >
                                                Upload LOA
                                              </Button>
                                            </div>
                                          </div>
                                          <input
                                            id={`loa-upload-${appointment.id}`}
                                            type="file"
                                            className="hidden"
                                            accept="image/*,application/pdf"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) handleLOAUpload(appointment.id, file);
                                              e.target.value = ''; // Reset for next selection
                                            }}
                                          />
                                        </>
                                      );
                                    })()}
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
                                            Enter custom part
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

                                {/* Sir Paul's Notes */}
                                <div className="pt-4 border-t border-border space-y-2">
                                  <div className="flex items-center gap-2 text-primary">
                                    <Megaphone className="w-4 h-4" />
                                    <h4 className="font-semibold text-foreground">Sir Paul&apos;s Notes</h4>
                                  </div>
                                  {session?.user?.email === "paulsuazo64@gmail.com" || session?.user?.email === "autoworxcagayan2025@gmail.com" || isDeveloperEmail(session?.user?.email) ? (
                                    <div className="space-y-3">
                                      <Textarea
                                        value={appointment.paulNotes || ""}
                                        onChange={(e) => updatePaulNotes(appointment.id, e.target.value)}
                                        placeholder="Type notes or special instructions for this unit..."
                                        className="min-h-[80px] text-sm bg-primary/5 border-primary/20 focus-visible:ring-primary resize-none"
                                      />
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
                                      {appointment.paulNotes ? (
                                        <div className="space-y-2">
                                          <p className="text-sm text-foreground italic whitespace-pre-wrap">
                                            &ldquo;{appointment.paulNotes}&rdquo;
                                          </p>
                                          {appointment.costing?.includePaulSignature && (
                                            <div className="flex items-center gap-1.5 text-[10px] text-primary font-medium bg-primary/10 w-fit px-2 py-0.5 rounded-full">
                                              <CheckCircle2 className="w-3 h-3" />
                                              Signed by Sir Paul
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                          No specific notes from Sir Paul yet.
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  <p className="text-[10px] text-muted-foreground">
                                    * Visible to all administrators. Authorized personnel only.
                                  </p>
                                </div>

                                {/* Costing Section */}
                                <div className="pt-4 border-t border-border">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                      <Receipt className="w-4 h-4 text-green-500" />
                                      <h4 className="font-semibold text-foreground">Cost Breakdown</h4>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                      <div className="mr-2">
                                        <Select
                                          value={selectedCategory || "default"}
                                          onValueChange={(val) => setSelectedCategory(val === "default" ? undefined : val)}
                                        >
                                          <SelectTrigger className="h-8 w-[140px] text-xs">
                                            <SelectValue placeholder="Category..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="default">Default (None)</SelectItem>
                                            {COST_ITEM_CATEGORIES.map((cat) => (
                                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      {COST_ITEM_TYPES.map((type) => (
                                        <Button
                                          key={type.value}
                                          size="sm"
                                          variant="outline"
                                          onClick={() => addCostItem(appointment.id, type.value, "")}
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
                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-7 gap-3">
                                              {(() => {
                                                const isWidened = widenedItems.has(item.id) || item.description?.includes('\n')
                                                return (
                                                  <div className={cn(isWidened ? "sm:col-span-7" : "sm:col-span-3")}>
                                                    <label className="text-xs text-muted-foreground mb-1 block">
                                                      {item.type === 'parts' ? 'Parts Description' : (item.category ? `${item.category} Description` : (COST_ITEM_TYPES.find(t => t.value === item.type)?.label || ((item.type as any) === 'service' ? 'Service' : (item.type as any) === 'labor' ? 'Labor' : item.type) + ' Description'))}
                                                    </label>
                                                    {isWidened ? (
                                                      <Textarea
                                                        id={`description-${item.id}`}
                                                        value={item.description}
                                                        onChange={(e) => updateCostItem(appointment.id, item.id, { description: e.target.value })}
                                                        onKeyDown={(e) => {
                                                          if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault()
                                                            addCostItem(appointment.id, item.type)
                                                          }
                                                          // Shift+Enter will naturally add a newline in Textarea
                                                        }}
                                                        placeholder="Enter long description..."
                                                        className="min-h-[80px] text-sm bg-background whitespace-pre-wrap"
                                                      />
                                                    ) : (
                                                      <Input
                                                        id={`description-${item.id}`}
                                                        value={item.description}
                                                        onChange={(e) => updateCostItem(appointment.id, item.id, { description: e.target.value })}
                                                        onKeyDown={(e) => {
                                                          if (e.key === 'Enter' && e.shiftKey) {
                                                            e.preventDefault()
                                                            toggleWidenItem(item.id)
                                                            updateCostItem(appointment.id, item.id, { description: item.description + "\n" }, true)
                                                          } else if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault()
                                                            addCostItem(appointment.id, item.type)
                                                          }
                                                        }}
                                                        placeholder="Enter description..."
                                                        className="h-8 text-sm"
                                                      />
                                                    )}
                                                  </div>
                                                )
                                              })()}
                                              <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Qty</label>
                                                <Input
                                                  type="number"
                                                  min="1"
                                                  value={item.quantity}
                                                  onChange={(e) => updateCostItem(appointment.id, item.id, { quantity: parseInt(e.target.value) || 1 })}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                      e.preventDefault()
                                                      addCostItem(appointment.id, item.type)
                                                    }
                                                  }}
                                                  className="h-8 text-sm"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Unit</label>
                                                <Select
                                                  value={item.unit || "PC"}
                                                  onValueChange={(val) => updateCostItem(appointment.id, item.id, { unit: val })}
                                                >
                                                  <SelectTrigger className="h-8 text-sm">
                                                    <SelectValue placeholder="Unit" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    {COMMON_UNITS.map((u) => (
                                                      <SelectItem key={u} value={u}>{u}</SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Unit Price</label>
                                                <Input
                                                  type="number"
                                                  min="0"
                                                  step="0.01"
                                                  value={item.unitPrice}
                                                  onChange={(e) => updateCostItem(appointment.id, item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                      e.preventDefault()
                                                      addCostItem(appointment.id, item.type)
                                                    }
                                                  }}
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
                                            {/* Keyboard Shortcut Hint */}
                                            <div className="mt-1 flex justify-between items-center">
                                              <p className="text-[10px] text-muted-foreground italic">
                                                <kbd className="bg-muted px-1 rounded font-sans not-italic border border-border">Shift+Enter</kbd> to add new line (in-cell)
                                              </p>
                                              <p className="text-[10px] text-muted-foreground italic">
                                                Press <kbd className="bg-muted px-1 rounded font-sans not-italic border border-border">Enter</kbd> to duplicate row
                                              </p>
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
                                            onValueChange={(value) => updateDiscount(appointment.id, appointment.costing?.discount || 0, value as "fixed" | "percentage", true)}
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
                                      </div>

                                      {/* Delivery Info */}
                                      <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                          <label className="text-sm font-medium text-foreground uppercase tracking-widest text-[10px]">Delivery Date (Working Days)</label>
                                          <Input
                                            type="text"
                                            value={appointment.costing?.deliveryDate || ""}
                                            onChange={(e) => updateDeliveryDate(appointment.id, e.target.value)}
                                            placeholder="e.g. 5-7"
                                            className="h-9 text-sm bg-background border-border"
                                          />
                                        </div>

                                        {/* E-Signature Toggles */}
                                        <div className="space-y-3">
                                          {/* Paul D. Suazo Signature Toggle */}
                                          {isAuthorizedAdminEmail(session?.user?.email) && (
                                            <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                                                <ShieldCheck className="w-4 h-4" />
                                                Include E-Signature for Paul D. Suazo?
                                                {!(session?.user?.email === "paulsuazo64@gmail.com" || session?.user?.email === "autoworxcagayan2025@gmail.com" || isDeveloperEmail(session?.user?.email)) && (
                                                  <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground ml-2">READ-ONLY</span>
                                                )}
                                              </div>
                                              <div className="flex gap-2">
                                                <Button
                                                  size="sm"
                                                  variant={appointment.costing?.includePaulSignature ? "default" : "outline"}
                                                  onClick={() => setIncludePaulSignature(appointment.id, true)}
                                                  className="h-7 px-3 text-[10px]"
                                                  disabled={!(session?.user?.email === "paulsuazo64@gmail.com" || session?.user?.email === "autoworxcagayan2025@gmail.com" || isDeveloperEmail(session?.user?.email))}
                                                >
                                                  Yes
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant={appointment.costing?.includePaulSignature === false ? "destructive" : "outline"}
                                                  onClick={() => setIncludePaulSignature(appointment.id, false)}
                                                  className="h-7 px-3 text-[10px]"
                                                  disabled={!(session?.user?.email === "paulsuazo64@gmail.com" || session?.user?.email === "autoworxcagayan2025@gmail.com" || isDeveloperEmail(session?.user?.email))}
                                                >
                                                  No
                                                </Button>
                                              </div>
                                            </div>
                                          )}

                                          {/* Alfred N. Agbong Signature Toggle */}
                                          {isAuthorizedAdminEmail(session?.user?.email) && (
                                            <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                                                <ShieldCheck className="w-4 h-4" />
                                                Include E-Signature for Alfred N. Agbong?
                                                {!(session?.user?.email === "alfred_autoworks@yahoo.com" || session?.user?.email === "paulsuazo64@gmail.com" || session?.user?.email === "autoworxcagayan2025@gmail.com" || isDeveloperEmail(session?.user?.email)) && (
                                                  <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground ml-2">READ-ONLY</span>
                                                )}
                                              </div>
                                              <div className="flex gap-2">
                                                <Button
                                                  size="sm"
                                                  variant={appointment.costing?.includeAlfredSignature ? "default" : "outline"}
                                                  onClick={() => setIncludeAlfredSignature(appointment.id, true)}
                                                  className="h-7 px-3 text-[10px]"
                                                  disabled={!(session?.user?.email === "alfred_autoworks@yahoo.com" || session?.user?.email === "paulsuazo64@gmail.com" || session?.user?.email === "autoworxcagayan2025@gmail.com" || isDeveloperEmail(session?.user?.email))}
                                                >
                                                  Yes
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant={appointment.costing?.includeAlfredSignature === false ? "destructive" : "outline"}
                                                  onClick={() => setIncludeAlfredSignature(appointment.id, false)}
                                                  className="h-7 px-3 text-[10px]"
                                                  disabled={!(session?.user?.email === "alfred_autoworks@yahoo.com" || session?.user?.email === "paulsuazo64@gmail.com" || session?.user?.email === "autoworxcagayan2025@gmail.com" || isDeveloperEmail(session?.user?.email))}
                                                >
                                                  No
                                                </Button>
                                              </div>
                                            </div>
                                          )}
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
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {
          activeTab === "history" && showDeletedHistory && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-destructive/10 p-4 rounded-lg border border-destructive/20 text-destructive mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Trash (Delete History)</span>
                </div>
                <span className="text-sm">Items here are soft-deleted. You can restore them or permanently delete them.</span>
              </div>

              {isLoadingDeleted ? (
                <div className="p-8 text-center animate-pulse">Loading trash...</div>
              ) : deletedAppointments.length === 0 ? (
                <div className="p-12 bg-card rounded-xl border border-border text-center">
                  <Trash2 className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="font-semibold text-foreground">Trash is empty</h3>
                  <p className="text-sm text-muted-foreground mt-1">No deleted items found.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deletedAppointments.map((apt) => (
                    <div key={apt.id} className="bg-card rounded-lg border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                          <Trash2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">{apt.name}</h4>
                          <div className="text-xs text-muted-foreground flex flex-col sm:flex-row gap-x-3 gap-y-1">
                            <span>{apt.vehiclePlate}</span>
                            <span>{apt.vehicleMake} {apt.vehicleModel}</span>
                            <span className="font-mono">{apt.trackingCode}</span>
                            <span className="text-red-500">Deleted: {formatDate(apt.statusUpdatedAt || apt.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 border-green-500/30 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => restoreAppointment(apt)}
                        >
                          <RefreshCw className="w-3 h-3" />
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => permanentDeleteAppointment(apt)}
                        >
                          <X className="w-3 h-3" />
                          Delete Forever
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        }

        {
          activeTab === "history" && !showDeletedHistory && (
            <div className="space-y-6">
              {/* History Toolbar - Search, Filter, Sort */}
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by tracking code, name, email, phone, plate, vehicle, insurance, or estimate #..."
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

                {/* Search Result Summary Feedack */}
                {historySearchQuery.trim() && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                    <p className="text-sm font-bold text-primary">
                      {filteredAndSortedHistory.length === 0
                        ? `No results found for "${historySearchQuery}"`
                        : `${filteredAndSortedHistory.length} result${filteredAndSortedHistory.length !== 1 ? 's' : ''} for "${historySearchQuery}"`}
                    </p>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  Found {filteredAndSortedHistory.length} record{filteredAndSortedHistory.length !== 1 ? "s" : ""}
                </div>
              </div>

              {/* History Records */}
              {filteredAndSortedHistory.length === 0 ? (
                <div className="p-12 bg-card rounded-xl border border-border text-center">
                  {historySearchQuery.trim() ? (
                    <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  ) : (
                    <HistoryIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  )}
                  <h3 className="font-semibold text-foreground">
                    {historySearchQuery.trim() ? "No history records found" : "No history records found"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {historySearchQuery.trim()
                      ? `No historical records found matching "${historySearchQuery}"`
                      : "No completed repairs archived yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAndSortedHistory.map((record) => {
                    const isExpanded = expandedCards.has(record.id)

                    return (
                      <div key={record.id} className="bg-card rounded-xl border border-border overflow-hidden mb-2">
                        {/* Folder Header */}
                        <div
                          onClick={() => toggleCardExpanded(record.id)}
                          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-primary"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm uppercase">
                            <span className="font-mono font-bold text-primary">
                              {record.estimate_number || "NO-ESTIMATE"}
                            </span>
                            <span className="font-bold text-foreground">
                              {record.vehicle_plate}
                            </span>
                            <span className="text-muted-foreground">
                              {record.vehicle_make} {record.vehicle_model}
                            </span>
                            {record.insurance && (
                              <span className="text-emerald-600 font-medium px-2 py-0.5 bg-emerald-500/10 rounded-full text-xs">
                                {record.insurance}
                              </span>
                            )}
                            <span className="font-medium text-foreground">
                              {record.name}
                            </span>
                          </div>

                          <div className="ml-auto flex items-center gap-2">
                            <Badge variant="default" className="mr-2">
                              Completed
                            </Badge>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="border-t border-border animate-in slide-in-from-top-2 duration-200">
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
                                              <span className="text-muted-foreground">
                                                {item.description} {item.quantity > 0 && `(${item.quantity} ${item.unit || 'PC'})`}
                                              </span>
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
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-primary hover:text-primary/80 border-primary/30 bg-transparent"
                                    onClick={() => handleDownloadFullReport({
                                      id: record.id,
                                      trackingCode: record.tracking_code,
                                      name: record.name,
                                      email: record.email,
                                      phone: record.phone,
                                      vehicleMake: record.vehicle_make,
                                      vehicleModel: record.vehicle_model,
                                      vehicleYear: record.vehicle_year,
                                      vehiclePlate: record.vehicle_plate,
                                      vehicleColor: "N/A",
                                      chassisNumber: "N/A",
                                      engineNumber: "N/A",
                                      assigneeDriver: "N/A",
                                      service: record.service,
                                      message: record.message,
                                      status: "completed",
                                      createdAt: record.original_created_at,
                                      repairStatus: record.repair_status as any,
                                      currentRepairPart: record.current_repair_part,
                                      statusUpdatedAt: record.completed_at,
                                      costing: record.costing,
                                      insurance: record.insurance,
                                      estimateNumber: record.estimate_number,
                                      paulNotes: record.paul_notes
                                    } as any)}
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Download Full Report
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:scale-[1.02]"
                                    onClick={() => handleGenerateGatepass({
                                      id: record.id,
                                      trackingCode: record.tracking_code,
                                      name: record.name,
                                      email: record.email,
                                      phone: record.phone,
                                      vehicleMake: record.vehicle_make,
                                      vehicleModel: record.vehicle_model,
                                      vehicleYear: record.vehicle_year,
                                      vehiclePlate: record.vehicle_plate,
                                      vehicleColor: "N/A",
                                      chassisNumber: "N/A",
                                      engineNumber: "N/A",
                                      assigneeDriver: "N/A",
                                      service: record.service,
                                      message: record.message,
                                      status: "completed",
                                      createdAt: record.original_created_at,
                                      repairStatus: record.repair_status as any,
                                      currentRepairPart: record.current_repair_part,
                                      statusUpdatedAt: record.completed_at,
                                      costing: record.costing,
                                      insurance: record.insurance,
                                      estimateNumber: record.estimate_number,
                                      paulNotes: record.paul_notes
                                    } as any)}
                                  >
                                    <FileCheck className="w-4 h-4 mr-1" />
                                    Generate Gatepass
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        }

        {
          activeTab === "recommendations" && isDeveloperUser && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Recommendations & Feedback</h3>
                  <p className="text-sm text-muted-foreground">User-submitted improvement ideas and bug reports</p>
                </div>
                <Button onClick={loadRecommendations} variant="outline" size="sm" disabled={isLoadingRecommendations}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingRecommendations ? 'animate-spin' : ''}`} />
                  Refresh {isLoadingRecommendations && 'ing...'}
                </Button>
              </div>

              {isLoadingRecommendations ? (
                <div className="p-24 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Fetching recommendations...</p>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="p-12 bg-card rounded-xl border border-border text-center">
                  <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-30" />
                  <h3 className="font-semibold text-foreground">No recommendations yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">Feedback from the About page will appear here.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className={`p-6 rounded-xl border transition-all ${rec.is_solved ? 'bg-secondary/30 border-secondary' : 'bg-card border-border shadow-sm'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge variant={
                              rec.type === 'Bug' ? 'destructive' :
                                rec.type === 'Feature' ? 'default' :
                                  'secondary'
                            }>
                              {rec.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{formatDate(rec.created_at)}</span>
                            {rec.is_solved && (
                              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Solved
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-bold text-foreground">{rec.name} ({rec.email})</h4>
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{rec.message}</p>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant={rec.is_solved ? 'outline' : 'default'}
                            onClick={() => updateRecommendation(rec.id, { is_solved: !rec.is_solved })}
                            className="h-8"
                          >
                            {rec.is_solved ? 'Reopen' : 'Mark Solved'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteRecommendation(rec.id)}
                            className="h-8 text-red-500 hover:text-red-400 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        }
      </main>

      {/* Image Zoom Modal */}
      <ImageZoomModal
        images={zoomImages}
        initialIndex={zoomInitialIndex}
        isOpen={zoomModalOpen}
        onClose={() => setZoomModalOpen(false)}
      />

      {/* Archive Confirmation Modal */}
      {
        archiveModalOpen && (
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
        )
      }
      {/* Edit Appointment Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Appointment Details</DialogTitle>
            <DialogDescription>
              Update the customer or vehicle information for this appointment.
            </DialogDescription>
          </DialogHeader>

          {editingAppointment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Customer Name</Label>
                <Input
                  id="edit-name"
                  value={editingAppointment.name}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={editingAppointment.phone}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  value={editingAppointment.email}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-plate">Plate Number</Label>
                <Input
                  id="edit-plate"
                  value={editingAppointment.vehiclePlate}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, vehiclePlate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-make">Vehicle Make</Label>
                <Input
                  id="edit-make"
                  value={editingAppointment.vehicleMake}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, vehicleMake: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-model">Vehicle Model</Label>
                <Input
                  id="edit-model"
                  value={editingAppointment.vehicleModel}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, vehicleModel: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-year">Vehicle Year</Label>
                <Input
                  id="edit-year"
                  value={editingAppointment.vehicleYear}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, vehicleYear: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Vehicle Color</Label>
                <Input
                  id="edit-color"
                  value={editingAppointment.vehicleColor || ""}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, vehicleColor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-chassis">Chassis Number</Label>
                <Input
                  id="edit-chassis"
                  value={editingAppointment.chassisNumber || ""}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, chassisNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-engine">Engine Number</Label>
                <Input
                  id="edit-engine"
                  value={editingAppointment.engineNumber || ""}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, engineNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-assignee">Assignee/Driver</Label>
                <Input
                  id="edit-assignee"
                  value={editingAppointment.assigneeDriver || ""}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, assigneeDriver: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-insurance">Insurance</Label>
                <Input
                  id="edit-insurance"
                  value={editingAppointment.insurance || ""}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, insurance: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sa">Service Advisor (S/A)</Label>
                <Input
                  id="edit-sa"
                  value={editingAppointment.serviceAdvisor || ""}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, serviceAdvisor: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-service">Service Type</Label>
                <Select
                  value={editingAppointment.service}
                  onValueChange={(val) => setEditingAppointment({ ...editingAppointment, service: val })}
                >
                  <SelectTrigger id="edit-service">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-message">Customer Message</Label>
                <Textarea
                  id="edit-message"
                  value={editingAppointment.message || ""}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, message: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditedAppointment}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Announcement Modal */}
      <Dialog open={isAnnouncementModalOpen} onOpenChange={setIsAnnouncementModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Megaphone className="w-5 h-5" />
              Post Board Announcement
            </DialogTitle>
            <DialogDescription>
              This message will be visible to all admins on their dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="announcement-content">Message Content</Label>
              <Textarea
                id="announcement-content"
                placeholder="Type your announcement here..."
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                className="min-h-[120px] resize-none focus-visible:ring-primary"
              />
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Posted as: <span className="font-semibold text-primary">Sir Paul (Service Manager)</span>
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAnnouncementModalOpen(false)}
              disabled={isPostingAnnouncement}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!newAnnouncement.trim()) return
                setIsPostingAnnouncement(true)
                try {
                  const response = await fetch("/api/announcements", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      content: newAnnouncement,
                      authorName: "Sir Paul"
                    })
                  })
                  if (response.ok) {
                    setNewAnnouncement("")
                    setIsAnnouncementModalOpen(false)
                    loadAnnouncements()
                    const { dismiss } = toast({
                      title: "Announcement Posted!",
                      description: "Your message is now live for all admins.",
                      action: (
                        <ToastAction altText="Dismiss" onClick={() => dismiss()}>
                          OK
                        </ToastAction>
                      ),
                    })
                  }
                } catch (error) {
                  console.error("Error posting announcement:", error)
                } finally {
                  setIsPostingAnnouncement(false)
                }
              }}
              disabled={isPostingAnnouncement || !newAnnouncement.trim()}
              className="gap-2"
            >
              {isPostingAnnouncement ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Post Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy & New Appointment Modal */}
      <Dialog open={isCopyModalOpen} onOpenChange={setIsCopyModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Copy className="w-5 h-5 text-primary" />
              Copy & New Appointment
            </DialogTitle>
            <DialogDescription>
              Create a new appointment for this customer using their existing information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Customer & Vehicle Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              <div className="space-y-2">
                <Label htmlFor="copy-name">Customer Name</Label>
                <Input
                  id="copy-name"
                  value={copyFormData.name}
                  onChange={(e) => setCopyFormData({ ...copyFormData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copy-phone">Phone Number</Label>
                <Input
                  id="copy-phone"
                  value={copyFormData.phone}
                  onChange={(e) => setCopyFormData({ ...copyFormData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copy-email">Email Address</Label>
                <Input
                  id="copy-email"
                  value={copyFormData.email}
                  onChange={(e) => setCopyFormData({ ...copyFormData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copy-make">Vehicle Make</Label>
                <Input
                  id="copy-make"
                  value={copyFormData.vehicleMake}
                  onChange={(e) => setCopyFormData({ ...copyFormData, vehicleMake: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copy-model">Vehicle Model</Label>
                <Input
                  id="copy-model"
                  value={copyFormData.vehicleModel}
                  onChange={(e) => setCopyFormData({ ...copyFormData, vehicleModel: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copy-year">Vehicle Year</Label>
                <Input
                  id="copy-year"
                  value={copyFormData.vehicleYear}
                  onChange={(e) => setCopyFormData({ ...copyFormData, vehicleYear: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copy-plate">Plate Number</Label>
                <Input
                  id="copy-plate"
                  className="uppercase"
                  value={copyFormData.vehiclePlate}
                  onChange={(e) => setCopyFormData({ ...copyFormData, vehiclePlate: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copy-color">Vehicle Color</Label>
                <Input
                  id="copy-color"
                  value={copyFormData.vehicleColor}
                  onChange={(e) => setCopyFormData({ ...copyFormData, vehicleColor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copy-chassis">Chassis Number</Label>
                <Input
                  id="copy-chassis"
                  value={copyFormData.chassisNumber}
                  onChange={(e) => setCopyFormData({ ...copyFormData, chassisNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copy-engine">Engine Number</Label>
                <Input
                  id="copy-engine"
                  value={copyFormData.engineNumber}
                  onChange={(e) => setCopyFormData({ ...copyFormData, engineNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copy-insurance">Insurance</Label>
                <Input
                  id="copy-insurance"
                  value={copyFormData.insurance}
                  onChange={(e) => setCopyFormData({ ...copyFormData, insurance: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copy-sa">Service Advisor (S/A)</Label>
                <Input
                  id="copy-sa"
                  value={copyFormData.serviceAdvisor}
                  onChange={(e) => setCopyFormData({ ...copyFormData, serviceAdvisor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copy-assignee">Assignee/Driver</Label>
                <Input
                  id="copy-assignee"
                  value={copyFormData.assigneeDriver}
                  onChange={(e) => setCopyFormData({ ...copyFormData, assigneeDriver: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="copy-service">Service Type</Label>
                <Select
                  value={copyFormData.service}
                  onValueChange={(val) => setCopyFormData({ ...copyFormData, service: val })}
                >
                  <SelectTrigger id="copy-service">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="copy-message">Additional Details / Message</Label>
                <Textarea
                  id="copy-message"
                  value={copyFormData.message}
                  onChange={(e) => setCopyFormData({ ...copyFormData, message: e.target.value })}
                  placeholder="Any specific instructions for this new appointment..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* Photos Section */}
            <div className="space-y-6 pt-4 border-t border-border">
              {/* Damage Photos */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Damage Photos
                </Label>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {/* Existing Copied Images */}
                  {copyFormData.damageImages.map((url: string, idx: number) => (
                    <div key={`copied-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                      <img src={url} alt="Damage" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setCopyFormData({ ...copyFormData, damageImages: copyFormData.damageImages.filter((u: string) => u !== url) })}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove existing photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[8px] text-white px-1 py-0.5 text-center">
                        Copied
                      </div>
                    </div>
                  ))}

                  {/* New Files */}
                  {copyDamageFiles.map((file, idx) => (
                    <div key={`new-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-primary/30 group">
                      <img src={URL.createObjectURL(file)} alt="New Damage" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setCopyDamageFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[8px] text-white px-1 py-0.5 text-center">
                        New
                      </div>
                    </div>
                  ))}

                  {/* Upload Button */}
                  <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1 text-center px-2">Add New Photo</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleCopyImageUpload}
                    />
                  </label>
                </div>
              </div>

              {/* ORCR Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                {/* ORCR 1 */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Official Document (ORCR) 1
                  </Label>
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-border group bg-muted/30">
                    {copyOrcrFile ? (
                      <img src={URL.createObjectURL(copyOrcrFile)} alt="ORCR 1" className="w-full h-full object-contain" />
                    ) : copyFormData.orcrImage ? (
                      <img src={copyFormData.orcrImage} alt="ORCR 1" className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <FileText className="w-8 h-8 mb-2 opacity-20" />
                        <span className="text-xs">No ORCR uploaded</span>
                      </div>
                    )}

                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="bg-white text-black px-3 py-1 rounded text-xs font-medium">Change Photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCopyOrcrUpload(e, 1)} />
                    </label>
                    {(copyOrcrFile || copyFormData.orcrImage) && (
                      <button
                        onClick={() => {
                          if (copyOrcrFile) setCopyOrcrFile(null)
                          else setCopyFormData({ ...copyFormData, orcrImage: "" })
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* ORCR 2 */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Official Document (ORCR) 2
                  </Label>
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-border group bg-muted/30">
                    {copyOrcrFile2 ? (
                      <img src={URL.createObjectURL(copyOrcrFile2)} alt="ORCR 2" className="w-full h-full object-contain" />
                    ) : copyFormData.orcrImage2 ? (
                      <img src={copyFormData.orcrImage2} alt="ORCR 2" className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <FileText className="w-8 h-8 mb-2 opacity-20" />
                        <span className="text-xs">No ORCR uploaded</span>
                      </div>
                    )}

                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="bg-white text-black px-3 py-1 rounded text-xs font-medium">Change Photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCopyOrcrUpload(e, 2)} />
                    </label>
                    {(copyOrcrFile2 || copyFormData.orcrImage2) && (
                      <button
                        onClick={() => {
                          if (copyOrcrFile2) setCopyOrcrFile2(null)
                          else setCopyFormData({ ...copyFormData, orcrImage2: "" })
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-6 border-t border-border pt-6">
            <Button
              variant="outline"
              onClick={() => setIsCopyModalOpen(false)}
              disabled={isSubmittingCopy}
            >
              Cancel
            </Button>
            <Button
              onClick={saveCopyAppointment}
              disabled={isSubmittingCopy}
              className="min-w-[150px]"
            >
              {isSubmittingCopy ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Gatepass Confirmation Modal */}
      <Dialog open={isGatepassModalOpen} onOpenChange={setIsGatepassModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600 font-serif">
              <FileCheck className="w-6 h-6" />
              Confirm Gatepass Details
            </DialogTitle>
            <DialogDescription>
              Review and edit the information that will appear on the 2-in-1 Claim / Check Gatepass.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gate-name">Client Name</Label>
              <Input
                id="gate-name"
                value={gatepassData.clientName}
                onChange={(e) => setGatepassData({ ...gatepassData, clientName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gate-date">Date</Label>
              <Input
                id="gate-date"
                value={gatepassData.date}
                onChange={(e) => setGatepassData({ ...gatepassData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gate-unit">Unit/Model</Label>
              <Input
                id="gate-unit"
                value={gatepassData.unitModel}
                onChange={(e) => setGatepassData({ ...gatepassData, unitModel: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gate-jo">J.O. #</Label>
              <Input
                id="gate-jo"
                placeholder="Job Order Number (provided by Paul)"
                value={gatepassData.joNo}
                onChange={(e) => setGatepassData({ ...gatepassData, joNo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gate-plate">Plate #</Label>
              <Input
                id="gate-plate"
                className="uppercase"
                value={gatepassData.plateNo}
                onChange={(e) => setGatepassData({ ...gatepassData, plateNo: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gate-color">Color</Label>
              <Input
                id="gate-color"
                value={gatepassData.color}
                onChange={(e) => setGatepassData({ ...gatepassData, color: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gate-insurance">Insurance</Label>
              <Input
                id="gate-insurance"
                value={gatepassData.insurance}
                onChange={(e) => setGatepassData({ ...gatepassData, insurance: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gate-cashier">Cashier Name</Label>
              <Input
                id="gate-cashier"
                placeholder="Enter Cashier's Name"
                value={gatepassData.cashier}
                onChange={(e) => setGatepassData({ ...gatepassData, cashier: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gate-invoice">Invoice #</Label>
              <Input
                id="gate-invoice"
                placeholder="Enter Invoice Number"
                value={gatepassData.invoiceNo}
                onChange={(e) => setGatepassData({ ...gatepassData, invoiceNo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gate-sa">Service Advisor</Label>
              <Input
                id="gate-sa"
                value={gatepassData.serviceAdvisor}
                onChange={(e) => setGatepassData({ ...gatepassData, serviceAdvisor: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gate-or">OR #</Label>
              <Input
                id="gate-or"
                placeholder="Official Receipt Number"
                value={gatepassData.orNo}
                onChange={(e) => setGatepassData({ ...gatepassData, orNo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gate-amount">Amount Total</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="gate-amount"
                  className="pl-9 font-mono"
                  value={gatepassData.amount}
                  onChange={(e) => setGatepassData({ ...gatepassData, amount: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="gate-note">Note / Remarks for Guard</Label>
              <Textarea
                id="gate-note"
                placeholder="Any special instructions for the gate security..."
                value={gatepassData.note}
                onChange={(e) => setGatepassData({ ...gatepassData, note: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-6">
            <Button variant="outline" onClick={() => setIsGatepassModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 min-w-[150px]"
              onClick={handleDownloadGatepass}
            >
              <Download className="w-4 h-4" />
              Confirm & Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
