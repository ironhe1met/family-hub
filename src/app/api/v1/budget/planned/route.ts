import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const planned = await prisma.budgetPlanned.findMany({
    where: { familyId: auth.user.familyId },
    include: { category: { select: { id: true, name: true, icon: true } } },
    orderBy: [{ isCompleted: 'asc' }, { targetDate: 'asc' }],
  })

  return NextResponse.json({
    planned: planned.map((p) => ({
      id: p.id, title: p.title, amount: Number(p.amount), currency: p.currency,
      targetDate: p.targetDate, isCompleted: p.isCompleted, category: p.category,
    })),
  })
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const body = await request.json()

  if (!body.title?.trim() || !body.amount) {
    return NextResponse.json({ error: 'Назва та сума обов\'язкові', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const planned = await prisma.budgetPlanned.create({
    data: {
      familyId: auth.user.familyId, title: body.title.trim(), amount: body.amount,
      currency: body.currency || 'UAH', categoryId: body.categoryId || null,
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
    },
    include: { category: { select: { id: true, name: true, icon: true } } },
  })

  return NextResponse.json({ planned: { ...planned, amount: Number(planned.amount) } }, { status: 201 })
}
