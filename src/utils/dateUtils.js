export const formatDateTimeForInput = (dateTimeString) => {
  if (!dateTimeString) return '';
  
  const date = new Date(dateTimeString);
  
  // Handle invalid dates
  if (isNaN(date.getTime())) return '';
  
  // Format as YYYY-MM-DDTHH:MM (format expected by datetime-local inputs)
  const pad = (num) => num.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};