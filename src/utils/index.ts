import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Combines multiple class names into a single string
 * Uses clsx for conditional classes and tailwind-merge to handle Tailwind specificity
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string with a specified format
 */
export function formatDate(date: string | Date, formatString: string = 'PPP'): string {
  return format(new Date(date), formatString, { locale: fr });
}

/**
 * Format a date string to a relative time (e.g., "il y a 2 jours")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'il y a quelques secondes';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  } else if (diffInSeconds < 2419200) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  } else if (diffInSeconds < 29030400) {
    const months = Math.floor(diffInSeconds / 2419200);
    return `il y a ${months} mois`;
  } else {
    const years = Math.floor(diffInSeconds / 29030400);
    return `il y a ${years} an${years > 1 ? 's' : ''}`;
  }
}

/**
 * Truncate a string to a specified length and add ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
}

/**
 * Safely access nested object properties
 */
export function getNestedValue<T>(obj: Record<string, unknown>, path: string, defaultValue: T): T {
  const keys = path.split('.');
  return keys.reduce((acc, key) => (acc && typeof acc === 'object' && acc[key] !== undefined ? acc[key] : defaultValue), obj) as T;
}

/**
 * Filter an array of objects by a search term
 */
export function filterBySearchTerm<T extends Record<string, unknown>>( 
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
): T[] {
  if (!searchTerm) return items;
  
  const term = searchTerm.toLowerCase().trim();
  
  return items.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(term);
      }
      return false;
    });
  });
}

/**
 * Download content as a file
 */
export function downloadAsFile(content: string, filename: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}