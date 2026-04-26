export const dateUtils = {
  monthOrder: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  // Format date to YYYY-MM-DD
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Format date for display (e.g., "Monday, January 1, 2024")
  formatDateForDisplay(date: Date, bahasa: string): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString(bahasa, options);
  },

  // Format date for short display (e.g., "Jan 1, 2024")
  formatDateShort(date: Date, bahasa: string): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString(bahasa, options);
  },

  // Parse date string to Date object
  parseDate(dateString: string): Date {
    return new Date(dateString);
  },

  getMonthString(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  },

  addInterval(date: Date, interval: 'daily' | 'weekly' | 'monthly' | 'yearly'): Date {
    const newDate = new Date(date);
    switch (interval) {
      case 'daily':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'yearly':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    return newDate;
  }
};