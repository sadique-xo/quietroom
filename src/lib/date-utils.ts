/**
 * Format date consistently without timezone issues
 * This ensures dates are always in local timezone (YYYY-MM-DD format)
 */
export const formatDateForStorage = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date string in YYYY-MM-DD format (local timezone)
 */
export const getTodayDateString = (): string => {
  return formatDateForStorage(new Date());
}; 