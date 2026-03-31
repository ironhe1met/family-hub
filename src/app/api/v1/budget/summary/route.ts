import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function GET(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  let dateFrom: Date
  let dateTo: Date

  if (month) {
    dateFrom = new Date(`${month}-01`)
    dateTo = new Date(dateFrom)
    dateTo.setMonth(dateTo.getMonth() + 1)
  } else if (year) {
    dateFrom = new Date(`${year}-01-01`)
    dateTo = new Date(`${parseInt(year) + 1}-01-01`)
  } else {
    const now = new Date()
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
    dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }

  // Month transactions
  const transactions = await prisma.budgetTransaction.findMany({
    where: { familyId: auth.user.familyId, date: { gte: dateFrom, lt: dateTo } },
    include: { category: { select: { id: true, name: true, type: true } } },
  })

  // All-time transactions for total balance (includes exchanges)
  const allTransactions = await prisma.budgetTransaction.findMany({
    where: { familyId: auth.user.familyId },
    select: { type: true, amount: true, currency: true },
  })

  // Group month by currency (exclude exchanges — they don't count as income/expense)
  const byCurrency = new Map<string, { income: number; expense: number }>()
  for (const t of transactions) {
    if (t.exchangeId) continue // skip exchange transactions
    const cur = t.currency
    if (!byCurrency.has(cur)) byCurrency.set(cur, { income: 0, expense: 0 })
    const entry = byCurrency.get(cur)!
    if (t.type === 'income') entry.income += Number(t.amount)
    else entry.expense += Number(t.amount)
  }

  // Total balance by currency (all time)
  const totalByCurrency = new Map<string, number>()
  for (const t of allTransactions) {
    const cur = t.currency
    const prev = totalByCurrency.get(cur) || 0
    totalByCurrency.set(cur, prev + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)))
  }

  // Category breakdown (per currency, exclude exchanges)
  const byCategoryMap = new Map<string, { categoryId: string; categoryName: string; type: string; currency: string; total: number }>()
  for (const t of transactions) {
    if (t.exchangeId) continue
    const key = `${t.categoryId}_${t.currency}`
    const existing = byCategoryMap.get(key)
    if (existing) {
      existing.total += Number(t.amount)
    } else {
      byCategoryMap.set(key, { categoryId: t.categoryId, categoryName: t.category.name, type: t.type, currency: t.currency, total: Number(t.amount) })
    }
  }

  return NextResponse.json({
    period: month || `${dateFrom.getFullYear()}`,
    // Month summary per currency
    monthByCurrency: Array.from(byCurrency.entries()).map(([currency, { income, expense }]) => ({
      currency, income, expense, balance: income - expense,
    })),
    // Total balance per currency (all time)
    totalByCurrency: Array.from(totalByCurrency.entries()).map(([currency, balance]) => ({ currency, balance })),
    // Category breakdown
    byCategory: Array.from(byCategoryMap.values()).sort((a, b) => b.total - a.total),
  })
}
