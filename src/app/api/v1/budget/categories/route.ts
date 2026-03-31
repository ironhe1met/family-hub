import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

const DEFAULT_CATEGORIES = [
  { name: 'Еда', type: 'expense', icon: 'utensils', color: '#4ade80', sortOrder: 0 },
  { name: 'Транспорт', type: 'expense', icon: 'car', color: '#60a5fa', sortOrder: 1 },
  { name: 'Житло / Комуналка', type: 'expense', icon: 'home', color: '#f97316', sortOrder: 2 },
  { name: "Здоров'я", type: 'expense', icon: 'heart-pulse', color: '#f43f5e', sortOrder: 3 },
  { name: 'Одяг', type: 'expense', icon: 'shirt', color: '#a78bfa', sortOrder: 4 },
  { name: 'Розваги', type: 'expense', icon: 'gamepad-2', color: '#facc15', sortOrder: 5 },
  { name: 'Підписки', type: 'expense', icon: 'credit-card', color: '#2dd4bf', sortOrder: 6 },
  { name: 'Діти', type: 'expense', icon: 'baby', color: '#fb923c', sortOrder: 7 },
  { name: 'Інше (витрати)', type: 'expense', icon: 'circle-dot', color: '#94a3b8', sortOrder: 8 },
  { name: 'Зарплата', type: 'income', icon: 'banknote', color: '#22c55e', sortOrder: 0 },
  { name: 'Фріланс', type: 'income', icon: 'laptop', color: '#3b82f6', sortOrder: 1 },
  { name: 'Інше (доходи)', type: 'income', icon: 'circle-dot', color: '#94a3b8', sortOrder: 2 },
  { name: 'Обмін валют', type: 'exchange', icon: 'arrow-left-right', color: '#8b5cf6', sortOrder: 0 },
]

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  let categories = await prisma.budgetCategory.findMany({
    where: { familyId: auth.user.familyId },
    orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  })

  // Seed defaults if empty
  if (categories.length === 0) {
    await prisma.budgetCategory.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ familyId: auth.user.familyId, ...c, isDefault: true })),
    })
    categories = await prisma.budgetCategory.findMany({
      where: { familyId: auth.user.familyId },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    })
  }

  return NextResponse.json({ categories })
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const body = await request.json()
  if (!body.name?.trim() || !body.type) {
    return NextResponse.json({ error: 'Назва та тип обов\'язкові', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const category = await prisma.budgetCategory.create({
    data: { familyId: auth.user.familyId, name: body.name.trim(), type: body.type, icon: body.icon || null, color: body.color || null },
  })

  return NextResponse.json({ category }, { status: 201 })
}
