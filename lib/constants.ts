export const VEHICLE_BRANDS = ["Toyota", "Mitsubishi", "Honda", "Nissan", "Isuzu", "Ford", "Chevrolet", "Hyundai", "Kia", "Mazda", "Other"]

export const SERVICES = [
  "Mechanical Services",
  "Preventive Maintenance",
  "Engine & Transmission",
  "Under Chassis",
  "AC & Electrical",
  "Body Repairs & Painting",
  "General Body Repairs & Fabrication",
  "General Overhauling",
  "Wash Over & Car Detailing",
  "24/7 Towing Service",
  "Other",
]

// Service Categories for appointment binding
export const SERVICE_CATEGORIES = [
  "Mechanical Services",
  "Preventive Maintenance",
]

// Repair Status Options
export const REPAIR_STATUS_OPTIONS = [
  { value: "pending_inspection", label: "Pending Inspection" },
  { value: "under_diagnosis", label: "Under Diagnosis" },
  { value: "waiting_for_insurance", label: "Waiting for Insurance Approval" },
  { value: "insurance_approved", label: "Approved by Insurance" },
  { value: "repair_in_progress", label: "Repair in Progress" },
  { value: "waiting_for_parts", label: "Waiting for Parts" },
  { value: "testing_quality_check", label: "Testing / Quality Check" },
  { value: "completed_ready", label: "Completed / Ready for Pickup" },
] as const

export type RepairStatus = typeof REPAIR_STATUS_OPTIONS[number]["value"]

// Parts being repaired
export const REPAIR_PARTS = [
  "Engine",
  "Brakes",
  "Suspension",
  "Electrical",
  "Transmission",
  "Cooling System",
  "Other",
] as const

// Contact for costing/estimation
export const COSTING_CONTACT = {
  name: "Ryan Christopher Quitos",
  phone: "0965-918-3394",
}

// Cost Item Types
export const COST_ITEM_TYPES = [
  { value: "service", label: "Service" },
  { value: "parts", label: "Parts" },
  { value: "labor", label: "Labor" },
  { value: "custom", label: "Custom" },
] as const

export const COST_ITEM_CATEGORIES = [
  "Tinsmith",
  "Alignment",
  "Glassworks",
  "Detailing",
  "Painting",
  "Others"
] as const

export type CostItemType = typeof COST_ITEM_TYPES[number]["value"]

export interface CostItem {
  id: string
  type: CostItemType
  category?: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface CostingData {
  items: CostItem[]
  subtotal: number
  discount: number
  discountType: "fixed" | "percentage"
  vatEnabled: boolean
  vatAmount: number
  total: number
  notes: string
  createdAt: string
  updatedAt: string
}
