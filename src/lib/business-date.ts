export function businessToday(now = new Date()): string {
 const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
 const get = (type: string) => parts.find(part => part.type === type)!.value;
 return `${get("year")}-${get("month")}-${get("day")}`;
}
export function businessTime(now = new Date()): string {
 return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
}
