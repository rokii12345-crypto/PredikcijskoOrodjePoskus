export function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function maxDate(dateStrings: string[]): string {
  if (dateStrings.length === 0) {
    throw new Error("maxDate requires at least one date.");
  }

  return dateStrings.sort((a, b) => a.localeCompare(b))[dateStrings.length - 1];
}

export function minDate(dateStrings: string[]): string {
  if (dateStrings.length === 0) {
    throw new Error("minDate requires at least one date.");
  }

  return dateStrings.sort((a, b) => a.localeCompare(b))[0];
}

export function toMonthKey(dateString: string): string {
  return dateString.slice(0, 7);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
