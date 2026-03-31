import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function GET(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  const where: Record<string, unknown> = { familyId: auth.user.familyId }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        createdBy: { select: { id: true, firstName: true, avatarUrl: true } },
        _count: { select: { ingredients: true } },
      },
    }),
    prisma.recipe.count({ where }),
  ])

  return NextResponse.json({
    recipes: recipes.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      imageUrl: r.imageUrl,
      ingredientCount: r._count.ingredients,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
    })),
    total,
  })
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const body = await request.json()
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Назва обов\'язкова', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const recipe = await prisma.recipe.create({
    data: {
      familyId: auth.user.familyId,
      createdById: auth.user.userId,
      title: body.title.trim(),
      description: body.description || null,
      instructions: body.instructions || null,
      ingredients: body.ingredients?.length ? {
        create: body.ingredients.map((ing: { name: string; quantity?: string }, i: number) => ({
          name: ing.name.trim(),
          quantity: ing.quantity || null,
          sortOrder: i,
        })),
      } : undefined,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, avatarUrl: true } },
      ingredients: { orderBy: { sortOrder: 'asc' } },
    },
  })

  return NextResponse.json({ recipe }, { status: 201 })
}
