import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const planned = await prisma.budgetPlanned.findFirst({ where: { id, familyId: auth.user.familyId } })
  if (!planned) {
    return NextResponse.json({ error: 'Не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  if (!planned.categoryId) {
    return NextResponse.json({ error: 'Вкажіть категорію перед виконанням', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const body = await request.json()
  const actualAmount = body.actualAmount || Number(planned.amount)

  const transaction = await prisma.budgetTransaction.create({
    data: {
      familyId: auth.user.familyId, userId: auth.user.userId,
      type: 'expense', amount: actualAmount, currency: planned.currency,
      categoryId: planned.categoryId!,
      description: planned.title, date: new Date(),
    },
  })

  await prisma.budgetPlanned.update({
    where: { id },
    data: { isCompleted: true, transactionId: transaction.id },
  })

  return NextResponse.json({ transaction: { ...transaction, amount: Number(transaction.amount) } }, { status: 201 })
}
