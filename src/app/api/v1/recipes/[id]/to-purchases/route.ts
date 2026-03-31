import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const recipe = await prisma.recipe.findFirst({
    where: { id, familyId: auth.user.familyId },
    include: { ingredients: { orderBy: { sortOrder: 'asc' } } },
  })

  if (!recipe) {
    return NextResponse.json({ error: 'Рецепт не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  const body = await request.json()
  if (!body.purchaseListId) {
    return NextResponse.json({ error: 'purchaseListId обов\'язковий', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const existingCount = await prisma.purchase.count({ where: { listId: body.purchaseListId } })

  await prisma.purchase.createMany({
    data: recipe.ingredients.map((ing, i) => ({
      familyId: auth.user.familyId,
      listId: body.purchaseListId,
      name: ing.name,
      quantity: ing.quantity,
      sortOrder: existingCount + i,
    })),
  })

  return NextResponse.json({ addedCount: recipe.ingredients.length }, { status: 201 })
}
