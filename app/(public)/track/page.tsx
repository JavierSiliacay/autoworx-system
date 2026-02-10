"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Mail,
  Phone,
  Car,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings2,
  RefreshCw,
  Users,
  Receipt,
  Wrench,
  Package,
  HardHat,
  Tag,
  ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  getStatusInfo,
  formatAppointmentDate,
  getRepairStatusInfo,
  formatStatusTimestamp,
} from "@/lib/appointment-tracking"
import { COSTING_CONTACT, REPAIR_STATUS_OPTIONS, COST_ITEM_TYPES, type RepairStatus, type CostingData } from "@/lib/constants"
import { ImageZoomModal } from "@/components/ui/image-zoom-modal"
import { generateTrackingPDF } from "@/lib/generate-pdf"
import { Download } from "lucide-react"

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
  // New repair status fields
  repairStatus?: RepairStatus
  currentRepairPart?: string
  statusUpdatedAt?: string
  // Costing data
  costing?: CostingData
  // Damage images
  damageImages?: string[]
  // ORCR image
  orcrImage?: string
}

export default function TrackingPage() {
  const [trackingCode, setTrackingCode] = useState("")
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [error, setError] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [zoomModalOpen, setZoomModalOpen] = useState(false)
  const [zoomImages, setZoomImages] = useState<string[]>([])
  const [zoomInitialIndex, setZoomInitialIndex] = useState(0)
  const [email, setEmail] = useState("") // Declare email state

  // Load pending appointments count
  const loadPendingCount = useCallback(async () => {
    try {
      const response = await fetch("/api/appointments?count=true")
      if (response.ok) {
        const data = await response.json()
        setPendingCount(data.count)
      }
    } catch (error) {
      console.error("Error loading pending count:", error)
    }
    setLastRefreshed(new Date())
  }, [])

  // Refresh appointment data for real-time updates
  const refreshAppointmentData = useCallback(async () => {
    if (!appointment) return

    try {
      const response = await fetch(`/api/appointments?trackingCode=${encodeURIComponent(trackingCode)}`)
      if (response.ok) {
        const data = await response.json()
        if (data && !data.error) {
          setAppointment(dbToFrontend(data))
        }
      }
    } catch (error) {
      console.error("Error refreshing appointment:", error)
    }
    loadPendingCount()
  }, [appointment, trackingCode, loadPendingCount])

  // Initial load and polling setup
  useEffect(() => {
    loadPendingCount()

    // Poll every 10 seconds for real-time updates
    const interval = setInterval(() => {
      loadPendingCount()
      refreshAppointmentData()
    }, 10000)

    return () => clearInterval(interval)
  }, [loadPendingCount, refreshAppointmentData])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setAppointment(null)

    if (!trackingCode) {
      setError("Please enter your tracking code")
      return
    }

    setIsSearching(true)

    try {
      const response = await fetch(`/api/appointments?trackingCode=${encodeURIComponent(trackingCode.toUpperCase())}`)
      const data = await response.json()

      if (data && !data.error) {
        setAppointment(dbToFrontend(data))
      } else {
        setError("No appointment found. Please check your tracking code.")
      }
    } catch (error) {
      console.error("Error searching appointment:", error)
      setError("An error occurred. Please try again.")
    }
    setIsSearching(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5" />
      case "contacted":
        return <AlertCircle className="w-5 h-5" />
      case "completed":
        return <CheckCircle className="w-5 h-5" />
      default:
        return null
    }
  }

  const repairStatusInfo = appointment ? getRepairStatusInfo(appointment.repairStatus) : null

  const handleDownloadPDF = async () => {
    if (!appointment) return

    const htmlContent = await generateTrackingPDF(appointment)
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-card to-background pt-24 pb-16">
      <div className="mx-auto max-w-2xl px-4 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="font-serif text-4xl font-bold text-foreground">Track Your Appointment</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your tracking code to see the status of your appointment request.
          </p>
        </div>

        {/* Pending Appointments Counter */}
        <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-orange-500/20 rounded-lg">
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Appointments</p>
                <p className="text-2xl font-bold text-orange-500">{pendingCount}</p>
              </div>
            </div>
            <div className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  loadPendingCount()
                  refreshAppointmentData()
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              {lastRefreshed && (
                <p className="text-xs text-muted-foreground mt-1">
                  Updated {lastRefreshed.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-card rounded-xl border border-border p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tracking">Tracking Code *</Label>
              <Input
                id="tracking"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                placeholder="Enter your tracking code (e.g., M5K2XYZ-ABC123)"
                required
                className="text-center font-mono text-lg tracking-wider"
              />
              <p className="text-xs text-muted-foreground text-center">
                Your tracking code was provided when you booked your appointment
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-500 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isSearching}>
              {isSearching ? "Searching..." : "Track Appointment"}
            </Button>
          </form>
        </div>

        {/* Appointment Details */}
        {appointment && (
          <div className="space-y-6">
            {/* Download PDF Button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Status Report
              </Button>
            </div>
            {/* Repair Status Card - NEW PROMINENT SECTION */}
            {repairStatusInfo && (
              <div
                className={`p-6 rounded-xl border-2 ${repairStatusInfo.borderColor} ${repairStatusInfo.bgColor}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full ${repairStatusInfo.bgColor} ${repairStatusInfo.color}`}
                  >
                    <Settings2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Current Repair Status</p>
                    <h2 className={`font-serif text-2xl font-bold ${repairStatusInfo.color}`}>
                      {repairStatusInfo.label}
                    </h2>
                    <p className="text-muted-foreground mt-1">{repairStatusInfo.description}</p>

                    {appointment.currentRepairPart && (
                      <div className="mt-4 p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Currently Working On</p>
                        <p className="font-semibold text-foreground">{appointment.currentRepairPart}</p>
                      </div>
                    )}

                    {appointment.statusUpdatedAt && (
                      <p className="text-xs text-muted-foreground mt-4">
                        Last updated: {formatStatusTimestamp(appointment.statusUpdatedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="mt-6 pt-6 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-3">Repair Progress</p>
                  <div className="flex items-center gap-2">
                    {REPAIR_STATUS_OPTIONS.map((option, index) => {
                      const currentStep = repairStatusInfo.step
                      const optionStep = index + 1
                      const isCompleted = currentStep >= optionStep
                      const isCurrent = appointment.repairStatus === option.value

                      return (
                        <React.Fragment key={option.value}>
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${isCurrent
                              ? `${repairStatusInfo.bgColor} ${repairStatusInfo.color} ring-2 ring-offset-2 ring-offset-background ${repairStatusInfo.borderColor.replace("border-", "ring-")}`
                              : isCompleted
                                ? "bg-green-500/20 text-green-500"
                                : "bg-muted text-muted-foreground"
                              }`}
                            title={option.label}
                          >
                            {isCompleted && !isCurrent ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              optionStep
                            )}
                          </div>
                          {index < REPAIR_STATUS_OPTIONS.length - 1 && (
                            <div
                              className={`flex-1 h-1 rounded ${currentStep > optionStep ? "bg-green-500/50" : "bg-muted"
                                }`}
                            />
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Appointment Status Card */}
            <div
              className={`p-6 rounded-xl border ${getStatusInfo(appointment.status).borderColor} ${getStatusInfo(appointment.status).bgColor}`}
            >
              <div className="flex items-start gap-4">
                <div className={`${getStatusInfo(appointment.status).color}`}>
                  {getStatusIcon(appointment.status)}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Appointment Status</p>
                  <h2 className={`font-serif text-xl font-bold ${getStatusInfo(appointment.status).color}`}>
                    {getStatusInfo(appointment.status).label}
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {getStatusInfo(appointment.status).description}
                  </p>
                </div>
              </div>
            </div>

            {/* Appointment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Info */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Name</p>
                    <p className="text-foreground">{appointment.name}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-primary mt-1 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Email</p>
                      <a href={`mailto:${appointment.email}`} className="text-primary hover:underline break-all">
                        {appointment.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-primary mt-1 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Phone</p>
                      <a href={`tel:${appointment.phone}`} className="text-primary hover:underline">
                        {appointment.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">Vehicle Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <Car className="w-4 h-4 text-primary mt-1 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Vehicle</p>
                      <p className="text-foreground">
                        {appointment.vehicleYear} {appointment.vehicleMake} {appointment.vehicleModel}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Plate Number</p>
                    <p className="font-mono font-semibold text-foreground">{appointment.vehiclePlate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Service Requested</p>
                    <p className="text-foreground">{appointment.service}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Appointment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Preferred Date
                  </p>
                  <p className="text-foreground">{formatAppointmentDate(appointment.preferredDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Request Date
                  </p>
                  <p className="text-foreground">
                    {new Date(appointment.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Tracking Code</p>
                  <p className="font-mono font-semibold text-primary">{appointment.trackingCode}</p>
                </div>
              </div>

              {appointment.message && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Additional Details</p>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">{appointment.message}</p>
                </div>
              )}

              {/* Uploaded Damage Photos */}
              {appointment.damageImages && appointment.damageImages.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Uploaded Damage Photos ({appointment.damageImages.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {appointment.damageImages.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setZoomImages(appointment.damageImages || [])
                          setZoomInitialIndex(index)
                          setZoomModalOpen(true)
                        }}
                        className="relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors group cursor-zoom-in"
                      >
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Damage photo ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
                          Photo {index + 1}
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Click on an image to zoom in
                  </p>
                </div>
              )}

              {/* ORCR Document */}
              {appointment.orcrImage && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    ORCR (Official Receipt/Certificate of Registration)
                  </p>
                  <div className="max-w-md mx-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setZoomImages([appointment.orcrImage!])
                        setZoomInitialIndex(0)
                        setZoomModalOpen(true)
                      }}
                      className="relative aspect-[3/2] rounded-lg overflow-hidden border-2 border-primary/50 hover:border-primary transition-colors group cursor-zoom-in w-full"
                    >
                      <img
                        src={appointment.orcrImage}
                        alt="ORCR Document"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-sm py-2 text-center font-medium">
                        ORCR Document - Click to Zoom
                      </div>
                    </button>
                    <p className="text-[10px] text-muted-foreground mt-2 text-center">
                      Click on the image to zoom in
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Cost Breakdown - Only show if costing data exists */}
            {appointment.costing && appointment.costing.items.length > 0 && (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-green-500/5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-lg">
                      <Receipt className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Cost Breakdown</h3>
                      <p className="text-xs text-muted-foreground">
                        Last updated: {new Date(appointment.costing.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Group items by type */}
                  {COST_ITEM_TYPES.map((type) => {
                    const items = appointment.costing?.items.filter(item => item.type === type.value) || []
                    if (items.length === 0) return null

                    const typeIcon = {
                      service: <Wrench className="w-4 h-4" />,
                      parts: <Package className="w-4 h-4" />,
                      labor: <HardHat className="w-4 h-4" />,
                      custom: <Tag className="w-4 h-4" />,
                    }[type.value]

                    const typeColor = {
                      service: "text-blue-500 bg-blue-500/10",
                      parts: "text-orange-500 bg-orange-500/10",
                      labor: "text-purple-500 bg-purple-500/10",
                      custom: "text-cyan-500 bg-cyan-500/10",
                    }[type.value]

                    return (
                      <div key={type.value} className="space-y-2">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${typeColor}`}>
                          {typeIcon}
                          {type.label}
                        </div>
                        <div className="bg-secondary/50 rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left p-3 text-muted-foreground font-medium">Description</th>
                                <th className="text-center p-3 text-muted-foreground font-medium w-16">Qty</th>
                                <th className="text-right p-3 text-muted-foreground font-medium w-24">Unit Price</th>
                                <th className="text-right p-3 text-muted-foreground font-medium w-28">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item) => (
                                <tr key={item.id} className="border-b border-border/50 last:border-0">
                                  <td className="p-3 text-foreground">{item.description || "-"}</td>
                                  <td className="p-3 text-center text-foreground">{item.quantity}</td>
                                  <td className="p-3 text-right font-mono text-foreground">
                                    P{item.unitPrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="p-3 text-right font-mono font-semibold text-foreground">
                                    P{item.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })}

                  {/* Summary */}
                  <div className="pt-4 border-t border-border space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono text-foreground">
                        P{appointment.costing.subtotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {appointment.costing.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Discount {appointment.costing.discountType === "percentage" ? `(${appointment.costing.discount}%)` : ""}
                        </span>
                        <span className="font-mono text-red-500">
                          -{appointment.costing.discountType === "percentage"
                            ? `P${((appointment.costing.subtotal * appointment.costing.discount) / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                            : `P${appointment.costing.discount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                          }
                        </span>
                      </div>
                    )}
                    {appointment.costing.vatEnabled && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">VAT (12%)</span>
                        <span className="font-mono text-foreground">
                          +P{(appointment.costing.vatAmount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <div>
                        <span className="font-semibold text-foreground text-lg">Total Amount</span>
                        {appointment.costing.vatEnabled && (
                          <span className="text-xs text-muted-foreground ml-2">(VAT inclusive)</span>
                        )}
                      </div>
                      <span className="font-mono text-2xl font-bold text-green-500">
                        P{appointment.costing.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {appointment.costing.notes && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Notes from the shop:</p>
                      <p className="text-sm text-foreground bg-secondary/50 p-3 rounded-lg whitespace-pre-wrap">
                        {appointment.costing.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Costing Contact Info - Only show if no costing data */}
            {(!appointment.costing || appointment.costing.items.length === 0) && (
              <div className="bg-primary/5 rounded-xl border border-primary/30 p-6">
                <h3 className="font-semibold text-foreground mb-3">Need a Cost Estimate?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  For costing and estimation inquiries, please contact:
                </p>
                <div className="flex items-center gap-4 p-4 bg-background rounded-lg border border-border">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{COSTING_CONTACT.name}</p>
                    <a
                      href={`tel:${COSTING_CONTACT.phone.replace(/-/g, "")}`}
                      className="text-primary hover:underline font-mono"
                    >
                      {COSTING_CONTACT.phone}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-secondary/50 rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-3">What&apos;s Next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {appointment.status === "pending" && (
                  <>
                    <li>- We received your appointment request</li>
                    <li>- Our team will review your request within 24 hours</li>
                    <li>- We will contact you to confirm the appointment date and time</li>
                  </>
                )}
                {appointment.status === "contacted" && (
                  <>
                    <li>- We received your appointment request</li>
                    <li>- We have contacted you about your appointment</li>
                    <li>- Please check your email or phone for our message</li>
                    <li>- Confirm the appointment details with us</li>
                  </>
                )}
                {appointment.status === "completed" && (
                  <>
                    <li>- We received your appointment request</li>
                    <li>- We contacted you about your appointment</li>
                    <li>- Your appointment has been completed</li>
                    <li>Thank you for choosing Autoworx Repairs!</li>
                  </>
                )}
              </ul>
            </div>

            {/* Support */}
            <div className="text-center pt-6 border-t border-border">
              <p className="text-muted-foreground mb-4">
                Having trouble? Need to speak with us directly?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline" className="bg-transparent">
                  <a href="tel:0936-354-9603">Call us at 0936-354-9603</a>
                </Button>
                <Button asChild variant="outline" className="bg-transparent">
                  <a href="mailto:autoworxcagayan2025@gmail.com">Email us</a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {!appointment && !error && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Enter your tracking code above to view your appointment or vehicle status
            </p>
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      <ImageZoomModal
        images={zoomImages}
        initialIndex={zoomInitialIndex}
        isOpen={zoomModalOpen}
        onClose={() => setZoomModalOpen(false)}
      />
    </main>
  )
}
