
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from 'crypto-js';
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a SHA-1 hash for passwords
export function sha1(input: string): string {
  return crypto.SHA1(input).toString();
}

// Generate a unique API key
export function generateApiKey(): string {
  const timestamp = new Date().getTime().toString();
  const random = Math.random().toString();
  return crypto.SHA256(timestamp + random).toString().substring(0, 16);
}

// Generate a company ID based on company name
export function generateCompanyId(companyName: string, counter: number = 1): string {
  // Extract first 2 characters from company name, convert to uppercase
  const prefix = companyName.substring(0, 2).toUpperCase();
  // Pad counter to 5 digits (10001, 10002, etc.)
  const paddedCounter = counter.toString().padStart(5, '0');
  return `${prefix}${paddedCounter}`;
}

// Format date for display
export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  // Format: YYYY-MM-DD HH:MM
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
