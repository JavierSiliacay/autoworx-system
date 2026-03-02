/**
 * Format phone number to Philippine format or generic telephone
 * Mobile: 09XX-XXX-XXXX
 * Telephone: preserves formatting (allows numbers, parens, dash, space, plus)
 */
export function formatPhoneNumber(value: string): string {
  if (!value) return value

  const digitsOnly = value.replace(/[^\d+]/g, "")
  if (digitsOnly.startsWith("09") || digitsOnly.startsWith("+639") || digitsOnly.startsWith("639")) {
    let cleaned = digitsOnly
    if (cleaned.startsWith("+63")) cleaned = "0" + cleaned.slice(3)
    if (cleaned.startsWith("63")) cleaned = "0" + cleaned.slice(2)

    if (!cleaned.startsWith("09")) {
      cleaned = "09" + cleaned.slice(1)
    }

    cleaned = cleaned.slice(0, 11)

    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    return cleaned
  }

  // Treat as telephone number, keep basic valid characters
  return value.replace(/[^\d+()\s-]/g, "")
}

/**
 * Validate if phone number is a valid Philippine mobile or telephone number
 */
export function isValidPhoneNumber(value: string): boolean {
  if (!value || value.trim() === "") return true

  const digitsOnly = value.replace(/[^\d+]/g, "")
  if (digitsOnly.startsWith("09") || digitsOnly.startsWith("+639") || digitsOnly.startsWith("639")) {
    let cleaned = digitsOnly
    if (cleaned.startsWith("+63")) cleaned = "0" + cleaned.slice(3)
    if (cleaned.startsWith("63")) cleaned = "0" + cleaned.slice(2)
    return cleaned.length === 11 && cleaned.startsWith("09")
  }

  // For telephone numbers, just ensure there's a reasonable number of digits (e.g. at least 7)
  return digitsOnly.length >= 7
}
