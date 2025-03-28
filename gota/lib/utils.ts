import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  
  // So sánh theo ngày
  if (date.getTime() === today.getTime()) {
    return 'Hôm nay';
  } else if (date.getTime() === tomorrow.getTime()) {
    return 'Ngày mai';
  }
  
  // Định dạng ngày tháng năm
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}
