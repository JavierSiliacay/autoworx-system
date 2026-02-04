/**
 * Format phone number to Philippine format
 * Accepts: 09XX-XXX-XXXX, 09XXXXXXXXX, +639XXXXXXXXX, or raw 09XXXXXXXXX
 * Returns: 09XX-XXX-XXXX format
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = value.replace(/[^\d+]/g, "")

  // Remove leading + if present
  if (cleaned.startsWith("+63")) {
    cleaned = "0" + cleaned.slice(3)
  }

  // Keep only first 11 digits (valid PH mobile number)
  cleaned = cleaned.slice(0, 11)

  // Ensure it starts with 09
  if (!cleaned.startsWith("09")) {
    cleaned = "09" + cleaned.slice(1)
  }

  // Format: 09XX-XXX-XXXX
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }

  return cleaned
}

/**
 * Validate if phone number is a valid Philippine number
 */
export function isValidPhoneNumber(value: string): boolean {
  const cleaned = value.replace(/[^\d]/g, "")
  return cleaned.length === 11 && cleaned.startsWith("09")
}
