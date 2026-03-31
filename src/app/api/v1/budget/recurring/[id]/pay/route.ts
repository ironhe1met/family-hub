import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const recurring = await prisma.budgetRecurring.findFirst({ where: { id, familyId: auth.user.familyId } })
  if (!recurring) {
    return NextResponse.json({ error: 'Не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  // Create transaction
  const transaction = await prisma.budgetTransaction.create({
    data: {
      familyId: auth.user.familyId, userId: auth.user.userId,
      type: 'expense', amount: recurring.amount, currency: recurring.currency,
      categoryId: recurring.categoryId, description: recurring.title,
      date: recurring.nextDate,
    },
  })

  // Shift next date
  const next = new Date(recurring.nextDate)
  if (recurring.period === 'monthly') next.setMonth(next.getMonth() + 1)
  else if (recurring.period === 'quarterly') next.setMonth(next.getMonth() + 3)
  else if (recurring.period === 'yearly') next.setFullYear(next.getFullYear() + 1)

  await prisma.budgetRecurring.update({ where: { id }, data: { nextDate: next } })

  return NextResponse.json({ transaction: { ...transaction, amount: Number(transaction.amount) }, nextDate: next }, { status: 201 })
}
