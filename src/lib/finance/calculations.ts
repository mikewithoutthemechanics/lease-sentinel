export type FinanceInvoice = { id: string; amount: number; dueDate: string; status: string }
export type FinancePayment = { amount: number; invoiceId: string }

export function calculateInvoiceBalance(invoice: FinanceInvoice, payments: FinancePayment[]) {
  const paid = payments.filter(payment => payment.invoiceId === invoice.id).reduce((total, payment) => total + payment.amount, 0)
  return Math.max(0, invoice.amount - paid)
}

export function calculateOwnerStatement(income: number, expenses: number) {
  return { income, expenses, ownerAmount: Math.max(0, income - expenses), netOperatingIncome: income - expenses }
}

export function isOverdue(invoice: FinanceInvoice, today: string) {
  return invoice.status === 'unpaid' && invoice.dueDate < today
}

export function calculateCollectionRate(expected: number, collected: number) {
  return expected <= 0 ? 0 : Math.round(Math.min(100, (collected / expected) * 10000)) / 100
}
