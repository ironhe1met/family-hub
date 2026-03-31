import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const recipe = await prisma.recipe.findFirst({
    where: { id, familyId: auth.user.familyId },
    include: {
      createdBy: { select: { id: true, firstName: true, avatarUrl: true } },
      ingredients: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!recipe) {
    return NextResponse.json({ error: 'Рецепт не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  return NextResponse.json({ recipe })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const existing = await prisma.recipe.findFirst({ where: { id, familyId: auth.user.familyId } })
  if (!existing) {
    return NextResponse.json({ error: 'Рецепт не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  const body = await request.json()
  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title.trim()
  if (body.description !== undefined) data.description = body.description
  if (body.instructions !== undefined) data.instructions = body.instructions

  // Replace ingredients if passed
  if (body.ingredients !== undefined) {
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } })
    if (body.ingredients.length > 0) {
      await prisma.recipeIngredient.createMany({
        data: body.ingredients.map((ing: { name: string; quantity?: string }, i: number) => ({
          recipeId: id,
          name: ing.name.trim(),
          quantity: ing.quantity || null,
          sortOrder: i,
        })),
      })
    }
  }

  const recipe = await prisma.recipe.update({
    where: { id },
    data,
    include: {
      createdBy: { select: { id: true, firstName: true, avatarUrl: true } },
      ingredients: { orderBy: { sortOrder: 'asc' } },
    },
  })

  return NextResponse.json({ recipe })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const existing = await prisma.recipe.findFirst({ where: { id, familyId: auth.user.familyId } })
  if (!existing) {
    return NextResponse.json({ error: 'Рецепт не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  await prisma.recipe.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
