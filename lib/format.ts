// Currency formatting utility
export function formatCurrency(amount: number): string {
  return `₱${Number.parseFloat(amount.toString()).toFixed(2)}`
}
