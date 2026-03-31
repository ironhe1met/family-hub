import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'
import type { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const categoryId = searchParams.get('categoryId')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  const where: Prisma.BudgetTransactionWhereInput = { familyId: auth.user.familyId }
  if (type) where.type = type
  if (categoryId) where.categoryId = categoryId
  if (dateFrom || dateTo) {
    where.date = {}
    if (dateFrom) where.date.gte = new Date(dateFrom)
    if (dateTo) where.date.lte = new Date(dateTo)
  }

  const [transactions, total] = await Promise.all([
    prisma.budgetTransaction.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, icon: true } },
        user: { select: { id: true, firstName: true } },
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.budgetTransaction.count({ where }),
  ])

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      id: t.id, type: t.type, amount: Number(t.amount), currency: t.currency,
      description: t.description, exchangeId: t.exchangeId, category: t.category, user: t.user,
      date: t.date, createdAt: t.createdAt,
    })),
    total,
  })
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const body = await request.json()
  if (!body.type || !body.amount || !body.categoryId || !body.date) {
    return NextResponse.json({ error: 'Тип, сума, категорія та дата обов\'язкові', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const transaction = await prisma.budgetTransaction.create({
    data: {
      familyId: auth.user.familyId,
      userId: auth.user.userId,
      type: body.type,
      amount: body.amount,
      currency: body.currency || 'UAH',
      categoryId: body.categoryId,
      description: body.description || null,
      date: new Date(body.date),
    },
    include: {
      category: { select: { id: true, name: true, icon: true } },
      user: { select: { id: true, firstName: true } },
    },
  })

  return NextResponse.json({
    transaction: { ...transaction, amount: Number(transaction.amount) },
  }, { status: 201 })
}
