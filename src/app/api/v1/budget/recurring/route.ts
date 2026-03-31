import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const recurring = await prisma.budgetRecurring.findMany({
    where: { familyId: auth.user.familyId },
    include: { category: { select: { id: true, name: true, icon: true } } },
    orderBy: { nextDate: 'asc' },
  })

  return NextResponse.json({
    recurring: recurring.map((r) => ({
      id: r.id, title: r.title, amount: Number(r.amount), currency: r.currency,
      period: r.period, nextDate: r.nextDate, isActive: r.isActive, category: r.category,
    })),
  })
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const body = await request.json()

  if (!body.title?.trim() || !body.amount || !body.categoryId || !body.period || !body.nextDate) {
    return NextResponse.json({ error: 'Всі поля обов\'язкові', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const recurring = await prisma.budgetRecurring.create({
    data: {
      familyId: auth.user.familyId, categoryId: body.categoryId,
      title: body.title.trim(), amount: body.amount, currency: body.currency || 'UAH',
      period: body.period, nextDate: new Date(body.nextDate),
    },
    include: { category: { select: { id: true, name: true, icon: true } } },
  })

  return NextResponse.json({ recurring: { ...recurring, amount: Number(recurring.amount) } }, { status: 201 })
}
