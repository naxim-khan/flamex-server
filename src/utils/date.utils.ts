export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export const parseDateRange = (start?: string, end?: string): DateRange => {
  const now = new Date();
  const defaultEnd = new Date(now);
  defaultEnd.setHours(23, 59, 59, 999);
  
  const defaultStart = new Date(now);
  defaultStart.setDate(defaultStart.getDate() - 30);
  defaultStart.setHours(0, 0, 0, 0);

  const startDate = start ? new Date(start) : defaultStart;
  const endDate = end ? new Date(end) : defaultEnd;

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date range');
  }

  const normalizedStart = new Date(startDate);
  normalizedStart.setHours(0, 0, 0, 0);
  
  const normalizedEnd = new Date(endDate);
  normalizedEnd.setHours(23, 59, 59, 999);

  return { startDate: normalizedStart, endDate: normalizedEnd };
};

export const getTodayRange = (): DateRange => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
};

export const getYesterdayRange = (): DateRange => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const startDate = new Date(yesterday);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(yesterday);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
};

export const getThisWeekRange = (): DateRange => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - dayOfWeek);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
};

export const getThisMonthRange = (): DateRange => {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
};