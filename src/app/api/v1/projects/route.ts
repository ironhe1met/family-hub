import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function GET(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  const where: Record<string, unknown> = { familyId: auth.user.familyId }
  if (status) where.status = status
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        createdBy: { select: { id: true, firstName: true, avatarUrl: true } },
        items: { select: { status: true, estimatedCost: true, currency: true } },
        tasks: { select: { status: true } },
      },
    }),
    prisma.project.count({ where }),
  ])

  return NextResponse.json({
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      itemCount: p.items.length,
      itemDoneCount: p.items.filter((i) => i.status === 'done').length,
      taskCount: p.tasks.length,
      taskDoneCount: p.tasks.filter((t) => t.status === 'done').length,
      totalCost: p.items.reduce((sum, i) => sum + (i.estimatedCost ? Number(i.estimatedCost) : 0), 0),
      currency: p.items[0]?.currency || 'UAH',
      createdBy: p.createdBy,
      createdAt: p.createdAt,
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

  const project = await prisma.project.create({
    data: {
      familyId: auth.user.familyId,
      createdById: auth.user.userId,
      title: body.title.trim(),
      description: body.description || null,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, avatarUrl: true } },
      items: { orderBy: { sortOrder: 'asc' } },
    },
  })

  return NextResponse.json({ project }, { status: 201 })
}
