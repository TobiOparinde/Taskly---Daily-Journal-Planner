import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';

export const toDateStr = (date: Date): string => format(date, 'yyyy-MM-dd');

export const getMonthDays = (year: number, month: number): Date[] => {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  return eachDayOfInterval({ start, end });
};

// Monday-first grid (Mon=0, Sun=6)
export const getStartPadding = (year: number, month: number): number => {
  const firstDay = getDay(startOfMonth(new Date(year, month)));
  return (firstDay + 6) % 7;
};
