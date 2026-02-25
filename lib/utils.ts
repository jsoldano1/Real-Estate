export const currency = (value: number | string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));

export function toDate(value: FormDataEntryValue | null) {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.valueOf()) ? null : d;
}
