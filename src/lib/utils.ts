import { format, formatDuration, intervalToDuration, parseISO } from 'date-fns';

export function formatTime(isoString: string): string {
  return format(parseISO(isoString), 'HH:mm');
}

export function formatDate(isoString: string): string {
  return format(parseISO(isoString), 'dd MMM yyyy');
}

export function formatDateTime(isoString: string): string {
  return format(parseISO(isoString), 'dd MMM yyyy, HH:mm');
}

export function flightDuration(departs: string, arrives: string): string {
  const start = parseISO(departs);
  const end = parseISO(arrives);
  const duration = intervalToDuration({ start, end });
  const parts: string[] = [];
  if (duration.hours) parts.push(`${duration.hours}h`);
  if (duration.minutes) parts.push(`${duration.minutes}m`);
  return parts.join(' ') || '0m';
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function classLabel(cls: string): string {
  const map: Record<string, string> = {
    economy: 'Economy',
    business: 'Business',
    first: 'First Class',
  };
  return map[cls] ?? cls;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    confirmed: 'text-emerald-400 bg-emerald-400/10',
    rescheduled: 'text-blue-400 bg-blue-400/10',
    cancelled: 'text-red-400 bg-red-400/10',
    pending: 'text-yellow-400 bg-yellow-400/10',
    scheduled: 'text-emerald-400 bg-emerald-400/10',
    boarding: 'text-yellow-400 bg-yellow-400/10',
    departed: 'text-blue-400 bg-blue-400/10',
    arrived: 'text-slate-400 bg-slate-400/10',
    delayed: 'text-orange-400 bg-orange-400/10',
  };
  return map[status] ?? 'text-slate-400 bg-slate-400/10';
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const INDIAN_CITIES = [
  'Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Kochi',
  'Goa', 'Lucknow', 'Chandigarh', 'Bhubaneswar', 'Guwahati',
];

export const NATIONALITIES = [
  'Indian', 'American', 'British', 'Canadian', 'Australian',
  'German', 'French', 'Japanese', 'Chinese', 'Singaporean',
  'UAE', 'Saudi Arabian', 'South African', 'Brazilian', 'Other',
];
