import { BookingFormData } from "@/components/booking/booking-form"
import type { CostingData, RepairStatus, CostItem } from "@/lib/constants"
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
  odoMileage?: string
  assigneeDriver?: string
  assignedTechnician?: string
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
  isArchived?: boolean
  syncedAt?: string
  synced_at?: string
  damageImages?: string[]
  orcrImage?: string
  orcrImage2?: string
  jobDescription?: string
  scopeOfWorks?: string
}

function toTitleCase(str: string): string {
  if (!str) return "";
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
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
      size: 8.5in 13in; 
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
        <td class="label-cell">S/A:</td>
        <td class="value-cell" style="text-transform: uppercase;">${appointmentData.serviceAdvisor || "N/A"}</td>
      </tr>
      <tr>
        <td class="label-cell">ENGINE:</td>
        <td class="value-cell">${appointmentData.engineNumber || "N/A"}</td>
        <td class="label-cell" rowspan="2" style="text-align: center; font-size: 8px; vertical-align: middle; text-transform: uppercase;">SCAN TO TRACK:</td>
        <td class="value-cell" rowspan="2" style="text-align: center; padding: 5px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${baseUrl}/track?code=${trackingCode}`)}" style="width: 65px; height: 65px;" />
          <p style="font-size: 7px; margin-top: 4px; color: #666;">Scan to track the unit status</p>
        </td>
      </tr>
      <tr>
        <td class="label-cell">ODO/MILEAGE:</td>
        <td class="value-cell">${appointmentData.odoMileage ? appointmentData.odoMileage + ' KM' : "N/A"}</td>
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
  documentDate?: string;
}

export async function generateTrackingPDF(appointment: TrackingAppointment, role: 'admin' | 'user' = 'user', reportTitle?: string, options: PDFOptions = {}): Promise<string> {
  const isAdmin = role === 'admin'
  const isReleased = appointment.isArchived
  let repairStatus = getRepairStatusLabel(isReleased ? "completed_ready" : appointment.repairStatus)
  
  if (repairStatus === "Not Started" && (appointment.syncedAt || appointment.synced_at)) {
    repairStatus = "On-Going Repair"
  }

  const appointmentStatus = isReleased ? "Released / History" : getAppointmentStatusLabel(appointment.status)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : PRODUCTION_URL
  const displayTitle = reportTitle || (appointment.status === 'pending' ? "Appointment Confirmation" : (isReleased ? "Final Status Report (Released)" : (isAdmin ? "Repair Estimate" : "Repair Status Report")))

  const categoryOrder = ["Parts", "Tinsmith/Alignment", "Mechanical Works", "Electrical", "Aircon", "Painting", "Detailing", "Glassworks", "Remove and Install", "Others"];

  const partsTotal = (appointment.costing?.items || []).filter(item => item.type === 'parts').reduce((sum, item) => sum + item.total, 0) || 0
  const laborTotal = (appointment.costing?.items || []).filter(item => item.type !== 'parts').reduce((sum, item) => sum + item.total, 0) || 0

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
  }, { "Parts": [] } as Record<string, any[]>)

  // Filter out empty categories EXCEPT for Parts
  const activeCategories = Object.keys(categorized).filter(cat => cat === "Parts" || categorized[cat].length > 0);

  // Sort categories according to the predefined order
  activeCategories.sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  const totalRows = (appointment.costing?.items.length || 0) + activeCategories.length
  const shouldScale = totalRows > 12

  // Helper to format the custom document date or fallback to today
  const getFormattedDate = () => {
    if (options.documentDate) {
      // Input from type="date" is "YYYY-MM-DD"
      // Split and manually format as MM/DD/YYYY to avoid timezone shifts or locale DD/MM vs MM/DD issues
      const parts = options.documentDate.split("-");
      if (parts.length === 3) {
        return `${parts[1]}/${parts[2]}/${parts[0]}`;
      }
      return options.documentDate; // Fallback to raw string if completely invalid
    }

    // Default to today MM/DD/YYYY
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${mm}/${dd}/${today.getFullYear()}`;
  };

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
      size: 8.5in 13in; 
      margin: 0.3in 0.25in; 
    }
    .container { 
      width: 100%; 
      margin: 0 auto; 
      display: flex;
      flex-direction: column;
    }
    .header { border-bottom: none; padding-bottom: 0; margin-bottom: 0; position: relative; }
    .header-container { display: flex; align-items: center; justify-content: center; gap: 25px; width: 100%; padding-bottom: 3px; }
    .logo-container { width: 110px; }
    .logo-container img { width: 110px; height: auto; }
    .header-content { text-align: center; padding-top: 3px; }
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
    .costing-table th, .costing-table td { border: 1px solid #000; padding: 5px 6px; text-align: left; font-size: 8.5px; vertical-align: middle; line-height: 1.4; white-space: pre-wrap; }
    .costing-table th { background: #d9e1f2 !important; font-weight: bold; border: 1px solid #000 !important; -webkit-print-color-adjust: exact; padding: 4px 6px; }
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
    
    /* New styles for images in report */
    .image-gallery { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 8px; }
    .image-item { border: 1px solid #ddd; border-radius: 3px; overflow: hidden; aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; background: #f9f9f9; }
    .image-item img { width: 100%; height: 100%; object-cover: cover; }
    .doc-gallery { display: flex; gap: 8px; margin-bottom: 8px; }
    .doc-item { border: 1px solid #ddd; border-radius: 3px; overflow: hidden; width: 140px; aspect-ratio: 3/2; background: #f9f9f9; }
    .doc-item img { width: 100%; height: 100%; object-cover: cover; }
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
      <div>DATE: ${getFormattedDate()}</div>
      <div>TRACKING NO: ${appointment.trackingCode}</div>
    </div>
    ` : (isAdmin ? `
    <div class="estimate-meta">
      <div>DATE: ${getFormattedDate()}</div>
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
        <td class="label-cell" rowspan="3" style="text-align: center; font-size: 9px; vertical-align: middle; text-transform: uppercase;">SCAN TO TRACK:</td>
        <td class="value-cell" rowspan="3" style="text-align: center; padding: 5px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${baseUrl}/track?code=${appointment.trackingCode}`)}" style="width: 60px; height: 60px; display: inline-block;" />
          <p style="font-size: 7px; margin-top: 4px; color: #666; font-weight: bold;">Scan to track status</p>
        </td>
      </tr>
      <tr>
        <td class="label-cell">ENGINE NO:</td>
        <td class="value-cell">${appointment.engineNumber || "N/A"}</td>
      </tr>
      <tr>
        <td class="label-cell">ODO/MILEAGE:</td>
        <td class="value-cell">${appointment.odoMileage ? appointment.odoMileage + ' KM' : "N/A"}</td>
      </tr>
    </table>
    
    ${/* Removed Visual Damage Records and Official Documents sections per user request */ ""}

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
            <th style="width: 48%;">Description</th>
            <th style="width: 7%;">Qty</th>
            <th style="width: 10%;">Unit</th>
            <th style="width: 17.5%;" class="amount">Unit Price</th>
            <th style="width: 17.5%;" class="amount">Total</th>
          </tr>
        </thead>
        <tbody>
          ${activeCategories.length > 0 ? activeCategories.map(cat => {
    const items = categorized[cat];
    return `
              <tr>
                <td colspan="5" style="background: #fdfdfd; font-weight: bold; font-size: 1.1em; border-bottom: 1px solid #000; padding-top: 2px;">
                  ${cat.toUpperCase()}
                </td>
              </tr>
              ${items.length > 0 ? items.map((item: CostItem) => `
                <tr>
                  <td style="padding-left: 12px; white-space: pre-wrap; vertical-align: top;">${toTitleCase(item.description)}</td>
                  <td style="vertical-align: top;">${item.quantity}</td>
                  <td style="vertical-align: top;">${item.unit || ""}</td>
                  <td class="amount" style="vertical-align: top;">₱${item.unitPrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                  <td class="amount" style="vertical-align: top;">₱${item.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join("") : (cat === "Parts" ? `
                <tr>
                  <td colspan="5" style="padding-left: 12px; color: #999; font-style: italic;">No parts were added.</td>
                </tr>
              ` : "")}
            `;
  }).join("") : `
              <tr>
                <td colspan="5" style="text-align: center; color: #999; padding: 10px; font-style: italic;">No items listed for this estimate yet.</td>
              </tr>
            `}
        </tbody>
      </table>
    </div>
    ${appointment.costing?.notes ? `
    <div style="margin-top: 4px; padding: 4px 8px; background: #f9f9f9; border-left: 3px solid #d9e1f2; font-size: 8.5px; font-style: italic; white-space: pre-wrap;">
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
          <div style="display: flex; justify-content: space-between;">
            <div class="signature-group" style="width: 50%;">
              <p style="font-size: 9px; font-weight: bold; margin-bottom: 4px;">Prepared by:</p>
              <span class="signature-name">${appointment.costing?.serviceAdvisorName || 'Ryan Christopher D. Quintos'}</span>
              <p class="signature-title">Service Advisor</p>
            </div>
            
            <div class="signature-group" style="width: 50%; text-align: right;">
              ${appointment.costing?.brpAdvisorName ? `
                <span class="signature-name" style="margin-top: 15px !important; display: block;">${appointment.costing.brpAdvisorName}</span>
                <p class="signature-title">BRP Advisor</p>
              ` : ''}
            </div>
          </div>
          
          <p style="font-size: 9px; font-weight: bold; margin-top: 10px; margin-bottom: 4px;">Noted by:</p>
          <table style="width: 100%; border-collapse: collapse; border: none;">
            <tr>
              <td style="width: 50%; border: none; padding: 0; vertical-align: bottom;">
                <div style="position: relative; padding-top: 35px; text-align: left;">
                  ${appointment.costing?.includePaulSignature ? `<img src="/paulsignature.png" style="position: absolute; width: 80px; top: -10px; left: -15px; z-index: 10;" />` : ""}
                  <span class="signature-name" style="margin-top: 0 !important; display: block;">Paul D. Suazo</span>
                  <p class="signature-title">Service Manager</p>
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

export interface GatepassData {
  id?: string;
  clientName: string;
  unitModel: string;
  plateNo: string;
  color: string;
  insurance: string;
  invoiceNo: string;
  orNo: string;
  joNo: string;
  amount: number | string;
  brpad?: number | string;
  aircon?: number | string;
  electrical?: number | string;
  mechanical?: number | string;
  mop?: string;
  costing?: any;
  cashier: string;
  serviceAdvisor: string;
  note: string;
  date: string;
  origin?: 'history' | 'appointments';
}

export async function generateGatepassPDF(data: GatepassData): Promise<string> {
  const gatepassContent = (type: 'OFFICE' | 'GUARDS') => `
    <div class="gatepass-copy" style="margin: 0; padding: 0;">
      <div class="header" style="margin-bottom: 0px;">
        <div class="header-container" style="display: flex; justify-content: space-between; align-items: center;">
          <div class="logo-container" style="width: 150px;">
            <img src="/autoworxlogo.png" style="width: 120px; height: auto; margin-left: 40px;" />
          </div>
          <div class="gatepass-title" style="flex: 1; text-align: center; color: #c00; font-size: 20px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0;">CLAIM / CHECK GATEPASS</div>
          <div style="width: 150px; text-align: right; font-size: 10px; font-weight: bold; color: ${type === 'OFFICE' ? '#000' : '#4444e0ff'};">${type} COPY</div>
        </div>
      </div>

      <div class="content-box" style="border: 2px solid #000; margin-bottom: 5px;">
        <div style="display: flex; border-bottom: 1px solid #000;">
          <div style="flex: 2; padding: 4px 8px; border-right: 1px solid #000;">
            <span style="font-weight: bold; font-size: 10px; margin-right: 5px;">CLIENT NAME:</span>
            <span style="font-size: 11px; border-bottom: 1px solid #999; flex: 1; display: inline-block; min-width: 150px;">${data.clientName}</span>
          </div>
          <div style="flex: 1.5; padding: 4px 8px;">
            <span style="font-weight: bold; font-size: 10px; margin-right: 5px;">DATE:</span>
            <span style="font-size: 11px; border-bottom: 1px solid #999; flex: 1; display: inline-block; min-width: 120px;">${data.date}</span>
          </div>
        </div>

        <div style="display: flex; border-bottom: 1px solid #000;">
          <div style="flex: 2; padding: 4px 8px; border-right: 1px solid #000;">
            <span style="font-weight: bold; font-size: 10px; margin-right: 5px;">UNIT/MODEL:</span>
            <span style="font-size: 11px; border-bottom: 1px solid #999; flex: 1; display: inline-block; min-width: 150px;">${data.unitModel}</span>
          </div>
          <div style="flex: 1.5; padding: 4px 8px;">
            <span style="font-weight: bold; font-size: 10px; margin-right: 5px;">J.O.:</span>
            <span style="font-size: 11px; border-bottom: 1px solid #999; flex: 1; display: inline-block; min-width: 120px;">${data.joNo}</span>
          </div>
        </div>

        <div style="padding: 4px 8px; border-bottom: 1px solid #000;">
          <span style="font-weight: bold; font-size: 10px; margin-right: 5px;">PLATE #:</span>
          <span style="font-size: 11px; border-bottom: 1px solid #999; display: inline-block; min-width: 150px;">${data.plateNo}</span>
        </div>

        <div style="padding: 4px 8px; border-bottom: 1px solid #000;">
          <span style="font-weight: bold; font-size: 10px; margin-right: 5px;">COLOR:</span>
          <span style="font-size: 11px; border-bottom: 1px solid #999; display: inline-block; min-width: 150px;">${data.color || "N/A"}</span>
        </div>

        <div style="display: flex; border-bottom: 1px solid #000;">
          <div style="flex: 1.5; padding: 4px 8px; border-right: 1px solid #000;">
            <span style="font-weight: bold; font-size: 10px; margin-right: 5px;">INSURANCE:</span>
            <span style="font-size: 11px; border-bottom: 1px solid #999; display: inline-block; min-width: 120px;">${data.insurance || "N/A"}</span>
          </div>
          <div style="flex: 1; padding: 4px 8px;">
            <span style="font-weight: bold; font-size: 10px; margin-right: 5px;">CASHIER:</span>
            <span style="font-size: 11px; border-bottom: 1px solid #999; display: inline-block; min-width: 100px;">${data.cashier || "________________"}</span>
          </div>
        </div>

        <div style="display: flex; border-bottom: 1px solid #000;">
          <div style="flex: 1.5; padding: 4px 8px; border-right: 1px solid #000;">
            <span style="font-weight: bold; font-size: 10px; margin-right: 5px;">INVOICE #:</span>
            <span style="font-size: 11px; border-bottom: 1px solid #999; display: inline-block; min-width: 120px;">${data.invoiceNo || "________________"}</span>
          </div>
          <div style="flex: 1; padding: 4px 8px;">
            <span style="font-weight: bold; font-size: 9px; margin-right: 5px;">SERVICE ADVISOR:</span>
            <span style="font-size: 11px; border-bottom: 1px solid #999; display: inline-block; min-width: 100px;">${data.serviceAdvisor || "________________"}</span>
          </div>
        </div>

        <div style="padding: 4px 8px; border-bottom: 1px solid #000;">
          <span style="font-weight: bold; font-size: 10px; margin-right: 5px;">OR #:</span>
          <span style="font-size: 11px; border-bottom: 1px solid #999; display: inline-block; min-width: 150px;">${data.orNo || "________________"}</span>
        </div>

        ${type === 'OFFICE' ? `
        <div style="padding: 4px 8px; border-bottom: 1px solid #000;">
          <span style="font-weight: bold; font-size: 10px; margin-right: 5px;">AMOUNT:</span>
          <span style="font-size: 14px; font-weight: bold; color: #c00;">${typeof data.amount === 'number' ? `₱${data.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : data.amount}</span>
        </div>
        ` : ''}

        <div style="padding: 5px; min-height: 30px;">
          <span style="font-weight: bold; font-size: 11px; color: #c00; text-decoration: underline;">NOTE:</span>
          <div style="font-size: 10px; font-style: italic; margin-top: 3px; white-space: pre-wrap;">${data.note || ""}</div>
        </div>
      </div>

      <div style="border: 2px solid #000; padding: 5px; text-align: center; background: #f0f0f0 !important; -webkit-print-color-adjust: exact;">
        <p style="font-weight: bold; font-size: 10px; margin-bottom: 3px; text-decoration: underline;">IMPORTANT</p>
        <p style="font-size: 9.5px; line-height: 1.3; font-weight: bold;">THE EXIT GUARD WILL HONOR THIS CLAIM/ CHECK GATEPASS ONLY UPON PRESENTATION OF YOUR SERVICE INVOICE COPY AND OFFICIAL RECEIPT COPY ISSUED BY THE CASHIER. THANK YOU.</p>
      </div>

      <div style="margin-top: 20px;margin-left: 70px; font-size: 11px; font-weight: bold;">
        Signed and Approved by: ____________________________________
      </div>
    </div>
  `;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gatepass - ${data.clientName}</title>
  <style>
    @page { 
      size: 8.5in 13in; 
      margin: 0 !important; /* Force zero margin to remove browser headers/footers */
    }
    body { 
      font-family: Arial, sans-serif; 
      -webkit-print-color-adjust: exact; 
      margin: 0; 
      padding: 0; 
      background: #f0f0f0; 
    }
    .print-paper {
      background: white;
      width: 8.5in;
      min-height: 13in;
      margin: 0 auto;
      padding: 0.25in 0.4in; /* Reduced top/bottom padding */
      box-sizing: border-box;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }
    .container { 
      height: 100%;
      display: flex; 
      flex-direction: column; 
      justify-content: center; /* Center vertically on the paper */
      gap: 5px; 
      transform: scale(1); /* Return to 100% scale for sharp text */
      transform-origin: top center;
    }
    @media print {
      body { background: transparent; }
      .print-paper { box-shadow: none; margin: 0; width: 100%; border: none; padding: 0.1in 0.4in; }
      .container { transform: scale(1); height: auto; }
    }
  </style>
</head>
<body>
  <div class="print-paper">
    <div class="container">
      ${gatepassContent('OFFICE')}
      <div style="border-top: 2px dashed #999; margin: 2px 0; width: 100%;"></div>
      ${gatepassContent('GUARDS')}
    </div>
  </div>
</body>
</html>
`;
  return htmlContent;
}

export function generateReleaseMonitoringDoc(records: any[], monthLabel: string, getCategorizedCosts: (costing: any, recordId?: string) => any, title: string = "RELEASE MONITORING", dateColumnLabel: string = "DATE RELEASED"): string {
  let totalBRPAD = 0, totalAircon = 0, totalElectrical = 0, totalMechanical = 0, grandTotal = 0;

  const rowsHtml = records.map((r, idx) => {
    const claimType = r.insurance ? r.insurance.toUpperCase() : "";
    const unitStr = `${r.vehicle_year || r.vehicleYear || ""} ${r.vehicle_make || r.vehicleMake || ""} ${r.vehicle_model || r.vehicleModel || ""}`.trim();
    const isSales = title.includes("SALES");
    const showCompleteDate = !isSales;

    // Harmonize date logic with SalesMonitoring UI priority
    const entryDateStr = (r.syncedAt || r.synced_at || r.createdAt || r.original_created_at || r.created_at)
      ? new Date(r.syncedAt || r.synced_at || r.createdAt || r.original_created_at || r.created_at).toLocaleDateString("en-US")
      : "-";

    const releaseDateStr = (r.completed_at || r.completedAt || r.original_created_at || r.createdAt)
      ? new Date(r.completed_at || r.completedAt || r.original_created_at || r.createdAt).toLocaleDateString("en-US")
      : "";

    const completeDateStr = (r.status_updated_at || r.statusUpdatedAt)
      ? new Date(r.status_updated_at || r.statusUpdatedAt).toLocaleDateString("en-US")
      : (r.completed_at || r.completedAt ? new Date(r.completed_at || r.completedAt).toLocaleDateString("en-US") : "-");

    const effectiveDateColumnValue = isSales ? entryDateStr : releaseDateStr;

    // Age Calculation
    const entryDateObj = (r.syncedAt || r.synced_at || r.createdAt || r.original_created_at || r.created_at)
      ? new Date(r.syncedAt || r.synced_at || r.createdAt || r.original_created_at || r.created_at)
      : null;
    const now = new Date();
    let ageDaysText = "-";
    let ageMonthsText = "-";
    if (entryDateObj && !isNaN(entryDateObj.getTime())) {
      const diffTime = Math.abs(now.getTime() - entryDateObj.getTime());
      ageDaysText = `${Math.floor(diffTime / (1000 * 60 * 60 * 24))}d`;

      let months = (now.getFullYear() - entryDateObj.getFullYear()) * 12 + (now.getMonth() - entryDateObj.getMonth());
      if (now.getDate() < entryDateObj.getDate()) {
        months--;
      }
      ageMonthsText = `${Math.max(0, months)}m`;
    }

    const jobOrderHistory = r.costing?.jobOrderHistory || [];
    const latestHistory = jobOrderHistory.length > 0 ? jobOrderHistory[jobOrderHistory.length - 1] : null;
    const targetDateRaw = latestHistory?.targetDate || r.target_date || r.targetDate;
    let formattedTargetDate = "-";
    if (targetDateRaw) {
      const [y, m, d] = targetDateRaw.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        formattedTargetDate = new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
    }

    const costs = getCategorizedCosts(r.costing, r.id);

    totalBRPAD += costs.brpad;
    totalAircon += costs.aircon;
    totalElectrical += costs.electrical;
    totalMechanical += costs.mechanical;
    grandTotal += costs.total;



    return `
      <tr>
        <td>${idx + 1}</td>
        <td class="text-left">${unitStr}</td>
        <td>${r.vehicle_plate || r.vehiclePlate || ""}</td>
        <td>${r.vehicle_color || r.vehicleColor || ""}</td>
        <td class="text-left">${r.name || ""}</td>
        <td style="font-size: 8px;">${claimType}</td>
        <td class="text-left">${r.estimate_number || r.estimateNumber || r.trackingCode || ""}</td>
        <td class="text-right">${costs.brpad > 0 ? costs.brpad.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : ""}</td>
        <td class="text-right">${costs.aircon > 0 ? costs.aircon.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : ""}</td>
        <td class="text-right">${costs.electrical > 0 ? costs.electrical.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : ""}</td>
        <td class="text-right">${costs.mechanical > 0 ? costs.mechanical.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : ""}</td>
        <td class="text-right" style="font-weight: bold;">${costs.total > 0 ? costs.total.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : ""}</td>
        <td>${costs.mop || r.current_repair_part || r.currentRepairPart || ""}</td>
        ${isSales ? `
        <td style="font-weight: bold;">
          ${(r.source === 'history' || r.completed_at || r.isArchived) ? "RELEASED" : "IN-PROGRESS"}
        </td>
        ` : ""}
        ${showCompleteDate ? `<td>${completeDateStr}</td>` : ""}
        <td>${effectiveDateColumnValue}</td>
        ${isSales ? `<td style="color: #d97706; font-weight: bold;">${formattedTargetDate}</td>` : ""}
        <td>${ageDaysText}</td>
        <td>${ageMonthsText}</td>
        <td class="text-left">${r.paul_notes || r.paulNotes || r.remarks || ""}</td>
      </tr>
    `;
  }).join("");

  const footerHtml = records.length > 0 ? `
    <tr style="background: #f8f9fa; font-weight: bold;">
      <td colspan="7" class="text-right" style="padding-right: 15px; border-top: 2px solid #000;">${title.includes("SALES") ? "TOTAL SALES" : "GRAND TOTAL"}</td>
      <td class="text-right" style="border-top: 2px solid #000;">${totalBRPAD.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
      <td class="text-right" style="border-top: 2px solid #000;">${totalAircon.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
      <td class="text-right" style="border-top: 2px solid #000;">${totalElectrical.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
      <td class="text-right" style="border-top: 2px solid #000;">${totalMechanical.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
      <td class="text-right" style="border-top: 2px solid #000; color: #c00;">${grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
      <td colspan="${title.includes("SALES") ? 7 : 6}" style="border-top: 2px solid #000;"></td>
    </tr>
  ` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Release Monitoring - ${monthLabel}</title>
  <style>
    @page { 
      size: 13in 8.5in; /* Long Bond Paper Landscape */
      margin: 0.4in; 
    }
    body { 
      font-family: Arial, sans-serif; 
      margin: 0; 
      padding: 0;
      font-size: 9px;
      -webkit-print-color-adjust: exact;
      color: #000;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th, td {
      border: 1px solid #000;
      padding: 4px;
      text-align: center;
      word-wrap: break-word;
      vertical-align: middle;
    }
    th {
      font-weight: bold;
    }
    thead {
      display: table-header-group;
    }
    tbody tr {
      page-break-inside: avoid;
    }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
      font-family: 'Times New Roman', serif;
      letter-spacing: 2px;
      display: inline-flex;
      padding-bottom: 5px;
    }
    .red-line {
      border-bottom: 4px solid #FF0000;
      color: #FF0000;
      text-shadow: 1px 1px 0 #fff, 2px 2px 0 #ccc;
      padding-right: 5px;
    }
    .black-line {
      border-bottom: 4px solid #000000;
      color: #000000;
      text-shadow: 1px 1px 0 #fff, 2px 2px 0 #ccc;
    }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr>
        <th colspan="18" style="text-align: left; border: none; padding-bottom: 10px;">
          <h1>
            <span class="red-line">SALES</span>
            <span class="black-line">MONITORING</span>
            <span style="border: none; margin-left: 10px; color: #000; text-shadow: 1px 1px 0 #fff, 2px 2px 0 #ccc;">${title.replace('SALES MONITORING', '').trim()}</span>
          </h1>
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 8px;">
            <div style="display: flex; gap: 40px; align-items: baseline;">
              <div style="font-weight: bold; font-size: 10px;">${title.includes('SALES') ? 'UNIT ENTRY' : 'RELEASE MONITORING'}</div>
              <div style="font-weight: normal; font-size: 13px; margin-left: 20px; color: #333;">As of: ${monthLabel}</div>
            </div>
            <div style="font-weight: bold; font-size: 16px; color: #000;">
              Date Printed: <span style="font-weight: normal; font-size: 14px; margin-left: 8px;">${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} ${new Date().toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
            </div>
          </div>
        </th>
      </tr>
      <tr style="background: #fff345ff; color: #000;">
        <th style="font-size: 8px; width: 3%;">NO.</th>
        <th style="font-size: 8px; width: 13%;">UNIT</th>
        <th style="font-size: 8px; width: 7%;">PLATE</th>
        <th style="font-size: 8px; width: 5%;">COLOR</th>
        <th style="font-size: 8px; width: 14%;">OWNER</th>
        <th style="font-size: 6px; width: 8%;">CLAIM TYPE<br/>INSURANCE/PERSONAL</th>
        <th style="font-size: 8px; width: 8%;">JO/ ES/ PO #</th>
        <th style="font-size: 8px; width: 6%;">BRPAD</th>
        <th style="font-size: 8px; width: 6%;">AIRCON</th>
        <th style="font-size: 8px; width: 6%;">ELECTRICAL</th>
        <th style="font-size: 8px; width: 6%;">MECHANICAL</th>
        <th style="font-size: 8px; width: 7%;">TOTAL<br/><span style="font-size: 5px; font-weight: normal; letter-spacing: -0.5px;">(w/ VAT/DISCOUNT)</span></th>
        <th style="font-size: 8px; width: 4%;">MOP</th>
        ${title.includes("SALES") ? `<th style="font-size: 8px; width: 6%;">STATUS</th>` : ""}
        ${!title.includes("SALES") ? `<th style="font-size: 8px; width: 7%;">DATE COMPLETE</th>` : ""}
        <th style="font-size: 8px; width: 7%;">${dateColumnLabel}</th>
        ${title.includes("SALES") ? `<th style="font-size: 8px; width: 7%;">TARGET DATE</th>` : ""}
        <th style="font-size: 8px; width: 4%;">AGE (D)</th>
        <th style="font-size: 8px; width: 4%;">AGE (M)</th>
        <th style="font-size: 8px; width: 10%;">REMARKS</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      ${footerHtml}
    </tbody>
  </table>
</body>
</html>`;
}

export function generateActiveRepairsDoc(records: any[], monthLabel: string, title: string = "ACTIVE ON-GOING REPAIRS", dateColumnLabel: string = "DATE ENTERED"): string {
  const rowsHtml = records.map((r: any, idx: number) => {
    const claimType = r.insurance ? r.insurance.toUpperCase() : "";
    const unitStr = `${r.vehicle_year || r.vehicleYear || ""} ${r.vehicle_make || r.vehicleMake || ""} ${r.vehicle_model || r.vehicleModel || ""}`.trim();

    const entryDateStr = (r.syncedAt || r.synced_at || r.createdAt || r.original_created_at || r.created_at)
      ? new Date(r.syncedAt || r.synced_at || r.createdAt || r.original_created_at || r.created_at).toLocaleDateString("en-US")
      : "-";

    const entryDateObj = (r.syncedAt || r.synced_at || r.createdAt || r.original_created_at || r.created_at)
      ? new Date(r.syncedAt || r.synced_at || r.createdAt || r.original_created_at || r.created_at)
      : null;
    const now = new Date();
    let ageDaysText = "-";
    let ageMonthsText = "-";
    if (entryDateObj && !isNaN(entryDateObj.getTime())) {
      const diffTime = Math.abs(now.getTime() - entryDateObj.getTime());
      ageDaysText = `${Math.floor(diffTime / (1000 * 60 * 60 * 24))}d`;

      let months = (now.getFullYear() - entryDateObj.getFullYear()) * 12 + (now.getMonth() - entryDateObj.getMonth());
      if (now.getDate() < entryDateObj.getDate()) {
        months--;
      }
      ageMonthsText = `${Math.max(0, months)}m`;
    }

    const jobOrderHistory = r.costing?.jobOrderHistory || [];
    const latestHistory = jobOrderHistory.length > 0 ? jobOrderHistory[jobOrderHistory.length - 1] : null;
    const targetDateRaw = latestHistory?.targetDate || r.target_date || r.targetDate;
    let formattedTargetDate = "-";
    if (targetDateRaw) {
      const [y, m, d] = targetDateRaw.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        formattedTargetDate = new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
    }

    return `
      <tr>
        <td>${idx + 1}</td>
        <td class="text-left">${unitStr}</td>
        <td>${r.vehicle_plate || r.vehiclePlate || ""}</td>
        <td>${r.vehicle_color || r.vehicleColor || ""}</td>
        <td class="text-left">${r.name || ""}</td>
        <td style="font-size: 8px;">${claimType}</td>
        <td class="text-left">${r.estimate_number || r.estimateNumber || r.trackingCode || ""}</td>
        <td>${r.current_repair_part || r.currentRepairPart || ""}</td>
        <td style="font-weight: bold;">ON-GOING REPAIR</td>
        <td>${entryDateStr}</td>
        <td style="color: #d97706; font-weight: bold;">${formattedTargetDate}</td>
        <td>${ageDaysText}</td>
        <td>${ageMonthsText}</td>
      </tr>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Active Repairs Monitoring - ${monthLabel}</title>
  <style>
    @page { 
      size: 13in 8.5in; /* Long Bond Paper Landscape */
      margin: 0.4in; 
    }
    body { 
      font-family: Arial, sans-serif; 
      margin: 0; 
      padding: 0;
      font-size: 9px;
      -webkit-print-color-adjust: exact;
      color: #000;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th, td {
      border: 1px solid #000;
      padding: 4px;
      text-align: center;
      word-wrap: break-word;
      vertical-align: middle;
    }
    th {
      font-weight: bold;
    }
    thead {
      display: table-header-group;
    }
    tbody tr {
      page-break-inside: avoid;
    }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
      font-family: 'Times New Roman', serif;
      letter-spacing: 2px;
      display: inline-flex;
      padding-bottom: 5px;
    }
    .red-line {
      border-bottom: 4px solid #FF0000;
      color: #FF0000;
      text-shadow: 1px 1px 0 #fff, 2px 2px 0 #ccc;
      padding-right: 5px;
    }
    .black-line {
      border-bottom: 4px solid #000000;
      color: #000000;
      text-shadow: 1px 1px 0 #fff, 2px 2px 0 #ccc;
    }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr>
        <th colspan="13" style="text-align: left; border: none; padding-bottom: 10px;">
          <h1>
            <span class="red-line">${title.split(" ")[0]}</span>
            <span class="black-line">${title.split(" ").slice(1).join(" ")}</span>
          </h1>
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 8px;">
            <div style="display: flex; gap: 40px; align-items: baseline;">
              <div style="font-weight: bold; font-size: 10px;">UNIT ENTRY</div>
              <div style="font-weight: normal; font-size: 13px; margin-left: 20px; color: #333;">As of: ${monthLabel}</div>
            </div>
            <div style="font-weight: bold; font-size: 16px; color: #000;">
              Date Printed: <span style="font-weight: normal; font-size: 14px; margin-left: 8px;">${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} ${new Date().toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
            </div>
          </div>
        </th>
      </tr>
      <tr style="background: #fff345ff; color: #000;">
        <th style="font-size: 8px; width: 3%;">NO.</th>
        <th style="font-size: 8px; width: 13%;">UNIT</th>
        <th style="font-size: 8px; width: 7%;">PLATE</th>
        <th style="font-size: 8px; width: 5%;">COLOR</th>
        <th style="font-size: 8px; width: 16%;">OWNER</th>
        <th style="font-size: 6px; width: 8%;">CLAIM TYPE<br/>INSURANCE/PERSONAL</th>
        <th style="font-size: 8px; width: 10%;">JO/ ES/ PO #</th>
        <th style="font-size: 8px; width: 6%;">MOD</th>
        <th style="font-size: 8px; width: 6%;">STATUS</th>
        <th style="font-size: 8px; width: 7%;">${dateColumnLabel}</th>
        <th style="font-size: 8px; width: 7%;">TARGET DATE</th>
        <th style="font-size: 8px; width: 4%;">AGE (D)</th>
        <th style="font-size: 8px; width: 4%;">AGE (M)</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;
}

export async function generateJobOrderPDF(appointment: TrackingAppointment, reportTitle?: string): Promise<string> {
  const displayTitle = reportTitle || "JOB ORDER"
  const isReleased = appointment.isArchived
  let repairStatus = getRepairStatusLabel(isReleased ? "completed_ready" : appointment.repairStatus)

  if (repairStatus === "Not Started" && (appointment.syncedAt || appointment.synced_at)) {
    repairStatus = "On-Going Repair"
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : PRODUCTION_URL

  const categoryOrder = ["Parts", "Tinsmith/Alignment", "Mechanical Works", "Electrical", "Aircon", "Painting", "Detailing", "Glassworks", "Remove and Install", "Others"];

  const categorized = (appointment.costing?.items || []).reduce((acc, item) => {
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
  }, { "Parts": [] } as Record<string, any[]>)

  const activeCategories = Object.keys(categorized).filter(cat => cat === "Parts" || categorized[cat].length > 0);
  activeCategories.sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  const today = new Date();
  const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;

  const targetDateRaw = appointment.costing?.jobOrderHistory?.slice(-1)[0]?.targetDate;
  let targetDateFormatted = "_______";
  if (targetDateRaw) {
    const parts = targetDateRaw.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const MONTH_NAMES = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      if (monthIdx >= 0 && monthIdx < 12) {
        targetDateFormatted = `${MONTH_NAMES[monthIdx]} ${day}, ${year}`;
      }
    }
  }

  const parseScopeText = (text: string) => {
    if (!text) return `<div style="color: #999; font-style: italic; margin-top: 5px;">No scope of works specified.</div>`;
    const lines = text.split('\n');
    let html = '<div style="column-width: 150px; column-gap: 15px; column-fill: balance;">';
    let inList = false;
    let inSection = false;

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
        if (!inList) { 
          html += '<ul style="margin-top: 2px; padding-left: 18px; margin-bottom: 0;">'; 
          inList = true; 
        }
        const bulletText = trimmed.substring(1).trim();
        html += `<li style="margin-bottom: 2px;">${toTitleCase(bulletText)}</li>`;
      } else {
        // Close previous list if open
        if (inList) { 
          html += '</ul>'; 
          inList = false; 
        }
        // Close previous section if open
        if (inSection) {
          html += '</div>';
        }
        // Start new section
        const formattedCategory = trimmed.toUpperCase();
        html += `<div style="break-inside: avoid; margin-bottom: 8px;">
                   <div style="margin-bottom: 2px;"><strong style="color: #000; font-size: 10.5px;">${formattedCategory}</strong></div>`;
        inSection = true;
      }
    }
    if (inList) html += '</ul>';
    if (inSection) html += '</div>';
    html += '</div>';
    return html;
  };

  const parsePartsText = (text: string, partsItems: any[] = []) => {
    if (!text && partsItems.length === 0) return `<div style="display: flex; flex: 1; align-items: center; justify-content: center; min-height: 120px;">
         <div style="font-size: 22px; font-weight: 900; color: #bbb; text-transform: uppercase; letter-spacing: 2px; text-align: center; width: 100%;">NO PARTS<br/>WERE ADDED</div>
       </div>`;
    
    let html = '<div style="column-width: 150px; column-gap: 15px; column-fill: balance;"><ul style="margin-top: 2px; padding-left: 18px; margin-bottom: 0;">';
    
    if (partsItems.length > 0) {
      for (const item of partsItems) {
        if (!item.description) continue;
        const qtyStr = (item.quantity && item.quantity > 0) ? `${item.quantity}` : '';
        const unitStr = item.unit ? `${item.unit}` : '';
        const qtyUnit = (qtyStr || unitStr) ? ` ${qtyStr}${unitStr}`.toUpperCase() : '';
        html += `<li style="margin-bottom: 2px;">${toTitleCase(item.description)}<span style="font-weight: bold;">${qtyUnit}</span></li>`;
      }
    } else if (text) {
      const lines = text.split('\n');
      for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const content = (trimmed.startsWith('-') || trimmed.startsWith('•')) ? trimmed.substring(1).trim() : trimmed;
        html += `<li style="margin-bottom: 2px;">${toTitleCase(content)}</li>`;
      }
    }
    html += '</ul></div>';
    return html;
  };

  const scopeOfWorksHtml = parseScopeText(appointment.costing?.scopeOfWorks || appointment.scopeOfWorks || "");
  const partsHtml = parsePartsText(appointment.costing?.partsText || "", categorized["Parts"] || []);

  const insuranceRaw = appointment.insurance || '';
  const insuranceUpper = insuranceRaw.toUpperCase();
  const isNone = !insuranceRaw || insuranceUpper === 'N/A' || insuranceUpper === 'NONE' || insuranceUpper === 'BLANK';
  const hasPersonal = insuranceUpper.includes('PERSONAL');
  const hasCompany = insuranceUpper.includes('COMPANY');
  
  const isPersonal = isNone || hasPersonal;
  const isCompany = !isPersonal && hasCompany;
  const isInsuranceSelected = !isPersonal && !isCompany;
  const insuranceNameDisplay = isInsuranceSelected && insuranceUpper !== 'INSURANCE' ? insuranceRaw : '';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${displayTitle} - ${appointment.vehiclePlate}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 9.5px; 
      line-height: 1.3; 
      color: #000; 
      background: white; 
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { 
      size: 8.5in 13in; 
      margin: 0.1in; 
    }
    .container { width: 100%; margin: 0 auto; border: 2px solid #000; padding: 10px; position: relative; }
    
    .page-marker {
      text-align: center;
      font-size: 8px;
      font-weight: bold;
      color: #999;
      margin-top: 8px;
      border-top: 1px dashed #ccc;
      padding-top: 4px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .header { display: flex; justify-content: center; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 8px; gap: 20px; }
    .logo-container { width: 90px; }
    .logo-container img { width: 90px; height: auto; }
    .header-content { text-align: center; }
    .header h1 { color: #c00; font-size: 18px; font-weight: bold; margin-bottom: 1px; }
    .header p { font-size: 8px; line-height: 1.3; color: #333; }
    
    .title-banner { background: #800000 !important; color: #fff !important; text-align: center; padding: 8px; font-size: 20px; font-weight: 900; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 4px; border: 1px solid #000; }
    
    .meta-info { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .meta-box { border: 1px solid #000; padding: 6px; background: #f9f9f9 !important; }
    .meta-label { font-size: 7px; font-weight: bold; color: #666; text-transform: uppercase; margin-bottom: 1px; }
    .meta-value { font-size: 10px; font-weight: bold; color: #000; }
    
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; border: 1px solid #000; padding: 8px; }
    .info-item { display: flex; flex-direction: column; gap: 1px; }
    .info-label { font-size: 7px; font-weight: bold; color: #444; border-bottom: 1px solid #ddd; padding-bottom: 1px; }
    .info-value { font-size: 9px; font-weight: 600; padding-top: 1px; }
    
    .section-header { background: #eee !important; color: #000 !important; padding: 4px 8px; font-weight: bold; border: 1px solid #000; border-bottom: none; font-size: 9px; text-transform: uppercase; display: flex; justify-content: space-between; }
    
    .job-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1px solid #000; }
    .job-table th, .job-table td { border: 1px solid #000; padding: 4px 8px; text-align: left; }
    .job-table th { background: #f4f4f4 !important; font-size: 8px; text-transform: uppercase; }
    .job-table td { font-size: 9px; vertical-align: top; }
    .category-row { background: #fdfdfd !important; font-weight: bold; font-size: 9px; color: #c00; }
    
    .qr-and-status { display: flex; gap: 20px; align-items: flex-end; margin-bottom: 20px; }
    .qr-container { text-align: center; border: 1px dashed #000; padding: 5px; }
    .qr-container p { font-size: 7px; margin-top: 4px; font-weight: bold; }
    .delivery-info { flex: 1; border: 2px solid #c00; padding: 10px; color: #c00; font-weight: bold; text-align: center; font-size: 12px; }
    
    .footer-sections { display: grid; grid-template-columns: 1.5fr 1fr; gap: 15px; margin-top: 10px; }
    .terms-section { font-size: 7.5px; line-height: 1.3; }
    .terms-section h4 { text-decoration: underline; margin-bottom: 3px; font-size: 8px; }
    .terms-section ol { padding-left: 12px; }
    
    .sig-section { display: flex; flex-direction: column; justify-content: flex-end; align-items: center; margin-top: 10px; }
    .sig-box { width: 100%; border-top: 1px solid #000; padding-top: 4px; text-align: center; }
    .sig-title { font-size: 7.5px; color: #444; text-transform: uppercase; }
    .sig-name { font-weight: bold; font-size: 9px; margin-bottom: 1px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-container">
        <img src="/autoworxlogo.png" alt="Logo" />
      </div>
      <div class="header-content">
        <h1>Autoworx Repair and General Mdse.</h1>
        <p>Zone 7 Sepulvida Street, Kauswagan Highway, CDO City</p>
        <p>Telefax: (088) 880-4825 | Mobile: 09363549603</p>
        <p>Email: autoworxcagayan2025@gmail.com</p>
      </div>
    </div>
    
    <div class="title-banner">${displayTitle}</div>
    
    <div class="meta-info">
      <div class="meta-box">
        <p class="meta-label">JO Number</p>
        <p class="meta-value">${appointment.estimateNumber || "_______"}</p>
      </div>
      <div class="meta-box">
        <p class="meta-label">Date Issued</p>
        <p class="meta-value">${formattedDate}</p>
      </div>
      <div class="meta-box">
        <p class="meta-label">Assigned Technician:</p>
        <p class="meta-value">${appointment.assignedTechnician || appointment.costing?.jobOrderHistory?.slice(-1)[0]?.assignee || "_______"}</p>
      </div>
    </div>

    <div class="section-header">Customer & Service Overview</div>
    <div class="info-grid" style="grid-template-columns: 1fr 1fr; padding: 8px; gap: 12px;">
      <div class="info-item" style="grid-column: span 2; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 5px;">
        <div style="display: table; width: 100%; table-layout: fixed;">
          <div style="display: table-cell; vertical-align: bottom; width: 70%;">
            <p class="info-label" style="margin: 0 0 2px 0;">VEHICLE UNIT (PRIMARY IDENTIFIER)</p>
            <p class="info-value" style="font-size: 22px; font-weight: 900; color: #000; text-transform: uppercase; margin: 0;">
              ${appointment.vehicleYear} ${appointment.vehicleMake} ${appointment.vehicleModel}
            </p>
            <p style="font-size: 14px; font-weight: bold; color: #c00; margin: 5px 0 0 0;">PLATE: ${appointment.vehiclePlate}</p>
          </div>
          <div style="display: table-cell; vertical-align: top; width: 30%; text-align: right; padding-right: 10px; padding-top: 4px;">
            <p style="font-size: 9px; font-weight: bold; color: #555; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 3px 0;">TARGET DATE</p>
            <p style="font-size: 13px; font-weight: bold; color: #000; margin: 0; border-bottom: 1.5px solid #000; padding-bottom: 3px; display: inline-block; min-width: 120px; text-align: center;">
              ${targetDateFormatted === "_______" ? "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" : targetDateFormatted}
            </p>
          </div>
        </div>
      </div>

      <div class="info-item">
        <p class="info-label">CLIENT NAME</p>
        <p class="info-value" style="font-size: 14px;">${appointment.name}</p>
      </div>
      <div class="info-item">
        <p class="info-label">SERVICE TYPE</p>
        <p class="info-value" style="font-size: 14px; text-transform: uppercase; color: #c00;">${appointment.service}</p>
      </div>
      
      <div class="info-item" style="grid-column: span 2; margin-top: 5px;">
        <p class="info-label">CLAIM TYPE</p>
        <div style="display: flex; gap: 25px; margin-top: 8px; font-size: 11px; font-weight: bold; color: #000; padding-left: 5px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 14px; height: 14px; border: 1.5px solid #000; display: flex; align-items: center; justify-content: center; font-size: 12px;">${isPersonal ? '✓' : ''}</div>
            <span>PERSONAL</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 14px; height: 14px; border: 1.5px solid #000; display: flex; align-items: center; justify-content: center; font-size: 12px;">${isInsuranceSelected ? '✓' : ''}</div>
            <span>INSURANCE${insuranceNameDisplay ? `: <span style="color: #c00; text-transform: uppercase;">${insuranceNameDisplay}</span>` : ''}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 14px; height: 14px; border: 1.5px solid #000; display: flex; align-items: center; justify-content: center; font-size: 12px;">${isCompany ? '✓' : ''}</div>
            <span>COMPANY</span>
          </div>
        </div>
      </div>
    </div>
    <div class="section-header">
      <span>Job Details & Instructions</span>
    </div>

    <div style="display: flex; gap: 10px; margin-bottom: 15px; align-items: stretch; page-break-inside: auto;">
      <div style="flex: 1; padding: 10px; border: 1px solid #000; font-size: 9px; min-height: 150px; background: #fff; display: block;">
        <strong style="text-decoration: underline; color: #c00; font-size: 10.5px; display: block; margin-bottom: 8px;">SCOPE OF WORKS:</strong>
        <div>
          ${scopeOfWorksHtml}
        </div>
      </div>
      <div style="flex: 1; padding: 10px; border: 1px solid #000; font-size: 9px; min-height: 150px; background: #fff; display: flex; flex-direction: column;">
        <strong style="text-decoration: underline; color: #c00; font-size: 10.5px; display: block; margin-bottom: 8px;">PARTS:</strong>
        <div style="flex: 1; display: flex; flex-direction: column;">
          ${partsHtml}
        </div>
      </div>
    </div>



    <div class="footer-sections">
      <div class="terms-section">
        <h4>TERMS AND CONDITIONS:</h4>
        <ol>
          <li><strong>Authorization:</strong> The shop is authorized to perform the repairs described, including the use of necessary parts. Additional repairs exceeding (e.g., ₱500) must be authorized by the customer.</li>
          <li><strong>Payment & Storage:</strong> Payment is due upon completion. Vehicles not collected within <strong style="color: red;">15 days</strong> of notification of completion may be subject to a daily storage fee of <strong style="color: red;">₱250 to ₱500</strong>.</li>
          <li><strong>Lien Clause:</strong> The shop has a mechanic's lien on the vehicle to secure payment for repairs, parts, and storage fees.</li>
          <li><strong>Liability:</strong> The shop is not responsible for loss or damage to the vehicle or articles left inside due to fire, theft, or any other cause beyond its control.</li>
          <li><strong>Parts:</strong> Replaced parts will be discarded unless requested by the customer at the time of job approval.</li>
          <li><strong>Warranty:</strong> Warranties on parts are provided by the manufacturer. Labor is guaranteed for <strong style="color: red;">7 days</strong> from date of repair.</li>
          <li><strong>Hidden Defects:</strong> If, during disassembly, further damage is discovered, the customer will be notified for further authorization.</li>
        </ol>
      </div>
      <div class="sig-section">
        <div class="sig-box">
          <p class="sig-name">${appointment.costing?.serviceAdvisorName || 'RYAN QUINTOS'}</p>
          <p class="sig-title">Prepared By (Service Advisor)</p>
        </div>
      </div>
    </div>
    <div class="page-marker">
      --- END OF JOB ORDER (PAGE 1 OF 1) ---
    </div>
  </div>
  ${(appointment.service && appointment.service.toLowerCase().includes('painting')) || activeCategories.includes('Painting') ? `
  <div style="margin-top: 30px; padding: 0 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: bold; font-size: 14px; color: #000; display: flex; flex-direction: column; gap: 40px;">
    <div style="text-align: center;">
      Assignee:
    </div>
    <div style="display: flex; justify-content: space-between;">
      <div>Preparation:</div>
      <div style="margin-right: 32%;">Painting:</div>
    </div>
  </div>
  ` : ''}
</body>
</html>
`
  return htmlContent
}


