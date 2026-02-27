import type { RepairStatus } from "./constants"

// Generate a unique tracking code for appointments
export function generateTrackingCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${timestamp}-${random}`
}

// Get status display info
export function getStatusInfo(status: "pending" | "contacted" | "completed" | "confirm") {
  const statusMap = {
    pending: {
      label: "Pending",
      description: "Your appointment request is being reviewed",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
    },
    contacted: {
      label: "Contacted",
      description: "We have contacted you about your appointment",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
    confirm: {
      label: "Confirmed",
      description: "Your appointment has been confirmed",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
    completed: {
      label: "Completed",
      description: "Your appointment has been completed",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
  }
  return statusMap[status]
}

// Get repair status display info
export function getRepairStatusInfo(status: RepairStatus | undefined) {
  const statusMap: Record<RepairStatus, {
    label: string
    description: string
    color: string
    bgColor: string
    borderColor: string
    step: number
  }> = {
    pending_inspection: {
      label: "Pending Inspection",
      description: "Your vehicle is waiting to be inspected by our technicians",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      step: 1,
    },
    under_diagnosis: {
      label: "Under Diagnosis",
      description: "Our technicians are diagnosing your vehicle's issues",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      step: 2,
    },
    waiting_for_client_approval: {
      label: "Waiting for Client Approval",
      description: "We are waiting for your approval to proceed with the repairs",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/30",
      step: 2,
    },
    waiting_for_insurance: {
      label: "Waiting for Insurance Approval",
      description: "We are waiting for your insurance provider to approve the repair quote",
      color: "text-blue-600",
      bgColor: "bg-blue-600/10",
      borderColor: "border-blue-600/30",
      step: 2,
    },
    insurance_approved: {
      label: "Approved by Insurance",
      description: "Insurance has approved the repairs. Starting work soon",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      step: 2,
    },
    repair_in_progress: {
      label: "Repair in Progress",
      description: "Your vehicle is currently being repaired",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      step: 3,
    },
    waiting_for_parts: {
      label: "Waiting for Parts",
      description: "We are waiting for parts to arrive for your vehicle",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      step: 3,
    },
    testing_quality_check: {
      label: "Testing / Quality Check",
      description: "Your vehicle is undergoing final testing and quality checks",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
      step: 4,
    },
    completed_ready: {
      label: "Completed / Ready for Pickup",
      description: "Your vehicle is ready! You can pick it up at our shop",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      step: 5,
    },
    confirm: {
      label: "Confirmed",
      description: "Your Rent A Car appointment has been confirmed",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      step: 1,
    },
  }

  if (!status) {
    return {
      label: "Not Started",
      description: "Repair status not yet assigned",
      color: "text-muted-foreground",
      bgColor: "bg-muted/10",
      borderColor: "border-muted/30",
      step: 0,
    }
  }

  return statusMap[status]
}

// Format date for display
export function formatAppointmentDate(dateString: string | undefined): string {
  if (!dateString) return "Not specified"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Format timestamp for status updates
export function formatStatusTimestamp(dateString: string | undefined): string {
  if (!dateString) return "Not available"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
