export function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
export function isThisMonth(iso: string) {
  const d = new Date(iso);
  const s = startOfMonth();
  return d >= s && d <= new Date();
}
