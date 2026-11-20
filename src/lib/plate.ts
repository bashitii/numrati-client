// Jordanian plate numbers look like XX-XXXXX:
// 1 or 2 digits (1 to 99, no leading zero), a dash, then 1 to 5 digits. e.g. 1-22222, 15-51552, 88-84
export const PLATE_CODE_PATTERN = /^[1-9]\d?-\d{1,5}$/

/**
 * Cleans what the user types into a plate number while they type:
 * only digits and one dash, at most 2 digits before the dash and 5 after,
 * and the dash is added by itself after 2 digits.
 */
export function formatPlateCode(raw: string) {
  const text = raw.replace(/[^\d-]/g, '')
  const dash = text.indexOf('-')

  if (dash === -1) {
    // No dash yet: after 2 digits the next digits go after an automatic dash
    if (text.length <= 2) return text
    return `${text.slice(0, 2)}-${text.slice(2, 7)}`
  }

  const before = text.slice(0, dash).slice(0, 2)
  const after = text.slice(dash + 1).replace(/-/g, '').slice(0, 5)
  return `${before}-${after}`
}
