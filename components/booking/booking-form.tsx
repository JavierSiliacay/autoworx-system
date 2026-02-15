"use client"

import React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Send, Loader2, CheckCircle, Download, Camera, X, AlertTriangle, ImageIcon, ShieldCheck, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatPhoneNumber, isValidPhoneNumber } from "@/lib/phone-format"
import { generateTrackingCode } from "@/lib/appointment-tracking"
import { VEHICLE_BRANDS, SERVICES } from "@/lib/constants"
import { generateConfirmationPDF } from "@/lib/generate-pdf"
import { Calendar } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { createClient } from "@/lib/supabase/client"
import { compressImage } from "@/lib/image-utils"

const years = Array.from({ length: 35 }, (_, i) => (new Date().getFullYear() - i).toString())
const services = SERVICES; // Declare the services variable

export interface BookingFormData {
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
  preferredDate: string
  message: string
  orcrImage?: string
  insurance?: string
}

export function BookingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [submittedData, setSubmittedData] = useState<BookingFormData | null>(null)
  const [trackingCode, setTrackingCode] = useState<string>("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<BookingFormData>({
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
    preferredDate: "",
    message: "",
    insurance: "",
  })
  const [damageImages, setDamageImages] = useState<string[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const [uploadedImageFiles, setUploadedImageFiles] = useState<File[]>([])
  const [orcrImage, setOrcrImage] = useState<string>("")
  const [orcrImageFile, setOrcrImageFile] = useState<File | null>(null)
  const [isUploadingOrcr, setIsUploadingOrcr] = useState(false)
  const [useCustomMake, setUseCustomMake] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Full name is required"
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!isValidPhoneNumber(formData.phone)) {
      newErrors.phone = "Invalid Philippine phone number"
    }

    if (!formData.vehicleMake.trim()) newErrors.vehicleMake = "Manufacturer is required"
    if (!formData.vehicleModel.trim()) newErrors.vehicleModel = "Model is required"
    if (!formData.vehicleYear) newErrors.vehicleYear = "Year is required"
    if (!formData.vehiclePlate.trim()) newErrors.vehiclePlate = "Plate number is required"
    if (!formData.vehicleColor.trim()) newErrors.vehicleColor = "Color is required"
    if (!formData.service) newErrors.service = "Service type is required"
    if (!orcrImage) newErrors.orcrImage = "ORCR document is required"
    if (!captchaVerified) newErrors.captcha = "Please verify you're not a robot"

    setErrors(newErrors)
    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      // Scroll to the first error
      const firstError = Object.keys(newErrors)[0]
      const element = document.getElementById(firstError)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setIsSubmitting(true)

    try {
      const trackingCodeGenerated = generateTrackingCode()
      let uploadedImageUrls: string[] = []
      let uploadedOrcrUrl = ""

      // Upload images directly to Supabase Storage if any
      // This bypasses Vercel's 4.5MB payload limit which causes "Failed to fetch" errors on mobile
      if (uploadedImageFiles.length > 0 || orcrImageFile) {
        const supabase = createClient()
        const filesToUpload = [...uploadedImageFiles]
        if (orcrImageFile) {
          filesToUpload.push(orcrImageFile)
        }

        const uploadPromises = filesToUpload.map(async (file) => {
          // Compress image before upload (max 1200px width, 70% quality)
          let fileToUpload: Blob = file;
          if (file.type.startsWith('image/')) {
            try {
              fileToUpload = await compressImage(file, 1200, 0.7);
            } catch (err) {
              console.warn('Compression failed, uploading original:', err);
            }
          }

          const fileExt = file.name.split(".").pop()
          const fileName = `${trackingCodeGenerated}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

          const { data, error } = await supabase.storage
            .from("damage-images")
            .upload(fileName, fileToUpload)

          if (error) throw error

          const { data: { publicUrl } } = supabase.storage
            .from("damage-images")
            .getPublicUrl(data.path)

          return publicUrl
        })

        const allUrls = await Promise.all(uploadPromises)

        if (orcrImageFile) {
          uploadedOrcrUrl = allUrls[allUrls.length - 1]
          uploadedImageUrls = allUrls.slice(0, -1)
        } else {
          uploadedImageUrls = allUrls
        }
      }

      // Create appointment in Supabase
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingCode: trackingCodeGenerated,
          ...formData,
          damageImages: uploadedImageUrls,
          orcrImage: uploadedOrcrUrl,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `Failed to create appointment (${response.status})`)
      }

      const appointmentData = await response.json()

      // Email is now handled by the server


      setIsSubmitting(false)
      setSubmittedData(formData)
      setTrackingCode(trackingCodeGenerated)
      setIsSubmitted(true)
    } catch (error) {
      console.error("Error submitting appointment:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      alert(`Error submitting appointment:\n\n${errorMessage}\n\nPlease check the browser console for more details and try again.`)
      setIsSubmitting(false)
    }
  }

  const downloadConfirmationPDF = async () => {
    if (!submittedData) return

    try {
      const htmlContent = await generateConfirmationPDF({
        trackingCode,
        appointmentData: submittedData,
      })

      // Fix: Open a new window and write the HTML content directly.
      // Using a blob URL causes relative paths like /autoworxlogo.png to fail.
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()

        // Wait for images to load before printing
        setTimeout(() => {
          printWindow.print()
        }, 500)
      } else {
        // Fallback: download as HTML if popup is blocked
        const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `Autoworx_Appointment_Confirmation_${trackingCode}.html`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("[v0] Error generating confirmation:", error)
      alert("Error downloading confirmation. Please try again.")
    }
  }

  const updateField = (field: keyof BookingFormData, value: string) => {
    // Format phone number if it's the phone field
    let finalValue = value
    if (field === "phone") {
      finalValue = formatPhoneNumber(value)
    }

    setFormData((prev) => ({
      ...prev,
      [field]: finalValue,
    }))

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingImage(true)

    const newImages: string[] = []
    const newFiles: File[] = []
    const maxImages = 5
    const remainingSlots = maxImages - damageImages.length

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i]

      // Validate file type
      if (!file.type.startsWith("image/")) {
        continue
      }

      // Files larger than 5MB will be automatically compressed by the system during submission

      // Store the file for later upload
      newFiles.push(file)

      // Convert to base64 for preview
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve(reader.result as string)
        }
        reader.readAsDataURL(file)
      })

      newImages.push(base64)
    }

    setDamageImages((prev) => [...prev, ...newImages])
    setUploadedImageFiles((prev) => [...prev, ...newFiles])
    setIsUploadingImage(false)

    // Reset the input
    e.target.value = ""
  }

  const removeImage = (index: number) => {
    setDamageImages((prev) => prev.filter((_, i) => i !== index))
    setUploadedImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleOrcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file")
      return
    }

    // Files larger than 5MB will be automatically compressed by the system during submission

    setIsUploadingOrcr(true)

    // Store the file for later upload
    setOrcrImageFile(file)

    // Convert to base64 for preview
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result as string)
      }
      reader.readAsDataURL(file)
    })

    setOrcrImage(base64)
    setIsUploadingOrcr(false)

    // Clear ORCR error
    if (errors.orcrImage) {
      setErrors(prev => {
        const next = { ...prev }
        delete next.orcrImage
        return next
      })
    }

    // Reset the input
    e.target.value = ""
  }

  const removeOrcrImage = () => {
    setOrcrImage("")
    setOrcrImageFile(null)
  }

  if (isSubmitted) {
    return (
      <div className="p-8 bg-card rounded-xl border border-border text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10 text-primary animate-in zoom-in-50 duration-500">
          <CheckCircle className="w-8 h-8 animate-in spin-in-1.5 duration-1000" />
        </div>
        <h3 className="mt-4 font-serif text-2xl font-bold text-foreground animate-in slide-in-from-top-2 duration-700">Request Submitted!</h3>
        <p className="mt-2 text-muted-foreground animate-in slide-in-from-bottom-2 duration-700">
          Thank you for choosing Autoworx Repairs. We'll contact you within 24 hours to confirm your appointment.
        </p>

        {/* Tracking Code Section */}
        <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/30 animate-in slide-in-from-left-2 duration-700">
          <p className="text-xs text-muted-foreground mb-2">Your Tracking Code</p>
          <p className="font-mono text-lg font-bold text-primary tracking-wider animate-pulse">{trackingCode}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Save this code to track your appointment status
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              variant="outline"
              className="mt-3 text-xs bg-transparent group"
              onClick={() => {
                navigator.clipboard.writeText(trackingCode)
                // Use a more subtle feedback if possible, but keep simple for now
                const btn = document.activeElement as HTMLButtonElement
                const originalText = btn.innerText
                btn.innerText = "Copied!"
                setTimeout(() => { btn.innerText = originalText }, 2000)
              }}
            >
              <ShieldCheck className="mr-1 w-3 h-3 group-hover:scale-110 transition-transform" />
              Copy Code
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 text-xs bg-transparent group"
              asChild
            >
              <Link href={`/track?code=${trackingCode}`}>
                <Star className="mr-1 w-3 h-3 group-hover:scale-110 transition-transform text-amber-500" />
                Track Status
              </Link>
            </Button>
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center animate-in slide-in-from-right-2 duration-700">
          <Button onClick={downloadConfirmationPDF} variant="default" className="gap-2 group">
            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Download Confirmation
          </Button>
          <Button
            className="bg-transparent group"
            variant="outline"
            onClick={() => {
              setIsSubmitted(false)
              setCaptchaVerified(false)
              setSubmittedData(null)
              setDamageImages([])
              setUploadedImageFiles([])
              setOrcrImage("")
              setOrcrImageFile(null)
              setFormData({
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
                preferredDate: "",
                message: "",
                insurance: "",
              })
            }}
          >
            <Star className="mr-2 w-4 h-4 group-hover:scale-110 transition-transform" />
            Book Another Appointment
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="p-6 lg:p-8 bg-card rounded-xl border border-border">
      <div className="space-y-6">
        {/* Personal Information */}
        <div className="animate-in fade-in slide-in-from-left-2 duration-500">
          <h3 className="font-semibold text-foreground mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 group">
              <Label htmlFor="name" className={`transition-colors ${errors.name ? 'text-red-500' : 'group-hover:text-primary'}`}>Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="John Doe"
                className={`transition-all ${errors.name ? 'border-red-500 ring-red-500/10 focus-visible:ring-red-500/20' : 'group-focus-within:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary/20'}`}
              />
              {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="phone" className={`transition-colors ${errors.phone ? 'text-red-500' : 'group-hover:text-primary'}`}>Phone Number (PH) *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="09XX-XXX-XXXX"
                maxLength={12}
                className={`transition-all ${errors.phone ? 'border-red-500 ring-red-500/10 focus-visible:ring-red-500/20' : 'group-focus-within:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary/20'}`}
              />
              {errors.phone && <p className="text-xs text-red-500 font-medium">{errors.phone}</p>}
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="email" className={`transition-colors ${errors.email ? 'text-red-500' : 'group-hover:text-primary'}`}>Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="john@example.com"
                className={`transition-all ${errors.email ? 'border-red-500 ring-red-500/10 focus-visible:ring-red-500/20' : 'group-focus-within:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary/20'}`}
              />
              {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email}</p>}
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="assigneeDriver" className="group-hover:text-primary transition-colors">Assignee / Driver</Label>
              <Input
                id="assigneeDriver"
                value={formData.assigneeDriver}
                onChange={(e) => updateField("assigneeDriver", e.target.value)}
                placeholder="Person processing the document"
                className="group-focus-within:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="animate-in fade-in slide-in-from-right-2 duration-500">
          <h3 className="font-semibold text-foreground mb-4">Vehicle Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2 group">
              <Label htmlFor="vehicleMake" className={`transition-colors ${errors.vehicleMake ? 'text-red-500' : 'group-hover:text-primary'}`}>Manufacturer *</Label>
              {!useCustomMake ? (
                <Select
                  value={formData.vehicleMake}
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setUseCustomMake(true)
                      updateField("vehicleMake", "")
                    } else {
                      updateField("vehicleMake", value)
                    }
                  }}
                >
                  <SelectTrigger id="vehicleMake" className={`transition-all ${errors.vehicleMake ? 'border-red-500 ring-red-500/10' : 'group-focus-within:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary/20'}`}>
                    <SelectValue placeholder="Select vehicle brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_BRANDS.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      ✏️ Enter custom make
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    id="vehicleMake"
                    value={formData.vehicleMake}
                    onChange={(e) => updateField("vehicleMake", e.target.value)}
                    placeholder="Enter vehicle make"
                    className={`flex-1 transition-all ${errors.vehicleMake ? 'border-red-500 ring-red-500/10' : 'group-focus-within:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary/20'}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setUseCustomMake(false)
                      updateField("vehicleMake", "")
                    }}
                    className="px-3"
                  >
                    Cancel
                  </Button>
                </div>
              )}
              {errors.vehicleMake && <p className="text-xs text-red-500 font-medium">{errors.vehicleMake}</p>}
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="vehicleModel" className={`transition-colors ${errors.vehicleModel ? 'text-red-500' : 'group-hover:text-primary'}`}>Model *</Label>
              <Input
                id="vehicleModel"
                value={formData.vehicleModel}
                onChange={(e) => updateField("vehicleModel", e.target.value)}
                placeholder="Camry"
                className={`transition-all ${errors.vehicleModel ? 'border-red-500 ring-red-500/10 focus-visible:ring-red-500/20' : 'group-focus-within:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary/20'}`}
              />
              {errors.vehicleModel && <p className="text-xs text-red-500 font-medium">{errors.vehicleModel}</p>}
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="vehicleYear" className={`transition-colors ${errors.vehicleYear ? 'text-red-500' : 'group-hover:text-primary'}`}>Year *</Label>
              <Select
                value={formData.vehicleYear}
                onValueChange={(value) => updateField("vehicleYear", value)}
              >
                <SelectTrigger id="vehicleYear" className={`transition-all ${errors.vehicleYear ? 'border-red-500 ring-red-500/10' : 'group-focus-within:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary/20'}`}>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicleYear && <p className="text-xs text-red-500 font-medium">{errors.vehicleYear}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2 group">
              <Label htmlFor="vehiclePlate" className={`transition-colors ${errors.vehiclePlate ? 'text-red-500' : 'group-hover:text-primary'}`}>Vehicle Plate Number * (MUST ALL BIG LETTERS)</Label>
              <Input
                id="vehiclePlate"
                value={formData.vehiclePlate}
                onChange={(e) => updateField("vehiclePlate", e.target.value)}
                placeholder="ABC-1234 or ABC1234"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                maxLength={10}
                className={`transition-all ${errors.vehiclePlate ? 'border-red-500 ring-red-500/10 focus-visible:ring-red-500/20' : 'group-focus-within:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary/20'}`}
              />
              {errors.vehiclePlate && <p className="text-xs text-red-500 font-medium">{errors.vehiclePlate}</p>}
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="vehicleColor" className={`transition-colors ${errors.vehicleColor ? 'text-red-500' : 'group-hover:text-primary'}`}>Vehicle Color *</Label>
              <Input
                id="vehicleColor"
                value={formData.vehicleColor}
                onChange={(e) => updateField("vehicleColor", e.target.value)}
                placeholder="e.g. Red, Metallic Gray"
                className={`transition-all ${errors.vehicleColor ? 'border-red-500 ring-red-500/10 focus-visible:ring-red-500/20' : 'group-focus-within:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary/20'}`}
              />
              {errors.vehicleColor && <p className="text-xs text-red-500 font-medium">{errors.vehicleColor}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2 group">
              <Label htmlFor="chassisNumber" className="group-hover:text-primary transition-colors">Chassis Number</Label>
              <Input
                id="chassisNumber"
                value={formData.chassisNumber}
                onChange={(e) => updateField("chassisNumber", e.target.value)}
                placeholder="Enter Chassis #"
                className="group-focus-within:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="engineNumber" className="group-hover:text-primary transition-colors">Engine Number</Label>
              <Input
                id="engineNumber"
                value={formData.engineNumber}
                onChange={(e) => updateField("engineNumber", e.target.value)}
                placeholder="Enter Engine #"
                className="group-focus-within:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Service Information */}
        <div className="animate-in fade-in slide-in-from-left-2 duration-500">
          <h3 className="font-semibold text-foreground mb-4">Service Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 group">
              <Label htmlFor="service" className={`transition-colors ${errors.service ? 'text-red-500' : 'group-hover:text-primary'}`}>Requested Service *</Label>
              <Select
                value={formData.service}
                onValueChange={(value) => updateField("service", value)}
              >
                <SelectTrigger id="service" className={`transition-all ${errors.service ? 'border-red-500 ring-red-500/10' : 'group-focus-within:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary/20'}`}>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service && <p className="text-xs text-red-500 font-medium">{errors.service}</p>}
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="preferredDate" className="group-hover:text-primary transition-colors">Preferred Date</Label>
              <div className="flex gap-2">
                <Input
                  id="preferredDate"
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => updateField("preferredDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="flex-1 group-focus-within:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="px-3 bg-transparent group-hover:border-primary/50 group-hover:bg-primary/5 transition-all" type="button">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="single"
                      selected={formData.preferredDate ? new Date(formData.preferredDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const formattedDate = date.toISOString().split("T")[0]
                          updateField("preferredDate", formattedDate)
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2 group">
            <Label htmlFor="message" className="group-hover:text-primary transition-colors">Additional Details</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => updateField("message", e.target.value)}
              placeholder="Describe the issue or any specific requests..."
              rows={4}
              className="group-focus-within:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Insurance Information */}
        <div className="animate-in fade-in slide-in-from-right-2 duration-500">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Insurance (Optional)
          </h3>
          <div className="space-y-4">
            <div className="space-y-2 group">
              <Label htmlFor="insurance" className="group-hover:text-primary transition-colors">Insurance Provider</Label>
              <Input
                id="insurance"
                value={formData.insurance}
                onChange={(e) => updateField("insurance", e.target.value)}
                placeholder="e.g., Pioneer, Standard Insurance, etc."
                className="group-focus-within:border-primary/50 group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all"
              />
              <p className="text-xs text-muted-foreground">
                Autoworx accepts insurance claims. Leave blank if not applicable.
              </p>
            </div>
          </div>
        </div>

        {/* Damage Photos Upload */}
        <div>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Damage Photos (Optional)
          </h3>

          {/* Important Notice */}
          <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Important Notice</p>
                <p className="text-xs text-muted-foreground mt-1">
                  If the damage is severe or requires an on-site inspection, we recommend visiting our shop immediately so our experts can perform a proper diagnosis. Photos help us prepare, but some issues need hands-on assessment.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Upload up to 5 photos of the damaged area to help our technicians review the issue in advance.
          </p>

          {/* Upload Area */}
          <div className="space-y-4">
            {/* Image Preview Grid */}
            {damageImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {damageImages.map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Damage photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg"
                      aria-label="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center">
                      Photo {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {damageImages.length < 5 && (
              <label
                htmlFor="damageImageUpload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isUploadingImage ? (
                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-primary">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG up to 5MB ({5 - damageImages.length} remaining)
                      </p>
                    </>
                  )}
                </div>
                <input
                  id="damageImageUpload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploadingImage}
                />
              </label>
            )}

            {damageImages.length >= 5 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Maximum of 5 photos reached. Remove a photo to add more.
              </p>
            )}
          </div>
        </div>

        {/* ORCR Attachment - Required */}
        <div className="animate-in fade-in slide-in-from-right-2 duration-500">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            ORCR (Official Receipt/Certificate of Registration) *
          </h3>

          <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Required Document</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please upload a clear photo of your vehicle's ORCR. This is required for the admin to process your appointment. Make sure all text is readable.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* ORCR Preview */}
            {orcrImage && (
              <div className="relative w-full max-w-md mx-auto">
                <div className="relative aspect-[3/2] rounded-lg overflow-hidden border-2 border-primary/50 group">
                  <img
                    src={orcrImage}
                    alt="ORCR Document"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeOrcrImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg"
                    aria-label="Remove ORCR image"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm py-2 text-center font-medium">
                    ORCR Document
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Click the × button to replace the image
                </p>
              </div>
            )}

            {/* Upload Button */}
            {!orcrImage && (
              <label
                htmlFor="orcrImageUpload"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${errors.orcrImage ? 'border-red-500 bg-red-50' : 'border-primary/50 hover:border-primary hover:bg-primary/5'}`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                  {isUploadingOrcr ? (
                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className={`w-8 h-8 mb-2 ${errors.orcrImage ? 'text-red-500' : 'text-primary'}`} />
                      <p className={`text-sm ${errors.orcrImage ? 'text-red-500' : 'text-foreground'}`}>
                        <span className={`font-medium underline ${errors.orcrImage ? 'text-red-600' : 'text-primary'}`}>Click to upload ORCR photo</span>
                      </p>
                      {errors.orcrImage && <p className="text-xs text-red-600 font-bold mt-1 uppercase tracking-tight">{errors.orcrImage}</p>}
                      {!errors.orcrImage && (
                        <div className="mt-2 space-y-1">
                          <p className="text-[10px] text-muted-foreground">
                            📸 Tip: Place document on a flat surface with good lighting
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            🔍 Tip: Ensure all text and the plate number are clearly readable
                          </p>
                          <p className="text-[10px] text-primary italic">
                            Required for appointment processing
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <input
                  id="orcrImageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleOrcrUpload}
                  className="hidden"
                  disabled={isUploadingOrcr}
                />
              </label>
            )}
          </div>
        </div>

        {/* CAPTCHA Verification */}
        <div className={`p-4 rounded-lg border transition-all ${errors.captcha ? 'bg-red-50 border-red-500' : 'bg-secondary/50 border-border'}`}>
          <div className="flex items-start gap-3">
            <Checkbox
              id="captcha"
              checked={captchaVerified}
              onCheckedChange={(checked) => {
                setCaptchaVerified(checked as boolean)
                if (checked && errors.captcha) {
                  setErrors(prev => {
                    const next = { ...prev }
                    delete next.captcha
                    return next
                  })
                }
              }}
            />
            <div className="flex-1">
              <Label htmlFor="captcha" className={`font-semibold cursor-pointer ${errors.captcha ? 'text-red-600' : 'text-foreground'}`}>
                I'm not a robot
              </Label>
              {errors.captcha ? (
                <p className="text-xs text-red-500 font-bold mt-1 animate-pulse">{errors.captcha}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  By checking this box, you verify that you are not a robot and agree to our terms.
                </p>
              )}
            </div>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              Submit Request
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
