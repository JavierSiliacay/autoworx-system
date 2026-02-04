import { BookingFormData } from "@/components/booking/booking-form"
import type { CostingData, RepairStatus } from "@/lib/constants"

interface PDFGeneratorOptions {
  trackingCode: string
  appointmentData: BookingFormData
}

interface TrackingAppointment {
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
  message?: string
  status: string
  createdAt: string
  repairStatus?: RepairStatus
  currentRepairPart?: string
  statusUpdatedAt?: string
  costing?: CostingData
}

export async function generateConfirmationPDF(options: PDFGeneratorOptions): Promise<string> {
  const { trackingCode, appointmentData } = options

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Confirmation</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      line-height: 1.3;
      color: #333;
      background: white;
      padding: 0.5in;
    }
    
    @page {
      size: A4;
      margin: 0.5in;
    }
    
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
    
    .container {
      max-width: 7.5in;
      margin: 0 auto;
      background: white;
    }
    
    /* Header */
    .header {
      position: relative;
      border-bottom: 2px solid #1a5f9c;
      padding: 8px 0;
      margin-bottom: 10px;
      min-height: 35px;
      display: flex;
      align-items: center;
    }
    
    .header-logo {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 28px;
      height: 28px;
      opacity: 0.3;
      z-index: 0;
    }
    
    .header-content {
      flex: 1;
      padding-left: 35px;
      position: relative;
      z-index: 1;
    }
    
    .header h1 {
      color: #1a5f9c;
      font-size: 13px;
      font-weight: bold;
      margin: 0;
    }
    
    .header p {
      color: #666;
      font-size: 8px;
      margin: 2px 0 0 0;
    }
    
    /* Tracking Section */
    .tracking-box {
      border: 2px solid #1a5f9c;
      background: #f0f7ff;
      border-radius: 4px;
      padding: 8px;
      margin-bottom: 10px;
      text-align: center;
    }
    
    .tracking-box p {
      font-size: 9px;
      color: #666;
      margin: 0;
    }
    
    .tracking-code {
      font-family: 'Courier New', monospace;
      font-size: 16px;
      font-weight: bold;
      color: #1a5f9c;
      letter-spacing: 2px;
      margin: 5px 0;
    }
    
    .status-badge {
      display: inline-block;
      background: #fff3cd;
      color: #856404;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: bold;
      margin-top: 4px;
    }
    
    /* Sections */
    .section {
      margin-bottom: 8px;
    }
    
    .section-title {
      color: #1a5f9c;
      font-size: 12px;
      font-weight: bold;
      border-bottom: 1px solid #1a5f9c;
      padding-bottom: 3px;
      margin-bottom: 5px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      border-bottom: 1px solid #e0e0e0;
      font-size: 10px;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .label {
      font-weight: bold;
      color: #1a5f9c;
      width: 35%;
    }
    
    .value {
      text-align: right;
      width: 65%;
      word-break: break-word;
    }
    
    /* Footer */
    .footer {
      border-top: 1px solid #e0e0e0;
      margin-top: 8px;
      padding-top: 6px;
      text-align: center;
      font-size: 9px;
      color: #999;
    }
    
    .footer p {
      margin: 2px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="/autoworxlogo.png" alt="Autoworx Logo" class="header-logo">
      <div class="header-content">
        <h1>AUTOWORX REPAIRS AND GEN. MERCHANDISE</h1>
        <p>Appointment Request Confirmation</p>
      </div>
    </div>
    
    <!-- Tracking Code -->
    <div class="tracking-box">
      <p>Your Tracking Code</p>
      <div class="tracking-code">${trackingCode}</div>
      <p>Use this code to track your appointment status</p>
      <div class="status-badge">PENDING - Awaiting Confirmation</div>
    </div>
    
    <!-- Customer Information -->
    <div class="section">
      <div class="section-title">Customer Information</div>
      <div class="info-row">
        <span class="label">Full Name:</span>
        <span class="value">${appointmentData.name}</span>
      </div>
      <div class="info-row">
        <span class="label">Email:</span>
        <span class="value">${appointmentData.email}</span>
      </div>
      <div class="info-row">
        <span class="label">Phone:</span>
        <span class="value">${appointmentData.phone}</span>
      </div>
    </div>
    
    <!-- Vehicle Information -->
    <div class="section">
      <div class="section-title">Vehicle Information</div>
      <div class="info-row">
        <span class="label">Make:</span>
        <span class="value">${appointmentData.vehicleMake}</span>
      </div>
      <div class="info-row">
        <span class="label">Model:</span>
        <span class="value">${appointmentData.vehicleModel}</span>
      </div>
      <div class="info-row">
        <span class="label">Year:</span>
        <span class="value">${appointmentData.vehicleYear}</span>
      </div>
      <div class="info-row">
        <span class="label">Plate Number:</span>
        <span class="value"><strong>${appointmentData.vehiclePlate}</strong></span>
      </div>
    </div>
    
    <!-- Service Request -->
    <div class="section">
      <div class="section-title">Service Request</div>
      <div class="info-row">
        <span class="label">Service:</span>
        <span class="value">${appointmentData.service}</span>
      </div>
      <div class="info-row">
        <span class="label">Date:</span>
        <span class="value">${appointmentData.preferredDate || "Not specified"}</span>
      </div>
      ${appointmentData.message ? `<div style="margin-top: 3px; font-size: 10px;"><strong>Details:</strong> ${appointmentData.message.substring(0, 150)}</div>` : ""}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>We will contact you within 24 hours to confirm your appointment.</p>
      <p>Thank you for choosing Autoworx Repairs & Gen. Merchandise!</p>
      <p>Phone: 0936-354-9603 | Email: autoworxcagayan2025@gmail.com</p>
      <p>Generated on ${new Date().toLocaleString("en-PH")}</p>
    </div>
  </div>
</body>
</html>
  `

  return htmlContent
}

// Helper function to get repair status label
function getRepairStatusLabel(status?: RepairStatus): string {
  const statusMap: Record<string, string> = {
    pending_inspection: "Pending Inspection",
    under_diagnosis: "Under Diagnosis",
    repair_in_progress: "Repair in Progress",
    waiting_for_parts: "Waiting for Parts",
    testing_quality_check: "Testing / Quality Check",
    completed_ready: "Completed / Ready for Pickup",
  }
  return status ? statusMap[status] || "Unknown" : "Not Started"
}

// Helper function to get appointment status label
function getAppointmentStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "Pending - Awaiting Confirmation",
    contacted: "Contacted - In Communication",
    completed: "Completed - Service Done",
  }
  return statusMap[status] || status
}

export async function generateTrackingPDF(appointment: TrackingAppointment): Promise<string> {
  const repairStatus = getRepairStatusLabel(appointment.repairStatus)
  const appointmentStatus = getAppointmentStatusLabel(appointment.status)
  
  // Calculate costing totals
  const hasCosting = appointment.costing && appointment.costing.items.length > 0
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Status Report - ${appointment.trackingCode}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      line-height: 1.3;
      color: #333;
      background: white;
      padding: 0.5in;
    }
    
    @page {
      size: A4;
      margin: 0.5in;
    }
    
    @media print {
      body {
        padding: 0;
      }
    }
    
    .container {
      max-width: 7.5in;
      margin: 0 auto;
      background: white;
    }
    
    .header {
      text-align: center;
      border-bottom: 2px solid #1a5f9c;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    
    .header h1 {
      color: #1a5f9c;
      font-size: 18px;
      font-weight: bold;
      margin: 0;
    }
    
    .header p {
      color: #666;
      font-size: 10px;
      margin: 2px 0 0 0;
    }
    
    .tracking-box {
      border: 2px solid #1a5f9c;
      background: #f0f7ff;
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 12px;
      text-align: center;
    }
    
    .tracking-code {
      font-family: 'Courier New', monospace;
      font-size: 16px;
      font-weight: bold;
      color: #1a5f9c;
      letter-spacing: 2px;
    }
    
    .status-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    
    .status-box {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      text-align: center;
    }
    
    .status-box.repair {
      border-color: #28a745;
      background: #f0fff4;
    }
    
    .status-box.appointment {
      border-color: #ffc107;
      background: #fffdf0;
    }
    
    .status-label {
      font-size: 9px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    
    .status-value {
      font-size: 12px;
      font-weight: bold;
      color: #333;
    }
    
    .section {
      margin-bottom: 10px;
    }
    
    .section-title {
      color: #1a5f9c;
      font-size: 12px;
      font-weight: bold;
      border-bottom: 1px solid #1a5f9c;
      padding-bottom: 3px;
      margin-bottom: 6px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid #e0e0e0;
      font-size: 10px;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .label {
      font-weight: bold;
      color: #555;
      width: 35%;
    }
    
    .value {
      text-align: right;
      width: 65%;
    }
    
    .costing-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      margin-top: 6px;
    }
    
    .costing-table th,
    .costing-table td {
      border: 1px solid #ddd;
      padding: 4px 6px;
      text-align: left;
    }
    
    .costing-table th {
      background: #f5f5f5;
      font-weight: bold;
    }
    
    .costing-table .amount {
      text-align: right;
    }
    
    .total-row {
      font-weight: bold;
      background: #f0f7ff;
    }
    
    .footer {
      border-top: 1px solid #e0e0e0;
      margin-top: 12px;
      padding-top: 8px;
      text-align: center;
      font-size: 9px;
      color: #999;
    }
    
    .current-part {
      background: #e8f5e9;
      padding: 6px;
      border-radius: 4px;
      margin-top: 6px;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="/autoworxlogo.png" alt="Autoworx Logo" class="header-logo">
      <div class="header-content">
        <h1>AUTOWORX REPAIRS AND GEN. MERCHANDISE</h1>
        <p>Appointment Status Report</p>
      </div>
    </div>
    
    <div class="tracking-box">
      <p style="font-size: 9px; color: #666; margin-bottom: 4px;">Tracking Code</p>
      <div class="tracking-code">${appointment.trackingCode}</div>
    </div>
    
    <div class="status-grid">
      <div class="status-box repair">
        <div class="status-label">Repair Status</div>
        <div class="status-value">${repairStatus}</div>
        ${appointment.currentRepairPart ? `<div class="current-part">Currently: ${appointment.currentRepairPart}</div>` : ""}
      </div>
      <div class="status-box appointment">
        <div class="status-label">Appointment Status</div>
        <div class="status-value">${appointmentStatus}</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Customer Information</div>
      <div class="info-row">
        <span class="label">Full Name:</span>
        <span class="value">${appointment.name}</span>
      </div>
      <div class="info-row">
        <span class="label">Email:</span>
        <span class="value">${appointment.email}</span>
      </div>
      <div class="info-row">
        <span class="label">Phone:</span>
        <span class="value">${appointment.phone}</span>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Vehicle Information</div>
      <div class="info-row">
        <span class="label">Vehicle:</span>
        <span class="value">${appointment.vehicleYear} ${appointment.vehicleMake} ${appointment.vehicleModel}</span>
      </div>
      <div class="info-row">
        <span class="label">Plate Number:</span>
        <span class="value"><strong>${appointment.vehiclePlate}</strong></span>
      </div>
      <div class="info-row">
        <span class="label">Service:</span>
        <span class="value">${appointment.service}</span>
      </div>
      <div class="info-row">
        <span class="label">Preferred Date:</span>
        <span class="value">${appointment.preferredDate || "Not specified"}</span>
      </div>
    </div>
    
    ${hasCosting ? `
    <div class="section">
      <div class="section-title">Cost Estimation</div>
      <table class="costing-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="width: 50px;">Qty</th>
            <th style="width: 70px;" class="amount">Unit Price</th>
            <th style="width: 70px;" class="amount">Total</th>
          </tr>
        </thead>
        <tbody>
          ${appointment.costing!.items.map(item => `
          <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td class="amount">₱${item.unitPrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
            <td class="amount">₱${item.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
          </tr>
          `).join("")}
          <tr>
            <td colspan="3" class="amount"><strong>Subtotal:</strong></td>
            <td class="amount">₱${appointment.costing!.subtotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
          </tr>
          ${appointment.costing!.discount > 0 ? `
          <tr>
            <td colspan="3" class="amount"><strong>Discount${appointment.costing!.discountType === "percentage" ? ` (${appointment.costing!.discount}%)` : ""}:</strong></td>
            <td class="amount">-₱${(appointment.costing!.discountType === "percentage" ? (appointment.costing!.subtotal * appointment.costing!.discount / 100) : appointment.costing!.discount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
          </tr>
          ` : ""}
          ${appointment.costing!.vatEnabled ? `
          <tr>
            <td colspan="3" class="amount"><strong>VAT (12%):</strong></td>
            <td class="amount">₱${appointment.costing!.vatAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
          </tr>
          ` : ""}
          <tr class="total-row">
            <td colspan="3" class="amount"><strong>TOTAL:</strong></td>
            <td class="amount"><strong>₱${appointment.costing!.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong></td>
          </tr>
        </tbody>
      </table>
      ${appointment.costing!.notes ? `<p style="margin-top: 6px; font-size: 9px; color: #666;">Note: ${appointment.costing!.notes}</p>` : ""}
    </div>
    ` : ""}
    
    <div class="footer">
      <p>This report was generated on ${new Date().toLocaleString("en-PH")}</p>
      <p>For inquiries, contact: 0936-354-9603 | autoworxcagayan2025@gmail.com</p>
      <p>Thank you for choosing Autoworx Repairs & Gen. Merchandise!</p>
    </div>
  </div>
</body>
</html>
  `

  return htmlContent
}
