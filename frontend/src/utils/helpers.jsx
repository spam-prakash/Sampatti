// Format date
export const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Validate email
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// Validate phone
export const isValidPhone = (phone) => {
  const regex = /^[6-9]\d{9}$/
  return regex.test(phone)
}

// Debounce function
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction (...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Format date to YYYY-MM-DD for input[type="date"]
export const formatDateToYYYYMMDD = (date) => {
  // Handle both Date objects and date strings
  const d = date instanceof Date ? date : new Date(date)

  // Check if date is valid
  if (isNaN(d.getTime())) {
    return ''
  }

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// Alternative: More robust version with timezone handling
export const formatDateToYYYYMMDD2 = (date) => {
  try {
    let d

    if (date instanceof Date) {
      d = date
    } else if (typeof date === 'string') {
      // Try to parse the date string
      d = new Date(date)

      // If parsing fails, try different formats
      if (isNaN(d.getTime())) {
        // Try to handle different date formats
        const dateParts = date.split(/[-/]/)
        if (dateParts.length === 3) {
          // Assume YYYY-MM-DD or DD-MM-YYYY
          if (dateParts[0].length === 4) {
            // YYYY-MM-DD
            d = new Date(date)
          } else {
            // DD-MM-YYYY
            d = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`)
          }
        }
      }
    } else {
      return ''
    }

    // Final validation
    if (isNaN(d.getTime())) {
      return ''
    }

    // Use UTC to avoid timezone issues
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return ''
  }
}

// Format date to local YYYY-MM-DD (respects local timezone)
export const formatDateToLocalYYYYMMDD = (date) => {
  try {
    const d = date instanceof Date ? date : new Date(date)

    if (isNaN(d.getTime())) {
      return ''
    }

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  } catch (error) {
    console.error('Error formatting date to local:', error)
    return ''
  }
}

// Get today's date in YYYY-MM-DD format
export const getTodayDate = () => {
  const today = new Date()
  return formatDateToYYYYMMDD(today)
}

// Get yesterday's date in YYYY-MM-DD format
export const getYesterdayDate = () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return formatDateToYYYYMMDD(yesterday)
}

// Add this function to get week number
export const getWeekNumber = (date) => {
  // Copy date so don't modify original
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  // Calculate full weeks to nearest Thursday
  const weekNumber = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return weekNumber
}

// Improved formatCurrency function
export const formatCurrency = (amount, currency = 'INR', compact = false) => {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0
  }

  if (compact && Math.abs(amount) >= 1000) {
    return `${currency}${(amount / 1000).toFixed(1)}k`
  }

  return `${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}
