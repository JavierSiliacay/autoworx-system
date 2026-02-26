import { BookingFormData } from "@/components/booking/booking-form"
import type { CostingData, RepairStatus } from "@/lib/constants"
import { PRODUCTION_URL } from "./constants"

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
  vehicleColor?: string
  chassisNumber?: string
  engineNumber?: string
  assigneeDriver?: string
  service: string
  message?: string
  status: string
  createdAt: string
  repairStatus?: RepairStatus
  currentRepairPart?: string
  statusUpdatedAt?: string
  costing?: CostingData
  insurance?: string
  estimateNumber?: string
  serviceAdvisor?: string
  loaAttachment?: string
  loaAttachment2?: string
  loaAttachments?: string[]
}

export async function generateConfirmationPDF(options: PDFGeneratorOptions): Promise<string> {
  const { trackingCode, appointmentData } = options

  // Use current origin if in browser, otherwise fallback to production URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : PRODUCTION_URL

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Confirmation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 9px; 
      line-height: 1.35; 
      color: #333; 
      background: white; 
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { 
      size: A4; 
      margin: 0.4in 0.3in; 
    }
    .container { 
      width: 100%; 
      margin: 0 auto; 
      display: flex;
      flex-direction: column;
    }
    .header { border-bottom: none; padding-bottom: 0; margin-bottom: 0; position: relative; }
    .header-container { display: flex; align-items: center; justify-content: space-between; gap: 15px; width: 100%; padding-bottom: 3px; }
    .logo-container { width: 110px; }
    .logo-container img { width: 110px; height: auto; }
    .header-content { flex-grow: 1; text-align: left; padding-top: 3px; }
    .header h1 { color: #2e74b5; font-size: 20px; font-weight: bold; margin-bottom: 2px; font-family: "Times New Roman", Times, serif; }
    .header .address { color: #000; font-size: 8.5px; margin-bottom: 1px; font-weight: 500; }
    .header .contact { color: #000; font-size: 8.5px; margin-bottom: 1px; }
    .header .email { color: #000; font-size: 8.5px; }
    
    .estimate-bar { background: #d9e1f2 !important; color: #000 !important; font-family: Arial, sans-serif; font-weight: 900; font-size: 20px; padding: 6px 15px; margin-top: 0; margin-bottom: 12px; border: 1.5px solid #000 !important; text-transform: uppercase; letter-spacing: 1px; -webkit-print-color-adjust: exact; line-height: 1; }
    
    .tracking-box { border: 2px solid #1a5f9c; background: #f0f7ff; border-radius: 4px; padding: 10px; margin-bottom: 12px; text-align: center; }
    .tracking-code { font-family: 'Courier New', monospace; font-size: 20px; font-weight: bold; color: #1a5f9c; letter-spacing: 2px; }
    
    .section-title { background: #f4f4f4 !important; color: #000 !important; font-size: 9.5px; font-weight: bold; border: 1px solid #ddd !important; padding: 4px 8px; margin-bottom: 0; -webkit-print-color-adjust: exact; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; table-layout: fixed; }
    .info-table td { border: 1px solid #ddd !important; padding: 6px 8px; vertical-align: middle; font-size: 10px; }
    .info-table td.label-cell { font-weight: bold; width: 22%; background: #fcfcfc !important; -webkit-print-color-adjust: exact; }
    .info-table td.value-cell { width: 28%; font-weight: 500; }
    
    .qr-section { text-align: center; margin: 10px 0; display: flex; flex-direction: column; justify-content: center; align-items: center; }
    
    .footer-layout { margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee; }
    .terms-box { border: 1.5px solid #999; padding: 10px; font-size: 8px; line-height: 1.3; margin-bottom: 15px; }
    .terms-box ol { padding-left: 14px; }
    .terms-box li { margin-bottom: 5px; }
    
    .contact-info { text-align: center; font-size: 8px; color: #777; margin-top: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-container">
        <div class="logo-container"><img src="/autoworxlogo.png" alt="Logo" /></div>
        <div class="header-content">
          <h1>Autoworx Repair and General Mdse. Co. Ltd.</h1>
          <p class="address">Zone 7 Sepulvida Street, Kauswagan Highway, Cagayan de Oro City</p>
          <p class="contact">Telefax /Landline: (088) 880-4825 Mobile: (Paul- 09363549603 ) (0965-918-3394 Reception)</p>
          <p class="email">Email add: alfred_autoworks@yahoo.com / paulsuazo64@gmail.com / autoworxcagayan2025@gmail.com</p>
        </div>
      </div>
    </div>
    
    <div class="estimate-bar" style="margin-top: -5px;">APPOINTMENT CONFIRMATION</div>
    
    <div style="height: 10px;"></div>

    <div class="section-title">Customer & Vehicle Information</div>
    <table class="info-table">
      <tr>
        <td class="label-cell">NAME/CLIENT:</td>
        <td class="value-cell">${appointmentData.name}</td>
        <td class="label-cell">ASSIGNEE/DRIVER:</td>
        <td class="value-cell">${appointmentData.assigneeDriver || "N/A"}</td>
      </tr>
      <tr>
        <td class="label-cell">UNIT/MODEL:</td>
        <td class="value-cell">${appointmentData.vehicleYear} ${appointmentData.vehicleMake} ${appointmentData.vehicleModel}</td>
        <td class="label-cell">CONTACT #:</td>
        <td class="value-cell">${appointmentData.phone}</td>
      </tr>
      <tr>
        <td class="label-cell">PLATE #:</td>
        <td class="value-cell"><strong>${appointmentData.vehiclePlate}</strong></td>
        <td class="label-cell">EMAIL ADD:</td>
        <td class="value-cell">${appointmentData.email}</td>
      </tr>
      <tr>
        <td class="label-cell">COLOR:</td>
        <td class="value-cell">${appointmentData.vehicleColor || "N/A"}</td>
        <td class="label-cell">TRACKING CODE:</td>
        <td class="value-cell" style="font-family: monospace; font-weight: bold;">${trackingCode}</td>
      </tr>
      <tr>
        <td class="label-cell">INSURANCE:</td>
        <td class="value-cell">${appointmentData.insurance || "N/A"}</td>
        <td class="label-cell">SERVICE:</td>
        <td class="value-cell">${appointmentData.service}</td>
      </tr>
      <tr>
        <td class="label-cell">CHASSIS:</td>
        <td class="value-cell">${appointmentData.chassisNumber || "N/A"}</td>
        <td class="label-cell" rowspan="2" style="text-align: center; font-size: 8px; vertical-align: middle; text-transform: uppercase;">SCAN TO TRACK:</td>
        <td class="value-cell" rowspan="2" style="text-align: center; padding: 5px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${baseUrl}/track?code=${trackingCode}`)}" style="width: 65px; height: 65px;" />
          <p style="font-size: 7px; margin-top: 4px; color: #666;">Scan to track the unit status</p>
        </td>
      </tr>
      <tr>
        <td class="label-cell">ENGINE:</td>
        <td class="value-cell">${appointmentData.engineNumber || "N/A"}</td>
        <td class="label-cell">S/A:</td>
        <td class="value-cell" style="text-transform: uppercase;">${appointmentData.serviceAdvisor || "N/A"}</td>
      </tr>
    </table>

    <div class="qr-section">
      <p style="font-size: 14px; font-weight: bold; color: #2e74b5; margin-bottom: 4px;">Thank you for your appointment request!</p>
      <p style="font-size: 9.5px; color: #666; max-width: 85%; line-height: 1.4; margin-bottom: 25px;">We have received your details. Our team will review your request and contact you via phone or email for final confirmation within 24 hours.</p>
      <div style="padding: 15px; text-align: center; border: 1.2px dashed #1a5f9c; border-radius: 6px; background: #fdfdfd; max-width: 90%; -webkit-print-color-adjust: exact;">
        <p style="font-size: 9.5px; font-weight: bold; color: #1a5f9c; line-height: 1.6; margin: 0;">
          For complete cost estimation information, please reach out to Sir Ryan or Sir Paul.<br><br>
          Thank you
        </p>
      </div>
    </div>
    
    <div class="footer-layout">
      <div class="terms-box">
        <p style="font-weight: bold; margin-bottom: 6px; text-decoration: underline;">TERMS AND CONDITIONS:</p>
        <ol>
          <li>Price Quoted is subject to change w/o prior notice and is good for <strong style="color: red;">15 days</strong> only</li>
          <li>Any hidden defects found while in the course of repairs is deemed excluded and shall be charged accordingly</li>
          <li>Not valid as court evidence</li>
          <li>Waste parts/materials not claim within <strong style="color: red;">15 days</strong> upon release of unit are to be disposed accordingly.</li>
          <li>It is also understood that AUTOWORX REPAIR & GEN MDSE. CO., LTD., assumes no responsibility for the loss or personal belonging left inside the unit by theft or damage cause by fire or any fortetious events to vehicles which placed within our premises for the purpose of repair or Storage.</li>
          <li>Autoworx is only given for at least <strong style="color: red;">15 days</strong> free of charge for storage fees if the unit is already done for repair or the unit is stored for quotation purposes only. ( Rates range in P250-500 per day)</li>
          <li>Outside parts supply have corkage of 25% from autoworx price</li>
        </ol>
        <div class="conforme-section" style="margin-top: 15px;">
          Conforme: <span class="conforme-line"></span>
          <div style="margin-top: 20px; border-top: 1.5px solid #333; width: 240px;"></div>
          <div style="margin-top: 5px; font-size: 9.5px; font-weight: bold;">We also accept all other brands</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`
  return htmlContent
}

function getRepairStatusLabel(status?: RepairStatus): string {
  const statusMap: Record<string, string> = {
    pending_inspection: "Pending Inspection",
    under_diagnosis: "Under Diagnosis",
    waiting_for_client_approval: "Waiting for Client Approval",
    waiting_for_insurance: "Waiting for Insurance Approval",
    insurance_approved: "Approved by Insurance",
    repair_in_progress: "Repair in Progress",
    waiting_for_parts: "Waiting for Parts",
    testing_quality_check: "Testing / Quality Check",
    completed_ready: "Completed / Ready for Pickup",
  }
  return status ? statusMap[status] || "Unknown" : "Not Started"
}

function getAppointmentStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "Pending", contacted: "Contacted", completed: "Completed",
  }
  return statusMap[status] || status
}

export interface PDFOptions {
  serviceAdvisor?: string;
  deliveryDate?: number | string;
}

export async function generateTrackingPDF(appointment: TrackingAppointment, role: 'admin' | 'user' = 'user', reportTitle?: string, options: PDFOptions = {}): Promise<string> {
  const isAdmin = role === 'admin'
  const repairStatus = getRepairStatusLabel(appointment.repairStatus)
  const appointmentStatus = getAppointmentStatusLabel(appointment.status)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : PRODUCTION_URL
  const displayTitle = reportTitle || (appointment.status === 'pending' ? "Appointment Confirmation" : (isAdmin ? "Repair Estimate" : "Repair Status Report"))

  const laborCategories = ["Mechanical Works", "Electrical", "Aircon", "Painting", "Detailing", "Service", "Labor", "Glassworks", "Alignment", "Tinsmith"]
  const hasCosting = !!appointment.costing
  const partsTotal = (appointment.costing?.items || []).filter(item => item.type === 'parts').reduce((sum, item) => sum + item.total, 0) || 0
  const laborTotal = (appointment.costing?.items || []).filter(item =>
    item.type !== 'parts' && (
      (item.type as string) === 'labor' ||
      (item.type as string) === 'service' ||
      item.type === 'service_labor' ||
      (item.category && laborCategories.includes(item.category))
    )
  ).reduce((sum, item) => sum + item.total, 0) || 0

  // Dynamic Categorization logic
  const categorized = (appointment.costing?.items || []).reduce((acc, item) => {
    // If a specific work category is selected and it's not "Others", use it
    // Otherwise, fall back to the billing type label (Service, Parts, etc.)
    let group = item.category && item.category !== "Others" ? item.category : "";
    const type = item.type as string;

    if (!group) {
      if (type === 'parts') group = "Parts";
      else if (type === 'service') group = "Service";
      else if (type === 'labor') group = "Labor";
      else if (type === 'service_labor') group = "Service/Labor";
      else group = "Others";
    }

    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc
  }, {} as Record<string, any[]>)

  const activeCategories = Object.keys(categorized);
  const totalRows = (appointment.costing?.items.length || 0) + activeCategories.length
  const shouldScale = totalRows > 12

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${displayTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: ${shouldScale ? (totalRows > 20 ? '8px' : '8.5px') : '9px'}; 
      line-height: 1.25; 
      color: #333; 
      background: white; 
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { 
      size: A4; 
      margin: 0.3in 0.25in; 
    }
    .container { 
      width: 100%; 
      margin: 0 auto; 
      display: flex;
      flex-direction: column;
    }
    .header { border-bottom: none; padding-bottom: 0; margin-bottom: 0; position: relative; }
    .header-container { display: flex; align-items: center; justify-content: space-between; gap: 15px; width: 100%; padding-bottom: 3px; }
    .logo-container { width: 110px; }
    .logo-container img { width: 110px; height: auto; }
    .header-content { flex-grow: 1; text-align: left; padding-top: 3px; }
    .header h1 { color: #2e74b5; font-size: 18px; font-weight: bold; margin-bottom: 1px; font-family: "Times New Roman", Times, serif; }
    .header .address { color: #000; font-size: 8.5px; margin-bottom: 1px; font-weight: 500; }
    .header .contact { color: #000; font-size: 8.5px; margin-bottom: 1px; }
    .header .email { color: #000; font-size: 8.5px; }
    
    .estimate-bar { background: #d9e1f2 !important; color: #000 !important; font-family: Arial, sans-serif; font-weight: 900; font-size: 17px; padding: 4px 10px; margin-top: -2px; margin-bottom: 8px; border: 1.5px solid #000 !important; text-transform: uppercase; letter-spacing: 1px; -webkit-print-color-adjust: exact; line-height: 1.1; text-align: center; }
    
    .estimate-meta { text-align: right; font-family: Arial, sans-serif; font-size: 9px; font-weight: bold; margin-bottom: 4px; line-height: 1.2; color: #000; }
    
    .status-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 4px; }
    .status-box { border: 1.5px solid #ddd; padding: 4px; text-align: center; border-radius: 4px; }
    .status-box.repair { border-color: #28a745 !important; background: #f4faf6 !important; -webkit-print-color-adjust: exact; }
    .status-box.appointment { border-color: #ffc107 !important; background: #fffcf0 !important; -webkit-print-color-adjust: exact; }
    
    .section-title { background: #f4f4f4 !important; font-weight: bold; border: 1px solid #ddd !important; padding: 2px 8px; font-size: 9.5px; margin-top: 2px; -webkit-print-color-adjust: exact; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; table-layout: fixed; }
    .info-table td { border: 1px solid #ddd !important; padding: 4px 8px; vertical-align: middle; word-wrap: break-word; font-size: 9px; }
    .info-table td.label-cell { font-weight: bold; width: 22%; background: #fcfcfc !important; -webkit-print-color-adjust: exact; }
    .info-table td.value-cell { width: 28%; font-weight: 500; }
    
    .costing-section { margin-top: 4px; margin-bottom: 4px; }
    .costing-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; page-break-inside: auto; }
    .costing-table tr { page-break-inside: avoid; page-break-after: auto; }
    .costing-table th, .costing-table td { border: 1px solid #000; padding: 3px 6px; text-align: left; font-size: 8.5px; }
    .costing-table th { background: #d9e1f2 !important; font-weight: bold; border: 1px solid #000 !important; -webkit-print-color-adjust: exact; }
    .amount { text-align: right; font-family: monospace; font-size: 9px; }
    
    .delivery-date { color: red; font-weight: bold; margin: 4px 0 2px 0; font-size: 10px; }
    
    .footer-layout { display: flex; justify-content: space-between; gap: 8px; padding-top: 4px; border-top: 1px solid #eee; margin-top: 2px; page-break-inside: avoid; }
    .terms-box { border: 1px solid #999; padding: 5px; font-size: 7px; line-height: 1.1; flex: 1.5; }
    .terms-box ol { padding-left: 10px; }
    .terms-box li { margin-bottom: 1.5px; }
    
    .signatures-totals-container { flex: 1.2; display: flex; flex-direction: column; gap: 4px; }
    .totals-summary { width: 100%; font-size: 8.5px; border: 1px solid #000; padding: 4px; border-radius: 0; background: #fff; line-height: 1.2; }
    .totals-summary-row { display: flex; justify-content: space-between; padding: 1px 0; }
    .totals-summary-row.bold { font-weight: bold; border-top: 1px solid #000; margin-top: 2px; padding-top: 2px; font-size: 10px; }
    
    .signatures-section { display: grid; grid-template-columns: 1fr; gap: 2px; }
    .signature-group { text-align: left; position: relative; }
    .signature-name { font-weight: bold; text-decoration: underline; font-size: 8.5px; margin-top: 8px !important; display: block; }
    .signature-title { font-size: 7px; color: #666; font-weight: 600; }
    .noted-by-section { display: flex; gap: 15px; }
    .conforme-section { margin-top: 3px; font-weight: bold; font-size: 8.5px; }
    .conforme-line { border-bottom: 1px solid #333; display: inline-block; width: 150px; height: 10px; }
    .signature-img { width: 55px; height: auto; position: absolute; top: -10px; left: 50%; transform: translateX(-50%); z-index: 10; pointer-events: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-container">
        <div class="logo-container"><img src="/autoworxlogo.png" alt="Logo" /></div>
        <div class="header-content">
          <h1>Autoworx Repair and General Mdse. Co. Ltd.</h1>
          <p class="address">Zone 7 Sepulvida Street, Kauswagan Highway, Cagayan de Oro City</p>
          <p class="contact">Telefax /Landline: (088) 880-4825 Mobile: (Paul- 09363549603 ) (0965-918-3394 Reception)</p>
          <p class="email">Email add: alfred_autoworks@yahoo.com / paulsuazo64@gmail.com / autoworxcagayan2025@gmail.com</p>
        </div>
      </div>
    </div>
    
    <div class="estimate-bar">${appointment.status === 'pending' ? 'APPOINTMENT CONFIRMATION' : (isAdmin ? 'REPAIR ESTIMATE' : 'REPAIR STATUS REPORT')}</div>
    
    ${appointment.status === 'pending' ? `
    <div class="estimate-meta">
      <div>DATE: ${new Date().toLocaleDateString("en-PH", { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
      <div>TRACKING NO: ${appointment.trackingCode}</div>
    </div>
    ` : (isAdmin ? `
    <div class="estimate-meta">
      <div>DATE: ${new Date().toLocaleDateString("en-PH", { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
      <div>ESTIMATE NUMBER: ${appointment.estimateNumber || "PENDING"}</div>
    </div>
    ` : `
    <div style="height: 4px;"></div>
    `)}

    <div class="section-title">Customer & Vehicle Information</div>
    <table class="info-table">
      <tr>
        <td class="label-cell">CLIENT NAME:</td>
        <td class="value-cell">${appointment.name}</td>
        <td class="label-cell">ASSIGNEE/DRIVER:</td>
        <td class="value-cell">${appointment.assigneeDriver || "N/A"}</td>
      </tr>
      <tr>
        <td class="label-cell">VEHICLE UNIT:</td>
        <td class="value-cell">${appointment.vehicleYear} ${appointment.vehicleMake} ${appointment.vehicleModel}</td>
        <td class="label-cell">CONTACT NUMBER:</td>
        <td class="value-cell">${appointment.phone || "N/A"}</td>
      </tr>
      <tr>
        <td class="label-cell">PLATE NUMBER:</td>
        <td class="value-cell"><strong>${appointment.vehiclePlate}</strong></td>
        <td class="label-cell">EMAIL ADDRESS:</td>
        <td class="value-cell">${appointment.email || "N/A"}</td>
      </tr>
      <tr>
        <td class="label-cell">VEHICLE COLOR:</td>
        <td class="value-cell">${appointment.vehicleColor || "N/A"}</td>
        <td class="label-cell">TRACKING NO:</td>
        <td class="value-cell" style="font-family: monospace; font-weight: bold;">${appointment.trackingCode}</td>
      </tr>
      <tr>
        <td class="label-cell">INSURANCE:</td>
        <td class="value-cell">${appointment.insurance || "N/A"}</td>
        <td class="label-cell">SERVICE TYPE:</td>
        <td class="value-cell">${appointment.service}</td>
      </tr>
      <tr>
        <td class="label-cell"></td>
        <td class="value-cell"></td>
        <td class="label-cell">S/A:</td>
        <td class="value-cell" style="text-transform: uppercase;">${options.serviceAdvisor || appointment.serviceAdvisor || "N/A"}</td>
      </tr>
      <tr>
        <td class="label-cell">CHASSIS NO:</td>
        <td class="value-cell">${appointment.chassisNumber || "N/A"}</td>
        <td class="label-cell" rowspan="2" style="text-align: center; font-size: 9px; vertical-align: middle; text-transform: uppercase;">SCAN TO TRACK:</td>
        <td class="value-cell" rowspan="2" style="text-align: center; padding: 5px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${baseUrl}/track?code=${appointment.trackingCode}`)}" style="width: 60px; height: 60px; display: inline-block;" />
          <p style="font-size: 7px; margin-top: 4px; color: #666; font-weight: bold;">Scan to track status</p>
        </td>
      </tr>
      <tr>
        <td class="label-cell">ENGINE NO:</td>
        <td class="value-cell">${appointment.engineNumber || "N/A"}</td>
      </tr>
    </table>

    ${appointment.status === 'pending' ? `
    <div style="text-align: center; margin: 15px 0; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <p style="font-size: 12px; font-weight: bold; color: #2e74b5; margin-bottom: 4px;">Thank you for your appointment request!</p>
      <p style="font-size: 9px; color: #666; max-width: 85%; line-height: 1.3; margin-bottom: 10px;">We have received your details. Our team will review your request and contact you via phone or email for final confirmation within 24 hours.</p>
      <div style="padding: 12px; text-align: center; border: 1.2px dashed #1a5f9c; border-radius: 6px; background: #fdfdfd; max-width: 90%; -webkit-print-color-adjust: exact;">
        <p style="font-size: 9px; font-weight: bold; color: #1a5f9c; line-height: 1.5; margin: 0;">
          For complete cost estimation information, please reach out to Sir Ryan or Sir Paul.<br>
          Thank you
        </p>
      </div>
    </div>
    ` : `
    <div class="status-summary">
      <div class="status-box repair">
        <p style="font-size: 8px; color: #666; margin-bottom: 3px; font-weight: bold; text-transform: uppercase;">REPAIR STATUS</p>
        <p style="font-weight: bold; color: #28a745; font-size: 9px;">${repairStatus}</p>
        ${appointment.currentRepairPart ? `<p style="font-size: 8.5px; color: #28a745; margin-top: 2px; font-style: italic;">Working on: ${appointment.currentRepairPart}</p>` : ""}
      </div>
      <div class="status-box appointment">
        <p style="font-size: 8px; color: #666; margin-bottom: 3px; font-weight: bold; text-transform: uppercase;">APPOINTMENT</p>
        <p style="font-weight: bold; color: #856404; font-size: 9px;">${appointmentStatus}</p>
      </div>
    </div>
    `}

    ${isAdmin && appointment.status !== 'pending' ? `
    <div class="section-title">Cost Estimation</div>
    <div class="costing-section">
      <table class="costing-table">
        <thead>
          <tr>
            <th style="width: 55%;">Description</th>
            <th style="width: 10%;">Qty</th>
            <th style="width: 17.5%;" class="amount">Unit Piece</th>
            <th style="width: 17.5%;" class="amount">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(appointment.costing?.items.length || 0) > 0 ? activeCategories.sort((a, b) => {
    const order = ["Tinsmith", "Mechanical Works", "Electrical", "Aircon", "Alignment", "Glassworks", "Detailing", "Painting", "Parts", "Service", "Labor", "Service/Labor"];
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  }).map(cat => {
    const items = categorized[cat];
    return `
              <tr>
                <td colspan="4" style="background: #fdfdfd; font-weight: bold; font-size: 1.1em; border-bottom: 1px solid #000; padding-top: 2px;">
                  ${cat}
                </td>
              </tr>
              ${items.map(item => `
                <tr>
                  <td style="padding-left: 12px;">${item.description}</td>
                  <td>${item.quantity}</td>
                  <td class="amount">₱${item.unitPrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                  <td class="amount">₱${item.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join("")}
            `;
  }).join("") : `
              <tr>
                <td colspan="4" style="text-align: center; color: #999; padding: 10px; font-style: italic;">No items listed for this estimate yet.</td>
              </tr>
            `}
        </tbody>
      </table>
    </div>
    ${appointment.costing?.notes ? `
    <div style="margin-top: 4px; padding: 4px 8px; background: #f9f9f9; border-left: 3px solid #d9e1f2; font-size: 8.5px; font-style: italic;">
      <strong>Notes:</strong> ${appointment.costing.notes}
    </div>
    ` : ""}
    ` : (!isAdmin && appointment.status !== 'pending' ? `
    <div style="margin: 15px auto; padding: 15px; text-align: center; border: 1.2px dashed #1a5f9c; border-radius: 6px; background: #fdfdfd; max-width: 90%; -webkit-print-color-adjust: exact;">
      <p style="font-size: 9px; font-weight: bold; color: #1a5f9c; line-height: 1.5; margin: 0;">
        For complete cost estimation information, please reach out to Sir Ryan or Sir Paul.<br>
        Thank you
      </p>
    </div>
    ` : "")}



    <div style="font-size: 10px; font-weight: bold; color: red; margin-bottom: 2px; text-transform: uppercase;">
      DELIVERY DATE: <span style="text-decoration: underline; color: red;">${appointment.costing?.deliveryDate || options.deliveryDate || "_______"}</span> WORKING DAYS
    </div>

    <div class="footer-layout">
      <div class="terms-box">
        <p style="font-weight: bold; margin-bottom: 3px; text-decoration: underline;">TERMS AND CONDITIONS:</p>
        <ol>
          <li>Price Quoted is subject to change w/o prior notice and is good for <strong style="color: red;">15 days</strong> only</li>
          <li>Any hidden defects found while in the course of repairs is deemed excluded and shall be charged accordingly</li>
          <li>Not valid as court evidence</li>
          <li>Waste parts/materials not claim within <strong style="color: red;">15 days</strong> upon release of unit are to be disposed accordingly.</li>
          <li>It is also understood that AUTOWORX REPAIR & GEN MDSE. CO., LTD., assumes no responsibility for the loss or personal belonging left inside the unit by theft or damage cause by fire or any fortetious events to vehicles which placed within our premises for the purpose of repair or Storage.</li>
          <li>Autoworx is only given for at least <strong style="color: red;">15 days</strong> free of charge for storage fees if the unit is already done for repair or the unit is stored for quotation purposes only. ( Rates range in P250-500 per day)</li>
          <li>Outside parts supply have corkage of 25% from autoworx price</li>
        </ol>
        <div class="conforme-section" style="margin-top: 10px;">
          Conforme: <span class="conforme-line"></span>
          <div style="margin-top: 15px; border-top: 1.5px solid #333; width: 200px;"></div>
          <div style="margin-top: 4px; font-size: 9px; font-weight: bold;">We also accept all other brands</div>
        </div>
      </div>

      <div class="signatures-totals-container">
        ${isAdmin && appointment.status !== 'pending' ? `
        <div class="totals-summary">
          <div class="totals-summary-row"><span>Total Parts</span><span>₱${partsTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div>
          <div class="totals-summary-row"><span>Total Labor</span><span>₱${laborTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div>
          <div class="totals-summary-row" style="border-top: 1px dashed #ddd; margin-top: 3px; padding-top: 3px; font-weight: 600;">
            <span>Subtotal</span><span>₱${(appointment.costing?.subtotal || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
          </div>
          ${(appointment.costing?.discount || 0) > 0 ? `
          <div class="totals-summary-row" style="color: #f97316;">
            <span>Discount (${appointment.costing!.discountType === "percentage" ? `${appointment.costing!.discount}%` : "Fixed"})</span>
            <span>-₱${(appointment.costing!.discountType === "percentage"
          ? (appointment.costing!.subtotal * appointment.costing!.discount) / 100
          : appointment.costing!.discount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
          </div>` : ""}
          ${appointment.costing?.vatEnabled ? `<div class="totals-summary-row" style="color: #666; font-size: 8.5px;"><span>VAT 12%</span><span>₱${(appointment.costing?.vatAmount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div>` : ""}
          <div class="totals-summary-row bold"><span>TOTAL</span><span>₱${(appointment.costing?.total || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span></div>
        </div>
        ` : ""}

        <div class="signatures-section">
          <div class="signature-group">
            <p style="font-size: 9px; font-weight: bold; margin-bottom: 4px;">Prepared by:</p>
            <span class="signature-name">Ryan Christopher D. Quintos</span>
            <p class="signature-title">Service Advisor</p>
          </div>
          
          <p style="font-size: 9px; font-weight: bold; margin-top: 10px; margin-bottom: 4px;">Noted by:</p>
          <table style="width: 100%; border-collapse: collapse; border: none;">
            <tr>
              <td style="width: 50%; border: none; padding: 0; vertical-align: bottom;">
                <div style="position: relative; padding-top: 35px; text-align: left;">
                  ${appointment.costing?.includePaulSignature ? `<img src="/paulsignature.png" style="position: absolute; width: 80px; top: -10px; left: -15px; z-index: 10;" />` : ""}
                  <span class="signature-name" style="margin-top: 0 !important; display: block;">Paul D. Suazo</span>
                  <p class="signature-title">Service Advisor / Manager</p>
                </div>
              </td>
              <td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;">
                <div style="position: relative; padding-top: 35px;">
                  ${appointment.costing?.includeAlfredSignature ? `<img src="/signature_alfred.png" style="position: absolute; width: 60px; top: -5px; right: 5px; z-index: 10;" />` : ""}
                  <span class="signature-name" style="margin-top: 0 !important; display: block;">Alfred N. Agbong</span>
                  <p class="signature-title">Gen. & Op. Manager</p>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`
  return htmlContent
}
