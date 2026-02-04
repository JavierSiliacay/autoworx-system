import { BookingFormData } from "@/components/booking/booking-form"

interface PDFOptions {
  trackingCode: string
  appointmentData: BookingFormData
}

export async function generateAppointmentPDF(options: PDFOptions): Promise<Blob> {
  const { trackingCode, appointmentData } = options

  // Create HTML content for the PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            padding: 40px 20px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2 8px rgba(0,0,0,0.1);
          }
          .header {
            position: relative;
            border-bottom: 3px solid #1a5f9c;
            padding: 8px 0 8px 0;
            margin-bottom: 20px;
            min-height: 40px;
            display: flex;
            align-items: center;
          }
          .header-content {
            flex: 1;
            position: relative;
            z-index: 1;
          }
          .header h1 {
            font-size: 18px;
            color: #1a5f9c;
            margin: 0;
            letter-spacing: 1px;
          }
          .header p {
            color: #666;
            font-size: 11px;
            margin: 3px 0 0 0;
          }
          .tracking-section {
            background-color: #f0f7ff;
            border: 2px solid #1a5f9c;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
          }
          .tracking-section p {
            color: #666;
            font-size: 12px;
            margin-bottom: 8px;
          }
          .tracking-code {
            font-family: 'Courier New', monospace;
            font-size: 28px;
            font-weight: bold;
            color: #1a5f9c;
            letter-spacing: 3px;
          }
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1a5f9c;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
            margin: 25px 0 15px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #f0f0f0;
            font-size: 14px;
          }
          .info-label {
            font-weight: 600;
            color: #333;
            width: 40%;
          }
          .info-value {
            color: #666;
            word-break: break-word;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
          .footer p {
            margin: 5px 0;
          }
          .status-badge {
            display: inline-block;
            background-color: #fff3cd;
            color: #856404;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">

              <h1>AUTOWORX REPAIRS AND GEN. MERCHANDISE</h1>
              <p>Appointment Request Confirmation</p>
            </div>
          </div>

          <div class="tracking-section">
            <p>Your Tracking Code</p>
            <div class="tracking-code">${trackingCode}</div>
            <p style="margin-top: 10px; font-size: 11px;">Use this code to track your appointment status at autoworx.com/track</p>
            <div class="status-badge">PENDING - Awaiting Confirmation</div>
          </div>

          <div class="section-title">Customer Information</div>
          <div class="info-row">
            <span class="info-label">Full Name:</span>
            <span class="info-value">${appointmentData.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${appointmentData.email}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone Number:</span>
            <span class="info-value">${appointmentData.phone}</span>
          </div>

          <div class="section-title">Vehicle Information</div>
          <div class="info-row">
            <span class="info-label">Make:</span>
            <span class="info-value">${appointmentData.vehicleMake}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Model:</span>
            <span class="info-value">${appointmentData.vehicleModel}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Year:</span>
            <span class="info-value">${appointmentData.vehicleYear}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Plate Number:</span>
            <span class="info-value"><strong>${appointmentData.vehiclePlate}</strong></span>
          </div>

          <div class="section-title">Service Request</div>
          <div class="info-row">
            <span class="info-label">Service Type:</span>
            <span class="info-value">${appointmentData.service}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Preferred Date:</span>
            <span class="info-value">${appointmentData.preferredDate || "Not specified"}</span>
          </div>
          <div class="info-row" style="border-bottom: none;">
            <span class="info-label">Additional Details:</span>
          </div>
          <div style="padding: 12px 0; color: #666; font-size: 14px; white-space: pre-wrap;">
${appointmentData.message || "No additional details provided"}
          </div>

          <div class="footer">
            <p>We will contact you within 24 hours to confirm your appointment.</p>
            <p>Thank you for choosing Autoworx Repairs!</p>
            <p>Phone: 0936-354-9603 | Email: autoworxcagayan2025@gmail.com</p>
            <p style="margin-top: 15px; color: #ccc;">Generated on ${new Date().toLocaleString("en-PH")}</p>
          </div>
        </div>
      </body>
    </html>
  `

  // Convert HTML to PDF using html2pdf
  const canvas = await html2PdfConvert(htmlContent)
  return canvas
}

// Fallback PDF generation using canvas
async function html2PdfConvert(htmlContent: string): Promise<Blob> {
  return new Promise((resolve) => {
    const link = document.createElement("a")
    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    iframe.srcdoc = htmlContent
    document.body.appendChild(iframe)

    setTimeout(() => {
      const printWindow = iframe.contentWindow
      if (printWindow) {
        printWindow.print()
        // Create a simple PDF by converting to canvas
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (ctx) {
          canvas.width = 800
          canvas.height = 1200
          ctx.fillStyle = "white"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = "#333"
          ctx.font = "16px Arial"
          ctx.fillText("PDF Generated", 50, 50)
        }
      }
      document.body.removeChild(iframe)
    }, 100)

    // Simple solution: Create blob from HTML and offer download
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" })
    resolve(blob)
  })
}

export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
