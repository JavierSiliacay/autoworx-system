"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Loader2, Mail, FileText, Edit2, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateTrackingPDF } from "@/lib/generate-pdf"
import { convertHtmlToPdfBase64 } from "@/lib/pdf-client"

interface SendEstimateModalProps {
  isOpen: boolean
  onClose: () => void
  appointmentData: any
}

export function SendEstimateModal({ isOpen, onClose, appointmentData }: SendEstimateModalProps) {
  const { toast } = useToast()
  const [isSending, setIsSending] = useState(false)

  const trackingCode = appointmentData?.tracking_code || appointmentData?.trackingCode || 'N/A'
  const vehicleYear = appointmentData?.vehicle_year || appointmentData?.vehicleYear || ''
  const vehicleMake = appointmentData?.vehicle_make || appointmentData?.vehicleMake || ''
  const vehicleModel = appointmentData?.vehicle_model || appointmentData?.vehicleModel || ''
  
  const defaultMessage = `Dear ${appointmentData?.name || 'Client'},\n\nThis is the repair estimate for your ${vehicleYear} ${vehicleMake} ${vehicleModel} (Tracking Code: ${trackingCode}).\n\nPlease see the attached PDF document for the full breakdown of costs and parts.\n\nLet us know if you have any questions or would like to proceed.\n\nBest regards,\nAutoworx Repairs & Gen. Merchandise`
  
  const defaultFileName = [
    "REPAIR ESTIMATE",
    appointmentData?.vehicle_plate || appointmentData?.vehiclePlate,
    vehicleYear,
    vehicleMake,
    vehicleModel,
    appointmentData?.name,
    appointmentData?.insurance
  ].filter(part => part && part.toString().trim() !== "" && part.toString().toUpperCase() !== "N/A").join(" ")
  
  const [message, setMessage] = useState(defaultMessage)
  const [fileName, setFileName] = useState(defaultFileName)
  const [isEditingFileName, setIsEditingFileName] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMessage(defaultMessage)
      setFileName(defaultFileName)
      setIsEditingFileName(false)
    }
  }, [appointmentData, isOpen]) // Only trigger when modal opens or data changes

  const handleSend = async () => {
    if (!appointmentData) return
    
    setIsSending(true)
    try {
      const htmlContent = await generateTrackingPDF(appointmentData, 'admin', 'REPAIR ESTIMATE', {
        serviceAdvisor: appointmentData.costing?.serviceAdvisorName || appointmentData.serviceAdvisor || "N/A",
        deliveryDate: appointmentData.costing?.deliveryDate?.toString() || "",
        documentDate: appointmentData.costing?.documentDate || ""
      })
      const pdfBase64 = await convertHtmlToPdfBase64(htmlContent)

      const subjectTitle = fileName.trim() || defaultFileName;
      const finalPdfFilename = subjectTitle + ".pdf";

      // Send to API
      const res = await fetch("/api/appointments/send-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: appointmentData.email,
          trackingCode: trackingCode,
          vehicleDetails: `${vehicleYear} ${vehicleMake} ${vehicleModel}`.trim(),
          message,
          pdfBase64,
          pdfFilename: finalPdfFilename,
          subject: subjectTitle,
          clientName: appointmentData.name || 'N/A',
          plateNumber: appointmentData.vehicle_plate || appointmentData.vehiclePlate || 'N/A',
          vehicleColor: appointmentData.vehicleColor || 'N/A',
          insurance: appointmentData.insurance || 'PERSONAL',
          serviceType: appointmentData.service || 'N/A',
          serviceAdvisor: appointmentData.costing?.serviceAdvisorName || appointmentData.serviceAdvisor || 'N/A'
        })
      })

      if (!res.ok) throw new Error("Failed to send email")

      toast({
        title: "Estimate Sent!",
        description: `Successfully emailed ${appointmentData.email} and CC'd admins.`,
        variant: "default",
      })
      onClose()
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error Sending Estimate",
        description: `There was an error generating or sending the PDF: ${error?.message || String(error)}`,
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mail className="w-5 h-5 text-blue-400" />
            Send Repair Estimate
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Send the PDF estimate to <span className="font-bold text-slate-300">{appointmentData?.email}</span>. Sir Ryan and Sir Paul will automatically be CC'd.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 flex items-center gap-3 text-sm">
            <FileText className="w-5 h-5 text-red-400" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">File Name & Email Subject</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingFileName(!isEditingFileName)}
                  className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                >
                  {isEditingFileName ? (
                    <><Check className="w-3 h-3 mr-1" /> Done</>
                  ) : (
                    <><Edit2 className="w-3 h-3 mr-1" /> Edit</>
                  )}
                </Button>
              </div>
              
              {isEditingFileName ? (
                <div className="flex items-center space-x-2">
                  <Input 
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="bg-slate-800 border-slate-700 focus-visible:ring-blue-500"
                    autoFocus
                  />
                  <span className="text-slate-400 text-sm">.pdf</span>
                </div>
              ) : (
                <p className="font-medium bg-slate-900/50 p-2 rounded border border-slate-700/30 break-all">
                  {fileName.trim() || defaultFileName}.pdf
                </p>
              )}
              
              {isEditingFileName && (
                <p className="text-xs text-slate-400">This will be used as the PDF file name and the email subject line.</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Message Body</label>
            <Textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[150px] bg-slate-800 border-slate-700 focus-visible:ring-blue-500"
              placeholder="Type your message here..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending} className="bg-transparent border-slate-700 hover:bg-slate-800">
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]">
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Email"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
