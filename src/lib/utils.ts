import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateDailyAmortization(
  amount: number,
  startDateStr: string | null | undefined,
  endDateStr: string | null | undefined,
  targetMonth: number, // 1-indexed
  targetYear: number
): number {
  if (!startDateStr) return 0;
  if (!endDateStr) return amount; // Not a distributed expense with an end date

  const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
  const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);

  const startDate = new Date(sYear, sMonth - 1, sDay);
  const endDate = new Date(eYear, eMonth - 1, eDay);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return amount;
  if (endDate < startDate) return amount;

  // Calculate total days (inclusive)
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Use UTC to avoid DST jumps
  const utcStart = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const utcEnd = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  
  const totalDays = Math.floor((utcEnd - utcStart) / MS_PER_DAY) + 1;
  if (totalDays <= 0) return amount;

  const costPerDay = amount / totalDays;

  const targetStart = new Date(targetYear, targetMonth - 1, 1);
  const targetEnd = new Date(targetYear, targetMonth, 0);

  const utcTargetStart = Date.UTC(targetStart.getFullYear(), targetStart.getMonth(), targetStart.getDate());
  const utcTargetEnd = Date.UTC(targetEnd.getFullYear(), targetEnd.getMonth(), targetEnd.getDate());

  const overlapStart = Math.max(utcStart, utcTargetStart);
  const overlapEnd = Math.min(utcEnd, utcTargetEnd);

  if (overlapStart > overlapEnd) {
    return 0; // No overlap
  }

  const overlapDays = Math.floor((overlapEnd - overlapStart) / MS_PER_DAY) + 1;
  return costPerDay * overlapDays;
}
