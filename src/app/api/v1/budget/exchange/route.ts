import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const body = await request.json()

  const { fromCurrency, fromAmount, toCurrency, toAmount, date, description } = body

  if (!fromCurrency || !fromAmount || !toCurrency || !toAmount) {
    return NextResponse.json({ error: 'Всі поля обов\'язкові', code: 'VALIDATION_ERROR' }, { status: 400 })
  }
  if (fromCurrency === toCurrency) {
    return NextResponse.json({ error: 'Валюти мають бути різними', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  // Find or create exchange category
  let exchangeCategory = await prisma.budgetCategory.findFirst({
    where: { familyId: auth.user.familyId, type: 'exchange' },
  })
  if (!exchangeCategory) {
    exchangeCategory = await prisma.budgetCategory.create({
      data: { familyId: auth.user.familyId, name: 'Обмін валют', type: 'exchange', icon: 'arrow-left-right', color: '#8b5cf6', isDefault: true },
    })
  }

  const exchangeId = randomUUID()
  const txDate = date ? new Date(date) : new Date()
  const desc = description?.trim() || `${fromCurrency} → ${toCurrency}`

  // Create two linked transactions
  const [fromTx, toTx] = await prisma.$transaction([
    prisma.budgetTransaction.create({
      data: {
        familyId: auth.user.familyId, userId: auth.user.userId, categoryId: exchangeCategory.id,
        type: 'expense', amount: fromAmount, currency: fromCurrency,
        description: desc, exchangeId, date: txDate,
      },
    }),
    prisma.budgetTransaction.create({
      data: {
        familyId: auth.user.familyId, userId: auth.user.userId, categoryId: exchangeCategory.id,
        type: 'income', amount: toAmount, currency: toCurrency,
        description: desc, exchangeId, date: txDate,
      },
    }),
  ])

  return NextResponse.json({
    exchange: {
      exchangeId,
      from: { id: fromTx.id, currency: fromCurrency, amount: Number(fromTx.amount) },
      to: { id: toTx.id, currency: toCurrency, amount: Number(toTx.amount) },
      rate: Number((fromAmount / toAmount).toFixed(4)),
      date: txDate.toISOString(),
    },
  }, { status: 201 })
}
